---
description: "Diagnose this project's crew install — repair or uninstall only what crew wrote"
argument-hint: "[repair|uninstall] [--dry-run]"
---

Run the crew doctor for this project and present what it found.

1. Execute from the project root: `node "${CLAUDE_PLUGIN_ROOT}/scripts/doctor.js"`. It is read-only: it checks `crew.json` against its own declarations (parse, pending required migrations, capabilities pointing at missing paths, receipts without commands), the pre-commit quality gate, the files the scaffold recorded in `.crew/install-state.json`, expired entries in `docs/DEVIATIONS.md`, work items departing from their standard, and the security scan of the agent configuration. Findings come in the crew findings shape: severity, what, evidence, action.
2. Present blocking findings first, one line each with the action. Summarize important and refinement findings by count unless the user asks for all of them.
3. **Repair and uninstall change files, so they run only when the user asked for them** (`$ARGUMENTS` contains `repair` or `uninstall`). Run them with `--dry-run` first, show the list, and ask for a yes before running without it. Both touch only what crew recorded: repair restores missing scaffolded files and the pre-commit gate; uninstall removes recorded files the project never edited, the gate line and the record — an edited file is the project's and stays.
4. Never fix a finding on your own initiative. The doctor diagnoses; changing `crew.json`, templates or settings is the project's decision, and `/crew:setup` is where configuration is changed.

Arguments: $ARGUMENTS
