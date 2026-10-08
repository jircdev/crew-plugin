// The record of what crew installed into a project: .crew/install-state.json.
// It exists so repair and uninstall touch ONLY files crew wrote, and so the
// doctor can tell "missing" from "edited by the project" (an edited scaffold is
// the project's file now and is never overwritten or deleted).
const { readFileSync, writeFileSync, existsSync, mkdirSync } = require("node:fs");
const { join, dirname } = require("node:path");
const { createHash } = require("node:crypto");

const STATE = join(".crew", "install-state.json");

function sha(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function read(target) {
  try {
    const file = join(target, STATE);
    return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
  } catch {
    return null;
  }
}

function write(target, state) {
  const file = join(target, STATE);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(state, null, 2) + "\n");
}

// Each recorded file as { path, recorded, status }: present (unchanged),
// modified (the project edited it), or missing.
function audit(target, state) {
  return ((state && state.files) || []).map((f) => {
    const full = join(target, f.path);
    if (!existsSync(full)) return { ...f, status: "missing" };
    return { ...f, status: sha(full) === f.sha256 ? "present" : "modified" };
  });
}

module.exports = { STATE, sha, read, write, audit };
