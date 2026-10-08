// Shape check of a work item against its effective standard (lib/standards).
// Returns human-readable problems; an empty list means the item conforms.
// Content checks only — whether a problem blocks, warns or stays silent is the
// caller's decision (guard-shape.js applies crew.json policy).
const { sections, firstTable, TOTAL_ROW, same } = require("./standards");

function headerFields(content) {
  const head = content.split(/^##\s/m)[0];
  return [...head.matchAll(/^\s*-\s+\*\*([^:*]+):\*\*/gm)].map((m) => m[1].trim());
}

function tableProblems(name, body, expected, total) {
  const out = [];
  const table = firstTable(body);
  if (!table) return [`section "${name}" has no table (expected columns: ${expected.join(" | ")})`];
  const got = table.columns;
  const sameShape = got.length === expected.length && got.every((c, i) => same(c, expected[i]));
  if (!sameShape) {
    out.push(`table "${name}" has columns ${got.join(" | ")}; the standard is ${expected.join(" | ")}`);
  }
  if (total && /^estimation$/i.test(name)) {
    const filled = table.rows.filter((r) => (r[0] || "").replace(/[\s*-]/g, "") !== "");
    const hasTotal = filled.some((r) => TOTAL_ROW.test(r[0] || ""));
    if (filled.length && !hasTotal) out.push(`table "${name}" has no **Total** row`);
  }
  return out;
}

function problems(content, std) {
  if (!content || !std) return [];
  const text = content.replace(/\r\n/g, "\n");
  const out = [];
  const fields = headerFields(text);
  for (const field of std.header) {
    if (!fields.some((f) => same(f, field))) out.push(`header field "${field}" is missing`);
  }
  const present = sections(text);
  for (const name of std.sections) {
    if (!present.some((s) => same(s.name, name))) out.push(`section "## ${name}" is missing`);
  }
  for (const [name, columns] of Object.entries(std.tables)) {
    const s = present.find((x) => same(x.name, name));
    if (s) out.push(...tableProblems(s.name, s.body, columns, std.total));
  }
  for (const [pattern, columns] of Object.entries(std.optionalTables)) {
    const s = present.find((x) => new RegExp(`^(${pattern})$`, "i").test(x.name));
    if (s) out.push(...tableProblems(s.name, s.body, columns, std.total));
  }
  return out;
}

module.exports = { problems, headerFields };
