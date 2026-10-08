# Migration to 0.28 — reviews you can check and ceremony that fits the request

Additive. **No action is required.** One correction changes numbers you may have read before.

## What changed, in one paragraph

Every review now reports findings in one shape (`standards/findings.md`): severity on a single scale shared by QA and design, the role that owns the violated decision, evidence, basis and action; blocking findings are re-checked by trying to refute them. `/crew:check` runs the test commands `crew.json` declares and writes a hashed receipt per run, and `testing.receipts: true` makes a `passing` verification row close only with one. Stories gain a "Must not" section. Requests are sized (trivial, small, standard, large) with a rubric in the delivery circuit; size removes steps, never closures, and `/crew:metrics` reports deviation by size.

## A correction to `/crew:metrics`

Since 0.23 the estimation table closes with a **Total** row, and `metrics.js` counted that row as one more milestone: every item's estimated and actual hours were **doubled** (the deviation percentage was unaffected). 0.28 skips the Total row. If you exported `docs/work/metrics.csv` between 0.23 and 0.27, regenerate it.

## What you may opt into

| You add | You get |
|---|---|
| `testing.receipts: true` (with `testing.commands`) | `passing` rows close only when they cite a receipt from `/crew:check` |
| `- **Size:** small` in a work item | the scope notice when the change outgrows it; deviation by size in metrics |
| `## Must not` in your own story template | QA checks each line as its own criterion |

Projects keep their own templates: the "Must not" section and the `Size:` field arrive only in newly scaffolded templates, or when you add them to yours.
