# Migration to 0.24 — `bin/` becomes `scripts/`

A single mechanical change, with **one required action** in any repository that installed the quality gate before this version.

## What changed, in one paragraph

The plugin's executables directory is no longer called `bin/`; it is now `scripts/`. The four executables (`init-project.sh`, `metrics.js`, `check-quality.sh`, `check-staged.js`) are identical — only their directory moved. The reason: a top-level `bin/` makes the validator behind claude.ai-hosted installs reject the whole plugin — on the CLI its contents are added to `PATH`, but they never appear on the admin approval surface, so both the marketplace sync from the desktop app and a packaged `.plugin` fail with `Plugin contains a top-level bin/ directory`. With `bin/`, the plugin was CLI-installable only.

## The required action: the pre-commit hook

`scripts/init-project.sh` installs the gate as `.git/hooks/pre-commit` using an **absolute** path into the plugin. Every repository scaffolded before 0.24 has a line there pointing at `bin/check-quality.sh` — a path that no longer exists.

This does not fail loudly: the hook stops resolving and the gate goes quiet. A commit that used to be blocked now goes through.

**The fix, from the project root:**

```bash
bash /path/to/crew-plugin/scripts/init-project.sh
```

The script detects the old hook, rewrites the path in place, and reports it as `migrated:`. No other existing file is touched. If you would rather edit it by hand, it is a text substitution in `.git/hooks/pre-commit`:

```
bin/check-quality.sh   →   scripts/check-quality.sh
```

## What else to check

| Where | What to look for |
|---|---|
| CI | any step invoking `crew-plugin/bin/...` |
| Your own aliases and scripts | hand-written paths into the plugin |
| The project's `AGENTS.md` | references to the plugin's `bin/` directory |

## What you do not need to do

- **CLI installs need nothing**: `/plugin update crew@factory-crew` and you are done. The rename is internal to the plugin.
- **Author / local-dev installs** consuming the working tree just need `git pull`.
- **No rule, gate or `crew.json` contract changes.** Only the path changes; behavior stays the same.

## Checklist

1. Re-run `scripts/init-project.sh` in every repo that had the gate installed.
2. Confirm `.git/hooks/pre-commit` points at `scripts/check-quality.sh`.
3. Grep for `bin/` in your CI and your aliases.
