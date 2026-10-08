#!/usr/bin/env node
// Scaffold the crew skeleton into a project and record what was written.
//
//   node scripts/init-project.js [--solo] [--dry-run] [--json] [--target <dir>]
//
// The single source of truth for the scaffold (scripts/init-project.sh is a
// wrapper). Never overwrites: an existing file is skipped. Every file it does
// write is recorded with its hash in .crew/install-state.json, so repair and
// uninstall can later touch only what crew wrote. --dry-run writes nothing.
const fs = require("node:fs");
const path = require("node:path");
const state = require("./lib/install-state");

const PLUGIN = path.resolve(__dirname, "..");
const T = (rel) => path.join(PLUGIN, "templates", rel);
const BOTH = [
  ["AGENTS.md", "AGENTS.md"], ["CLAUDE.md", "CLAUDE.md"], ["standards/code-quality.md", "standards/code-quality.md"],
  ["docs/decisions/README.md", "docs/decisions/README.md"], ["docs/decisions/0000-template.md", "docs/decisions/0000-template.md"],
  ["docs/work/README.md", "docs/work/README.md"], ["docs/design/README.md", "docs/design/README.md"],
  ["docs/design/references.md", "docs/design/references.md"], ["docs/design/approved.md", "docs/design/approved.md"],
  ["docs/design/rejected.md", "docs/design/rejected.md"], ["docs/guides/testing.md", "docs/guides/testing.md"],
  ["docs/guides/testing.es.md", "docs/guides/testing.es.md"],
];
const TEAM = [
  "docs/INDEX.md", "docs/AGENTS.md", "docs/MAINTAINING.md", "docs/DEVIATIONS.md", "docs/briefs/README.md",
  "docs/stories/README.md", "docs/requirements/README.md", "docs/proposals/README.md",
  "docs/guides/delivery-circuit.md", "docs/guides/delivery-circuit.es.md", "docs/as-is/README.md",
].map((p) => [p, p]);
const HOOK_LINE = (root) => `bash "${root.replace(/\\/g, "/")}/scripts/check-quality.sh" || exit 1  # crew quality gate`;

function version() {
  return JSON.parse(fs.readFileSync(path.join(PLUGIN, ".claude-plugin", "plugin.json"), "utf8")).version;
}

function crewJson(mode) {
  // Every value explicit: this file IS the project's policy. Only capabilities
  // whose target the scaffold creates are seeded; /crew:setup asks for the rest.
  return JSON.stringify({ mode, metrics: true, quality: "advise", ceilings: {}, configuredWith: version(),
    design: { memory: "docs/design" }, testing: { guide: "docs/guides/testing.md" } }, null, 2) + "\n";
}

function preCommit(target, dry) {
  const hook = path.join(target, ".git", "hooks", "pre-commit");
  if (!fs.existsSync(path.join(target, ".git"))) return { action: "skip", path: ".git/hooks/pre-commit", why: "no .git — run git init and re-run" };
  const line = HOOK_LINE(PLUGIN);
  if (fs.existsSync(hook)) {
    const text = fs.readFileSync(hook, "utf8");
    if (text.includes("bin/check-quality.sh")) {
      if (!dry) fs.writeFileSync(hook, text.replace(/\/bin\/check-quality\.sh/g, "/scripts/check-quality.sh"));
      return { action: "migrated", path: ".git/hooks/pre-commit", why: "pointed at the pre-0.24 bin/ path" };
    }
    if (text.includes("check-quality.sh")) return { action: "skip", path: ".git/hooks/pre-commit", why: "already runs the crew quality gate" };
    if (!dry) fs.appendFileSync(hook, `\n${line}\n`);
    return { action: "appended", path: ".git/hooks/pre-commit" };
  }
  if (!dry) {
    fs.mkdirSync(path.dirname(hook), { recursive: true });
    fs.writeFileSync(hook, `#!/usr/bin/env bash\n${line}\n`, { mode: 0o755 });
  }
  return { action: "wrote", path: ".git/hooks/pre-commit" };
}

function scaffold({ target, mode, dry }) {
  if (path.resolve(target) === PLUGIN) throw new Error("Refusing to scaffold into the plugin itself. cd to your project first.");
  const prior = state.read(target);
  const recorded = new Map(((prior && prior.files) || []).map((f) => [f.path, f]));
  const actions = [];
  const plan = [...BOTH, ...(mode === "team" ? TEAM : [])].map(([src, dest]) => ({ dest, write: () => fs.copyFileSync(T(src), path.join(target, dest)) }));
  plan.push({ dest: "crew.json", write: () => fs.writeFileSync(path.join(target, "crew.json"), crewJson(mode)) });
  for (const item of plan) {
    const full = path.join(target, item.dest);
    if (fs.existsSync(full)) { actions.push({ action: "skip", path: item.dest, why: "exists" }); continue; }
    if (!dry) {
      fs.mkdirSync(path.dirname(full), { recursive: true });
      item.write();
      recorded.set(item.dest, { path: item.dest, sha256: state.sha(full) });
    }
    actions.push({ action: "wrote", path: item.dest });
  }
  if (!dry) for (const dir of ["docs/work", "docs/decisions", ...(mode === "team" ? ["docs/stories", "docs/requirements"] : [])]) {
    fs.mkdirSync(path.join(target, dir), { recursive: true });
  }
  actions.push(preCommit(target, dry));
  if (!dry) state.write(target, { pluginVersion: version(), mode, updatedAt: new Date().toISOString(), files: [...recorded.values()] });
  return { target, mode, dryRun: dry, actions };
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  const i = argv.indexOf("--target");
  const report = scaffold({ target: path.resolve(i === -1 ? process.cwd() : argv[i + 1]),
    mode: argv.includes("--solo") ? "solo" : "team", dry: argv.includes("--dry-run") });
  if (argv.includes("--json")) console.log(JSON.stringify(report, null, 2));
  else {
    console.log(`${report.dryRun ? "Would scaffold" : "Scaffolding"} into: ${report.target} (mode: ${report.mode})`);
    for (const a of report.actions) console.log(`  ${(a.action + ":").padEnd(10)} ${a.path}${a.why ? ` — ${a.why}` : ""}`);
    if (!report.dryRun) console.log("\nNext: edit AGENTS.md, then run /crew:setup to declare what this project can do. /crew:doctor checks the install at any time.");
  }
}
module.exports = { scaffold, BOTH, TEAM };
