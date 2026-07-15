// PreToolUse hook: real-time timestamp gate for the estimation table. The
// estimation guard checks presence; this one checks veracity — Started and
// Finished cells must be written as they happen, against the machine clock
// the agent cannot fake. Only newly written cells (empty → value) are
// validated; historical rows are never re-checked, so editing other parts of
// a file with a complete table never triggers this guard. Active only when
// the project's crew.json sets "metrics": true. Anything unexpected fails open.
const { readFileSync, existsSync } = require("node:fs");
const { configFor } = require("./lib/config");

const TOLERANCE_MS = 15 * 60 * 1000; // decided with Julio: 15 minutes
const ACTUAL_SLACK = 1.05; // Actual hours may be ≤ wall-clock × 1.05, never more

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
}

function resultingContent(input, path) {
  if (input.tool_name === "Write") return input.tool_input.content || "";
  if (!existsSync(path)) return "";
  const current = readFileSync(path, "utf8");
  const oldStr = input.tool_input.old_string || "";
  const newStr = input.tool_input.new_string || "";
  if (!oldStr || !current.includes(oldStr)) return "";
  return input.tool_input.replace_all
    ? current.split(oldStr).join(newStr)
    : current.replace(oldStr, newStr);
}

// Rows of the ## Estimation table keyed by milestone name.
// Cells: [Milestone, Est. hours, Started, Finished, Actual hours, Notes]
function estimationRows(content) {
  const map = new Map();
  const section = content.split(/^##\s+Estimation\s*$/im)[1];
  if (!section) return map;
  const body = section.split(/^##\s/m)[0];
  const rows = body
    .split("\n")
    .filter((l) => /^\s*\|/.test(l))
    .slice(2); // drop header + separator
  for (const row of rows) {
    const cells = row.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 5 || cells[0] === "") continue;
    if (cells.every((c) => c.replace(/[-\s]/g, "") === "")) continue;
    map.set(cells[0], { started: cells[2], finished: cells[3], actual: cells[4] });
  }
  return map;
}

// Standard format: YYYY-MM-DD HH:mm ±TZ (offset mandatory; Z accepted).
function parseStamp(cell) {
  const m = cell.match(
    /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s*(Z|[+-]\d{2}(?::?\d{2})?)$/,
  );
  if (!m) return null;
  let tz = m[3];
  if (/^[+-]\d{2}$/.test(tz)) tz += ":00";
  else if (/^[+-]\d{4}$/.test(tz)) tz = `${tz.slice(0, 3)}:${tz.slice(3)}`;
  const t = Date.parse(`${m[1]}T${m[2]}:00${tz}`);
  return Number.isNaN(t) ? null : t;
}

function nowStamp(now) {
  const pad = (n) => String(Math.abs(n)).padStart(2, "0");
  const d = new Date(now);
  const off = -d.getTimezoneOffset();
  const sign = off < 0 ? "-" : "+";
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())} ${sign}${pad(Math.trunc(off / 60))}:${pad(off % 60)}`
  );
}

function checkCell(milestone, column, cell, now) {
  const t = parseStamp(cell);
  if (t === null) {
    deny(
      `Estimation table, milestone "${milestone}": ${column} "${cell}" is not in the ` +
        `required format YYYY-MM-DD HH:mm ±TZ (timezone offset mandatory). ` +
        `The current time is ${nowStamp(now)} — timestamps are written in real time, as work happens.`,
    );
  }
  if (Math.abs(t - now) > TOLERANCE_MS) {
    deny(
      `Estimation table, milestone "${milestone}": ${column} "${cell}" is not the real ` +
        `current time. Timestamps are a real-time log, never reconstructed after the fact ` +
        `(crew standard). The current time is ${nowStamp(now)} — write that value. ` +
        `If the session was interrupted, use the real time of resumption and note the gap in Notes.`,
    );
  }
  return t;
}

try {
  const input = JSON.parse(readFileSync(0, "utf8").replace(/^﻿/, ""));
  if (input.tool_name !== "Edit" && input.tool_name !== "Write") process.exit(0);

  const path = (input.tool_input && input.tool_input.file_path) || "";
  if (!/docs[\\/](stories|requirements)[\\/].+\.md$/i.test(path)) process.exit(0);

  const cfg = configFor(path, input.cwd);
  if (!cfg || cfg.metrics !== true) process.exit(0); // no crew.json ⇒ v0.19.1 behavior

  const content = resultingContent(input, path);
  if (!content) process.exit(0);

  const before = estimationRows(existsSync(path) ? readFileSync(path, "utf8") : "");
  const after = estimationRows(content);
  const now = Date.now();

  for (const [milestone, row] of after) {
    const prev = before.get(milestone) || { started: "", finished: "", actual: "" };
    const newStarted = row.started !== "" && prev.started === "";
    const newFinished = row.finished !== "" && prev.finished === "";
    if (!newStarted && !newFinished) continue;

    if (newStarted) checkCell(milestone, "Started", row.started, now);
    if (newFinished) checkCell(milestone, "Finished", row.finished, now);

    const started = parseStamp(row.started);
    const finished = parseStamp(row.finished);
    if (started !== null && finished !== null && finished < started) {
      deny(
        `Estimation table, milestone "${milestone}": Finished (${row.finished}) is earlier ` +
          `than Started (${row.started}). Finished must be ≥ Started.`,
      );
    }
    if (newFinished && started !== null && finished !== null) {
      const actual = parseFloat(row.actual.replace(",", "."));
      const wallclock = (finished - started) / 3600000;
      if (!Number.isNaN(actual) && actual > wallclock * ACTUAL_SLACK + 0.01) {
        deny(
          `Estimation table, milestone "${milestone}": Actual hours (${row.actual}) exceeds ` +
            `the wall-clock span Started → Finished (${wallclock.toFixed(2)}h). Actual can be ` +
            `lower (pauses) but never higher than the elapsed time.`,
        );
      }
    }
  }
} catch {
  // Fail open: a guard bug must never block legitimate work.
}
process.exit(0);
