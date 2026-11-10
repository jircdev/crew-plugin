// What the server accepts and how much it takes per request, mirrored here
// so the queue never sends a batch factory would reject whole.
const MAX_BATCH = 200;
// Factory parses JSON bodies with the default 100 kB limit.
const MAX_BATCH_BYTES = 90 * 1024;
const MAX_SPAN_MS = 16 * 3600000;
// A little inside the server's 45 days, so a slow flush never crosses the edge.
const RETENTION_MS = 45 * 86400000 - 3600000;
const SKEW_MS = 5 * 60000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_RESPONSE_WORDS = 200000;

// The word count of an answer: absent, or an integer on an agent turn.
function wordsOk(item) {
  const words = item.responseWords;
  return words === undefined || words === null ||
    (item.kind === "agent" && Number.isInteger(words) && words >= 0 && words <= MAX_RESPONSE_WORDS);
}

// Mirrors the server's validation: one bad interval rejects a whole batch.
function sendable(item, now) {
  const start = Date.parse(item.startedAt);
  const end = Date.parse(item.endedAt);
  return UUID.test(String(item.id)) && (item.kind === "human" || item.kind === "agent") &&
    end > start && end - start <= MAX_SPAN_MS && start >= now - RETENTION_MS && end <= now + SKEW_MS && wordsOk(item);
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

module.exports = { sendable, batches, MAX_BATCH, MAX_BATCH_BYTES, RETENTION_MS };
