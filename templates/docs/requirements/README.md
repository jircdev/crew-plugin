# Requirements — Technical work items

High-level technical work defined by an architect role (`SYS`, `DA`, `OPS`, `FE`, ...): refactors, platform capabilities, infrastructure, technical debt. Work that does not pass through functional stories. The technical half of the backlog; [`../stories/`](../stories/README.md) is the functional half.

## Structure

```
docs/requirements/
└── <plan>/                   # kebab-case English; groups related requirements
    ├── README.md             # plan context + requirement index + recommended order
    └── NNN-slug.md           # one requirement; numbering restarts per plan
```

**Kind lives in the slug.** Verification work (auditing an area against a spec or quality bar) is `NNN-audit-slug.md` — same template, same lifecycle, the expected deliverable is the findings report. No kind folders, no kind field: the filename is the taxonomy.

## Lifecycle

```
Draft → Ready → In progress → Delivered → Closed
```

Same semantics as stories, minus functional validation: a requirement is verified by its **expected deliverable** (does the artifact exist and behave as specified?), typically by the authoring architect role or `QA` in verdict mode. From Closed on, the file is immutable.

## Rules

- A requirement describes work to do, not the decision taken. If executing it produces a decision with trade-offs, that decision is an ADR in `decisions/` and the requirement links it.
- The `## Estimation` table is filled at **planning**, by whoever executes: milestones and estimated hours before coding, real start/finish per milestone during execution. It closes with a **Total** row (estimated and actual). The empty section ships in this template because the author of a requirement is typically also its executor (an architect role); it stays empty until the work is taken. Closing with an incomplete table is invalid (see [`../AGENTS.md`](../AGENTS.md#estimation-discipline-mandatory)).
- The `## Verification` table is filled at the **same moment and by the same person**: writing the tests is work, and work that is not in the table is work that was not estimated. A requirement whose verification is `manual` or `not verified` is a legitimate outcome as long as the reason is written; silence is not (see [`../AGENTS.md`](../AGENTS.md#verification-discipline)).
- Branch convention: `req/<plan>-NNN-slug`.

## Requirement template

```markdown
# NNN — Short title

- **Status:** Draft | Ready | In progress | Delivered | Closed
- **Plan:** <plan> ([README](README.md))
- **Date:** YYYY-MM-DD
- **Author role:** SYS | DA | INFRA | ...
- **Branch:** (on In progress: `req/<plan>-NNN-slug`)
- **Depends on:** (requirements, stories, or ADRs that must land first; "None" if none)

## Context

(What motivates this work. 2-4 paragraphs max.)

## Goal

(What must be true when this is done — phrased as verifiable outcomes, not activities.)

## Areas to investigate

(Open questions, files to read, patterns to validate. What the implementing agent must resolve.)

## Expected deliverable

(Artifacts this produces: code, schema, config, docs, ADR.)

## Estimation

| Milestone | Est. hours | Started | Finished | Actual hours | Notes |
|-----------|-----------|---------|----------|--------------|-------|
| | | | | | |
| **Total** | | — | — | | |

(Filled by the evaluating agent BEFORE implementation; Started/Finished recorded during execution as `YYYY-MM-DD HH:MM -ZZ:ZZ` — format and discipline in [`../AGENTS.md`](../AGENTS.md#estimation-discipline-mandatory). The **Total** row sums estimated and actual hours; a reader must never have to add the column themselves.)

## Verification

| Scenario | Level | Harness | Artifact | Status |
|----------|-------|---------|----------|--------|
| | | | | |

(Filled at planning alongside the estimation, by whoever executes. One row per behavior this work item must leave verifiable. `Level`: unit / integration / contract / e2e / manual. `Harness`: what the project declares in `crew.json` `testing`, or `none`. `Artifact`: the path of the test, or what blocks writing it. `Status`: planned / written / passing / not verified — reason. Discipline in [`../AGENTS.md`](../AGENTS.md#verification-discipline).)

## Changes

- (Only if the goal changes after In progress: date, what, why.)
```
