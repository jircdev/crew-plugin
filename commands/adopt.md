---
description: "Adopt crew in an existing codebase — extract what the system does today, per capability"
argument-hint: "[capability or area]"
---

Bring an existing project under the crew without pretending its code has no history. The output is evidence of current behavior in `docs/as-is/`, never a backlog.

1. **Check the install.** Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/doctor.js"`. If the project has no crew skeleton, offer `scripts/init-project.sh --dry-run` first and run it only on a yes; for a project with its own docs and conventions, the entry is `/crew:doc` auditing them against the crew standard. Make sure `docs/as-is/README.md` exists (copy it from the plugin's `templates/docs/as-is/README.md` if not).
2. **Agree the capabilities.** List the capabilities you see (from routes, commands, modules, screens) and ask the user which to extract first — at most a handful per pass. With `$ARGUMENTS`, start there.
3. **Extract.** Spawn `researcher` with its extraction protocol for one capability at a time: entry points first, at most 15 files, `deferred` for the rest, `uncertain:` for anything not seen, the commit and files read.
4. **Write.** Spawn `functional-analyst` in as-is mode to write `docs/as-is/<capability>.md` from the template, carrying every `uncertain:` mark verbatim.
5. **Confirm.** Show the user the rules marked `uncertain` first. Only the user (or someone who knows the system) turns a rule into `confirmed`.
6. **Next.** Decisions about what to keep, fix or change become stories or requirements through the normal circuit, each linking the as-is file it starts from. `/crew:doctor` reports an as-is file as stale once the files it was read from change.

Scope: $ARGUMENTS
