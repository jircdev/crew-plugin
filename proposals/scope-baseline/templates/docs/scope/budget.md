# Budget — Quoted hours against worked hours

How many hours were quoted for each committed requirement, how many are still estimated, and how many were actually worked. The first table is written by people; everything after it is computed from the `## Estimation` tables of the work items and rewritten by `/crew:metrics scope --write`. Requirements: [`baseline.md`](baseline.md). Changes: [`changes/`](changes/README.md).

- **Unit:** <hours of what, e.g. "effort hours as recorded in the Actual hours column">. If the quote was made in a different unit, the conversion is the project's method, linked here and recorded in `docs/DEVIATIONS.md`; the report never applies a factor the project did not declare.
- **Estimate cut:** YYYY-MM-DD, commit `<sha>` (when the Estimate to complete column was last revised)

## Per requirement (written by hand)

| ID | Phase | Origin | Quoted | Estimate to complete | Notes |
|----|-------|--------|-------:|---------------------:|-------|
| RQ-01 | F1 | baseline | | | |
| RQ-02 | F1 | CH-001 | | | |

- **Quoted** — `COM`, from the signed commitment or from the change whose price the client accepted. Empty for a change whose price is not accepted.
- **Estimate to complete** — hours still needed, by whoever will execute, integrated by `SYS`. Revised at each estimate cut; a range only where something named blocks the estimate.
- **Worked is never written here.** It comes from the work items.

## Computed

<!-- crew:generated scope-budget -->
(Written by `/crew:metrics scope --write`. Do not edit by hand.)

### Totals

| | Quoted | Worked | Estimate to complete | Forecast | Forecast − quoted |
|---|---:|---:|---:|---:|---:|
| Baseline | | | | | |
| Accepted changes (funded) | | | | | |
| Accepted changes (unfunded) | | | | | |
| **Committed total** | | | | | |
| Pending changes (not in total) | | | | | |
| Not in baseline (work items without Covers) | — | | — | | — |

### By phase

| Phase | Quoted | Worked | Estimate to complete | Forecast | Forecast − quoted |
|---|---:|---:|---:|---:|---:|

### By requirement

| ID | Status | Quoted | Worked | Estimate to complete | Forecast | Forecast − quoted | Paying work items |
|----|--------|-------:|-------:|---------------------:|---------:|------------------:|-------------------|

- **Worked** — sum of `Actual hours` of every milestone of the work items whose first `Covers` ID is this requirement, in any status.
- **Forecast** — worked + estimate to complete.
<!-- /crew:generated -->
