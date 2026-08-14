# Migration to 0.23 — verification and totals

Two changes reach existing repositories. One of them can block a closure the day you upgrade, so it is worth two minutes now.

## What changed, in one paragraph

Estimation tables now close with a **Total** row, and every work item states **how it was verified** in a `## Verification` table written at planning. The first is required everywhere the estimation gate already ran. The second only binds where the project declares a `testing` section in `crew.json` — declaring it is what turns the table into a gate.

## 1. The Total row — required, everywhere the estimation gate runs

| Situation | What happens |
|---|---|
| Team mode, or a repo with no `crew.json` | Closing a story/requirement now needs a `Total` row |
| Solo with `"metrics": true` | Same |
| Solo without metrics | Nothing changes |

**The fix, per work item, at closure:**

```
| **Total** | 12 | — | — | 15 | |
```

First cell `Total` (emphasis optional, case-insensitive), estimated hours and actual hours filled. The timestamp columns stay empty or a dash — the total sums milestones, it is not one. Already-Closed files are untouched: the gate fires on the transition, and immutability owns everything after it.

Why it is required rather than suggested: a number nobody sums is a number nobody reads. The total is what makes a plan comparable to its outcome without arithmetic, and it costs one line.

## 2. The Verification table — only if you declare `testing`

Nothing fires until you add the section. When you do:

```json
{
  "testing": {
    "guide": "docs/guides/testing.md",
    "e2e": { "kind": "playwright", "specs": "tests/e2e" },
    "commands": [ { "kind": "e2e", "cmd": "npm run test:e2e" } ]
  }
}
```

From then on a work item cannot reach `Closed` without:

```
## Verification

| Scenario | Level | Harness | Artifact | Status |
|---|---|---|---|---|
| Manager approves a pending request | e2e | playwright | tests/e2e/approve.spec.ts | passing |
| Bulk import over 10k rows | none | none | — | not verified — no fixture at that volume |
```

This holds in **both** modes and does not depend on `metrics`: the estimation gate is the metrics discipline, this one is your own declaration.

**`not verified` is a valid row.** The gate wants an honest record, not a full one. What it refuses is silence, because an absent row and a covered one look identical from outside.

## Why this exists

A plan that carries "tests" as one loose bullet hides the largest number in the estimate. The case that produced this change: a frontend with no test infrastructure at all — no runner, no specs, no CI step that runs anything — where the plan said "tests" and the real cost of making the work verifiable was a 50% increase over the whole estimate, discovered after the estimate was given.

The table forces the question at planning, where it is cheap: for each behavior, at what level, with what harness, and what stays uncovered.

## What the plugin still refuses to do

Name your test tool. `e2e.kind` is a free label — whatever your harness is called goes there, and every role derives from your declaration. A standard that mandated a specific tool would produce specs that never run in every repo that uses a different one, and a verification table that reads covered while nothing executes.

## New in the scaffold

`bin/init-project.sh` now writes `docs/guides/testing.md` in **both** modes (empty by design: levels, harness, adoption bar and manual protocol are yours to fill) and seeds `"testing": { "guide": "docs/guides/testing.md" }`. New projects therefore get the verification gate from day one. Existing repos change nothing until you edit `crew.json` yourself; `/crew:setup` asks about it and writes only what you confirm.

## Checklist

1. Add a `Total` row to any work item you are about to close.
2. Decide whether you want the verification gate. If yes, add `testing` to `crew.json` and fill `docs/guides/testing.md` (copy it from the plugin's `templates/docs/guides/`).
3. Run `/crew:setup` if you would rather be asked than edit JSON.
