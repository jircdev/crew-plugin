# crew

[![version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fjircdev%2Fcrew-plugin%2Fmain%2F.claude-plugin%2Fplugin.json&query=%24.version&label=version&prefix=v&color=blue)](.claude-plugin/plugin.json)

> 🌐 Read this in **English** (below) · ¿Prefieres español? → **[Léelo en español](docs/es/README.md)**

Coding agents are generalists. Point one at your repo and it jumps straight to code — no one owns the decision, the rationale behind the architecture evaporates between sessions, and every new chat relitigates what you already settled. The hard part stopped being *writing the code*; it became *keeping a process sane enough to survive from one session to the next*.

crew is that process, packaged as a plugin. It turns a single generalist agent into a structured crew: a catalog of specialized roles where exactly one owns each decision, a spec-driven flow from idea to shipped, and conventions that live in the repo — read natively by Claude Code, Cursor, Copilot and Codex — so each decision is written once and consumed many times instead of re-explained. It is stack-agnostic, and grows beyond roles: future versions may add MCP-backed lookups, project-memory helpers, and other on-demand specialists.

## How the work flows

The crew follows a spec-driven, Scrum-aligned circuit — one artifact per stage, read from the repo, never re-pasted into a prompt. Full standard: [delivery circuit](templates/docs/guides/delivery-circuit.md).

Each stage is staffed by specific roles — the stage-by-stage table and the full catalog, organized by area with what each role owns, are in [roles.md](docs/en/roles.md).

## Documentation

Crew supports Claude Code and Codex through one shared catalog. See
[compatibility and Codex installation](docs/en/compatibility.md) for activation,
configuration, verification, updates, hook coverage and runtime test evidence.

| If you want to… | Read |
|-----------------|------|
| Meet the roles and what each owns | [roles.md](docs/en/roles.md) |
| Install, update, or remove the plugin | [installation.md](docs/en/installation.md) |
| Invoke roles, bootstrap a project, onboard an existing one, customize the scaffolded docs | [using-crew.md](docs/en/using-crew.md) |
| Configure crew per repo — `crew.json` reference (modes, metrics, quality, ceilings, design capabilities) | [configuration.md](docs/en/configuration.md) |
| Understand what each guard enforces and troubleshoot a deny | [enforcement.md](docs/en/enforcement.md) |
| Measure delivery — the estimation → metrics flow | [metrics.md](docs/en/metrics.md) |
| Work in a project whose tasks and time live in factory | [factory.md](docs/en/factory.md) |
| Adopt design capabilities and design memory | [migration-0.22.md](docs/en/migration-0.22.md) |
| Migrate an existing project from the retired aliases | [migration-0.21.md](docs/en/migration-0.21.md) |
| Work solo with the minimum ceremony | [solo-quickstart.md](docs/en/solo-quickstart.md) |
| Use crew from a non-technical seat (CEO, analyst) | [non-technical-roles.md](docs/en/non-technical-roles.md) |
| Understand the end-to-end delivery process | [delivery circuit](templates/docs/guides/delivery-circuit.md) |
| Add a role or change the plugin | [contributing.md](docs/en/contributing.md) |

## What's inside

- **Subagents + slash commands** (`agents/`, `commands/`) — one per role; `/crew:<alias>` spawns the matching subagent, and retired aliases answer with their successor for one version.
- **Templates** (`templates/`) — `AGENTS.md` (canonical agent context), a `CLAUDE.md` pointer, `standards/` (the code-quality core), and the full `docs/` taxonomy (stories, requirements, decisions, proposals, the delivery circuit, work history, DEVIATIONS).
- **Skills** (`skills/`) — 31 generated alias entry points share the original role/command criteria across Claude and Codex. The horizontal crafts remain `writing` (how a piece communicates) and `design` (composition, handoff, implementation review and render judgment). Method only — what is beautiful in a given product is that project's to declare.
- **Hooks** (`hooks/`) — `SessionStart` injects the session baseline and, only when it has something actionable to say, the project-configuration status; `PreToolUse` guards immutable artifacts, the estimation gate, real-time estimation timestamps, and code-quality ceilings; `Stop` checks closure traceability; in factory mode, `capture-activity` records work-time intervals (timestamps only) and sends them to factory; a pre-commit quality gate (installed by `init-project.sh`) enforces the same ceilings at commit time, with pre-registered exemptions via a `crew:exempt` block in `docs/DEVIATIONS.md`.
- **Per-repo config** (`crew.json`) — `mode: solo|team`, `metrics`, `quality: advise|enforce|off`, `ceilings`, plus `design` capabilities (where the app runs, component registry, render capture, checks, fallback taste), `testing` capabilities (strategy guide, e2e harness and where its specs live, suite commands), and the `configuredWith` marker. Nothing is granted by default: an undeclared capability is one the roles report they could not use. A repo without `crew.json` behaves exactly as before. Reference: [configuration.md](docs/en/configuration.md).
- **Design memory** (`docs/design/` in your project) — references, approved patterns, rejected patterns. Scaffolded empty: the taste is the project's, never the plugin's. Declared via `design.memory`; configured by `/crew:setup`, which asks and never guesses.
- **Testing strategy** (`docs/guides/testing.md` in your project) — levels, harness, adoption bar, manual protocol, and what is deliberately not verified. Scaffolded empty in both modes: the tooling is the project's. Every work item carries a `## Verification` table written at planning next to its estimation — level, harness, artifact, status per behavior. Declaring `testing` in `crew.json` makes that table a closure gate.
- **Metrics** — `/crew:metrics` + `scripts/metrics.js` report: lead time, execution time, estimate deviation, `--csv` export.
- **Session baseline** (`standards/session-context.md`) — always-on **behavior** only (conversation style, office rule, two modes, document craft); process knowledge is not inlined, it points to the project's scaffolded `standards/` and `docs/guides/`. Suggestive defaults, the project's own rules always win.
- **Bootstrap script** (`scripts/init-project.sh`) — scaffolds the templates into a new project; `--solo` for the single-dev path.
- **Dual-host release** — `.claude-plugin/` and `.codex-plugin/` manifests, a Codex `apply_patch` adapter using the existing guards, and versioned `.plugin`/ZIP plus Codex marketplace archives from `scripts/build-release.py`. Shell/MCP writes remain outside file guards. The [compatibility guide](docs/en/compatibility.md) includes installation through verification and updates, plus controlled-runtime test evidence and limits.

## License

MIT.
