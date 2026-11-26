// The line in .git/hooks/pre-commit that runs the requirement step. It is its
// own line, apart from the code-quality gate: a repository connected to
// factory gets the requirement step whether or not it runs the quality gate,
// and neither changes the other's reach.
//
// Session start keeps it in place: a fresh clone has no hooks, and a plugin
// update moves the plugin to a new folder, so the path in the line is
// rewritten when it no longer matches. The line checks that the script is
// there, so a plugin that was removed never blocks a commit. A hook manager
// (Lefthook, husky, core.hooksPath) owns its own files: crew prints the line
// to add and writes nothing.
const fs = require("node:fs");
const path = require("node:path");
const managers = require("./hook-manager");

const MARK = "# crew requirement gate";
const SCRIPT = "sync-requirements.js";
const slash = (p) => p.replace(/\\/g, "/");

function line(plugin) {
  const script = `${slash(plugin)}/scripts/${SCRIPT}`;
  return `[ ! -f "${script}" ] || node "${script}" || exit 1  ${MARK}`;
}

// { action: "wrote" | "appended" | "updated" | "skip" | "manual", path, why? }
function ensureHook(root, plugin) {
  if (!fs.existsSync(path.join(root, ".git"))) return { action: "skip", path: ".git/hooks/pre-commit" };
  const manager = managers.detect(root, plugin);
  if (manager) {
    const wired = manager.files.some((f) => {
      try { return fs.readFileSync(path.join(root, f), "utf8").includes(SCRIPT); } catch { return false; }
    });
    if (wired) return { action: "skip", path: manager.files[0] };
    return { action: "manual", path: manager.files[0],
      why: `${manager.name} owns the pre-commit hook; add this line to ${manager.files[0]} (crew does not edit it): node '${slash(plugin)}/scripts/${SCRIPT}'` };
  }
  const hook = path.join(root, ".git", "hooks", "pre-commit");
  const wanted = line(plugin);
  if (!fs.existsSync(hook)) {
    fs.mkdirSync(path.dirname(hook), { recursive: true });
    fs.writeFileSync(hook, `#!/usr/bin/env bash\n${wanted}\n`, { mode: 0o755 });
    return { action: "wrote", path: ".git/hooks/pre-commit" };
  }
  const text = fs.readFileSync(hook, "utf8");
  const lines = text.split("\n");
  const at = lines.findIndex((l) => l.includes(MARK));
  if (at >= 0 && lines[at] === wanted) return { action: "skip", path: ".git/hooks/pre-commit" };
  if (at >= 0) {
    lines[at] = wanted;
    fs.writeFileSync(hook, lines.join("\n"));
    return { action: "updated", path: ".git/hooks/pre-commit" };
  }
  fs.appendFileSync(hook, `${text.endsWith("\n") ? "" : "\n"}${wanted}\n`);
  return { action: "appended", path: ".git/hooks/pre-commit" };
}

module.exports = { ensureHook, line, MARK };
