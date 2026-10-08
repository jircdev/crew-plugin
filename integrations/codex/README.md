# Crew in Codex

This file is the Codex transport adapter. Role authority, procedures, project
configuration and standards remain in the canonical files at the plugin root.

Before applying a Crew command, read `standards/session-context.md` from this
plugin, the project's `AGENTS.md` and `crew.json`, then the linked command and
role. Resolve plugin paths relative to this file (`../..` is the plugin root),
never by guessing an installed cache location. Read shared crafts from
`skills/design/SKILL.md`, `skills/writing/SKILL.md` and `skills/planning/SKILL.md`
when relevant; any plan or estimate loads the planning craft first.

Interpret canonical Claude transport syntax in Codex as follows:

- `/crew:<alias>` means select Crew's skill named `<alias>` in Codex's skill
  picker (for example `fe`, `setup`, `metrics`). `$ARGUMENTS` means the user's
  task text. Pass only validated arguments to
  executables; metrics accepts an optional YYYY-MM or `catalog`, and an explicit `--csv`;
  check accepts an optional test kind passed as `--kind <kind>`; doctor accepts
  `repair` or `uninstall` plus `--dry-run`, and runs those two only on request.
- `Spawn <role> subagent` means use the host's delegation facility when it is
  available and allowed. Supply the canonical `agents/<role>.md` body and this
  adapter to the child. Codex has no native subagent type registered for a skill.
  Ignore Claude frontmatter `model: opus`; preserve the user's model settings.
  If delegation is unavailable or prohibited, apply the role in the current
  task and disclose that no independent consultation occurred. Do not claim
  independent QA for a self-review.
- `${CLAUDE_PLUGIN_ROOT}` in executable examples means the resolved plugin
  root. Codex hook commands receive `PLUGIN_ROOT` (and a compatibility alias);
  ordinary shell calls must use the resolved absolute path explicitly.
- Claude-specific global activation (`~/.claude/CLAUDE.md`) applies only to
  Claude. For Codex prefer project `AGENTS.md`; change global Codex instructions
  only on an explicit request. `.claude/launch.json` describes Claude's launch
  configuration only; it does not establish a Codex launch capability. Confirm an
  executable launch command or usable URL before declaring that capability.
- `crew.json`, templates, roles, quality policy, design/testing capabilities and
  work records have exactly one meaning across hosts. Do not create Codex-only
  project configuration or silently grant missing capabilities.

Hooks require host trust and Node.js. Without hooks, load the baseline through
the skill and apply standards as instructions; report that mechanical guards
were not verified. `apply_patch` is checked through a conservative adapter,
including the work-item shape guard; shell writes are not checked by Crew's
write guards. Plugin hooks run only with the `plugin_hooks` feature enabled
and each hook trusted; without both, none of Crew's guards run, so say so
instead of assuming them. With them (verified on Codex 0.130.0-alpha.5), the
native shell reaches hooks as `Bash` and MCP calls as `mcp__<server>__<tool>`.
The work-in-progress block arrives through SessionStart at startup only: after
a compaction no SessionStart runs, so re-read open milestones from the work
items before continuing. See
`docs/en/compatibility.md` for installation, coverage and validation limits.
