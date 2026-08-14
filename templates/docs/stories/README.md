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
- **The story names no test tool.** The harness this project uses is declared once, in `crew.json` `testing.e2e`, and read from there by every role — a tool named inside a functional artifact drifts the day the tool changes. What is structural here is the Ready gate (≥1 test scenario); *how* each scenario gets verified is written at planning, in the work item's `## Verification` table (see [`../guides/testing.md`](../guides/testing.md)).
- The tracker (if any) holds only: link to this file, state, assignee. On any discrepancy, **this file wins**.
- **A story is authored without estimation** — hours are not the analyst's deliverable, and an estimation block in a functional artifact is a process antipattern. Estimation happens at **planning**: when the story is taken for implementation, whoever executes adds the `## Estimation` table (milestones, estimated hours, closed by a **Total** row) before coding and records real start/finish per milestone during execution. Closing a story without a complete table is still invalid (see [`../AGENTS.md`](../AGENTS.md#estimation-discipline-mandatory)).
- **A story is authored without a verification table either** — for the same reason. The analyst owns *what* must be true (criteria) and *one concrete run of it* (test scenarios); the level, the harness and the artifact are decided at planning by whoever executes, in a `## Verification` table added next to the estimation. The two tables never restate the scenario: they reference it by its human-readable name.

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

Concrete, data-backed walkthroughs that exercise the behavior end to end — the input `QA` formalizes into automated cases in whatever harness the project declares. Distinct from **Edge cases** above, which name *conditions* to cover in the abstract: each scenario here is one runnable instance with a human-readable name, ordered steps, and the real data it runs on. At least one is required to reach Ready.

- **(Human-readable case name — one a non-technical reader understands, e.g. "Manager approves a pending leave request"; never a test-file identifier.)**
  - **Steps:** (user → screen → action → expected on-screen result; one line per step.)
  - **Data:** (the concrete records the run needs, e.g. user `ana@acme.com`, request #4821 in state Pending. This data must already exist in the database — creating it is the author's responsibility, not `QA`'s.)
  - **Expected result:** (what is observably true at the end.)

## Out of scope

- (What this story deliberately does NOT include.)

## Open questions

- (Ambiguity + who owns the answer. Must be empty to reach Ready.)

## Changes

- (Only if criteria change after In progress: date, what, why.)

## Validation

- (On validation: per-criterion verdict — pass/fail + observed behavior in one line.)
```
