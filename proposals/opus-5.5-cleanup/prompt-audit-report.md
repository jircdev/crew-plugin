# Prompt audit: crew plugin (`C:/w/crew-plugin-work-tracking`)

## Assumptions (Step 0)

- **Scope.** `agents/*.md` (17), `skills/*/SKILL.md` (33: 31 generated alias wrappers plus `design` and `writing`; none has reference files), `commands/*.md` (31), `standards/*.md` (2), `templates/AGENTS.md`, `templates/CLAUDE.md`, `templates/standards/code-quality.md`, `templates/docs/guides/*.md` (4), and all text hooks put into model context: `hooks/session-start.js` (it emits `standards/session-context.md`, plus `integrations/codex/README.md` under Codex, plus the configuration notices), and the deny/notice/block reasons in `guard-*.js`, `check-work-log.js` and `codex-pre-tool.js`. `capture-activity.js` emits nothing. `templates/docs/AGENTS.md`, `templates/docs/work/README.md` and `docs/en/roles.md` were read only to check facts other files state about them.
- **Skipped.** `hooks/hooks.json` and every settings/credential file, as the request asked. `docs/en|es/*.md` and `README.md` are human documentation. Hook deny messages point the model at `docs/en/enforcement.md`, which was skimmed and agrees with the hooks. The user-level file `~/.claude/CLAUDE.md` sits outside the project and gets no edits. One conflict with it is flagged (L2), and any change to it would affect every project.
- **Target model.** Claude Opus 5.5 (`claude-opus-5-5`) for the baseline, commands, skills, templates and the 15 agents pinned to `model: opus`. `documentation-steward` and `researcher` pin `model: sonnet`, so they were also read against Claude Sonnet 5.5. No finding depends on which of the two runs them.
- **Group 4** covers request-building code. This repository has none, so the group is not applicable. The sub-agent roster check still ran: the 17 agents have no redundant pair.
- **Edits proposed only.** Nothing was applied to the repo. Every Group 2 edit is proposed for confirmation.

## Summary

The highest-impact finding is **F01**. Fifteen subagent prompts describe the estimation table without its **Total** row. That row has been required since 0.23, and `guard-estimation.js` rejects closure without it. None of the 16 prompts that carry the block knows about factory mode, where the table becomes optional and a `**Factory task:**` header is what closure requires. A role that follows its own prompt gets blocked by the plugin's own hook.

**F07** concerns two files that load together in every scaffolded session and give opposite rules on file paths. `templates/AGENTS.md` (2026-06-10) has the agent "point to files" and end documentation answers with `Fuente: path`. The newer baseline `standards/session-context.md` (2026-08-14) says paths and `file:line` citations appear only when the user asks. Because the project's AGENTS.md wins on precedence, the plugin's older template silently overrides its newer rule.

**F08 and F09** are about register. The always-on baseline and the shared chat block in every role ban negative parallelism, yet use it themselves: "not a referral list", "not a conversation", "a failure, not concision", "This is not a forbidden-word list. It is a positional rule." The same block also sets numeric output caps ("3-6 sentences per point", "Bullets only when listing 2-3 discrete items") and a no-headers rule. On Opus 5.5 the prompt's register carries into the output, and caps tuned for older verbose models clip answers that need more room.

**Counts per group**

| Group | Findings in diff | Flags / low | Total |
|---|---|---|---|
| 1. Dated prompt text | 5 (F08, F09, F11, F12, F13) | 1 (L1) | 6 |
| 2. Brittle skill/config files | 8 (F01–F07, F10) | 5 (L2–L6) | 13 |
| 3. Tool descriptions (skill/command/agent descriptions, hook reasons) | 0 | 3 (L7–L9) | 3 |
| 4. Request config and architecture | not applicable (roster check: zero) | — | 0 |

## Findings, ordered by confidence

Line numbers refer to HEAD `9382c80`.

### High confidence

