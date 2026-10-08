// PreToolUse hook on MCP and Artifact calls: notice when a plan or estimate is
// about to be published OUTSIDE the repo without pointing back to its work
// items. The file guards never see these writes — a docs connector, an
// artifact publish or a chat post is not an Edit/Write — and that blind spot is
// exactly how a plan once shipped in an undefined shape with no guard noticing.
//
// Notice only, never a deny: every connector shapes its payload differently,
// so a block here would misfire. Silent when the content names a work-item
// path (docs/requirements/…, docs/stories/…): a view that links its source is
// the standard. Anything unreadable or unexpected stays silent.
const { readFileSync, existsSync, statSync } = require("node:fs");

const MAX = 512 * 1024;
const HOURS_COLUMN = /\|[^|\n]*\b(est\.?\s*hours|estimated hours|horas|hours|hrs|estimaci[oó]n)\b[^|\n]*\|/i;
const WORK_ITEM = /^##\s+(Estimation|Verification|Verificaci[oó]n)\s*$|\*\*(Status|Estado):\*\*\s*(Draft|Ready|In progress|Borrador)/im;
const LINKS_SOURCE = /docs[\\/](requirements|stories)[\\/]/i;

function strings(value, out, depth = 0) {
  if (out.size > MAX || depth > 12) return out;
  if (typeof value === "string") out.text += value + "\n";
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out, depth + 1));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => strings(v, out, depth + 1));
  out.size = out.text.length;
  return out;
}

function fileText(input) {
  const files = [input.file_path, ...(Array.isArray(input.file_paths) ? input.file_paths : [])].filter(Boolean);
  let text = "";
  for (const f of files) {
    try {
      if (/\.(md|markdown|html?|txt)$/i.test(f) && existsSync(f) && statSync(f).size < MAX) text += readFileSync(f, "utf8");
    } catch {
      // unreadable attachment: judge on the payload alone
    }
  }
  return text;
}

try {
  const input = JSON.parse(readFileSync(0, "utf8").replace(/^\uFEFF/, ""));
  const name = String(input.tool_name || "");
  if (!/^mcp__/.test(name) && name !== "Artifact") process.exit(0);
  // Reads, listings and queries publish nothing.
  if (/(^|_)(read|get|list|query|search|fetch|find|guide|status|whoami)/i.test(name.split("__").pop())) process.exit(0);
  const tool = input.tool_input || {};
  if (name === "Artifact" && tool.action && tool.action !== "publish") process.exit(0);

  const text = strings(tool, { text: "", size: 0 }).text + fileText(tool);
  const looksLikePlan = HOURS_COLUMN.test(text) || WORK_ITEM.test(text);
  if (!looksLikePlan || LINKS_SOURCE.test(text)) process.exit(0);

  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse",
    additionalContext:
      "Crew notice: this looks like a plan or estimate being published outside the repo, and it does not " +
      "name the work items it summarizes. Crew standard: plans live as work items in the project's own " +
      "standard (docs/requirements/<plan>/ or docs/stories/<feature>/ — print it with scripts/conformance.js, " +
      "and load the `planning` skill); a published doc, artifact or message is a view that links to those " +
      "files. If the files do not exist yet, write them first.",
  } }));
} catch {
  // Fail open and silent.
}
process.exit(0);
