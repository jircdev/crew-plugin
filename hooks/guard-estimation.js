// PreToolUse hook: estimation gate at closure. A story/requirement cannot
// transition to Closed with an incomplete estimation table (crew standard:
// "closure with an incomplete estimation table is invalid"). Pure content
// check on Edit|Write — no network, no LLM. Anything unexpected fails open.
// Modes (crew.json): always active in team; in solo only when "metrics": true
// (the estimation discipline is exactly what solo+metrics opts into).
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

function estimationIncomplete(content) {
  const section = content.split(/^##\s+Estimation\s*$/im)[1];
  if (!section) return "no Estimation section found";
  const body = section.split(/^##\s/m)[0];
  const rows = body
    .split("\n")
    .filter((l) => /^\s*\|/.test(l))
    .slice(2); // drop header + separator
  const dataRows = rows.filter((r) => r.replace(/[|\s-]/g, "") !== "");
  if (dataRows.length === 0) return "the estimation table has no milestone rows";
  for (const row of dataRows) {
    // cells: [Milestone, Est. hours, Started, Finished, Actual hours, Notes]
    const cells = row.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.slice(0, 5).some((c) => c === "")) {
      return `milestone "${cells[0] || "?"}" is missing Est. hours, Started, Finished, or Actual hours`;
    }
  }
  return null;
}

try {
  const input = JSON.parse(readFileSync(0, "utf8").replace(/^﻿/, ""));
  if (input.tool_name !== "Edit" && input.tool_name !== "Write") process.exit(0);

  const path = (input.tool_input && input.tool_input.file_path) || "";
  if (!/docs[\\/](stories|requirements)[\\/].+\.md$/i.test(path)) process.exit(0);

  const cfg = configFor(path, input.cwd);
  if (cfg && cfg.mode === "solo" && cfg.metrics !== true) process.exit(0);

  const content = resultingContent(input, path);
  if (!content) process.exit(0);

  const closing = /\*\*(Status|Estado):\*\*\s*(Closed|Cerrada)\b/i.test(content.slice(0, 600));
  if (!closing) process.exit(0);

  // Only gate the transition: if the file on disk is already Closed,
  // guard-immutable owns that case.
  if (existsSync(path)) {
    const header = readFileSync(path, "utf8").slice(0, 600);
    if (/\*\*(Status|Estado):\*\*\s*(Closed|Cerrada)\b/i.test(header)) process.exit(0);
  }

  const problem = estimationIncomplete(content);
  if (problem) {
    deny(
      `Cannot close this work item: ${problem}. Complete the estimation table ` +
        `(Milestone | Est. hours | Started | Finished | Actual hours) with real ` +
        `timezone-stamped timestamps before setting Status to Closed (crew standard).`,
    );
  }
} catch {
  // Fail open: a guard bug must never block legitimate work.
}
process.exit(0);
