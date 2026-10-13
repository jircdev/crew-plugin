#!/usr/bin/env node
// Print the effective standard for a work item, or check files against it.
//
//   node scripts/conformance.js <work-item-path>           # the standard
//   node scripts/conformance.js --check <file> [<file>...] # conformance report
//
// Same resolver the shape guard uses (hooks/lib/standards.js), so what a role
// reads here is exactly what the guard will hold it to. Exit code 1 when a
// checked file does not conform; 0 otherwise.
const { resolve: resolvePath } = require("node:path");
const { readFileSync, existsSync } = require("node:fs");
const { resolve } = require("../hooks/lib/standards");
const { problems, deprecations } = require("../hooks/lib/shape");
const { LEGACY_COLUMNS } = require("../hooks/lib/standards");

function describe(std) {
  const lines = [
    `Effective standard: ${std.kind} — source: ${std.source === "project" ? "project template" : "crew template"} (${std.template})`,
    `Header fields: ${std.header.join(", ") || "(none)"}`,
    `Sections: ${std.sections.join(", ") || "(none)"}`,
  ];
  for (const [name, cols] of Object.entries(std.tables)) lines.push(`Table "${name}": ${cols.join(" | ")}`);
  for (const [name, cols] of Object.entries(std.optionalTables)) {
    lines.push(`Table "${name}" (added at planning, when present): ${cols.join(" | ")}`);
  }
  if (std.total) lines.push("The estimation table closes with a **Total** row.");
  lines.push(...estimationNotes(std));
  for (const d of std.deviations) {
    lines.push(`Deviation applied: ${d.action} ${d.scope || ""} ${d.target} — ${d.reason}`.replace(/\s+/g, " "));
  }
  for (const bad of std.invalid) lines.push(`Deviation ignored (no rationale or unknown grammar): ${bad}`);
  return lines.join("\n");
}

// How to fill the two estimates, printed with the standard so a role never has
// to guess; plus the legacy notice when the project's template predates them.
function estimationNotes(std) {
  const cols = std.tables.Estimation || Object.entries(std.optionalTables).find(([n]) => /^estimation$/i.test(n))?.[1];
  if (!cols) return [];
  const same = (a, b) => a.length === b.length && a.every((c, i) => c.toLowerCase() === b[i].toLowerCase());
  if (same(cols, LEGACY_COLUMNS)) {
    return [
      "Notice: this Estimation table predates the AI estimate. Legacy shape, accepted until the next minor version; " +
        "the crew table adds Est. AI hours and Actual AI hours (either shape conforms meanwhile).",
    ];
  }
  if (!cols.some((c) => /\b(ai|ia)\b/i.test(c))) return [];
  return [
    "Every milestone carries two estimates: Est. hours at person pace (fixed before deciding who executes) and " +
      "Est. AI hours for the agents' processing time (0 when the milestone has no agent work). Human review is its own " +
      "milestone. Actual hours are the person's; Actual AI hours come from a capture, or \"—\" when none measured them. " +
      "The **Total** row sums all four.",
  ];
}

function main(argv) {
  const check = argv[0] === "--check";
  const targets = (check ? argv.slice(1) : argv).map((p) => resolvePath(p));
  if (!targets.length) {
    console.error("Usage: conformance.js <work-item-path> | --check <file> [<file>...]");
    return 2;
  }
  let failed = 0;
  for (const target of targets) {
    const std = resolve(target);
    if (!std) {
      console.log(`${target}: not a work item under docs/stories or docs/requirements (README.md files are indexes)`);
      continue;
    }
    if (!check) {
      console.log(describe(std));
      continue;
    }
    if (!existsSync(target)) {
      console.log(`${target}: missing`);
      failed++;
      continue;
    }
    const text = readFileSync(target, "utf8");
    const found = problems(text, std);
    console.log(found.length ? `${target}: does not conform\n  - ${found.join("\n  - ")}` : `${target}: conforms (${std.source} template)`);
    for (const note of deprecations(text, std)) console.log(`  · deprecated: ${note}`);
    if (found.length) failed++;
  }
  return failed ? 1 : 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));
module.exports = { describe, estimationNotes, main };
