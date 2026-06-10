# AGENTS.md — {PROJECT_NAME} IA Entry

Mandatory for all AI agents (Claude Code, Cursor, Copilot, Codex, Windsurf, etc.). Read this file first. Use existing docs and rules; do not invent conventions.

## Interoperability contract

**This file is the canonical agent context** — the single base every tool consumes. It follows the [AGENTS.md open standard](https://agents.md) (Linux Foundation), read natively by Codex, Cursor, Copilot, Windsurf, Devin and others. `CLAUDE.md` is a pointer that imports this file (`@AGENTS.md`) for Claude Code — never write rules there; content outside this file is invisible to other tools and drifts. Nested `AGENTS.md` files (per package/app) may extend this one; the nearest file to the edited code wins on conflict. Tool-specific extensions (`.cursor/rules/`, hooks) refine but never contradict this file.

## Rule precedence

1. This file and the project's own rules (nested `AGENTS.md`, `.cursor/rules/`, lint configs) — **always win**.
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

Canonical source: [`.cursor/rules/code-quality.mdc`](.cursor/rules/code-quality.mdc). Summary:

- One symbol per file (one class / component / hook / Rust struct+impl).
- File size limits — component 150, page 200, hook 80, slice 150, Rust 300, sidecar tool 120.
- Function 30 lines max, complexity 10 max, nesting 3 max.
- Guard clauses + early returns. No `else` after `return`.
- No `any` / `unknown` without type guard. No default exports.
- Errors typed and surfaced; never swallowed.
- Tests co-located.

Hard-enforced via Biome + linter. Refuse to write violating code; refactor instead.

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
| `docs/MAINTAINING.md` | Doc lifecycle rules |
| `work/` | Historical change log (immutable) |
| `.cursor/rules/` | Always-applied rules |

## Communication (MANDATORY)

Default register for every reply, in every conversation — not only role subagents:

- **Short and scoped.** Answer exactly what was asked, with the minimum that fully answers. No preambles, no closing summaries, no "while we're at it" topics.
- **High-level first.** Speak in concepts (what, why, trade-off); drop to detail (code, paths, line-level mechanics) only when the conversation warrants it or the user asks. The default altitude is the decision, not the implementation.
- **No fuzzy terms.** Words like "should work", "probably", "more robust", "cleaner" are banned unless immediately qualified with the concrete fact behind them. Say what is true, what is assumed, and what was verified — distinctly.
- **Plain language over jargon.** Domain or craft jargon gets a one-line gloss on first use. Prefer the simple word when it carries the same meaning.
- **Discovery stays open.** Flag relevant adjacent topics in one line so the user can choose to open them; never develop them unasked.

Two response modes:

- **Guide** — implementation tasks: conceptual, point to files and patterns.
- **Documentation** — informational questions: respond as the source of truth, direct voice. Structure: answer → example → `Fuente: path`. Default Level 1 (config/usage); Level 2 only when asked.

Canonical: [`.cursor/rules/communication.mdc`](.cursor/rules/communication.mdc).

## Role activation (MANDATORY)

This project uses the `crew` plugin. Roles are spawned as subagents either via slash command (`/crew:sys`, `/crew:ux`, `/crew:da`, etc.) or by prefixing a message with the alias (`SYS:`, `UX:`, `DA:`).

**Activation protocol.** When a user message begins with `{alias}:` or `{Role Name}:` (case-insensitive, trailing colon), the agent MUST:

1. Spawn the corresponding subagent (or read the role document) **before** doing anything else.
2. Restrict itself to that role's *Authority* and *Scope*; produce that role's canonical *Deliverable*.
3. Not drift into other roles. If the task requires a different role, say so and stop.
4. If no prefix is given, operate as generalist under the standard rules in this file.

**Alias table:**

| Alias | Role | Owns |
|-------|------|------|
| `PROD` | product-strategist | Product vision, roadmap, JTBD, prioritization, success-metric definition — upstream of every product-facing role |
| `FA` | functional-analyst | Requirements → stories with acceptance criteria; functional validation of delivered work |
| `SYS` | system-architect | Architecture, API contracts, cross-module patterns |
| `DA` | data-architect | Schema, integrity, migrations, query performance |
| `DEA` | data-experience-architect | Informational spec per screen |
| `UX` | ux-architect | Visual, layout, interaction, accessibility |
| `VIS` | visual-identity | Cross-cutting visual system: tokens, typography, color, motion, iconography |
| `FE` | frontend-architect | Frontend state, fetching, routing, forms |
| `MOD` | module-extension-architect | Base platform ↔ modules/products contract |
| `DX` | dx-architect | Public API/SDK developer experience: versioning, deprecation, ergonomics |
| `SEC` | security-compliance | Personal data, RBAC, regulatory — may interrupt any role |
| `INFRA` | atlas-deploy | Cloud infra, CI/CD, deployment topology |
| `PERF` | performance-reliability | SLOs, error budgets, runtime observability, perf budgets |
| `REL` | release-manager | Release lifecycle, versioning, publish order, changelog |
| `DOC` | documentation-steward | Docs structure, lifecycle, drift prevention |
| `QA` | qa-test-architect | Testing strategy, fixtures, regression |
| `ANA` | analytics-architect | Event taxonomy, KPIs, instrumentation, funnels |
| `SC` | spec-compliance | Post-impl verdict: code vs specs |
| `LEA` | researcher | Read-only exploration — findings, never recommendations |
| `WEB` | web-strategist | Brand and content strategy for public-facing web (positioning, sitemap, messaging) |

**Composition rules**: one owner per decision · specs before code · roles implement only after convergence or explicit user ask (`LEA` stays strictly read-only) · `SEC` can interrupt anywhere · `LEA` never recommends · roles know the full catalog and may invoke any other when the situation warrants it; "Role relationships" lists typical handoffs, not a contract.

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
- Respect file size and one-symbol-per-file limits in `.cursor/rules/code-quality.mdc`. Refuse to write violating code; refactor instead.
- For any architectural decision, emit an ADR in `docs/decisions/` before implementation.
- Update docs in the same change as code when behavior changes (see `docs/MAINTAINING.md`).
- Follow the delivery circuit (`docs/guides/delivery-circuit.md`): work items live in `docs/stories/` (functional) and `docs/requirements/` (technical); specs are read from files, never re-pasted into prompts.
- **Estimation discipline:** any role that evaluates a story/requirement fills its estimation table (milestones, estimated hours) BEFORE implementation; whoever executes records real start/finish per milestone. Closing a work item with an incomplete estimation table is invalid.
- Respect `docs/DEVIATIONS.md`: recorded deviations from the crew standard are decisions, not defects.
