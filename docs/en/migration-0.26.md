# Migration to 0.26 — work items keep their standard at every write

Additive. **No action is required**; read this to know what changes in what an agent sees.

## What changed, in one paragraph

Until 0.25 the shape of a story or requirement was checked only when it closed, and a plan written anywhere other than a file — a published doc, an artifact, a chat answer — was invisible to every guard. 0.26 resolves each work item's **effective standard** (the project's own template first, the crew template where the project has none, the deviations it declared on top) and holds the item to it at every write. A `planning` skill makes any plan or estimate land as repo work items first, every role applies the standard over a format an orchestrator dictates, and plans published through MCP connectors or artifacts without naming their work items get a notice.

## What you may notice

| Situation | 0.25 | 0.26 |
|---|---|---|
| A requirement written with non-standard estimation columns, `team` + `quality: enforce` | allowed until closure | **denied at write**, naming the gap |
| Same, with `advise`, `solo`, or no `crew.json` | allowed | allowed, with a notice |
| Editing an old item that already departed from the template | allowed | allowed — only what the edit adds is judged |
| A plan published to a docs connector with an hours table and no repo path | invisible | notice |

## If your project deliberately departs from the crew template

Prefer editing your own template in `docs/requirements/README.md` or `docs/stories/README.md`: it is your standard, and the guard reads it. When the departure cannot be expressed there, declare it with a rationale in `docs/DEVIATIONS.md`:

```markdown
<!-- crew:standard
requirement omit section Verification   # verified in the release checklist
-->
```

`node /path/to/crew/scripts/conformance.js <work-item-path>` prints the standard the guard will apply; `--check <files>` reports conformance.

## What you do not need to do

- Nothing in `crew.json` changes. `quality` already decides deny versus notice.
- Existing items are not re-validated retroactively.
- Re-running `scripts/init-project.sh` is optional: it only adds the empty `crew:standard` block to a newly scaffolded `DEVIATIONS.md`.
