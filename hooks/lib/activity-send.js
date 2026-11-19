// Sending queued intervals to factory, batch by batch. What each answer
// means for the queue lives here; activity-queue.js decides what to keep.
// Log lines carry counts, HTTP codes and, on a 401, factory's own reason
// phrase (a fixed sentence with no secret), never interval contents.
const { postJson } = require("./factory");

const TIMEOUT_MS = 2500;
// The one 400 that is about the person, not the data: keep those intervals.
const NO_PERSON = /person/i;
// factory's 401 reasons (its personal-token guard). Only these fixed
// sentences reach the log; any other text is left out.
const REASONS = new Set([
  "No personal access token provided",
  "Malformed personal access token",
  "Personal access token is unknown, revoked or expired",
  "The token owner is not active",
  "Personal access token was invalidated by a credential change",
  "Invalid personal access token",
]);

function reasonOf(body) {
  let message = "";
  try {
    const json = JSON.parse(body);
    message = (json.error && json.error.message) || json.message || "";
  } catch { /* not JSON */ }
  return REASONS.has(message) ? message : null;
}

// One batch → { keep, stop, problem } or { rejected, reason }. `stop` ends
// the flush (the rest stays queued).
async function sendBatch(url, token, batch, log) {
  let res;
  try {
    res = await postJson(`${url}/activity/intervals`, token, { intervals: batch }, TIMEOUT_MS);
  } catch {
    log(`unreachable: ${batch.length} intervals kept`);
    return { keep: batch, stop: true, problem: "unreachable" };
  }
  if (res.status >= 200 && res.status < 300) return { keep: [] };
  if (res.status === 401) return { rejected: true, reason: reasonOf(res.body) };
  if (res.status === 413 && batch.length > 1) {
    const half = Math.ceil(batch.length / 2);
    return sendAll(url, token, [batch.slice(0, half), batch.slice(half)], log);
  }
  if (res.status === 400 && NO_PERSON.test(res.body)) {
    log(`HTTP 400 no person record: ${batch.length} intervals kept`);
    return { keep: batch, stop: true, problem: "no-person" };
  }
  if (res.status === 400 || res.status === 413) {
    log(`HTTP ${res.status}: dropped ${batch.length} intervals`);
    return { keep: [] };
  }
  log(`HTTP ${res.status}: ${batch.length} intervals kept`);
  return { keep: batch, stop: true, problem: "unavailable" };
}

async function sendAll(url, token, groups, log) {
  const keep = [];
  for (let i = 0; i < groups.length; i++) {
    const result = await sendBatch(url, token, groups[i], log);
    if (result.rejected) return result;
    keep.push(...result.keep);
    if (result.stop) return { keep: keep.concat(...groups.slice(i + 1)), stop: true, problem: result.problem };
  }
  return { keep };
}

module.exports = { sendAll };
