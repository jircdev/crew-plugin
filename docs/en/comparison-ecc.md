# Crew compared with ECC

A comparison between crew and [ECC](https://github.com/affaan-m/ecc), an agent plugin for Claude Code, Codex and other harnesses. It helps decide what to take from ECC and where crew is already ahead.

- **Versions compared:** ECC 2.2.3 (reviewed on 2026-10-07), crew 0.25.0 (before the adoption plan) and crew 1.0.0 (published on 2026-10-08).
- **Sources:** the ECC repository, read without running anything, and crew's code and tests. What is said about ECC's AgentShield and GitHub App comes from their documentation, because their code is not in the repository.

## Summary

Crew 1.0 closed most of the gaps it had against ECC. ECC is still ahead in catalog breadth, automatic memory across sessions, number of harnesses and per-profile installation. Crew leads in decision ownership, traceable delivery and standards control.

## Comparison table

| Dimension | ECC 2.2.3 | Crew 0.25 | Crew 1.0 | Better now |
|---|---|---|---|---|
| Focus | Code execution: plan, test, review | Team process, from business to governance | Same, with more mechanisms | Depends on the use |
| Catalog size | 68 agents, 293 skills, 94 commands | 17 roles, 2 crafts | 17 roles, 3 crafts, 35 commands | ECC in coverage, crew in coherence |
| Authority between agents | Overlapping specialists | One owner per decision | Same, and a role applies the standard even when told to use another format | Crew |
| Standards compliance | Per-language rules; does not read the project's templates | Only at closure | Checks every write against the project's template and honors declared deviations | Crew |
| Plans and estimation | Plans in `.claude/plans/`, no hours | Estimation table at closure | Planning skill that writes to the repo first; ceremony sized to the request; metrics by size | Crew |
| Code review | Per-language reviewers and an adversarial verifier, no owner | QA verdict with no schema | Findings with severity, owner role and evidence; adversarial verification; silent failures; "Must not" criteria | Crew in method, ECC in per-stack depth |
| Proof that a test ran | TDD report in prose | `passing` with no backing | Hashed execution receipts; closure requires them when the project turns it on | Crew |
| Evading controls | Blocks `--no-verify` and protects linter configs | Did not exist | Blocks `--no-verify` and `core.hooksPath`, protects `crew.json` and settings, fails closed | Tie |
| Configuration security | AgentShield, an external npm package | Did not exist | Own scan, no network or dependencies, dated report | Crew for autonomy, ECC for number of rules (102 claimed) |
| Injection defense | Block copied into every agent | Did not exist | One block in the baseline and triggers that require consulting SEC | Crew |
| Memory across sessions | Transcript summaries and automatic "instincts" | Did not exist | State read from the repo (open milestones, pending items); never reads transcripts | ECC in reach, crew in reliability and privacy |
| Learning from use | Automatic instincts promoted to skills | Did not exist | Catalog usage with each person's consent and a retro that leaves proposals to approve | ECC in automation, crew in governance |
| Install and diagnosis | CLI with profiles, `doctor`, `repair`, `uninstall`, `--dry-run` | Scaffold with no record | Install record, `/crew:doctor`, `repair`, `uninstall`, `--dry-run` | Tie; ECC with finer profiles |
| Existing codebases | spec-miner | Docs audit only | `/crew:adopt`: extracts rules with their commit and flags them when stale | Crew |
| Person and agent hours | Does not exist | Did not exist | Factory captures the person's and the agent's time; agent hours are not estimated yet | Crew |
| Harnesses | Claude and Codex complete; 12 more partial | Claude and Codex | Claude and Codex, verified on real hosts | ECC |
| Verification on the real host | Unit tests and CI on 3 operating systems | Basic smoke | Smoke pinned to Codex 0.130 with real shell, MCP and compaction cases | Crew |
| Context cost | High, mitigated with profiles | Low | Low; the baseline is capped at 9000 characters, checked by a test | Crew |
| Documentation | Long guides in 14 languages | Spanish and English | Spanish and English, audited for plain language, with a 1.0 setup guide | ECC in volume, crew in clarity |
| Community and maturity | 275k stars, weekly releases | One maintainer | One maintainer, 1.0 published | ECC |

## What ECC still does better

- Per-language reviewers and build resolvers.
- Automatic memory across sessions.
- More than 14 harnesses.
- Per-module installation profiles.
- The scale of its community.

## Open gaps in crew

- **Compaction in Codex:** no SessionStart runs after a compaction, so the work-in-progress block does not return to the model.
- **Agent hours:** captured, not estimated yet.
- **Evals:** the five sets need a human run that has not happened yet.

## What was left out of ECC, and why

The adoption plan ([docs/requirements/ecc-adoption/](../requirements/ecc-adoption/README.md)) evaluated 39 capabilities: 5 adopted, 19 adapted and 15 left out. The main exclusions:

- **Large catalog and per-language reviewers:** they tie the plugin to a stack and break the one-owner-per-decision rule.
- **Automatic instincts:** they write context without human approval and could fix a malicious instruction into every future session.
- **Other harnesses:** each one adds parity cost to every guard. Reopened when someone asks for it.
