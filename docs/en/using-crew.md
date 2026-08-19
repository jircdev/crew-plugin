# Using crew

How to invoke the roles, scaffold a new project, onboard an existing one, and customize the scaffolded docs. For the end-to-end process the roles follow, see the [delivery circuit](../../templates/docs/guides/delivery-circuit.md).

## Set up a new project

With the plugin installed, just ask the crew to set it up — no script, no terminal:

```
set up the crew structure in this project
```

The `CREW` meta-role scaffolds `AGENTS.md`, `CLAUDE.md`, the `standards/` baseline, and the full `docs/` taxonomy (stories, requirements, decisions, briefs, proposals, guides, work, DEVIATIONS). Existing files are kept, never overwritten.

Then:

1. Fill in `AGENTS.md` — `{PROJECT_NAME}`, the stack table, folder layout, and commands.
2. Write `docs/spec.md` with the project's technical spec.
3. Adjust `standards/code-quality.md` if your project's rules differ from the baseline.
4. Run `/crew:setup` to declare what the project can do.

## Tell the crew what this project can do

```
/crew:setup
```

Scaffolding gives the crew a *structure*; this gives it *capabilities*. It asks where the app runs in development, where someone looks to see whether a component already exists, whether renders can be captured and at which form factors, and which commands measure accessibility or performance — then writes only what you confirmed into `crew.json`.

Three things make it worth running rather than skipping:

- **Declaring is the permission.** With a runtime URL declared, an agent stops asking "may I open the browser?" every session — you granted it once, in a file you can read and revert. The URL and the launch profile are separate grants, because connecting to a running app and executing a command on your machine are different risks.
- **What you don't declare is not assumed.** With no component registry, every proposal says *"reuse not verified"* instead of pretending the catalogue was searched. With no way to capture a render, you get code conformity **labeled as such** instead of a confident-sounding verdict on how it looks.
- **It asks instead of guessing.** At most two questions per turn, your understanding confirmed in one line before anything is written, and "nothing, thanks" as a complete, valid answer.

Fill in `docs/design/` too — one reference, one approved pattern, one rejected pattern is already enough to change what the roles produce. That folder is your product's taste; the plugin never writes into it. Full reference: [configuration.md](configuration.md#design-capabilities).

## Choose the project mode

Not every repo wants the full process. The mode is declared per repo in a `crew.json` file at the project root, written by the scaffold with explicit values (`mode`, `metrics`, `quality`, `ceilings`):

- **`team`** — the full delivery circuit and all guards. `scripts/init-project.sh` scaffolds the complete `docs/` taxonomy and writes `crew.json`.
- **`solo`** — the catalog without the ceremony: Closed-item immutability off, the session-stop closure check off, and the estimation gate only if metrics are on. `scripts/init-project.sh --solo` scaffolds a minimal tree (`AGENTS.md`, `CLAUDE.md`, `standards/`, `docs/decisions/`, `docs/work/`, `crew.json`) — no briefs, stories, requirements, or proposals.

`metrics` is orthogonal to the mode: `solo` with `"metrics": true` gives you just the estimation-and-timestamps discipline — for when you work alone but still want to measure what each requirement costs.

A repo **without** `crew.json` behaves exactly as before: guards infer by structure and quality enforces at write time. Every field is documented in [configuration.md](configuration.md); for the fastest solo start, see [solo-quickstart.md](solo-quickstart.md).

## Onboard an existing project

Do **not** scaffold over a project that already has docs and conventions. The entry point is the audit:

```
/crew:doc audit this project's docs against the crew standard
```

The documentation-steward inventories the project against the plugin taxonomy, reports aligned/deviated/missing findings, and you decide per finding: converge (becomes a story/requirement) or keep the deviation. Kept deviations are recorded in `docs/DEVIATIONS.md` and the precedence resolution is written into the project's root `AGENTS.md` — binding for all agents, never re-litigated per session. The plugin baseline is suggestive; the project's own rules always win.

## Customize the scaffolded docs

Everything the installer copies stops belonging to the plugin the moment it lands: the scaffolded `AGENTS.md`, `standards/`, and `docs/` tree are **your project's files**. The installer never overwrites an existing file, so whatever you change persists — but not everything in those files carries the same weight. There are two kinds of content, and the procedure differs.

### Project surface — edit freely

Defaults the scaffold ships so you have something to start from. Changing them is normal project maintenance: edit your copy, no audit, no deviation record.

- **Placeholders and project facts** — `{PROJECT_NAME}`, the stack table, folder layout, and commands in `AGENTS.md`.
- **Tools are declared, never templated.** No template names a test tool: the end-to-end harness `QA` formalizes scenarios into comes from `crew.json` `testing.e2e`, read from one place by every role. Declare it once there and keep `AGENTS.md § Stack` in sync. Per `docs/MAINTAINING.md`, a tooling swap with real trade-offs also gets an ADR.
- **Project-specific additions** — extra sections in the story template (say, a "Rollout" or "Analytics events" block), extra rows in routing tables, extra guides. Add them in your copy; every new story inherits them.
- **Wording, examples, and language** of the prose.

### The structural standard — changing it is a deviation

These elements are load-bearing: roles, hooks, and the delivery circuit assume them. Diverging is allowed, but it is a recorded **decision**, never a silent edit:

