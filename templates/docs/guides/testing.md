# Testing — what this project verifies, and how

The project's own answer to a question every work item asks at planning: *this behavior has to be verifiable — at what level, with what harness, and what does it cost?*

This file ships **empty on purpose**. The plugin carries the discipline (every work item states how it was verified); the levels, the harness and the bar are this project's to declare. Fill it once, keep it current, and point `crew.json` `testing.guide` at it.

> Until this file says otherwise, roles report that the project declares no testing strategy — and a plan that needs one will say so instead of inventing it.

## Levels in use

What each level protects here, and what it deliberately does not.

| Level | What it covers | Where it lives | How it runs |
|-------|----------------|----------------|-------------|
| unit | | | |
| integration | | | |
| contract | | | |
| e2e | | | |

Levels this project does **not** use, and why: (write it — an absent level that nobody decided to skip is a gap; one that was decided is a policy.)

## Harness

- **End-to-end:** (tool, config file, where specs live, how a spec is named. Mirror this in `crew.json` `testing.e2e` so roles read it from one place.)
- **Runner / assertions:** (…)
- **Fixtures and data:** (what a test may assume exists, what it creates, what it must clean up.)
- **Configuration traps:** (the settings a new spec gets wrong the first time — base URL, proxy target, auth bypass, timezone, seeded users.)

## What a contract in pixels requires

A rule worth writing down before the first visual test: **a contract expressed in geometry is verified by measuring.** Reading class names or eyeballing a screenshot is not enough. A test asserting on the class string passes while the layout is broken, because another rule overrode it in CSS. Whatever runs without a real layout engine cannot answer a geometric question, so those assertions belong in the browser-driven level or nowhere.

## Adoption bar

What has to be true before a change merges. Write the gates as verifiable conditions:

1. (e.g. every new behavior has at least one test at the level this table assigns it.)
2. (e.g. every fixed bug leaves a regression test that fails against the old code.)
3. (…)

Gates only bind when something runs them. Name where that happens — CI workflow, pre-commit, manual step — and say plainly if the answer today is "nowhere".

## Manual testing

The part no harness covers. If humans test this product, the protocol is theirs to follow without reading code:

- **Who** — the profiles that exist and what each one may do.
- **How they get in** — the entry point and credentials policy (testers holding real credentials is a security finding).
- **Rounds** — what gets walked, in what order, with what time budget.
- **What they report** — the fields of a report, and a severity scale written in words rather than numbers.
- **Mandatory conditions** — the states that hide defects until someone looks: empty data, a large-volume view, an interrupted flow, the smallest supported screen.

## What is not verified

The honest list. Every entry: what is uncovered, why, and what would have to exist to cover it. This section is the one that keeps an estimate truthful — work that is not written here only shows up after the estimate.
