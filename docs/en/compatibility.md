# Claude Code and Codex

Crew 0.25.0 keeps one base: `agents/` contains the 17 roles, `commands/` their
procedures, `skills/design`, `skills/writing` and `skills/planning` the crafts, and `standards/`
and `templates/` the conventions. `hooks/lib/config.js` interprets the same
`crew.json` in both hosts. No parallel project configuration is needed.

The 31 alias skills are generated links to that base. Claude retains
`/crew:<alias>` and subagents; when a skill takes precedence over its same-name
command, it points back to the original procedure. Codex uses those skills and
`integrations/codex/README.md`; it does not register native subagent types or
promise independent consultations when the host cannot delegate.

## Requirements

Node.js 22+ for helpers/hooks, Git for commit checks, and Bash for the optional
scaffold (Git Bash on Windows). Installing a published ZIP does not need Python;
building release artifacts from source uses Python 3.10+. Claude Code 2.1.227
and Codex CLI 0.153.4 were tested on Windows. Configure model authentication in
each application, not in Crew.

## Install in Claude

Follow the [installation guide](installation.md): add `jircdev/crew-plugin`,
then install `crew@factory-crew`. The release also includes `crew-0.25.0.plugin`,
the package mentioned in migration 0.24, and `crew-0.25.0.zip`, with identical
ZIP bytes for interfaces requiring that extension. Both have
`.claude-plugin/plugin.json` at the archive root; neither is a standalone JSON
manifest or marketplace catalog. Neither contains `bin/`.

For a local session: `claude --plugin-dir /absolute/path/to/crew-plugin`.
Invoke `/crew:fe`, `/crew:setup` or `/crew:metrics`. Chat surfaces without hooks
or subagents can only consume skills; do not attribute Claude Code enforcement
to them. Hosted archive upload was not tested.

## Install in Codex

