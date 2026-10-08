---
description: Estimation metrics — lead time, execution time, estimate deviation; catalog usage
argument-hint: [YYYY-MM | catalog]
---

Run the estimation metrics report over this project's closed work items and present the result.

1. Execute: `node "${CLAUDE_PLUGIN_ROOT}/scripts/metrics.js" $ARGUMENTS` from the project root (pass the optional `YYYY-MM` argument through if the user gave a period; add `--csv` only if the user asked for a CSV/export, which writes `docs/work/metrics.csv`).
2. Present the summary conversationally: how many items, median and p90 execution time, average estimate deviation, and anything notable per folder or month. Do not dump the raw table unless the user asks for the detail.
3. If the script reports no closed items with estimation data, say so and explain what feeds the report: stories/requirements with `Status: Closed` and a filled `## Estimation` table (timezone-stamped `Started`/`Finished`). Requires `"metrics": true` in `crew.json` for the discipline to be enforced, but the report itself runs anywhere.
4. Factory mode (`crew.json` declares `factory`): the script prints factory's live backlog instead, as a tree of activities with each one's original and current estimate, its own consumed hours and, on leaves, its deviation, then quoted / consumed / pending / forecast for the project. Present the forecast against the quoted hours first, then the activities that deviate most. When the script says the machine is not connected or factory could not answer, relay that line and present the local report it printed after it; for a missing connection, point to `/crew:factory login`.

With `catalog` as the argument, run `node "${CLAUDE_PLUGIN_ROOT}/scripts/metrics.js" catalog` instead: it reports how often each role, skill and command was used in this project (last 30 and 90 days) and which roles went unused, from the local log `.crew/usage.jsonl`, which each person opts into (`{"telemetry": true}` in `.crew/local.json`, or `CREW_TELEMETRY=1`; `crew.json` can only forbid it). Present it as evidence for the CREW role's routing cost test, never as a verdict on a role.

The metric is wall-clock, end-to-end: lead time (file creation via git → last Finished) and execution time (first Started → last Finished). It intentionally includes pauses — it measures the cost of the requirement, not keyboard time.
