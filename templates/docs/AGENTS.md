# Documentation — Criteria for Agents and Contributors

Prescriptive guide: **when, where, and why** to write documentation in this project's `docs/` tree. Every agent that writes any artifact must know this file.

## Foundational rules

1. **Folder = nature, state = field.** Folders are named by what the artifact *is* (a story, a requirement, a decision), never by what state it is in. State lives inside the file (`Status:` field). Files never move between folders when their state changes.
2. **Single source of truth.** Each fact lives in exactly one file. Other artifacts link to it; they never duplicate it. An external tracker, if used, holds only state + assignee + a link to the file here.
3. **Every significant task leaves a trace.** If a change affects behavior, structure, conventions, or decisions, it gets recorded in the corresponding layer. When in doubt, record it.
4. **Accepted deviations are intentional.** If this project diverges from this standard, the divergence is recorded in [`DEVIATIONS.md`](DEVIATIONS.md). Agents respect recorded deviations — they are decisions, not defects to fix.

## Where to write — decision criteria

### `docs/briefs/` — Executive decision requests

High-level documents for a non-technical sponsor (CEO, CTO, client) to validate an initiative before backlog work starts. Written by `PROD`; decided by the sponsor (ownership map). Hard cap 800 words, one explicit ask, immutable after decision. Boundary rule: if only a developer understands the sentence, it goes to the plan, not the brief. Conventions: [`briefs/README.md`](briefs/README.md).

**Not here:** plans, estimation breakdowns, technical detail (→ `requirements/`/`stories/`); decisions already taken (→ `decisions/`).

### `docs/stories/` — Functional work items

Units of user-observable behavior with acceptance criteria, written by functional analysis (`FA` role). Grouped by feature (`stories/<feature>/NNN-slug.md`). Kind lives in the slug — a defect is `NNN-bug-slug.md`; no kind folders, no kind field. Template and lifecycle: [`stories/README.md`](stories/README.md). Stories are authored without estimation; the executor adds the table at planning.

**Not here:** technical decisions (→ `decisions/`), technical work items (→ `requirements/`).

### `docs/requirements/` — Technical work items

High-level technical work defined by an architect role (`SYS`, `DA`, `OPS`, ...) that does not pass through functional stories: refactors, infrastructure, platform capabilities, technical debt. Grouped by plan (`requirements/<plan>/NNN-slug.md`). Kind lives in the slug — verification work is `NNN-audit-slug.md`; no kind folders, no kind field. Template and estimation table: [`requirements/README.md`](requirements/README.md).

**Not here:** the decision itself (when implementing a requirement produces a decision with trade-offs, that decision is an ADR in `decisions/`; the requirement links it).

### `docs/decisions/` — Architecture Decision Records

Decisions with viable alternatives, hard to revert, or affecting multiple modules. Status (`Proposed` / `Accepted` / `Superseded` / `Deprecated`) lives in the file header — a proposed decision is born here and never moves. Conventions: [`decisions/README.md`](decisions/README.md).

### `docs/proposals/` — Ownerless ideas

Improvement detected during work, with no owner and no date yet. Matures into a story/requirement (when someone owns it), becomes an ADR (when it is decided), or is discarded with a recorded reason.

### `docs/guides/` — Living behavior docs

How something cross-cutting works **today**. Updated in the same change that alters the behavior. The delivery process itself is one of these: [`guides/delivery-circuit.md`](guides/delivery-circuit.md).

**Builder/agent-facing only.** End-user or product documentation (user guides, manuals, help content) is outside this standard's scope and must not live here — give it its own location (e.g. `docs/product/` or the product's site) so agents never confuse audience.

### `docs/work/` — Historical log (evidence, never truth)

What was done, when, and why — one immutable entry per significant change. **A work entry expires the day it is written**: it is evidence of rationale, never a source of current behavior. Any knowledge in a work entry that is still true must be promoted to a living guide; agents must never cite `work/` as current truth. Conventions: [`work/README.md`](work/README.md).

### `docs/glossary/` — Domain terms

Plain-language entries for domain jargon visible in the product. Source of truth for UI tooltips.

### `docs/DEVIATIONS.md` — Accepted deviations from this standard

When a documentation audit (`DOC` role) finds a divergence and the owner decides to keep it, it is recorded here with rationale and date. Binding for all agents.

## Estimation discipline (mandatory)

Estimation happens at two levels, and neither belongs to the authoring of a story:

1. **Project level** — a rough magnitude in the brief/manifesto, before any story exists, to judge whether the initiative is worth doing. Coarse by design; never a milestone breakdown.
2. **Planning level** — when a work item is taken for implementation, **whoever executes** adds the `## Estimation` table (milestones, estimated human-hours) to the story/requirement **before coding**, and records real start/finish per milestone during execution.

A story is written without estimation — hours are not the analyst's deliverable. By closure every implemented story/requirement carries its complete table: that is how the team measures the cost of each agentic iteration — do not skip it, do not estimate retroactively.

Timestamps are timezone-stamped: `YYYY-MM-DD HH:MM -ZZ:ZZ`, taken from the clock (`date "+%Y-%m-%d %H:%M %z"`), never reconstructed from memory. Closure with an incomplete table is invalid and hook-enforced.

**The table closes with a `**Total**` row** — estimated and actual hours summed. A document whose reader has to add the column themselves is not reporting a number, it is storing one. The total is what makes a plan comparable to its outcome at a glance, and it is hook-enforced at closure like the rest of the table.

## Verification discipline

Every work item states **how it was verified**, in a `## Verification` table written at planning by whoever executes — the same moment and the same hand as the estimation. One row per behavior: scenario, level (unit / integration / contract / e2e / manual), harness, artifact, status.

Three rules give it its shape:

1. **It never restates the scenario.** The story owns what must be true and one concrete run of it; this table adds only the method, referencing the scenario by its human-readable name. Duplication here is drift tomorrow.
2. **It names no tool of its own.** The harness comes from `crew.json` `testing.e2e`; if the project declares none, the row says `none` and the status says why. A plan that mandates a specific test tool the project never adopted produces tests that never run.
3. **"Not verified" is a valid status; silence is not.** Missing infrastructure, a behavior only checkable by hand, a deliberate decision to skip — all legitimate, all written down with the reason. The cost of verification belongs in the estimate, and work that is not in the table is work nobody costed.

When `crew.json` declares `testing`, closure without this table is invalid and hook-enforced, in both team and solo mode. Undeclared, the table is still the standard and nothing blocks. What the project can verify, at what levels and with what harness, lives in [`guides/testing.md`](guides/testing.md).

## Completeness check (when closing a task)

- [ ] Did observable behavior change? → changelog entry (project-specific location).
- [ ] Did you implement a story/requirement? → state, branch, estimation table (with its Total) and verification table updated in its file.
- [ ] Did you make a decision with trade-offs? → ADR in `decisions/`.
- [ ] Did cross-cutting behavior change? → update/create the guide.
- [ ] Did you close a significant iteration? → entry in `work/YYYY-MM/`.
- [ ] Did the doc structure change? → update this file + `INDEX.md`.

## See also

- [INDEX.md](INDEX.md) — documentation index
- [MAINTAINING.md](MAINTAINING.md) — lifecycle rules, drift prevention
- [guides/delivery-circuit.md](guides/delivery-circuit.md) — the full delivery circuit
- [DEVIATIONS.md](DEVIATIONS.md) — accepted deviations registry
