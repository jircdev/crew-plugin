# Committed requirements — <project>

What must be working for this project to be done, and the test that confirms each point. Written from the approved brief and the signed commitment; after the baseline date it changes only through entries in [`changes/`](changes/README.md). Hours live in [`budget.md`](budget.md). Rules and status derivation: [`README.md`](README.md).

- **Baselined:** YYYY-MM-DD (set when the sponsor approves this file; empty while in draft)
- **Sources:** (the contractual documents, linked where the project keeps client-facing material, with the abbreviations used below)

## How to read each entry

- **Done when** — the test, in plain language, anyone can run to confirm it.
- **Phase** — the delivery it belongs to; `—` when the source assigns none.
- **Source** — the contractual document and section.
- **Origin** — `baseline`, or the change that created or modified it.
- **Blocked by** — an external dependency, named. Optional.
- **Verification** — the only place a requirement is marked fulfilled. Append-only.
- **Status and covering work items** are not written here: they are computed into the generated block at the end of this file.

---

## 1. <Area>

### RQ-01 — <What stays working, as a short title>

<Optional: one sentence describing what stays working.>

- **Done when:** <observable test, verifiable by using the product without reading code>
- **Phase:** <F1 | F2 | —>
- **Source:** <Doc abbreviation, § section>
- **Origin:** baseline
- **Blocked by:** <optional: what, and who delivers it>
- **Notes:** <optional: progress nuance in prose; never a status value>

#### Verification

| Date | Verdict | Evidence | By |
|------|---------|----------|----|
| | | | |

(One row per walk of the **Done when** against the running product, appended, never edited. `Verdict`: pass / fail — observed behavior in one line. `Evidence`: link to the validation record or `docs/work/` entry. `By`: the human, with `FA` for functional or `QA` for non-functional. A `pass` row is rejected while any covering work item is not terminal.)

---

## Non-functional requirements

### NFR-01 — <Commitment>

- **Done when:** <how it is checked: a measurement, a rehearsal, a review on record>
- **Phase:** <...>
- **Source:** <...>
- **Origin:** baseline

#### Verification

| Date | Verdict | Evidence | By |
|------|---------|----------|----|
| | | | |

---

## Out of scope

- (What the commitment explicitly excludes, with its source. Anything here that later gets built needs a change entry.)

## Status

<!-- crew:generated scope-status -->
(Written by `/crew:metrics scope --write`. Do not edit by hand.)

| ID | Title | Phase | Status | Covering work items | Last verification |
|----|-------|-------|--------|---------------------|-------------------|
<!-- /crew:generated -->
