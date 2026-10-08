# Routing between neighboring roles — evaluation set

One question: **does a request reach the role that owns the decision, when a neighbor could plausibly take it?** Mis-routing is the routing cost the CREW role weighs before merging or keeping a role; this set measures it. Pair it with `/crew:metrics catalog` (usage, opt-in per person) when a merge or retirement is on the table.

## How to run it

Human-run. Send each prompt without naming a role, record which role the main agent consulted or spawned (and whether it consulted the neighbor too), and score against [`rubric.md`](rubric.md). Re-run after any change to a role's Scope, Authority or description.

## Files

- [`fixtures.md`](fixtures.md) — fourteen prompts over seven neighbor pairs
- [`rubric.md`](rubric.md)
