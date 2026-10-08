# crew

[![version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fjircdev%2Fcrew-plugin%2Fmain%2F.claude-plugin%2Fplugin.json&query=%24.version&label=version&prefix=v&color=blue)](.claude-plugin/plugin.json)

> Read this in **English** (below) · ¿Prefieres español? → **[Léelo en español](docs/es/README.md)**

Coding agents are generalists. Point one at your repo and it starts writing code right away: nobody owns each decision, the reasoning behind the architecture gets lost between sessions, and every new chat reopens what was already settled.

crew gives that agent a process. It is a plugin for Claude Code and Codex that adds:

- a catalog of specialized roles, with one owner per decision;
- a spec-driven flow from idea to production;
- conventions that live in the repo and that Claude Code, Cursor, Copilot and Codex read natively, so each decision is written once and read many times.

It works with any stack.

## How the work flows

The crew follows a spec-driven, Scrum-aligned circuit. Each stage leaves an artifact in the repo, and agents read it from there. Full standard: [delivery circuit](templates/docs/guides/delivery-circuit.md).

Which roles work at each stage, and the full catalog by area: [roles.md](docs/en/roles.md).

## Documentation

| If you want to… | Read |
|-----------------|------|
| Install in Claude Code, update or remove | [installation.md](docs/en/installation.md) |
| Install in Codex | [compatibility.md § Install in Codex](docs/en/compatibility.md#install-in-codex) |
| Set up a new project or adopt an existing one | [using-crew.md](docs/en/using-crew.md) |
| Choose the project mode (team or solo) | [using-crew.md § Choose the mode](docs/en/using-crew.md#choose-the-project-mode) |
| See every command: roles, `/crew:setup`, `/crew:check`, `/crew:doctor`, `/crew:adopt`, `/crew:metrics`, `/crew:factory` | [using-crew.md § Commands](docs/en/using-crew.md#crew-commands) |
| Meet the roles and what each one decides | [roles.md](docs/en/roles.md) |
| Configure `crew.json`: mode, metrics, quality, ceilings, design, testing and receipts, audit, telemetry, factory | [configuration.md](docs/en/configuration.md) |
| Understand what each guard does and fix a block | [enforcement.md](docs/en/enforcement.md) |
| Register an exception in `docs/DEVIATIONS.md` (`crew:exempt`, `crew:standard`, `crew:policy`, `crew:security`, with `owner:` and `expires:`) | [enforcement.md § Blocks](docs/en/enforcement.md#docsdeviationsmd-blocks) |
| Plan and estimate work (`planning` skill, effective standard) | [using-crew.md § Plan](docs/en/using-crew.md#plan-and-estimate-work) |
| Scan the agent configuration for security risks | [using-crew.md § Security](docs/en/using-crew.md#security-triggers-and-the-instruction-boundary) |
| Measure delivery and catalog usage | [metrics.md](docs/en/metrics.md) |
| Work in a project whose tasks and time live in factory | [factory.md](docs/en/factory.md) |
| Work solo with the minimum ceremony | [solo-quickstart.md](docs/en/solo-quickstart.md) |
| Use crew without being a developer (CEO, analyst) | [non-technical-roles.md](docs/en/non-technical-roles.md) |
| Understand the end-to-end delivery process | [delivery circuit](templates/docs/guides/delivery-circuit.md) |
| Set up a project after upgrading to 1.0 | [upgrade-1.0.md](docs/en/upgrade-1.0.md) — start here if you used crew before |
| Compare crew with ECC | [comparison-ecc.md](docs/en/comparison-ecc.md) |
| Move a project to a new version | Migration guides: [0.21](docs/en/migration-0.21.md) · [0.22](docs/en/migration-0.22.md) · [0.23](docs/en/migration-0.23.md) · [0.24](docs/en/migration-0.24.md) · [0.26](docs/en/migration-0.26.md) · [0.27](docs/en/migration-0.27.md) · [0.28](docs/en/migration-0.28.md) · [0.29](docs/en/migration-0.29.md) · [0.30](docs/en/migration-0.30.md) · [0.31](docs/en/migration-0.31.md) |
| See what each host (Claude Code and Codex) covers, and its limits | [compatibility.md](docs/en/compatibility.md) |
| Add a role or change the plugin | [contributing.md](docs/en/contributing.md) |

## What's inside

- **Roles** (`agents/`, `commands/`): 17 roles, each with its `/crew:<alias>` command. Retired aliases still answer and hand off to their successor.
- **Skills** (`skills/`): 35 alias entries generated from the commands, shared by Claude and Codex, and three crafts any role loads: `planning` (plans and estimates as work items in the project's standard), `writing` (how a piece communicates) and `design` (composition, handoff, implementation review and render judgment). The crafts carry method only; each product's taste is declared by its project.
- **Hooks** (`hooks/`): `SessionStart` loads the session baseline, the configuration status and the work in progress. The `PreToolUse` guards protect immutable artifacts, the estimation and verification tables, timestamps, size ceilings, work-item shape, hook bypass and policy relaxations. `Stop` checks the work log. In factory mode, `capture-activity` records work-time intervals (timestamps only) and sends them to factory. Detail: [enforcement.md](docs/en/enforcement.md).
- **Pre-commit gate**: installed by the scaffold, it enforces the same size ceilings at commit time. Exemptions are pre-registered in the `crew:exempt` block of `docs/DEVIATIONS.md`.
- **Templates** (`templates/`): `AGENTS.md` (canonical agent context), a `CLAUDE.md` pointer, `standards/` and the `docs/` taxonomy (stories, requirements, decisions, briefs, proposals, as-is, guides, work, DEVIATIONS). The design memory (`docs/design/`) and the testing strategy (`docs/guides/testing.md`) are scaffolded empty for the project to fill in.
- **Per-repo config** (`crew.json`): mode, metrics, quality, ceilings and capabilities. Nothing is granted by default, and a repo without `crew.json` keeps the previous behavior. Reference: [configuration.md](docs/en/configuration.md).
- **Session baseline** (`standards/session-context.md`): always-on behavior rules. Process knowledge stays in the project's `standards/` and `docs/guides/`, and the project's own rules always win.
- **Scripts** (`scripts/`): scaffold (`init-project.js`, with the `init-project.sh` wrapper), doctor, verification with receipts, metrics, security scan, factory login (`factory-login.js`) and release builds.
- **Factory mode** (`factory` block in `crew.json`): the project's tasks and time live in factory. crew sends it the human and agent time captured on this machine, and `/crew:metrics` reads factory's backlog. Detail: [factory.md](docs/en/factory.md).
- **Two hosts**: `.claude-plugin/` and `.codex-plugin/` manifests, an `apply_patch` adapter for Codex that uses the same guards, and release archives built by `scripts/build-release.py`. Shell and MCP writes stay outside the file guards. Detail: [compatibility.md](docs/en/compatibility.md).

## License

MIT.
