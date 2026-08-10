# Design skill — evaluation set

Nine fixtures and a rubric for answering one question: **does the `design` skill change what the agent does, or only how well it explains itself?**

## What this measures, and what it deliberately does not

The rubric scores **agent behavior**, never design beauty. Every item is close to binary and verifiable by reading the reply: did it load the skill, did it declare its capabilities, did it consult the registry or say it could not, did it enumerate the states, did it claim a visual verdict without a render, did it absorb a neighbouring role's authority.

Not one item asks whether the screen is attractive. That is on purpose: a rubric with taste criteria would be the plugin deciding what every project should look like, which is exactly the frontier this release draws. Where a fixture involves weak design, it is scored on *did the agent detect and name it*, never on *did it agree with our opinion of what was ugly*.

## How to run it

Human-run, by design. There is no eval runner in this repo, and "compare with and without the skill" needs either a person or a judge model — specifying it as automation is how it would never ship.

1. Pick a fixture. Read its setup and prepare the stated project state (declared capabilities, memory present or absent).
2. Run the prompt **twice**: once with the `design` skill available, once without.
3. Score both against [`rubric.md`](rubric.md).
4. Record the pair. The signal is the *difference*, not the absolute score.

A fixture whose two runs score the same is telling you something real: either the skill is not being loaded, or that item was already covered by the role document.

## Files

- [`fixtures.md`](fixtures.md) — the nine scenarios
- [`rubric.md`](rubric.md) — the scoring items

## When to re-run

After any change to the skill, to the capability schema, or to the register rules shared across roles. Those three are the ones that can silently turn "declared what it could not verify" back into "said nothing".
