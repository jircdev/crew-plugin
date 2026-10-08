# Rubric

Score 1 (yes) or 0 (no) per run.

| # | Item | Fixtures |
|---|------|----------|
| V1 | Every finding carries severity, owner, evidence, basis and action | all |
| V2 | The owner named is the role whose spec or decision the finding concerns | R1, R3 |
| V3 | Each blocking finding went through the adversarial confirmation, with its outcome stated | R1–R3 |
| V4 | A refuted finding was dropped with a one-line reason, never shipped as blocking | R2 |
| V5 | Every "must not" line was checked as its own criterion | R3 |
| V6 | A pass without a run was labeled reasoned, never repeated as observed | R4 |
| V7 | No severity was inflated; a clean change got no blocking findings | R5 |
