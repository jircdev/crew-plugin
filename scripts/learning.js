#!/usr/bin/env node
// Verified learning. A failure is recorded where it happened, the retro groups
// the ones that repeat and says where the fix belongs, and a proposed change to
// crew is accepted only with an A/B run of the delivery evaluation attached.
//
//   node scripts/learning.js record --kind <k> --stage <s> --origin <method|role:x|stack:area>
//   node scripts/learning.js retro [--eval <result.json>]
//   node scripts/learning.js compare <before.json> <after.json>
//
// Also reachable as `/crew:metrics learning ...`.
const fs = require("node:fs");
const path = require("node:path");
const { findRoot } = require("../hooks/lib/ceilings");
const { loadConfig } = require("../hooks/lib/config");
const log = require("./lib/learning-log");
const ab = require("./lib/learning-compare");

const flag = (argv, name) => { const i = argv.indexOf(name); return i === -1 ? null : argv[i + 1]; };
const KIND_OF_TASK = { feature: "feature", defect: "defect", refactor: "refactor", security: "feature" };
const FAILED_AT = { feature: "validate", defect: "verify", refactor: "verify" };
const ASKED_AT = { feature: "criteria", defect: "reproduce", refactor: "pin" };

// Failing crew runs of the delivery evaluation become entries: the procedure
// was followed and the result still fell short, so the origin is the method.
function fromEval(result) {
  const out = [];
  for (const r of result.runs.filter((x) => x.variant === "crew")) {
    const kind = KIND_OF_TASK[r.kind];
    if (!kind) continue;
    if (r.acceptance.passed < r.acceptance.total || !r.regression) out.push({ kind, stage: FAILED_AT[kind], origin: "method", source: r.task });
    if (r.interventions > 0) out.push({ kind, stage: ASKED_AT[kind], origin: "method", source: r.task });
  }
  return out;
}

function retro(entries, specs) {
  const groups = {};
  for (const e of entries) (groups[`${e.origin}|${e.kind}|${e.stage}`] ||= []).push(e);
  const repeated = Object.entries(groups).filter(([, es]) => es.length >= 2).sort((x, y) => y[1].length - x[1].length);
  if (!repeated.length) return "No failure repeats yet. A failure seen once is a note, never a proposal.\n";
  const lines = ["| Where it belongs | Kind | Stage | Times | Next step |", "|---|---|---|---|---|"];
  for (const [key, es] of repeated) {
    const [origin, kind, stage] = key.split("|");
    const area = origin.startsWith("stack:") ? origin.slice(6) : null;
    const spec = area && specs.find((s) => s.area === area);
    const next = area
      ? `Project: propose a change to ${spec ? spec.ref : `a stack specification for "${area}" (none declared)`} in this project's docs/proposals/`
      : `crew: proposal in the plugin's proposals/ for the ${origin === "method" ? "execution craft" : origin.slice(5)}, with \`learning compare\` attached`;
    lines.push(`| ${origin} | ${kind} | ${stage} | ${es.length} | ${next} |`);
  }
  return lines.join("\n") + "\n";
}

function main(argv) {
  const [sub, ...rest] = argv;
  const cwd = path.resolve(flag(rest, "--cwd") || process.cwd());
  const root = findRoot(cwd) || cwd;
  const cfg = loadConfig(cwd);
  const specs = (cfg && cfg.stack && cfg.stack.specs) || [];
  if (sub === "record") {
    const problem = log.record(root, { kind: flag(rest, "--kind"), stage: flag(rest, "--stage"), origin: flag(rest, "--origin") }, specs.map((s) => s.area));
    console.log(problem ? `Not recorded: ${problem}.` : "Recorded in .crew/learning.jsonl (local, never versioned, 90 days).");
    return problem ? 1 : 0;
  }
  if (sub === "retro") {
    const evalFile = flag(rest, "--eval");
    const entries = [...log.read(root), ...(evalFile ? fromEval(JSON.parse(fs.readFileSync(evalFile, "utf8"))) : [])];
    process.stdout.write(retro(entries, specs));
    return 0;
  }
  if (sub === "compare" && rest[0] && rest[1]) {
    const [before, after] = rest.slice(0, 2).map((f) => JSON.parse(fs.readFileSync(f, "utf8")));
    const result = ab.compare(before, after);
    process.stdout.write(ab.render(result, before, after));
    return result.incorporable ? 0 : 1;
  }
  console.log("Usage: learning.js record --kind <k> --stage <s> --origin <o> | retro [--eval <result.json>] | compare <before.json> <after.json>");
  return 2;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));
module.exports = { main, retro, fromEval };
