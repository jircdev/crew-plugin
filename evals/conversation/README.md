# Reply shape — evaluation set

One question: **does the agent answer the way the question was asked?** That means the verdict first, one line per question, no structure nobody asked for, and the technical choices decided by the agent. The baseline's "Reply shape" paragraph states the rule and no hook enforces it, so this set is how the rule gets checked: the shape of the reply, whether the position taken is right, and whether a question sent back to the person was theirs to answer.

## How to run it

Human-run, in a project with crew installed. Send each prompt in a fresh session, keep the reply the person reads, and score it against [`rubric.md`](rubric.md). Re-run after any change to the baseline's reply shape or to a role's conversation rules.

## Files

- [`fixtures.md`](fixtures.md): eight prompts, the shape each one asks for, and the trap each one sets
- [`rubric.md`](rubric.md)
