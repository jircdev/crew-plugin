// Shared code-quality ceiling logic: kind detection, line ceilings (with
// crew.json overrides) and pre-registered exemptions (docs/DEVIATIONS.md
// crew:exempt block). Consumed by the PreToolUse guard (agent writes) and by
// scripts/check-staged.js (authoritative pre-commit gate, agents and humans alike).
const { existsSync } = require("node:fs");
const { join, dirname } = require("node:path");
const { readBlock } = require("./deviation-lines");

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

function extensionOf(base) {
  const dot = base.lastIndexOf(".");
  return dot > 0 ? base.slice(dot + 1).toLowerCase() : "";
}

function kindOf(path) {
  const origBase = path.replace(/\\/g, "/").split("/").pop() || "";
  const base = origBase.toLowerCase();
  const ext = extensionOf(base);
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

// Returns {lines, kind, ceiling} when content exceeds its ceiling, else null.
function violation(path, content, overrides) {
  const ext = extensionOf((path.replace(/\\/g, "/").split("/").pop() || "").toLowerCase());
  if (!CODE_EXTENSIONS.has(ext)) return null;
  const kind = kindOf(path);
  const ceiling = Number((overrides || {})[kind]) || CEILINGS[kind];
  const lines = content.split("\n").length;
  return lines > ceiling ? { lines, kind, ceiling } : null;
}

// Minimal glob matcher: `**` crosses directories, `*` stays within a segment.
function globMatch(pattern, relPath) {
  const rx = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "\u0000")
    .replace(/\*/g, "[^/]*")
    .replace(/\u0000/g, ".*");
  return new RegExp(`^${rx}$`).test(relPath);
}

// Pre-registered exemptions: a machine-readable block in docs/DEVIATIONS.md:
//   <!-- crew:exempt
//   src/generated/**        # generated code · owner: ana · expires: 2027-03-31
//   -->
// An exemption past its `expires:` date no longer applies.
function exemptGlobs(root) {
  return readBlock(root, "exempt").filter((e) => !e.expired).map((e) => e.rule);
}

function isExempt(root, absPath) {
  const rel = absPath
    .replace(/\\/g, "/")
    .slice(root.replace(/\\/g, "/").length)
    .replace(/^\//, "");
  return exemptGlobs(root).some((g) => globMatch(g, rel));
}

// Project root: nearest ancestor holding crew.json, docs/DEVIATIONS.md or .git.
function findRoot(startDir) {
  let dir = startDir;
  for (let i = 0; i < 30 && dir; i++) {
    if (
      existsSync(join(dir, "crew.json")) ||
      existsSync(join(dir, "docs", "DEVIATIONS.md")) ||
      existsSync(join(dir, ".git"))
    ) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

module.exports = { CEILINGS, kindOf, violation, globMatch, isExempt, findRoot };
