#!/usr/bin/env node
// What can start now in a plan, what is blocked and by what, and which of the
// startable items can run in parallel without touching the same files. The
// delivery coordinator reads it to execute a plan; it decides nothing itself.
//
//   node scripts/plan-graph.js <plan-dir> [--json]
//   node scripts/plan-graph.js gate [--cwd <worktree>]   (integrate only on READY)
const path = require("node:path");
const { readPlan, isDone, statusOf } = require("./lib/plan-items");

const overlaps = (a, b) => a.some((x) => b.some((y) => x === y || x.startsWith(`${y}/`) || y.startsWith(`${x}/`)));

function classify(items) {
  const byFile = Object.fromEntries(items.map((i) => [i.file, i]));
  return items.map((item) => {
    if (isDone(item.status)) return { ...item, state: "done" };
    if (/^in progress|^en curso/i.test(item.status)) return { ...item, state: "in progress" };
    if (item.blocked) return { ...item, state: "blocked", reason: `waiting on a person: ${item.blocked}` };
    const pending = item.depends.filter((d) => !isDone(byFile[d] ? byFile[d].status : statusOf(d)));
    if (pending.length) return { ...item, state: "blocked", reason: `depends on ${pending.map((d) => path.basename(d, ".md")).join(", ")}` };
    if (/^ready|^lista/i.test(item.status)) return { ...item, state: "ready" };
    return { ...item, state: "not ready", reason: `status ${item.status || "missing"}` };
  });
}

// Greedy batches over the ready items, in plan order. Batch 1 starts now in
// parallel; an item sharing a path with a batch member, or with an item in
// progress, goes to a later batch. Batch 1 may stay empty: then nothing can
// start until the work in progress frees its paths.
function batches(classified) {
  const busy = classified.filter((i) => i.state === "in progress").flatMap((i) => i.touches);
  const out = [[]];
  for (const item of classified.filter((i) => i.state === "ready")) {
    const n = out.findIndex((b, k) => (k > 0 || !overlaps(item.touches, busy)) && b.every((o) => !overlaps(o.touches, item.touches)));
    if (n === -1) out.push([item]); else out[n].push(item);
  }
  return out;
}

function render(classified, groups) {
  const rows = classified.map((i) => `| ${i.id} | ${i.status || "—"} | ${i.state} | ${i.reason || ""} |`);
  const lines = ["| Item | Status | State | Why |", "|---|---|---|---|", ...rows, ""];
  if (!groups[0].length) lines.push(groups.length > 1 ? "Nothing can start now: the ready items share paths with work in progress." : "Nothing can start now.");
  groups.forEach((g, n) => g.length && lines.push(`${n === 0 ? "Start now, in parallel" : `Then, batch ${n + 1}`}: ${g.map((i) => i.id).join(", ")}`));
  return lines.join("\n") + "\n";
}

function main(argv) {
  if (argv[0] === "gate") {
    const i = argv.indexOf("--cwd");
    const code = require("./verify").main(i === -1 ? [] : ["--cwd", argv[i + 1]]);
    console.log(code === 0 ? "INTEGRATE — the declared suites passed in this worktree." : "DO NOT INTEGRATE — the declared suites are not green here.");
    return code;
  }
  if (!argv[0]) { console.log("Usage: plan-graph.js <plan-dir> [--json] | gate [--cwd <worktree>]"); return 2; }
  const classified = classify(readPlan(path.resolve(argv[0])));
  const groups = batches(classified);
  if (argv.includes("--json")) console.log(JSON.stringify({ items: classified, batches: groups.map((g) => g.map((i) => i.id)) }, null, 2));
  else process.stdout.write(render(classified, groups));
  return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));
module.exports = { classify, batches, overlaps };
