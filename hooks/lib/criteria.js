// Acceptance-criteria coverage for the closure gate (crew.json
// `testing.criteria: true`). A story's numbered criteria are cited by its
// verification rows as `AC<n>` (or `CA<n>` in Spanish) in any cell; a
// criterion no row cites closes with nothing that proves it.
const HEADING = /^##\s+(Acceptance criteria|Criterios de aceptaci[oó]n)\s*$/im;

// Numbers of the criteria in the section, or [] when there is no such section
// (a requirement states goals, not numbered criteria, and is not checked).
function criteria(content) {
  const start = content.search(HEADING);
  if (start === -1) return [];
  const rest = content.slice(start).split("\n").slice(1);
  const end = rest.findIndex((l) => /^##\s/.test(l));
  return (end === -1 ? rest : rest.slice(0, end))
    .map((l) => (l.match(/^\s*(\d+)[.)]\s+\S/) || [])[1])
    .filter(Boolean)
    .map(Number);
}

function cited(rows) {
  const found = new Set();
  for (const cell of rows.flat()) {
    for (const m of cell.matchAll(/\b(?:AC|CA)\s*(\d+)\b/gi)) found.add(Number(m[1]));
  }
  return found;
}

// Criteria numbers no verification row cites.
function uncovered(content, rows) {
  const seen = cited(rows);
  return criteria(content).filter((n) => !seen.has(n));
}

module.exports = { criteria, uncovered };
