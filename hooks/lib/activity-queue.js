// Local queue of captured intervals (~/.crew/activity/queue.jsonl) and its
// flush to factory. The queue exists only while the person has a live token:
// it covers transient trouble (offline, 5xx, a factory not ready yet). The
// server is idempotent by interval id, so resending is always safe.
//
// errors.log and status.json never hold interval contents, response bodies
// or tokens: only time, HTTP code and counts.
const fs = require("node:fs");
const { join } = require("node:path");
const { randomUUID } = require("node:crypto");
const { crewHome, postJson, markRejected } = require("./factory");

const MAX_BATCH = 200;
// Factory parses JSON bodies with the default 100 kB limit.
const MAX_BATCH_BYTES = 90 * 1024;
const TIMEOUT_MS = 2500;
const MAX_SPAN_MS = 16 * 3600000;
// A little inside the server's 45 days, so a slow flush never crosses the edge.
const RETENTION_MS = 45 * 86400000 - 3600000;
const SKEW_MS = 5 * 60000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// The one 400 that is about the person, not the data: keep those intervals.
const NO_PERSON = /person/i;

function activityDir() {
  const dir = join(crewHome(), "activity");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function logError(line) {
  fs.appendFileSync(join(activityDir(), "errors.log"), `${new Date().toISOString()} ${line}\n`);
}

function writeStatus(problem, now) {
  const status = problem ? { problem, at: new Date(now).toISOString() } : {};
  fs.writeFileSync(join(activityDir(), "status.json"), JSON.stringify(status));
}

// Read-only: never creates ~/.crew for someone who has not connected.
function readStatus() {
  try { return JSON.parse(fs.readFileSync(join(crewHome(), "activity", "status.json"), "utf8")); } catch { return {}; }
}

function enqueue(intervals) {
  if (!intervals.length) return;
  const lines = intervals.map((i) => JSON.stringify(i)).join("\n") + "\n";
  fs.appendFileSync(join(activityDir(), "queue.jsonl"), lines);
}

// Everything captured locally goes: queue, flush leftovers and session state.
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

// Mirrors the server's validation: one bad interval rejects a whole batch.
function sendable(item, now) {
  const start = Date.parse(item.startedAt);
  const end = Date.parse(item.endedAt);
  return UUID.test(String(item.id)) && (item.kind === "human" || item.kind === "agent") &&
    end > start && end - start <= MAX_SPAN_MS && start >= now - RETENTION_MS && end <= now + SKEW_MS;
}

// Cut by count and by serialized size, whichever comes first.
function batches(intervals) {
  const out = [];
  let current = [];
  let bytes = 0;
  for (const item of intervals) {
    const size = Buffer.byteLength(JSON.stringify(item)) + 1;
    if (current.length && (current.length >= MAX_BATCH || bytes + size > MAX_BATCH_BYTES)) {
      out.push(current);
      current = [];
      bytes = 0;
    }
    current.push(item);
    bytes += size;
  }
  if (current.length) out.push(current);
  return out;
}

// One batch → { keep, stop, problem }. `stop` ends the flush (the rest stays
// queued); `rejected` means the token is dead and everything local goes.
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
    logError("HTTP 401: token revoked or expired, capture paused and local activity cleared");
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

async function flush(url, token, now) {
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
    clearActivity();
    writeStatus("rejected", now);
    return;
  }
  enqueue(result.keep);
  writeStatus(result.problem || null, now);
}

module.exports = {
  activityDir, enqueue, flush, sendable, batches, clearActivity, readStatus, MAX_BATCH, MAX_BATCH_BYTES,
};
