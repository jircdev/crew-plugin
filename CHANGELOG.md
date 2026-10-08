# Changelog

All notable changes to the crew plugin. Format: [Keep a Changelog](https://keepachangelog.com).

## [0.29.0] — 2026-10-07

An install that can be diagnosed, repaired and removed cleanly; adoption of codebases that already exist; and a security scan of the agent configuration that ships no third-party code. Requirements 008, 009 and 010 of plan [`ecc-adoption`](docs/requirements/ecc-adoption/README.md). Migration guide: [`docs/en/migration-0.29.md`](docs/en/migration-0.29.md) / [`docs/es/migration-0.29.md`](docs/es/migration-0.29.md).

### Added

- **Scaffold in Node** ([`scripts/init-project.js`](scripts/init-project.js)), the single source of what gets seeded; `init-project.sh` wraps it. `--dry-run`, `--json`, and an install record with a hash per file in `.crew/install-state.json`. Pre-existing files are never overwritten nor claimed.
- **`/crew:doctor`** ([`scripts/doctor.js`](scripts/doctor.js)): read-only diagnosis in the findings shape — `crew.json` parse and declarations, pending required migrations, receipts without commands, the pre-commit gate, missing scaffold files, expired `DEVIATIONS.md` entries, work items off their standard, stale as-is specs, and the security scan. `repair` and `uninstall` (with `--dry-run`) touch only recorded files the project did not edit.
- **`/crew:adopt`**: `researcher` extracts behavior per capability (at most 15 files, deferred list, `uncertain:` marks, commit recorded) and `functional-analyst` writes it in `docs/as-is/` as When / Then rules and invariants. The doctor reports a spec as stale once its files change.
- **Configuration security scan** ([`scripts/sec-scan.js`](scripts/sec-scan.js)), owned by `security-compliance`: secrets in plain text (masked), bypassed permissions, wildcard shell allows, disabled hooks, hooks calling the network or silencing errors, unpinned `npx -y` MCP servers, hidden characters, planted instructions, read-only agents with write tools. Critical/high/medium/info with no averaged grade; dated reports in `docs/security/`; accepted risks in a `crew:security` block; `--ci` fails a team pipeline on an unaccepted critical or high finding; a session-start notice when the configuration changed since the last scan.
- **Audit trail** (`"audit": true`, team): guard decisions appended to `.crew/audit.log`, never values.
- **Evaluation set** [`evals/brownfield/`](evals/brownfield/README.md).

### Compatibility

- `required: false`. Codex configuration files are not yet among the scanned targets.

## [0.28.0] — 2026-10-07

Reviews whose findings someone else can check, passes that point at a run, and ceremony sized to the request. Requirements 006 and 007 of plan [`ecc-adoption`](docs/requirements/ecc-adoption/README.md). Migration guide: [`docs/en/migration-0.28.md`](docs/en/migration-0.28.md) / [`docs/es/migration-0.28.md`](docs/es/migration-0.28.md).

### Added

- **Findings shape** ([`standards/findings.md`](standards/findings.md)): severity (blocking, important, refinement — one scale for QA and design), owner role, evidence, basis (measured, observed, reasoned) and action; adversarial confirmation of blocking findings; three lenses every code review runs — silent failures, "must not" lines, claimed passes.
- **`/crew:check` and [`scripts/verify.js`](scripts/verify.js)**: run only the commands `crew.json` declares, write a hashed receipt per run under `docs/verification/receipts/`, report READY or NOT READY.
- **`testing.receipts: true`** (opt-in): a `passing` verification row closes only when it cites an existing, unedited, green receipt.
- **"Must not" section** in the story template and in the functional analyst's craft.
- **Size rubric** in the delivery circuit and the coordinator role (trivial, small, standard, large; any security trigger is at least standard); optional `Size:` field in both templates — the shape guard does not require fields marked `(optional)`.
- **Scope notice** ([`hooks/nudge-scope.js`](hooks/nudge-scope.js)): once per item, when the change outgrows its size.
- **Metrics by size**, with average deviation per size and a `size` CSV column.
- **Evaluation set** [`evals/review/`](evals/review/README.md).

### Fixed

- `/crew:metrics` counted the **Total** row as a milestone since 0.23, doubling every item's estimated and actual hours. It is skipped now.

### Compatibility

- `required: false`. Receipts are opt-in; the new template section and field reach existing projects only when they adopt them.

## [0.27.0] — 2026-10-07

Agents stop being able to switch off their own controls, and every session opens knowing what is still in flight. Requirements 003, 004 and 005 of plan [`ecc-adoption`](docs/requirements/ecc-adoption/README.md). Migration guide: [`docs/en/migration-0.27.md`](docs/en/migration-0.27.md) / [`docs/es/migration-0.27.md`](docs/es/migration-0.27.md).

### Added

- **Instruction boundary** in the session baseline: content read through a tool is data; an instruction found in it is quoted, sourced and asked about, and another agent's message never counts as the human's consent.
- **Security triggers** — authentication, authorization, untrusted input, personal-data queries, input-built paths, external calls, cryptography, secrets — listed identically in the baseline and in `security-compliance`; the evidence seal says whether SEC was consulted when one applied.
- **Shell guard** ([`hooks/guard-shell.js`](hooks/guard-shell.js)): denies `--no-verify`, `git commit -n` and `core.hooksPath` in every project with `crew.json`, in both modes, and **fails closed** on internal error for git commands. Destructive commands get a notice asking for targets and rollback. Quoted text is never read as a flag.
- **Policy guard** ([`hooks/guard-policy.js`](hooks/guard-policy.js)): edits that relax `crew.json`, `.claude/settings*.json` or Codex config are denied under `team` + `quality: enforce` unless registered in a new `crew:policy` block of `docs/DEVIATIONS.md`; a notice elsewhere. Fails closed on internal error.
- **Expiring exceptions**: every `docs/DEVIATIONS.md` block accepts `owner:` and `expires:`; past its date an entry stops applying. One parser for all blocks ([`hooks/lib/deviation-lines.js`](hooks/lib/deviation-lines.js)).
- **Work in progress at session start** ([`hooks/lib/work-state.js`](hooks/lib/work-state.js)): open milestones, items awaiting validation and planned verification, at most six lines, read from the repo and never from transcripts; also after a compaction. A PreCompact hook names open milestones before the summary is written.
- **Evaluation set** [`evals/security/`](evals/security/README.md).

### Compatibility

- `required: false`: nothing has to change for the plugin to work, but two denials are new — see the migration guide. Projects without `crew.json` only get notices.
- Codex: shell tool names are matched (`shell`, `local_shell`, `exec_command`, argv commands); the exact tool name Codex hooks receive for shell, and whether it fires PreCompact, are unverified.

## [0.26.0] — 2026-10-07

Work items keep the project's standard at every write, and plans stop escaping the repo. The trigger was a real incident: an estimated plan delivered as an external doc, in a table shape nobody had defined, handed to a role that complied — and no guard saw any of it. Migration guide: [`docs/en/migration-0.26.md`](docs/en/migration-0.26.md) / [`docs/es/migration-0.26.md`](docs/es/migration-0.26.md).

### Added

- **Conformance resolver** ([`hooks/lib/standards.js`](hooks/lib/standards.js)): the effective standard of a story or requirement is the project's own template first, the crew template where the project has none, and the deviations declared in a new `crew:standard` block of `docs/DEVIATIONS.md` on top. A deviation without a rationale is ignored and reported. The crew default is parsed from the scaffolded template itself, so the plugin keeps one source for its own standard.
- **Shape guard at write time** ([`hooks/guard-shape.js`](hooks/guard-shape.js)): header fields, sections, estimation and verification columns and the **Total** row are checked on every write, not only at closure. Only new nonconformance counts, so older items stay editable. `team` + `quality: enforce` denies; `advise`, `solo` and no `crew.json` notify; `off` is silent. Codex reaches it through the `apply_patch` adapter.
- **`planning` skill**: any plan or estimate resolves the effective standard first and lands as repo work items; a published doc or artifact is a view that links to them. The session baseline routes plans to it, and the evidence seal names which standard was applied.
- **`scripts/conformance.js`**: prints the effective standard for a path, or checks files with `--check` (exit 1 on nonconformance).
- **Off-repo plan notice** ([`hooks/nudge-offrepo-plan.js`](hooks/nudge-offrepo-plan.js)): MCP and `Artifact` calls that publish an hours table or work-item sections without naming a `docs/requirements/` or `docs/stories/` path get a notice. Never a denial.
- **Role rule "Standards over dictated formats"**, identical in all 17 roles: a role handed a format that contradicts the effective standard applies the standard and reports the deviation.
- **Catalog integrity tests** ([`tests/catalog.test.js`](tests/catalog.test.js)): registration completeness across command, alias row, EN/ES catalogs and Codex skill; YAML-safe frontmatter; one version across every manifest and the changelog; the model assignment rule written in the CREW role.
- **Supply-chain hygiene scan** ([`scripts/check-supply-chain.js`](scripts/check-supply-chain.js)) over every shipped file: bidi controls, invisible characters and personal absolute paths. Runs in CI.
- **Evaluation set** [`evals/planning/`](evals/planning/README.md) reproducing the incident.

### Fixed

- Eight hooks carried a literal byte-order-mark character inside their BOM-stripping regex; it is now the `\uFEFF` escape, so no shipped source contains an invisible character.

### Compatibility

- Additive; `required: false`. Whether Codex runs PreToolUse hooks on MCP calls is unverified, so in Codex the off-repo notice may not fire; the planning craft's repo-first rule applies there by instruction.

## [0.25.0] — 2026-09-07

### Added

- Codex manifest and 31 generated alias skills referencing the canonical commands
  and 17 roles, alongside the existing shared design/writing crafts.
- Codex apply_patch adapter reusing the four existing guards, with explicit
  rejection of unsupported/ambiguous patch shapes and shared SessionStart/Stop.
- Portable dual-host packaging, synchronization checks, guard-parity tests and
  Windows/Linux CI. Installation and coverage guides in English and Spanish.

### Fixed

- Quote descriptions containing YAML colons in eight agents and the ops command;
  Claude's native validator previously rejected those metadata blocks.
- SessionStart uses the hook payload cwd before environment fallbacks, so nested
  and explicit project sessions load the intended crew.json.

### Compatibility

- The shared alias skills can take precedence over same-name Claude commands;
  they route back to those commands and retain native Claude delegation.
- Isolated native-runtime smoke tests discover all skills/roles and reject
  protected-file writes, using a loopback deterministic response provider.
  Real-model adherence, interactive trust UI and hosted uploads remain untested.
  Shell/MCP writes stay outside the guards. No new consumer migration is required.
- Preserve the 0.24.0 `scripts/` layout and its pre-commit migration. Release
  artifacts include identical ZIP/.plugin payloads, a Codex marketplace ZIP and
  checksums, all generated from the same canonical source.

## [0.24.0] — 2026-08-19

The plugin can now be installed outside the CLI. A top-level `bin/` directory made the claude.ai-hosted validator reject it outright, so the marketplace sync from the desktop app and any packaged `.plugin` failed — the directory is now `scripts/`. Migration guide: [`docs/en/migration-0.24.md`](docs/en/migration-0.24.md) / [`docs/es/migration-0.24.md`](docs/es/migration-0.24.md).

### Changed

- **`bin/` renamed to `scripts/`.** claude.ai-hosted installs reject a plugin with a top-level `bin/` directory: on the CLI its contents are added to `PATH`, but they are not shown on the admin approval surface, so the validator refuses the plugin outright — both when syncing the marketplace from the desktop app and when installing a packaged `.plugin`. The four executables (`init-project.sh`, `metrics.js`, `check-quality.sh`, `check-staged.js`) are unchanged; only their directory moved. Every reference moved with them: `commands/metrics.md` (the `${CLAUDE_PLUGIN_ROOT}` invocation), `agents/crew.md`, the hook comments, and the `docs/es` + `docs/en` trees in the same commit. CLI installs are unaffected by the rename.
- **`scripts/init-project.sh` migrates a pre-existing pre-commit hook** that still points at `bin/check-quality.sh`, rewriting the path in place. Without this the gate would silently stop resolving in every project scaffolded before the rename: the existing "already runs the crew quality gate" branch matches on the filename alone, so a re-run would report `skip (exists)` over a hook that no longer works.

## [0.23.0] — 2026-08-14

Two questions a plan could previously leave unanswered now have a place to be answered: how many hours is this in total, and how does anyone know it works. Migration guide: [`docs/en/migration-0.23.md`](docs/en/migration-0.23.md) / [`docs/es/migration-0.23.md`](docs/es/migration-0.23.md).

**The frontier this release draws:** the plugin carries the **question** (for each behavior, at what level is it verified, with what artifact, and what stays uncovered); the project carries the **answer** — its levels, its harness, its adoption bar. No template names a test tool, and none ever will: a standard that mandated one would produce specs that never run in every repo that uses a different one.

### Added

- **`## Verification` table in every work item**, written at planning by whoever executes, next to the estimation and by the same hand — one row per behavior: scenario, level (unit / integration / contract / e2e / manual), harness, artifact, status. It carries the **method only**, referencing the story's scenario by its human-readable name; the story keeps owning what must be true and one concrete run of it. Three failures it exists to close: *tests as a loose line item* (one bullet inside a milestone hides whether the harness exists at all, which is routinely the largest number in the estimate), *a verification that cannot fail* (an assertion reading the class string passes while a geometric contract is broken — what runs without a layout engine cannot answer a geometric question), and *silence read as coverage* (an absent row is indistinguishable from a covered one). `not verified` **with its reason** is a valid row.
- **`testing` capabilities in `crew.json`**: `guide`, `e2e` (`{ kind, specs }`), `commands`. Each declaration enables something and names what its absence costs, same contract as `design`. **`e2e.kind` is a free label** — no closed enum, because whatever the harness is called the role's action is identical (write the scenario as a spec under `specs`); cataloguing test tools would be the plugin choosing the stack. An `e2e` without `specs` is treated as undeclared and named at session start.
- **Declaring `testing` turns the verification table into a closure gate** ([`guard-estimation.js`](hooks/guard-estimation.js)), in **both** modes and independently of `metrics`: the estimation gate is the metrics discipline, this one is the project's own declaration. The two opt-ins are now evaluated separately, so a solo repo without metrics still gets the verification gate if it declared `testing`.
- **Testing guide scaffold** (`templates/docs/guides/testing.md` + `.es.md` → `docs/guides/`): levels in use, harness, configuration traps, the pixels-contract rule, adoption bar, manual protocol (profiles, entry, rounds, report fields, mandatory conditions), and *what is not verified*. **Ships empty in both `team` and `solo`** — a developer working alone verifies work too — with **zero tool names and zero precharged practices**, the same rule as the design memory.
- **Interview block 9** (`standards/configuration-interview.md`): whether a testing strategy is documented, whether an e2e harness exists and where its specs live, which commands run the suites. Looks before asking, never declares a harness from an installed dependency alone (a package is not an adopted practice), and never proposes a tool the project did not name.

### Changed

- **The estimation table closes with a `**Total**` row** (estimated and actual), enforced at closure wherever the estimation gate already ran. A document whose reader has to add the column is storing numbers rather than reporting them. The total row is exempt from the per-milestone timestamp requirement — it sums milestones, it is not one.
- **No template names a test tool anymore.** The stories template no longer says Playwright; the harness is read from `crew.json` `testing.e2e` by every role. `qa-test-architect` gains the capability table, authority over the project's testing guide and the verification discipline; the delivery circuit gains the verification gate at planning and at closure; `docs/AGENTS.md` gains the verification-discipline section.
- **`init-project.sh`** scaffolds `docs/guides/testing.md` in both modes and seeds `"testing": { "guide": "docs/guides/testing.md" }` — the second capability seeded, and for the same reason as the first: the scaffold creates the file it points at. New projects therefore get the verification gate from day one; existing repos change nothing until their `crew.json` says so.

### Not changed

- No hook watches whether a test went stale when its work item changed. It was considered and dropped: the check needs a link that only exists once the verification table names paths, it cannot run as a blocking pre-write gate (the condition is only satisfiable *after* the edit), and keyed on any edit it would fire on every milestone timestamp until nobody reads it. The declaration in `crew.json` is what makes plans include the spec — enforcement at closure, not surveillance during work.

## [0.22.0] — 2026-08-02

Interface work gets a method that ships with the plugin, and capabilities and taste that stay in the repository. Everything is additive and opt-in; a repo that changes nothing behaves exactly as in 0.21.1. Migration guide: [`docs/en/migration-0.22.md`](docs/en/migration-0.22.md) / [`docs/es/migration-0.22.md`](docs/es/migration-0.22.md).

**The frontier this release draws:** the plugin carries **method and policy** (invariant across stacks, products and companies); the project carries **capability and memory** (how it renders *here*, which components exist *here*, what is considered good *in this product*). Every addition below sits on one side of that line on purpose.

### Added

- **`design` skill** (`skills/design/`): the interface craft, loadable by any role whose work changes what the user sees, understands, chooses or does. Four modes with named fallbacks — `shape` (problem → direction), `handoff` (direction → implementable spec), `implementation-review` (code vs spec), `visual-review` (judgment on the render). Carries procedure and questions only: **zero values, palettes, scales, style names or libraries**, enforced by the *test of the opposite aesthetic* written into the skill. Includes the question set that replaces inference, and the bounded self-critique loop (one mandatory correction pass when a render channel exists; more only for blocking defects; the number of passes is always declared).
- **Design capabilities in `crew.json`** (`design`): `memory`, `sources`, `registry`, `runtime`, `capture`, `checks`. Each declaration enables something **and** names what its absence costs — no capability degrades silently. `runtime.url` and `runtime.launch` are **separate permissions** (connecting to a running app is inspection; running a launch profile executes a command on the user's machine); presence of `runtime` grants neither on its own, url takes precedence, and whatever an agent starts it stops. **Declaring is the permission**: granted once in a readable, revertible file instead of approved every session.
- **Design memory scaffold** (`templates/docs/design/` → `docs/design/`): `README`, `references.md`, `approved.md`, `rejected.md` — structure only, **zero example products, palettes or precharged best practices**. Ships in both `team` and `solo`: a developer working alone builds interface too. `rejected.md` is the anchor for judging whether a surface reads as generic; without it, "generic" is an opinion with nothing behind it.
- **Configuration marker** (`configuredWith`) and **migration registry** (`migrations.json`): state, not policy — nothing interprets the marker to decide behavior. `SessionStart` now reads the project config and emits **at most a few lines**, only when actionable: marker absent (project predates the mechanism), a **required** migration pending, or a capability declared in a form the plugin does not recognize. An optional capability a project simply does not use **never** notifies. The notice closes by updating the marker — including when the answer is "seen it, I want none of it".
- **`/crew:setup`** and the **configuration interview** (`standards/configuration-interview.md`): a fixed, versioned question set. Consults the repo first, asks at most two open questions per turn, confirms understanding in one line, shows what it will write, writes only what was confirmed, updates the marker. Never infers a capability the human can confirm in one line; never authors design-memory content on the project's behalf. "Nothing, thanks" is a complete outcome.
- **Behavioral eval set** (`evals/design/`): nine fixtures and a rubric that scores **agent behavior, never design beauty** — did it load the skill, declare capabilities, consult the registry or say it could not, enumerate the states, refuse a visual verdict without a render, stay out of a neighbouring role's authority. Human-run by design (paired runs with and without the skill); a rubric with taste criteria would be the plugin deciding how every project looks. Includes the routing fixture that catches the skill making UX absorb `data-experience-architect` or `frontend-architect` decisions.
- **Evidence receipt format** (documented, deliberately **not** a gate): anchored to the work item and tree state rather than a commit, recording **which states** were captured. A receipt an agent writes about its own work proves images exist, not that anyone looked — its value is making evidence reviewable by `qa-test-architect` and by the human. The hook that would validate it is deferred and is not sold as proof.

### Changed

- **Register reconciled across all 17 role docs and the baseline** — one canonical form, two rules: (1) **Scope** now distinguishes the scope of the *response* from the scope of the *inspection* — "the limit governs what you say, never what you look at; staying silent about a defect you noticed is a failure, not concision"; (2) the *plane that survives a stack change* rule gains its **third mode**: in handoff and implementation review, concrete identifiers (component, token, value, path, breakpoint) ARE the deliverable, and withholding them is an unimplementable handoff. `researcher` keeps its own response rules, unchanged.
- **Evidence seal** in the baseline and in every design deliverable: one closing line — what was loaded, which declared capabilities were used, what stayed unverified. It reports facts and **never scores quality**. This is also the channel by which an unrecognized capability gets named.
- **`ux-architect`**: the visual-evidence rule is now **capability-conditioned** instead of a blanket prohibition (which in practice guaranteed "code conformity" almost every time). Adds the design-memory and registry sections with their honest fallbacks ("reuse not verified", "no design memory declared"), the bounded self-critique step in the workflow, and the question-before-inference step. Delegates the method to the `design` skill rather than restating it.
- **`frontend-architect`**: the UX consultation trigger is widened beyond "a screen" to anything the user sees, understands, chooses or does, and now loads the `design` skill before consulting and before coding — without acquiring UX's authority.
- **`qa-test-architect`**: the **Design layer becomes independent by construction** — receives the specification and the evidence, never the designer's rationale; requires render evidence to rule on visual quality (otherwise the layer reports *not evaluated for visual quality*, never merged with code conformity); compares against the project's declared memory rather than its own preference.
- **`crew` meta-role**: gains **craft 3 — project configuration**, alongside governance and installation. Custodies the configuration interview, the evolution invariants and the migration registry.
- **`hooks/lib/config.js`**: now the single authorized interpreter for roles as well as guards, with the **evolution invariants written into its header** — an existing key never changes meaning · new fields are optional and no default may grant a capability · a migration accepts both shapes for one minor version, and retiring the old shape is a mandatory changelog entry · there is no per-section version (evolution is additive by construction; a global break would need a version for the whole file) · **no field is honored by a role if `normalize()` does not transport it**. Closed enums only where a role must know *how* to consume a capability (`registry.kind`, `capture.kind`); `viewports`, `checks.kind` and `sources.kind` are free labels with **no defaults** — form factors and tooling belong to the product, not the plugin.
- **`bin/init-project.sh`**: scaffolds `docs/design/` in both modes, writes `configuredWith` and seeds `design.memory` (the only capability seeded, because the scaffold creates the folder it points at). Everything else is left undeclared on purpose. Existing files, including an existing `crew.json`, are still never overwritten.
- **Human-voice rule** added to the canonical register (all 17 role docs), the session baseline, and — in full — the `writing` skill: bans the structural tells of generated text (negative parallelism, "from X to Y" sweeps, symmetric hedges, uniform rhythm, closing formulas, emoji, Title-Case headings) and treats trend-word lists as a weak, fast-decaying signal — structure is the durable defense. No single marker is treated as proof; reviews flag density, never one isolated tell. The em dash is deliberately not banned: weak marker, and the catalog's own house style.
- **`design.baseline` capability**: the fallback taste for questions the project's design memory does not answer — `{ "kind": "skill" | "doc", "ref": "…" }`, a skill a role loads or a document it reads. It exists because the honest fallback was incomplete: a project with a thin design memory got a truthful "not contrasted against anything" and generic output, with no way to say *fall back to this*. Strict precedence — memory outranks baseline and wins every conflict without discussion; the baseline is consulted only where the memory is silent, and named in the evidence seal whenever it was used. The plugin still ships no taste: the ref is always the project's. Undeclared behaves as before, except the admission now reads *"no memory and no baseline declared: the direction rests on the brief alone."* A `baseline` without a `ref` is treated as undeclared and named at session start. Adds interview block 8 (asked only when the memory is empty or thin, and never offering a menu of design systems), fixture F10 and rubric items P6/P7.
- **Severity in both review modes** (`design` skill): every finding in `implementation-review` and `visual-review` carries one — **blocking** (the surface fails its job for someone), **important** (it survives but degrades under real content, at a declared viewport, or repeats a rejected pattern), **refinement** (the absence costs nothing nameable). Two rules keep the scale readable: severity is bounded by the evidence (no render ⇒ nothing blocking on visual grounds, only a suspected defect to confirm), and inflation empties the scale (if everything is blocking, nothing is). An unsorted list of observations hands the triage back to the reader, which is the part the review exists to perform. Rubric items W8/W9.
- **Docs**: `configuration.md` (EN/ES) gains the design-capability reference in three columns — *what you declare · what it enables · what happens if you don't* — plus the evolution invariants, the marker, the receipt format and `/crew:setup`. New `migration-0.22.md` (EN/ES). `templates/AGENTS.md` and `templates/docs/INDEX.md` register the design skill and the design memory.

### Not changed

Stories, requirements, estimation tables and their guards, ADRs, work entries, the quality gate, `/crew:metrics` — untouched. No role added, merged or retired; no alias changed. The estimation block stays identical in all 17 roles: it applies to whoever takes a work item, whatever their role, and is guarded by hooks.

## [0.21.1] — 2026-07-15

### Changed

- **Estimation moved to its Scrum-correct moment** (process fix, reported by Julio while testing). A story is now authored WITHOUT the estimation table — hours are not the analyst's deliverable, and an estimation block in a functional artifact is an antipattern. Estimation happens at two levels: (1) **project level** — rough magnitude in the brief, before any story exists; (2) **planning level** — when a work item is taken for implementation, whoever executes ADDS the `## Estimation` table (milestones, estimated hours) before coding and records real timestamps during execution. The stories template drops the embedded table; the requirements template keeps it (its author is typically its executor). Guards, `/crew:metrics`, and the closure gate are unchanged — closing an implemented item with an incomplete table is still invalid, which is what now forces the planning step. Updated: stories/requirements/briefs templates, docs/AGENTS.md estimation discipline, templates/AGENTS.md, delivery-circuit (EN/ES), the estimation-discipline block in all 17 role docs, and the user docs (metrics, enforcement, using-crew, solo-quickstart, non-technical-roles — EN/ES).

## [0.21.0] — 2026-07-15

The improvements spec v1.4 (M1–M7), implemented in five phases. Migration guide for existing projects: [`docs/en/migration-0.21.md`](docs/en/migration-0.21.md) / [`docs/es/migration-0.21.md`](docs/es/migration-0.21.md).

### Added

- **Operating modes per repo** (`crew.json`, M1): `mode: solo|team`, `metrics`, `quality`, `ceilings` — written explicitly by `bin/init-project.sh` (new `--solo` flag scaffolds the minimal structure). A repo without `crew.json` behaves exactly like v0.19.1; the new defaults exist only as values the scaffold writes. Shared reader `hooks/lib/config.js`; all guards became mode-aware (solo: Closed items editable, no Stop closure check, estimation gate only with `metrics: true`).
- **Real-time timestamps guard** (`hooks/guard-timestamps.js`, M2): with `metrics: true`, newly written `Started`/`Finished` cells must match the machine clock (±15 min), carry a timezone offset, and keep `Finished ≥ Started` with `Actual hours ≤ wall-clock`. Instructive denies include the correct current time. The estimation table becomes a real-time log instead of a reconstructable report.
- **Metrics consumer** (`/crew:metrics` + `bin/metrics.js`, M2): per closed item lead time, execution time, estimated vs actual and deviation; aggregates (median, p90, by folder, by month); `--csv` writes `docs/work/metrics.csv`.
- **Pre-registered quality exemptions** (M3): machine-readable `crew:exempt` glob block in `docs/DEVIATIONS.md`, honored by the write-time guard and the commit gate — the exception is recorded with its rationale before hitting the wall.
- **Authoritative pre-commit quality gate** (M3): `bin/check-quality.sh` / `bin/check-staged.js` over staged files (same ceilings via shared `hooks/lib/ceilings.js`), installed by `init-project.sh` as `.git/hooks/pre-commit` (append, never overwrite); `--all` for CI. Covers agents and humans alike.
- **`writing` skill** (`skills/writing/`): the communication craft (ex communications-strategist role), loadable by any role when authoring a piece.
- **Six new doc pages** (EN+ES, M7): `configuration.md`, `enforcement.md` (every deny explained — guard messages now link it), `metrics.md`, `migration-0.21.md`, `solo-quickstart.md`, `non-technical-roles.md`.

### Changed

- **Quality gate default** (M3): scaffolded projects get `quality: "advise"` — notice at write time, hard stop at commit. `"enforce"` (v0.19.1 behavior) remains available and is the no-`crew.json` behavior. Per-kind ceiling overrides via `crew.json` `"ceilings"`.
- **Role catalog consolidated to 16 core + 1 extended + 1 skill** (M4/M5). Every absorbed Scope/Authority was transplanted, none dropped. Retired aliases answer with a redirect for one version:

  | Retired | Successor | Why |
  |---------|-----------|-----|
  | `PERF` performance-reliability, `REL` release-manager, `INFRA` atlas-deploy | `OPS` **platform** | Everything post-merge is one door |
  | `SC` spec-compliance | `QA` qa-test-architect (verdict mode) | "Well tested?" and "matches the spec?" are one conversation |
  | `WEB` web-strategist | `COM` commercial-strategist | The public web is commercial message |
  | `MOD` module-extension-architect | `SYS` system-architect | Extension contracts are architecture decisions |
  | `VIS` visual-identity | `UX` ux-architect (redesigned) | Visual taste needs one owner with an explicit mandate |
  | `CA` crew-architect + `INST` crew-installer | `CREW` crew | Governing the catalog and installing it: same owner |
  | `COMM` communications-strategist | `writing` skill | A horizontal craft, not a domain authority |
  | `DX` dx-architect | `API` (extended, opt-in) | Real only with a public API/SDK; removes DA/DX confusion |
  | `LEA` researcher | `RES` | Rename only |

- **UX role redesigned** (M4, evidence: the "Académico" case): taste mandate (owner of composition, density, hierarchy, elegance; qualitative vocabulary licensed), visual evidence rule (a design-quality verdict requires seeing the render — never start servers or open browsers by default; without a render, code conformity only, labeled as such), design participant (UI work consults UX before coding; trigger owned by the implementing agent — installed in the session baseline and `frontend-architect`).
- **Sticky prefix formalized** (M7): a versioned option of the activation protocol with canonical text owned by the `CREW` role — no longer free-text improvisation.
- **Docs restructured** (M7): roles-per-stage table lives only in `roles.md`; no hardcoded catalog counts in prose; `templates/AGENTS.md` no longer duplicates the quality numbers; canonical-language rule — Spanish is the source of truth, English the mirror updated in the same PR.
- **Models per role** (M6): `researcher` and `documentation-steward` run on sonnet (reconnaissance roles); judgment roles stay on opus.

## [0.20.0] — 2026-07-14

### Added

- **Customization guide for scaffolded docs** (`docs/en/using-crew.md` § "Customize the scaffolded docs", ES mirror in `docs/es/using-crew.md`). The plugin documented the scaffold (installer never overwrites) and the divergence mechanism (rule precedence, `DEVIATIONS.md` via `DOC` audit), but nothing told a project team HOW to customize its copies. The guide draws the line: **project surface** (placeholders, tool defaults such as the e2e tool in the stories template, project-specific sections, wording — edit your copy freely, no audit) vs. the **structural standard** (folder=nature taxonomy, lifecycle + `Status:` field, the Ready gate ≥1 test scenario, the hook-enforced estimation table, immutability, single source of truth — diverging requires a `DEVIATIONS.md` row via `DOC` audit). Includes the update story: plugin updates never touch scaffolded copies, template improvements do not arrive automatically, and the re-run `DOC` audit (or a manual merge) is the reconciliation path — no automated merge exists.
- **Point-of-use note in the stories template** (`templates/docs/stories/README.md` § Rules): Playwright is a scaffold default, not part of the standard — a project on a different e2e tool edits its own copy and keeps `AGENTS.md § Stack` in sync; the Ready gate is what is structural, never the tool.

### Changed

- Routing to the new guide: README documentation tables (EN root + `docs/es/README.md`) mention customization; the "Update the plugin" section of `installation.md` (EN/ES) now states that customizations survive updates and links the reconciliation path.

### Fixed

- **EN↔ES drift in `docs/es/README.md` § "Qué incluye".** The hooks bullet still described only the immutability guard (the estimation gate, code-quality ceilings, and the `Stop` closure check were missing) and the session-baseline bullet predated the 0.18.0 behavior-only trim. Both realigned with the root README.

## [0.19.1] — 2026-07-14

### Changed

- **Story anatomy now has a single canonical source.** `agents/functional-analyst.md` re-listed the story sections twice (Workflow step 3 and Deliverable format), and the Deliverable copy had already drifted from the template (`Dependencies` vs. `Depends on`; Estimation/Changes/Validation missing). Both spots now point to the project's `docs/stories/README.md` (scaffolded from `templates/docs/stories/README.md`) instead of reproducing the list — the template owns sections, lifecycle, and rules; agent docs reference it. Catalog rule going forward: an artifact's anatomy is enumerated once, in its scaffoldable template; role docs point to it. The craft-vocabulary line stays — it teaches how to speak, not the schema.

## [0.19.0] — 2026-07-13

### Added

- **Mandatory `Test scenarios` section in the story template**, authored by `FA` as input for `QA`'s end-to-end (Playwright) strategy. Stories carried acceptance criteria and abstract edge cases but nothing concrete for e2e testing. Each scenario is one runnable instance — a human-readable case name (never a Playwright identifier, since the analyst's user may be non-technical), low-level steps (user → screen → action → expected result), the real data it runs on, and the expected result. Distinct from `Edge cases` (which name conditions in the abstract); a `Test scenario` is a concrete instance that exercises them. Preserves the `FA`↔`QA` boundary: `FA` captures behavior in human terms, `QA` formalizes it into automated cases — the section is input to `QA`, not the test implementation. At least one scenario is now required to reach Ready.
- **Data-existence responsibility made explicit.** Each scenario names the concrete records it needs; the author is responsible for those records already existing in the database. No fixture/seed obligation is created for `QA` or the data roles.

### Changed

- Registered the new section across the anatomy repetitions: `agents/functional-analyst.md` (frontmatter description, Scope, Workflow, Authority boundary, Deliverable format, craft vocabulary — plus the behavior to *interview* the user for each scenario), `agents/qa-test-architect.md` (Authority and Role relationships now reflect consuming scenarios and formalizing them into e2e), `templates/docs/stories/README.md` (template block, Lifecycle, Rules), and both `templates/docs/guides/delivery-circuit.md` and `.es.md` (Analysis step, Ready gate). Enforcement kept in prose, not a hook: unlike the estimation table (structured, gated at the terminal Closed state), Ready is conferred by human PR approval a `PreToolUse` hook cannot observe, and scenario prose is not machine-checkable beyond a placeholder — a gate here would give false confidence at real maintenance cost.

## [0.18.0] — 2026-06-26

### Changed

- **Session baseline trimmed to behavior; process knowledge moved to pointers.** `standards/session-context.md` was inlining summaries of content that already lives in the project's scaffolded files (`standards/code-quality.md`, `docs/guides/delivery-circuit.md`) — paying that always-on token cost and diluting attention in every conversation, code-related or not. The baseline now carries only always-on behavior (conversation style, office rule, two modes, document craft) plus a one-block pointer to where delivery/estimation/history and code-quality rules live, read on demand. This makes the baseline consistent with the plugin's own principle ("conventions live in the repo, written once, read many").
- **Conversation style hardened.** The loophole "detail only when the conversation warrants it" let a technical topic license unrequested `file:line` dumps. Replaced with: default to a conceptual answer; code, file paths and `file:line` citations appear only when the user explicitly asks — a technical topic does not by itself license them.

### Added

- **Code-quality enforcement hook** (`hooks/guard-code-quality.js`, `PreToolUse` on `Edit|Write`). File-size ceilings from `standards/code-quality.md` were documented but never enforced — prose only. The hook denies an edit/write that would push a code file past its kind's line ceiling (component 150 / page 200 / hook 80 / service 150 / module 200 / test 250 / rust 300), pointing to a split. Kind detection is best-effort from path/name signals; ambiguous or non-code files fail open (allow). Only the deterministic line ceilings are enforced — function length, complexity and nesting stay with the doc and review, never faked in a hook.

## [0.17.0] — 2026-06-25

### Added

- New role **communications-strategist** (alias `COMM`, area Design & Experience): senior writing-and-communications lens that produces any written piece a target requires — brief, pitch deck, one-pager, essay, technical doc, speech, video script. Owns the craft of HOW a message is communicated (idea-force, narrative arc, audience segmentation, impact principles like the golden circle); never the domain content, which stays with the owning role. Boundary drawn against documentation-steward (repo doc structure), web-strategist (public marketing message), and commercial-strategist (manifesto authoring). Catalog grows from 24 to 25 roles; README/roles counts and alias table updated.

## [0.16.0] — 2026-06-24

### Changed

- **Dropped the Cursor coupling; `standards/` is now the canonical home for rules.** Cursor files are not read by Claude, yet the plugin wrongly named `.cursor/rules/*.mdc` as the canonical source. Removed `templates/.cursor/` entirely; the code-quality core moved to `templates/standards/code-quality.md`. `templates/AGENTS.md`, `standards/session-context.md`, and the `decisions`/`MAINTAINING` templates now point to `standards/`. Communication rules are self-canonical inside `AGENTS.md`; the redundant `general` ruleset was dropped. `bin/init-project.sh` scaffolds `standards/` instead of `.cursor/`.
- **Docs oriented to Claude Desktop.** `installation.md` (EN/ES) leads with the Desktop plugin manager and the two-command CLI (`claude plugin marketplace add` + `install`); the manual `settings.json` flow is demoted to "advanced", and the obsolete "not via `/plugin marketplace add`" warning is removed. Project bootstrap is now prompt-driven (`"set up the crew structure in this project"` → `crew-installer`) instead of a `bash init-project.sh` invocation.

## [0.15.0] — 2026-06-24

### Added

- **Bilingual documentation (EN/ES).** The plugin's own docs split by audience into `docs/en/` and `docs/es/`; the root `README.md` became a language picker. A Spanish translation of the delivery-circuit guide ships alongside the canonical English one.

### Changed

- **Why-first front door.** The README leads with the problem crew solves before any feature list (Golden Circle framing): a by-delivery-flow view of the catalog plus the by-area reference, role rows linked to their docs.
- **"Document craft" premise** added to the always-on `standards/session-context.md` baseline, so every authoring role serves its reader by default. Sharpened the WEB/DOC selection boundaries (README and developer docs are `documentation-steward` + `product-strategist`, never `web-strategist`). Added a plugin-removal section and a role-invocation explainer (slash command vs `ROLE:` prefix, global activation). Fixed a 23→24 role-count drift.

## [0.14.0] — 2026-06-24

### Added

- **`crew-installer` (`/crew:inst`)** — governance role that installs and activates the crew in a target chosen explicitly by the request. **Two scopes:** *project* injects the activation convention into the project's root `AGENTS.md` (scaffolding it from the template if absent, delegating to `bin/init-project.sh`); *global* injects the same convention as a delimited marked block into the user file `~/.claude/CLAUDE.md`, so the `ALIAS:` prefix works in every session without per-repo setup. The prefix (e.g. `SYS:`) makes the main agent *adopt* a role in the conversation — distinct from `/crew:<alias>`, which only *delegates* a one-shot task to a subagent. Scope is never inferred: the role asks before writing the user file. Idempotent — a re-run is a no-op, never a duplicate. Boundary: the installer *applies* the canonical activation form `crew-architect` owns and *lands* it into the chosen target; it never edits the plugin's shipped standard to change the convention for all consumers (that is `crew-architect` + `release-manager`), and judging the resulting documentation's coherence stays with `documentation-steward`.
- Catalog grows from 23 to 24 roles; README counts and alias table updated.

### Changed

- **Catalog organized by area.** The 24 roles are now grouped into six areas spanning the software development and management process — Business & Discovery, Product & Delivery, Design & Experience, Engineering & Architecture, Quality/Security & Operations, Governance & Meta. The `templates/AGENTS.md` alias table is split under per-area headings (source of truth for area assignment); the README gains a "Role catalog" index reflecting the same grouping. The informal "tier" wording in the README is reconciled to "area".

## [0.13.0] — 2026-06-20

Adds the business/discovery tier and a governance role, and reconciles the brief standard into a single narrative form.

### Added

- **`crew-architect` (`/crew:ca`)** — the meta-role that governs the catalog itself: evaluates whether a proposed role is justified (distinct + recurring authority, not an audience or a one-off), draws authority boundaries against adjacent roles, guards against overlap and over-design, and keeps role docs and plugin-wide standards consistent. The role to consult whenever the task is "change the plugin".
- **`commercial-strategist` (`/crew:com`)** — client-facing discovery: understands the client's real need, judges viability in business terms, separates worth-doing from wishful, and authors the project manifesto. The front door of a project, upstream of `product-strategist`.
- **`delivery-coordinator` (`/crew:coord`)** — coordinates the team "bubble": sequences which roles act when, surfaces and clears blockers, and protects the manifesto's intent through delivery. Coordination and sequencing only — never the technical, product, or release decisions.

### Changed

- **Briefs reframed as project manifestos.** The `docs/briefs/` standard moves from a strict bulleted 800-word sponsor-gate to **narrative prose, Why-first**, with a routing frontmatter block (`artifact`, `defined_by`, `audience`, `status`, `date`). A manifesto is a living draft during discovery and evolves by supersession after approval. Authored by `commercial-strategist` (client-facing) or `product-strategist` (internal product). `product-strategist`'s deliverable reference updated to match.
- Catalog grows from 20 to 23 roles; README counts and folder structure updated.

## [0.12.0] — 2026-06-19

### Changed

- Marketplace renamed `julio-crew` → `factory-crew`. **Breaking**: the install id changes from `crew@julio-crew` to `crew@factory-crew`. Consumers must update the `extraKnownMarketplaces` key and the `enabledPlugins` id in their `settings.json` and restart Claude Code.
- README rewrites the install guide as a dedicated "Installation" section: consumer flow (github source) vs author flow (directory source), copy-pasteable `settings.json` JSON with the exact keys, restart + verify step, and troubleshooting for the two field failure modes (wrong `marketplaces` key silently ignored; `directory` source not resolving for teammates).

### Fixed

- `marketplace.json` declared a stale plugin `version` (0.10.0); realigned to the package version.

## [0.11.1] — 2026-06-11

### Changed

- Work entry filenames standardize on dashes: `docs/work/YYYY-MM/YYYY-MM-DD-slug.md` (was `_slug`). Absorbed from rvd.ai, where ~550 historical entries already used the dash form; the Stop hook matched both all along.

## [0.11.0] — 2026-06-11

Lessons absorbed from the rvd.ai field audit: conventions without enforcement drift; audience and kind ambiguity creates parallel structures.

### Added

- `PreToolUse` hook `guard-estimation.js`: denies closing a story/requirement whose estimation table is missing rows or has empty Est. hours/Started/Finished/Actual hours; fails open.
- `Stop` hook `check-work-log.js`: when the project follows the standard (`docs/work/` exists) and there are commits today without a `docs/work/YYYY-MM/` entry dated today, blocks the stop once with a reminder; fails open.
- Kind-in-slug taxonomy: `NNN-bug-slug.md` (stories) and `NNN-audit-slug.md` (requirements) — filename is the taxonomy; no kind folders, no kind field. RFC-style ideas remain `proposals/`.
- Timestamp format for estimation tables: `YYYY-MM-DD HH:MM -ZZ:ZZ`, stamped from the clock (`date "+%Y-%m-%d %H:%M %z"`), never reconstructed.

### Changed

- `docs/guides/` scope clarified as builder/agent-facing only; end-user/product documentation is out of scope and gets its own location (e.g. `docs/product/`).
- Session baseline (`standards/session-context.md`) now states the ADR placement rule (status in header, no separate proposed folder), the kind-in-slug convention, and the timestamp format.

## [0.10.0] — 2026-06-10

### Added

- `docs/briefs/` layer: executive decision requests — the gate between idea and backlog for initiatives needing a non-technical sponsor's approval (CEO/CTO/client). Hard cap 800 words, one explicit ask, immutable after decision, sponsor declared in the ownership map. Wired into the delivery circuit as step 0 (sponsor gate), the taxonomy, the bootstrap script, and product-strategist's canonical deliverables.

### Changed

- All 20 agent `description` fields rewritten as delegation triggers (use-when + owns + boundary with sibling roles) so the main agent auto-delegates consistently.

## [0.9.0] — 2026-06-10

First publishable version.

### Added

- 20 role subagents (`agents/`) + 20 `/crew:<alias>` slash commands, conversational by default; deliverables only on explicit request. Caps per role: exact scope, short format, max 2 open questions, jargon glossing, token economy, no premature handoffs, consult-don't-defer.
- `functional-analyst` role (`/crew:fa`): requirements → stories with acceptance criteria → functional validation.
- Full `docs/` taxonomy templates: `stories/`, `requirements/`, `decisions/` (state-in-file, no pending folder), `proposals/`, `guides/delivery-circuit.md`, `work/` (evidence-never-truth contract), `DEVIATIONS.md`.
- Delivery circuit standard with chaining policy and role ownership map.
- Mandatory estimation tables (milestones, estimated vs. actual hours) embedded in work items.
- `SessionStart` hook: injects `standards/session-context.md` baseline into every session.
- `PreToolUse` hook: denies edits to existing `docs/work/` entries and Closed work items; fails open.
- Universal code-quality core (`templates/.cursor/rules/code-quality.mdc`) as suggestive defaults; project rules take precedence.
- Interop contract: `AGENTS.md` (open standard) as canonical agent context; `CLAUDE.md` as `@AGENTS.md` pointer.
- Documentation-steward audit protocol for onboarding existing projects (findings → owner decides → DEVIATIONS + precedence written into AGENTS.md).
- Roles inherit all tools (search/edit code) gated by specs-before-code; `researcher` stays read-only.
