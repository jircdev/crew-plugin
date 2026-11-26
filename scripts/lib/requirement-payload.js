// A requirement file as factory's requirement entry takes it: code, title,
// plan status, the milestones of its ## Estimation table with both estimates
// (person pace and AI), the cost center and where the file lives. Pure over
// the file text: no network, no git.
//
// The plan status comes from the header. `Draft` (or `Proposed`) is a plan
// nobody approved yet; the person's approval is the move to `Ready` (or
// `Approved`), and the next commit carries it to factory. A status this
// reader does not know is left out, so factory keeps the one it has.
const { basename } = require("node:path");
const { factorySkipped } = require("../../hooks/lib/factory-skip");
const { header } = require("./plan-items");
const { codeOf } = require("./repo-hours-read");
const { tableRows, milestoneRows, hoursOf, stamp } = require("./repo-hours");

const REQUIREMENT = /^docs\/requirements\/(?:.+\/)?\d{3}-[^/]+\.md$/i;
const MAX_BODY = 100000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUS = [
  [/^(draft|proposed|propuest[oa]|borrador)$/i, "proposed"],
  [/^(ready|approved|aprobad[oa]|list[oa])$/i, "approved"],
  [/^(in progress|en curso|en progreso)$/i, "in_progress"],
  [/^(delivered|validated|entregad[oa]|validad[oa])$/i, "delivered"],
  [/^(closed|cerrad[oa])$/i, "closed"],
];

const isRequirement = (rel) => REQUIREMENT.test(rel);

const skipped = factorySkipped;

function planStatus(text) {
  const word = header(text, "Status|Estado").split(/\s*[—(,]/)[0].trim();
  const hit = STATUS.find(([rx]) => rx.test(word));
  return hit ? hit[1] : undefined;
}

// A table without the AI column may carry the figure in Notes ("AI est. 0.5 h").
function aiHours(get) {
  const own = hoursOf(get("estAi"));
  if (own !== null) return own;
  const note = get("notes").match(/\b(?:AI|IA) est\.?:?\s*([\d.,]+)/i);
  return note ? hoursOf(note[1]) : null;
}

function milestoneStatus(get) {
  const started = stamp(get("started"));
  if (!started) return "pending";
  return stamp(get("finished"), started.iso.slice(0, 10)) ? "done" : "in_progress";
}

function milestones(text) {
  const table = tableRows(text);
  if (!table) return [];
  return milestoneRows(table)
    .filter((m) => m.row.cells.join("").replace(/[\s*—-]/g, "") !== "")
    .map((m) => ({
      code: m.code.slice(0, 60),
      title: m.title || m.code,
      estimatedHours: hoursOf(m.get("est")),
      estimatedAiHours: aiHours(m.get),
      status: milestoneStatus(m.get),
    }));
}

// The cost center named in the file's own header, else the repository's
// default (crew.json `factory.subcenter`); an id travels as an id.
function costCenter(text, factory) {
  const own = header(text, "Subcenter|Subcentro|Cost center|Centro de costos?|Package|Paquete").replace(/[`*«»"]/g, "").trim();
  const value = own || (factory && factory.subcenter) || "";
  if (!value) return {};
  return UUID.test(value) ? { costCenterId: value } : { costCenterName: value.slice(0, 200) };
}

// { root, rel, text, factory, repository } → the body of POST /activity/requirements.
function payloadOf({ root, rel, text, factory, repository }) {
  const clean = String(text || "").replace(/\r\n/g, "\n");
  const status = planStatus(clean);
  return {
    projectId: factory.projectId,
    code: codeOf(rel),
    externalKey: `${basename(root)}:${rel}`,
    title: ((clean.match(/^#\s+(.+)$/m) || [])[1] || rel).trim().slice(0, 200),
    body: clean.slice(0, MAX_BODY),
    ...(status ? { status } : {}),
    ...costCenter(clean, factory),
    milestones: milestones(clean),
    repository,
  };
}

module.exports = { isRequirement, skipped, planStatus, milestones, costCenter, payloadOf };
