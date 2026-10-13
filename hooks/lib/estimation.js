// The ## Estimation table of a work item, read by column NAME so the readers
// (closure gate, timestamp guard, metrics, work state) agree on what each cell
// means whatever the table's width.
//
// Two shapes are understood:
//   · current — Milestone | Est. hours | Est. AI hours | Started | Finished |
//     Actual hours | Actual AI hours | Notes. Person-pace estimate and AI
//     estimate side by side, real human and real AI hours side by side.
//   · legacy  — Milestone | Est. hours | Started | Finished | Actual hours |
//     Notes, the only shape before the AI columns. A table with no AI column is
//     read positionally exactly as before, so translated or reshaped project
//     tables keep working untouched.
// The legacy shape is accepted until the next minor version (see CHANGELOG).
const { sections, firstTable, TOTAL_ROW, LEGACY_COLUMNS } = require("./standards");

const AI = /\b(ai|ia)\b/i;
const MATCH = {
  estAi: (h) => AI.test(h) && /^est/i.test(h),
  actualAi: (h) => AI.test(h) && !/^est/i.test(h),
  est: (h) => !AI.test(h) && /^est/i.test(h),
  started: (h) => /^(started|inicio|comienzo)/i.test(h),
  finished: (h) => /^(finished|fin)/i.test(h),
  actual: (h) => !AI.test(h) && /^(actual|real|horas reales)/i.test(h),
  notes: (h) => /^(notes|notas)/i.test(h),
};
const LEGACY_AT = { milestone: 0, est: 1, started: 2, finished: 3, actual: 4, notes: 5 };
const CURRENT_AT = { milestone: 0, est: 1, estAi: 2, started: 3, finished: 4, actual: 5, actualAi: 6, notes: 7 };

// Column index per field, or null for a field the table does not carry.
function layout(columns) {
  const hasAi = columns.some((c) => AI.test(c));
  if (!hasAi) return { ...LEGACY_AT, estAi: null, actualAi: null, ai: false };
  const at = { milestone: 0, ai: true };
  for (const field of Object.keys(CURRENT_AT).filter((f) => f !== "milestone")) {
    const i = columns.findIndex((c) => MATCH[field](c));
    at[field] = i >= 0 ? i : CURRENT_AT[field] < columns.length ? CURRENT_AT[field] : null;
  }
  return at;
}

function rowOf(cells, at) {
  const get = (field) => (at[field] === null || at[field] === undefined ? undefined : cells[at[field]] || "");
  return {
    cells,
    milestone: cells[0] || "",
    est: get("est"),
    estAi: get("estAi"),
    started: get("started"),
    finished: get("finished"),
    actual: get("actual"),
    actualAi: get("actualAi"),
    notes: get("notes"),
    total: TOTAL_ROW.test(cells[0] || ""),
  };
}

// { columns, ai, rows } for the first table under ## Estimation, or null when
// the section is missing. Blank rows (only pipes, dashes, spaces) are dropped.
function estimationTable(content) {
  const text = String(content || "").replace(/\r\n/g, "\n");
  const section = sections(text).find((s) => /^estimation$/i.test(s.name));
  if (!section) return null;
  const table = firstTable(section.body);
  if (!table) return { columns: [], ai: false, rows: [] };
  const at = layout(table.columns);
  const rows = table.rows.filter((r) => r.join("").replace(/[|\s-]/g, "") !== "").map((r) => rowOf(r, at));
  return { columns: table.columns, ai: at.ai, rows };
}

// Hours in a cell ("1.5", "1,5", "2 h"); null when the cell holds no number.
function hours(cell) {
  const n = parseFloat(String(cell || "").replace(",", "."));
  return Number.isNaN(n) ? null : n;
}

module.exports = { estimationTable, hours, layout, LEGACY_COLUMNS };
