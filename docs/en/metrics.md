# Metrics — from estimation table to numbers you can trust

Every implemented item closes with an `## Estimation` table — added at planning by whoever executes it (a story is authored without one; hours are not the analyst's deliverable). Filled with real-time timestamps and closed under the [estimation gate](enforcement.md#estimation-closure-gate), those tables become a dataset: `/crew:metrics` reads them and reports how long work actually takes versus what was estimated. This page covers the discipline that makes the numbers reliable, what the report says, and what decisions it feeds.

## The table

```markdown
## Estimation

| Milestone | Est. hours | Started | Finished | Actual hours | Notes |
|-----------|-----------|---------|----------|--------------|-------|
| API contract | 2 | 2026-07-14 09:12 -03:00 | 2026-07-14 11:05 -03:00 | 1.8 | |
| Implementation | 4 | 2026-07-14 11:20 -03:00 | 2026-07-15 10:40 -03:00 | 4.5 | session interrupted, ~18h gap |
```

`Milestone` and `Est. hours` are filled by **whoever executes**, at planning, before coding. `Started`, `Finished` and `Actual hours` are recorded during execution. Timestamps carry a mandatory timezone offset: `YYYY-MM-DD HH:mm ±TZ` (`Z` accepted).

## The real-time discipline

The numbers are only worth aggregating if they were never reconstructed. The rule:

- Write `Started` **when the milestone begins** — not when you remember to.
- Write `Finished` **immediately when it closes** — before starting the next milestone.
- `Actual hours` is the time actually worked within that span; it can be below the wall-clock span (pauses), never above it.

With `"metrics": true` in `crew.json`, the [timestamps guard](enforcement.md#timestamps) enforces this mechanically: a newly written cell must parse, must be within 15 minutes of the machine clock, `Finished` ≥ `Started`, and `Actual hours` ≤ wall-clock × 1.05. Backdating is rejected — the deny message hands you the correct current time. And the [estimation gate](enforcement.md#estimation-closure-gate) refuses to close an item whose table is incomplete, so a `Closed` item is by construction a fully-measured item.

### Interrupted sessions

Session dies mid-milestone, you resume tomorrow: write `Finished` with the **real resumption time** when the milestone actually closes, and note the gap in `Notes`. Do not backdate. The wall-clock span will include the pause — that is by design, not a distortion (see the limitation below). `Actual hours` is where the honest keyboard figure lives.

## What `/crew:metrics` reports

```
/crew:metrics             # everything
/crew:metrics 2026-07     # only items closed in that month
/crew:metrics --csv       # also write docs/work/metrics.csv
```

The command runs [`../../scripts/metrics.js`](../../scripts/metrics.js), which scans `docs/stories/**` and `docs/requirements/**` for items with `Status: Closed` and a usable estimation table (at least one parseable `Started` and `Finished`). Per item:

| Column | Meaning |
|---|---|
| Lead (days) | File creation (from git history) → last `Finished`. The full life of the item, from written down to done. |
| Exec (h) | First `Started` → last `Finished`. The execution window, once work actually began. |
| Est (h) | Sum of `Est. hours` across milestones. |
| Actual (h) | Sum of `Actual hours` across milestones. |
| Deviation | `(Actual − Est) / Est`, as a percentage. Positive = took longer than estimated. |

Aggregates: **median and p90 execution time** across items, **average estimate deviation**, plus per-folder and per-month breakdowns (items, median exec, total est → actual). `--csv` writes the raw rows to `docs/work/metrics.csv` for a spreadsheet.

The report runs in **both modes, with or without `crew.json`** — it just reads what the tables contain. What `"metrics": true` gates is the *discipline*: without the guards, nothing certifies the timestamps were real, and the report is only as honest as the tables. Configuration details in [configuration.md](configuration.md).

## Reading the numbers

**Lead time vs execution time.** The gap between them is queue time: how long the item sat written-but-not-started. A story with 20 days of lead and 6 hours of exec is not a slow story — it is a prioritization signal. Execution time is the one to compare against estimates; lead time is the one the requester feels.

**Estimated vs actual, and deviation.** One item's deviation is noise; the *average* deviation is calibration. A team consistently at +40% doesn't have an execution problem, it has an estimation habit — scale future estimates accordingly. Watch the per-folder breakdown too: deviation often concentrates in one kind of work (say, everything under `stories/integrations/`), which tells you where the unknowns live.

**Milestone sizing.** Execution medians tell you what a milestone should weigh. If p90 exec is far above the median, some items balloon: look at whether their milestones were too coarse — milestones that take days hide the moment things went off-plan.

## The assumed limitation

The metric is **wall-clock, end-to-end**. Execution time includes pauses, waits, review round-trips, and interrupted sessions — deliberately. It measures *what a requirement costs from start to done*, not keyboard time. Do not read execution hours as effort hours: `Actual hours` is the effort figure, execution time is the calendar figure, and both are useful for different questions. Comparing individuals on wall-clock numbers is a misuse; the dataset is about calibrating the system, not grading people.

## What the data feeds

- **Estimation calibration** — the average and per-folder deviation feed directly back into the next `Est. hours` written at planning by whoever executes.
- **Milestone sizing** — median/p90 execution time defines what "one milestone" should mean in this project.
- **Spotting systematic bias** — persistent under-estimation in one folder or one month is a signal about the work (hidden complexity, flaky dependencies), not about the estimator.
- **Prioritization honesty** — lead-vs-exec gaps show where things wait, which is an input for [the delivery circuit](../../templates/docs/guides/delivery-circuit.md), not something to optimize away by starting everything at once.