| ID | Location | Evidence | Pattern | Why obsolete | Action |
|---|---|---|---|---|---|
| F01 | `agents/{analytics-architect,commercial-strategist,crew,data-architect,data-experience-architect,delivery-coordinator,documentation-steward,dx-architect,frontend-architect,functional-analyst,platform,product-strategist,security-compliance,system-architect,ux-architect}.md` (Estimation discipline paragraph; e.g. `ux-architect.md:195`), plus `qa-test-architect.md:149` for the factory half | "add its estimation table — Milestone \| Est. hours \| Started \| Finished \| Actual hours \| Notes — with your milestone breakdown … A work item cannot close with an incomplete estimation table." | G2 contradicting files and volatile specifics | `hooks/guard-estimation.js:74-79` denies closure without a **Total** row, added in 0.23 (`78d593c`). Only `qa-test-architect.md:149` was updated. In factory mode (`9382c80`; `templates/AGENTS.md:190`, `guard-estimation.js:130-137`) the table is optional and closure requires a `**Factory task:**` header. None of the 16 blocks says so. Blame orders it: the agent text dates from `fae221f` (0.21.1), the gate from 0.23 and Unreleased. | rewrite: add ", closed by a **Total** row" in the 15 files and append the factory-mode sentence in all 16 |
| F02 | `agents/researcher.md:81-83` | "## Estimation discipline … When YOU take a work item … add its estimation table … record its real start/finish" | G2 contradiction (inside the file and against its tools) | The researcher is "Read-only: never modifies code" (`:26`) and its tool list is `Read, Grep, Glob, WebFetch`. It cannot follow an instruction to write tables and timestamps. | remove the section |
| F03 | 13 agents, the "A chat reply is not a deliverable" paragraph (e.g. `ux-architect.md:142`, `data-architect.md:53`) | "Five operational rules govern every chat response" | G2 volatile specifics (stale count) / 1d patch accretion | The file then lists seven rules: Scope, Length and format, Token economy, Open questions cap, Gloss jargon, No premature handoffs, Consult don't defer. The count is wrong in the file itself. | rewrite: "The operational rules below govern every chat response, and the three numbered craft rules after them apply on top." |
| F04 | `agents/crew.md:32, 47, 108, 121, 169` | "a role is not "added" until its agent doc, command, alias-table row, `docs/roles.md` entry, version bump, and changelog entry all exist" · "the redirect table lives in `docs/roles.md`" | G2 volatile specifics | `docs/roles.md` does not exist (the files are `docs/en/roles.md` and `docs/es/roles.md`), and neither has a redirect table; the retired-alias list lives in `templates/AGENTS.md:162`. Since 0.25 every alias also needs its generated `skills/<alias>/SKILL.md` (`scripts/sync-codex.js`). `docs/en/contributing.md:5,68` requires it and `sync --check` fails CI without it. | rewrite all five passages (diff) |
| F05 | `templates/AGENTS.md:66` | "\| `work/` \| Historical change log (immutable) \|" | G2 volatile specifics | Every other row in that map is root-relative (`docs/INDEX.md`, `docs/decisions/`). The log lives in `docs/work/`, as `guard-immutable.js:36`, `check-work-log.js:28` and `session-context.md:23` all state. | rewrite to `docs/work/` |
| F06 | `standards/configuration-interview.md:110` | "Asking all nine blocks at once." | G2 volatile specifics (stale count) | The question set has eleven blocks (0–10). Blocks 9 (Verification) and 10 (Factory) were added later. | rewrite: "Asking every block at once." |
| F07 | `templates/AGENTS.md:74, 81, 82` vs `standards/session-context.md:13` | AGENTS: "drop to detail (code, paths, line-level mechanics) only when the conversation warrants it or the user asks" · "Guide — … point to files and patterns" · "Structure: answer → example → `Fuente: path`". Baseline: "code, file paths, and `file:line` citations appear only when the user explicitly asks for them — a technical topic does not by itself license them." | G2 contradicting instruction files | Both load in every session of a scaffolded project. The AGENTS.md lines come from `4dc3e27` (2026-06-10) and the baseline line from `7f2a8bc` (2026-08-14), so the older text is rewritten to match the newer. Since AGENTS.md takes precedence, the old text currently wins. `Fuente:` is also a Spanish label in an English template. Assumed direction: the baseline is the current intent. The edit reaches only newly scaffolded projects. | rewrite the three AGENTS.md passages (diff) |
| F10 | `agents/ux-architect.md:57`, `system-architect.md:33`, `commercial-strategist.md:23,35,59`, `dx-architect.md:9`, `frontend-architect.md:46`, `skills/writing/SKILL.md:8` | "(absorbed from visual-identity)" · "(absorbed from module-extension-architect)" · "keeps web-strategist's structure" · "Formerly the communications-strategist role" · "(the old `DX` collided visually with `DA`)" · "the redesigned UX role" | G2 history narratives / 1d migration-relative phrasing | These name roles retired in 0.21, which the model never sees. "keeps web-strategist's structure" points at a structure that no longer exists anywhere, though the colon after it does list the structure. The rule's authority is the behavior it prescribes. | rewrite: drop the archaeology, keep the content (diff) |

