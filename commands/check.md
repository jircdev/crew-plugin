---
description: "Readiness check — run the project's declared test commands and leave receipts"
argument-hint: "[kind]"
---

Run the test commands this project declared in `crew.json` (`testing.commands`) and report whether the work is ready.

1. Execute from the project root: `node "${CLAUDE_PLUGIN_ROOT}/scripts/verify.js"`, adding `--kind <kind>` when the user named one (for example `unit` or `e2e`). The script runs only declared commands, writes one receipt per run under `docs/verification/receipts/`, and ends with **READY** or **NOT READY**.
2. Report the verdict in one line, then one line per failing command with its exit code and the relevant part of its output tail. Do not paste passing output.
3. When the user is closing a work item, the receipt ids are what its verification rows cite: `passing (receipt: <id>)`. If the project declares `testing.receipts: true`, closure requires exactly that.
4. If the script says no commands are declared, say that pass/fail cannot be observed in this project and that `/crew:setup` is where the commands are declared. Never report a suite as passing without a run.

Receipts are evidence files: they are committed with the work they verify, and never edited (the closure gate rejects a receipt whose content no longer matches its id).
