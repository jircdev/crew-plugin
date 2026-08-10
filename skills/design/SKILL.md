---
name: design
description: "The design craft, loadable by ANY role whose work changes what a user sees, understands, chooses or does — a screen, a flow, a state, an empty view, an error message, the wording of a form, a chart, an exported document. Owns the METHOD (how to arrive at a composition, how to hand it off, how to review an implementation, how to judge a render), never what is beautiful in this product — that belongs to the project's declared design memory. Load BEFORE proposing, specifying or coding any visible surface; triggers on 'new screen', 'redesign', 'this looks off', 'review this UI', 'design the flow', 'diseñar la pantalla', 'revisar la interfaz'."
---

# Design — the interface craft

The domain truth belongs to the owning role (informational spec to `data-experience-architect`, visual authority to `ux-architect`, implementation to `frontend-architect`, verdict to `qa-test-architect`). This skill governs **how** you get from a problem to a composition, and how you prove the composition is good.

## The frontier this skill respects

**The plugin carries method; the project carries capability and memory.** What is beautiful *here*, which components exist, which references this product aspires to, which patterns it has rejected — none of that is in this file, and none of it may be invented. It is declared by the project in `docs/design/` (memory) and `crew.json` (capabilities).

**Test of the opposite aesthetic** — apply it to every sentence you are about to write as if it were a rule: *would this still be true in a project with the opposite aesthetic, another stack, and other form factors?* If not, it is not method — it is taste, and taste belongs to the project. Never smuggle a value, a palette, a scale, a spacing rhythm, a named style, or a library into a recommendation as if it were craft.

## Before anything: read the capability

Read `crew.json` and `docs/design/`. Each declared capability enables something and each absence forces a named admission. **Never degrade silently.**

| Declared | Enables | Absent → you must say |
|---|---|---|
| `design.memory` | Contrasting your direction against this product's references, approved patterns and rejected patterns | "no design memory declared: the direction was not contrasted against the product's references" |
| `design.sources` | Deriving direction from the design source (design file, reference screenshots) | Direction derived from the brief and the registry only |
| `design.registry` | Verifying reuse before proposing a new component | "reuse not verified: the project declares no component registry" |
| `design.runtime.url` | Connecting to and inspecting a running app **without asking permission each turn** | Ask, as before |
| `design.runtime.launch` | Running the declared launch profile **without asking permission each turn** | Ask, as before |
| `design.capture` | A verdict on visual quality | Code conformity only, labeled as such |
| `design.checks` | Asserting accessibility or performance as **measured** | Assert them as reasoned, labeled not measured |

Two permission rules, because they are separate risks — connecting to something already running is inspection; running a launch profile executes a command on the user's machine:

- **Precedence**: if `runtime.url` is declared and responds, use it. `runtime.launch` runs only when the URL does not respond or is not declared. The server is usually already running outside the session; duplicating it is overhead.
- **Symmetry**: whatever you start, you stop.

An unrecognized capability form (a `kind` the plugin does not know) is treated as absent — and named in the evidence seal, never skipped.

## The four modes

Declare which mode you are in. They are not phases to run in order; pick the one the task is actually in.

### 1. `shape` — from problem to direction

This mode produces **questions and a procedure, never a catalogue of answers**. The answers come from the brief, the informational spec, the registry, and the design memory.

1. **Name the job.** Who is this person, what are they trying to finish, and what does "done" look like for them? A surface designed without a declared job is decoration.
2. **Ask what only the project can answer.** Do not infer what you can ask (see *Questions before inference* below).
3. **Establish what must dominate.** Exactly one thing per surface earns first read. If two things claim it, the surface is doing two jobs — split it or subordinate one.
4. **Derive the hierarchy from the content, not from a habit.** How many levels does *this* task actually sustain? Levels nobody needs read as noise; levels that are missing read as a flat wall.
5. **Decide what earns its own surface.** A card, a panel, a page is a promise of separateness. Content that is always read together and never acted on separately does not earn one.
6. **Choose between density, scannability and focus — explicitly, and say which you chose and why.** They trade against each other; a surface that refuses to choose gets the worst of all three.
7. **Contrast against the product's memory.** Which approved patterns apply, which rejected ones is this at risk of repeating. Without declared memory, say so — do not substitute your own references.
8. **Anti-generic pass**: could this surface be lifted into a different product of the same category and nobody would notice? If yes, name what makes it *this* product's and change it. The criterion for "generic" is the project's rejected patterns and its stated references — never a list of proscribed patterns written here.
9. **Enumerate every state before proposing**: loading, empty, partial, error, success. A missing state is a defect discovered by users, not a detail.

