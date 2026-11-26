// Requirement files a commit could not load into factory because factory did
// not answer (~/.crew/requirements/queue.json). Each entry is the repository
// folder, the file's path and a fingerprint of its content — never its text
// and never a token: a retry reads the file again from disk.
const fs = require("node:fs");
const { join, resolve } = require("node:path");
const { createHash } = require("node:crypto");
const { crewHome, restrictToOwner } = require("../../hooks/lib/factory");

const dir = () => join(crewHome(), "requirements");
const file = () => join(dir(), "queue.json");
const key = (p) => (process.platform === "win32" ? resolve(p).toLowerCase() : resolve(p));
const same = (a, root, rel) => key(a.root) === key(root) && a.path === rel;
const fingerprint = (text) => createHash("sha256").update(String(text)).digest("hex").slice(0, 16);

// Read-only: never creates ~/.crew for someone who has not connected.
function read() {
  try {
    const list = JSON.parse(fs.readFileSync(file(), "utf8"));
    return Array.isArray(list) ? list.filter((e) => e && e.root && e.path) : [];
  } catch {
    return [];
  }
}

function write(list) {
  if (!fs.existsSync(dir())) {
    fs.mkdirSync(dir(), { recursive: true, mode: 0o700 });
    try { restrictToOwner(dir(), true); } catch { /* the user profile still protects it */ }
  }
  fs.writeFileSync(file(), JSON.stringify(list, null, 2), { mode: 0o600 });
}

function add(root, rel, text, now = Date.now()) {
  const list = read().filter((e) => !same(e, root, rel));
  list.push({ root: resolve(root), path: rel, hash: fingerprint(text), queuedAt: new Date(now).toISOString() });
  write(list);
}

function remove(root, rel) {
  const list = read();
  const kept = list.filter((e) => !same(e, root, rel));
  if (kept.length !== list.length) write(kept);
}

const waitingIn = (root) => read().filter((e) => key(e.root) === key(root));

module.exports = { read, add, remove, waitingIn, fingerprint };
