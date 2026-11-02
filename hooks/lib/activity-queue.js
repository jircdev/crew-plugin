// Local queue of captured intervals (~/.crew/activity/queue.jsonl) and its
// flush to factory. It covers transient trouble (offline, 5xx, a factory not
// ready yet) and an expired token, whose time waits for the next login. A
// revoked token clears it. The server is idempotent by interval id, so
// resending is always safe.
//
// The folder is owner-only: it describes when a person works. errors.log and
// status.json never hold interval contents, response bodies or tokens: only
// time, HTTP code and counts.
const fs = require("node:fs");
const { join } = require("node:path");
const { randomUUID } = require("node:crypto");
const { crewHome, postJson, markRejected, restrictToOwner, tokenState } = require("./factory");
const { sendable, batches, MAX_BATCH, MAX_BATCH_BYTES, RETENTION_MS } = require("./activity-batches");

const TIMEOUT_MS = 2500;
// The one 400 that is about the person, not the data: keep those intervals.
const NO_PERSON = /person/i;

// Locked down on first use, including a folder an earlier version left open;
// the marker is written only once the lock succeeded, so a failure retries.
function activityDir() {
  const dir = join(crewHome(), "activity");
  const marker = join(dir, ".owner-only");
  if (fs.existsSync(marker)) return dir;
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  try {
    restrictToOwner(dir, true);
    fs.writeFileSync(marker, "");
  } catch { /* retried on the next use */ }
  return dir;
}

function logError(line) {
  fs.appendFileSync(join(activityDir(), "errors.log"), `${new Date().toISOString()} ${line}\n`, { mode: 0o600 });
}

// `since` survives flushes that meet the same problem, so the status says how
// long it has lasted; `at` is the latest attempt.
function writeStatus(problem, now) {
  const at = new Date(now).toISOString();
  const previous = readStatus();
  const since = previous.problem === problem ? previous.since || at : at;
  const status = problem ? { problem, since, at } : {};
  fs.writeFileSync(join(activityDir(), "status.json"), JSON.stringify(status), { mode: 0o600 });
}

// Read-only: never creates ~/.crew for someone who has not connected.
function readStatus() {
  try { return JSON.parse(fs.readFileSync(join(crewHome(), "activity", "status.json"), "utf8")); } catch { return {}; }
}

function enqueue(intervals) {
  if (!intervals.length) return;
  const lines = intervals.map((i) => JSON.stringify(i)).join("\n") + "\n";
  fs.appendFileSync(join(activityDir(), "queue.jsonl"), lines, { mode: 0o600 });
}

// Everything captured locally goes: queue, flush leftovers and session state.
// Used on a revocation or a logout, the person's own ways to pause capture.
function clearActivity() {
  const dir = activityDir();
  for (const name of fs.readdirSync(dir)) {
    if (/\.(jsonl|json)$/.test(name) && name !== "status.json") fs.rmSync(join(dir, name), { force: true });
  }
}

// Move the live queue aside atomically, so sessions appending meanwhile write
// a fresh file. Leftovers of an interrupted flush are picked up too.
function claimQueue(dir) {
  try {
    fs.renameSync(join(dir, "queue.jsonl"), join(dir, `flush-${randomUUID()}.jsonl`));
  } catch { /* nothing queued */ }
  return fs.readdirSync(dir).filter((f) => /^flush-.+\.jsonl$/.test(f)).map((f) => join(dir, f));
}

function readIntervals(files) {
  const byId = new Map();
  for (const file of files) {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      try {
        const item = JSON.parse(line);
        if (item && item.id) byId.set(item.id, item);
      } catch { /* torn line from a crash: skip */ }
    }
  }
  return [...byId.values()];
}

// One batch → { keep, stop, problem }. `stop` ends the flush (the rest stays
// queued); `rejected` means factory refused the token.
async function sendBatch(url, token, batch) {
  let res;
  try {
    res = await postJson(`${url}/activity/intervals`, token, { intervals: batch }, TIMEOUT_MS);
  } catch {
    logError(`unreachable: ${batch.length} intervals kept`);
    return { keep: batch, stop: true, problem: "unreachable" };
  }
  if (res.status >= 200 && res.status < 300) return { keep: [] };
  if (res.status === 401) {
    return { rejected: true };
  }
  if (res.status === 413 && batch.length > 1) {
    const half = Math.ceil(batch.length / 2);
    return sendAll(url, token, [batch.slice(0, half), batch.slice(half)]);
  }
  if (res.status === 400 && NO_PERSON.test(res.body)) {
    logError(`HTTP 400 no person record: ${batch.length} intervals kept`);
    return { keep: batch, stop: true, problem: "no-person" };
  }
  if (res.status === 400 || res.status === 413) {
    logError(`HTTP ${res.status}: dropped ${batch.length} intervals`);
    return { keep: [] };
  }
  logError(`HTTP ${res.status}: ${batch.length} intervals kept`);
  return { keep: batch, stop: true, problem: "unavailable" };
}

async function sendAll(url, token, groups) {
  const keep = [];
  for (let i = 0; i < groups.length; i++) {
    const result = await sendBatch(url, token, groups[i]);
    if (result.rejected) return result;
    keep.push(...result.keep);
    if (result.stop) return { keep: keep.concat(...groups.slice(i + 1)), stop: true, problem: result.problem };
  }
  return { keep };
}

// Read-only count of what waits to be sent.
function queuedCount() {
  const dir = join(crewHome(), "activity");
  if (!fs.existsSync(dir)) return 0;
  return readIntervals(fs.readdirSync(dir).filter((f) => f === "queue.jsonl" || /^flush-.+\.jsonl$/.test(f))
    .map((f) => join(dir, f))).length;
}

// While the token is expired nothing is sent, and factory's 45 days still
// bound what is kept.
function keepWithinRetention(now) {
  const files = claimQueue(activityDir());
  const all = readIntervals(files);
  const kept = all.filter((item) => Date.parse(item.startedAt) >= now - RETENTION_MS);
  for (const file of files) fs.rmSync(file, { force: true });
  enqueue(kept);
  if (kept.length < all.length) logError(`dropped ${all.length - kept.length} intervals older than 45 days`);
}

async function flush(url, token, now) {
  if (tokenState(token, now) === "expired") {
    keepWithinRetention(now);
    return writeStatus("expired", now);
  }
  const dir = activityDir();
  const files = claimQueue(dir);
  if (!files.length) return;
  const all = readIntervals(files);
  const fresh = all.filter((item) => sendable(item, now));
  if (fresh.length < all.length) logError(`dropped ${all.length - fresh.length} stale or invalid intervals`);
  const result = await sendAll(url, token, batches(fresh));
  for (const file of files) fs.rmSync(file, { force: true });
  if (result.rejected) {
    markRejected(token);
    if (tokenState(token, now) === "expired") {
      logError(`HTTP 401 after the token expired: ${fresh.length} intervals kept for the next login`);
      enqueue(fresh);
      return writeStatus("expired", now);
    }
    logError("HTTP 401: token revoked, capture paused and local activity cleared");
    clearActivity();
    return writeStatus("rejected", now);
  }
  enqueue(result.keep);
  writeStatus(result.problem || null, now);
}

module.exports = {
  activityDir, enqueue, flush, queuedCount, claimQueue, readIntervals, sendable, batches, clearActivity, readStatus, MAX_BATCH, MAX_BATCH_BYTES,
};
