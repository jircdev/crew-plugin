# Migration to 0.31 — factory mode

Additive. **No action is required** in projects that do not use factory.

## What changed, in one paragraph

Projects that keep their work and time in factory can declare it with a `factory` block in `crew.json`. In that mode the specification stays in the repository and the activity (estimate, state and hours) lives in factory, linked by the `**Factory activity:**` line in the work item's header. Each person connects their machine with `/crew:factory login`; from then on the plugin records the person's time and the agent's time in the background and sends it to factory for weekly confirmation. `/crew:metrics` reads factory's backlog. The full guide is [factory.md](factory.md).

## What you may notice

- In a project with a `factory` block, closing a story requires the `**Factory activity:**` line in place of the `## Estimation` table.
- Without `/crew:factory login`, nothing is recorded about you.
- The story template gains the optional `**Factory activity:**` field.

## What you do not need to do

- Nothing, if the project does not declare `factory`.
- Estimated hours remain person hours. Agent hours are recorded as a separate measure; there is no agent-hour estimate yet.