1. Download `crew-codex-0.25.0.zip` from the
   [0.25.0 release](https://github.com/jircdev/crew-plugin/releases/tag/v0.25.0).
   Extract the entire archive into a stable directory, for example
   `C:/tools/crew-codex-0.25.0`. Keep `.agents/plugins/marketplace.json` and
   `plugins/crew/`: the former is the catalog, the latter the plugin.
2. Register that directory and install the plugin:

   ```sh
   codex plugin marketplace add C:/tools/crew-codex-0.25.0
   codex plugin add crew@factory-crew
   codex plugin marketplace list
   codex plugin list
   ```

3. Open a new task in the project. In the app, find Crew in the plugin directory
   and confirm it is enabled. The skill picker should list the aliases
   (`crew:fe`, `crew:setup`, etc.) and design/writing.
4. Review and trust the hooks through `/hooks` in Codex CLI or your host's
   available trust UI. Plugin installation does not grant hook trust. Every
   change to a hook definition requires review again.

From source, generate the same catalog without registering or installing it:

```sh
node scripts/sync-codex.js --check
python scripts/build-release.py --output work/release-0.25.0
codex plugin marketplace add /path/crew-plugin/work/release-0.25.0/codex-marketplace
codex plugin add crew@factory-crew
```

The builder requires a new destination and never overwrites directories.
Alternatively, `$plugin-creator` can register the existing source plugin in a
personal marketplace while preserving its files. The GitHub repository keeps
the Claude catalog; use the distributed catalog for Codex, since the schemas
are not interchangeable.

## Configure and activate a project

Open the consumer repository and select `crew:crew` if you need to scaffold
project conventions. Explicitly request solo or team mode; the
`scripts/init-project.sh` scaffold preserves existing files. Then select
`crew:setup` to review `crew.json`, design and testing. The interview asks only
what is missing, confirms understanding and writes only what was confirmed.
Accepting the current state is also a valid outcome.

`AGENTS.md` is the shared project context and `CLAUDE.md` its Claude pointer.
There is no need to copy the criteria to another Codex configuration file.
For the conversational `FE:`/`SYS:` prefixes, ask Crew to activate its section
in `AGENTS.md`; plugin installation alone does not write that file. Use the
picker for explicit skill invocation; `/crew:<alias>` is Claude syntax and is
not assumed to be a native Codex command.

Keep the same `crew.json`: mode, metrics, quality, capabilities and
`configuredWith`. Missing capabilities are never invented. Global model and
authentication preferences remain owned by each application.

## Verify and update

In a new task, confirm Crew is enabled and `crew:fe` reads frontend-architect.
In a disposable project, try editing an existing `docs/work/YYYY-MM/` entry:
Claude Write and Codex apply_patch must return Crew's immutability denial.
If that denial is missing, inspect `/hooks`, Node on PATH and the tool used;
a shell write does not test this guard. Check the file on disk. Skill text
alone does not establish enforcement.

To update Claude: `/plugin update crew@factory-crew`, then a new session.
To update the distributed Codex catalog: download/extract the new version in
another directory, retain the previous one until verification and register
the new root. If Codex already has a local `factory-crew` source, run
`codex plugin marketplace remove factory-crew` before `marketplace add` with
the new path; this removes the registered source, not your project. Run
`codex plugin add crew@factory-crew` again, inspect the version with
`plugin list`, open a new task and trust changed hooks again. For a source
catalog updated at the same root, use
`codex plugin marketplace upgrade factory-crew` and reinstall Crew. Do not edit
the installed cache.

## Coverage and limits

| Control | Claude Code | Codex |
|---|---|---|
| Baseline and configuration notice | SessionStart | SessionStart with event cwd and Codex adapter |
| Roles and crafts | Commands/subagents and skills | Skills reading the same originals; delegation depends on host |
| Immutability, estimation, verification, timestamps, quality | Edit/Write guards | apply_patch translated per file and evaluated by the same guards |
| Work-item shape | Edit/Write guard | apply_patch through the same guard |
| Plans published outside the repo | Notice on MCP and Artifact calls | Registered; whether Codex runs hooks on MCP calls is unverified |
| Hook bypass, destructive commands | Bash/PowerShell guard | Registered for shell tool names; the exact Codex tool name for shell hooks is unverified |
| Policy relaxations | Edit/Write guard | apply_patch through the same guard |
| Work in progress at session start | SessionStart, also after compaction; PreCompact notice | SessionStart; whether Codex fires PreCompact is unverified |
| Agent configuration security scan | `scripts/sec-scan.js`, doctor, SessionStart notice | Same script; Codex config files are not yet among the scanned targets |
| Work log | Stop | Same script: Git and cwd, no transcript parsing |
| Size at commit | Optional scaffolded Git hook | Same hook; `node /path/crew/scripts/check-staged.js --all` checks tracked files |

The adapter supports additions, deletions, updates, moves, multiple files and
hunks with plain `@@` or `@@ function/class` and unique exact line context.
Function/class anchors search forward and allow surrounding whitespace.
It checks move sources and
destinations without writing to disk. Ambiguous context, missing anchors, fuzzy
line matching and repeated paths are denied with a correction request. Split the
patch; never bypass a denial through shell writes. A rename with historical
metrics may need a separately reviewed procedure.

`quality: advise` informs without explicitly approving the tool; `enforce`
denies and `off` is silent. Shared guards retain their internal-error fail-open
behavior; the adapter denies parser/child-process failures. Shell writes, MCP writes beyond the off-repo plan notice,
disabled/untrusted hooks and specialized tool paths are not covered. This is a
process guardrail, not a security boundary. Git hooks can be skipped; protected
CI is needed if enforcement must survive that. The Git checker covers sizes
only. Stop is a reminder based on today's commits/entries, not proof of closure.
Without hooks, the skill loads the baseline as instructions and must disclose
that mechanical enforcement was not verified.

## Tests and maintenance

Edit canonical roles/commands and run `node scripts/sync-codex.js`. `--check`
detects missing, stale or retired entries. The Codex manifest derives version
and author from Claude's; do not edit it manually. The contract suite is
`node --test tests/compatibility.test.js`. CI runs it on Windows and Linux.
`python scripts/build-release.py --output <new-directory>` generates `.plugin`,
`.zip`, the Codex catalog ZIP and `SHA256SUMS` without publishing anything.

The optional `python tests/runtime-smoke.py --output <new-directory>` smoke uses
installed CLIs and a loopback controlled-response server. If Claude is not a
direct executable, pass `--claude /path/claude.exe`. On Windows, discovery of
33 skills in both hosts and 17 Claude agents was verified; both rejected the
invalid modification through the real hook, preserving the protected file and
preventing the first valid file in the same patch from being written. A valid
`@@ function` edit is also checked. Codex uses a one-invocation trust exception
for reviewed sources and allows fixture writes without the Windows sandbox;
it receives only fixed local-server operations, never remote-model decisions.
No credentials were
copied and no global profiles changed. This tests runtime integration, not
real-model judgment, adherence or collaboration, interactive hook trust UI, or
hosted uploads.

## Sources

Contracts consulted on 2026-09-07:
[OpenAI packaging](https://developers.openai.com/plugins/build/plugins),
[Claude migration](https://developers.openai.com/plugins/guides/submit-claude-plugin),
[Codex hooks](https://developers.openai.com/codex/hooks),
[Claude skills](https://code.claude.com/docs/en/skills) and
[Claude ZIP upload](https://support.claude.com/en/articles/13837433-manage-plugins-for-your-organization).
The `.plugin` precedent and `bin/` restriction are in
[migration 0.24](migration-0.24.md). Spanish is the editorial source; English
maintains the same structure and information.
