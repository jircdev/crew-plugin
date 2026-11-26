// What the requirement step reads from and writes to git: the files entering
// the commit, their staged text, and the link written into the commit itself.
const fs = require("node:fs");
const { join, dirname, basename } = require("node:path");
const { spawnSync } = require("node:child_process");

function git(root, args, options = {}) {
  return spawnSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 256 << 20, ...options });
}

function topLevel(cwd) {
  const r = git(cwd, ["rev-parse", "--show-toplevel"]);
  return r.status === 0 ? r.stdout.trim() : null;
}

// Paths entering the commit; null when git could not list them.
function stagedPaths(root) {
  const r = git(root, ["diff", "--cached", "--name-only", "-z", "--diff-filter=ACMR"]);
  return r.status === 0 ? r.stdout.split("\0").filter(Boolean) : null;
}

function stagedText(root, rel) {
  const r = git(root, ["show", `:${rel}`]);
  return r.status === 0 ? r.stdout : null;
}

// Replace the staged content of `rel` with `text`, leaving its mode alone.
// `git commit -- <paths>` commits from a temporary index and keeps the one it
// will leave behind in index.lock: both get the new content, so the file is
// clean after the commit.
function stage(root, rel, text) {
  const entry = git(root, ["ls-files", "-s", "--", rel]).stdout.split(/\s+/)[0] || "100644";
  const blob = git(root, ["hash-object", "-w", "--stdin"], { input: text });
  if (blob.status !== 0) return false;
  const info = `${entry},${blob.stdout.trim()},${rel}`;
  if (git(root, ["update-index", "--cacheinfo", info]).status !== 0) return false;
  const index = process.env.GIT_INDEX_FILE || "";
  if (/^next-index-.*\.lock$/.test(basename(index))) {
    const pending = join(dirname(index), "index.lock");
    if (fs.existsSync(pending)) git(root, ["update-index", "--cacheinfo", info], { env: { ...process.env, GIT_INDEX_FILE: pending } });
  }
  return true;
}

module.exports = { git, topLevel, stagedPaths, stagedText, stage };
