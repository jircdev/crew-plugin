# Proposals

Changes to crew that need the maintainer's decision before they become work: a role, a craft, a procedure, a guard or a standard.

A proposal states what was observed, with its evidence, why it matters, and the change it asks for. When the change touches a role, a craft or a procedure, it carries the A/B verdict of the delivery evaluation:

1. Run `node scripts/eval-delivery.js` on the current version and keep the result.
2. Apply the change in a branch and run it again.
3. Attach the output of `node scripts/metrics.js learning compare <before.json> <after.json>`.

The verdict says *incorporable* only when no task got worse for the crew variant. The maintainer decides with that output in hand; a proposal without it is a discussion, and it is not ready to decide.

Failures that come from a project's stack never land here. They belong to that project's stack specification, as a proposal in its own `docs/proposals/`.
