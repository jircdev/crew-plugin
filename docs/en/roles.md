# Role catalog

16 core roles plus 1 extended profile, invoked as `/crew:<alias>` (or the `ALIAS:` prefix where activated). Read them two ways: by **area** (how they're organized) and by **delivery stage** (when each acts) — both below. Full ownership table: [`templates/AGENTS.md`](../../templates/AGENTS.md).

## By area

Each role belongs to exactly one of six areas, from discovery to governance — the plugin is not just architects, it covers the whole arc.

**1. Business & Discovery** — understand what the client needs, judge business viability, author the manifesto that starts the project.

| Alias | Role | What it does |
|-------|------|--------------|
| `COM` | commercial-strategist | Client-facing discovery and business viability; authors the project manifesto — the front door, upstream of product. Also owns brand and content strategy for the public-facing web: positioning, sitemap, messaging. |
| `PROD` | product-strategist | Product vision, roadmap, jobs-to-be-done, prioritization and success metrics — upstream of every product-facing role. |

**2. Product & Delivery** — turn intent into product and executable work: stories, acceptance criteria, team sequencing.

| Alias | Role | What it does |
|-------|------|--------------|
| `FA` | functional-analyst | Decomposes intent into stories with acceptance criteria; validates delivered work against them. |
| `COORD` | delivery-coordinator | Sequences roles, surfaces blockers, keeps intent fidelity — coordination, not technical or product decisions. |

**3. Design & Experience** — what information each screen needs, how it looks and behaves, and the cross-cutting visual system.

| Alias | Role | What it does |
|-------|------|--------------|
| `DEA` | data-experience-architect | Defines the informational spec per screen — what data each view needs. |
| `UX` | ux-architect | Layout, interaction, flow, accessibility, and the cross-cutting visual system (design tokens, typography, color, motion, iconography). Owner of taste: composition, density, hierarchy, elegance. Consulted **before** UI is coded, not as a post-hoc auditor — and never issues a design-quality verdict without seeing the render. |

**4. Engineering & Architecture** — how the system is built: architecture, data, frontend, extension contracts.

| Alias | Role | What it does |
|-------|------|--------------|
| `SYS` | system-architect | Architecture, API contracts, cross-module patterns, and the base-platform ↔ modules/products extension contract. |
| `DA` | data-architect | Schema, integrity, migrations, query performance. |
| `FE` | frontend-architect | Frontend state, data fetching, routing, forms — consults `UX` at design phase before coding any interface. |

**5. Quality, Security & Operations** — that what is built is correct, secure, measurable, and shippable: testing, security, operations, analytics.

| Alias | Role | What it does |
|-------|------|--------------|
| `SEC` | security-compliance | Personal data, RBAC, regulatory — may interrupt any role. |
| `QA` | qa-test-architect | Testing strategy, fixtures, regression coverage; in verdict mode, the post-implementation verdict of code vs. the written specs. |
| `OPS` | platform | Everything post-merge: releases, versioning, publish order, changelog, deploys, CI/CD, cloud infra, SLOs, error budgets, runtime observability, performance budgets. |
| `ANA` | analytics-architect | Event taxonomy, KPIs, instrumentation, funnels. |

**6. Governance & Meta** — the catalog and the documentation themselves: roles, standards, docs, read-only exploration.

| Alias | Role | What it does |
|-------|------|--------------|
| `DOC` | documentation-steward | Docs structure, lifecycle and drift prevention. |
| `RES` | researcher | Read-only exploration — returns findings, never recommendations. |
| `CREW` | crew | The crew itself: governs the catalog (add/merge/retire roles, resolve authority overlap, keep role docs consistent) and installs/activates it in a target so the `ALIAS:` prefix works. |

## Extended profile (opt-in)

Not part of the core crew — activate only when the project needs it.

| Alias | Role | What it does |
|-------|------|--------------|
| `API` | dx-architect | Public API/SDK developer experience: versioning, deprecation, ergonomics. Activate only when the product exposes a public API or SDK. |

## Skills — crafts, not roles

A craft that every role needs is a **skill**, not a seat in the catalog: it is loaded, not invoked, and it owns a *how* rather than a decision.

- **`writing`** — the communication craft, loaded when a role authors a piece (brief, deck, one-pager, essay, technical doc, speech, script). Owns idea-force, narrative arc, audience segmentation, impact principles — never the domain content.
- **`design`** — the interface craft, loaded by any work that changes what the user **sees, understands, chooses or does**: a screen, a state, an empty view, an error message, the wording of a form. Four modes — `shape`, `handoff`, `implementation-review`, `visual-review` — each with a named fallback for what the project has not declared. It carries method only: what is good *in your product* lives in your `docs/design/`, and what your project can *do* (where it runs, its component registry, how renders are captured) is declared in `crew.json`. See [configuration.md](configuration.md#design-capabilities).

## By delivery stage

The crew follows a spec-driven, Scrum-aligned circuit — one artifact per stage, read from the repo, never re-pasted into a prompt. Full standard: [delivery circuit](../../templates/docs/guides/delivery-circuit.md).

| Stage | What happens | Artifact | Roles |
|-------|--------------|----------|-------|
| **1 · Vision** | The *why* and the goal; sponsor go/no-go before any backlog work | `docs/briefs/` | `COM` [commercial-strategist](../../agents/commercial-strategist.md)<br>`PROD` [product-strategist](../../agents/product-strategist.md) |
| **2 · Backlog & design** | Decompose intent into stories with acceptance criteria; define what each screen needs and how it looks | `docs/stories/` | `FA` [functional-analyst](../../agents/functional-analyst.md)<br>`COORD` [delivery-coordinator](../../agents/delivery-coordinator.md)<br>`DEA` [data-experience-architect](../../agents/data-experience-architect.md)<br>`UX` [ux-architect](../../agents/ux-architect.md)<br>`COM` [commercial-strategist](../../agents/commercial-strategist.md) (public-web strategy) |
| **3 · Technical design** | Architecture decisions just-in-time (not a big upfront document); purely-technical work as its own track | `decisions/` (ADR) · `spec.md` · `requirements/` | `SYS` [system-architect](../../agents/system-architect.md)<br>`DA` [data-architect](../../agents/data-architect.md)<br>`FE` [frontend-architect](../../agents/frontend-architect.md)<br>`API` [dx-architect](../../agents/dx-architect.md) (extended, if activated) |
| **4 · Build** | Implement a Ready story/requirement; the domain architect implements its own area | code + PR | (stage-3 roles, implementation mode) |
| **5 · Ship & verify** | Test, validate against criteria, secure, deploy, release, measure | story Validation · `work/` | `QA` [qa-test-architect](../../agents/qa-test-architect.md)<br>`SEC` [security-compliance](../../agents/security-compliance.md)<br>`OPS` [platform](../../agents/platform.md)<br>`ANA` [analytics-architect](../../agents/analytics-architect.md) |

Technical design (stage 3) is **not** a mandatory gate before every story — decisions are made just-in-time per work item; a full upfront spec belongs only to purely-technical initiatives (a `requirement`, parallel to stories), never as waterfall. Cross-cutting at every stage: `DOC` [documentation-steward](../../agents/documentation-steward.md), `RES` [researcher](../../agents/researcher.md) and `CREW` [crew](../../agents/crew.md).

## Retired aliases

The catalog was consolidated; each retired alias has a successor, and for one version the old slash commands answer with the successor instead of failing. Migrating an existing project: [migration-0.21.md](migration-0.21.md).

| Old alias | Successor | Why |
|-----------|-----------|-----|
| `PERF` | `OPS` | Performance and reliability merged into platform — everything post-merge is OPS. |
| `REL` | `OPS` | Release lifecycle merged into platform. |
| `INFRA` | `OPS` | Cloud infra and CI/CD merged into platform. |
| `SC` | `QA` | Spec-compliance is now QA's verdict mode. |
| `WEB` | `COM` | Public-web strategy absorbed by commercial-strategist. |
| `VIS` | `UX` | The cross-cutting visual system absorbed by ux-architect. |
| `MOD` | `SYS` | Extension contracts absorbed by system-architect. |
| `CA` | `CREW` | Catalog governance and installation merged into one role. |
| `INST` | `CREW` | Catalog governance and installation merged into one role. |
| `DX` | `API` | Renamed; now an extended (opt-in) profile. |
| `LEA` | `RES` | Alias renamed; same read-only role. |
| `COMM` | `writing` skill | Communication craft became a skill any role can load. |
