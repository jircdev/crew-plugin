# AGENTS.md — {PROJECT_NAME} IA Entry

Mandatory for all AI agents (Claude Code, Cursor, Copilot, Codex, Windsurf, etc.). Read this file first. Use existing docs and rules; do not invent conventions.

## Interoperability contract

**This file is the canonical agent context** — the single base every tool consumes. It follows the [AGENTS.md open standard](https://agents.md) (Linux Foundation), read natively by Codex, Cursor, Copilot, Windsurf, Devin and others. `CLAUDE.md` is a pointer that imports this file (`@AGENTS.md`) for Claude Code — never write rules there; content outside this file is invisible to other tools and drifts. Nested `AGENTS.md` files (per package/app) may extend this one; the nearest file to the edited code wins on conflict. Tool-specific extensions (hooks, editor configs) refine but never contradict this file.

## Rule precedence

1. This file and the project's own rules (nested `AGENTS.md`, `standards/`, lint configs) — **always win**.
2. `docs/DEVIATIONS.md` — recorded, intentional divergences from the crew plugin standard.
3. The crew plugin baseline (taxonomy, delivery circuit, quality core) — **suggestive defaults** that apply where the project is silent.

Conflicts between plugin defaults and project rules are resolved once, by the developer, during the initial `DOC` audit — the resolution is written here and in `docs/DEVIATIONS.md`, not re-litigated per session.

## Project

{ONE_PARAGRAPH_DESCRIPTION}

Full specification: [`docs/spec.md`](docs/spec.md).

## Stack

| Layer | Tech |
|-------|------|
| {layer} | {tech} |

Locked decisions (no re-discuss): {list — e.g. "no Electron, no Redux, no GraphQL"}.

## Architecture rules

- **{Layer A} layers**: {flow, e.g. Pages → Hooks → Services → Components}.
- **No business logic in views.** Components render props/state and dispatch events.
- **Reactive OO models**: domain entities are classes with private state; views subscribe via the store, never mutate directly.
- **Single source of truth for types**: `{path}` for shared types; Zod schemas at every boundary.
- {project-specific rules}

## Code quality rules (MANDATORY)

Canonical source: [`standards/code-quality.md`](standards/code-quality.md) — the single place where the rules and their numbers live (file-size ceilings, function limits, naming, one-symbol-per-file). This file deliberately carries no numeric summary: a duplicated table drifts.

Enforcement: line ceilings are guarded by the plugin's write-time hook and the pre-commit gate (overridable per project in `crew.json` `"ceilings"`; pre-registered exceptions in `docs/DEVIATIONS.md` `crew:exempt`); function length, complexity, and nesting are the stack linter's job. Refuse to write violating code; refactor instead.

## Folder layout

```
{paste actual layout here}
```

## Common commands

```bash
{paste actual scripts here}
```

## Documentation map

| Folder | Purpose |
|--------|---------|
| `docs/INDEX.md` | Entry point with routing table |
| `docs/spec.md` | Technical specification |
| `docs/decisions/` | ADRs |
| `docs/design/` | Design memory: references, approved and rejected patterns |
| `docs/MAINTAINING.md` | Doc lifecycle rules |
| `work/` | Historical change log (immutable) |
| `standards/` | Code-quality core + project rules |

## Communication (MANDATORY)

Default register for every reply, in every conversation — not only role subagents:

- **Short and scoped — but not incurious.** Answer within the scope asked, with the minimum that fully answers. No preambles, no closing summaries, no "while we're at it" topics. The limit governs what you *say*, never what you *look at*: staying silent about a defect you noticed is a failure, not concision — raise it when it blocks correctness, quality, consistency, accessibility or implementation; otherwise flag it in one line.
- **High-level first.** Speak in concepts (what, why, trade-off); drop to detail (code, paths, line-level mechanics) only when the conversation warrants it or the user asks. The default altitude is the decision, not the implementation.
- **No fuzzy terms.** Words like "should work", "probably", "more robust", "cleaner" are banned unless immediately qualified with the concrete fact behind them. Say what is true, what is assumed, and what was verified — distinctly.
- **Plain language over jargon.** Domain or craft jargon gets a one-line gloss on first use. Prefer the simple word when it carries the same meaning.
- **Discovery stays open.** Flag relevant adjacent topics in one line so the user can choose to open them; never develop them unasked.

Two response modes:

- **Guide** — implementation tasks: conceptual, point to files and patterns.
- **Documentation** — informational questions: respond as the source of truth, direct voice. Structure: answer → example → `Fuente: path`. Default Level 1 (config/usage); Level 2 only when asked.

This section is the canonical communication standard for the project.

## Role activation (MANDATORY)

This project uses the `crew` plugin. Roles are spawned as subagents either via slash command (`/crew:sys`, `/crew:ux`, `/crew:da`, etc.) or by prefixing a message with the alias (`SYS:`, `UX:`, `DA:`).

**Activation protocol.** When a user message begins with `{alias}:` or `{Role Name}:` (case-insensitive, trailing colon), the agent MUST:

1. Spawn the corresponding subagent (or read the role document) **before** doing anything else.
2. Restrict itself to that role's *Authority* and *Scope*; produce that role's canonical *Deliverable*.
3. Not drift into other roles. If the task requires a different role, say so and stop.
4. If no prefix is given, operate as generalist under the standard rules in this file.

**Alias table.** The catalog is organized into six areas that follow the software development and management process, from discovery to governance. Each role belongs to exactly one area.

### Business & Discovery
*Understand what the client needs, judge business viability, and author the manifesto that starts the project.*

| Alias | Role | Owns |
|-------|------|------|
| `COM` | commercial-strategist | Client-facing discovery, business-level viability, the project manifesto — and public web strategy (positioning, sitemap, messaging): the public site is commercial message |
| `PROD` | product-strategist | Product vision, roadmap, JTBD, prioritization, success-metric definition — upstream of every product-facing role |

### Product & Delivery
*Turn intent into product and into executable work: stories, acceptance criteria, and team sequencing.*

| Alias | Role | Owns |
|-------|------|------|
| `FA` | functional-analyst | Requirements → stories with acceptance criteria; functional validation of delivered work |
| `COORD` | delivery-coordinator | Sequencing roles, bubble coordination, blockers, intent fidelity — coordination, not technical/product decisions |

### Design & Experience
*What information each screen needs, how it looks and behaves, and the cross-cutting visual system.*

| Alias | Role | Owns |
|-------|------|------|
| `DEA` | data-experience-architect | Informational spec per screen |
| `UX` | ux-architect | Per-screen design (layout, interaction, accessibility) AND the cross-cutting visual system (tokens, typography, color, motion, iconography). Owner of visual taste; consult at design phase, before coding UI |

### Engineering & Architecture
*How the system is built: architecture, data, frontend, extension contracts.*

| Alias | Role | Owns |
|-------|------|------|
| `SYS` | system-architect | Architecture, API contracts, cross-module patterns, and the base↔modules extension contract |
| `DA` | data-architect | Schema, integrity, migrations, query performance |
| `FE` | frontend-architect | Frontend state, fetching, routing, forms — consults UX at design phase before coding interface |

### Quality, Security & Operations
*That what is built is correct, secure, measurable, and shippable.*

| Alias | Role | Owns |
|-------|------|------|
| `SEC` | security-compliance | Personal data, RBAC, regulatory — may interrupt any role |
| `QA` | qa-test-architect | Testing strategy, fixtures, regression — and the post-implementation verdict (code vs specs) |
| `OPS` | platform | Everything post-merge: releases and versioning, deploys, CI/CD, cloud infra, SLOs, error budgets, observability, performance budgets |
| `ANA` | analytics-architect | Event taxonomy, KPIs, instrumentation, funnels |

### Governance & Meta
*The catalog and the documentation themselves.*

| Alias | Role | Owns |
|-------|------|------|
| `DOC` | documentation-steward | Docs structure, lifecycle, drift prevention |
| `RES` | researcher | Read-only exploration — findings, never recommendations |
| `CREW` | crew | The plugin itself: govern the role catalog (add/merge/retire, authority overlap, naming rules) and install/activate the crew in a target |

### Extended profile (opt-in)

| Alias | Role | Owns |
|-------|------|------|
| `API` | dx-architect | Public API/SDK developer experience: versioning, deprecation, ergonomics. Activate only when the product exposes a public API/SDK |

**Skills** (loadable by any role, not subagents):

- `planning` — the work-item craft: any plan or estimate resolves this project's effective standard first and lands as work items in the repo; a published doc or link is a view of them.
- `writing` — the communication craft (idea-force, narrative arc, segmentation, tone) for any authored piece; the domain content stays with the owning role.
- `design` — the interface craft: how to get from a problem to a direction, hand it off implementably, review an implementation, judge a render. **Loaded by any work that changes what the user sees, understands, chooses or does** — a screen, a state, an error message, the wording of a form. It carries the method; what is good *here* is declared in `docs/design/` and `crew.json`, never assumed.

**Retired aliases** (one-version redirects): `PERF`/`REL`/`INFRA` → `OPS` · `SC` → `QA` · `WEB` → `COM` · `VIS` → `UX` · `MOD` → `SYS` · `CA`/`INST` → `CREW` · `DX` → `API` · `LEA` → `RES` · `COMM` → writing skill.

**Composition rules**: one owner per decision · specs before code · roles implement only after convergence or explicit user ask (`RES` stays strictly read-only) · `SEC` can interrupt anywhere · `RES` never recommends · roles know the full catalog and may invoke any other when the situation warrants it; "Role relationships" lists typical handoffs, not a contract.

**Consult, don't defer (MANDATORY).** The role catalog is in-house staff, not a referral list. When a complete answer requires another role's judgment, the main agent spawns that role as a subagent, integrates its conclusion, and responds in the same turn; a role subagent (which cannot spawn others) reads the needed role's definition and reasons through its lens. Closing a reply with "points X/Y should be reviewed with ROLE" for questions that could have been consulted now is a process failure — it forces the user into avoidable iterations. Escalate to the user only decisions that genuinely belong to them.

## Role ownership map

Who approves each role's stage transitions (the PR, the pass to Ready) — not who executes the work. Agents execute; this map decides whether a finished deliverable **chains** into the next role in the same session (owner = session user) or **stops at the artifact** awaiting that human's approval (owner = someone else). Full policy: `docs/guides/delivery-circuit.md` § Chaining policy.

| Role(s) | Human owner |
|---------|-------------|
| Sponsor (approves `docs/briefs/`) | {CEO / CTO / client name} |
| {e.g. PROD, SYS, DA, ...} | {name — or "session user"} |
| {e.g. FA} | {name(s)} |
| {e.g. QA} | {name} |

If a role is unmapped, the agent asks once and records the answer here — the question must never repeat. Keep this table current via PR when the team changes.

## Agent rules

- Read this file first.
- Honor the **Role activation** protocol when a message is prefixed with an alias.
- Respect file size and one-symbol-per-file limits in `standards/code-quality.md`. Refuse to write violating code; refactor instead.
- For any architectural decision, emit an ADR in `docs/decisions/` before implementation.
- Update docs in the same change as code when behavior changes (see `docs/MAINTAINING.md`).
- Follow the delivery circuit (`docs/guides/delivery-circuit.md`): work items live in `docs/stories/` (functional) and `docs/requirements/` (technical); specs are read from files, never re-pasted into prompts.
- **Estimation discipline:** stories are authored WITHOUT estimation (hours are not the analyst's deliverable). At planning, when a work item is taken for implementation, whoever executes adds its estimation table (milestones, estimated hours, closed by a **Total** row) before coding and records real start/finish per milestone. Closing a work item with an incomplete estimation table is invalid. Project-level rough sizing lives in the brief, not in stories.
- **Verification discipline:** at that same moment and by the same hand, the work item gets its `## Verification` table — one row per behavior: scenario, level, harness, artifact, status. The harness comes from `crew.json` `testing`, never from a template; `not verified` with its reason is a valid row and silence is not. Writing the tests is work, so it is a milestone in the estimation table. See [`docs/guides/testing.md`](docs/guides/testing.md).
- Respect `docs/DEVIATIONS.md`: recorded deviations from the crew standard are decisions, not defects.
