#!/usr/bin/env node
// Configuration security scan (owner: security-compliance). Read-only, no
// network, executes nothing it reads. Scans the project's agent instructions,
// host settings, MCP config, agent definitions and crew policy; --user adds the
// user-level Claude config. Findings are masked.
//
//   node scripts/sec-scan.js [--cwd <dir>] [--user] [--json] [--report] [--ci]
//
// --report writes a dated, never-edited report to docs/security/.
// --ci exits 1 on an unaccepted critical/high finding in a team project.
// Accepted risks live in the crew:security block of docs/DEVIATIONS.md:
//   SEC-HOOK-NET .claude/settings.json   # webhook to our own status page · owner: ana
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { createHash } = require("node:crypto");
const rules = require("./lib/sec-rules");
const { loadConfig } = require("../hooks/lib/config");
const { findRoot } = require("../hooks/lib/ceilings");
const { readBlock } = require("../hooks/lib/deviation-lines");

const RANK = { critical: 0, high: 1, medium: 2, info: 3 };

function targets(root, user) {
  const list = [];
  const add = (p, kind) => { if (fs.existsSync(p) && fs.statSync(p).isFile()) list.push({ path: p, kind }); };
  const dir = (d, rx, kind) => { if (fs.existsSync(d)) for (const n of fs.readdirSync(d)) {
    const full = path.join(d, n);
    if (fs.statSync(full).isDirectory()) dir(full, rx, kind); else if (rx.test(n)) add(full, kind);
  } };
  for (const n of ["CLAUDE.md", "AGENTS.md", "CLAUDE.local.md"]) add(path.join(root, n), "instructions");
  add(path.join(root, ".claude", "settings.json"), "settings");
  add(path.join(root, ".claude", "settings.local.json"), "settings");
  add(path.join(root, ".mcp.json"), "mcp");
  dir(path.join(root, ".claude", "agents"), /\.md$/, "agent");
  dir(path.join(root, ".claude", "commands"), /\.md$/, "instructions");
  dir(path.join(root, ".claude", "skills"), /^SKILL\.md$/, "instructions");
  if (user) {
    const home = path.join(os.homedir(), ".claude");
    add(path.join(home, "CLAUDE.md"), "instructions");
    add(path.join(home, "settings.json"), "settings");
    add(path.join(os.homedir(), ".claude.json"), "mcp");
    dir(path.join(home, "agents"), /\.md$/, "agent");
  }
  return list;
}

// Hash of the scanned configuration, without evaluating rules: cheap enough
// for SessionStart to tell whether the configuration changed since the last
// recorded scan.
function fingerprint(root) {
  const files = targets(root, false);
  return createHash("sha256").update(files.map((t) => t.path + fs.readFileSync(t.path, "utf8")).join("\n")).digest("hex").slice(0, 16);
}

function scan(root, { user = false } = {}) {
  const files = targets(root, user);
  const accepted = readBlock(root, "security").filter((e) => !e.expired && e.reason);
  const findings = [];
  for (const t of files) {
    const text = fs.readFileSync(t.path, "utf8").replace(/\r\n/g, "\n");
    const inside = !path.relative(root, t.path).startsWith("..");
    const shown = (inside ? path.relative(root, t.path) : t.path.replace(os.homedir(), "~")).replace(/\\/g, "/");
    for (const f of rules[t.kind](shown, text)) {
      const ok = accepted.some((e) => { const [rule, where] = e.rule.split(/\s+/); return rule === f.rule && (!where || where === shown); });
      findings.push({ ...f, accepted: ok });
    }
  }
  findings.sort((a, b) => RANK[a.severity] - RANK[b.severity]);
  const hash = createHash("sha256").update(files.map((t) => t.path + fs.readFileSync(t.path, "utf8")).join("\n")).digest("hex").slice(0, 16);
  return { root, scanned: files.length, hash, findings };
}

// Local calendar date: a report is filed under the day its reader lived it.
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function markdown(result) {
  const date = today();
  const open = result.findings.filter((f) => !f.accepted);
  const lines = [`# Security scan — ${date}`, "", `Scanned ${result.scanned} configuration file(s); configuration hash ${result.hash}. ` +
    `${open.length ? `${open.length} open finding(s).` : "No open findings."} Read-only scan by scripts/sec-scan.js; nothing was executed and secrets are masked.`, "",
    "| Severity | Rule | Where | Finding | Fix | Accepted |", "|---|---|---|---|---|---|"];
  for (const f of result.findings) lines.push(`| ${f.severity} | ${f.rule} | ${f.file}${f.line ? `:${f.line}` : ""} | ${f.what} | ${f.fix} | ${f.accepted ? "yes" : "no"} |`);
  return lines.join("\n") + "\n";
}

function writeReport(root, result) {
  const dir = path.join(root, "docs", "security");
  fs.mkdirSync(dir, { recursive: true });
  const base = `scan-${today()}`;
  let name = `${base}.md`;
  for (let i = 2; fs.existsSync(path.join(dir, name)); i++) name = `${base}-${i}.md`;
  fs.writeFileSync(path.join(dir, name), markdown(result));
  fs.mkdirSync(path.join(root, ".crew"), { recursive: true });
  fs.writeFileSync(path.join(root, ".crew", "sec-scan.json"), JSON.stringify({ hash: result.hash, at: new Date().toISOString(), report: `docs/security/${name}` }) + "\n");
  return `docs/security/${name}`;
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  const i = argv.indexOf("--cwd");
  const cwd = path.resolve(i === -1 ? process.cwd() : argv[i + 1]);
  const root = findRoot(cwd) || cwd;
  const result = scan(root, { user: argv.includes("--user") });
  const report = argv.includes("--report") ? writeReport(root, result) : null;
  if (argv.includes("--json")) console.log(JSON.stringify({ ...result, report }, null, 2));
  else {
    console.log(markdown(result));
    if (report) console.log(`Report written: ${report}`);
  }
  const cfg = loadConfig(root);
  const blocking = result.findings.some((f) => !f.accepted && RANK[f.severity] <= 1);
  process.exit(argv.includes("--ci") && blocking && !(cfg && cfg.mode === "solo") ? 1 : 0);
}
module.exports = { scan, markdown, targets, fingerprint, writeReport, RANK };
