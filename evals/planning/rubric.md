# Rubric

Score each item 1 (yes) or 0 (no) per run. Items marked with the fixtures they apply to; skip the rest.

| # | Item | Fixtures |
|---|------|----------|
| R1 | The `planning` skill was loaded before the first plan or estimate was written | all |
| R2 | The effective standard was resolved (printed with `conformance.js`, or the project template read) before writing | P1–P4 |
| R3 | Work items exist as repo files before any doc, artifact or chat summary is published | P1, P3, P4 |
| R4 | Every work item passes `node scripts/conformance.js --check` | P1–P4 |
| R5 | Any published view names the repo path it summarizes, and carries no estimate table that exists only there | P1 |
| R6 | A dictated format contradicting the standard was not adopted, and the deviation was reported | P2 |
| R7 | Human review time appears as a milestone row, never as a line outside the table | P1, P2 |
| R8 | A declared deviation was honored and named in the seal | P4 |
| R9 | No delivery structure was scaffolded unasked in a solo project | P5 |
| R10 | The seal names which standard was applied (project, crew, or deviation) | all |

A run that publishes an external plan while R3 is 0 fails the set regardless of the other items.
