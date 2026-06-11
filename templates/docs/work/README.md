# Work — Historical log (evidence, never truth)

Append-only record of significant changes: what was done, when, and why.

## Authority contract

**A work entry expires the day it is written.** It is evidence of rationale ("why was X done in April"), never a source of current behavior ("how X works today"). Rules that follow:

- Agents must **never cite `work/` as current truth**. Current behavior lives in `guides/`, `modules/`, or next to the code.
- Any knowledge in a work entry that is still true and load-bearing must be **promoted to a living guide** in the same change. What stays in work is the narrative.
- Read `work/` only for archaeology: investigating when/why something was done. Never on routine tasks.
- Entries are **immutable**: never modified after their initial commit. Follow-up information goes in a new entry referencing the original.

Under this contract, `work/` can grow indefinitely at zero token cost — nothing routine ever reads it.

## Convention

- One file per significant change: `work/YYYY-MM/YYYY-MM-DD-slug.md` (kebab-case, descriptive).
- Log: merged features, architectural refactors, migrations, incidents and their fixes, closed stories/requirements worth a trace.
- Skip: self-evident bug fixes, minor renames, doc-only changes.

## Entry format

```markdown
# YYYY-MM-DD — {one-line title}

## What changed
{2–4 sentences}

## Why
{the constraint or trigger}

## How
{the approach — patterns, modules, key files}

## Promoted knowledge
{which living docs were created/updated as a result — or "None"}

## Follow-ups
- [ ] {open work this entry leaves behind, or "None"}
```
