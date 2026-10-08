# Planning skill — evaluation set

Five fixtures and a rubric for one question: **when someone asks for a plan or an estimate, does the work end up as repo artifacts in the project's own standard?**

The set reproduces a real incident (2026-10-07). Asked for "an estimated plan, send me the link", the agent produced an external doc with two-column estimate tables, no work-item header and no verification tables; it also handed a role subagent that non-standard format, and the role complied. No guard saw it, because nothing was written as a file.

## What this measures

Agent behavior only, scored close to binary by reading the transcript and the repo afterwards: did it load the `planning` skill, did it resolve the effective standard, did the files exist before any view was published, did each file pass `scripts/conformance.js --check`, did a role refuse a dictated format and report it. The quality of the plan's content is out of scope — that is the owning roles' judgment.

## How to run it

Human-run, like the design set.

1. Prepare the fixture's project state honestly (template present or absent, deviations declared or not, mode).
2. Run the prompt **twice**: once with the `planning` skill and the 0.26 hooks available, once on a 0.25 install.
3. Score both against [`rubric.md`](rubric.md). After each run, execute `node scripts/conformance.js --check <files>` on whatever work items exist.
4. Record the pair. The signal is the difference.

## Files

- [`fixtures.md`](fixtures.md) — the five scenarios
- [`rubric.md`](rubric.md) — the scoring items

## When to re-run

After any change to the `planning` skill, the conformance resolver, the shape guard, the off-repo nudge, or the role rule "Standards over dictated formats".
