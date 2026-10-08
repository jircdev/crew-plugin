// Opt-in audit trail of guard decisions: `"audit": true` in crew.json, team
// mode only. One JSON line per event in .crew/audit.log — when, which guard,
// what it decided and which rule fired. Never the command, the file content or
// any matched value: a log of secrets would be the next thing to protect.
// Append-only; a write failure is ignored (an audit gap must not block work).
const { appendFileSync, mkdirSync } = require("node:fs");
const { join } = require("node:path");

function record(root, cfg, entry) {
  if (!root || !cfg || cfg.audit !== true || cfg.mode === "solo") return;
  try {
    mkdirSync(join(root, ".crew"), { recursive: true });
    const line = { at: new Date().toISOString(), guard: entry.guard, decision: entry.decision, rule: entry.rule };
    appendFileSync(join(root, ".crew", "audit.log"), JSON.stringify(line) + "\n");
  } catch {
    // Never let the trail break the guard.
  }
}

module.exports = { record };