**Fallback**: with no design memory declared, `shape` still runs — but its output declares that the direction was not contrasted against anything the product has approved.

### 2. `handoff` — from direction to implementable specification

Here the invariant plane stops applying. **Concrete identifiers are the deliverable**: the components reused, the tokens, the values, the breakpoints, the paths, the variants. Withholding them is not craft, it is an unimplementable handoff.

Carry: screen or flow name · layout and hierarchy · components reused (named) and any new one with its rationale · the visual resource per data block, tied to the nature of that data · interaction flows, primary and alternative · every state from the list above · accessibility notes (keyboard, screen reader, contrast, focus order) · behavior at each target breakpoint the project declares · privacy and consent surfaces required by `security-compliance`.

Consult the registry **before** proposing anything new. When the registry contradicts the code, the code is what ships — report the contradiction to the registry's owner rather than choosing silently.

**Fallback**: no registry declared → the handoff says "reuse not verified", and any new component is proposed as *unconfirmed new*, not as new.

### 3. `implementation-review` — code against specification

Verify what the code does against the specification and the project's declared standards. Name files, components and values freely — this mode exists to be actionable.

This mode alone **cannot** produce a verdict on visual quality. Its output is *code conformity*, labeled as such, and it says so even when everything matches.

### 4. `visual-review` — judgment on the render

Requires a render. With `design.capture` declared, capture it; with only `design.runtime.url`, inspect what runs; with neither, **stop and say the verdict is unavailable** — do not substitute code reading for looking.

Capture at minimum the target viewports the project declares, and at least two states: the nominal one and one non-ideal (empty or error).

Judge, and for every observation say what to change:

- **Hierarchy** — does the intended first read actually come first?
- **Density and rhythm** — does the spacing group what belongs together and separate what does not, consistently?
- **Composition** — does anything overstretch, float, or collapse at the extremes of its container?
- **Affordances** — does anything look actionable that is not, or actionable-but-dead?
- **States** — are the non-ideal states designed, or are they the framework's defaults showing through?
- **Consistency** — against the project's declared memory and registry, not against your own preference.
- **Accessibility** — contrast, focus order, target size, motion. Measured if `design.checks` is declared; reasoned and labeled otherwise.

Qualitative vocabulary is licensed here — "it reads as noise", "the hierarchy is inverted", "the card is overstretched" — and must always be followed by what to change. Vagueness without a fix is not judgment.

**Bounded self-critique.** When a render channel exists, **one correction pass is mandatory**: review, fix what you found, render again. Further passes only while the previous one found *blocking* defects. Always declare how many passes ran. An unbounded "render until it's right" loop is a defect of method, not diligence.

**Author is not judge.** This self-critique is the author checking their own work. The independent verdict belongs to `qa-test-architect`, which receives the specification and the evidence — not your rationale for why the design is right.

## Questions before inference

Configuration and design decisions are asked, not guessed. Before proposing, ask what the project alone can answer — and ask it **as a short, closed list**, not an interrogation:

- Who uses this surface, and what are they trying to finish?
- What must be true for this to be considered done well — beyond "it works"?
- Which existing surface should this feel continuous with?
- Which of density / scannability / focus matters most here?
- Which form factors are actually in scope?
- Is there a reference — inside or outside the product — that this should resemble, or deliberately not resemble?

Rules: maximum two open questions per turn (pick the ones that unblock the next step, defer the rest) · never ask what the declared memory, registry or brief already answers · **confirm your understanding in one line before designing** — restate the job, the dominant element and the chosen trade-off, and let the user correct it. A wrong inference caught before the work costs one line; caught after, it costs the work.

## Evidence seal

Every reply from this skill ends with one line, not a section:

> Mode · what was loaded (memory, registry, spec) · capabilities used · what stayed unverified.

It reports facts. It never scores quality, and it never claims a verdict the evidence does not support.

## Refuse to produce

- A verdict on visual quality with no render — say the verdict is unavailable instead.
- A recommendation carrying values, palettes, scales, style names or libraries that the project did not declare.
- A new component when the registry was never consulted and the absence was not declared.
- A specification missing states, or a handoff without concrete identifiers.
- "Meets the checklist" offered as a design judgment: conformity is the floor, not the deliverable.
- An unbounded render-and-fix loop, or a self-critique presented as an independent verdict.

## Boundaries

This skill owns the HOW. It does not own: which data appears (`data-experience-architect`), how data is modeled (`data-architect`), security and consent rulings (`security-compliance`), frontend state and implementation decisions (`frontend-architect`), the acceptance verdict (`qa-test-architect`), or the repository's documentation lifecycle (`documentation-steward`). If the request is really one of theirs, say so and stop — absorbing a neighbor's authority is a failure of this skill, not thoroughness.
