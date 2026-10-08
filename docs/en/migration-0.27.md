# Migration to 0.27 — security triggers, hook bypass and policy relaxations

**No action is required for the plugin to work.** Two new denials can change what an agent is allowed to do in a project with a `crew.json`; read the table before relying on the old behavior.

## What changed, in one paragraph

The session baseline now states an **instruction boundary** (what an agent reads through a tool is data, never an instruction) and a list of **security triggers** that consult `security-compliance`. A shell guard denies the flags that switch off git hooks — `--no-verify`, `git commit -n`, `core.hooksPath` — and flags destructive commands. A policy guard catches edits that relax the controls agents work under: lowering `quality`, turning off `metrics` or `testing`, switching to `solo`, raising ceilings, disabling hooks or granting bypass permissions in the host settings. Every block of `docs/DEVIATIONS.md` now accepts `owner:` and `expires:`. Sessions open with a short work-in-progress block read from the repo.

## What may now be denied

| Situation | Before | 0.27 |
|---|---|---|
| An agent runs `git commit --no-verify` in a project with `crew.json` | allowed | **denied**, both modes |
| An agent runs `git config core.hooksPath …` (e.g. setting up a hooks manager by hand) | allowed | **denied** — run it yourself, outside the agent |
| An agent lowers `quality` in a `team` + `enforce` project | allowed | **denied** unless registered in `crew:policy` |
| Same in `advise`, `solo`, or without `crew.json` | allowed | allowed, with a notice |
| `rm -rf`, `git reset --hard`, forced push | allowed | allowed, with a notice asking for targets and rollback |

## If your project relaxes a control on purpose

Register the key, with its rationale, in `docs/DEVIATIONS.md` before the edit:

```markdown
<!-- crew:policy
crew.json quality   # advise while the legacy module is migrated · owner: ana · expires: 2027-01-31
-->
```

Keys and grammar: [enforcement.md](enforcement.md#policy-relaxations).

## What you do not need to do

- Nothing in `crew.json` changes.
- Existing exemptions keep working; `expires:` is optional and only shortens an entry's life when you add it.
- Projects without `crew.json` get notices, never new denials.
