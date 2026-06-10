# Briefs — Executive decision requests

Documents addressed to a **non-technical decision-maker** (CEO, CTO, client sponsor) to validate an initiative at high level before any backlog work starts. One initiative, one brief, one explicit decision.

This is the gate between *idea* and *backlog*: new projects, new product ideas, new requirements with meaningful cost. Small features inside an already-approved scope do not need a brief.

## Hard rules

- **800 words maximum.** A brief that needs more is hiding a plan inside.
- **Boundary rule:** if a sentence is only understandable by a developer, it belongs in the requirement/plan — not here. No code, no schemas, no stack names unless the decision is about them.
- **Acronyms expanded** on first use; no internal jargon.
- **One explicit ask.** The brief ends with a single decision for the sponsor ("approve X hours for Y"), never a menu of open questions.
- **Cost comes from the estimation table** of the underlying plan — never invented for the brief.
- Written in the sponsor's language (this template is English; write the actual briefs in whatever your decision-maker reads).

## Lifecycle

```
Draft → In validation → Approved | Rejected
```

State lives in the file header. After the decision, the file is **immutable** — it is the record of what was approved or rejected and why. A changed proposal is a new brief that references the old one.

## Chaining

- Brief **Approved** → unlocks the stories/requirements that implement it; each links back to the brief as its authorization.
- No backlog work starts while the gate applies and the brief is unapproved.
- The sponsor is declared in the project's `AGENTS.md` § Role ownership map — the brief decision is theirs, never an agent's.

## Convention

- One file per initiative: `YYYY-MM-DD_slug.md`.
- Written by `PROD` (product-strategist); the human owner presents it; the sponsor decides.

## Brief template

```markdown
# Title — what is being proposed, in one plain sentence

- **Status:** Draft | In validation | Approved | Rejected
- **Date:** YYYY-MM-DD
- **Sponsor (decides):** name
- **Presented by:** name

## What we propose

(2-3 short paragraphs, plain language. What the user/customer will be able to do that they cannot today.)

## Why now

(The trigger: pain, opportunity, deadline. One paragraph.)

## What it costs

(Hours from the plan's estimation table + calendar expectation. One paragraph, no breakdown — the breakdown lives in the plan.)

## Main risk and mitigation

(The one risk the sponsor would want to know, and what limits it.)

## What we are NOT deciding today

(Explicit: decisions deliberately deferred, so approval is not read as approving everything.)

## The ask

(One sentence: the single decision requested.)

## Decision

(Filled at resolution: Approved/Rejected, by whom, date, one-line rationale.)
```
