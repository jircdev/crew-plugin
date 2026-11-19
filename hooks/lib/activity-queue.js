// Local queue of captured intervals (~/.crew/activity/queue.jsonl) and its
// flush to factory. It covers transient trouble (offline, 5xx, a factory not
// ready yet) and a token factory no longer accepts, expired or rejected:
// that time waits for the next login of the same person on the same
// factory. Only a logout, or a login that factory confirms is someone else,
// deletes it. The server is idempotent by interval id, so resending is
// always safe.
//
// The folder is owner-only: it describes when a person works. errors.log and
// status.json never hold interval contents, response bodies or tokens: only
// time, HTTP code, counts and factory's fixed reason phrase on a 401.
const fs = require("node:fs");
const { join } = require("node:path");
const { randomUUID } = require("node:crypto");
const { crewHome, markRejected, clearRejected, restrictToOwner, tokenState, tokenMeta } = require("./factory");
const { sendable, batches, MAX_BATCH, MAX_BATCH_BYTES, RETENTION_MS } = require("./activity-batches");
const { sendAll } = require("./activity-send");

// A rejected token is tried again at most once an hour, so a 401 that was
// factory's mistake (a bad deploy, a cache) heals without a login.
const RETRY_REJECTED_MS = 3600000;

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
// long it has lasted; `at` is the latest attempt to send.
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
// Used on a logout, the person's own way to pause capture, and when factory
// confirms the queue belongs to someone else.
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

// Read-only: what waits to be sent, including time held aside at a login.
function waitingIntervals(withHeld) {
  const dir = join(crewHome(), "activity");
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f === "queue.jsonl" || /^flush-.+\.jsonl$/.test(f) ||
    (withHeld && f === "held.jsonl"));
  return readIntervals(files.map((f) => join(dir, f)));
}

// Read-only count of what the next flush would send (held time excluded).
const queuedCount = () => waitingIntervals(false).length;

// { count, ms }: ms is the clock time the waiting intervals cover, overlaps
// (the person and the agent at once) counted once.
function waitingWork() {
  const spans = waitingIntervals(true).map((i) => [Date.parse(i.startedAt), Date.parse(i.endedAt)])
    .filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0]);
  let ms = 0;
  let end = -Infinity;
  for (const [a, b] of spans) {
    if (b <= end) continue;
    ms += b - Math.max(a, end);
    end = b;
  }
  return { count: spans.length, ms };
}

// While nothing can be sent, factory's 45 days still bound what is kept.
function keepWithinRetention(now) {
  const files = claimQueue(activityDir());
  const all = readIntervals(files);
  const kept = all.filter((item) => Date.parse(item.startedAt) >= now - RETENTION_MS);
  for (const file of files) fs.rmSync(file, { force: true });
  enqueue(kept);
  if (kept.length < all.length) logError(`dropped ${all.length - kept.length} intervals older than 45 days`);
}

// Nothing goes out this time: an expired token, a rejected one not yet due
// for its hourly retry, or a factory other than the one that issued it.
function holdOff(token, url, now) {
  const state = tokenState(token, now);
  if (state === "expired") return "expired";
  const meta = tokenMeta(token);
  if (meta && meta.api && meta.api !== url) return "other-factory";
  const status = readStatus();
  if (state === "revoked" && now - (Date.parse(status.at) || 0) < RETRY_REJECTED_MS) return "rejected";
  return null;
}

async function flush(url, token, now) {
  const held = holdOff(token, url, now);
  if (held) {
    keepWithinRetention(now);
    if (held === "expired") writeStatus("expired", now);
    else if (held === "rejected" && readStatus().problem !== "rejected") writeStatus("rejected", now);
    return;
  }
  const files = claimQueue(activityDir());
  if (!files.length) return;
  const all = readIntervals(files);
  const fresh = all.filter((item) => sendable(item, now));
  if (fresh.length < all.length) logError(`dropped ${all.length - fresh.length} stale or invalid intervals`);
  const result = await sendAll(url, token, batches(fresh), logError);
  for (const file of files) fs.rmSync(file, { force: true });
  if (result.rejected) {
    markRejected(token);
    enqueue(fresh);
    const expired = tokenState(token, now) === "expired";
    logError(`HTTP 401${result.reason ? ` (${result.reason})` : ""}: ${fresh.length} intervals kept for the next login`);
    return writeStatus(expired ? "expired" : "rejected", now);
  }
  // Factory took the token after all: whatever refused it before is gone.
  clearRejected(token);
  fs.rmSync(join(activityDir(), "notice.json"), { force: true });
  enqueue(result.keep);
  writeStatus(result.problem || null, now);
}

module.exports = {
  activityDir, enqueue, flush, queuedCount, waitingWork, claimQueue, readIntervals, sendable, batches, clearActivity,
  readStatus, MAX_BATCH, MAX_BATCH_BYTES, RETRY_REJECTED_MS,
};
