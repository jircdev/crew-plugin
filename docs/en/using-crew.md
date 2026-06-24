# Using crew

How to invoke the roles, scaffold a new project, and onboard an existing one. For the end-to-end process the roles follow, see the [delivery circuit](../../templates/docs/guides/delivery-circuit.md).

## Bootstrap a new project

From the root of the new (empty) project:

```bash
bash C:/w/crew-plugin/bin/init-project.sh
```

This drops in `AGENTS.md`, `CLAUDE.md`, the `.cursor/rules/` baseline, and the full `docs/` taxonomy (stories, requirements, decisions, proposals, guides, work, DEVIATIONS). Existing files are preserved (skipped, not overwritten).

Then:

1. Edit `AGENTS.md` — fill in `{PROJECT_NAME}`, stack table, folder layout, and commands.
2. Write `docs/spec.md` with the project's technical spec.
3. Pick stack-specific rules from `templates/.cursor/rules-stack-examples/` (Tauri+React, Rust, Node sidecar) and copy the relevant ones into `.cursor/rules/`.
4. [Install the plugin](installation.md) so `/crew:sys`, `/crew:ux`, etc. are available.

## Onboard an existing project

Do **not** scaffold over a project that already has docs and conventions. The entry point is the audit:

```
/crew:doc audit this project's docs against the crew standard
```

The documentation-steward inventories the project against the plugin taxonomy, reports aligned/deviated/missing findings, and you decide per finding: converge (becomes a story/requirement) or keep the deviation. Kept deviations are recorded in `docs/DEVIATIONS.md` and the precedence resolution is written into the project's root `AGENTS.md` — binding for all agents, never re-litigated per session. The plugin baseline is suggestive; the project's own rules always win.

## Invoking a role

There are **two ways** to put a role to work. Both end the same way — a specialist answers instead of a generalist — they differ in setup and in how they read.

### 1. Slash command — `/crew:<alias>` (works out of the box)

Type a slash command and the role takes that message:

```
/crew:sys how should I split the payments module from the rest?
/crew:ux lay out the home screen for someone opening the app for the first time
```

Nothing to set up: the moment the plugin is installed, the 24 commands exist in **every** project. This is the simplest way and the first one to reach for.

### 2. Prefix — `ROLE:` (reads like talking to a person)

Start a message with a role's alias and a colon:

```
SYS: how should I split the payments module from the rest?
UX: lay out the home screen for a first-time user
```

It reads more naturally than a slash command, but it does **not** work on its own — it needs the *activation protocol* in context first. You get that in one of two scopes:

- **Per project** — a project bootstrapped with the crew carries it in its `AGENTS.md`, so the prefix works inside that project.
- **Everywhere (global)** — inject it once into your `~/.claude/CLAUDE.md`, which Claude reads in every session (see below).

### Which one should I use?

| | `/crew:sys …` | `SYS: …` |
|---|---|---|
| Setup | none — works once installed | needs activation (project or global) |
| Where it works | any project | wherever the protocol is injected |
| Feels like | a command | natural language |
| Best for | the occasional expert call | working in role mode often |

If in doubt, use the slash command. The prefix is a convenience for people who live in role mode.

### Turn the prefix on everywhere (global)

Run the installer once, pointed at your global config:

```
/crew:inst activate the crew in my global ~/.claude/CLAUDE.md so the "ROLE:" prefix works in every session
```

It writes the activation protocol + the alias table into `~/.claude/CLAUDE.md`. From then on `SYS:`, `DA:`, `UX:`, … work in any session and any project. A project's own `AGENTS.md` still wins wherever it disagrees.

### One message, or the whole conversation?

By default the prefix activates the role for **that one message**; the next message is back to the generalist. If you want the role to **stay** for the whole conversation (say `SYS:` once and remain system-architect until you switch), ask the installer for the sticky variant:

```
/crew:inst … but make it sticky: a "ROLE:" prefix stays active for the whole conversation until a different "ROLE:" is declared
```

With sticky mode, keep a way back to the generalist (e.g. a `GEN:` reset) so you are never stuck in one role.

## Composition rules

From `agents/` (each role doc):

- One owner per decision.
- Specs before code. Roles can search and edit code, but implement only after the direction converges or the user explicitly asks — never as the first response. `researcher` is the exception: strictly read-only.
- `security-compliance` may interrupt any role.
- `researcher` returns findings, never recommendations.
- Roles know the full catalog. The "Role relationships" section in each role doc lists **typical** handoffs and consults; any role may invoke any other when the situation warrants it.
- **Consult, don't defer.** When a complete answer needs another role's judgment, the agent obtains it now (spawn or lens-adoption) and answers in the same turn — never closes with "review this with ROLE".
- **Chaining policy.** After a deliverable, the next role chains in-session only if its human owner (per the project's `AGENTS.md` § Role ownership map) is the session user; otherwise the work stops at the artifact and awaits that human's approval.
- **Estimation discipline.** Every story/requirement embeds a milestone estimation table (estimated vs. actual hours), filled before implementation — this is how teams measure the cost of each agentic iteration.
