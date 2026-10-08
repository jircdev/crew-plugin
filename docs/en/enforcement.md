# Enforcement — when a guard blocks you

The crew standards are not conventions on the honor system: a small set of hooks enforces them at the moment of the write, the commit, or the session close. When one blocks you it always says why — this page maps each deny message to its cause and its fix. Which guards are active in your project is decided by `crew.json`; see [configuration.md](configuration.md) for the full matrix.

One principle first: **every guard fails open**. Any internal error in a hook allows the operation — a guard bug must never block legitimate work. So if you were blocked, it was deliberate: a rule fired, and the message names it.

## Immutability

Guard: [`../../hooks/guard-immutable.js`](../../hooks/guard-immutable.js) (PreToolUse on Edit/Write).

### "docs/work/ entries are immutable once created"

**Cause.** You edited an existing file under `docs/work/YYYY-MM/`. Work-log entries are history: once written, they are never modified. This holds in **both** modes, team and solo — it is the one piece of ceremony solo keeps.

**Fix.** Write a **new** entry that references the one you wanted to change. Creating new entries is always allowed; only existing files are protected.

### "This work item is Closed and therefore immutable"

**Cause.** You edited a story or requirement under `docs/stories/` or `docs/requirements/` whose header already says `**Status:** Closed` (or `**Estado:** Cerrada`). Closed items are the record of what was agreed and delivered.

**Fix.** New work is a new story/requirement — create one and link the closed item. This rule applies in **team mode only** (and in legacy repos without `crew.json`); in solo mode Closed items stay editable.

## Estimation closure gate

Guard: [`../../hooks/guard-estimation.js`](../../hooks/guard-estimation.js). It fires only on the **transition** to Closed — if the file on disk is already Closed, immutability owns the case. Active always in team mode; in solo only when `crew.json` has `"metrics": true`.

### "Cannot close this work item: no Estimation section found"

**Cause.** The file you are closing has no `## Estimation` heading — planning never added the table (stories are authored without it; whoever executes adds it when taking the item up). The heading must be exactly that — the literal English word `Estimation` as a level-2 heading, even in Spanish-language projects.

**Fix.** Add the section with the standard table (see the story template) and fill it, then close.

### "Cannot close this work item: the estimation table has no milestone rows"

**Cause.** The `## Estimation` section exists but the table has only the header, or rows that are entirely empty.

**Fix.** At least one real milestone row, fully filled.

### "Cannot close this work item: milestone … is missing Est. hours, Started, Finished, or Actual hours"

**Cause.** A milestone row has an empty cell among the first five columns (`Milestone | Est. hours | Started | Finished | Actual hours`). Only `Notes` may be empty.

**Fix.** Complete every started row before flipping `Status:` to `Closed`. If a planned milestone was never executed, remove the row or fold it into another — an empty row is not a valid record. The point of the gate is that closure certifies the numbers [metrics](metrics.md) will consume.

### "Cannot close this work item: the estimation table has no **Total** row"

**Cause.** The table's milestones are complete but nothing sums them. A document whose reader has to add the column is storing numbers, not reporting them.

**Fix.** Close the table with a row whose first cell is `Total` (markdown emphasis optional, case-insensitive), carrying estimated and actual hours. The timestamp columns stay empty or a dash — the total sums milestones, it is not one:

```
| **Total** | 12 | — | — | 15 | |
```

## Verification closure gate

Same guard, different opt-in: it runs when `crew.json` declares a `testing` section, in **both** modes, independently of `metrics`. A project that declared what it can verify has said that "how was this verified?" is an answerable question — leaving it blank at closure is a gap by the project's own standard. Undeclared, nothing here fires.

### "Cannot close this work item: no Verification section found"

**Cause.** The file has no `## Verification` heading. It is added at planning, next to the estimation, by whoever executes.

**Fix.** Add the table — one row per behavior — and fill it:

```
| Scenario | Level | Harness | Artifact | Status |
|---|---|---|---|---|
| Manager approves a pending request | e2e | playwright | tests/e2e/approve.spec.ts | passing |
| Bulk import over 10k rows | none | none | — | not verified — no fixture at that volume |
```

The heading may be `## Verification` or `## Verificación`. Every column except none is required: `not verified` **with its reason** is a valid status, silence is not — an absent row is indistinguishable from a covered one.

### "Cannot close this work item: verification row … is missing level, harness, artifact or status"

**Cause.** A row has an empty cell. Most often the artifact, when the test was planned and never written.

**Fix.** Write what is true. If no test exists, the artifact is `—` and the status says why it does not exist. The gate wants the honest record, not a full one.

## Timestamps

Guard: [`../../hooks/guard-timestamps.js`](../../hooks/guard-timestamps.js). Active **only** when `crew.json` has `"metrics": true`. It validates a cell only when the edit writes it for the first time (empty → value); historical rows are never re-validated, so editing other parts of a file with a complete table never triggers it.

