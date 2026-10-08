# Configuration — `crew.json`

`crew.json` is the project's policy file for the crew guards: one small JSON file at the project root that decides which rules are enforced and how hard. Every value in it is explicit — the file *is* the policy, visible and versioned with the code. When a guard blocks you and you want to know why, this page tells you which field it obeyed; the deny messages themselves are catalogued in [enforcement.md](enforcement.md).

## How guards find it

Every guard resolves the config by walking **up** from the directory of the file being edited (or from the session's working directory, as a fallback), looking for `crew.json`, up to 30 levels or the filesystem root. The first `crew.json` found wins. This means a monorepo can carry one `crew.json` per project and each edit is governed by the nearest one above it. Reader: [`../../hooks/lib/config.js`](../../hooks/lib/config.js).

## The legacy rule — no `crew.json`

**With no `crew.json` (or one with invalid JSON), the guards that existed in v0.19.1 behave exactly as they did then.** The reader returns nothing and every guard falls back to its pre-config behavior. Guards added later (shape, shell, policy) only notify; the [matrix](#behavior-matrix--guard--config) has the detail:

- `docs/work/` entries and Closed work items: immutable.
- Estimation gate at closure: active.
- Timestamps guard: **off** (it only exists when `"metrics": true`).
- Code quality: **enforce** — writes over the ceiling are denied.
- Work-log Stop hook: active wherever `docs/work/` exists.

Two consequences. First, the plugin has **no hidden defaults**: the friendlier values new projects get (`advise`, metrics on) exist only because the scaffold ([`../../scripts/init-project.js`](../../scripts/init-project.js)) writes them explicitly into the project's `crew.json`. Second, a `crew.json` with a JSON syntax error behaves like no file at all — which silently turns `"quality": "advise"` back into enforce. If a guard suddenly got stricter, check the JSON parses.

## Field reference

| Field | Values | Default when absent | What it controls |
|---|---|---|---|
| `mode` | `"team"` \| `"solo"` | `"team"` | Whether the full delivery-circuit ceremony applies. Anything other than the exact string `"solo"` counts as team. |
| `metrics` | `true` \| `false` | `false` | The estimation-timestamps discipline. Only the literal `true` activates it. |
| `quality` | `"advise"` \| `"enforce"` \| `"off"` | `"enforce"` | What the write-time code-quality guard does on a ceiling violation. Unknown values fall back to `"enforce"`. |
| `ceilings` | object `{ kind: lines }` | `{}` | Per-kind overrides of the file-size line ceilings. Non-object values fall back to `{}`. |
| `configuredWith` | version string | `null` | State data: which plugin version last configured this project. No behavior uses it to decide; see [The marker](#the-marker-configuredwith). |
| `design` | object | `null` | What this project *can do* for interface work. Nothing is granted by default; see [Design capabilities](#design-capabilities). |
| `testing` | object (`guide`, `e2e`, `commands`, `receipts`) | `null` | What this project can verify, and with what. Declaring it turns the verification table into a closure gate; see [Testing capabilities](#testing-capabilities). |
| `audit` | `true` \| `false` | `false` | Log of guard decisions in `.crew/audit.log`, team mode only; see [Audit trail](#audit-trail-audit). |
| `telemetry` | `false` | no effect | Can only forbid catalog usage recording for the whole team. Each person turns it on locally; see [Catalog usage](#catalog-usage-telemetry). |
| `factory` | object (`projectId`, `environment`, `url`, `web`, `capture`) | `null` | Tasks, estimates and work time live in factory; see [Factory mode](#factory-mode). |

Absent fields normalize to the legacy-equivalent value in the third column — a `crew.json` containing only `{"mode": "solo"}` is valid and means solo, no metrics, quality enforce, default ceilings.

### Evolution invariants

The reader is the single authorized interpreter of this file, and it is bound by five rules. They are what let you keep an old `crew.json` indefinitely without reading a migration guide:

1. **An existing key never changes meaning.** New meaning ships as a new key.
2. **New fields are optional, and no default grants a capability.** A default that let an agent start a server or claim a verdict would be the plugin authorizing itself.
3. **During a migration the reader accepts the old and the new shape for one minor version**; retiring the old shape is a mandatory changelog entry.
4. **There is no per-section version.** Evolution is additive by construction: an absent field equals the previous behavior. A genuinely global break would need a version for the whole file, never for one section.
5. **No field is honored by a role if the reader does not transport it.** One interpretation of the contract, never two — which is why an unknown value is treated as absent and *named*, never silently accepted.

### `mode`

`team` assumes the full crew circuit: stories/requirements are contracts, Closed items are history, sessions leave a work-log trace. `solo` keeps the cheap always-valuable pieces (immutable `docs/work/` entries, the quality gate) and drops the team ceremony: Closed items stay editable, no Stop-hook reminder, and the estimation gate applies only if you opted into metrics.

### `metrics`

When `true`, two things activate: the estimation gate applies even in solo mode, and the [timestamps guard](enforcement.md#timestamps) starts validating that `Started`/`Finished` cells are written **in real time** (correct format, within 15 minutes of the machine clock, consistent with each other). This is the discipline that makes [/crew:metrics](metrics.md) trustworthy. When `false` or absent, the timestamps guard is completely silent.

### `quality`

Controls the **write-time** guard only ([`../../hooks/guard-code-quality.js`](../../hooks/guard-code-quality.js)):

| Mode | At write time (agent Edit/Write) | At commit time (pre-commit gate) |
|---|---|---|
| `advise` | Write proceeds; the agent sees a visible notice | Blocks the commit |
| `enforce` | Write is denied | Blocks the commit |
| `off` | Silent | Still blocks — the gate is managed separately |

`advise` is what the scaffold writes for new projects: the agent keeps momentum and the hard stop is the commit. Note that the pre-commit gate ([`../../scripts/check-quality.sh`](../../scripts/check-quality.sh)) does **not** read `quality` at all — turning quality `off` silences the hook and leaves the gate active. To remove the gate, delete its line from `.git/hooks/pre-commit`.

### `ceilings`

The line ceilings by file kind, and how a file's kind is detected (first match wins):

| Kind | Default ceiling | Detected when |
|---|---|---|
| `test` | 250 | `.test.`/`.spec.` in the name, or under `__tests__/`, `test/`, `tests/` |
| `rust` | 300 | `.rs` extension |
| `hook` | 80 | `.ts`/`.tsx` named `use-*` or `useXxx` (React-style hooks) |
| `page` | 200 | under `pages/` or `routes/`, or `.page.`/`.route.` in the name |
| `service` | 150 | under `services/` or `stores/`, or `.service.`/`.store.`/`.slice.` in the name |
| `component` | 150 | `.tsx`/`.jsx` whose name starts with a capital letter |
| `module` | 200 | everything else (the default kind) |

Only code files are checked (`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.rs`, `.py`, `.go`, `.java`, `.rb`, `.php`, `.cs`, `.kt`, `.swift`, `.vue`, `.svelte`, …). `"ceilings"` overrides the number per kind; kind detection stays the same. Both the write-time guard and the pre-commit gate honor the same overrides, and both honor [pre-registered exemptions](enforcement.md#exemptions) in `docs/DEVIATIONS.md`. Logic: [`../../hooks/lib/ceilings.js`](../../hooks/lib/ceilings.js).

## Design capabilities

Interface work is where an agent can most easily sound confident about something it never checked. The `design` section closes that gap by declaring what this project can actually do — and the rule that makes it worth filling in is the same in every row: **what you do not declare is not assumed, and the role says so out loud.**

Read the third column first. It is the one that tells you what a missing declaration costs you.

| What you declare | What it enables | What happens if you don't |
|---|---|---|
| `memory` — folder holding this product's references, approved and rejected patterns | Proposals are contrasted against what *this* product considers good | Every deliverable carries *"no design memory declared: the direction was not contrasted against the product's references"* |
| `baseline` — the fallback taste for what your memory does not answer: a skill to load, or a document to read | Questions your memory is silent on fall back to a standard **you** named | The deliverable says the direction rests on the brief alone; the plugin never substitutes taste of its own |
| `sources` — the design file or reference screenshots that are the source of truth | Direction can be derived from the design source | Direction comes from the brief and the registry only |
| `registry` — where someone looks to see whether a component already exists | Reuse is verified before anything new is proposed | Every proposal carries *"reuse not verified"*, and new components are marked *unconfirmed new* |
| `runtime.url` — the URL the app runs on in development | An agent connects and inspects **without asking you every time** | You are asked for permission each turn |
| `runtime.launch` — the launch profile that starts the app | An agent starts the app itself when the URL does not answer | You are asked, or you start it yourself |
| `capture` — how renders are captured, and which form factors are in scope | A verdict on **visual quality** becomes possible | Only code conformity, labeled as such — never a quality judgment |
| `checks` — commands that measure accessibility or performance | Those claims are stated as **measured** | They are stated as reasoned, labeled not measured |

### Full shape

```json
{
  "design": {
    "memory": "docs/design",
    "baseline": { "kind": "skill", "ref": "frontend-design" },
    "sources":  [ { "kind": "figma", "ref": "https://…" } ],
    "registry": { "kind": "storybook", "ref": "http://localhost:6006" },
    "runtime":  { "url": "http://localhost:3000", "launch": ".claude/launch.json#dev" },
    "capture":  { "kind": "browser", "viewports": ["desktop", "mobile"], "out": "docs/design/.evidence" },
    "checks":   [ { "kind": "a11y", "cmd": "npm run a11y" } ]
  }
}
```

Every key is optional and independent. `{"design": {"memory": "docs/design"}}` is a complete, valid declaration.

**Two separate permissions.** `runtime.url` and `runtime.launch` are separate on purpose: connecting to something already running is inspection; running a launch profile executes a command on your machine. Declaring `runtime` grants neither on its own — each key grants only itself. Precedence is url first (the server is usually already running outside the session, and duplicating it is waste); a launch profile runs only when the URL does not answer. Whatever an agent starts, it stops.

**Declaring is the permission.** This is the point of the section: you grant it once, in a file you can read and revert, instead of approving the same action every session.

**Memory outranks baseline.** They are not two opinions. `memory` is what is good in *this* product; `baseline` is only consulted where the memory says nothing, and it loses every conflict without discussion. A baseline is worth declaring when your design memory is young: it stops the honest-but-generic output you get from a role that has nothing to contrast against. Point it at whatever you trust — an installed skill, your own design-system document, a public design system's docs.

**Closed vs free values.** `registry.kind` (`storybook` | `doc` | `none`), `capture.kind` (`browser` | `playwright`) and `baseline.kind` (`skill` | `doc`) are closed, because a role has to know *how* to consume them — loading a skill and reading a document are different actions. A `baseline` without a `ref` is treated as undeclared and named at session start. Everything else is a free label — `viewports`, `checks.kind`, `sources.kind` — because your product chooses its form factors and tooling. There is no default viewport set: a kiosk or a desktop-only tool is not an oversight.

**Unrecognized values are named.** A `kind` this plugin version does not know is treated as if the capability were absent, and the session start says so. It never blocks anything.

### Evidence receipts

When renders are captured, they can be accompanied by a receipt so a reviewer — human or `qa-test-architect` — can tell what was actually looked at:

```json
{ "workItem": "docs/stories/0042-request-list.md",
  "tree": "dirty",
  "generatedAt": "2026-08-02T14:20:00-03:00",
  "shots": [ { "viewport": "desktop", "state": "empty", "path": "docs/design/.evidence/list-desktop-empty.png" } ] }
```

It is anchored to the work item and the tree state, because captures happen before committing. What matters is **which states** were captured; the number of images says nothing.

It is informative: no gate requires it. A receipt an agent writes about its own work proves images exist; whether anyone looked at them stays unproven. For the same reason, reconstructed timestamps are checked by another guard. Its value is making the evidence reviewable.

## Testing capabilities

The same rule as `design`, applied to the other place an agent sounds confident about something it never checked: **what you do not declare is not assumed.** The section answers one question a plan cannot dodge — for each behavior, at what level is it verified, with what, and what does that cost.

| What you declare | What it enables | What happens if you don't |
|---|---|---|
| `guide` — the document stating what this project tests, at what levels, with what bar | Plans are contrasted against an established strategy | *"the project declares no testing strategy: the levels are proposed, not established"* |
| `e2e` — the end-to-end harness and where its specs live | A plan **specifies the spec**: harness, path, and the hours to write it | A scenario stays a walkthrough; the plan names the missing harness as a cost to estimate |
| `commands` — the commands that run the suites | Suite status is reported as **run** | Pass/fail is reported as claimed, never as observed |

```json
{
  "testing": {
    "guide": "docs/guides/testing.md",
    "e2e": { "kind": "playwright", "specs": "tests/e2e" },
    "commands": [ { "kind": "e2e", "cmd": "npm run test:e2e" } ]
  }
}
```

**`e2e.kind` is a free label.** Unlike `registry.kind` or `baseline.kind`, nothing here is a closed enum: whatever the harness is called, the action a role takes is the same — write the scenario as a spec under `specs`. Cataloguing test tools would be this plugin choosing your stack. `specs` is what makes the declaration usable; an `e2e` without it is treated as undeclared and named at session start.

**Declaring turns the verification table into a gate.** With `testing` present in any form, a story or requirement cannot reach `Closed` without a `## Verification` table — one row per behavior: scenario, level, harness, artifact, status. This holds in **both** modes, including solo, and it is independent of `metrics`: the estimation gate is the metrics discipline, this one is your own declaration. `not verified — no harness` is a perfectly valid row; an absent table is not, because silence reads exactly like coverage.

**`receipts: true` makes a pass checkable.** Opt-in, because an absent field keeps the previous behavior. With it, a `passing` verification row closes only when it cites a receipt written by `/crew:check` (`scripts/verify.js` runs the declared `commands` and records exit code, times, git HEAD and output tail, hashed so it cannot be edited unnoticed). Without `commands`, receipts cannot exist, so declare both.

**What the standard never mandates.** A specific tool. A plan that requires Playwright in a repo that never adopted it produces specs that never run and a table that reads covered while nothing executes. Declare the harness once, here, and every role derives from it.

## Audit trail: `audit`

`"audit": true` (team mode only, opt-in) makes the shell and policy guards append one JSON line per decision to `.crew/audit.log`: when, which guard, deny or notice, and which rule fired. It never records the command, the file content or any matched value. Keep `.crew/audit.log` out of version control unless the team decides otherwise.

## Catalog usage: `telemetry`

Catalog usage — which roles, skills and commands get used — is recorded **only for a person who opts in**, in `.crew/local.json` (`{"telemetry": true}`, never versioned) or with `CREW_TELEMETRY=1`. The shared `crew.json` cannot switch it on for teammates; `"telemetry": false` there forbids it for everyone. Each event is one line in `.crew/usage.jsonl`: the date (no time of day), the kind, and a catalog name — anything else is stored as `other`, so no prompt text can land in it. Lines older than 90 days are dropped, `.crew/.gitignore` keeps the file out of the repository, and `/crew:doctor` blocks if it was committed anyway. `/crew:metrics catalog` reports it; `--purge` deletes it.

## Factory mode

A project whose activities and work time are managed in factory declares it with one block:

```json
{
  "factory": {
    "projectId": "3f0c9a52-…",
    "environment": "prod",
    "capture": true
  }
}
```

| Key | Required | Default | Meaning |
|---|---|---|---|
| `projectId` | yes | — | The factory project this repository works for. A block without it is incomplete: session start names it, and everything behaves as if the block were absent. |
| `environment` | no | `prod` | Which factory: `prod` (`https://api.factory.balearesgroup.com/api/v1`) or `dev` (`https://api.dev.factory.balearesgroup.com/api/v1`). An unknown name falls back to `prod`, and session start says so. |
| `url` | no | — | A full API base for any other host (a local factory, for instance). It takes the place of `environment`. |
| `web` | no | — | The web base where people approve `/crew:factory login`, when `url` points somewhere without a known web address. |
| `capture` | no | `true` | Whether the activity hooks record work time for this project. `false` pauses capture for everyone working in the repository. |

A person can point their own machine elsewhere without editing the shared file: `CREW_FACTORY_ENV` (`prod` or `dev`) or `CREW_FACTORY_URL` (a full API base), plus `CREW_FACTORY_WEB_URL` for the web. Machine variables win over `crew.json`.

**What changes when the block is present.** The story or requirement keeps the spec and the criteria. The task (estimate, state, time) lives in factory and is linked from the work item by a `**Factory activity:** <uuid>` header line (`**Factory task:**` is accepted too). The estimation gate asks for that header in place of an `## Estimation` table, the timestamps guard stands down because the capture hooks keep the clock, and `/crew:metrics` reads the backlog from factory. Details in [enforcement.md](enforcement.md#factory-mode) and [metrics.md](metrics.md#factory-mode).

**The token is personal and stays out of the repository.** Each person connects their machine with `/crew:factory login` ([factory.md](factory.md#setting-it-up)), which stores the token in `~/.crew/factory-token`, readable only by them. The `FACTORY_TOKEN` environment variable takes precedence when set. `crew.json` is versioned and shared, so it has no token field.

**Pausing capture.** Any one of three switches is enough: `CREW_CAPTURE=off` in your environment (you, on this machine), `"capture": false` (the whole project), or no token at all. Paused capture writes nothing, local state included.

**Capture and catalog usage are separate.** Capture records work time (start and end of each human or agent interval) in `~/.crew/activity/` on each machine and sends it to factory. Catalog usage (`telemetry`) stays in this repository's `.crew/usage.jsonl`, out of version control, and crew sends it nowhere. Each one has its own switch, and changing one leaves the other as it was.

The circuit as the people using it see it (what is captured, how to create the token, how to connect the MCP server, the weekly review) is in [factory.md](factory.md).

## The marker: `configuredWith`

One line recording which plugin version last configured this project. It is state data: no behavior reads it. Delete it and the only thing you lose is the notice.

At session start:

| Situation | What you see |
|---|---|
| No `crew.json` | Nothing. Legacy behavior, exactly as before |
| Marker absent | One line: this project predates the marker; `/crew:setup` shows what can be declared |
| A **required** migration landed after the marked version | One line naming it and where to read about it |
| An optional capability you simply don't use | **Nothing, ever.** A project with no interface is not behind |
| A `kind` the plugin doesn't recognize | One line naming it |

The notice closes when the marker is updated — including when your answer is "I've seen it and I want none of it", which still updates the marker. There is no separate mute switch, because there is nothing to mute once the state is acknowledged.

Which versions count as required is declared explicitly in the plugin's `migrations.json` when a version is published — never inferred from the changelog. If the evolution invariants above are respected, this notice will almost never fire, and that silence is the expected behavior.

## Configuring: `/crew:setup`

`/crew:setup` runs the configuration interview. It reads your repo first, asks at most two questions per turn, shows exactly what it will write, writes only what you confirmed, and updates the marker. It never guesses a capability you could confirm in one line, and it never writes content into your design memory: your references and rejected patterns express your taste, and only you write them.

Saying "nothing, thanks" is a complete and valid outcome.

The question set it follows is fixed and versioned in the plugin (`standards/configuration-interview.md`), so a setup run is the same conversation every time instead of an improvisation.

## Behavior matrix — guard × config

| Guard | Reads | `team` | `solo` | No `crew.json` (v0.19.1) |
|---|---|---|---|---|
| `docs/work/` entries immutable ([guard-immutable](../../hooks/guard-immutable.js)) | nothing | immutable | immutable | immutable |
| Closed stories/requirements immutable (guard-immutable) | `mode` | immutable | **editable** | immutable |
| Estimation complete at closure ([guard-estimation](../../hooks/guard-estimation.js)) | `mode`, `metrics` | always active | only when `metrics: true` | active |
| Verification table at closure (guard-estimation) | `testing` | when `testing` is declared | when `testing` is declared | off |
| Real-time timestamps ([guard-timestamps](../../hooks/guard-timestamps.js)) | `metrics` | when `metrics: true` | when `metrics: true` | off |
| File-size ceilings at write ([guard-code-quality](../../hooks/guard-code-quality.js)) | `quality`, `ceilings` | per `quality` mode | per `quality` mode | enforce |
| Work-item shape at every write ([guard-shape](../../hooks/guard-shape.js)) | `quality`, `mode`, `docs/DEVIATIONS.md` | deny under `enforce`, notice under `advise` | notice | notice |
| Hook bypass in shell commands ([guard-shell](../../hooks/guard-shell.js)) | presence of `crew.json` | deny (fails closed) | deny (fails closed) | notice |
| Relaxing `crew.json` or host settings ([guard-policy](../../hooks/guard-policy.js)) | `quality`, `mode`, `crew:policy` block | deny under `enforce`, notice under `advise` | notice | notice |
| Scope notice after writes ([nudge-scope](../../hooks/nudge-scope.js)) | `mode`, the active item's `Size:` | notice | off | notice |
| Work-log reminder on Stop ([check-work-log](../../hooks/check-work-log.js)) | `mode` | active where `docs/work/` exists | off | active where `docs/work/` exists |
| Pre-commit quality gate ([check-staged.js](../../scripts/check-staged.js)) | `ceilings` | always, once installed | always, once installed | always, once installed |
| `/crew:metrics` report ([metrics.js](../../scripts/metrics.js)) | `factory` | runs | runs | runs |
| Activity capture ([capture-activity](../../hooks/capture-activity.js)) | `factory` | only in factory mode, with a token | only in factory mode, with a token | off |

The metrics row is the pattern to remember: **the report runs anywhere; only the discipline is gated** by `metrics: true`. Details in [metrics.md](metrics.md).

**Factory mode overrides three rows**, in either mode: the estimation gate asks for the `**Factory activity:**` header in place of the table, the timestamps guard is off, and the metrics report reads factory's backlog. Verification, immutability, quality and the work-log reminder are unchanged.

## How `init-project.sh` writes it

`bash <plugin>/scripts/init-project.sh` (from your project root) scaffolds the crew structure and writes `crew.json` with **every value explicit**. The `.sh` wraps `scripts/init-project.js`, which can also be run with `node`; `--dry-run` shows what it would write without writing, and every file written is recorded in `.crew/install-state.json` for `/crew:doctor`:

```json
{
  "mode": "team",
  "metrics": true,
  "quality": "advise",
  "ceilings": {},
  "configuredWith": "<current plugin version>",
  "design": {
    "memory": "docs/design"
  },
  "testing": {
    "guide": "docs/guides/testing.md"
  }
}
```

Two capabilities are seeded, and only because the scaffold creates the file each one points at: `design.memory` and `testing.guide`. Everything else — where the app runs, the component registry, render capture, which e2e harness — is left undeclared on purpose: the scaffold never guesses a capability, least of all a tool. `/crew:setup` asks.

Seeding `testing` has one consequence worth knowing up front: it turns the work item's verification table into a closure gate from day one. That is the intent for a project starting today; delete the section to opt out.

With `--solo` it writes `"mode": "solo"` (same other values) and scaffolds only the minimal structure: `AGENTS.md`, `CLAUDE.md`, `standards/`, `docs/decisions/`, `docs/work/`, `docs/design/`, `docs/guides/testing.md` — no stories/requirements/briefs taxonomy. Design memory and the testing guide ship in both modes: a developer working alone builds interface and verifies work too. In both modes it also installs the quality gate as `.git/hooks/pre-commit`: if a pre-commit hook already exists, the gate line is **appended**, never overwriting; if it already runs `check-quality.sh`, it is left alone; if there is no `.git`, it tells you to `git init` and re-run. Existing files — including an existing `crew.json` — are never overwritten.

## Worked examples

**Team default** — what the scaffold writes. Full ceremony, metrics discipline on, quality advisory at write with the hard stop at commit:

```json
{ "mode": "team", "metrics": true, "quality": "advise", "ceilings": {} }
```

**Solo with metrics** — you work alone but want honest numbers. Closed items stay editable and no work-log reminder, but the estimation table and real-time timestamps are enforced:

```json
{ "mode": "solo", "metrics": true, "quality": "advise", "ceilings": {} }
```

**Solo without ceremony** — the minimum. Only `docs/work/` immutability remains (and the pre-commit gate, if installed):

```json
{ "mode": "solo", "metrics": false, "quality": "off", "ceilings": {} }
```

**Ceilings override** — your components legitimately run larger and your test files longer:

```json
{ "mode": "team", "metrics": true, "quality": "advise",
  "ceilings": { "component": 250, "test": 400 } }
```

For one-off large files (generated code, flat data), [pre-register an exemption](enforcement.md#exemptions) for that path and leave the kind's ceiling as it is.
