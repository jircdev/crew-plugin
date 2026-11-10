// What a repository recorded, as rows for factory's import_repo_hours and the
// requirements to save first with upsert_requirement. See lib/repo-hours.js
// for what each row carries and what never leaves the file.
const { readFileSync } = require("node:fs");
const { createHash } = require("node:crypto");
const { join, relative, dirname, resolve, basename } = require("node:path");
const { git, posix, walk, stamp, hoursOf, blame, tableRows, milestoneOf, UNCOMMITTED, ITEM, TOTAL_ROW } = require("./repo-hours");

const MAX_CODE = 60;

// Business code of a work item, unique in the project: R:<plan>/<NNN> for a
// requirement, S:<feature>/<NNN> for a story.
function codeOf(rel) {
  const kind = rel.startsWith("docs/stories/") ? "S" : "R";
  const plan = dirname(rel).split("/").slice(2).join("/") || "-";
  const code = `${kind}:${plan}/${basename(rel).slice(0, 3)}`;
  if (code.length <= MAX_CODE) return code;
  const hash = createHash("sha256").update(rel).digest("hex").slice(0, 6);
  return `${kind}:${plan.slice(0, MAX_CODE - 13)}~${hash}/${basename(rel).slice(0, 3)}`;
}

function readItem(root, file, repo, notes) {
  const rel = posix(relative(root, file));
  const text = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const table = tableRows(text);
  if (!table) return null;
  const authors = blame(root, rel);
  const milestones = [];
  const rows = [];
  table.rows.forEach((row, index) => {
    const get = (field) => (table.at[field] === null || table.at[field] === undefined ? "" : row.cells[table.at[field]] || "");
    if (TOTAL_ROW.test(row.cells[0] || "")) return;
    const milestone = milestoneOf(row.cells[0] || "", index + 1);
    // A code repeated in the same table would make the requirement invalid.
    if (milestones.some((m) => m.code === milestone.code)) milestone.code = `${milestone.code}#${index + 1}`;
    milestones.push({ code: milestone.code, title: milestone.title.slice(0, 200), estimatedHours: hoursOf(get("est")) });
    const start = stamp(get("started"));
    const end = stamp(get("finished"), start && start.iso.slice(0, 10));
    if (!start || !end) return;
    const author = authors[row.n];
    if (!author || !author.email || UNCOMMITTED.test(author.commit)) return void notes.uncommitted++;
    if (start.offsetGuessed || end.offsetGuessed) notes.offsetGuessed++;
    rows.push({
      milestone: milestone.code, start: start.iso, end: end.iso,
      actualHours: hoursOf(get("actual")), actualAiHours: hoursOf(get("actualAi")),
      authorEmail: author.email, commit: author.commit,
    });
  });
  const title = ((text.match(/^#\s+(.+)$/m) || [])[1] || rel).trim().slice(0, 200);
  return {
    requirement: { path: rel, code: codeOf(rel), externalKey: `${repo}:${rel}`, title, milestones },
    file: { path: rel, kind: "work_item", rows },
  };
}

// The first two times of the Duration line, on the entry's date.
function readWorkLog(root, file, items, notes) {
  const rel = posix(relative(root, file));
  const text = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const date = (text.match(/\*\*(?:Date|Fecha)\*\*:?\s*(\d{4}-\d{2}-\d{2})/i) || [])[1];
  const duration = (text.match(/\*\*(?:Duration|Duración)\*\*:?\s*(.+)$/im) || [])[1] || "";
  const times = [...duration.matchAll(/(?:\d{4}-\d{2}-\d{2}\s+)?\d{1,2}:\d{2}(?:\s*(?:Z|[+-]\d{2}(?::?\d{2})?))?/g)].map((m) => m[0]);
  const start = times[0] && stamp(times[0], date);
  let end = times[1] && stamp(times[1], start && start.iso.slice(0, 10));
  if (!start || !end) return null;
  if (Date.parse(end.iso) <= Date.parse(start.iso)) {
    end = { ...end, iso: new Date(Date.parse(end.iso) + 86400000).toISOString() };
  }
  const added = git(root, ["log", "--diff-filter=A", "--follow", "--format=%H%x09%ae", "--", rel]).trim().split("\n").pop() || "";
  const [commit, email] = added.split("\t");
  if (!commit || !email) return void notes.uncommitted++;
  const links = [...text.matchAll(/\]\(([^)#\s]+\.md)/g)]
    .map((m) => posix(relative(root, resolve(dirname(file), m[1]))))
    .filter((p) => items.has(p));
  const linked = [...new Set(links)];
  return {
    path: rel, kind: "work_log", linkedPath: linked.length === 1 ? linked[0] : null,
    rows: [{ start: start.iso, end: end.iso, authorEmail: email, commit }],
  };
}

function readRepository(root, repo) {
  const notes = { uncommitted: 0, offsetGuessed: 0 };
  const itemFiles = [join(root, "docs", "stories"), join(root, "docs", "requirements")]
    .flatMap((dir) => walk(dir, (name) => ITEM.test(name)));
  const items = itemFiles.map((f) => readItem(root, f, repo, notes)).filter(Boolean);
  const known = new Set(items.map((i) => i.requirement.path));
  const logs = walk(join(root, "docs", "work"), (name) => /\.md$/i.test(name) && !/^readme\.md$/i.test(name))
    .map((f) => readWorkLog(root, f, known, notes)).filter(Boolean);
  return { requirements: items.map((i) => i.requirement), files: [...items.map((i) => i.file), ...logs], notes };
}

module.exports = { readRepository, codeOf };
