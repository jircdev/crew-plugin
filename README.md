# crew

[![version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fjircdev%2Fcrew-plugin%2Fmain%2F.claude-plugin%2Fplugin.json&query=%24.version&label=version&prefix=v&color=blue)](.claude-plugin/plugin.json)

> 🌐 Read this in **English** (below) · ¿Prefieres español? → **[Léelo en español](docs/es/README.md)**

Coding agents are generalists. Point one at your repo and it jumps straight to code — no one owns the decision, the rationale behind the architecture evaporates between sessions, and every new chat relitigates what you already settled. The hard part stopped being *writing the code*; it became *keeping a process sane enough to survive from one session to the next*.

crew is that process, packaged as a plugin. It turns a single generalist agent into a structured crew: a catalog of specialized roles where exactly one owns each decision, a spec-driven flow from idea to shipped, and conventions that live in the repo — read natively by Claude Code, Cursor, Copilot and Codex — so each decision is written once and consumed many times instead of re-explained. It is stack-agnostic, and grows beyond roles: future versions may add MCP-backed lookups, project-memory helpers, and other on-demand specialists.

## How the work flows

The crew follows a spec-driven, Scrum-aligned circuit — one artifact per stage, read from the repo, never re-pasted into a prompt. Full standard: [delivery circuit](templates/docs/guides/delivery-circuit.md).

| Stage | What happens | Artifact | Roles |
|-------|--------------|----------|-------|
| [**1 · Vision**](docs/en/roles.md) | The *why* and the goal; sponsor go/no-go before any backlog work | `docs/briefs/` | `COM` [commercial-strategist](agents/commercial-strategist.md)<br>`PROD` [product-strategist](agents/product-strategist.md) |
| [**2 · Backlog & design**](docs/en/roles.md) | Decompose intent into stories with acceptance criteria; define what each screen needs and how it looks | `docs/stories/` | `FA` [functional-analyst](agents/functional-analyst.md)<br>`COORD` [delivery-coordinator](agents/delivery-coordinator.md)<br>`DEA` [data-experience-architect](agents/data-experience-architect.md)<br>`UX` [ux-architect](agents/ux-architect.md)<br>`VIS` [visual-identity](agents/visual-identity.md)<br>`WEB` [web-strategist](agents/web-strategist.md)<br>`COMM` [communications-strategist](agents/communications-strategist.md) |
| [**3 · Technical design**](docs/en/roles.md) | Architecture decisions just-in-time (not a big upfront document); purely-technical work as its own track | `decisions/` (ADR) · `spec.md` · `requirements/` | `SYS` [system-architect](agents/system-architect.md)<br>`DA` [data-architect](agents/data-architect.md)<br>`MOD` [module-extension-architect](agents/module-extension-architect.md)<br>`DX` [dx-architect](agents/dx-architect.md)<br>`FE` [frontend-architect](agents/frontend-architect.md) |
| [**4 · Build**](docs/en/roles.md) | Implement a Ready story/requirement; the domain architect implements its own area | code + PR | (stage-3 roles, implementation mode) |
| [**5 · Ship & verify**](docs/en/roles.md) | Test, validate against criteria, secure, deploy, release, measure | story Validation · `work/` | `QA` [qa-test-architect](agents/qa-test-architect.md)<br>`SC` [spec-compliance](agents/spec-compliance.md)<br>`SEC` [security-compliance](agents/security-compliance.md)<br>`PERF` [performance-reliability](agents/performance-reliability.md)<br>`INFRA` [atlas-deploy](agents/atlas-deploy.md)<br>`REL` [release-manager](agents/release-manager.md)<br>`ANA` [analytics-architect](agents/analytics-architect.md) |

Technical design (stage 3) is **not** a mandatory gate before every story — decisions are made just-in-time per work item; a full upfront spec belongs only to purely-technical initiatives (a `requirement`, parallel to stories), never as waterfall. 25 roles staff this circuit, plus cross-cutting `DOC` [documentation-steward](agents/documentation-steward.md), `LEA` [researcher](agents/researcher.md), `CA` [crew-architect](agents/crew-architect.md) and `INST` [crew-installer](agents/crew-installer.md) — the full catalog with what each owns is in [roles.md](docs/en/roles.md).

## Documentation

| If you want to… | Read |
|-----------------|------|
| Meet the 25 roles and what each owns | [roles.md](docs/en/roles.md) |
| Install, update, or remove the plugin | [installation.md](docs/en/installation.md) |
| Invoke roles, bootstrap a project, onboard an existing one | [using-crew.md](docs/en/using-crew.md) |
| Understand the end-to-end delivery process | [delivery circuit](templates/docs/guides/delivery-circuit.md) |
| Add a role or change the plugin | [contributing.md](docs/en/contributing.md) |

## What's inside

- **25 subagents** + **25 slash commands** (`agents/`, `commands/`) — one per role; `/crew:<alias>` spawns the matching subagent.
- **Templates** (`templates/`) — `AGENTS.md` (canonical agent context), a `CLAUDE.md` pointer, `standards/` (the code-quality core), and the full `docs/` taxonomy (stories, requirements, decisions, proposals, the delivery circuit, work history, DEVIATIONS).
- **Hooks** (`hooks/`) — `SessionStart` injects the session baseline; `PreToolUse` guards immutable artifacts, the estimation-table gate, and code-quality file-size ceilings; `Stop` checks closure traceability.
- **Session baseline** (`standards/session-context.md`) — always-on **behavior** only (conversation style, office rule, two modes, document craft); process knowledge is not inlined, it points to the project's scaffolded `standards/` and `docs/guides/`. Suggestive defaults, the project's own rules always win.
- **Bootstrap script** (`bin/init-project.sh`) — scaffolds the templates into a new project.

## License

MIT.
