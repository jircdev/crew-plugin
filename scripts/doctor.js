#!/usr/bin/env node
// Diagnose a project's crew install against its own declarations. Read-only:
// it reports, it never reconfigures. Findings use the crew findings shape
// (standards/findings.md): severity, what, evidence, action.
//
//   node scripts/doctor.js [--cwd <dir>] [--json]
//   node scripts/doctor.js repair    [--dry-run]   restore missing recorded files and the pre-commit gate
//   node scripts/doctor.js uninstall [--dry-run]   remove only unedited recorded files and the gate line
//   node scripts/doctor.js standard [<path>]       the effective standard, or every item off it
//   node scripts/doctor.js security [--user]       scan the agent configuration and file the report
//
// Exit 1 when any blocking finding exists, 0 otherwise.
const fs = require("node:fs");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { loadConfig } = require("../hooks/lib/config");
const { findRoot } = require("../hooks/lib/ceilings");
const { readBlock } = require("../hooks/lib/deviation-lines");
const { resolve } = require("../hooks/lib/standards");
const { problems } = require("../hooks/lib/shape");
const { workItems } = require("../hooks/lib/work-state");
const install = require("./lib/install-state");
const extra = require("./lib/doctor-checks");
require("./lib/as-is-freshness");
require("./lib/sec-doctor");

const PLUGIN = path.resolve(__dirname, "..");
const f = (severity, what, evidence, action) => ({ severity, what, evidence, action });
const rel = (root, p) => path.relative(root, p).replace(/\\/g, "/");

function cmp(a, b) {
  const pa = String(a || "").split(".").map(Number), pb = String(b || "").split(".").map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  return 0;
}