### Medium confidence

| ID | Location | Evidence | Pattern | Why obsolete | Action |
|---|---|---|---|---|---|
| F08 | `standards/session-context.md:7,9,11,13,15,19,21`; the shared chat lines in 16–17 agents ("Two modes", "Scope", the "Third mode" sentence, "This is not a forbidden-word list") | "your in-house staff, not a referral list" · "returns its conclusion … not a conversation" · "staying silent about a defect you noticed is a failure, not concision" · "withholding them there is not craft, it is an unimplementable handoff" · "This is not a forbidden-word list. It is a positional rule." | 1c example over-indexing / register bleed | The baseline (`:13`) and every role's "Human voice" line ban negative parallelism, while the same files use it many times each. Current models match the register and structure of the prompt more strongly than its prose rules, so the text undoes its own rule. This matches the project's writing rule in `~/.claude/CLAUDE.md`. | rewrite as direct statements (diff). The diff covers the whole baseline and the four sentences shared across the roles. Role-specific contrasts such as "Stand in your craft, not on the scaffolding" and "gets *more* X, not less" remain, and a follow-up pass can take them |
| F09 | 16 agents, "Length and format" (e.g. `ux-architect.md:146`, `crew.md:147`) | "Short prose, 3-6 sentences per point. No `##` section headers, no numbered briefs … Bullets only when listing 2-3 discrete items." | 1f numeric output ceilings + 1d anti-formatting rule | These are numeric clamps and a no-headers rule written against verbose models (`4dc3e27`, v0.9.0). On Opus 5.5 they clip answers that need more than six sentences or four items. The real intent is "deliverable scaffolding belongs to the Deliverable", which the rewrite keeps without the numbers. | rewrite: "Prose sized to what was asked. Section headers, numbered briefs and role-specific deliverable scaffolding belong to the Deliverable; use them in chat once the user asks for one. Use bullets when the content is a set of discrete items." |
| F11 | `skills/design/SKILL.md:26-27` | "\| Ask, as before \|" | 1d migration-relative phrasing | "as before" describes a previous version the model never saw. | rewrite: "Ask before connecting" / "Ask before running it" |
| F12 | `skills/design/SKILL.md:55` | "Anti-generic pass … The criterion for "generic" is the project's rejected patterns and its stated references — never a list of proscribed patterns written here." | 1e frontend-design exception for Opus 5.5 | When nothing steers it, Opus 5.5 falls back on a few default styles. An abstract "anti-generic" check with no named defaults mostly swaps one default for another, and most projects start with an empty `docs/design/`. The rewrite names the defaults only as things to *question when memory is silent* and keeps the project's rejected patterns as the criterion. It may sit uneasily with the "plugin carries no taste" frontier (`:14`), which is a reason the user may decline the hunk. | rewrite (diff) |
| F13 | `templates/AGENTS.md:39, 69, 166`; `agents/frontend-architect.md:44` | "## Code quality rules (MANDATORY)" · "## Communication (MANDATORY)" · "**Consult, don't defer (MANDATORY).**" · "## UX consultation trigger (MANDATORY)" | 1a pressure language | These are blanket emphasis markers with no tested underweighting behind them. On current models they make everything near them read as top priority. `Role activation (MANDATORY)` (`:86`) was left alone because `agents/crew.md:57` detects installed projects by that heading. | rewrite: drop the marker |

