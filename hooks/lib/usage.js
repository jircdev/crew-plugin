// Catalog usage, local and opt-in PER PERSON. Ruling of security-compliance
// (2026-10-07), applied here:
//   · consent is individual: a person enables it in `.crew/local.json`
//     ({"telemetry": true}) or with CREW_TELEMETRY=1 — never through the shared
//     crew.json, which can only forbid it ("telemetry": false);
//   · one line per event — the DATE (no time of day), the kind, and a catalog
//     name; names outside the catalog become "other", so no free text lands;
//   · .crew/ carries its own .gitignore for usage.jsonl, local.json and
//     audit.log, so the log never reaches the repository by accident;
//   · retention: lines older than 90 days are pruned on write and ignored on read.
// Any failure writes nothing.
const { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } = require("node:fs");
const { join } = require("node:path");

const RETENTION_DAYS = 90;
const PLUGIN = join(__dirname, "..", "..");
const IGNORED = ["usage.jsonl", "local.json", "audit.log"];

function catalog() {
  const names = (dir, strip) => {
    try { return readdirSync(join(PLUGIN, dir)).map((n) => n.replace(strip, "")); } catch { return []; }
  };
  return { agent: new Set(names("agents", /\.md$/)), skill: new Set(names("skills", /$/)), command: new Set(names("commands", /\.md$/)) };
}

function enabled(root, cfg) {
  if (cfg && cfg.telemetryForbidden) return false;
  if (process.env.CREW_TELEMETRY === "1") return true;
  try {
    return JSON.parse(readFileSync(join(root, ".crew", "local.json"), "utf8")).telemetry === true;
  } catch {
    return false;
  }
}

const file = (root) => join(root, ".crew", "usage.jsonl");
const fresh = (at, now = Date.now()) => Date.parse(at) >= now - RETENTION_DAYS * 86400000;

function guardIgnore(root) {
  const ignore = join(root, ".crew", ".gitignore");
  const have = existsSync(ignore) ? readFileSync(ignore, "utf8") : "";
  const missing = IGNORED.filter((n) => !have.split(/\r?\n/).includes(n));
  if (missing.length) writeFileSync(ignore, (have && !have.endsWith("\n") ? have + "\n" : have) + missing.join("\n") + "\n");
}

function record(root, kind, rawName) {
  const known = catalog()[kind];
  if (!known) return;
  const name = String(rawName || "").replace(/^crew:/, "").toLowerCase();
  const entry = { at: new Date().toISOString().slice(0, 10), kind, name: known.has(name) ? name : "other" };
  const kept = read(root).map((e) => JSON.stringify(e));
  mkdirSync(join(root, ".crew"), { recursive: true });
  guardIgnore(root);
  writeFileSync(file(root), [...kept, JSON.stringify(entry)].join("\n") + "\n");
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

module.exports = { record, read, enabled, catalog, guardIgnore, RETENTION_DAYS, IGNORED };
