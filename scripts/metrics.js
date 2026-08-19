#!/usr/bin/env node
// Estimation metrics consumer (M2). Scans docs/stories/** and
// docs/requirements/** for Closed items, parses each estimation table and
// reports per-item and aggregate timing metrics. Pure Node, no dependencies.
//
// Usage: node metrics.js [YYYY-MM] [--csv]
//   YYYY-MM  only items closed in that month
//   --csv    also write docs/work/metrics.csv
const { readFileSync, readdirSync, writeFileSync, existsSync, statSync } = require("node:fs");
const { execSync } = require("node:child_process");
const { join, relative, dirname, sep } = require("node:path");

const args = process.argv.slice(2);
const csv = args.includes("--csv");
const period = args.find((a) => /^\d{4}-\d{2}$/.test(a)) || null;

function git(cmd, cwd) {
  try {
    return execSync(`git ${cmd}`, { cwd, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
}

const root = git("rev-parse --show-toplevel", process.cwd()) || process.cwd();

function mdFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return mdFiles(p);
    return e.isFile() && /\.md$/i.test(e.name) && !/^readme\.md$/i.test(e.name) ? [p] : [];
  });
}

function parseStamp(cell) {
  const m = (cell || "").match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s*(Z|[+-]\d{2}(?::?\d{2})?)$/);
  if (!m) return null;
  let tz = m[3];
  if (/^[+-]\d{2}$/.test(tz)) tz += ":00";
  else if (/^[+-]\d{4}$/.test(tz)) tz = `${tz.slice(0, 3)}:${tz.slice(3)}`;
  const t = Date.parse(`${m[1]}T${m[2]}:00${tz}`);
  return Number.isNaN(t) ? null : t;
}

function analyze(file) {
  const content = readFileSync(file, "utf8");
  if (!/\*\*(Status|Estado):\*\*\s*(Closed|Cerrada)\b/i.test(content.slice(0, 600))) return null;
  const section = content.split(/^##\s+Estimation\s*$/im)[1];
  if (!section) return null;
  const rows = section.split(/^##\s/m)[0].split("\n").filter((l) => /^\s*\|/.test(l)).slice(2);
  let est = 0, actual = 0, first = null, last = null;
  for (const row of rows) {
    const c = row.split("|").slice(1, -1).map((x) => x.trim());
    if (c.length < 5 || c.every((x) => x.replace(/[-\s]/g, "") === "")) continue;
    est += parseFloat(c[1].replace(",", ".")) || 0;
    actual += parseFloat(c[4].replace(",", ".")) || 0;
    const s = parseStamp(c[2]), f = parseStamp(c[3]);
    if (s !== null && (first === null || s < first)) first = s;
    if (f !== null && (last === null || f > last)) last = f;
  }
  if (first === null || last === null) return null;
  const rel = relative(root, file).split(sep).join("/");
  const created = git(`log --follow --diff-filter=A --format=%aI -- "${rel}"`, root).split("\n").pop()
    || new Date(statSync(file).birthtime).toISOString();
  return {
    item: rel,
    folder: dirname(rel),
    month: new Date(last).toISOString().slice(0, 7),
    leadDays: Math.max(0, (last - Date.parse(created)) / 86400000),
    execHours: (last - first) / 3600000,
    est, actual,
    deviation: est > 0 ? ((actual - est) / est) * 100 : null,
  };
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
}

const files = [...mdFiles(join(root, "docs", "stories")), ...mdFiles(join(root, "docs", "requirements"))];
let items = files.map(analyze).filter(Boolean);
if (period) items = items.filter((i) => i.month === period);

if (!items.length) {
  console.log(period ? `No closed items with estimation data for ${period}.` : "No closed items with estimation data found.");
  process.exit(0);
}

const n = (x, d = 1) => (x === null ? "—" : x.toFixed(d));
console.log(`Closed items${period ? ` (${period})` : ""}: ${items.length}\n`);
console.log("| Item | Lead (days) | Exec (h) | Est (h) | Actual (h) | Deviation |");
console.log("|---|---|---|---|---|---|");
for (const i of items.sort((a, b) => a.month.localeCompare(b.month))) {
  console.log(`| ${i.item} | ${n(i.leadDays)} | ${n(i.execHours)} | ${n(i.est)} | ${n(i.actual)} | ${i.deviation === null ? "—" : n(i.deviation, 0) + "%"} |`);
}

const exec = items.map((i) => i.execHours).sort((a, b) => a - b);
const devs = items.filter((i) => i.deviation !== null).map((i) => i.deviation);
console.log(`\nExecution time: median ${n(percentile(exec, 50))}h · p90 ${n(percentile(exec, 90))}h`);
if (devs.length) console.log(`Estimate deviation: avg ${n(devs.reduce((a, b) => a + b, 0) / devs.length, 0)}%`);

for (const key of ["folder", "month"]) {
  const groups = new Map();
  for (const i of items) (groups.get(i[key]) || groups.set(i[key], []).get(i[key])).push(i);
  console.log(`\nBy ${key}:`);
  for (const [g, list] of [...groups].sort()) {
    const ex = list.map((i) => i.execHours).sort((a, b) => a - b);
    console.log(`  ${g}: ${list.length} items · median exec ${n(percentile(ex, 50))}h · est ${n(list.reduce((a, i) => a + i.est, 0))}h → actual ${n(list.reduce((a, i) => a + i.actual, 0))}h`);
  }
}

if (csv) {
  const out = join(root, "docs", "work", "metrics.csv");
  const lines = ["item,folder,month,lead_days,exec_hours,est_hours,actual_hours,deviation_pct"];
  for (const i of items) {
    lines.push([i.item, i.folder, i.month, n(i.leadDays, 2), n(i.execHours, 2), n(i.est, 2), n(i.actual, 2), i.deviation === null ? "" : n(i.deviation, 1)].join(","));
  }
  writeFileSync(out, lines.join("\n") + "\n");
  console.log(`\nCSV written: ${relative(process.cwd(), out)}`);
}
