// PreToolUse hook: a story or requirement keeps the shape of its EFFECTIVE
// standard at every write, not only at closure. The standard is resolved by
// lib/standards.js — the project's own template first, the crew template as
// fallback, declared deviations on top — so this guard never imposes a shape
// the project did not adopt.
//
// Only NEW nonconformance counts: an edit to an item that already deviated is
// judged on what the edit adds, so older items stay editable. Policy:
//   · no crew.json, quality advise, or solo mode → notice, write proceeds
//   · quality enforce (team)                     → deny
//   · quality off                                → silent
// Anything unexpected fails open.
const { readFileSync, existsSync } = require("node:fs");
const { configFor } = require("./lib/config");
const { resolve } = require("./lib/standards");
const { problems } = require("./lib/shape");

function emit(output) {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", ...output } }));
  process.exit(0);
}

function resultingContent(input, path, current) {
  if (input.tool_name === "Write") return input.tool_input.content || "";
  const oldStr = input.tool_input.old_string || "";
  const newStr = input.tool_input.new_string || "";
  if (!current || !oldStr || !current.includes(oldStr)) return "";
  return input.tool_input.replace_all ? current.split(oldStr).join(newStr) : current.replace(oldStr, newStr);
}

try {
  const input = JSON.parse(readFileSync(0, "utf8").replace(/^\uFEFF/, ""));
  if (input.tool_name !== "Edit" && input.tool_name !== "Write") process.exit(0);
  const path = (input.tool_input && input.tool_input.file_path) || "";
  const std = resolve(path, process.env.CLAUDE_PLUGIN_ROOT || process.env.PLUGIN_ROOT || undefined);
  if (!std) process.exit(0);

  const cfg = configFor(path, input.cwd);
  const quality = cfg ? cfg.quality : "advise";
  if (quality === "off") process.exit(0);

  const current = existsSync(path) ? readFileSync(path, "utf8") : "";
  const next = resultingContent(input, path, current);
  if (!next) process.exit(0);

  const before = new Set(current ? problems(current, std) : []);
  const added = problems(next, std).filter((p) => !before.has(p));
  if (!added.length) process.exit(0);

  const source = std.source === "project" ? `the project's template (${std.template})` : "the crew template (this project has none of its own)";
  const detail =
    `This ${std.kind} departs from its standard, ${source}: ${added.join("; ")}. ` +
    `Run scripts/conformance.js on the path to print the exact standard. If the project deliberately ` +
    `departs from it, declare the deviation with its rationale in the crew:standard block of docs/DEVIATIONS.md.`;

  if (quality === "enforce" && cfg && cfg.mode !== "solo") {
    emit({
      permissionDecision: "deny",
      permissionDecisionReason: detail + " [Why blocked & how to fix: docs/en/enforcement.md in the crew plugin]",
    });
  }
  emit({ additionalContext: `Work-item shape notice (write allowed): ${detail}` });
} catch {
  // Fail open: a guard bug must never block legitimate work.
}
process.exit(0);
