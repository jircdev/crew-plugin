// PreToolUse hook: closure gates for a story/requirement. Two of them, each
// with its own opt-in, both pure content checks on Edit|Write — no network, no
// LLM, and anything unexpected fails open.
//
//   · estimation — no transition to Closed with an incomplete table, totals
//     included (crew standard: "closure with an incomplete estimation table is
//     invalid"). Always active in team; in solo only when "metrics": true.
//   · verification — no transition to Closed without stating how the work was
//     verified. Active only when crew.json declares `testing`, in either mode:
//     declaring what the project can verify is what makes the silence a defect.
const { readFileSync, existsSync } = require("node:fs");
const { configFor } = require("./lib/config");

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason + " [Why blocked & how to fix: enforcement.md in the crew plugin docs — docs/en/enforcement.md]",
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

// Data rows of the first table under `## <heading>`, as trimmed cell arrays.
function tableRows(content, heading) {
  const section = content.split(new RegExp(`^##\\s+(?:${heading})\\s*$`, "im"))[1];
  if (section === undefined) return null;
  return section
    .split(/^##\s/m)[0]
    .split("\n")
    .filter((l) => /^\s*\|/.test(l))
    .slice(2) // drop header + separator
    .filter((r) => r.replace(/[|\s-]/g, "") !== "")
    .map((r) => r.split("|").slice(1, -1).map((c) => c.trim()));
}

// The total row carries no timestamps by construction — it sums the milestones,
// it is not one. Recognized by its first cell, with or without markdown emphasis.
const TOTAL_ROW = /^\**\s*totals?\s*\**$/i;

function estimationIncomplete(content) {
  const rows = tableRows(content, "Estimation");
  if (rows === null) return "no Estimation section found";
  const milestones = rows.filter((cells) => !TOTAL_ROW.test(cells[0] || ""));
  const totals = rows.filter((cells) => TOTAL_ROW.test(cells[0] || ""));
  if (milestones.length === 0) return "the estimation table has no milestone rows";
  for (const cells of milestones) {
    // cells: [Milestone, Est. hours, Started, Finished, Actual hours, Notes]
    if (cells.slice(0, 5).some((c) => c === "")) {
      return `milestone "${cells[0] || "?"}" is missing Est. hours, Started, Finished, or Actual hours`;
    }
  }
  if (totals.length === 0) {
    return "the estimation table has no **Total** row (estimated and actual hours summed)";
  }
  const total = totals[0];
  if (!total[1] || !total[4]) {
    return "the **Total** row is missing estimated or actual hours";
  }
  return null;
}

// Only reachable when crew.json declares `testing`: the project said what it
// can verify, so a work item closing without saying how it was verified is
// incomplete by its own declaration. Undeclared ⇒ never checked.
function verificationIncomplete(content) {
  const rows = tableRows(content, "Verification|Verificación");
  if (rows === null) return "no Verification section found";
  if (rows.length === 0) return "the Verification table has no rows";
  for (const cells of rows) {
    // cells: [Scenario, Level, Harness, Artifact, Status]
    if (cells.slice(0, 5).some((c) => c === "")) {
      return `verification row "${cells[0] || "?"}" is missing level, harness, artifact or status`;
    }
  }
  return null;
}

try {
  const input = JSON.parse(readFileSync(0, "utf8").replace(/^\uFEFF/, ""));
  if (input.tool_name !== "Edit" && input.tool_name !== "Write") process.exit(0);

  const path = (input.tool_input && input.tool_input.file_path) || "";
  if (!/docs[\\/](stories|requirements)[\\/].+\.md$/i.test(path)) process.exit(0);

  const cfg = configFor(path, input.cwd);
  // Two independent opt-ins. The estimation gate is the metrics discipline
  // (solo skips it unless metrics are on); the verification gate is the
  // `testing` declaration, which stands on its own — a solo repo that declared
  // what it can verify still has to say how it verified.
  const gateEstimation = !(cfg && cfg.mode === "solo" && cfg.metrics !== true);
  const gateVerification = !!(cfg && cfg.testing);
  if (!gateEstimation && !gateVerification) process.exit(0);

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

  const problem = gateEstimation ? estimationIncomplete(content) : null;
  if (problem) {
    deny(
      `Cannot close this work item: ${problem}. Complete the estimation table ` +
        `(Milestone | Est. hours | Started | Finished | Actual hours, closed by a ` +
        `**Total** row) with real timezone-stamped timestamps before setting ` +
        `Status to Closed (crew standard).`,
    );
  }

  if (gateVerification) {
    const gap = verificationIncomplete(content);
    if (gap) {
      deny(
        `Cannot close this work item: ${gap}. This project declares \`testing\` in ` +
          `crew.json, so every work item states how it was verified — one row per ` +
          `scenario (Scenario | Level | Harness | Artifact | Status). "Not verified" ` +
          `is a valid status; leaving the question unanswered is not.`,
      );
    }
  }
} catch {
  // Fail open: a guard bug must never block legitimate work.
}
process.exit(0);