### Flags and low confidence (report only)

| ID | Location | Evidence | Pattern | Note | Action |
|---|---|---|---|---|---|
| L1 | `templates/AGENTS.md:90` | "When a user message begins with `{alias}:` … the agent MUST:" | 1a | This is the routing contract, and its emphasis may be load-bearing; no trigger eval exists to show either way. | flag |
| L2 | `~/.claude/CLAUDE.md` (user-level, outside project) | Alias table lists `LEA`, `SC`, `PERF`, `INFRA`/atlas-deploy, `REL`, `CA`, `INST`, `VIS`, `WEB`, `MOD`, `DX` as live roles | G2 contradicting files | That is the pre-0.21 catalog. It loads in every session, next to the plugin's 17-role catalog and 12 retired-alias redirects. A fix means re-injecting the current block from `templates/AGENTS.md`, which `/crew:crew` installation does, and would affect every project. | flag (outside project) |
| L3 | `agents/crew.md:30,47`, `templates/AGENTS.md:162`, `CHANGELOG.md:144` vs `commands/{ca,comm,dx,infra,inst,lea,mod,perf,rel,sc,vis,web}.md` + matching `skills/*` | "retiring an alias only with a one-version redirect" · "(one-version redirects)" | G2 policy vs repo state | The aliases retired in 0.21 still ship in 0.25+, regenerated as Codex skills. Either the redirects should go (24 files) or the "one-version" text should be rewritten. History cannot tell which one is current intent. | flag: user decides |
| L4 | `agents/researcher.md:74` vs `:3` | "Recommended follow-ups — additional scope or roles the caller may want to invoke next" vs "NEVER recommendations" | G2 internal tension | The role is defined as never recommending, yet its response format includes recommended follow-ups. Renaming the field to "Open threads" would resolve it. | flag |
| L5 | the "Third mode" sentence in 17 agents | "concrete identifiers (component, token, value, path, breakpoint) ARE the deliverable" | G2 copy drift | UX vocabulary copied into data, security and commercial roles. | flag |
| L6 | "Gloss jargon" line in 11 agents | "(jobs-to-be-done, coupling, handoff, vigencia, etc.)" | G2 copy drift | This example list is copied unchanged into 11 roles and includes a Spanish term in English prompts. | flag |
| L7 | `commands/<alias>.md` + `skills/<alias>/SKILL.md` (31 pairs) | identical `description` in both | G3 near-duplicate entry points | Two entry points share each name. CHANGELOG 0.25 says the skill wins and routes back to the command, which costs an extra read per invocation. Whether both descriptions are listed depends on the host. Packaging decision. | flag |
| L8 | `skills/<alias>/SKILL.md` descriptions | "Activate analytics-architect role" | G3 under-described routing text | Model-invocable skills whose descriptions give no when-to-use. The agents' own descriptions carry that, so the skills add 31 near-empty listings. `disable-model-invocation: true` would hide them from the model in Claude Code, but its effect on Codex is unverified. | flag |
| L9 | `hooks/guard-*.js`, `check-work-log.js:57` | "[Why blocked & how to fix: enforcement.md in the crew plugin docs — docs/en/enforcement.md]" | G3 contract precision | The path is relative to the plugin root, which the model inside a project cannot resolve without knowing the root. The deny text itself is self-sufficient. | flag |

