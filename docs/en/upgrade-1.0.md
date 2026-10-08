# Set up crew 1.0 after installing it

This guide is for a project that already used crew and moves to 1.0. Version 1.0 brings together everything built between 0.26 and 0.31; none of those versions was published, so if you come from 0.25 or earlier, this is the only document you need. It takes about 15 minutes per project.

For a new project, start with [installation.md](installation.md). Each change is detailed in the [CHANGELOG](../../CHANGELOG.md).

## Before you start

- Node.js 22 or later, Git, and Bash for the pre-commit gate (Git Bash on Windows).
- Claude Code, or Codex 0.130 or later. Verified versions are Claude Code 2.1.227 and Codex 0.130.0-alpha.5.

## 1. Update the plugin

- **Claude Code:** `/plugin update crew@factory-crew`, then open a new session.
- **Codex:** follow [compatibility.md § Install in Codex](compatibility.md#install-in-codex). Codex 0.130 no longer has `codex plugin add`.

## 2. Codex only: turn the hooks on

Without this step, Codex loads crew's skills but runs **none** of its guards and no time capture.

1. In Codex's `config.toml`, add `[features]` with `plugin_hooks = true` (or start Codex with `--enable plugin_hooks`).
2. Open `/hooks` and trust crew's hooks. Every change to a hook asks for trust again.

## 3. Diagnose the project

From the project root, in the chat:

```
/crew:doctor
```

The doctor checks `crew.json`, the pre-commit gate, pending migrations, expired exceptions and work items that depart from their standard. It changes nothing. Fix what it marks `blocking` first.

## 4. Configure what is new

```
/crew:setup
```

The interview asks only what is missing and writes only what you confirm. What it will offer that is new in 1.0:

| Question | What it turns on |
|---|---|
| Does a `passing` row need a receipt of the run? | `testing.receipts`: closing requires the receipt `/crew:check` writes |
| Does the project keep its tasks and time in factory? | The `factory` block and factory mode ([factory.md](factory.md)) |
| Do you want a record of what the guards decide? (team) | `audit`: one line per decision in `.crew/audit.log` |
| Should catalog usage be forbidden? (team) | `"telemetry": false` |
| Do you want your own use of roles and skills counted? (person) | `.crew/local.json`, ignored by git |

If an answer lowers a control (for example `quality` from `enforce` to `advise`), setup first registers it in `docs/DEVIATIONS.md` with your reason.

## 5. Review your templates

Your project's templates (`docs/stories/README.md`, `docs/requirements/README.md`) do not change on their own. From 1.0 they are your standard: crew checks every story and requirement against them at write time. To see the standard applied to a path:

```
node <plugin>/scripts/conformance.js docs/requirements/<plan>/001-x.md
```

Crew's templates add three things you can copy into yours if they help: the `## Must not` section in stories, and the optional `**Size:**` and `**Factory activity:**` fields.

## 6. Register exceptions

`docs/DEVIATIONS.md` now has four blocks. Each line carries its reason and may carry `owner:` and `expires:`.

| Block | What for |
|---|---|
| `crew:exempt` | Paths exempt from the file-size ceiling |
| `crew:standard` | Deliberate departures from the work-item template |
| `crew:policy` | Controls relaxed on purpose in `crew.json` or the settings |
| `crew:security` | Accepted risks from the security scan |

Details are in [enforcement.md](enforcement.md).

## 7. Scan the agent configuration

Ask `security-compliance` to run the scan, or run it yourself:

```
node <plugin>/scripts/sec-scan.js --report
```

It checks the project's instructions, settings, MCP servers, hooks and agents. It uses no network and masks secrets. Until a report exists in `docs/security/`, every session reminds you with one line.

## 8. If the project uses factory

Each person connects their machine once:

```
/crew:factory login
```

Without that step nothing is recorded about that person. Details are in [factory.md](factory.md).

## What changes day to day

| Situation | From 1.0 |
|---|---|
| An agent runs `git commit --no-verify` | Denied in every project with `crew.json` |
| An agent lowers `quality` or turns hooks off | Denied in `team` with `enforce`, unless it is in `crew:policy` |
| A work item does not follow its template | A notice at write time; denied in `team` with `enforce` |
| You ask for a plan or an estimate | The plan is written first as work items in the repo |
| You open a session | You see open milestones and items awaiting validation |
| A QA or design review | Findings carry severity, owner role and evidence |

## If something goes wrong

- A guard blocked you: the message names the cause; [enforcement.md](enforcement.md) explains each one and how to fix it.
- Something is not as you expected: `/crew:doctor`.
- You want to remove crew from a project: `/crew:doctor uninstall`, first with `--dry-run`.
