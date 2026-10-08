#!/usr/bin/env node
// `/crew:metrics catalog`: how often each role, skill and command was used in
// this project, from the opt-in local log (.crew/usage.jsonl). The evidence the
// CREW role needs before merging, retiring or reshaping a role. Read-only.
const fs = require("node:fs");
const path = require("node:path");
const { findRoot } = require("../hooks/lib/ceilings");
const { read, catalog, RETENTION_DAYS } = require("../hooks/lib/usage");

function report(root, now = Date.now()) {
  const events = read(root);
  const within = (days) => events.filter((e) => Date.parse(e.at) >= now - days * 86400000);
  const count = (list) => list.reduce((m, e) => m.set(`${e.kind}:${e.name}`, (m.get(`${e.kind}:${e.name}`) || 0) + 1), new Map());
  const c30 = count(within(30));
  const c90 = count(within(RETENTION_DAYS));
  const rows = [...c90.keys()].sort((a, b) => c90.get(b) - c90.get(a)).map((k) => {
    const [kind, name] = k.split(":");
    return { kind, name, last30: c30.get(k) || 0, last90: c90.get(k) };
  });
  const usedRoles = new Set(rows.filter((r) => r.kind === "agent").map((r) => r.name));
  const unused = [...catalog().agent].filter((r) => !usedRoles.has(r)).sort();
  return { events: events.length, rows, unused };
}

function main(argv = []) {
  const i = argv.indexOf("--cwd");
  const cwd = path.resolve(i === -1 ? process.cwd() : argv[i + 1]);
  const root = findRoot(cwd) || cwd;
  if (argv.includes("--purge")) {
    const target = path.join(root, ".crew", "usage.jsonl");
    if (fs.existsSync(target)) fs.rmSync(target);
    console.log("Catalog usage log deleted.");
    return 0;
  }
  const r = report(root);
  if (!r.events) {
    console.log("No catalog usage recorded. It is opt-in per person: {\"telemetry\": true} in .crew/local.json (never versioned) or CREW_TELEMETRY=1. Kept locally in .crew/usage.jsonl for 90 days; --purge deletes it.");
    return 0;
  }
  console.log(`Catalog usage — ${r.events} event(s), last ${RETENTION_DAYS} days\n`);
  console.log("| Kind | Name | Last 30 days | Last 90 days |\n|---|---|---|---|");
  for (const x of r.rows) console.log(`| ${x.kind} | ${x.name} | ${x.last30} | ${x.last90} |`);
  console.log(`\nRoles not used in ${RETENTION_DAYS} days: ${r.unused.length ? r.unused.join(", ") : "none"}`);
  console.log("Low use alone is not a reason to retire a role: the routing cost test in agents/crew.md decides.");
  return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));
module.exports = { report, main };
