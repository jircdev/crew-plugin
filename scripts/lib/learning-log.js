// Learning log: where a change went wrong, recorded so the retro can tell a
// repeated failure from a one-off. Local to the machine, under the same rules
// security-compliance set for catalog usage (hooks/lib/usage.js): one line per
// event with the DATE, closed values only, no free text, never versioned
// (.crew/.gitignore), 90 days of retention. Nothing about the code or the
// conversation is stored. Security-compliance approved it (2026-10-13) for
// as long as it stays on the machine: any export or upload (factory, CI, a
// team view) needs its own ruling and a consent flag, because dated failures
// per developer become data about how each person performs.
const { readFileSync, writeFileSync, mkdirSync } = require("node:fs");
const { join } = require("node:path");
const { guardIgnore, catalog, RETENTION_DAYS } = require("../../hooks/lib/usage");

// The steps of the execution craft (skills/execution/SKILL.md), per kind of work.
const STAGES = {
  defect: ["classify", "context", "reproduce", "cause", "fix", "verify", "evidence"],
  feature: ["classify", "context", "criteria", "design", "implement", "test", "validate", "evidence"],
  refactor: ["classify", "context", "pin", "restructure", "verify", "evidence"],
  migration: ["classify", "context", "plan-back", "rehearse", "verify-data", "destructive", "evidence"],
};

const file = (root) => join(root, ".crew", "learning.jsonl");
const fresh = (at, now = Date.now()) => Date.parse(at) >= now - RETENTION_DAYS * 86400000;

// origin: "method" (a crew procedure), "role:<catalog role>" or
// "stack:<area>" (the project's stack specification for that area).
function validOrigin(origin, areas) {
  if (origin === "method") return true;
  const [type, name] = String(origin).split(":");
  if (type === "role") return catalog().agent.has(name);
  if (type === "stack") return areas.includes(name) || name === "undeclared";
  return false;
}

// Returns the problem with the entry, or null once it is written.
function record(root, { kind, stage, origin }, areas = []) {
  if (!Object.hasOwn(STAGES, kind)) return `kind must be one of ${Object.keys(STAGES).join(", ")}`;
  if (!STAGES[kind].includes(stage)) return `stage for ${kind} must be one of ${STAGES[kind].join(", ")}`;
  if (!validOrigin(origin, areas)) return `origin must be method, role:<catalog role> or stack:<declared area | undeclared>`;
  const entry = { at: new Date().toISOString().slice(0, 10), kind, stage, origin };
  mkdirSync(join(root, ".crew"), { recursive: true });
  guardIgnore(root);
  const kept = read(root).map((e) => JSON.stringify(e));
  writeFileSync(file(root), [...kept, JSON.stringify(entry)].join("\n") + "\n");
  return null;
}

function read(root) {
  try {
    return readFileSync(file(root), "utf8").split("\n").filter(Boolean)
      .map((l) => { try { return JSON.parse(l); } catch { return null; } })
      .filter((e) => e && fresh(e.at));
  } catch {
    return [];
  }
}

module.exports = { STAGES, record, read, validOrigin };
