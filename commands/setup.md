---
description: Configure this project for the crew — asks before writing, never guesses
argument-hint: [what to configure]
---

Spawn the `crew` subagent to run the project configuration interview (its third craft).

Before asking anything, read `standards/configuration-interview.md` in the plugin and follow it literally: consult the repo first, ask at most two open questions per turn, confirm understanding in one line before writing, write only what was confirmed, and update the `configuredWith` marker at the end — including when the answer is "I want none of this", which is a valid and complete outcome.

Never infer a capability the human can confirm in one line, and never author design-memory content on the project's behalf.

Focus (optional, empty means the full interview): $ARGUMENTS
