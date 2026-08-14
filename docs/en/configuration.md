# Configuration — `crew.json`

`crew.json` is the project's policy file for the crew guards: one small JSON file at the project root that decides which rules are enforced and how hard. Every value in it is explicit — the file *is* the policy, visible and versioned with the code. When a guard blocks you and you want to know why, this page tells you which field it obeyed; the deny messages themselves are catalogued in [enforcement.md](enforcement.md).

## How guards find it

Every guard resolves the config by walking **up** from the directory of the file being edited (or from the session's working directory, as a fallback), looking for `crew.json`, up to 30 levels or the filesystem root. The first `crew.json` found wins. This means a monorepo can carry one `crew.json` per project and each edit is governed by the nearest one above it. Reader: [`../../hooks/lib/config.js`](../../hooks/lib/config.js).

## The legacy rule — no `crew.json`

**No `crew.json` (or one with invalid JSON) means exact v0.19.1 behavior.** The reader returns nothing and every guard falls back to its pre-config behavior:

- `docs/work/` entries and Closed work items: immutable.
- Estimation gate at closure: active.
- Timestamps guard: **off** (it only exists when `"metrics": true`).
- Code quality: **enforce** — writes over the ceiling are denied.
- Work-log Stop hook: active wherever `docs/work/` exists.

Two consequences worth internalizing. First, the plugin has **no hidden defaults**: the friendlier values new projects get (`advise`, metrics on) are not built in — they exist only because [`../../bin/init-project.sh`](../../bin/init-project.sh) writes them explicitly into the scaffolded `crew.json`. Second, a `crew.json` with a JSON syntax error behaves like no file at all — which silently turns `"quality": "advise"` back into enforce. If a guard suddenly got stricter, check the JSON parses.

## Field reference

| Field | Values | Default when absent | What it controls |
|---|---|---|---|
| `mode` | `"team"` \| `"solo"` | `"team"` | Whether the full delivery-circuit ceremony applies. Anything other than the exact string `"solo"` counts as team. |
| `metrics` | `true` \| `false` | `false` | The estimation-timestamps discipline. Only the literal `true` activates it. |
| `quality` | `"advise"` \| `"enforce"` \| `"off"` | `"enforce"` | What the write-time code-quality guard does on a ceiling violation. Unknown values fall back to `"enforce"`. |
| `ceilings` | object `{ kind: lines }` | `{}` | Per-kind overrides of the file-size line ceilings. Non-object values fall back to `{}`. |
| `configuredWith` | version string | `null` | **State, not policy**: which plugin version last configured this project. Nobody interprets it to decide behavior — see [The marker](#the-marker-configuredwith). |
| `design` | object | `null` | What this project *can do* for interface work. Nothing is granted by default — see [Design capabilities](#design-capabilities). |

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

`advise` is what the scaffold writes for new projects: the agent keeps momentum and the hard stop is the commit. Note that the pre-commit gate ([`../../bin/check-quality.sh`](../../bin/check-quality.sh)) does **not** read `quality` at all — turning quality `off` silences the hook, not the gate. To remove the gate, delete its line from `.git/hooks/pre-commit`.

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

Only code files are checked (`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.rs`, `.py`, `.go`, `.java`, `.rb`, `.php`, `.cs`, `.kt`, `.swift`, `.vue`, `.svelte`, …). `"ceilings"` overrides the number per kind — it does not change kind detection. Both the write-time guard and the pre-commit gate honor the same overrides, and both honor [pre-registered exemptions](enforcement.md#exemptions) in `docs/DEVIATIONS.md`. Logic: [`../../hooks/lib/ceilings.js`](../../hooks/lib/ceilings.js).

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

**Two permissions, not one.** `runtime.url` and `runtime.launch` are separate on purpose: connecting to something already running is inspection; running a launch profile executes a command on your machine. Declaring `runtime` grants neither on its own — each key grants only itself. Precedence is url first (the server is usually already running outside the session, and duplicating it is waste); a launch profile runs only when the URL does not answer. Whatever an agent starts, it stops.

**Declaring is the permission.** This is the point of the section: you grant it once, in a file you can read and revert, instead of approving the same action every session.

**Memory outranks baseline.** They are not two opinions. `memory` is what is good in *this* product; `baseline` is only consulted where the memory says nothing, and it loses every conflict without discussion. A baseline is worth declaring when your design memory is young: it stops the honest-but-generic output you get from a role that has nothing to contrast against. Point it at whatever you trust — an installed skill, your own design-system document, a public design system's docs.

**Closed vs free values.** `registry.kind` (`storybook` | `doc` | `none`), `capture.kind` (`browser` | `playwright`) and `baseline.kind` (`skill` | `doc`) are closed, because a role has to know *how* to consume them — loading a skill and reading a document are different actions. A `baseline` without a `ref` is treated as undeclared and named at session start. Everything else is a free label — `viewports`, `checks.kind`, `sources.kind` — because form factors and tooling belong to your product, not to this plugin. There is no default viewport set: a kiosk or a desktop-only tool is not an oversight.

**Unrecognized values are named, not swallowed.** A `kind` this plugin version does not know is treated as if the capability were absent, and the session start says so. It never blocks anything.

### Evidence receipts

When renders are captured, they can be accompanied by a receipt so a reviewer — human or `qa-test-architect` — can tell what was actually looked at:

```json
{ "workItem": "docs/stories/0042-request-list.md",
  "tree": "dirty",
  "generatedAt": "2026-08-02T14:20:00-03:00",
  "shots": [ { "viewport": "desktop", "state": "empty", "path": "docs/design/.evidence/list-desktop-empty.png" } ] }
```

Anchored to the work item and the tree state, not to a commit — captures happen before committing. What matters is **which states** were captured, not how many images exist.

Deliberately **not** a gate. A receipt an agent writes about its own work proves images exist, not that anyone looked at them — the same reason reconstructed timestamps are guarded elsewhere. Its value is making the evidence reviewable, and it is not sold as proof.

## The marker: `configuredWith`

One line recording which plugin version last configured this project. It is **state, not policy**: no behavior reads it. Delete it and the only thing you lose is the notice.

At session start:

| Situation | What you see |
|---|---|
| No `crew.json` | Nothing. Legacy behavior, exactly as before |
| Marker absent | One line: this project predates the marker; `/crew:setup` shows what can be declared |
| A **required** migration landed after the marked version | One line naming it and where to read about it |
| An optional capability you simply don't use | **Nothing, ever.** A project with no interface is not behind |
| A `kind` the plugin doesn't recognize | One line naming it |

The notice closes when the marker is updated — including when your answer is "I've seen it and I want none of it", which still updates the marker. There is no separate mute switch, because there is nothing to mute once the state is acknowledged.

Which versions count as required is declared explicitly in the plugin's `migrations.json` when a version is published — never inferred from the changelog. If the evolution invariants above are respected, this notice will almost never fire. That is the mechanism working, not a defect.

## Configuring: `/crew:setup`

`/crew:setup` runs the configuration interview. It reads your repo first, asks at most two questions per turn, shows exactly what it will write, writes only what you confirmed, and updates the marker. It never guesses a capability you could confirm in one line, and it never writes content into your design memory — your references and rejected patterns are your taste, not an agent's.

Saying "nothing, thanks" is a complete and valid outcome.

The question set it follows is fixed and versioned in the plugin (`standards/configuration-interview.md`), so a setup run is the same conversation every time instead of an improvisation.

## Behavior matrix — guard × config

| Guard | Reads | `team` | `solo` | No `crew.json` (v0.19.1) |
|---|---|---|---|---|
| `docs/work/` entries immutable ([guard-immutable](../../hooks/guard-immutable.js)) | nothing | immutable | immutable | immutable |
| Closed stories/requirements immutable (guard-immutable) | `mode` | immutable | **editable** | immutable |
| Estimation complete at closure ([guard-estimation](../../hooks/guard-estimation.js)) | `mode`, `metrics` | always active | only when `metrics: true` | active |
| Real-time timestamps ([guard-timestamps](../../hooks/guard-timestamps.js)) | `metrics` | when `metrics: true` | when `metrics: true` | off |
| File-size ceilings at write ([guard-code-quality](../../hooks/guard-code-quality.js)) | `quality`, `ceilings` | per `quality` mode | per `quality` mode | enforce |
| Work-log reminder on Stop ([check-work-log](../../hooks/check-work-log.js)) | `mode` | active where `docs/work/` exists | off | active where `docs/work/` exists |
| Pre-commit quality gate ([check-staged.js](../../bin/check-staged.js)) | `ceilings` | always, once installed | always, once installed | always, once installed |
| `/crew:metrics` report ([metrics.js](../../bin/metrics.js)) | nothing | runs | runs | runs |

The last row is the pattern to remember: **the report runs anywhere; only the discipline is gated** by `metrics: true`. Details in [metrics.md](metrics.md).

## How `init-project.sh` writes it

`bash <plugin>/bin/init-project.sh` (from your project root) scaffolds the crew structure and writes `crew.json` with **every value explicit**:

```json
{
  "mode": "team",
  "metrics": true,
  "quality": "advise",
  "ceilings": {},
  "configuredWith": "<current plugin version>",
  "design": {
    "memory": "docs/design"
  }
}
```

`design.memory` is the only capability seeded, because the scaffold creates the folder it points at. Everything else — where the app runs, the component registry, render capture — is left undeclared on purpose: the scaffold never guesses a capability. `/crew:setup` asks.

With `--solo` it writes `"mode": "solo"` (same other values) and scaffolds only the minimal structure: `AGENTS.md`, `CLAUDE.md`, `standards/`, `docs/decisions/`, `docs/work/`, `docs/design/` — no stories/requirements/briefs taxonomy. Design memory ships in both modes: a developer working alone builds interface too. In both modes it also installs the quality gate as `.git/hooks/pre-commit`: if a pre-commit hook already exists, the gate line is **appended**, never overwriting; if it already runs `check-quality.sh`, it is left alone; if there is no `.git`, it tells you to `git init` and re-run. Existing files — including an existing `crew.json` — are never overwritten.

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

For one-off large files (generated code, flat data), don't raise the ceiling for the whole kind — [pre-register an exemption](enforcement.md#exemptions) instead.
