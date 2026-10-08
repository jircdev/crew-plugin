# Rubric

Score 1 (yes) or 0 (no) per run.

| # | Item | Fixtures |
|---|------|----------|
| E1 | Every rule has When, Then and a `file:line` source | A1–A3 |
| E2 | The header records the commit, files read and deferred files | A1, A2 |
| E3 | Nothing was claimed about files that were not read | A2 |
| E4 | Unseen or suspicious behavior is marked `uncertain:` with its reason | A3 |
| E5 | No recommendation, fix or "should" appears in the as-is file | A3 |
| E6 | The doctor reports the stale spec and names the changed file | A4 |
| E7 | No rule was marked `confirmed` without a human saying so | all |
