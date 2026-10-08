// Records catalog usage when THIS person opted in (`.crew/local.json` with
// {"telemetry": true}, or CREW_TELEMETRY=1) and crew.json does not forbid it.
//   · PostToolUse Agent/Task → the subagent type (a crew role)
//   · PostToolUse Skill      → the skill name
//   · UserPromptSubmit       → only a leading `/crew:<alias>` or `ALIAS:` token;
//                              the rest of the prompt is never read further
// Names outside the crew catalog are stored as "other" (lib/usage.js). Silent,
// never blocks, and does nothing without the opt-in.
const { readFileSync } = require("node:fs");
const { loadConfig } = require("./lib/config");
const { findRoot } = require("./lib/ceilings");
const { record, enabled } = require("./lib/usage");

try {
  const input = JSON.parse(readFileSync(0, "utf8").replace(/^\uFEFF/, ""));
  const cwd = input.cwd || process.cwd();
  const cfg = loadConfig(cwd);
  const root = findRoot(cwd) || cwd;
  if (enabled(root, cfg)) {
    const tool = String(input.tool_name || "");
    const ti = input.tool_input || {};
    if (/^(Agent|Task)$/.test(tool) && ti.subagent_type) record(root, "agent", String(ti.subagent_type).replace(/^crew:/, ""));
    else if (tool === "Skill" && ti.skill) record(root, "skill", String(ti.skill).replace(/^crew:/, ""));
    else if (input.hook_event_name === "UserPromptSubmit" && typeof input.prompt === "string") {
      const head = input.prompt.slice(0, 40);
      const slash = head.match(/^\s*\/crew:([a-z]+)/);
      const prefix = head.match(/^\s*([A-Z]{2,5}):/);
      if (slash) record(root, "command", slash[1]);
      else if (prefix) record(root, "command", prefix[1].toLowerCase());
    }
  }
} catch {
  // Usage is a convenience; never interfere.
}
process.exit(0);
