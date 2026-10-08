// PreCompact hook: before the conversation is compacted, name the milestones
// that are still open (Started without Finished). A compaction is where the
// real-time discipline usually breaks — the summary forgets that a milestone
// was running, and the Finished time later gets reconstructed. The same list
// reaches the agent again through SessionStart after the compaction.
// Read-only, silent when nothing is open, never blocks.
const { readFileSync } = require("node:fs");
const { loadConfig } = require("./lib/config");
const { findRoot } = require("./lib/ceilings");
const { state } = require("./lib/work-state");

try {
  let event = {};
  try { event = JSON.parse(readFileSync(0, "utf8").replace(/^\uFEFF/, "")); } catch { /* manual run */ }
  const cwd = event.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const config = loadConfig(cwd);
  if (!(config && config.mode === "solo")) {
    const { open } = state(findRoot(cwd) || cwd);
    if (open.length) {
      const names = open.slice(0, 3).map((o) => `${o.file} → ${o.milestone}`).join("; ");
      process.stdout.write(JSON.stringify({ systemMessage:
        `crew: ${open.length} milestone(s) still open before compaction (${names}). ` +
        "Keep them in the summary and write each Finished with the real time when it closes." }));
    }
  }
} catch {
  // Never interfere with compaction.
}
process.exit(0);
