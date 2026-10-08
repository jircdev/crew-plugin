# Claude Code and Codex

Crew keeps one base: `agents/` contains the 17 roles, `commands/` their
procedures, `skills/design`, `skills/writing` and `skills/planning` the crafts, and `standards/`
and `templates/` the conventions. `hooks/lib/config.js` interprets the same
`crew.json` in both hosts. No parallel project configuration is needed.

The 34 alias skills are generated links to that base, one per command in
`commands/`. Claude retains `/crew:<alias>` and subagents; when a skill takes
precedence over its same-name command, it points back to the original procedure.
Codex uses those skills and `integrations/codex/README.md`. Codex does not
register native subagent types, and Crew does not promise independent
consultations when the host cannot delegate.

## Requirements

Node.js 22+ for the scaffold, helpers and hooks; Git for commit checks; Bash for
the pre-commit gate and the `.sh` wrappers (Git Bash on Windows). Installing a
published ZIP does not need Python; building release artifacts from source uses
Python 3.10+. Versions verified on 2026-10-08 on Windows: Claude Code 2.1.227
and Codex CLI 0.130.0-alpha.5. Model authentication is configured in each
application. Crew does not touch it.

## Install in Claude

Follow the [installation guide](installation.md): add `jircdev/crew-plugin`,
then install `crew@factory-crew`. Each published release also includes
`crew-<version>.plugin`, the package mentioned in migration 0.24, and
`crew-<version>.zip`, with identical ZIP bytes for interfaces requiring that
extension. Both have `.claude-plugin/plugin.json` at the archive root. They are
the complete packaged plugin, distinct from a standalone JSON manifest or a
marketplace catalog. Neither contains `bin/`.

For a local session: `claude --plugin-dir /absolute/path/to/crew-plugin`.
Invoke `/crew:fe`, `/crew:setup` or `/crew:metrics`. Chat surfaces without hooks
or subagents can only consume skills; guard guarantees hold only where hooks
run. Hosted archive upload was not tested.

## Install in Codex

Steps verified on Codex CLI 0.130.0-alpha.5 on 2026-10-08. That version has no
`codex plugin add`: installing means registering the catalog, installing the
plugin and enabling the hooks.

