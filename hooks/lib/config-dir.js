// Locating crew.json is separate from interpreting it: config.js stays the
// single interpreter, this only answers "which directory governs here".
const { existsSync } = require("node:fs");
const { join, dirname } = require("node:path");

// Walk up from startDir (at most 30 levels or the filesystem root).
function configDir(startDir) {
  let dir = startDir;
  for (let i = 0; i < 30 && dir; i++) {
    if (existsSync(join(dir, "crew.json"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

module.exports = { configDir };
