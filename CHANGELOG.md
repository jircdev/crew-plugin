# Changelog

All notable changes to the crew plugin. Format: [Keep a Changelog](https://keepachangelog.com).

## [0.12.0] — 2026-06-19

### Changed

- Marketplace renamed `julio-crew` → `factory-crew`. **Breaking**: the install id changes from `crew@julio-crew` to `crew@factory-crew`. Consumers must update the `extraKnownMarketplaces` key and the `enabledPlugins` id in their `settings.json` and restart Claude Code.
- README rewrites the install guide as a dedicated "Installation" section: consumer flow (github source) vs author flow (directory source), copy-pasteable `settings.json` JSON with the exact keys, restart + verify step, and troubleshooting for the two field failure modes (wrong `marketplaces` key silently ignored; `directory` source not resolving for teammates).

### Fixed

- `marketplace.json` declared a stale plugin `version` (0.10.0); realigned to the package version.

## [0.11.1] — 2026-06-11

### Changed

- Work entry filenames standardize on dashes: `docs/work/YYYY-MM/YYYY-MM-DD-slug.md` (was `_slug`). Absorbed from rvd.ai, where ~550 historical entries already used the dash form; the Stop hook matched both all along.

## [0.11.0] — 2026-06-11

Lessons absorbed from the rvd.ai field audit: conventions without enforcement drift; audience and kind ambiguity creates parallel structures.

### Added

- `PreToolUse` hook `guard-estimation.js`: denies closing a story/requirement whose estimation table is missing rows or has empty Est. hours/Started/Finished/Actual hours; fails open.
- `Stop` hook `check-work-log.js`: when the project follows the standard (`docs/work/` exists) and there are commits today without a `docs/work/YYYY-MM/` entry dated today, blocks the stop once with a reminder; fails open.
- Kind-in-slug taxonomy: `NNN-bug-slug.md` (stories) and `NNN-audit-slug.md` (requirements) — filename is the taxonomy; no kind folders, no kind field. RFC-style ideas remain `proposals/`.
- Timestamp format for estimation tables: `YYYY-MM-DD HH:MM -ZZ:ZZ`, stamped from the clock (`date "+%Y-%m-%d %H:%M %z"`), never reconstructed.

### Changed

- `docs/guides/` scope clarified as builder/agent-facing only; end-user/product documentation is out of scope and gets its own location (e.g. `docs/product/`).
- Session baseline (`standards/session-context.md`) now states the ADR placement rule (status in header, no separate proposed folder), the kind-in-slug convention, and the timestamp format.

## [0.10.0] — 2026-06-10

### Added

- `docs/briefs/` layer: executive decision requests — the gate between idea and backlog for initiatives needing a non-technical sponsor's approval (CEO/CTO/client). Hard cap 800 words, one explicit ask, immutable after decision, sponsor declared in the ownership map. Wired into the delivery circuit as step 0 (sponsor gate), the taxonomy, the bootstrap script, and product-strategist's canonical deliverables.

### Changed

- All 20 agent `description` fields rewritten as delegation triggers (use-when + owns + boundary with sibling roles) so the main agent auto-delegates consistently.

## [0.9.0] — 2026-06-10

First publishable version.

### Added

- 20 role subagents (`agents/`) + 20 `/crew:<alias>` slash commands, conversational by default; deliverables only on explicit request. Caps per role: exact scope, short format, max 2 open questions, jargon glossing, token economy, no premature handoffs, consult-don't-defer.
- `functional-analyst` role (`/crew:fa`): requirements → stories with acceptance criteria → functional validation.
- Full `docs/` taxonomy templates: `stories/`, `requirements/`, `decisions/` (state-in-file, no pending folder), `proposals/`, `guides/delivery-circuit.md`, `work/` (evidence-never-truth contract), `DEVIATIONS.md`.
- Delivery circuit standard with chaining policy and role ownership map.
- Mandatory estimation tables (milestones, estimated vs. actual hours) embedded in work items.
- `SessionStart` hook: injects `standards/session-context.md` baseline into every session.
- `PreToolUse` hook: denies edits to existing `docs/work/` entries and Closed work items; fails open.
- Universal code-quality core (`templates/.cursor/rules/code-quality.mdc`) as suggestive defaults; project rules take precedence.
- Interop contract: `AGENTS.md` (open standard) as canonical agent context; `CLAUDE.md` as `@AGENTS.md` pointer.
- Documentation-steward audit protocol for onboarding existing projects (findings → owner decides → DEVIATIONS + precedence written into AGENTS.md).
- Roles inherit all tools (search/edit code) gated by specs-before-code; `researcher` stays read-only.
