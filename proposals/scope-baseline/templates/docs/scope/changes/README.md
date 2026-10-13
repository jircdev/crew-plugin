# Changes — Every change to the committed scope

One file per change to the [baseline](../baseline.md) after its baseline date: a new requirement, a modified "done when", a phase move, a withdrawal. Nothing reaches the baseline without an entry here, and nothing built outside the baseline stays silent: work items with no `Covers` surface in the budget's "Not in baseline" row until someone opens a change or declares the work internal.

## Lifecycle

```
Proposed → Estimated → Decided → Applied
                             ↘ Rejected        (from any state: Withdrawn)
```

- **Proposed** — opened by whoever detects the change. `COORD` keeps the register complete.
- **Estimated** — executing roles size the impact; `SYS` integrates. No decision without hours.
- **Decided** — scope and price are decided separately by the client (or by the sponsor for an internal change with no client impact), each with date and evidence.
- **Applied** — the baseline reflects it. Allowed only with scope accepted = yes.
- **Rejected / Withdrawn** — the file stays, with the reason.

Scope accepted with price not accepted is a legitimate state: the hours count as **unfunded** in the budget.

## Convention

- File: `CH-NNN-slug.md`, sequential, never reused; slug in kebab-case.
- Evidence of the client's decision is linked (meeting tracker, email, signed document), never copied.

## Change template

```markdown
# CH-NNN — Short title

- **Status:** Proposed | Estimated | Decided | Applied | Rejected | Withdrawn
- **Date opened:** YYYY-MM-DD
- **Origin:** client request | internal decision | discovery finding | <meeting, date>
- **Source:** (link to where it was asked or decided)
- **Affects:** RQ-NN, RQ-MM (new: RQ-XX) (withdraws: RQ-YY)
- **Opened by:** <human> (<role>)

## What changes

(Before and after, per affected requirement: the "done when" as it was, and as it would be. Plain language.)

## Why

(The need behind the change, in the requester's terms.)

## Impact

| Requirement | Phase | Hours | Estimated by |
|-------------|-------|-------|--------------|
| | | | |
| **Total** | | | |

(Hours in the same unit as the budget. A range only where a definition or a third party blocks the estimate, and it names what blocks it.)

## Decision

| Question | Answer | Date | Evidence |
|----------|--------|------|----------|
| Scope accepted | yes / no / pending | | |
| Price accepted | yes / no / pending | | |

## Application

- (On Applied: the date and which baseline entries were created, modified or withdrawn.)
```

## Index

<!-- crew:generated scope-changes -->
(Written by `/crew:metrics scope --write`. Do not edit by hand.)

| Change | Status | Affects | Hours | Scope accepted | Price accepted |
|--------|--------|---------|-------|----------------|----------------|
<!-- /crew:generated -->
