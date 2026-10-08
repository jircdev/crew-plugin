# Migration to 0.29 — an install you can diagnose, adoption of existing code, and a security scan

Additive. **No action is required.**

## What changed, in one paragraph

The scaffold moved to `scripts/init-project.js` (`init-project.sh` still works and wraps it), gained `--dry-run` and `--json`, and now records every file it writes in `.crew/install-state.json`. `/crew:doctor` reads that record with `crew.json`, `migrations.json`, the pre-commit gate and `docs/DEVIATIONS.md`, and reports in the findings shape; `repair` and `uninstall` touch only recorded files the project never edited. `/crew:adopt` extracts what an existing system does into `docs/as-is/`, and the doctor reports those files as stale when their code changes. `security-compliance` scans the agent configuration with `scripts/sec-scan.js`, read-only and offline, and the session start says when the configuration changed since the last scan.

## What you may notice

- Projects scaffolded before 0.29 have no `.crew/install-state.json`. The doctor works without it; `repair` and `uninstall` have nothing recorded to act on. Re-running `scripts/init-project.sh` records only the files it writes from now on — it never claims files that already existed.
- In crew projects, a one-line **security** notice appears at session start until a scan is filed with `--report`.
- `"audit": true` (team) starts an append-only trail of guard decisions in `.crew/audit.log`.

## What you do not need to do

- Nothing in `crew.json` changes unless you opt into `audit`.
- The as-is folder is created only for new team scaffolds; `/crew:adopt` creates it when needed.
