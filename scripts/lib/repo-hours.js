// Reads the hours a repository recorded, for factory's import_repo_hours
// tool: the Started/Finished of each milestone in the ## Estimation tables
// of stories and requirements, and the Duration of each work log, each row
// with the author of the commit that wrote it (git blame for a table row,
// the commit that added the file for a work log).
//
// Deterministic: two reads of the same commit give the same rows. Nothing
// else leaves the file: no Notes cell, no prose, no commit message, no
// commit time.
const { readdirSync, existsSync } = require("node:fs");
const { join, sep } = require("node:path");
const { execFileSync } = require("node:child_process");
const { layout } = require("../../hooks/lib/estimation");
const { TOTAL_ROW } = require("../../hooks/lib/standards");

const SECTION = /^(estimation|estimaci[oó]n|hitos)$/i;
const ITEM = /^\d{3}-.+\.md$/;
const CODE = /^\**\s*([A-Z]{1,4}-?\d+[a-z]?)\b[\s.:—-]*(.*)$/;

function git(cwd, args) {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], windowsHide: true, maxBuffer: 64 << 20 });
  } catch {
    return "";
  }
}

const posix = (p) => p.split(sep).join("/");
const cells = (line) => line.split("|").slice(1, -1).map((c) => c.trim());

function walk(dir, keep) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p, keep) : keep(e.name) ? [p] : [];
  });
}

// "+03:00" style offset of this machine at a given local date and time.
function machineOffset(date, time) {
  const minutes = -new Date(`${date}T${time}:00`).getTimezoneOffset();
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(minutes);
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

function normalOffset(tz) {
  if (!tz) return null;
  if (tz === "Z") return "+00:00";
  if (/^[+-]\d{2}$/.test(tz)) return `${tz}:00`;
  if (/^[+-]\d{4}$/.test(tz)) return `${tz.slice(0, 3)}:${tz.slice(3)}`;
  return tz;
}

// An ISO instant from "YYYY-MM-DD HH:MM [offset]"; null for anything else
// (a date alone, "sin registro", "(bloque)", a dash).
function stamp(cell, dateHint) {
  const m = String(cell || "").match(/(?:(\d{4}-\d{2}-\d{2})[ T])?(\d{1,2}:\d{2})\s*(Z|[+-]\d{2}(?::?\d{2})?)?/);
  const date = m && (m[1] || dateHint);
  if (!m || !date) return null;
  const time = m[2].padStart(5, "0");
  const iso = `${date}T${time}:00${normalOffset(m[3]) || machineOffset(date, time)}`;
  return Number.isNaN(Date.parse(iso)) ? null : { iso, offsetGuessed: !m[3] };
}

function hoursOf(cell) {
  const n = parseFloat(String(cell || "").replace(",", "."));
  return Number.isNaN(n) ? null : n;
}

// Author email and commit of every line of a file, from git blame.
function blame(root, file) {
  const out = git(root, ["blame", "--line-porcelain", "--", file]);
  const lines = [];
  let current = {};
  for (const line of out.split("\n")) {
    const head = line.match(/^([0-9a-f]{40}) \d+ (\d+)/);
    if (head) current = { commit: head[1], line: Number(head[2]) };
    else if (line.startsWith("author-mail ")) current.email = line.slice(12).replace(/[<>]/g, "").trim();
    else if (line.startsWith("\t")) lines[current.line] = { ...current };
  }
  return lines;
}

const UNCOMMITTED = /^0{40}$/;

// The estimation rows of a work item, each with its line number.
function tableRows(text) {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => /^##\s+/.test(l) && SECTION.test(l.replace(/^##\s+/, "").trim()));
  if (start < 0) return null;
  const table = [];
  for (let i = start + 1; i < lines.length && !/^##\s+/.test(lines[i]); i += 1) {
    if (/^\s*\|/.test(lines[i])) table.push({ n: i + 1, cells: cells(lines[i]) });
    else if (table.length) break;
  }
  if (table.length < 3) return null;
  const at = layout(table[0].cells);
  return { at, rows: table.slice(2) };
}

function milestoneOf(cell, ordinal) {
  const text = cell.replace(/\*\*/g, "").trim();
  const m = text.match(CODE);
  return m ? { code: m[1], title: m[2].trim() || m[1] } : { code: `#${ordinal}`, title: text || `#${ordinal}` };
}

module.exports = { git, posix, walk, stamp, hoursOf, blame, tableRows, milestoneOf, UNCOMMITTED, ITEM, TOTAL_ROW };
