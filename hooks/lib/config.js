// Shared crew.json reader for every guard. Single rule: no crew.json (or an
// unreadable/invalid one) means exact v0.19.1 behavior — loadConfig returns
// null and each guard falls back to inferring by structure, with quality
// enforcing. The new defaults (advise, metrics on, ...) are NOT plugin
// defaults: they exist only as values bin/init-project.sh writes explicitly
// into the crew.json of new projects. Absent fields stay legacy-equivalent.
const { readFileSync, existsSync } = require("node:fs");
const { join, dirname } = require("node:path");

const QUALITY_MODES = new Set(["advise", "enforce", "off"]);

// Walk up from startDir looking for crew.json (stops at filesystem root or
// after 30 levels). Returns the parsed, normalized config object, or null.
function loadConfig(startDir) {
  try {
    let dir = startDir;
    for (let i = 0; i < 30 && dir; i++) {
      const candidate = join(dir, "crew.json");
      if (existsSync(candidate)) return normalize(readFileSync(candidate, "utf8"));
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  } catch {
    // fall through — unreadable config behaves like no config
  }
  return null;
}

function normalize(raw) {
  try {
    const parsed = JSON.parse(raw.replace(/^﻿/, ""));
    if (!parsed || typeof parsed !== "object") return null;
    return {
      mode: parsed.mode === "solo" ? "solo" : "team",
      metrics: parsed.metrics === true,
      quality: QUALITY_MODES.has(parsed.quality) ? parsed.quality : "enforce",
      ceilings:
        parsed.ceilings && typeof parsed.ceilings === "object" ? parsed.ceilings : {},
    };
  } catch {
    return null; // invalid JSON ⇒ legacy behavior, never block
  }
}

// Convenience for PreToolUse guards: resolve the config that governs an
// edited file (walk up from the file), falling back to the session cwd.
function configFor(filePath, cwd) {
  const fromFile = filePath ? loadConfig(dirname(filePath)) : null;
  if (fromFile) return fromFile;
  return cwd ? loadConfig(cwd) : null;
}

module.exports = { loadConfig, configFor };
