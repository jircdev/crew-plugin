#!/usr/bin/env node
// Authoritative code-quality gate at commit time (M3b). Checks the staged
// files against the same line ceilings the PreToolUse guard advises on —
// reusing hooks/lib/ceilings.js — and exits non-zero with a report when
// something exceeds. Covers agents and humans alike: the agent commits via
// Bash, git runs pre-commit, the agent reads the error and fixes.
// Respects crew.json ceiling overrides and crew:exempt globs in
// docs/DEVIATIONS.md. Also usable in CI: node check-staged.js [--all]
const { readFileSync, existsSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const { join } = require("node:path");
const { violation, isExempt } = require("../hooks/lib/ceilings");
const { loadConfig } = require("../hooks/lib/config");

// A whole-repo listing outgrows Node's 1 MB default buffer in large repos.
const MAX_BUFFER = 1024 * 1024 * 1024;

function git(args, cwd) {
  return spawnSync("git", args, { cwd, encoding: "utf8", maxBuffer: MAX_BUFFER, windowsHide: true });
}

const top = git(["rev-parse", "--show-toplevel"], process.cwd());
if (top.status !== 0) process.exit(0); // not a git repo — nothing to gate
const root = top.stdout.trim();

const all = process.argv.includes("--all");
const listArgs = all
  ? ["ls-files", "-z"]
  : ["diff", "--cached", "--name-only", "-z", "--diff-filter=ACMR"];
const listing = git(listArgs, root);
// A listing that failed is never an empty pass: zero files checked is not a verdict.
if (listing.error || listing.status !== 0) {
  const why = listing.error ? listing.error.message : (listing.stderr || "").trim() || `exit ${listing.status}`;
  console.error(`crew code-quality gate: could not list the files to check (git ${listArgs.join(" ")}): ${why}`);
  process.exit(2);
}
const files = listing.stdout.split("\0").filter(Boolean);
if (!files.length) process.exit(0);

const cfg = loadConfig(root);
const overrides = cfg ? cfg.ceilings : {};

const violations = [];
for (const rel of files) {
  const abs = join(root, rel);
  if (!existsSync(abs)) continue;
  if (isExempt(root, abs)) continue;
  let content;
  try {
    content = readFileSync(abs, "utf8");
  } catch {
    continue; // binary or unreadable — not ours to judge
  }
  const v = violation(abs, content, overrides);
  if (v) violations.push({ rel, ...v });
}

if (!violations.length) process.exit(0);

console.error("crew code-quality gate: ceiling exceeded\n");
for (const v of violations) {
  console.error(`  ${v.rel} — ${v.lines} lines (${v.kind} ceiling: ${v.ceiling})`);
}
console.error(
  "\nSplit the file (extract a symbol into its own file), or pre-register the path\n" +
    "in the crew:exempt block of docs/DEVIATIONS.md with its rationale, then retry.\n" +
    "Ceilings: standards/code-quality.md · overrides: crew.json \"ceilings\" · full guide: crew plugin docs/en/enforcement.md.",
);
process.exit(1);
