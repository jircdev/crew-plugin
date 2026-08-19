---
description: Estimation metrics — lead time, execution time, estimate deviation
argument-hint: [YYYY-MM]
---

Run the estimation metrics report over this project's closed work items and present the result.

1. Execute: `node "${CLAUDE_PLUGIN_ROOT}/scripts/metrics.js" $ARGUMENTS` from the project root (pass the optional `YYYY-MM` argument through if the user gave a period; add `--csv` only if the user asked for a CSV/export, which writes `docs/work/metrics.csv`).
2. Present the summary conversationally: how many items, median and p90 execution time, average estimate deviation, and anything notable per folder or month. Do not dump the raw table unless the user asks for the detail.
3. If the script reports no closed items with estimation data, say so and explain what feeds the report: stories/requirements with `Status: Closed` and a filled `## Estimation` table (timezone-stamped `Started`/`Finished`). Requires `"metrics": true` in `crew.json` for the discipline to be enforced, but the report itself runs anywhere.

The metric is wall-clock, end-to-end: lead time (file creation via git → last Finished) and execution time (first Started → last Finished). It intentionally includes pauses — it measures the cost of the requirement, not keyboard time.
