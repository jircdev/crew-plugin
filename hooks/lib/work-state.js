// Work in progress, read from the repo — the crew alternative to transcript
// memory. Everything it reports is checkable against git: open milestones
// (Started without Finished), items Delivered and still awaiting validation,
// and verification rows still `planned` on delivered items. No transcript is
// read and nothing is written.
const { readdirSync, readFileSync, statSync, existsSync } = require("node:fs");
const { join, relative } = require("node:path");
const { sections, firstTable, same } = require("./standards");

const MAX_FILES = 600;

function workItems(root) {
  const out = [];
  const walk = (dir) => {
    if (out.length >= MAX_FILES || !existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.md$/i.test(name) && !/^readme\.md$/i.test(name) && out.length < MAX_FILES) out.push(full);
    }
  };
  walk(join(root, "docs", "stories"));
  walk(join(root, "docs", "requirements"));
  return out;
}

function statusOf(text) {
  return ((text.match(/\*\*(?:Status|Estado):\*\*\s*([^\n|]+)/i) || [])[1] || "").trim();
}

function rowsOf(text, pattern) {
  const s = sections(text).find((x) => new RegExp(`^(${pattern})$`, "i").test(x.name));
  const t = s && firstTable(s.body);
  return t ? t.rows.filter((r) => (r[0] || "").replace(/[\s*-]/g, "")) : [];
}

function state(root) {
  const open = [];
  const awaiting = [];
  const planned = [];
  for (const file of workItems(root)) {
    let text;
    try { text = readFileSync(file, "utf8").replace(/\r\n/g, "\n"); } catch { continue; }
    const rel = relative(root, file).replace(/\\/g, "/");
    const status = statusOf(text);
    if (/^closed|^cerrad/i.test(status)) continue;
    for (const r of rowsOf(text, "Estimation")) {
      if (/^\**\s*totals?\s*\**$/i.test(r[0])) continue;
      if (r[2] && r[2] !== "—" && !r[3]) open.push({ file: rel, milestone: r[0], started: r[2] });
    }
    if (same(status, "Delivered")) {
      awaiting.push({ file: rel });
      if (rowsOf(text, "Verification|Verificación").some((r) => /^planned/i.test(r[4] || ""))) planned.push({ file: rel });
    }
  }
  return { open, awaiting, planned };
}

// At most six lines, or [] when there is nothing in flight.
function summary(root) {
  const { open, awaiting, planned } = state(root);
  const lines = [];
  const list = (items, fmt) => items.slice(0, 2).map(fmt).join("; ") + (items.length > 2 ? `; +${items.length - 2} more` : "");
  if (open.length) {
    lines.push(`- Open milestones (${open.length}) — Started without Finished; close each with the real time before starting new work: ` +
      list(open, (o) => `\`${o.file}\` → ${o.milestone} (since ${o.started})`));
  }
  if (awaiting.length) lines.push(`- Delivered, awaiting validation (${awaiting.length}): ` + list(awaiting, (a) => `\`${a.file}\``));
  if (planned.length) lines.push(`- Delivered with verification rows still \`planned\` (${planned.length}): ` + list(planned, (p) => `\`${p.file}\``));
  return lines.slice(0, 6);
}

module.exports = { state, summary, workItems };
