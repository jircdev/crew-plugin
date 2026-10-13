// Aggregates delivery-evaluation runs into one row per task and variant, and
// renders the comparison a maintainer reads: crew against no crew in one
// result file, and optionally this result against an earlier archived one.
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

function aggregate(runs) {
  const groups = {};
  for (const r of runs) (groups[`${r.task}|${r.variant}`] ||= []).push(r);
  return Object.entries(groups).map(([key, rs]) => {
    const [task, variant] = key.split('|');
    return {
      task, variant, runs: rs.length,
      acceptance: mean(rs.map((r) => (r.acceptance.total ? r.acceptance.passed / r.acceptance.total : 0))),
      regression: mean(rs.map((r) => (r.regression ? 1 : 0))),
      interventions: mean(rs.map((r) => r.interventions)),
      minutes: mean(rs.map((r) => r.durationMs / 60000)),
      cost: mean(rs.map((r) => r.usage.cost)),
      tokens: mean(rs.map((r) => r.usage.input + r.usage.output + r.usage.cacheRead + r.usage.cacheWrite)),
      errors: rs.filter((r) => r.error).length,
    };
  }).sort((a, b) => (a.task + a.variant < b.task + b.variant ? -1 : 1));
}

const pct = (x) => `${Math.round(x * 100)}%`;
const num = (x, d = 2) => x.toFixed(d);

function table(rows) {
  const head = '| Task | Variant | Runs | Acceptance | Own suite green | Interventions | Minutes | Cost (USD) | Tokens | Errors |\n|---|---|---|---|---|---|---|---|---|---|';
  const body = rows.map((r) => `| ${r.task} | ${r.variant} | ${r.runs} | ${pct(r.acceptance)} | ${pct(r.regression)} | ${num(r.interventions, 1)} | ${num(r.minutes, 1)} | ${num(r.cost)} | ${Math.round(r.tokens)} | ${r.errors} |`);
  return [head, ...body].join('\n');
}

// crew minus bare per task; positive acceptance and negative cost favor crew.
function deltas(rows) {
  const by = Object.fromEntries(rows.map((r) => [`${r.task}|${r.variant}`, r]));
  const tasks = [...new Set(rows.map((r) => r.task))];
  const lines = tasks.filter((t) => by[`${t}|crew`] && by[`${t}|bare`]).map((t) => {
    const c = by[`${t}|crew`], b = by[`${t}|bare`];
    return `| ${t} | ${pct(c.acceptance - b.acceptance)} | ${num(c.interventions - b.interventions, 1)} | ${num(c.minutes - b.minutes, 1)} | ${num(c.cost - b.cost)} |`;
  });
  if (!lines.length) return '';
  return ['| Task | Acceptance (crew − bare) | Interventions | Minutes | Cost (USD) |', '|---|---|---|---|---|', ...lines].join('\n');
}

function render(result, previous) {
  const rows = aggregate(result.runs);
  const out = [`# Delivery evaluation — crew ${result.meta.pluginVersion}`, '',
    `Model: ${result.meta.model || 'default'} · Runs per task and variant: ${result.meta.runs} · Date: ${result.meta.date}`, '',
    table(rows)];
  const d = deltas(rows);
  if (d) out.push('', '## Crew against no crew', '', d);
  if (previous) {
    out.push('', `## Against crew ${previous.meta.pluginVersion} (${previous.meta.date})`, '', table(aggregate(previous.runs)));
  }
  return out.join('\n') + '\n';
}

module.exports = { aggregate, render };
