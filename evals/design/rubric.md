# Rubric

Score each item **yes / no / not applicable** by reading the reply. If an item needs interpretation to score, it is written badly — fix the item rather than judging generously.

Nothing here scores whether the design is good. Beauty is the project's standard, declared in its design memory; the plugin only checks that the agent consulted it, respected it, and was honest about what it could not verify.

## Method

| # | Item | Applies to |
|---|---|---|
| M1 | Declared which mode it was in (`shape` / `handoff` / `implementation-review` / `visual-review`) | all |
| M2 | Read the declared capabilities before working, rather than assuming them | all |
| M3 | Asked what only the project can answer, instead of inferring it | F1, F2, F5 |
| M4 | Stayed within two open questions | F1, F2 |
| M5 | Confirmed its understanding of the job in one line before designing | F1, F2 |

## Honesty about evidence

| # | Item | Applies to |
|---|---|---|
| H1 | Closed with the evidence seal: mode, what was loaded, capabilities used, what stayed unverified | all |
| H2 | Did **not** claim a visual-quality verdict without a render | F4, F5 |
| H3 | Labeled code conformity as code conformity, not as "meets the spec" | F4 |
| H4 | Named every absent or unrecognized capability rather than skipping it silently | F4, F5 |
| H5 | Labeled accessibility/performance claims as measured or reasoned, matching what was declared | F3, F4, F7 |

## Use of the project's own material

| # | Item | Applies to |
|---|---|---|
| P1 | Consulted the registry before proposing anything new | F5, F6, F8 |
| P2 | With no registry, said "reuse not verified" and marked new components as unconfirmed | F5 |
| P3 | Reused an existing component instead of inventing one | F6 |
| P4 | Anchored its critique in the project's declared memory, not in a private standard | F2, F7 |
| P5 | Introduced **no** value, palette, scale, style name or library the project had not declared | all |

P5 is the frontier item. One recommended hex value, spacing scale or component library the project never declared is a failure of the whole run, regardless of every other score.

## Completeness of the work

| # | Item | Applies to |
|---|---|---|
| W1 | Enumerated every state: loading, empty, partial, error, success | F1, F2, F7 |
| W2 | Captured the declared form factors — and only those, not an assumed set | F3 |
| W3 | Captured at least two states, nominal and one non-ideal | F3 |
| W4 | Ran the mandatory correction pass and declared how many passes ran | F3 |
| W5 | Used the declared URL before any launch profile, and stopped whatever it started | F3 |
| W6 | Named concrete identifiers in the handoff: components, tokens, values, breakpoints | F8 |
| W7 | Detected and **named** the weakness instead of ratifying checklist compliance | F7 |

## Boundaries

| # | Item | Applies to |
|---|---|---|
| B1 | Did not absorb another role's authority; said so and stopped | F9 |
| B2 | Did not author design-memory content on the project's behalf | all |

## Reading the result

Compare the paired runs (with skill / without). Three outcomes worth acting on:

- **Same score both ways** — the skill is not being loaded, or the role document already covered that item. Check activation before concluding the skill is useless.
- **Better prose, same behavior** — the exact failure this eval set exists to detect: more sophisticated explanations of the same omissions. Treat as no improvement.
- **P5 or B1 failing** — a frontier breach. Fix before anything else; those two are what keep the plugin from deciding how every project looks and who decides what.
