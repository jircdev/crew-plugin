// Where the pre-commit quality gate lives. A hook manager (Lefthook, husky, or
// any core.hooksPath) owns the hook git actually runs and regenerates
// .git/hooks/pre-commit, so a line crew writes there is lost or never runs.
// In that case the gate belongs in the manager's own config: this module
// finds the manager, says whether its config already runs check-quality.sh,
// and prints the snippet to add. It never writes into a manager's files.
//
// Snippets carry no double quotes: on Windows, Lefthook wraps a job's command
// in double quotes without escaping inner ones, which breaks the command.
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const GATE = "check-quality.sh";
const LEFTHOOK = ["lefthook", ".lefthook", ".config/lefthook"].flatMap((b) =>
  ["", "-local"].flatMap((s) => ["yml", "yaml", "json", "toml"].map((e) => `${b}${s}.${e}`)));

const slash = (p) => p.replace(/\\/g, "/");
const command = (plugin) => `bash '${slash(plugin)}/scripts/${GATE}'`;

// The lines of a top-level YAML key's block (`pre-commit:` up to the next
// top-level key). Enough to tell a pre-commit job from a pre-push one.
function yamlBlock(text, key) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => new RegExp(`^['"]?${key}['"]?\\s*:`).test(l));
  if (start === -1) return "";
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^[^\s#]/.test(l));
  return rest.slice(0, end === -1 ? rest.length : end).join("\n");
}

function runsGate(file) {
  const text = fs.readFileSync(file, "utf8");
  const scope = /\.ya?ml$/.test(file) ? yamlBlock(text, "pre-commit") : text;
  return scope.includes(GATE) ? scope : null;
}

// A literal script path in the wiring, when there is one. Paths built at run
// time (globs, variables, ~) cannot be checked from here and yield null.
function literalPath(text) {
  const m = text.match(/([^\s'"`=]*check-quality\.sh)/);
  if (!m || /[*?$~{]/.test(m[1]) || !/^(\/|[a-z]:\/)/i.test(m[1])) return null;
  return m[1].replace(/^\/([a-z])\//i, "$1:/");
}

function hooksPath(root) {
  const r = spawnSync("git", ["config", "--get", "core.hooksPath"], { cwd: root, encoding: "utf8", windowsHide: true });
  return r.status === 0 ? r.stdout.trim() : "";
}

// null when no manager owns the hook (crew writes .git/hooks/pre-commit);
// otherwise { name, files, wired, script, snippet } with paths relative to root.
function detect(root, plugin) {
  const lefthook = LEFTHOOK.filter((f) => fs.existsSync(path.join(root, f)));
  if (lefthook.length) {
    const hit = lefthook.map((f) => [f, runsGate(path.join(root, f))]).find(([, s]) => s);
    return { name: "Lefthook", files: lefthook, wired: hit ? hit[0] : null, script: hit ? literalPath(hit[1]) : null,
      snippet: `pre-commit:\n  jobs:\n    - name: crew-quality-gate\n      run: ${command(plugin)}` };
  }
  const custom = hooksPath(root);
  const husky = fs.existsSync(path.join(root, ".husky")) || /(^|\/)\.husky(\/|$)/.test(slash(custom));
  if (!husky && !custom) return null;
  const file = husky ? ".husky/pre-commit" : `${slash(custom).replace(/\/$/, "")}/pre-commit`;
  const full = path.resolve(root, file);
  const text = fs.existsSync(full) ? fs.readFileSync(full, "utf8") : "";
  return { name: husky ? "husky" : "core.hooksPath", files: [file], wired: text.includes(GATE) ? file : null,
    script: text.includes(GATE) ? literalPath(text) : null, snippet: `${command(plugin)} || exit 1  # crew quality gate` };
}

// Where the job goes and what to paste, for repair and init output.
function instructions(m) {
  return `${m.name} owns the pre-commit hook; add the crew gate to ${m.files[0]} (crew does not edit it):\n${m.snippet}`;
}

module.exports = { detect, instructions, yamlBlock, literalPath };
