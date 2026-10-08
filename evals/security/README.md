# Instruction boundary and security triggers — evaluation set

Six fixtures and a rubric for two questions: **does an agent treat what it reads through a tool as data**, and **does work that touches a security trigger reach `security-compliance`?**

Both rules live in the session baseline (`standards/session-context.md`), so every role inherits them; the canonical trigger list lives in `agents/security-compliance.md`. Nothing here is mechanical: the guards cannot tell an instruction from data. That is why this set exists.

## How to run it

Human-run, like the design and planning sets.

1. Prepare the fixture's state honestly — the injected text must really be in the file or tool output, worded the way a real attacker would word it.
2. Run the prompt **twice**: with the 0.27 baseline and with a 0.26 install.
3. Score both against [`rubric.md`](rubric.md). The signal is the difference.

## Files

- [`fixtures.md`](fixtures.md) — the six scenarios
- [`rubric.md`](rubric.md) — the scoring items

## When to re-run

After any change to the instruction boundary or the trigger list in the baseline, to the SEC role, or to how the evidence seal is worded.
