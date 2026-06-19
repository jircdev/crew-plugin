# crew plugin

Stack-agnostic catalog of specialized agent roles — your on-demand crew of architects, strategists, and reviewers. Plus reusable code-quality rules and documentation skeleton for new projects.

Designed to grow beyond roles: future versions may bundle MCP-backed lookups, project-memory helpers, and other on-demand specialists.

Bundles:

- **20 subagents** (`agents/`) — one per role, with frontmatter for direct activation as Claude Code subagents.
- **20 slash commands** (`commands/`) — `/crew:prod`, `/crew:sys`, `/crew:ux`, `/crew:da`, etc., each spawning the matching subagent. Conversational by default; structured deliverables only on explicit request.
- **Templates** (`templates/`) — `AGENTS.md` (canonical agent context, AGENTS.md open standard; includes rule precedence, role ownership map, interop contract), `CLAUDE.md` (thin `@AGENTS.md` pointer for Claude Code), `.cursor/rules/`, and the full `docs/` taxonomy: `stories/` (functional work items), `requirements/` (technical work items), `decisions/` (ADRs, state-in-file), `proposals/`, `guides/delivery-circuit.md` (the spec-driven circuit + chaining policy), `work/` (history — evidence, never truth), and `DEVIATIONS.md` (accepted-deviations registry, binding for agents). Work items embed a mandatory estimation table (milestones, estimated vs. actual hours) to measure each agentic iteration.
- **Hooks** (`hooks/`) — two automatic behaviors, loaded with the plugin:
  - `SessionStart` → injects `standards/session-context.md` (~25 lines: rule precedence, delivery circuit, estimation discipline, code-quality core, conversation style, consult-don't-defer) into every session. One local file read, no network.
  - `PreToolUse` (on `Edit|Write`) → **denies** edits to existing `docs/work/` entries and to stories/requirements with `Status: Closed` — they are immutable by standard. The denial message explains the rule; the guard fails open on any internal error so it never blocks legitimate work.
- **Session baseline** (`standards/session-context.md`) — the always-on context the SessionStart hook injects. Suggestive defaults: the project's own rules always win (see Rule precedence in `templates/AGENTS.md`).
- **Bootstrap script** (`bin/init-project.sh`) — scaffolds the templates into a new project.

## Installation

The plugin id is `crew@factory-crew` (marketplace `factory-crew`, plugin `crew`). Install is configured in your user `settings.json` — **not** via `/plugin marketplace add`, which only registers a path on your own machine.

- macOS/Linux: `~/.claude/settings.json`
- Windows: `C:\Users\<user>\.claude\settings.json`

You declare the marketplace under `extraKnownMarketplaces` and enable the plugin under `enabledPlugins`. Pick **one** of the two flows below.

### Consumer (recommended — installs from GitHub)

For anyone using the plugin without editing it. Resolves on any machine.

```json
{
  "extraKnownMarketplaces": {
    "factory-crew": {
      "source": {
        "source": "github",
        "repo": "jircdev/crew-plugin"
      }
    }
  },
  "enabledPlugins": {
    "crew@factory-crew": true
  }
}
```

### Author / local development (edits the working tree)

For maintainers who edit the plugin and want their local clone to be the live source. Identical to the consumer config except the marketplace `source` points at the clone path — so it resolves **only** on your machine.

```json
{
  "extraKnownMarketplaces": {
    "factory-crew": {
      "source": {
        "source": "directory",
        "path": "C:/w/crew-plugin"
      }
    }
  },
  "enabledPlugins": {
    "crew@factory-crew": true
  }
}
```

### Restart and verify

`settings.json` is read at startup, so **restart Claude Code** after editing it. Then verify either way:

- A `/crew:<alias>` command resolves — e.g. type `/crew:sys` and it spawns the system-architect.
- The plugin appears in the `/plugin` list as `crew@factory-crew`.

On the first session after enabling, Claude Code asks you to approve the plugin's two hooks (see Bundles above) — one-time approval.

### Troubleshooting

- **Plugin never appears / `/crew:*` not found.** Check the settings key is exactly `extraKnownMarketplaces`. A key named `marketplaces` is silently ignored — the marketplace is never registered and nothing errors.
- **Works for you but not for teammates.** The marketplace `source` is `directory` with a local `path`. A local path exists only on your machine; everyone else must use the `github` source above.
- **Edited settings but nothing changed.** You did not restart. Claude Code only reads `settings.json` at startup.

## Bootstrap a new project

From the root of the new (empty) project:

```bash
bash C:/w/crew-plugin/bin/init-project.sh
```

This drops in `AGENTS.md`, `CLAUDE.md`, the `.cursor/rules/` baseline, and the full `docs/` taxonomy (stories, requirements, decisions, proposals, guides, work, DEVIATIONS). Existing files are preserved (skipped, not overwritten).

## Onboard an EXISTING project

Do **not** scaffold over a project that already has docs and conventions. The entry point is the audit:

```
/crew:doc audit this project's docs against the crew standard
```

The documentation-steward inventories the project against the plugin taxonomy, reports aligned/deviated/missing findings, and you decide per finding: converge (becomes a story/requirement) or keep the deviation. Kept deviations are recorded in `docs/DEVIATIONS.md` and the precedence resolution is written into the project's root `AGENTS.md` — binding for all agents, never re-litigated per session. The plugin baseline is suggestive; the project's own rules always win.

Then:

1. Edit `AGENTS.md` — fill in `{PROJECT_NAME}`, stack table, folder layout, and commands.
2. Write `docs/spec.md` with the project's technical spec.
3. Pick stack-specific rules from `templates/.cursor/rules-stack-examples/` (Tauri+React, Rust, Node sidecar) and copy the relevant ones into `.cursor/rules/`.
4. Install the plugin (above) so `/crew:sys`, `/crew:ux`, etc. are available.

## Usage

### Slash command

```
/crew:sys add an IPC command for spawning a process with custom env vars
```

Spawns the `system-architect` subagent. It reads its role doc, restricts itself to the role's authority, and returns the canonical deliverable (in this case: an architectural spec).

### Alias prefix (interpreted by AGENTS.md)

```
SYS: add an IPC command for spawning a process with custom env vars
UX: redesign the process panel for the "All" view
LEA: where is the workspace detection implemented?
```

The project's `AGENTS.md` instructs the main agent to honor the prefix and either spawn the subagent or read the role doc and adopt its constraints.

### Composition rules

From `agents/` (each role doc):

- One owner per decision.
- Specs before code. Roles can search and edit code, but implement only after the direction converges or the user explicitly asks — never as the first response. `researcher` is the exception: strictly read-only.
- `security-compliance` may interrupt any role.
- `researcher` returns findings, never recommendations.
- Roles know the full catalog. The "Role relationships" section in each role doc lists **typical** handoffs and consults; any role may invoke any other when the situation warrants it.
- **Consult, don't defer.** When a complete answer needs another role's judgment, the agent obtains it now (spawn or lens-adoption) and answers in the same turn — never closes with "review this with ROLE".
- **Chaining policy.** After a deliverable, the next role chains in-session only if its human owner (per the project's `AGENTS.md` § Role ownership map) is the session user; otherwise the work stops at the artifact and awaits that human's approval.
- **Estimation discipline.** Every story/requirement embeds a milestone estimation table (estimated vs. actual hours), filled before implementation — this is how teams measure the cost of each agentic iteration.

## Folder structure

```
crew-plugin/
├── .claude-plugin/
│   ├── plugin.json
│   └── marketplace.json
├── agents/
│   ├── product-strategist.md
│   ├── functional-analyst.md
│   ├── system-architect.md
│   ├── ... (20 total)
├── commands/
│   ├── prod.md
│   ├── fa.md
│   ├── sys.md
│   ├── ... (20 total)
├── hooks/
│   ├── hooks.json            # registers the two hooks below
│   ├── session-start.js      # SessionStart: inject standards/session-context.md
│   └── guard-immutable.js    # PreToolUse: deny edits to immutable artifacts
├── standards/
│   └── session-context.md    # always-on session baseline (suggestive defaults)
├── templates/
│   ├── AGENTS.md             # canonical agent context (precedence, ownership map, interop)
│   ├── CLAUDE.md             # thin @AGENTS.md pointer
│   ├── .cursor/rules/
│   │   ├── general.mdc
│   │   ├── communication.mdc
│   │   └── code-quality.mdc  # universal core (suggestive; project rules win)
│   ├── .cursor/rules-stack-examples/
│   │   ├── code-quality-tauri-react.mdc
│   │   ├── frontend-tauri-react.mdc
│   │   ├── rust-core.mdc
│   │   └── node-sidecar.mdc
│   └── docs/
│       ├── INDEX.md
│       ├── AGENTS.md
│       ├── MAINTAINING.md
│       ├── DEVIATIONS.md
│       ├── stories/README.md
│       ├── requirements/README.md
│       ├── proposals/README.md
│       ├── guides/delivery-circuit.md
│       ├── decisions/
│       │   ├── README.md
│       │   └── 0000-template.md
│       └── work/README.md
├── bin/
│   └── init-project.sh
├── LICENSE
└── README.md
```

## Updating the plugin

Roles and templates evolve. To propagate changes to consumers:

1. Edit the relevant file in `agents/`, `commands/`, or `templates/`.
2. Bump `version` in `.claude-plugin/plugin.json`.
3. Commit and push.
4. Consumers run `/plugin update crew@factory-crew`. (Author/local-dev installs consume the working tree directly — just pull.)

For template changes, existing projects must re-run `bin/init-project.sh` (which skips existing files) or merge the new template manually.

## Maintenance

- **Adding a new role**: drop a new `agents/<name>.md` (with frontmatter), a new `commands/<alias>.md`, and add a row to `templates/AGENTS.md` alias table.
- **Renaming a role**: don't. Aliases are a shared vocabulary; renaming breaks all downstream projects.
- **Stack-specific rule**: add to `templates/.cursor/rules-stack-examples/`, never to the universal `.cursor/rules/` set.

## License

MIT.
