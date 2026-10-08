---
name: planning
description: "The planning craft, loadable by ANY role (and by the main agent) whenever work is being planned or sized — an estimated plan, a roadmap with hours, a breakdown into work items, an estimate for a story or requirement, a phase/release sequence. Owns HOW a plan becomes repo artifacts in the project's own standard; never the domain decisions inside it. Load BEFORE writing any plan, estimate or work item, even when the request asks for a link, a doc or a chat answer; triggers on 'plan', 'estimate', 'how many hours', 'roadmap with hours', 'break this into stories', 'plan estimado', 'estimá', 'estimación', 'cuántas horas', 'planificá', 'armá el plan', 'desglosá en requerimientos'."
---

# Planning — the work-item craft

A plan is work items in the repo. Everything else — a published doc, an artifact link, a chat summary, a slide — is a **view** of those files and links back to them. This skill exists because the opposite happened: a plan was produced as an external doc, in a table shape nobody had defined, and no guard saw it.

The domain decisions inside the plan belong to their owning roles (`SYS` sequences the architecture, `COORD` the delivery, `FA` the stories, `PROD` the priority). This craft governs the **form**: where the plan lives, which standard it follows, and how you prove it followed it.

## 1. Resolve the effective standard before writing a line

The standard is the project's, with the crew template as fallback:

1. **The project's own template wins** — `docs/requirements/README.md` and `docs/stories/README.md`, the fenced block under the template heading. A project that translated or reshaped its template has declared its standard by doing so.
2. **Where the project has none**, the crew template applies (the one `/crew:setup` scaffolds).
3. **Declared deviations** in the `crew:standard` block of `docs/DEVIATIONS.md` are applied on top. Each carries its rationale; honor them, never "fix" them.

Print it instead of remembering it:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/conformance.js" docs/requirements/<plan>/001-x.md
```

The output names the source (project or crew), the header fields, the sections, the exact table columns, and any deviation applied or ignored. Use those columns **verbatim** — the heading `## Estimation` and its column names are what the closure gate reads.

## 2. Repo first, view second

- Write the work items as files **first**: `docs/requirements/<plan>/README.md` (context, index, recommended order) plus one `NNN-slug.md` per requirement, or stories under `docs/stories/<feature>/`.
- When the request asks for a link, a doc or an artifact, publish it **after** the files exist, as a summary that names the repo path as its source. Never put estimate tables only in the view: the view may summarize totals; the milestones live in the files.
- A plan that exists only in chat or only in an external doc is a defect, whatever the request's wording.

## 3. Estimation happens at two levels — respect which one you are at

- **Project level** (a brief, a proposal awaiting go/no-go): rough magnitude only. No milestone breakdown.
- **Planning level** (a work item taken for execution): whoever executes adds the `## Estimation` table — milestones, estimated hours, closed by a **Total** row — and the `## Verification` table at the same moment. Stories are authored without estimation; an analyst never estimates.
- During execution, `Started` and `Finished` are written **in real time**, with a timezone offset, when the milestone begins and the moment it closes. Never reconstructed.
- Review time by a human is a milestone row, never a line outside the table.

## 4. Delegating to subagents

When you ask a role to estimate or draft work items, give it **the path of the standard** (or the `conformance.js` output) — never a table format of your own. A role that receives a format contradicting the effective standard applies the standard and reports the requested deviation.

## 5. When the project has no delivery circuit

In `solo` mode, or when the project has no `docs/requirements/` or `docs/stories/`, do not scaffold ceremony on your own. Say what is missing and ask where the plan should live before creating structure. The answer is the project's to give.

## 6. Seal

End with one line: which standard was applied (project template at `<path>`, crew template, or deviation N of `docs/DEVIATIONS.md`), what was checked (`conformance.js --check` on each file), and what stayed unverified.
