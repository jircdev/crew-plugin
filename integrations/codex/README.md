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
  task text, not a literal shell variable. Pass only validated arguments to
  executables; metrics accepts an optional YYYY-MM and explicit `--csv`.
- `Spawn <role> subagent` means use the host's delegation facility when it is
  available and allowed. Supply the canonical `agents/<role>.md` body and this
  adapter to the child; a skill is not a registered native Codex subagent type.
  Ignore Claude frontmatter `model: opus`; preserve the user's model settings.
  If delegation is unavailable or prohibited, apply the role in the current
  task and disclose that no independent consultation occurred. Do not claim
  independent QA for a self-review.
- `${CLAUDE_PLUGIN_ROOT}` in executable examples means the resolved plugin
  root. Codex hook commands receive `PLUGIN_ROOT` (and a compatibility alias);
  ordinary shell calls must use the resolved absolute path explicitly.
- Claude-specific global activation (`~/.claude/CLAUDE.md`) applies only to
  Claude. For Codex prefer project `AGENTS.md`; change global Codex instructions
  only on an explicit request. `.claude/launch.json` is evidence about Claude's
  launch configuration, not proof of a Codex launch capability. Confirm an
  executable launch command or usable URL before declaring that capability.
- `crew.json`, templates, roles, quality policy, design/testing capabilities and
  work records have exactly one meaning across hosts. Do not create Codex-only
  project configuration or silently grant missing capabilities.

Hooks require host trust and Node.js. Without hooks, load the baseline through
the skill and apply standards as instructions; report that mechanical guards
were not verified. `apply_patch` is checked through a conservative adapter,
including the work-item shape guard; shell writes are not checked by Crew's
write guards. The off-repo plan notice is registered for MCP tools with the
same hooks file, but whether Codex runs PreToolUse hooks on MCP calls is
unverified: treat plans published through a connector as unguarded and follow
the planning craft's repo-first rule by instruction. See
`docs/en/compatibility.md` for installation, coverage and validation limits.