1. **Get the Codex catalog.** There are two sources:
   - From source, for the repo's current version: in a clone of the plugin,
     `python scripts/build-release.py --output work/release-<version>`. The catalog
     lands in `work/release-<version>/codex-marketplace/` and is also packaged as
     `assets/crew-codex-<version>.zip`. The builder requires a new directory and
     never overwrites.
   - From a published release: download `crew-codex-<version>.zip` from the
     [releases](https://github.com/jircdev/crew-plugin/releases) and extract the
     whole archive into a stable directory, for example `C:/tools/crew-codex-<version>`.
     The latest published release is 0.25.0, older than the repo's current version.

   The directory must keep `.agents/plugins/marketplace.json` (the catalog,
   named `factory-crew`) and `plugins/crew/` (the plugin).
2. **Register the catalog:**

   ```sh
   codex plugin marketplace add <catalog-directory>
   codex plugin marketplace list
   ```

3. **Install the plugin.** Codex loads a plugin installed under
   `CODEX_HOME/plugins/cache/<marketplace>/<plugin>/<version>` and enabled in
   `config.toml`. `CODEX_HOME` is Codex's configuration directory. Verified manual steps:
   - copy the catalog's `plugins/crew/` to `CODEX_HOME/plugins/cache/factory-crew/crew/<version>/`;
   - add to `CODEX_HOME/config.toml`:

     ```toml
     [plugins."crew@factory-crew"]
     enabled = true
     ```

   The Codex app's plugin directory probably performs this step when it
   installs Crew. That is not verified.
4. **Enable the hooks.** Crew's guards are hooks, and Codex runs them only when
   both conditions hold:
   - the `plugin_hooks` feature is on (Codex still marks it as under development),
     in `config.toml` or per run with `codex --enable plugin_hooks`:

     ```toml
     [features]
     plugin_hooks = true
     ```

   - each hook is trusted. Review and trust them with `/hooks`; Codex stores
     each trust in `config.toml` as `[hooks.state."<key>"]` with a
     `trusted_hash`. Installing the plugin does not grant that trust, and every
     change to a hook definition asks for review again.

   With either missing, Codex loads Crew's skills but runs **none** of its
   guards. In that state the smoke observed a `git commit --no-verify` succeed.
5. **Check.** Open a new task in the project. The skill picker should list the
   aliases (`crew:fe`, `crew:setup`, etc.) and the design, writing and planning
   crafts. To confirm the guards run, follow [Verify and update](#verify-and-update).

The GitHub repository holds the Claude catalog. Codex uses the generated
catalog, which has a different schema. As an alternative not verified on 0.130,
`$plugin-creator` can register the source plugin in a personal marketplace while
preserving its files.

## Configure and activate a project

Open the consumer repository and select `crew:crew` if you need to scaffold
project conventions. Explicitly request solo or team mode; the scaffold
(`scripts/init-project.js`, or its `init-project.sh` wrapper) preserves existing files.
Then select `crew:setup` to review `crew.json`, design and testing. The interview asks only
what is missing, confirms understanding and writes only what was confirmed.
Accepting the current state is also a valid outcome.

`AGENTS.md` is the shared project context and `CLAUDE.md` its Claude pointer.
There is no need to copy the criteria to another Codex configuration file.
For the conversational `FE:`/`SYS:` prefixes, ask Crew to activate its section
in `AGENTS.md`; plugin installation alone does not write that file. Use the
picker for explicit skill invocation. `/crew:<alias>` is Claude syntax; in
Codex it is not assumed to be a native command.

Keep the same `crew.json`: mode, metrics, quality, capabilities and
`configuredWith`. Missing capabilities are never invented. Global model and
authentication preferences remain owned by each application.

## Verify and update

In a new task, confirm Crew is enabled and `crew:fe` reads frontend-architect.
In a disposable project, try editing an existing `docs/work/YYYY-MM/` entry:
Claude Write and Codex apply_patch must return Crew's immutability denial.
If that denial is missing, check `plugin_hooks`, trust in `/hooks`, Node on
PATH and the tool used. A shell write does not test this guard. Check the file
on disk: skill text alone does not show that the guard ran.

To update Claude: `/plugin update crew@factory-crew`, then a new session.

To update Codex, prepare the new version in another directory and keep the
previous one until the change is verified. Register the new directory with
`codex plugin marketplace add`; if a `factory-crew` source is already
registered, remove it first with `codex plugin marketplace remove factory-crew`
(this removes the registered source and leaves your project untouched). Copy
the new plugin to its own version directory in the cache, open a new task and
trust changed hooks again. Do not edit files inside an installed version.

## Coverage and limits

| Control | Claude Code | Codex |
|---|---|---|
| Baseline and configuration notice | SessionStart | SessionStart with event cwd and Codex adapter |
| Roles and crafts | Commands/subagents and skills | Skills reading the same originals; delegation depends on host |
| Immutability, estimation, verification, timestamps, quality | Edit/Write guards | apply_patch translated per file and evaluated by the same guards |
| Work-item shape | Edit/Write guard | apply_patch through the same guard |
| Plans published outside the repo | Notice on MCP and Artifact calls | Verified: an MCP call reaches PreToolUse as `mcp__<server>__<tool>`, the notice runs and reaches the model |
| Hook bypass, destructive commands | Bash/PowerShell guard | Verified: the native shell reaches hooks as `Bash` with `command`; `--no-verify` is denied |
| Policy relaxations | Edit/Write guard | apply_patch through the same guard |
| Work in progress at session start | Verified: SessionStart at startup, resume and after compaction (`compact`); PreCompact notice shown | At startup only. PreCompact and PostCompact fire, but the notice is not shown in `exec` and no SessionStart follows a compaction, so the block does not return to the model |
| Agent configuration security scan | `scripts/sec-scan.js`, doctor, SessionStart notice | Same script; Codex config files are not yet among the scanned targets |
| Catalog usage (opt-in per person) | PostToolUse on Agent/Skill, UserPromptSubmit | UserPromptSubmit and PostToolUse fire; whether Codex's own delegation reaches PostToolUse is unverified |
| Work log | Stop | Same script: Git and cwd, no transcript parsing |
| Activity capture (factory mode) | SessionStart, UserPromptSubmit, Stop, SessionEnd, PostToolUse Edit/Write/MultiEdit | Same events as far as the host emits them; the task comes from apply_patch file headers on PostToolUse |
| Size at commit | Optional scaffolded Git hook | Same hook; `node /path/crew/scripts/check-staged.js --all` checks tracked files |

The adapter supports additions, deletions, updates, moves, multiple files and
hunks with plain `@@` or `@@ function/class` and unique exact line context.
Function/class anchors search forward and allow surrounding whitespace.
It checks move sources and destinations without writing to disk. Ambiguous
context, missing anchors, fuzzy line matching and repeated paths are denied
with a correction request.
On a denial, split the patch; writing through the shell to get around it breaks the control.
A rename with historical metrics may need a separately reviewed procedure.

`quality: advise` informs without explicitly approving the tool; `enforce`
denies and `off` is silent. Shared guards let the operation through on an
internal error, except the shell and policy guards; the adapter denies
parser/child-process failures. Shell writes, MCP writes beyond the off-repo
plan notice, disabled or untrusted hooks and specialized tool paths are not
covered. Crew is a process aid. If a control must hold against someone
bypassing it, protected CI is needed: Git hooks can be skipped. The Git checker
covers sizes only. Stop is a reminder based on today's commits and entries, and
does not certify closure. Without hooks, the skill loads the baseline as
instructions and must disclose that mechanical enforcement was not verified.

## Tests and maintenance

Edit canonical roles/commands and run `node scripts/sync-codex.js`. `--check`
detects missing, stale or retired entries. The Codex manifest derives version
and author from Claude's, so it is not edited by hand. The contract suite is
`node --test "tests/*.test.js"`. CI runs it on Windows and Linux.
`python scripts/build-release.py --output <new-directory>` generates `.plugin`,
`.zip`, the Codex catalog ZIP and `SHA256SUMS` without publishing anything.

The optional `python tests/runtime-smoke.py --output <new-directory>` smoke uses
installed CLIs and a loopback controlled-response server. If Claude is not a
direct executable, pass `--claude /path/claude.exe`. It is **pinned to Codex
0.130.0-alpha.5** and refuses another version, because plugin install and hook
trust changed between releases. It installs Crew with the manual steps of
[Install in Codex](#install-in-codex) and writes a per-hook `trusted_hash` only
for the package it just built. Three host cases
run on top of the original checks: Codex's native shell running
`git commit --no-verify` (denied; tool name recorded), a minimal stdio MCP
server with a `publish` tool (notice observed), and compaction with an open
milestone in both hosts. On 2026-10-08, with Claude Code 2.1.227, discovery of
37 skills in both hosts and 17 Claude agents was verified; both rejected the
invalid modification through the real hook, preserving the protected file and
preventing the first valid file in the same patch from being written. A valid
`@@ function` edit is also checked. Codex runs with approvals and the sandbox
bypassed inside the isolated profile so fixture writes succeed;
it receives only fixed local-server operations, never remote-model decisions.
No credentials were copied and no global profiles changed. This tests runtime
integration. Real-model judgment, adherence and collaboration, the interactive
hook trust UI and hosted uploads remain untested.

## Sources

Contracts consulted on 2026-09-07:
[OpenAI packaging](https://developers.openai.com/plugins/build/plugins),
[Claude migration](https://developers.openai.com/plugins/guides/submit-claude-plugin),
[Codex hooks](https://developers.openai.com/codex/hooks),
[Claude skills](https://code.claude.com/docs/en/skills) and
[Claude ZIP upload](https://support.claude.com/en/articles/13837433-manage-plugins-for-your-organization).
The Codex 0.130 install was verified against the CLI on 2026-10-08.
The `.plugin` precedent and `bin/` restriction are in
[migration 0.24](migration-0.24.md). Spanish is the editorial source; English
maintains the same structure and information.
