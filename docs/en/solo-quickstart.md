# Solo quickstart

The CTO path: you are one person shipping a product, you want the crew's roles and history without the ceremony a team needs. One page, start to finish.

## 1. Install the plugin

Follow the [installation guide](installation.md). In a terminal:

```
claude plugin marketplace add jircdev/crew-plugin
claude plugin install crew@factory-crew
```

For Codex, see [compatibility](compatibility.md#install-in-codex).

## 2. Initialize the repo in solo mode

From your repo root:

```
bash <plugin>/scripts/init-project.sh --solo
```

where `<plugin>` is the path where the plugin is installed. You can also ask the crew: "set up the crew structure in this project, in solo mode". This scaffolds:

- `AGENTS.md` — the activation protocol and alias table, so `SYS:`, `UX:`, etc. work in this project.
- `CLAUDE.md` — a pointer to `AGENTS.md` for Claude.
- `standards/` — the code-quality baseline.
- `docs/decisions/` — ADRs.
- `docs/work/` — the history of what was done, by whom, why.
- `docs/design/` and `docs/guides/testing.md` — the design memory and the testing strategy, empty for you to fill in.
- `crew.json` — with `mode: solo`, `metrics: true`, `quality: advise`.

Existing files are never overwritten.

## 3. What solo mode turns off

The delivery-circuit ceremony designed for coordinating several people:

- **No stories or briefs required.** You can ask any role to build directly.
- **Closed items stay editable.** Immutability is a team protection; solo, your history is yours to correct.
- **No work-log reminder at session close.** Nothing makes you leave the trail a hand-off between people would need.

## 4. What stays

- **The full role catalog, on demand.** `/crew:sys` for architecture, `/crew:qa` for a test verdict, `/crew:ux` before coding UI — every role, same invocation, whenever you want the lens.
- **`docs/work/` history.** Sessions still leave a record of what changed and why.
- **Code quality in advise mode + the pre-commit gate.** Findings are reported, exemptions are pre-registered with `crew:exempt` in `docs/DEVIATIONS.md`.

## 5. Metrics, solo

Metrics are opt-in per work item: create a `docs/stories/` or `docs/requirements/` item when you want to measure a piece of work — skip it when you don't.

- Add the standard **`## Estimation` table** to the item when you take it up (the template ships without it); fill the estimate before you start.
- With `metrics: true`, the guard requires **timestamps written in real time**, at the moment you actually start and finish.
- Run `/crew:metrics` for the report: estimated vs. actual, per item and aggregate.

## Flip to team later

Solo mode is the same structure with the ceremony off. When people join: edit `crew.json` (`mode: team`), re-run `init-project.sh` to scaffold the remaining pieces, and the delivery circuit — stories, Ready gate, immutable Closed items — switches on over the history you already have.
