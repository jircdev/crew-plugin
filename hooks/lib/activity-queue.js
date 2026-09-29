// Local queue of captured intervals (~/.crew/activity/queue.jsonl) and its
// flush to factory. The server is idempotent by interval id, so resending is
// always safe; losing an interval is the only failure worth designing out.
const fs = require("node:fs");
const { join } = require("node:path");
const { randomUUID } = require("node:crypto");
const { crewHome, postJson } = require("./factory");

const MAX_BATCH = 500;
const TIMEOUT_MS = 2500;
const MAX_SPAN_MS = 16 * 3600000;
// A little inside the server's 45 days, so a slow flush never crosses the edge.
const RETENTION_MS = 45 * 86400000 - 3600000;
const SKEW_MS = 5 * 60000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function activityDir() {
  const dir = join(crewHome(), "activity");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function logError(line) {
  fs.appendFileSync(join(activityDir(), "errors.log"), `${new Date().toISOString()} ${line}\n`);
}

function enqueue(intervals) {
  if (!intervals.length) return;
  const lines = intervals.map((i) => JSON.stringify(i)).join("\n") + "\n";
  fs.appendFileSync(join(activityDir(), "queue.jsonl"), lines);
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

// Returns the intervals that must stay queued.
async function sendBatches(url, token, intervals) {
  for (let i = 0; i < intervals.length; i += MAX_BATCH) {
    const batch = intervals.slice(i, i + MAX_BATCH);
    let res;
    try {
      res = await postJson(`${url}/activity/intervals`, token, { intervals: batch }, TIMEOUT_MS);
    } catch {
      return intervals.slice(i); // offline or slow: keep for the next flush
    }
    if (res.status >= 200 && res.status < 300) continue;
    if (res.status === 400 || res.status === 422) {
      logError(`dropped ${batch.length} intervals: HTTP ${res.status} ${res.body.slice(0, 200)}`);
      continue;
    }
    return intervals.slice(i); // auth or server trouble: the person can fix it
  }
  return [];
}

async function flush(url, token, now) {
  const dir = activityDir();
  const files = claimQueue(dir);
  if (!files.length) return;
  const all = readIntervals(files);
  const fresh = all.filter((item) => sendable(item, now));
  if (fresh.length < all.length) logError(`dropped ${all.length - fresh.length} stale or invalid intervals`);
  const keep = await sendBatches(url, token, fresh);
  enqueue(keep);
  for (const file of files) fs.rmSync(file, { force: true });
}

module.exports = { activityDir, enqueue, flush, sendable, MAX_BATCH };