function diagnose(root) {
  const out = [];
  const cfgFile = path.join(root, "crew.json");
  const cfg = loadConfig(root);
  if (!fs.existsSync(cfgFile)) out.push(f("important", "no crew.json", "crew.json is absent", "run scripts/init-project.sh or /crew:setup; guards infer by structure meanwhile"));
  else if (!cfg) out.push(f("blocking", "crew.json does not parse", "crew.json", "fix the JSON — an invalid file silently behaves like no file (quality falls back to enforce)"));
  if (cfg) {
    const migrations = JSON.parse(fs.readFileSync(path.join(PLUGIN, "migrations.json"), "utf8")).migrations;
    for (const m of migrations.filter((x) => x.required && cfg.configuredWith && cmp(x.version, cfg.configuredWith) > 0)) {
      out.push(f("blocking", `required migration pending since ${m.version}`, m.title, `read ${m.doc}, then run /crew:setup`));
    }
    if (!cfg.configuredWith) out.push(f("important", "no configuredWith marker", "crew.json", "run /crew:setup once; accepting the current state closes it"));
    for (const [section, c] of [["design", cfg.design], ["testing", cfg.testing]]) {
      for (const u of (c && c.unknown) || []) out.push(f("important", `crew.json ${section}.${u} is not usable`, "crew.json", "fix or remove it; the roles treat it as undeclared"));
    }
    const declared = [["design.memory", cfg.design && cfg.design.memory], ["testing.guide", cfg.testing && cfg.testing.guide],
      ["testing.e2e.specs", cfg.testing && cfg.testing.e2e && cfg.testing.e2e.specs]];
    for (const [key, p] of declared) {
      if (p && !fs.existsSync(path.join(root, p))) out.push(f("important", `${key} points at a missing path`, p, "create it or correct the declaration"));
    }
    if (cfg.testing && cfg.testing.receipts && !cfg.testing.commands.length) {
      out.push(f("blocking", "testing.receipts without testing.commands", "crew.json", "declare the commands: without them no receipt can exist and no passing row can close"));
    }
  }
  const hook = path.join(root, ".git", "hooks", "pre-commit");
  if (fs.existsSync(path.join(root, ".git"))) {
    const text = fs.existsSync(hook) ? fs.readFileSync(hook, "utf8") : "";
    const gate = text.match(/bash\s+"([^"]*check-quality\.sh)"/);
    if (!gate) out.push(f("important", "the pre-commit quality gate is not installed", ".git/hooks/pre-commit", "run node scripts/doctor.js repair"));
    else if (!fs.existsSync(gate[1].replace(/^\/([a-z])\//i, "$1:/"))) out.push(f("blocking", "the pre-commit gate points at a missing script", gate[1], "run node scripts/doctor.js repair"));
  }
  const st = install.read(root);
  for (const file of install.audit(root, st)) {
    if (file.status === "missing") out.push(f("important", "a scaffolded file is missing", file.path, "run node scripts/doctor.js repair, or leave it out on purpose"));
  }
  for (const name of ["exempt", "standard", "policy"]) {
    for (const e of readBlock(root, name).filter((x) => x.expired)) {
      out.push(f("important", `crew:${name} entry expired on ${e.expires}`, e.raw, "renew it with the owner or remove it — it no longer applies"));
    }
  }
  const tracked = spawnSync("git", ["ls-files", "--", ".crew/usage.jsonl", ".crew/local.json", ".crew/audit.log"], { cwd: root, encoding: "utf8", windowsHide: true });
  for (const t of (tracked.status === 0 ? tracked.stdout : "").split("\n").filter(Boolean)) {
    out.push(f("blocking", "a personal crew log is under version control", t, `git rm --cached ${t}; .crew/.gitignore keeps it out from now on`));
  }
  const nonconforming = [];
  for (const file of workItems(root)) {
    const std = resolve(file, PLUGIN);
    if (std && problems(fs.readFileSync(file, "utf8"), std).length) nonconforming.push(rel(root, file));
  }
  if (nonconforming.length) out.push(f("refinement", `${nonconforming.length} work item(s) depart from their standard`,
    nonconforming.slice(0, 3).join(", ") + (nonconforming.length > 3 ? `, +${nonconforming.length - 3} more` : ""),
    "run /crew:doctor standard to see each gap; fix it when the item is next edited, or declare a deviation"));
  return [...out, ...extra.run(root, cfg)];
}

function repair(root, dry) {
  const actions = [];
  const st = install.read(root);
  for (const file of install.audit(root, st).filter((x) => x.status === "missing")) {
    const src = path.join(PLUGIN, "templates", file.path === "crew.json" ? "__none__" : file.path);
    if (!fs.existsSync(src)) { actions.push(`skip ${file.path} (no template to restore from)`); continue; }
    if (!dry) { fs.mkdirSync(path.dirname(path.join(root, file.path)), { recursive: true }); fs.copyFileSync(src, path.join(root, file.path)); }
    actions.push(`restore ${file.path}`);
  }
  if (!dry) require("./init-project").scaffold({ target: root, mode: (st && st.mode) || "team", dry: false });
  actions.push("ensure the pre-commit quality gate");
  return actions;
}

function uninstall(root, dry) {
  const actions = [];
  const st = install.read(root);
  for (const file of install.audit(root, st)) {
    if (file.status === "present") { if (!dry) fs.rmSync(path.join(root, file.path)); actions.push(`remove ${file.path}`); }
    else if (file.status === "modified") actions.push(`keep ${file.path} (edited by the project — yours now)`);
  }
  const hook = path.join(root, ".git", "hooks", "pre-commit");
  if (fs.existsSync(hook)) {
    const kept = fs.readFileSync(hook, "utf8").split("\n").filter((l) => !/# crew quality gate$/.test(l));
    if (!dry) fs.writeFileSync(hook, kept.join("\n"));
    actions.push("remove the crew line from .git/hooks/pre-commit");
  }
  if (!dry && fs.existsSync(path.join(root, install.STATE))) fs.rmSync(path.join(root, install.STATE));
  actions.push(`remove ${install.STATE.replace(/\\/g, "/")}`);
  // Directories left empty by the removal go too; anything still holding a file stays.
  if (!dry) {
    const dirs = [...new Set(((st && st.files) || []).map((x) => path.dirname(x.path)).concat(".crew"))]
      .sort((a, b) => b.split("/").length - a.split("/").length);
    for (const d of dirs) {
      for (let cur = d; cur && cur !== "."; cur = path.dirname(cur)) {
        const full = path.join(root, cur);
        if (fs.existsSync(full) && !fs.readdirSync(full).length) fs.rmdirSync(full);
      }
    }
  }
  return actions;
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  const i = argv.indexOf("--cwd");
  const cwd = path.resolve(i === -1 ? process.cwd() : argv[i + 1]);
  const root = findRoot(cwd) || cwd;
  const dry = argv.includes("--dry-run");
  if (argv[0] === "standard" || argv[0] === "security") {
    const commands = require("./lib/doctor-commands");
    const target = argv[1] && !argv[1].startsWith("--") ? argv[1] : null;
    console.log(argv[0] === "standard" ? commands.standard(root, target) : commands.security(root, { user: argv.includes("--user") }));
    process.exit(0);
  }
  if (argv[0] === "repair" || argv[0] === "uninstall") {
    const acts = (argv[0] === "repair" ? repair : uninstall)(root, dry);
    console.log(`${dry ? "Would" : "Did"} ${argv[0]} in ${root}:\n  ${acts.join("\n  ")}`);
    process.exit(0);
  }
  const found = diagnose(root);
  if (argv.includes("--json")) console.log(JSON.stringify({ root, findings: found }, null, 2));
  else if (!found.length) console.log(`crew doctor: no findings in ${root}.`);
  else {
    const order = { blocking: 0, important: 1, refinement: 2 };
    console.log(`crew doctor — ${root}`);
    for (const x of found.sort((a, b) => order[a.severity] - order[b.severity])) {
      console.log(`  [${x.severity}] ${x.what}\n      evidence: ${x.evidence}\n      action: ${x.action}`);
    }
  }
  process.exit(found.some((x) => x.severity === "blocking") ? 1 : 0);
}
module.exports = { diagnose, repair, uninstall, rel };
