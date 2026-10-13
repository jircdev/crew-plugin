# Scope — What was committed, how it changes, what it costs

The contract made verifiable. This tree holds the numbered list of what the project must leave working (the **baseline**), every change to it after it was signed (the **change log**), and the hours quoted against the hours worked (the **budget**). It exists only when the project declares `scope` in `crew.json`; an internal product without a client commitment does not need it.

It sits between two levels the standard already has: the brief in [`../briefs/`](../briefs/README.md) says *why* the project exists; the work items in [`../stories/`](../stories/README.md) and [`../requirements/`](../requirements/README.md) say *how* each piece gets built. This tree says *what was promised*, and lets anyone check whether it was delivered.

## Structure

```
docs/scope/
├── README.md          this file
├── baseline.md        committed requirements (RQ-NN) and non-functional ones (NFR-NN)
├── changes/
│   ├── README.md      change index (generated block)
│   └── CH-NNN-slug.md one change per file
└── budget.md          quoted hours, estimate to complete, worked (generated block)
```

**Vocabulary.** A *committed requirement* (`RQ-NN`) is a promise to the client with a verifiable "done when". A *technical requirement* in `docs/requirements/` is a work item: a task someone executes. Work items cover committed requirements through their `Covers` header field.

## Who writes what

| Artifact / field | Owner | Approves |
|---|---|---|
| Baseline entries: membership, phase, source, origin | `COM` (client engagement) or `PROD` (internal initiative) | Sponsor, via PR |
| `Done when` wording | `FA` | Sponsor, with the entry |
| `Verification` rows | `FA` (functional) · `QA` (non-functional) | — (the row is the verdict) |
| `Blocked by` | anyone; `COORD` confirms | — |
| Change entries: opening, register custody | `COORD` (any role may open one) | — |
| Change: scope and price decision | Sponsor (human), recorded by `COM`/`PROD` | — |
| Change: hours impact | executing roles, integrated by `SYS` | — |
| Budget: quoted hours | `COM` | Sponsor |
| Budget: estimate to complete | executing roles, integrated by `SYS` | — |
| Status, work-item lists, worked hours | the script (`/crew:metrics scope --write`) | nobody writes them |

## Requirement status — derived, never written

Let *W* be the work items whose `Covers` field names the requirement. Terminal state: `Validated` or `Closed` for a story; `Closed` for a technical requirement. The first rule that holds wins:

1. **Withdrawn** — the entry has `Withdrawn by`.
2. **Fulfilled** — the latest `Verification` row is `pass`, every item in *W* is terminal, and the row's date is on or after the last commit of every item in *W*. With *W* empty, the `pass` row suffices and the report flags it "verified without work items".
3. **Blocked** — the entry has `Blocked by`. Shown with the underlying progress ("Blocked · In progress").
4. **Delivered** — *W* is not empty and every item is Delivered or beyond. The requirement as a whole still awaits verification.
5. **In progress** — some item in *W* is In progress or beyond.
6. **Not started** — everything else. With *W* empty it also carries the **Uncovered** flag: nobody has written how it behaves yet.

A requirement is marked fulfilled in exactly one place: a `pass` row in its `Verification` table. A later `fail` row, or a covering work item edited after the row, sends it back to Delivered on the next run.

## Rules

- **IDs are permanent.** `RQ-NN`, `NFR-NN` and `CH-NNN` are never reused. A requirement leaves the baseline through `Withdrawn by: CH-NNN`; its entry stays.
- **After `Baselined:`, the baseline changes only through a change.** A new entry carries `Origin: CH-NNN`; a modified one records the change in its `Notes`; a removed one gets `Withdrawn by`.
- **Every worked hour lives in a work item.** Store submissions, legal paperwork, load tests, a closed beta: if they cost hours, they are a technical requirement with an `## Estimation` table. The budget never holds hand-written worked hours.
- **The first ID in `Covers` pays.** A work item's actual hours are attributed to the first requirement it lists; the others show it as "covered by". Work items with no `Covers` appear in a "Not in baseline" row, which is either internal work to declare or an unlogged change.
- **Generated blocks belong to the script.** Content between `<!-- crew:generated ... -->` and `<!-- /crew:generated -->` is rewritten by `/crew:metrics scope --write`; hand edits are rejected when `scope` is declared.
- **Commercial sources are linked, never copied.** Contracts, proposals and meeting transcripts stay where the project keeps client-facing material.

## Chaining

- Brief **approved** → the baseline may be written. Sponsor approval of the baseline PR sets `Baselined:`.
- Baseline entry exists → `FA` writes the stories that cover it, each with `Covers`.
- All items in *W* terminal → `FA` (or `QA`) walks the requirement's `Done when` end to end and records the `Verification` row.
- A change of *intent*, beyond scope → a new brief supersedes the old one and originates the change entries.
