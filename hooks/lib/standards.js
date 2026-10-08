// Conformance resolver: the EFFECTIVE standard for a work item. One rule, in
// this order:
//
//   1. The project's own template wins. It lives where the scaffold put it —
//      docs/<stories|requirements>/README.md, the fenced markdown block under
//      the "… template" heading. A project that translated or reshaped its
//      template has, by doing so, declared its standard.
//   2. Where the project has no template, the plugin's scaffolded template is
//      the fallback — parsed from templates/docs/, never restated here, so the
//      plugin keeps exactly one source for its own standard.
//   3. Deviations the project declared in docs/DEVIATIONS.md (crew:standard
//      block) are applied on top. A line without a rationale is ignored and
//      reported: an undocumented exception is not an exception.
//
// Consumed by the shape guard (hooks/guard-shape.js) and by the planning
// craft through scripts/conformance.js. Pure reads; anything unreadable
// resolves to null and callers fail open.
const { readFileSync, existsSync } = require("node:fs");
const { join, dirname, basename } = require("node:path");
const { findRoot } = require("./ceilings");
const { readBlock } = require("./deviation-lines");

const KINDS = { requirement: "requirements", story: "stories" };
// Tables a work item may carry even when its own template omits them: a story
// is authored without estimation, and whoever executes adds the table at
// planning. Its shape is still the canonical one, taken from the requirement
// template.
const SHARED_TABLES = ["Estimation", "Verification|Verificación"];
const TOTAL_ROW = /^\**\s*totals?\s*\**$/i;

function kindOfPath(path) {
  const p = String(path || "").replace(/\\/g, "/");
  const m = p.match(/docs\/(stories|requirements)\/.+\.md$/i);
  if (!m || /^readme\.md$/i.test(basename(p))) return null;
  return m[1].toLowerCase() === "stories" ? "story" : "requirement";
}

function cells(line) {
  return line.split("|").slice(1, -1).map((c) => c.trim());
}

// Sections of a markdown body as [{ name, body }], split on level-2 headings.
function sections(markdown) {
  const out = [];
  const parts = markdown.split(/^##\s+(.+?)\s*$/m);
  for (let i = 1; i < parts.length; i += 2) out.push({ name: parts[i].trim(), body: parts[i + 1] || "" });
  return out;
}

function firstTable(body) {
  const lines = body.split("\n").filter((l) => /^\s*\|/.test(l));
  if (lines.length < 2) return null;
  const rows = lines.slice(2).map(cells);
  return { columns: cells(lines[0]), rows };
}

function parseTemplate(markdown) {
  const fence = markdown.match(/^#{2,3}[^\n]*template[^\n]*\n[\s\S]*?```markdown\r?\n([\s\S]*?)\r?\n```/im);
  if (!fence) return null;
  const body = fence[1].replace(/\r\n/g, "\n");
  const header = [...body.matchAll(/^- \*\*([^:*]+):\*\*/gm)].map((m) => m[1].trim());
  const tables = {};
  let total = false;
  const names = [];
  for (const s of sections(body)) {
    names.push(s.name);
    const t = firstTable(s.body);
    if (!t) continue;
    tables[s.name] = t.columns;
    if (/^estimation$/i.test(s.name)) total = t.rows.some((r) => TOTAL_ROW.test(r[0] || ""));
  }
  if (!header.length && !names.length) return null;
  return { header, sections: names, tables, total };
}

function readTemplate(file) {
  try {
    return existsSync(file) ? parseTemplate(readFileSync(file, "utf8")) : null;
  } catch {
    return null;
  }
}

// <!-- crew:standard
// requirement omit section Verification      # rationale
// story omit header Branch                    # rationale
// requirement columns Estimation Milestone | Est. hours | Actual hours   # rationale
// -->
function deviations(root) {
  const applied = [];
  const invalid = [];
  try {
    for (const entry of readBlock(root, "standard")) {
      const { raw: line, rule, reason } = entry;
      if (entry.expired) { invalid.push(`${line} (expired ${entry.expires})`); continue; }
      const m = rule.trim().match(/^(requirement|story)\s+(omit\s+(section|header)|columns)\s+(.+)$/i);
      if (!m || !reason) { invalid.push(line); continue; }
      const kind = m[1].toLowerCase();
      if (/^columns$/i.test(m[2])) {
        const parts = m[4].match(/^(\S+)\s+(.+)$/);
        if (!parts) { invalid.push(line); continue; }
        const columns = parts[2].split("|").map((c) => c.trim()).filter(Boolean);
        applied.push({ kind, action: "columns", target: parts[1], columns, reason });
      } else {
        applied.push({ kind, action: "omit", scope: m[3].toLowerCase(), target: m[4].trim(), reason });
      }
    }
  } catch {
    // unreadable deviations behave like none declared
  }
  return { applied, invalid };
}

const same = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

// Effective standard for `path`, or null when the path is not a work item or
// no template can be read at all.
function resolve(path, pluginRoot) {
  const kind = kindOfPath(path);
  if (!kind) return null;
  const root = findRoot(dirname(path)) || dirname(path);
  const plugin = pluginRoot || join(__dirname, "..", "..");
  const own = readTemplate(join(root, "docs", KINDS[kind], "README.md"));
  const crew = readTemplate(join(plugin, "templates", "docs", KINDS[kind], "README.md"));
  const base = own || crew;
  if (!base) return null;
  const canonical = readTemplate(join(plugin, "templates", "docs", "requirements", "README.md")) || { tables: {} };

  const std = {
    kind,
    source: own ? "project" : "crew",
    template: own ? join(root, "docs", KINDS[kind], "README.md") : join(plugin, "templates", "docs", KINDS[kind], "README.md"),
    header: [...base.header],
    sections: [...base.sections],
    tables: { ...base.tables },
    optionalTables: {},
    total: base.total || !!canonical.total,
    deviations: [],
    invalid: [],
  };
  for (const alt of SHARED_TABLES) {
    const known = Object.keys(std.tables).some((n) => new RegExp(`^(${alt})$`, "i").test(n));
    const src = Object.keys(canonical.tables).find((n) => new RegExp(`^(${alt})$`, "i").test(n));
    if (!known && src) std.optionalTables[alt] = canonical.tables[src];
  }

  const { applied, invalid } = deviations(root);
  std.invalid = invalid;
  for (const d of applied.filter((x) => x.kind === kind)) {
    if (d.action === "omit" && d.scope === "header") std.header = std.header.filter((h) => !same(h, d.target));
    if (d.action === "omit" && d.scope === "section") {
      std.sections = std.sections.filter((s) => !same(s, d.target));
      for (const n of Object.keys(std.tables)) if (same(n, d.target)) delete std.tables[n];
      for (const n of Object.keys(std.optionalTables)) if (new RegExp(`^(${n})$`, "i").test(d.target)) delete std.optionalTables[n];
    }
    if (d.action === "columns") {
      const n = Object.keys(std.tables).find((x) => same(x, d.target));
      if (n) std.tables[n] = d.columns;
      const o = Object.keys(std.optionalTables).find((x) => new RegExp(`^(${x})$`, "i").test(d.target));
      if (o) std.optionalTables[o] = d.columns;
    }
    std.deviations.push(d);
  }
  return std;
}

module.exports = { resolve, kindOfPath, parseTemplate, sections, firstTable, TOTAL_ROW, same };
