# Accepted deviations from the crew documentation standard

This project was audited against the `crew` plugin documentation standard (taxonomy in [`AGENTS.md`](AGENTS.md), circuit in [`guides/delivery-circuit.md`](guides/delivery-circuit.md)). The deviations below were reviewed by the project owner and **deliberately kept**.

> **Binding for all agents:** a deviation recorded here is a decision, not a defect. Do not "fix" it, do not flag it again in audits, do not treat the standard as overriding it. To revisit one, raise it with the owner — never unilaterally.

## Registry

| # | Deviation | Standard says | This project does | Rationale | Decided | Date |
|---|-----------|---------------|-------------------|-----------|---------|------|
| - | - | - | - | - | - | - |

## Code-quality exemptions (machine-readable)

Paths listed in the block below are exempt from the file-size ceilings — both the write-time guard and the pre-commit gate skip them. Pre-register the exception **with its rationale** before hitting the wall; each line is a glob (`**` crosses directories, `*` stays within a segment), comments after `#`.

<!-- crew:exempt
-->

Example:

```
src/generated/**        # generated code
src/config/routes.ts    # route table, flat by design
```

(Write those lines inside the block above — only the first `crew:exempt` block in this file is read.)

## Work-item standard deviations (machine-readable)

The shape of a story or requirement comes from this project's own template (`docs/stories/README.md`, `docs/requirements/README.md`); where the project has none, the crew template applies. When the project deliberately departs from that template in a way it cannot express by editing the template itself, it declares the departure in the block below. Every line needs a rationale after `#` — a line without one is ignored and reported.

<!-- crew:standard
-->

Grammar, one rule per line:

```
requirement omit section Verification                              # rationale
story omit header Branch                                           # rationale
requirement columns Estimation Milestone | Est. hours | Actual hours | Notes   # rationale
```

(Write those lines inside the block above — only the first `crew:standard` block in this file is read.)

## Policy relaxations (machine-readable)

Lowering `quality`, turning off `metrics` or `testing`, switching to `solo`, raising ceilings, disabling hooks in the host settings or granting bypass permissions relaxes the controls agents work under. Each one is a project decision: register its key here, with the rationale, before the edit — otherwise the policy guard denies it (team + `quality: enforce`) or flags it.

<!-- crew:policy
-->

Keys: `crew.json quality`, `crew.json metrics`, `crew.json testing`, `crew.json mode`, `crew.json ceilings`, `crew.json removed`, `settings disableAllHooks`, `settings bypassPermissions`, `codex hooks`, `codex approvals`. Example:

```
crew.json quality   # advise while the legacy module is migrated · owner: ana · expires: 2027-01-31
```

## Accepted security risks (machine-readable)

A finding of the configuration security scan (`scripts/sec-scan.js`, run by `security-compliance`) that the owner decides to accept is registered here, rule and file, with the rationale. Accepted findings stay in the report, marked as accepted, and no longer fail CI.

<!-- crew:security
-->

Example: `SEC-HOOK-NET .claude/settings.json   # posts to our own status page · owner: ana · expires: 2027-01-31`

Every block in this file (`crew:exempt`, `crew:standard`, `crew:policy`, `crew:security`) accepts `owner:` and `expires: YYYY-MM-DD` in the comment. An entry past its date stops applying.

## Convention

- One row per deviation; keep rationale to one line, link a fuller doc if needed.
- Added only as the outcome of a `DOC` audit conversation with the owner — never unilaterally by an agent.
- Removing a row requires the owner's explicit decision (the project converged to the standard, or the deviation was superseded).
- If this file is empty, the project follows the standard fully.
