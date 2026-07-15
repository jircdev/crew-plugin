# Installation

You are installing the **crew** plugin from the **factory-crew** marketplace, hosted at the GitHub repo `jircdev/crew-plugin`. Pick whichever method fits — they all end up at the same place.

## Easiest — ask Claude

This is the complete path, start to finish. You don't need to know any commands or touch anything by hand.

**1. Ask in plain language.** In Claude (Desktop or CLI) type:

```
install the crew plugin: add the GitHub marketplace jircdev/crew-plugin, then install crew@factory-crew
```

Claude runs the install for you.

**2. Fully restart Claude.** Quit it completely and reopen — a reload is not enough; the plugin config is only read at startup.

> **On Windows:** closing the window does not quit Claude — it keeps running in the background. Go to the **^** caret ("Show hidden icons") in the taskbar, right-click the Claude icon and choose **Quit**. Only then reopen it.

**3. Verify it loaded.** Type `/crew:` in the prompt. If the role commands autocomplete (`/crew:sys`, `/crew:da`, …), you are done. If nothing appears, see [Troubleshooting](#troubleshooting).

**4. Approve the hooks the first time.** On the first session after enabling, Claude asks you to approve the plugin's hooks — a one-time prompt; accept it. If you never see that prompt but the commands appear, the hooks were already approved — nothing is wrong.

That's it. The sections below are alternative ways to install by hand.

## Other ways to install

### Two terminal commands

If you prefer to run them yourself instead of asking Claude:

```bash
claude plugin marketplace add jircdev/crew-plugin
claude plugin install crew@factory-crew
```

No JSON to edit. Then restart and verify as in steps 2–4 above.

### Claude Desktop (point-and-click)

In the Claude desktop app, open the plugin manager (**Customize → Plugins**), add the marketplace from the repository `jircdev/crew-plugin`, then find **crew** under Browse and click **Install**. This is the most non-technical path; full walkthrough in the [official guide](https://support.claude.com/en/articles/13837440-use-plugins-in-claude). Then restart and verify as in steps 2–4 above.

## Advanced — pin it in `settings.json` (teams, reproducible setup)

Declaring the plugin in your user `settings.json` makes the install reproducible and easy to share. The file lives at:

- macOS/Linux: `~/.claude/settings.json`
- Windows: `C:\Users\<user>\.claude\settings.json`

> **Editing `settings.json` by hand?** Add the two keys below to the file that is already there — do not replace the whole file. Keep the JSON valid: every `{` needs its matching `}`, and no comma after the last item in a block. One stray comma stops the file from loading and the plugin will not appear.

### From GitHub (any machine)

For anyone using the plugin without editing it. Resolves on any machine.

```json
{
  "extraKnownMarketplaces": {
    "factory-crew": {
      "source": {
        "source": "github",
        "repo": "jircdev/crew-plugin"
      }
    }
  },
  "enabledPlugins": {
    "crew@factory-crew": true
  }
}
```

### From a local clone (plugin authors)

For maintainers who edit the plugin and want their local clone to be the live source. Identical to the GitHub config except the marketplace `source` points at the clone path — so it resolves **only** on your machine.

```json
{
  "extraKnownMarketplaces": {
    "factory-crew": {
      "source": {
        "source": "directory",
        "path": "C:/w/crew-plugin"
      }
    }
  },
  "enabledPlugins": {
    "crew@factory-crew": true
  }
}
```

## Restart and verify

`settings.json` is read only at startup, so **fully quit and reopen Claude Code** after editing it — a reload is not enough.

**Did it work?** Type `/crew:` in the prompt. If the role commands autocomplete (`/crew:sys`, `/crew:da`, …), you are done. If nothing appears, the plugin did not load — see [Troubleshooting](#troubleshooting).

On the first session after enabling, Claude Code asks you to approve the plugin's hooks — a one-time prompt; accept it. If you never see that prompt but the commands appear, the hooks were already approved — nothing is wrong.

## Update the plugin

Consumers run `/plugin update crew@factory-crew`. Author/local-dev installs consume the working tree directly — just pull. For template changes, existing projects re-run `bin/init-project.sh` (which skips existing files) or merge the new template manually. Customizations you made to scaffolded files always survive an update — nothing overwrites them; how to reconcile your copies with a new baseline is in [using-crew.md § Customize the scaffolded docs](using-crew.md#customize-the-scaffolded-docs).

## Remove the plugin

Removal is the install in reverse — edit the same `settings.json`:

1. Delete the `"crew@factory-crew": true` entry from `enabledPlugins`.
2. Delete the `factory-crew` block from `extraKnownMarketplaces`.
3. Restart Claude Code.

The GUI **Remove** button alone is not enough: it clears the plugin cache but not `settings.json`, so on the next startup the marketplace is re-registered from the file and the chip reappears. `settings.json` is the source of truth — remove the entries there. To purge the leftover registry without waiting for a restart, you can also empty `~/.claude/plugins/known_marketplaces.json` (Windows: `C:\Users\<user>\.claude\plugins\known_marketplaces.json`) to `{}`.

## Troubleshooting

- **Plugin never appears / `/crew:*` not found.** Check the settings key is exactly `extraKnownMarketplaces`. A key named `marketplaces` is silently ignored — the marketplace is never registered and nothing errors.
- **Works for you but not for teammates.** The marketplace `source` is `directory` with a local `path`. A local path exists only on your machine; everyone else must use the `github` source above.
- **Edited settings but nothing changed.** You did not restart. Claude Code only reads `settings.json` at startup.
- **Removed it but the chip keeps coming back.** The GUI Remove does not edit `settings.json`. See [Remove the plugin](#remove-the-plugin) above.
- **Installed but no `/crew:` commands appear.** The marketplace registered but the plugin did not finish loading. Fully quit Claude Code (not just reload) and reopen. If it still does not appear, remove `crew@factory-crew` from the `/plugin` menu and add it again. Maintainers with a local clone can switch the marketplace `source` to `directory` (see the author flow above), which loads the plugin in place and skips the download step.
