# Stories — Functional work items

Units of user-observable behavior with verifiable acceptance criteria, authored by functional analysis (`FA` role). The functional half of the backlog; [`../requirements/`](../requirements/README.md) is the technical half.

## Structure

```
docs/stories/
└── <feature>/                # kebab-case English
    ├── README.md             # feature context (1 line) + story index + recommended order
    └── NNN-slug.md           # one story; numbering restarts per feature
```

**Kind lives in the slug.** A defect against existing behavior is `NNN-bug-slug.md` — same template, same lifecycle, the narrative states expected vs. observed. No kind folders, no kind field: the filename is the taxonomy (greppable, visible in listings). An RFC-style idea is not a story kind — it goes to [`../proposals/`](../proposals/README.md) until someone owns it.

## Lifecycle

```
Draft → Ready → In progress → Delivered → Validated → Closed
```

- **Draft** — being written; may contain open questions.
- **Ready** — criteria complete and unambiguous, and at least one **Test scenario** captured for `QA`; an implementer can start without coming back. Stories enter the repo via PR approved by the product owner — that approval is what makes them Ready.
- **In progress** — a dev took it; branch noted in the header.
- **Delivered** — implementation merged; functional validation pending.
- **Validated** — analyst walked the written criteria against actual behavior; per-criterion verdict recorded in the **Validation** section.
- **Closed** — full pass. From here the file is **immutable**; new work is a new story.

Until Closed, the story is editable. Any criteria change after In progress is logged in the **Changes** section with date and reason — the implementer must be able to see the target moved.

## Rules

- The story defines behavior, never technical decisions. If implementation requires a decision with trade-offs, that is an ADR in `decisions/`, linked under Dependencies.
- Every story reaching Ready carries at least one **Test scenario** — a concrete, data-backed walkthrough that is input for `QA`'s end-to-end strategy. The author confirms the data each scenario references already exists in the database; the story does not create fixtures or seed data (that is the author's responsibility, not `QA`'s or the data roles').
- The tracker (if any) holds only: link to this file, state, assignee. On any discrepancy, **this file wins**.
- The estimation table is mandatory before implementation starts (see [`../AGENTS.md`](../AGENTS.md#estimation-discipline-mandatory)).

## Story template

```markdown
# NNN — Short title

- **Status:** Draft | Ready | In progress | Delivered | Validated | Closed
- **Feature:** <feature> ([README](README.md))
- **Date:** YYYY-MM-DD
- **Branch:** (on In progress: `story/<feature>-NNN-slug`)
- **Depends on:** (stories or ADRs that must land first; "None" if none)

## Narrative

As a (actor), I want (behavior), so that (outcome).

## Acceptance criteria

1. (Observable and verifiable by using the product, without reading code.)
2. ...

## Edge cases

- (Empty states, limits, permissions, error paths the happy path hides.)

## Test scenarios

Concrete, data-backed walkthroughs that exercise the behavior end to end — the input `QA` formalizes into automated e2e (Playwright) cases. Distinct from **Edge cases** above, which name *conditions* to cover in the abstract: each scenario here is one runnable instance with a human-readable name, ordered steps, and the real data it runs on. At least one is required to reach Ready.

- **(Human-readable case name — one a non-technical reader understands, e.g. "Manager approves a pending leave request"; never a Playwright/test identifier.)**
  - **Steps:** (user → screen → action → expected on-screen result; one line per step.)
  - **Data:** (the concrete records the run needs, e.g. user `ana@acme.com`, request #4821 in state Pending. This data must already exist in the database — creating it is the author's responsibility, not `QA`'s.)
  - **Expected result:** (what is observably true at the end.)

## Out of scope

- (What this story deliberately does NOT include.)

## Estimation

| Milestone | Est. hours | Started | Finished | Actual hours | Notes |
|-----------|-----------|---------|----------|--------------|-------|
| | | | | | |

(Filled by the evaluating agent BEFORE implementation; Started/Finished recorded during execution as `YYYY-MM-DD HH:MM -ZZ:ZZ` — format and discipline in [`../AGENTS.md`](../AGENTS.md#estimation-discipline-mandatory).)

## Open questions

- (Ambiguity + who owns the answer. Must be empty to reach Ready.)

## Changes

- (Only if criteria change after In progress: date, what, why.)

## Validation

- (On validation: per-criterion verdict — pass/fail + observed behavior in one line.)
```
