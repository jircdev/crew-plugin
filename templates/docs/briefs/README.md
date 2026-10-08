# Briefs — Project manifestos

A **manifesto** is the document that opens a project. It is addressed to the people who decide and align before any backlog work starts — the client, the CEO (chief executive officer), the CIO (chief information officer), and the CTO (chief technology officer) / team coordinator who will hand it to the technical crew. One initiative, one manifesto.

It is written by `COM` (commercial-strategist) when it starts from a client engagement, or by `PROD` (product-strategist) when it starts from an internal product decision. It captures the *what* and the *why*. The *how* and the technical detail live in the requirement.

This is the gate between *idea* and *backlog*: new projects, new product directions, initiatives with meaningful cost. A small change inside an already-approved scope does not need one.

## How it reads

**Written as prose.** Continuous prose under a few headings, Why-first. A reader who is not technical should understand it end to end and recognize that it does what they set out to do. The earlier strict, bulleted, fixed-length gate is gone: a manifesto persuades and aligns the team.

The shape that works (adapt the headings to the initiative; they are a guide, with no blanks to fill):

- **The problem (the Why)** — what is needed, the pain behind it, the cost of the status quo, in the reader's own terms. Start here.
- **What we will do** — the agreed solution direction and its intent. The *what and why*.
- **The scope of now** — what the first step delivers, and an explicit "not now / not this".
- Optional, only when it sharpens the decision — rough magnitude, the main trade-off, or an Input → Output → Impact line. The rough magnitude here is the **project-level estimate** (level 1 of the estimation discipline): order-of-magnitude, before any story exists, to judge viability — never a milestone breakdown. Detailed estimation happens later, at planning, by whoever executes each work item.

## Hard rules

- **Why first.** The document opens on the problem, never on the solution or a feature list.
- **Narrative prose.** No bulleted form-filling, no fixed scaffolding. If it needs a plan inside, it is hiding a requirement — move that out.
- **Plain language.** No code, no schemas, no stack or tool names unless the decision is *about* them. If only a developer understands the sentence, it belongs in the requirement.
- **Acronyms expanded** on first use; no internal jargon.
- **Short.** Long enough to align, short enough to read in one sitting.
- Written in the reader's language.

## Frontmatter

Every manifesto carries a frontmatter block so tools and roles can route it:

```yaml
---
artifact: brief
defined_by: [commercial-strategist]   # or [product-strategist]
audience: [admin]                      # the readers who decide/align
status: draft                          # draft | in-validation | approved | rejected
date: YYYY-MM-DD
---
```

A one-line header under the title may restate it for human readers: `> **Tipo:** Brief · **Definido por:** <role>`.

## Lifecycle

```
draft → in-validation → approved | rejected
```

State lives in the frontmatter. A manifesto is a **living draft** while in discovery — it mutates as the team learns what it needs. Once **approved** it becomes the project's starting intent: still readable as the record, and a change of intent is made by **supersession**: a new manifesto that references the old one. An approved decision is never rewritten in place.

## Chaining

- Manifesto **approved** → unlocks the stories/requirements that implement it; each links back to it as its authorization.
- No backlog work starts while the gate applies and the manifesto is unapproved.
- The go/no-go belongs to the sponsor declared in the project's `AGENTS.md` § Role ownership map — never an agent's call.

## Convention

- One file per initiative: `YYYY-MM-DD_slug.md`.
- Written by `COM` or `PROD`; the human owner presents it; the sponsor decides.
