# Migration to 0.30 — a catalog that learns, under governance

Additive. **No action is required.**

## What changed, in one paragraph

Catalog usage can now be recorded — which roles, skills and commands a project actually uses — but only for a person who opts in (`.crew/local.json` with `{"telemetry": true}`, or `CREW_TELEMETRY=1`). The shared `crew.json` cannot switch it on for a team; `"telemetry": false` forbids it for everyone. The log keeps a date, a kind and a catalog name per event, nothing else, for 90 days, and never reaches the repository. `/crew:metrics catalog` reports it. The documentation steward gains a retro, run only on request, that turns friction repeated in repo files into ownerless proposals for a human to approve. Shell scripts are now pinned to LF line endings, so a Windows checkout no longer turns `check-quality.sh` into a script bash cannot run.

## What you may notice

- `/crew:doctor` blocks if `.crew/usage.jsonl`, `.crew/local.json` or `.crew/audit.log` is under version control.
- On a Windows checkout of the plugin made before 0.30, re-checkout the `.sh` files (or clone again) to get LF endings.
