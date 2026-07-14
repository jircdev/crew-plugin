# Delivery circuit — from intent to closure

The spec-driven delivery standard. Defines which artifact is created at each step, who writes it (human + agent role), and how they chain. Every agent participating in any step must know this document.

**Governing principle:** one source of truth per artifact, always in the repo. Agents consume specs by reading files directly — a spec is never re-pasted into a prompt. It is written once and consumed N times (implementation, QA, validation, audit). An external tracker, if used, holds only state + assignee + a link.

## The circuit

```
1. Intent          2. Analysis          3. Implementation       4. Validation     5. Closure
   PROD/owner   →     FA              →    dev + agents      →     FA         →     implementer
   product/ or        stories/<feat>/      branch + PR             verdict in       work/ + ADR
   requirements/                                                   the story        if applicable
```

### 0. Sponsor gate (when applicable)

Initiatives that need a **non-technical decision-maker's** approval — new projects, new product ideas, requirements with meaningful cost — start as an executive brief in `briefs/` (written by `PROD`, decided by the sponsor declared in the ownership map). No backlog work starts while the brief is unapproved. Small features inside an already-approved scope skip this gate. Conventions: [`../briefs/README.md`](../briefs/README.md).

### 1. Intent

The product owner (`PROD` role) decides what gets built. Stable business rules → `product/` (or the project's vision doc). Technical work that needs no functional analysis → a requirement in `requirements/<plan>/`, authored by the appropriate architect role. Everything else → open the feature folder in `stories/<feature>/` with a one-line context README.

### 2. Analysis

The functional analyst (human, assisted by `FA`) decomposes the intent into stories per the template in [`../stories/README.md`](../stories/README.md). Each story reaching Ready carries at least one **test scenario** — a concrete, data-backed walkthrough (human-readable name, low-level steps, expected result) that `QA` later formalizes into an automated e2e case; the analyst confirms with the author that the data each scenario references already exists in the database. Stories enter the repo **via PR** approved by the product owner — that approval makes them Ready. Analysts do not touch code: their writing surface is `docs/stories/` only; they review from the Git host's web UI, no local git needed.

If a technical decision surfaces during analysis, the analyst does NOT resolve it: it is recorded as an open question and routed to the owning technical role.

### 3. Implementation

A dev takes a Ready story or requirement:

- **Branch:** `story/<feature>-NNN-slug` or `req/<plan>-NNN-slug`.
- Note the branch in the work item's header; state → In progress (commit in the same branch).
- **Estimation gate:** before implementing, the evaluating agent fills the estimation table (milestones, estimated hours). During execution, real start/finish per milestone is recorded. No work item proceeds with an empty estimation table.
- The implementing agent reads the work item as its spec: the kickoff prompt is "implement `docs/stories/<feature>/NNN-slug.md`" — nothing more. If the agent needs more context, the gap is in the file: fix it there, not in the chat.
- The implementation PR links the work item file. On merge, state → Delivered.

### 4. Validation

Stories: the analyst (assisted by `FA` in validation mode) walks the acceptance criteria against actual behavior, records a per-criterion verdict in the story's Validation section. Full pass → Validated. Any fail → back to the dev (expected vs. observed), state returns to In progress. Validation is against the **written** criteria — if criteria pass but the result feels wrong, that is a new product signal for `PROD`, not a failed validation.

Requirements: verified against the Expected deliverable by the authoring role or `SC`.

### 5. Closure

State → Closed (file freezes). Significant work → entry in `work/YYYY-MM/`. Actual hours per milestone completed in the estimation table — closure with an incomplete estimation table is invalid.

## Role → artifact matrix

| Step | Human | Agent role | Writes | Reads |
|------|-------|-----------|--------|-------|
| Intent | Product owner | `PROD` | `product/`, `stories/<feature>/README.md`, `requirements/` | everything |
| Analysis | Functional analysts | `FA` | `stories/<feature>/*.md` | `product/`, `guides/`, `glossary/` |
| Implementation | Devs | per domain (`SYS`/`DA`/`FE`/...) | code, `guides/`, `decisions/`, changelog | `stories/`, `requirements/`, `guides/` |
| Validation | Functional analysts | `FA` | Validation section of the story | the story + the running product |
| Closure | Implementer | implementer | `work/`, estimation table | — |

## Chaining policy — when to run the next role, when to stop

After a role closes its deliverable, the next stage may be chained in the same session or handed off through the artifact. The decision is mechanical, not conversational:

1. **Look up the owner** of the next stage's role in the project's `AGENTS.md` § Role ownership map.
2. **Same human as the session user** → chain: run the next role now, produce its output as a draft, let the user approve everything together.
3. **Different human** → stop at the artifact: register the work item / spec in the repo and end. The repo is the asynchronous interface between humans; their approval gate (PR review, pass to Ready) must not be simulated by an agent.
4. **Chain only what unblocks the session user's next decision** — not the whole queue. Each chained role adds tokens and output volume; run the stage whose result conditions everything else (e.g. data model, security posture) and leave the rest for after approval.

"Owner" means who approves the stage transition (the PR, the pass to Ready) — not who executes the work. Agents always execute; ownership only decides whether the result chains forward or waits.

**Fallback:** if the ownership map is missing or the role is unmapped, ask the user once and write the answer into the map — the question must never repeat.

## Token economy — rules for agents

1. **Never re-explain a spec in a prompt.** Point at the file. If the file is not enough, the file is incomplete — fix it there.
2. **Never duplicate content across artifacts.** Story links ADR; ADR does not repeat criteria; tracker only links. Every duplication is future drift and double-spent context.
3. **Read only the layer the step needs.** Implementing a story does not require reading `work/` (it is history) nor every guide — only what the story lists under Depends on.
4. **Short conversation, complete artifact.** If a chat session produces a definition that must be retold tomorrow, the circuit failed: the definition belonged in a file.
