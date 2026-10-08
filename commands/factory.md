---
description: Connect this machine to factory — login, status, logout
argument-hint: login | status | logout
---

Connect, check or disconnect this machine's factory token, the personal credential that lets crew send captured work time to factory and read its backlog.

Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/factory-login.js" $ARGUMENTS` from the project root (`status` when no argument was given). For `login`, run it in the background or with a timeout of at least six minutes: it waits until the person approves in the browser.

- **login** opens factory in the browser. Tell the person to read what capture records and approve there, then come back to the chat. If the browser did not open, show them the printed link. The token goes straight from factory to a file only they can read.
- **status** says which factory this machine talks to, as whom, and when the token expires.
- **logout** revokes the token in factory and removes it from this machine.

Relay the script's result in one or two plain sentences. The token never appears in its output. When someone offers to paste a token into the chat, ask them to keep it out of the conversation and use `login` instead. Pasting a token by hand into `~/.crew/factory-token` or `FACTORY_TOKEN` remains the fallback, documented in the plugin's `docs/en/factory.md`.

Which factory is used: the project's `crew.json` `factory` block picks `environment` (`prod` by default, or `dev`) or a `url`. On a single machine, `CREW_FACTORY_ENV` or `CREW_FACTORY_URL` override it.