Kept on purpose (working redundancy or load-bearing): "Consult, don't defer" stated in `session-context.md:9`, `templates/AGENTS.md:166` and every role, all in agreement. The "Human voice" list, which carries the user's own documented rule. "Maximum two open questions per turn", an interaction constraint about the human's burden with its reason attached. Capitalized words in agent `description` fields, which do routing work. The exact scripts in `configuration-interview.md`, the capability tables and the hooks' deny reasons, which are tool contracts.

## Size measurements

Rough tokens are chars/4.

| Surface | When it loads | Chars | Words | ≈ Tokens |
|---|---|---|---|---|
| (a) Session baseline `standards/session-context.md` | every session (SessionStart hook) | 6,041 | 918 | 1,510 |
| (a′) + `integrations/codex/README.md` | every session under Codex only | 2,676 | 358 | 669 |
| (d) Σ `description` of 33 skills | every request | 2,653 | 359 | 663 |
| (d) Σ `description` of 31 commands | every request, if listed beside the same-name skills | 1,492 | 178 | 373 |
| (d′) Σ `description` of 17 agents | every request (Agent tool roster) | 5,496 | 784 | 1,374 |
| of which 12 retired-alias skill descriptions | every request | 573 | — | 143 |

| (b) Agent file | Chars | Words | ≈ Tokens |
|---|---|---|---|
| ux-architect | 21,938 | 3,261 | 5,484 |
| crew | 21,796 | 3,347 | 5,449 |
| platform | 17,645 | 2,561 | 4,411 |
| qa-test-architect | 17,603 | 2,721 | 4,400 |
| product-strategist | 15,856 | 2,307 | 3,964 |
| commercial-strategist | 15,794 | 2,385 | 3,948 |
| dx-architect | 15,219 | 2,222 | 3,804 |
| functional-analyst | 14,850 | 2,230 | 3,712 |
| analytics-architect | 14,345 | 2,101 | 3,586 |
| documentation-steward | 13,981 | 2,128 | 3,495 |
| frontend-architect | 13,142 | 1,948 | 3,285 |
| system-architect | 12,987 | 1,878 | 3,246 |
| delivery-coordinator | 11,235 | 1,752 | 2,808 |
| data-experience-architect | 10,891 | 1,634 | 2,722 |
| security-compliance | 10,736 | 1,597 | 2,684 |
| data-architect | 9,839 | 1,493 | 2,459 |
| researcher | 6,741 | 1,064 | 1,685 |
| **Total (17)** | **244,598** | **36,629** | **≈61,150** |

| (c) SKILL.md | Chars | Words | ≈ Tokens |
|---|---|---|---|
| design | 14,452 | 2,298 | 3,613 |
| writing | 5,771 | 883 | 1,442 |
| 31 generated alias wrappers | 482–566 each, 16,120 total | 55–64 each | 120–141 each, ≈4,030 total |

Every role-activation call loads three things: an alias wrapper (~130 tokens), its command (~150 tokens), and the agent body (1.7K–5.5K tokens). About 3–4 KB of each agent is the shared chat block repeated across 13–17 files. That repetition is working redundancy, since subagents do not receive the session baseline. Its cost is that fixes like F01, F03, F08 and F09 must land in every copy.

## Proposed diff

`prompt-audit.diff` (same folder) holds 13 findings in 120 hunks over 22 files, with paths relative to the repo root. It was generated one finding at a time with `-U1`, so each hunk belongs to exactly one finding. `git apply --check` passes from `C:/w/crew-plugin-work-tracking`. Applying it in a scratch clone gives the same result as making all edits at once, keeps CRLF line endings, and `node scripts/sync-codex.js --check` still passes. No test, eval or script asserts any of the changed strings.
