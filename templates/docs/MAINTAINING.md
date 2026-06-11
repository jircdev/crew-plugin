# Documentation Maintenance Rules

These rules govern when and how documentation changes. Owned by the `documentation-steward` role.

## Core principles

1. **Single source of truth.** Each fact lives in one document. Others link to it.
2. **Docs change in the same PR as the code.** If behavior changed, the doc that describes it must change too. CI may enforce this.
3. **No drift.** A doc that contradicts the code is worse than no doc. Detect and fix on every review.
4. **No tutorial prose.** Docs answer questions. Examples are minimal and runnable.

## When to update which doc

| Change | Update |
|--------|--------|
| New functional behavior to build | Story in `docs/stories/<feature>/` (via `FA`) |
| New technical work item | Requirement in `docs/requirements/<plan>/` (architect roles) |
| New endpoint / IPC command / public API | The contract doc next to the code + `docs/INDEX.md` if a new section appears |
| Schema migration | `docs/decisions/` ADR if non-trivial; the schema doc near the migration |
| New module / feature | Module README + add row to `docs/INDEX.md` routing table |
| Architectural decision | New ADR in `docs/decisions/` (use `0000-template.md`) |
| Significant change worth historical record | Entry in `docs/work/YYYY-MM/YYYY-MM-DD-slug.md` |
| Stack or tooling change | `AGENTS.md § Stack` + an ADR explaining the swap |
| Convention / rule change | `.cursor/rules/*.mdc` + `AGENTS.md` if it affects activation |
| Divergence from the crew doc standard, accepted by owner | Row in `docs/DEVIATIONS.md` (only via `DOC` audit) |

## Work item lifecycle (stories and requirements)

Folder = nature, state = field, files never move. A story/requirement is born `Draft`, becomes `Ready` via owner-approved PR, and freezes at `Closed`. The estimation table inside each work item is mandatory before implementation and must be completed (actual hours) at closure. Full circuit: [`guides/delivery-circuit.md`](guides/delivery-circuit.md).

## What does NOT belong in docs

- Changelogs that duplicate `git log`.
- Tutorial walkthroughs of trivial code.
- "How to run npm install" — assume baseline literacy.
- Per-release notes (use `CHANGELOG.md` only).
- Implementation details that the reader can get faster by opening the file.
- End-user manuals inside `docs/guides/` — guides are builder/agent-facing; product docs get their own location (e.g. `docs/product/`).

## ADR lifecycle

ADRs in `docs/decisions/` are append-only records. To supersede:

1. Mark the old ADR header `Status: Superseded by 00NN`.
2. Write a new ADR explaining what changed and why.
3. Do not delete or rewrite the old one — it is historical context.

## Drift detection (manual checklist)

When reviewing a PR, check:

- Are file paths in changed docs still valid?
- Does the doc still match what the code does?
- Did this PR move/rename a symbol? Grep for the old name in `docs/`.
- Did this PR delete a feature? Remove or update its doc.

## Doc styling

- Markdown only. No HTML except for `<details>` collapsibles when truly justified.
- Headings increase by one level only — no `#` then `###`.
- Tables for routing / mapping / comparison; bullets for lists; prose only when a fact needs context.
- Links use relative paths inside the repo.
- Code blocks declare language for syntax highlighting.
- File references in prose: backtick-wrapped relative path, optionally with `:line`.
