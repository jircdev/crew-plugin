# Installation

The plugin id is `crew@factory-crew` (marketplace `factory-crew`, plugin `crew`). Install is configured in your user `settings.json` — **not** via `/plugin marketplace add`, which only registers a path on your own machine.

- macOS/Linux: `~/.claude/settings.json`
- Windows: `C:\Users\<user>\.claude\settings.json`

You declare the marketplace under `extraKnownMarketplaces` and enable the plugin under `enabledPlugins`. Pick **one** of the two flows below.

> **Editing `settings.json` by hand?** Add these two keys to the file that is already there — do not replace the whole file. Keep the JSON valid: every `{` needs its matching `}`, and no comma after the last item in a block. One stray comma stops the file from loading and the plugin will not appear.

## Consumer (recommended — installs from GitHub)

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

## Author / local development (edits the working tree)

For maintainers who edit the plugin and want their local clone to be the live source. Identical to the consumer config except the marketplace `source` points at the clone path — so it resolves **only** on your machine.

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

Consumers run `/plugin update crew@factory-crew`. Author/local-dev installs consume the working tree directly — just pull. For template changes, existing projects re-run `bin/init-project.sh` (which skips existing files) or merge the new template manually.

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
