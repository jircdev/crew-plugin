// Which repository a folder belongs to when it is a git worktree. A worktree
// (`.claude/worktrees/<name>`, or a sibling folder) carries its own copy of
// crew.json from the branch it was cut from, and that copy may point at
// another factory or project. Its work is the main checkout's work, so the
// factory link comes from the main checkout.
//
// Read from git's own files, never by running git: hooks must stay fast.
const fs = require("node:fs");
const { join, dirname, basename, resolve, relative } = require("node:path");

const same = (a, b) => (process.platform === "win32" ? resolve(a).toLowerCase() === resolve(b).toLowerCase()
  : resolve(a) === resolve(b));

// { root, main } for the git checkout that holds `dir`: its top folder and
// the main checkout it belongs to (the same folder unless it is a linked
// worktree). null outside git; main is null for a bare repository.
function checkoutOf(dir) {
  let at = resolve(dir);
  for (let i = 0; i < 30; i++) {
    const dotGit = join(at, ".git");
    let stat = null;
    try { stat = fs.statSync(dotGit); } catch { /* keep walking */ }
    if (stat) return { root: at, main: stat.isDirectory() ? at : fromGitFile(at, dotGit) };
    const parent = dirname(at);
    if (parent === at) return null;
    at = parent;
  }
  return null;
}

// The main checkout of the repository that holds `dir`, or null.
const mainCheckout = (dir) => (checkoutOf(dir) || {}).main || null;

// The folder in the main checkout that matches `dir` inside a linked
// worktree, or null when `dir` is not inside one.
function counterpart(dir) {
  const co = checkoutOf(dir);
  if (!co || !co.main || same(co.main, co.root)) return null;
  return join(co.main, relative(co.root, resolve(dir)));
}

// A `.git` file says "gitdir: <main>/.git/worktrees/<name>"; that folder's
// `commondir` leads back to <main>/.git.
function fromGitFile(at, dotGit) {
  try {
    const gitdir = resolve(at, fs.readFileSync(dotGit, "utf8").replace(/^gitdir:\s*/, "").trim());
    const common = resolve(gitdir, fs.readFileSync(join(gitdir, "commondir"), "utf8").trim());
    return basename(common) === ".git" ? dirname(common) : null;
  } catch {
    return at;
  }
}

// cfg as read from `dir`. In a worktree, the factory link is the one the
// same folder of the main checkout declares, whenever it declares one (a
// project, or capture off). normalize is config.js's crew.json interpreter.
function withMainFactory(dir, cfg, normalize) {
  const main = cfg && counterpart(dir);
  if (!main) return cfg;
  let mainCfg = null;
  try { mainCfg = normalize(fs.readFileSync(join(main, "crew.json"), "utf8")); } catch { return cfg; }
  const link = mainCfg && mainCfg.factory;
  if (!link || (!link.projectId && link.capture !== false)) return cfg;
  return { ...cfg, factory: link, factoryFrom: main };
}

module.exports = { mainCheckout, counterpart, withMainFactory, sameDir: same };
