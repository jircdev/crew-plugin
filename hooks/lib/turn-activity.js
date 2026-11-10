// The stretches of an agent turn in which something actually happened, so a
// turn left waiting (a tool asking the person, a machine asleep) counts only
// its active parts. A silence longer than IDLE_MS between two records of the
// turn cuts it, the same cut the person's own time uses.
//
// What is read: only the `timestamp` of the user and assistant records of
// the turn, in the session transcript and in its subagents' transcripts
// (<session>/subagents/*.jsonl, where a delegated task writes while the main
// transcript stays quiet). Nothing else from a record is used or kept.
const fs = require("node:fs");
const { join } = require("node:path");
const { scanTail, parse } = require("./transcript-tail");
const { IDLE_MS } = require("./activity-rules");

const MAX_TAIL = 64 * 1024 * 1024;

// Timestamps of the records inside [from, to], read backwards until the
// first record older than `from`.
function pointsIn(path, from, to) {
  return scanTail(path, MAX_TAIL, (lines, whole) => {
    const points = [];
    for (let i = lines.length - 1; i >= 0; i--) {
      const rec = parse(lines[i]);
      if (!rec || (rec.type !== "user" && rec.type !== "assistant")) continue;
      const at = Date.parse(rec.timestamp);
      if (Number.isNaN(at)) continue;
      if (at < from) return points;
      if (at <= to) points.push(at);
    }
    return whole ? points : undefined;
  });
}

// Subagents that wrote during the turn; one unreadable file is skipped.
function subagentPoints(transcriptPath, from, to) {
  const dir = join(transcriptPath.slice(0, -".jsonl".length), "subagents");
  let names = [];
  try { names = fs.readdirSync(dir).filter((n) => n.endsWith(".jsonl")); } catch { return []; }
  const points = [];
  for (const name of names) {
    const file = join(dir, name);
    try { if (fs.statSync(file).mtimeMs < from) continue; } catch { continue; }
    points.push(...(pointsIn(file, from, to) || []));
  }
  return points;
}

// Sorted moments → stretches, cut where two moments are more than IDLE_MS apart.
function stretches(points) {
  const sorted = [...points].sort((a, b) => a - b);
  const out = [];
  let start = sorted[0];
  let last = sorted[0];
  for (const at of sorted.slice(1)) {
    if (at - last > IDLE_MS) {
      if (last > start) out.push({ start, end: last });
      start = at;
    }
    last = at;
  }
  if (last > start) out.push({ start, end: last });
  return out;
}

// The active stretches of the turn from `from` (the prompt) to `to` (its
// end), or null when the transcript cannot be read: the caller then keeps
// the turn whole.
function activeStretches(transcriptPath, from, to) {
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return null;
  const main = pointsIn(transcriptPath, from, to);
  if (main === null) return null;
  return stretches([from, to, ...main, ...subagentPoints(transcriptPath, from, to)]);
}

module.exports = { activeStretches, stretches };
