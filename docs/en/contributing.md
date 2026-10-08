# Contributing & maintenance

For shared Claude/Codex entry points, generation checks and packaging, see
[compatibility maintenance](compatibility.md#maintain-and-verify). Edit canonical
roles and commands, then run `node scripts/sync-codex.js`; CI checks for drift.

## Folder structure

```
crew-plugin/
├── .claude-plugin/
│   ├── plugin.json
│   └── marketplace.json
├── agents/
│   ├── product-strategist.md
│   ├── functional-analyst.md
│   ├── system-architect.md
│   ├── ...                   # one file per role
├── commands/
│   ├── prod.md
│   ├── fa.md
│   ├── sys.md
│   ├── ...                   # one file per alias
├── skills/                   # horizontal crafts any role loads (not subagents)
│   ├── writing/SKILL.md      # how a piece communicates
│   └── design/SKILL.md       # how to shape, hand off, review and judge an interface
├── hooks/
│   ├── hooks.json            # registers the plugin hooks
│   ├── session-start.js      # SessionStart: baseline + project-configuration status
│   ├── guard-immutable.js    # PreToolUse: deny edits to immutable artifacts
│   ├── guard-estimation.js   # PreToolUse: estimation table complete before close
│   ├── guard-timestamps.js   # PreToolUse: real-time Started/Finished cells (metrics)
│   ├── guard-code-quality.js # PreToolUse: code-quality ceilings (advise/enforce)
│   ├── check-work-log.js     # Stop: session closure check
│   └── lib/config.js         # THE authorized crew.json interpreter (evolution invariants)
├── migrations.json           # which versions require action (drives the startup notice)
├── standards/
│   ├── session-context.md    # always-on session baseline (suggestive defaults)
│   └── configuration-interview.md  # the fixed question set /crew:setup follows
├── evals/
│   └── design/               # fixtures + rubric: scores agent behavior, never taste
├── templates/
│   ├── AGENTS.md             # canonical agent context (precedence, ownership map, interop)
│   ├── CLAUDE.md             # thin @AGENTS.md pointer
│   ├── standards/
│   │   └── code-quality.md   # universal core (suggestive; project rules win)
│   └── docs/                 # taxonomy seeded into consumer projects (incl. design/)
├── scripts/
│   ├── init-project.sh       # scaffold + crew.json (team / --solo)
│   ├── metrics.js            # /crew:metrics report
│   ├── check-quality.sh      # pre-commit quality gate (installed by init)
│   └── check-staged.js
├── docs/                     # this plugin's own documentation
│   ├── en/                   # English sub-docs (roles, install, usage, contributing)
│   └── es/                   # Spanish (full README + sub-docs)
├── LICENSE
└── README.md                 # canonical English README (ES → docs/es/README.md)
```

## Updating the plugin

Roles and templates evolve. To propagate changes to consumers:

1. Edit the relevant file in `agents/`, `commands/`, `skills/`, or `templates/`.
2. Bump `version` in `.claude-plugin/plugin.json` **and** `.claude-plugin/marketplace.json` — they must match.
3. Add the changelog entry.
4. Add a `migrations.json` row **if and only if** the version requires the consumer to act. Everything additive or opt-in is `required: false` and must not notify — a startup notice that fires for things nobody has to do is a notice nobody reads.
5. Regenerate with `node scripts/sync-codex.js`, run
   `node scripts/check-supply-chain.js`, `node --test tests/compatibility.test.js tests/conformance.test.js tests/catalog.test.js`
   and `python tests/release-test.py`,
   and validate both manifests. For host integration changes, also run the
   [isolated runtime smoke](compatibility.md#tests-and-maintenance).
6. Commit and push; wait for Windows/Linux CI. Tag that commit as `vX.Y.Z`.
   Build with `python scripts/build-release.py --output work/release-X.Y.Z`
   and attach all files in `assets/` to the GitHub release for that tag.
   The builder checks Claude/Codex/catalog versions and refuses existing targets.
   Claude's `.plugin` and `.zip` contain identical ZIP bytes; the Codex ZIP
   contains a local catalog and generated plugin copy. `SHA256SUMS` identifies
   the published bytes. These outputs are not independent sources to maintain.
7. Consumers run `/plugin update crew@factory-crew` in Claude or follow
   [Codex updates](compatibility.md#verify-and-update). Author/local installs
   consume the working tree: pull and regenerate before starting a new session.

For template changes, existing projects must re-run `scripts/init-project.sh` (which skips existing files) or merge the new template manually.

### Changing the `crew.json` contract

`hooks/lib/config.js` is the **single authorized interpreter** — for guards and for roles alike. Its header carries the evolution invariants and they are binding: an existing key never changes meaning · new fields are optional and no default may grant a capability · during a migration both shapes are accepted for one minor version, and retiring the old shape is a mandatory changelog entry · there is no per-section version · **no field may be honored by a role if `normalize()` does not transport it**.

Two consequences worth stating plainly. A role reading `crew.json` directly would create a second interpretation of the same contract — that is the drift the invariant exists to prevent. And the reader, the [configuration reference](configuration.md) and `migrations.json` move in the **same change**, never in a follow-up: the cheapest mechanical check that would close this permanently is verifying that every capability the reader knows appears in the docs.

## Maintenance

- **Adding a new role**: drop a new `agents/<name>.md` (with frontmatter), a new `commands/<alias>.md`, and add a row to the matching **area** in the `templates/AGENTS.md` alias table — then list it under that same area in [`roles.md`](roles.md) (and its Spanish counterpart in `../es/roles.md`). The grouped alias table in `templates/AGENTS.md` is the source of truth for area assignment; the `roles.md` catalog is its index. Name and alias must follow the [naming and alias rules](#naming-and-alias-rules) below. Pick its model by the rule in `agents/crew.md` (decisions on `opus`, reading and structuring on `sonnet`) and update that list if it changes. `tests/catalog.test.js` fails until every surface is registered: a red catalog test means the role is not added yet.
- **Adding a skill**: a craft every role needs is a skill, not a role — it is loaded, not invoked, and owns a *how* rather than a decision. Drop `skills/<name>/SKILL.md` with a `description` precise enough to fire on the real trigger (that description *is* the activation mechanism), then register it in the skills block of `templates/AGENTS.md` and in both `roles.md`. A skill must carry method only: a value, palette, scale, style name or library baked into a skill is the plugin deciding for every consumer project.
- **Renaming or retiring a role**: a catalog decision that goes through the `CREW` meta-role, never a casual edit. Aliases are a shared vocabulary; any alias change ships with a one-version redirect (see below).
- **Stack-specific rule**: keep it in the consumer project's own `standards/` or `AGENTS.md`, never in the universal `templates/standards/code-quality.md` core.
- **Editing the docs**: every human doc is bilingual, with Spanish as the source of truth and English as the mirror (see [canonical language](#canonical-language) below); `templates/docs/guides/delivery-circuit.md` has a Spanish twin `delivery-circuit.es.md` that must move with it. The agent role files, the rest of `templates/`, and the session baseline stay English (the canonical machine layer).

## Naming and alias rules

The role catalog — names, aliases, merges, retirements — is custodied by the `CREW` meta-role; every catalog change goes through it.

- **Name = function, always.** A role is named for what it does (`system-architect`, `qa-test-architect`). Zero codenames.
- **Alias shape**: 2–5 uppercase letters, unique across the catalog. No alias may be a prefix of another, and avoid edit-distance-1 pairs within the same area. `DA`/`DEA` is a deliberate exception, accepted with eyes open: both were established, and `DEA` earned its place with case evidence.
- **Alias changes ship with a redirect.** A renamed or retired alias keeps redirecting to its successor for one version, then disappears.

## Canonical language

An editorial decision, driven by the real audience of `docs/`: **Spanish is the source of truth**, English is the mirror — updated in the same PR, never later. Structural parity between the `docs/en/` and `docs/es/` trees (same files, same section skeleton) is verified through the `CREW` meta-role, or by a CI check once one exists.
