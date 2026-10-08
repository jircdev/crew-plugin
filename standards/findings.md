# Findings — the shared shape of a review

Every review in the crew — QA's verdict, the design skill's visual and implementation reviews, a SEC ruling's conditions, a DOC audit — reports findings in this one shape, so a reader triages them the same way whoever wrote them. Read on demand by the reviewing role; the session baseline does not inline it.

## The shape

Each finding carries five fields:

| Field | What it holds |
|---|---|
| **Severity** | `blocking`, `important` or `refinement` (below) |
| **Owner** | the role whose decision the finding says was violated — `data-architect` for a schema defect, `ux-architect` for a missing state, `functional-analyst` for an unmet criterion. A finding with no owner is an opinion |
| **Evidence** | what makes it checkable by someone else: `file:line`, the command and its output (or its receipt), the render, the spec sentence it contradicts |
| **Basis** | `measured` (a tool ran and reported it), `observed` (seen in code, output or render) or `reasoned` (inferred, not seen) |
| **Action** | what must change, stated as an outcome, addressed to the owner |

## Severity — one scale for every review

- **Blocking** — the work fails its job for someone, or contradicts a written spec, criterion, "must not" or ruling. It stops the merge or the closure.
- **Important** — the job survives but degrades under real conditions (real content, declared viewports, real load), or it repeats something the project recorded as rejected.
- **Refinement** — everything else. The absence costs nothing you can name; say so plainly.

Two rules keep the scale readable:

- **Severity is bounded by the basis.** A `reasoned` finding cannot be blocking on grounds that need observation (visual quality without a render, behavior without a run). The most it can be is a suspected defect to confirm.
- **Inflation empties the scale.** A review with no blocking findings, or none at all, is a legitimate result.

## Adversarial confirmation of blocking findings

Before a review is delivered, every **blocking** finding is re-checked once by trying to refute it through its owner's lens: does the evidence still hold when you read the owner's spec and the code or output again, looking for the reason the finding might be wrong? Three outcomes:

- **Confirmed** — the evidence holds; it stays blocking.
- **Refuted** — the evidence does not hold; drop it and say so in one line.
- **Unconfirmed** — you could not settle it either way; it is reported as `important` with "unconfirmed" in its evidence, never silently dropped.

If the re-check cannot be done at all (the evidence is unreachable), the finding stays blocking: an unverifiable blocker is the reviewer's to resolve, not the reader's to ignore.

## Lenses every code review runs

- **Silent failures** — empty or swallowing `catch`, errors logged and then ignored, fallbacks that turn a failure into plausible data (an empty list, a zero, a default user), missing timeouts on external calls, lost stack traces, retries without a cap.
- **"Must not"** — every "Must not" line of the story or requirement is checked as a criterion of its own; a violated one is blocking and owned by `functional-analyst` (or the role that wrote it).
- **Claimed passes** — a `passing` verification row, or "tests pass" in prose, counts as observed only with a run you can point to (a receipt from `scripts/verify.js` where the project declares `testing.commands`). Otherwise it is `reasoned` and says so. Never report a pass you did not see.