### "… is not in the required format YYYY-MM-DD HH:mm ±TZ (timezone offset mandatory)"

**Cause.** A newly written `Started` or `Finished` cell doesn't parse. The format is `YYYY-MM-DD HH:mm` plus a mandatory timezone offset: `-03:00`, `+02`, `+0530`, or `Z` are all accepted; no offset is not.

**Fix.** The deny message includes the correct current time in the exact expected format — copy it. On a shell, `date "+%Y-%m-%d %H:%M %z"` produces it.

### "… is not the real current time"

**Cause.** The timestamp is more than **15 minutes** away from the machine clock. Timestamps are a real-time log, written as work happens — never reconstructed after the fact. This is the guard that makes the metrics honest: the agent cannot invent a plausible-looking past.

**Fix.** Write the current time — the deny message tells you exactly what it is. Do not backdate, even when you know when the work "really" started; see the interrupted-session case below.

### "Finished (…) is earlier than Started (…)"

**Cause.** Ordering violation within a row. **Fix.** Finished must be ≥ Started; correct whichever cell is wrong (using real times).

### "Actual hours (…) exceeds the wall-clock span Started → Finished"

**Cause.** On a newly written `Finished`, the row's `Actual hours` is greater than the elapsed Started → Finished time (with a 5% slack). Actual can be **lower** than the span — pauses happen — but never higher: you cannot have worked 6 hours inside a 2-hour window.

**Fix.** Record the hours actually worked within the span.

### Interrupted sessions

You started a milestone, the session died, and you resume the next day. Do **not** backdate `Finished` to when the work "would have" ended — the guard will reject it, and backdating is exactly the falsification it exists to prevent. Instead: write `Finished` with the **real resumption time** when you close the milestone, and note the gap in `Notes` (e.g. "session interrupted, ~16h gap"). Wall-clock including pauses is by design — the metric measures the end-to-end cost of the requirement, not keyboard time. See [metrics.md](metrics.md) for how to read the resulting numbers.

## Work-item shape

Guard: [`../../hooks/guard-shape.js`](../../hooks/guard-shape.js) (PreToolUse on Edit/Write), resolver [`../../hooks/lib/standards.js`](../../hooks/lib/standards.js). It runs on every write to a story or requirement, not only at closure, and holds the item to its **effective standard**:

1. the project's own template (`docs/stories/README.md`, `docs/requirements/README.md`, the fenced block under the template heading) — a project that translated or reshaped its template declared its standard by doing so;
2. where the project has none, the crew template;
3. the deviations declared in the `crew:standard` block of `docs/DEVIATIONS.md`, applied on top.

Print the standard for any path with `node scripts/conformance.js docs/requirements/<plan>/001-x.md`, and check files with `--check`.

### "This requirement departs from its standard, …"

**Cause.** The write would leave a header field or section of the template missing, a table (`Estimation`, `Verification`) with columns other than the standard's, or an estimation table with milestones and no **Total** row. Only *new* nonconformance counts: an edit to an item that already deviated is judged on what the edit adds, so older items stay editable.

**What happens.** With `quality: enforce` in a `team` project the write is **denied**. With `advise`, in `solo` mode, or without `crew.json`, the write proceeds and the message arrives as a notice. With `quality: off` the guard is silent.

**Fix.** Use the standard's sections and columns verbatim — the message names each gap. If the project deliberately departs from the template and cannot express it by editing the template itself, declare it with a rationale:

```markdown
<!-- crew:standard
requirement omit section Verification   # verified in the release checklist
-->
```

Grammar: `<requirement|story> omit section <Name>`, `<…> omit header <Field>`, `<…> columns <Table> <col> | <col> …`. A line without `# rationale` is ignored and reported by `conformance.js`.

## Off-repo plan notice

Hook: [`../../hooks/nudge-offrepo-plan.js`](../../hooks/nudge-offrepo-plan.js) (PreToolUse on MCP tools and `Artifact`). A plan published through a docs connector, an artifact or a chat integration never passes through Edit/Write, so the file guards cannot see it. This hook adds a **notice** — never a denial, because every connector shapes its payload differently — when the published content carries an hours table or work-item sections and does not name a `docs/requirements/` or `docs/stories/` path.

**Fix.** Write the work items in the repo first (the `planning` skill carries the method), then publish the view with a reference to their path.

## Code quality

