// A/B verdict for a proposed change to crew: the delivery evaluation run
// before the change against the run after it. The change is incorporable only
// if no task got worse for the crew variant. Cost is reported and never
// decides: a change that ships more correct software may cost more.
const { aggregate } = require("./eval-report");

// Tolerances: below these, a difference is noise between runs.
const ACCEPTANCE_DROP = 0.001;
const INTERVENTION_RISE = 0.5;

function crewRows(result) {
  return Object.fromEntries(aggregate(result.runs).filter((r) => r.variant === "crew").map((r) => [r.task, r]));
}

function compare(before, after) {
  const a = crewRows(before), b = crewRows(after);
  const rows = Object.keys(a).filter((t) => b[t]).sort().map((task) => {
    const worse = [];
    if (b[task].acceptance < a[task].acceptance - ACCEPTANCE_DROP) worse.push("acceptance");
    if (b[task].regression < a[task].regression) worse.push("own suite");
    if (b[task].interventions >= a[task].interventions + INTERVENTION_RISE) worse.push("interventions");
    return { task, before: a[task], after: b[task], worse };
  });
  const missing = Object.keys(a).filter((t) => !b[t]);
  return { rows, missing, incorporable: rows.length > 0 && !missing.length && rows.every((r) => !r.worse.length) };
}

const pct = (x) => `${Math.round(x * 100)}%`;

function render(result, before, after) {
  const head = `# A/B — crew ${before.meta.pluginVersion} (${before.meta.date}) → ${after.meta.pluginVersion} (${after.meta.date})\n\n` +
    "| Task | Acceptance | Own suite green | Interventions | Cost (USD) | Worse in |\n|---|---|---|---|---|---|";
  const body = result.rows.map((r) =>
    `| ${r.task} | ${pct(r.before.acceptance)} → ${pct(r.after.acceptance)} | ${pct(r.before.regression)} → ${pct(r.after.regression)} | ` +
    `${r.before.interventions.toFixed(1)} → ${r.after.interventions.toFixed(1)} | ${r.before.cost.toFixed(2)} → ${r.after.cost.toFixed(2)} | ${r.worse.join(", ") || "—"} |`);
  const verdict = result.incorporable
    ? "**Verdict: incorporable.** No task got worse for the crew variant. The decision stays with the maintainer."
    : `**Verdict: not incorporable.** ${result.missing.length ? `Tasks missing from the second run: ${result.missing.join(", ")}. ` : ""}` +
      `${result.rows.filter((r) => r.worse.length).map((r) => `${r.task} got worse in ${r.worse.join(", ")}`).join("; ") || ""}`.trim();
  return [head, ...body, "", verdict, ""].join("\n");
}

module.exports = { compare, render };
