# Documentation Index

Entry point for all project documentation. If a question maps to a row below, go straight there — do not search blindly.

## Routing table

| I need to… | Start here |
|------------|------------|
| Understand the project | [`spec.md`](spec.md) |
| Know where each doc type goes | [`AGENTS.md`](AGENTS.md) |
| Understand the delivery process (intent → closure) | [`guides/delivery-circuit.md`](guides/delivery-circuit.md) |
| Validate an initiative with a non-technical sponsor | [`briefs/`](briefs/README.md) |
| See functional work items (stories) | [`stories/`](stories/README.md) |
| See technical work items (requirements) | [`requirements/`](requirements/README.md) |
| Understand a non-obvious decision | [`decisions/`](decisions/README.md) |
| Check ideas nobody owns yet | [`proposals/`](proposals/README.md) |
| Investigate when/why something was done | [`work/`](work/README.md) |
| Check accepted deviations from the crew standard | [`DEVIATIONS.md`](DEVIATIONS.md) |
| Update or reorganize docs | [`MAINTAINING.md`](MAINTAINING.md) |
| Activate a specialized agent role | [`../AGENTS.md`](../AGENTS.md) or `/crew:sys`, `/crew:ux`, `/crew:fa`, etc. |

## Documentation trees

| Tree | Nature | Who writes |
|------|--------|-----------|
| `docs/briefs/` | Executive decision requests — the idea→backlog gate | `PROD`; sponsor decides |
| `docs/stories/` | Functional work items with acceptance criteria | `FA` (functional analysis) |
| `docs/requirements/` | Technical work items, high level | Architect roles (`SYS`, `DA`, ...) |
| `docs/decisions/` | Decision records (state lives in the file) | Whoever decides, any role |
| `docs/proposals/` | Ownerless ideas | Anyone |
| `docs/guides/` | Living behavior docs — how things work today | Implementers |
| `docs/glossary/` | Domain terms, UI tooltip copy | `FA` / `PROD` |
| `docs/work/` | Immutable history — evidence, never truth | Implementers, at closure |
| `docs/DEVIATIONS.md` | Accepted deviations from the crew standard | `DOC` audits + owner |

Folder = nature, state = field inside the file, files never move. Full criteria: [`AGENTS.md`](AGENTS.md).

## Layer-specific entry points

Add per-layer indexes here as the project grows (frontend, backend, packages). Each follows the same routing-table pattern.

Source-of-truth rule: each piece of information lives in exactly one place. Other docs link to it; they do not duplicate it.
