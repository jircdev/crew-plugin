# Delivery — end-to-end evaluation

One question: **with crew, does an agent deliver correct software with less intervention, in less time and at lower cost than the same agent without crew?** The other sets in `evals/` judge how the roles reason. This one measures what gets shipped: hidden acceptance tests decide whether the work is done.

## What it runs

A small invoicing project (`fixture/`) with its own `crew.json`, its stack specification and its test suite. Four tasks, one per kind of work:

| Task | Kind | What it checks |
|---|---|---|
| `feature-discount` | feature | A new rule implemented from a short request, edge cases included |
| `defect-rounding` | defect | A reported wrong total, fixed at its cause |
| `refactor-report` | refactor | A long function split without changing the output |
| `security-export` | security | An export that must stay inside the user's account, check permissions and neutralize spreadsheet formulas, although the request never says so |

Each task runs in two variants: **crew** (Claude Code with the plugin) and **bare** (the same Claude Code without it). Both start in safe mode, so the person's own instructions, plugins and hooks never leak into either; the crew variant adds a copy of the plugin without `evals/` and `tests/`.

## What each run records

- **Acceptance**: share of the hidden acceptance tests that pass. They are copied into the workspace only after the agent has finished.
- **Own suite green**: whether the project's existing tests still pass.
- **Interventions**: how many times a person had to answer. When the agent ends its turn with a question, the runner answers with the task's clarification first and with "proceed" after that, at most three times, and counts each answer.
- **Minutes, tokens and cost**, as Claude Code reports them.

## How to run it

It spends API money: four tasks × two variants × three runs is 24 agent sessions. Claude Code has to be signed in (or `ANTHROPIC_API_KEY` set).

```bash
node scripts/eval-delivery.js --runs 3
```

Options: `--tasks a,b` · `--variants crew,bare` · `--model <id>` · `--keep` (keeps the workspaces to inspect what the agent did) · `--out <dir>`. Before spending anything, a preflight asks each variant whether it can see crew and aborts if the bare variant can or the crew variant cannot.

The result is archived in `results/` as `<plugin version>-<date>.json` plus a readable `.md`. To compare a release against an earlier one:

```bash
node scripts/eval-delivery.js report results/<new>.json results/<old>.json
```

## How to read it

Acceptance comes first: a variant that is faster and cheaper but ships fewer passing behaviors lost. Then interventions, then cost. Differences inside the spread between runs of the same variant are noise; three runs per task is the minimum to see the spread, and a change to a procedure or a role is accepted only if no task gets worse.

## Files

- `fixture/` — the project the agent works on
- `tasks/<id>/task.json` — the request and the clarification a person would give
- `tasks/<id>/acceptance/` — the hidden tests
- `results/` — archived runs, one pair of files per run of the suite
