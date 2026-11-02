---
description: Connect this machine and this repository to factory — login, link, status, backfill, logout
argument-hint: login | link [project id] | status | backfill | logout
---

Connect this machine to factory, link the current repository to its factory project, and recover work time that capture lost. The token is the personal credential that lets crew send captured work time to factory and read its backlog.

Run each action from the project root. Relay the script's result in one or two plain sentences. The token never appears in any output. When someone offers to paste a token into the chat, ask them to keep it out of the conversation and use `login` instead. Pasting a token by hand into `~/.crew/factory-token` or `FACTORY_TOKEN` remains the fallback, documented in the plugin's `docs/en/factory.md`.

- **login** — `node "${CLAUDE_PLUGIN_ROOT}/scripts/factory-login.js" login`. Run it in the background or with a timeout of at least six minutes: it waits until the person approves in the browser. It opens factory in the browser; tell the person to read what capture records and approve there, then come back to the chat. If the browser did not open, show them the printed link. The token goes straight from factory to a file only they can read. Time queued while an earlier token was expired is sent right away when it belongs to the same person on the same factory; relay that line too.
- **link** — `node "${CLAUDE_PLUGIN_ROOT}/scripts/factory-link.js"` lists the factory projects the person takes part in. Show the list and ask which one this repository works for. Then, after the person confirms, because `crew.json` is shared by the team, run it again with the chosen project id: `node "${CLAUDE_PLUGIN_ROOT}/scripts/factory-link.js" <project id>`. Pass the id, never a position in the list. Add `--replace` only when the person agreed to change an existing link, and `--set-environment` only when they agreed to write this machine's environment into `crew.json`. Remind them to commit `crew.json`.
- **status** (the default with no argument) — `node "${CLAUDE_PLUGIN_ROOT}/scripts/factory-login.js" status`. Says which factory this machine talks to, as whom, when the token expires, how much captured time waits on this machine, and which project the current repository is linked to.
- **backfill** — `node "${CLAUDE_PLUGIN_ROOT}/scripts/factory-backfill.js"` rebuilds this repository's work time from the person's local Claude Code transcripts and shows a summary per day. Show the summary as printed. Add `--since YYYY-MM-DD` only with a date the person gave you. Add `--send` only after the person explicitly says yes to the summary in the chat, never on your own initiative.
- **logout** — `node "${CLAUDE_PLUGIN_ROOT}/scripts/factory-login.js" logout`. Revokes the token in factory and removes it, and any queued time, from this machine.

Which factory is used: the project's `crew.json` `factory` block picks `environment` (`prod` by default, or `dev`) or a `url`. On a single machine, `CREW_FACTORY_ENV` or `CREW_FACTORY_URL` override it.