- Folder = nature, state = field; files never move; kind lives in the slug.
- The story/requirement lifecycle (`Draft → … → Closed`) and the `Status:` header field.
- The Ready gate: criteria complete and unambiguous, no open questions, and **at least one Test scenario**.
- The estimation table, added at planning by whoever executes and complete at closure. This one is hook-enforced: the exact `## Estimation` heading and the first five columns (Milestone through Actual hours) filled — renaming the section or leaving cells empty blocks the close.
- Immutability of Closed work items and `work/` entries.
- Single source of truth: an external tracker holds only state + link; the file wins.

To diverge from any of these, run the audit conversation (`/crew:doc audit this project's docs against the crew standard`). The owner decides, the deviation lands as a row in `docs/DEVIATIONS.md` with rationale and date, and from then on it is binding — agents respect it and never re-flag it.

**Quick test:** does the change swap the tool or wording the standard runs with, or does it change the standard's shape? Tool/wording → edit your copy. Shape (lifecycle, gates, taxonomy, mandatory sections) → `DEVIATIONS.md` row via `DOC` audit.

### What happens when the plugin updates

Updates never touch your scaffolded files — the bootstrap skips anything that already exists — so customizations survive every update. The flip side: improvements to the plugin's templates do **not** reach your copies automatically. To pick them up, re-run the `DOC` audit after updating: it compares your docs against the new baseline, respects every row already in `DEVIATIONS.md`, and you converge or keep per finding. There is no automated merge; the audit conversation (or a manual merge of the template you care about) is the reconciliation path.

## Invoking a role

There are **two ways** to put a role to work. Both end the same way — a specialist answers instead of a generalist — they differ in setup and in how they read.

### 1. Slash command — `/crew:<alias>` (works out of the box)

Type a slash command and the role takes that message:

```
/crew:sys how should I split the payments module from the rest?
/crew:ux lay out the home screen for someone opening the app for the first time
```

Nothing to set up: the moment the plugin is installed, the role commands exist in **every** project. This is the simplest way and the first one to reach for.

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

Run the `CREW` meta-role once, pointed at your global config:

```
/crew:crew activate the crew in my global ~/.claude/CLAUDE.md so the "ROLE:" prefix works in every session
```

It writes the activation protocol + the alias table into `~/.claude/CLAUDE.md`. From then on `SYS:`, `DA:`, `UX:`, … work in any session and any project. A project's own `AGENTS.md` still wins wherever it disagrees.

### One message, or the whole conversation?

By default the prefix activates the role for **that one message**; the next message is back to the generalist. If you want the role to **stay** for the whole conversation (say `SYS:` once and remain system-architect until you switch), the activation protocol has a formal **sticky prefix** option — ask `/crew:crew` for the sticky variant when activating. Its canonical text is versioned in the crew meta-role doc, not improvised per install:

> Sticky prefix: a `ROLE:` prefix stays active for the whole conversation until a different `ROLE:` prefix is declared. `GEN:` resets to the generalist.

`GEN:` is the built-in way back — you are never stuck in one role.

## Measure your work (metrics)

With `"metrics": true` in `crew.json`, the estimation discipline becomes measurable end to end:

1. **Estimate at planning.** A story is authored without estimation; whoever takes it for implementation adds the `## Estimation` table (milestones, estimated hours) before coding. Project-level rough sizing lives in the brief.
2. **Timestamps in real time.** The Started/Finished cells are written when the work actually starts and finishes — a guard checks each newly-written timestamp is within 15 minutes of now, carries its timezone offset (`YYYY-MM-DD HH:mm ±TZ`), and stays consistent (Finished ≥ Started, Actual hours ≤ wall-clock). If a session is interrupted, Finished is the real resumption time and the gap goes in Notes — wall-clock includes pauses by design; the metric is end-to-end cost.
3. **Read the numbers.** `/crew:metrics [YYYY-MM]` reports, per closed item, lead time, execution time, and estimated vs. actual hours with deviation %, aggregated (median/p90) by folder and month; `--csv` writes `docs/work/metrics.csv`.

Full rules and report anatomy in [metrics.md](metrics.md).

## Composition rules

From `agents/` (each role doc):

- One owner per decision.
- Specs before code. Roles can search and edit code, but implement only after the direction converges or the user explicitly asks — never as the first response. `researcher` is the exception: strictly read-only.
- `security-compliance` may interrupt any role.
- `researcher` returns findings, never recommendations.
- Roles know the full catalog. The "Role relationships" section in each role doc lists **typical** handoffs and consults; any role may invoke any other when the situation warrants it.
- **Consult, don't defer.** When a complete answer needs another role's judgment, the agent obtains it now (spawn or lens-adoption) and answers in the same turn — never closes with "review this with ROLE".
- **Chaining policy.** After a deliverable, the next role chains in-session only if its human owner (per the project's `AGENTS.md` § Role ownership map) is the session user; otherwise the work stops at the artifact and awaits that human's approval.
- **Estimation discipline.** At planning, whoever executes a story/requirement adds its milestone estimation table (estimated vs. actual hours) before coding — this is how teams measure the cost of each agentic iteration; stories are authored without it.