Guard: [`../../hooks/guard-code-quality.js`](../../hooks/guard-code-quality.js) at write time; gate: [`../../scripts/check-staged.js`](../../scripts/check-staged.js) at commit time. Both share the same ceilings, overrides (`crew.json` `"ceilings"`) and exemptions — table of kinds and defaults in [configuration.md](configuration.md#ceilings).

### "This file would be N lines; the crew ceiling for a KIND file is C"

**Cause.** The write would leave the file above the line ceiling for its kind. What happens next depends on `crew.json` `"quality"`:

- **`enforce`** (also the no-`crew.json` behavior): the write is **denied**.
- **`advise`** (scaffold default for new projects): the write **proceeds** and you see the same text as a notice, ending with "The pre-commit gate will reject the commit if it still exceeds the ceiling." The notice is not noise — the hard stop moved to the commit, it did not disappear.

**Fix.** Split the file: extract a symbol (a component, a function group, a type module) into its own file. That is the intended reaction — the ceiling is a cheap proxy for "this file got hard to reason about". If the path is *legitimately* large (generated code, flat data tables), exempt it — properly, below.

### Exemptions

Exemptions are **pre-registered**: recorded with a rationale *before* hitting the wall, not as a reaction to a red message. They live in a machine-readable block in `docs/DEVIATIONS.md`:

```markdown
<!-- crew:exempt
src/generated/**        # generated API client — regenerated, never hand-edited
data/fixtures/*.ts      # flat fixture data, no logic
-->
```

Rules of the block:

- One glob per line. `**` crosses directories; `*` matches within a single path segment only.
- `#` starts a comment — put the rationale right there.
- Paths are relative to the project root (the nearest ancestor with `crew.json`, `docs/DEVIATIONS.md`, or `.git`), with forward slashes.

Matched paths are allowed **silently by both** the write-time guard and the pre-commit gate. Parsing lives in [`../../hooks/lib/ceilings.js`](../../hooks/lib/ceilings.js).

### "crew code-quality gate: ceiling exceeded" (pre-commit)

**Cause.** `git commit` ran the pre-commit hook (installed by `init-project.sh` as a call to [`../../scripts/check-quality.sh`](../../scripts/check-quality.sh)), which checks every **staged** file (`git diff --cached`, added/copied/modified/renamed) against the ceilings. Something exceeded; the commit aborted with a report:

```
crew code-quality gate: ceiling exceeded

  src/pages/Dashboard.tsx — 247 lines (page ceiling: 200)

Split the file (extract a symbol into its own file), or pre-register the path
in the crew:exempt block of docs/DEVIATIONS.md with its rationale, then retry.
```

**Fix and retry.** Split the offending file(s) or add an exemption glob, `git add` the changes, and run `git commit` again — the gate re-checks the new staged set. There is no state to reset; every commit attempt is a fresh check. For CI, `bash <plugin>/scripts/check-quality.sh --all` checks every tracked file instead of the staged set.

## Session close

Hook: [`../../hooks/check-work-log.js`](../../hooks/check-work-log.js) (Stop hook). Team mode only — and legacy repos that have a `docs/work/` directory. Solo mode never fires it.

### "There are commits dated today … but no docs/work/… entry"

**Cause.** The session is ending, there are commits dated today, and no `docs/work/YYYY-MM/YYYY-MM-DD-*.md` entry exists for today. Conventions without enforcement drift; this is the enforcement of the closure trace.

**Fix.** Write the work entry now (format in your project's `docs/work/README.md`: What changed / Why / How / Promoted knowledge / Follow-ups) — or skip explicitly if the day's changes are below the significance bar (self-evident fixes, minor renames, doc-only changes). The hook blocks **once**: it never loops a session that already answered it.

## Runtime troubleshooting

**A guard got stricter out of nowhere.** The most common cause: `crew.json` stopped parsing. Invalid JSON is treated exactly like no file — legacy v0.19.1 behavior — which flips quality from `advise` to `enforce` and makes Closed items immutable even if you meant solo. Check `node -e "JSON.parse(require('fs').readFileSync('crew.json','utf8'))"` from the project root.

**Wrong config seems to apply.** Guards resolve `crew.json` by walking **up from the edited file's directory** (fallback: the session cwd), max 30 levels. In a monorepo, the nearest `crew.json` above the file wins — check for a stray one in a subdirectory.

**An exemption glob doesn't match.** Globs are matched against the path **relative to the project root**, with `/` separators. `*` does not cross directories — `src/*.ts` does not match `src/api/client.ts`; use `src/**` or `src/**/*.ts`. Verify the root the guard detected: nearest ancestor holding `crew.json`, `docs/DEVIATIONS.md`, or `.git`.

**A guard didn't fire when you expected it to.** Check the activation conditions first ([matrix](configuration.md#behavior-matrix--guard--config)): timestamps needs `"metrics": true`; Closed-item immutability and the Stop hook need team mode. Beyond that, remember guards fail open — an internal error (unreadable file, malformed hook input) silently allows the operation.

**The estimation guards ignore my table.** The section heading must be literally `## Estimation`, and the status line (`**Status:** Closed` / `**Estado:** Cerrada`) must appear within the first ~600 characters of the file — keep it in the header block where the templates put it.

**The pre-commit gate never runs.** It only exists once installed — `init-project.sh` writes (or appends to) `.git/hooks/pre-commit`; if the project was scaffolded before `git init`, re-run the script. The gate needs `node` and `bash` on PATH.
