// PreToolUse hook: code-quality file-size ceiling gate on Edit|Write. Line
// ceilings are a cheap proxy for reasoning difficulty — precise complexity
// metrics belong to each stack's linter, never faked in a generic hook.
//
// Quality modes (crew.json "quality"):
//   advise  — scaffold default for new projects: the write proceeds and the
//             agent sees the notice; the hard stop is the pre-commit gate
//             (scripts/check-quality.sh), which covers agents and humans alike.
//   enforce — deny at write time. Also the behavior when there is NO
//             crew.json: exact v0.19.1 compatibility.
//   off     — this hook stays silent (the pre-commit gate is managed apart).
//
// Pre-registered exemptions: paths matching a glob in the crew:exempt block
// of docs/DEVIATIONS.md are allowed silently — the exception is recorded with
// its rationale BEFORE hitting the wall, not after. Anything unexpected fails open.
const { readFileSync, existsSync } = require("node:fs");
const { dirname } = require("node:path");
const { configFor } = require("./lib/config");
const { violation, isExempt, findRoot } = require("./lib/ceilings");

function respond(decision, reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: decision,
        permissionDecisionReason: reason + (decision === "deny" ? " [Why blocked & how to fix: enforcement.md in the crew plugin docs — docs/en/enforcement.md]" : ""),
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

try {
  const input = JSON.parse(readFileSync(0, "utf8").replace(/^﻿/, ""));
  if (input.tool_name !== "Edit" && input.tool_name !== "Write") process.exit(0);

  const path = (input.tool_input && input.tool_input.file_path) || "";
  if (!path) process.exit(0);

  const cfg = configFor(path, input.cwd);
  const quality = cfg ? cfg.quality : "enforce"; // no crew.json ⇒ v0.19.1
  if (quality === "off") process.exit(0);

  const content = resultingContent(input, path);
  if (!content) process.exit(0);

  const v = violation(path, content, cfg && cfg.ceilings);
  if (!v) process.exit(0);

  const root = findRoot(dirname(path));
  if (root && isExempt(root, path)) process.exit(0); // pre-registered exception

  const detail =
    `This file would be ${v.lines} lines; the crew ceiling for a ${v.kind} file is ${v.ceiling} ` +
    `(standards/code-quality.md). Split it — extract a symbol into its own file — instead of ` +
    `growing past the limit. If this path is legitimately large (generated code, flat data), ` +
    `pre-register it in the crew:exempt block of docs/DEVIATIONS.md with its rationale.`;

  if (quality === "enforce") respond("deny", detail);
  respond(
    "allow",
    `Code-quality notice (advisory, write allowed): ${detail} ` +
      `The pre-commit gate will reject the commit if it still exceeds the ceiling.`,
  );
} catch {
  // Fail open: a guard bug must never block legitimate work.
}
process.exit(0);
