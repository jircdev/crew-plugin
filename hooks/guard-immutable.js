// PreToolUse hook: protect immutable artifacts (docs/work/ entries and closed
// work items). Pure path/content check on Edit|Write tool calls — no network,
// no LLM. Anything unexpected fails open (allow) so the guard never blocks work.
// Modes (crew.json): docs/work/ immutability holds in both modes (a cheap,
// always-valuable history); Closed-item immutability is team-only.
const { readFileSync, existsSync } = require("node:fs");
const { configFor } = require("./lib/config");

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

function isClosedWorkItem(path) {
  const inBacklog = /docs[\\/](stories|requirements)[\\/].+\.md$/i.test(path);
  if (!inBacklog || !existsSync(path)) return false;
  const header = readFileSync(path, "utf8").slice(0, 600);
  return /\*\*(Status|Estado):\*\*\s*(Closed|Cerrada)\b/i.test(header);
}

try {
  const input = JSON.parse(readFileSync(0, "utf8").replace(/^﻿/, ""));
  if (input.tool_name !== "Edit" && input.tool_name !== "Write") process.exit(0);

  const path = (input.tool_input && input.tool_input.file_path) || "";
  if (!path) process.exit(0);

  const isWorkEntry = /docs[\\/]work[\\/]\d{4}-\d{2}[\\/].+\.md$/i.test(path);
  if (isWorkEntry && existsSync(path)) {
    deny(
      "docs/work/ entries are immutable once created (crew standard). Write a new entry referencing this one instead.",
    );
  }

  const cfg = configFor(path, input.cwd);
  if (cfg && cfg.mode === "solo") process.exit(0); // Closed items editable in solo

  if (isClosedWorkItem(path)) {
    deny(
      "This work item is Closed and therefore immutable (crew standard). New work is a new story/requirement.",
    );
  }
} catch {
  // Fail open: a guard bug must never block legitimate work.
}
process.exit(0);
