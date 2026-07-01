// PreToolUse hook: code-quality file-size ceiling gate. On Edit|Write to a code
// file, deny when the resulting file would exceed the line ceiling for its kind
// (crew standard: standards/code-quality.md "File size ceilings"). Pure content
// check — no network, no LLM. Kind detection is best-effort from strong path/name
// signals; anything ambiguous or unexpected fails open (allow). Only the
// deterministic line ceilings are enforced here — function length, complexity and
// nesting need language parsing and stay with the code-quality doc and review,
// never faked in a hook.
const { readFileSync, existsSync } = require("node:fs");

const CODE_EXTENSIONS = new Set([
  "ts", "tsx", "js", "jsx", "mjs", "cjs", "mts", "cts",
  "rs", "py", "go", "java", "rb", "php", "cs", "kt", "swift", "vue", "svelte",
]);

// Mirrors standards/code-quality.md "File size ceilings". `module` is the default.
const CEILINGS = {
  test: 250,
  hook: 80,
  page: 200,
  service: 150,
  component: 150,
  rust: 300,
  module: 200,
};

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

function extensionOf(base) {
  const dot = base.lastIndexOf(".");
  return dot > 0 ? base.slice(dot + 1).toLowerCase() : "";
}

function kindOf(path, ext, origBase, base) {
  const p = path.replace(/\\/g, "/").toLowerCase();
  if (/\.(test|spec)\./.test(base) || /(^|\/)(__tests__|tests?)\//.test(p)) return "test";
  if (ext === "rs") return "rust";
  if ((ext === "ts" || ext === "tsx") && (/^use-[a-z]/.test(base) || /^use[A-Z]/.test(origBase))) {
    return "hook";
  }
  if (/(^|\/)(pages|routes)\//.test(p) || /\.(page|route)\./.test(base)) return "page";
  if (/(^|\/)(services|stores)\//.test(p) || /\.(service|store|slice)\./.test(base)) return "service";
  if ((ext === "tsx" || ext === "jsx") && /^[A-Z]/.test(origBase)) return "component";
  return "module";
}

try {
  const input = JSON.parse(readFileSync(0, "utf8").replace(/^﻿/, ""));
  if (input.tool_name !== "Edit" && input.tool_name !== "Write") process.exit(0);

  const path = (input.tool_input && input.tool_input.file_path) || "";
  if (!path) process.exit(0);

  const origBase = path.replace(/\\/g, "/").split("/").pop() || "";
  const base = origBase.toLowerCase();
  const ext = extensionOf(base);
  if (!CODE_EXTENSIONS.has(ext)) process.exit(0);

  const content = resultingContent(input, path);
  if (!content) process.exit(0);

  const lines = content.split("\n").length;
  const kind = kindOf(path, ext, origBase, base);
  const ceiling = CEILINGS[kind];
  if (lines > ceiling) {
    deny(
      `This file would be ${lines} lines; the crew ceiling for a ${kind} file is ${ceiling} ` +
        `(standards/code-quality.md). Split it — extract a symbol into its own file — instead of ` +
        `growing past the limit. If the project legitimately needs more, record it in docs/DEVIATIONS.md.`,
    );
  }
} catch {
  // Fail open: a guard bug must never block legitimate work.
}
process.exit(0);
