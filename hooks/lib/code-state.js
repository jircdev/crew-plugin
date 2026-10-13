// Fingerprint of the code as it is on disk, committed or not. A receipt from
// scripts/verify.js records it, and the closure gate compares it with the code
// at closing time: a pass recorded before the code changed proves nothing
// about the code that ships.
//
// Documentation is left out (docs/, *.md, .crew/), because closing a work item
// edits its own file and writing a receipt adds one under docs/. Everything
// else that git sees (tracked files and untracked ones that are not ignored)
// counts, by content: committing does not change the fingerprint.
const { spawnSync } = require("node:child_process");
const { createHash } = require("node:crypto");

const MAX_BUFFER = 256 * 1024 * 1024;
const isDoc = (p) => /^(docs|\.crew)\//.test(p) || /\.md$/i.test(p);

function git(root, args, input) {
  const r = spawnSync("git", args, { cwd: root, input, encoding: "utf8", windowsHide: true, maxBuffer: MAX_BUFFER });
  return r.status === 0 ? r.stdout : null;
}

const split = (out) => (out || "").split("\0").filter(Boolean);

// Blob ids of files whose working copy differs from the index, or that git
// does not track yet, hashed from disk.
function hashFromDisk(root, paths) {
  if (!paths.length) return {};
  const out = git(root, ["hash-object", "--stdin-paths"], paths.join("\n") + "\n");
  if (out === null) return null;
  const ids = out.trim().split("\n");
  return Object.fromEntries(paths.map((p, i) => [p, ids[i]]));
}

// Null outside a git repository: there is nothing stable to compare.
function fingerprint(root) {
  const staged = git(root, ["ls-files", "-s", "-z"]);
  if (staged === null) return null;
  const blobs = {};
  for (const entry of split(staged)) {
    const [meta, path] = entry.split("\t");
    if (!isDoc(path)) blobs[path] = meta.split(" ")[1];
  }
  const changed = split(git(root, ["ls-files", "-m", "-z"])).filter((p) => !isDoc(p));
  const deleted = new Set(split(git(root, ["ls-files", "-d", "-z"])));
  const untracked = split(git(root, ["ls-files", "-o", "--exclude-standard", "-z"])).filter((p) => !isDoc(p));
  const disk = hashFromDisk(root, [...changed, ...untracked].filter((p) => !deleted.has(p)));
  if (disk === null) return null;
  for (const p of deleted) delete blobs[p];
  Object.assign(blobs, disk);
  const lines = Object.keys(blobs).sort().map((p) => `${p} ${blobs[p]}`);
  return createHash("sha256").update(lines.join("\n")).digest("hex").slice(0, 16);
}

module.exports = { fingerprint, isDoc };
