---
name: planning
description: "The planning craft, loadable by ANY role (and by the main agent) whenever work is being planned or sized — an estimated plan, a roadmap with hours, a breakdown into work items, an estimate for a story or requirement, a phase/release sequence. Owns HOW a plan becomes repo artifacts in the project's own standard; never the domain decisions inside it. Load BEFORE writing any plan, estimate or work item, even when the request asks for a link, a doc or a chat answer; triggers on 'plan', 'estimate', 'how many hours', 'roadmap with hours', 'break this into stories', 'plan estimado', 'estimá', 'estimación', 'cuántas horas', 'planificá', 'armá el plan', 'desglosá en requerimientos'."
---

# Planning — the work-item craft

A plan is work items in the repo. Everything else — a published doc, an artifact link, a chat summary, a slide — is a **view** of those files and links back to them. This skill exists because the opposite happened: a plan was produced as an external doc, in a table shape nobody had defined, and no guard saw it.

The domain decisions inside the plan belong to their owning roles (`SYS` sequences the architecture, `COORD` the delivery, `FA` the stories, `PROD` the priority). This craft governs the **form** and the **sizing method**: where the plan lives, which standard and which principles it follows, what its hours count, and how you prove it.

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

## 2. The project's planning principles come before the plan

A project declares how it plans and sizes work in its own `docs/requirements/README.md`, under a heading that names its planning or estimation principles. `conformance.js` prints the path of that section when it holds at least one principle.

- **Read that section before writing a line.** It carries what this skill cannot know: the project's reference sizes, what its framework already solves, the criteria its owner set. Where it speaks, it wins over this skill.
- **The list grows in the same change.** When the owner defines or corrects a criterion while reviewing a plan, add it to that section, with its date and the plan that prompted it, in the change that fixes the plan. A criterion that stays in the chat is lost for the next plan.
- **No section yet:** plan with section 4, and create the section with the first criterion the owner gives.

## 3. Repo first, view second

- Write the work items as files **first**: `docs/requirements/<plan>/README.md` (context, index, recommended order) plus one `NNN-slug.md` per requirement, or stories under `docs/stories/<feature>/`.
- When the request asks for a link, a doc or an artifact, publish it **after** the files exist, as a summary that names the repo path as its source. Never put estimate tables only in the view: the view may summarize totals; the milestones live in the files.
- A plan that exists only in chat or only in an external doc is a defect, whatever the request's wording.

## 4. Estimation happens at two levels — respect which one you are at

- **Project level** (a brief, a proposal awaiting go/no-go): rough magnitude only. No milestone breakdown.
- **Planning level** (a work item taken for execution): whoever executes adds the `## Estimation` table — milestones, both estimates, closed by a **Total** row — and the `## Verification` table at the same moment. Stories are authored without estimation; an analyst never estimates.
- **Every estimate is double, always, without waiting to be asked.** Each milestone carries `Est. hours` at person pace (what it takes a person without agents, fixed before deciding who executes) and `Est. AI hours` (the agents' processing time; `0` when the milestone has no agent work). A plan with only person-pace hours is incomplete, and so is one that hides the AI figure in Notes.
- **Human review is its own milestone row**, never a line outside the table and never folded into another milestone: the person's time reading, correcting and approving agent work, with `Est. AI hours` of `0`. In a repository connected to factory it closes with the task and never keeps one open (`task-closure` skill).
- The **Total** row sums all four columns (`Est. hours`, `Est. AI hours`, `Actual hours`, `Actual AI hours`). A plan README that summarizes several work items reports both totals.
- During execution, `Started` and `Finished` are written **in real time**, with a timezone offset, when the milestone begins and the moment it closes. Never reconstructed. `Actual hours` is the person's time; `Actual AI hours` comes from a capture (factory, the harness's session log) — write `—` when nothing measured it, since a figure typed from memory loses its value as evidence.
- When the project's own template still carries the legacy crew columns, conformance prints a notice: write the current columns anyway (both shapes conform until the next minor version) and flag in the seal that the template needs updating. When the project's template is its own shape (translated, reshaped) without an AI column, the template wins: still estimate both, write the AI figure as `AI est. X h` in Notes, and name the gap in the seal.

## 5. What the hours count

These apply in every project; the project's own principles refine them.

- **The data model of the whole plan is its first milestone.** The entities of every work item are defined together, at the start, and reviewed against the full entity-relationship picture, including what already exists. A plan that spreads new tables across its work items gets regrouped before it is estimated.
- **Estimate on top of what already exists.** Before putting hours, read what the project's framework and codebase already solve: the stack specifications declared in `crew.json`, any capability inventory the project keeps, the code itself. The work item names the piece it reuses. A second way of doing something the project already does is a defect of the plan.
- **One integrated estimate.** When several roles are consulted, whoever writes the plan integrates a single estimate and checks it against the project's reference sizes. Adding up each role's hours inflates the total, because each one counts its part from zero.
- **Ceremony is sized once.** Tests, guides, help text and human review are sized in proportion to the change. The same package of milestones copied into every work item inflates the plan.
- **Hours go to what is specific.** A milestone above the project's reference sizes names in `Notes` the rule that makes this work different. Where the project declares no reference sizes, the longest milestones carry that note all the same.
- **Verify before presenting.** Whatever can be checked by reading the repository and its installed dependencies is checked before the plan is delivered. What stays as a risk needs production, a third party or a decision of the owner, and says which.

## 6. Delegating to subagents

When you ask a role to estimate or draft work items, give it **the path of the standard** (or the `conformance.js` output) — and the path of the project's planning principles when it has them, never a table format of your own. Ask each role for its judgment of the work; the hours you publish are the integrated estimate of section 5. A role that receives a format contradicting the effective standard applies the standard and reports the requested deviation.

## 7. When the project has no delivery circuit

In `solo` mode, or when the project has no `docs/requirements/` or `docs/stories/`, do not scaffold ceremony on your own. Say what is missing and ask where the plan should live before creating structure. The answer is the project's to give.

## 8. Seal

End with one line: which standard was applied (project template at `<path>`, crew template, or deviation N of `docs/DEVIATIONS.md`), which planning principles were read (the project's section, or section 5 alone), what was checked (`conformance.js --check` on each file, the reuse verified in the repository), and what stayed unverified.
