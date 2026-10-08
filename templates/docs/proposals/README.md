# Proposals — Ownerless ideas

Improvements detected during work that nobody owns yet: a gap, a refactor idea, a possible capability. A proposal has no owner, no date, no estimation — that is precisely what distinguishes it from a story or requirement.

## Lifecycle

A proposal exits this folder in one of three ways:

1. **Matures** — someone owns it → it becomes a story (`stories/`) or requirement (`requirements/`) and this file is deleted (the new artifact links back to the idea's origin if useful).
2. **Is decided** — it turns out to be a decision → ADR in `decisions/`.
3. **Is discarded** — with the reason recorded in the file before archiving it in the closing commit message.

## Convention

- One file per idea: `<topic>.md`, kebab-case English.
- Free format, but always include: what was observed, why it might matter, and what would make it actionable.
- Review this folder periodically (the `DOC` role flags stale proposals during audits).
