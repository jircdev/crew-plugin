// SessionStart hook: inject the crew standard baseline into every session, and
// append at most a few lines of project-configuration status.
//
// Cost: one local file read for the baseline, plus (only when the project has a
// crew.json) the config walk-up and the migration registry. No network, no scan.
//
// Notice policy — deliberately narrow, because a notice that fires every session
// is a notice nobody reads:
//   · no crew.json at all        → silence (legacy rule: behave exactly as before)
//   · marker absent              → the project predates the marker. One actionable
//                                  line, permanently silenced by running setup —
//                                  including "seen it, I want nothing", which
//                                  still writes the marker.
//   · REQUIRED migration pending → notify until resolved.
//   · optional capability unused → NEVER notify. A project with no interface is
//                                  not behind for declaring no design capability.
//   · unrecognized capability    → name it. Silent degradation is the failure this
//                                  line exists to prevent.
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { loadConfig } = require("./lib/config.js");

const root = process.env.CLAUDE_PLUGIN_ROOT || join(__dirname, "..");

try {
  process.stdout.write(readFileSync(join(root, "standards", "session-context.md"), "utf8"));
} catch {
  // A missing baseline must never break the session.
}

// Numeric semver compare; anything unparseable sorts as 0 so a malformed marker
// degrades to "notify nothing extra" instead of throwing.
function cmp(a, b) {
  const pa = String(a || "").split(".").map((n) => parseInt(n, 10) || 0);
  const pb = String(b || "").split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  }
  return 0;
}

function pluginVersion() {
  try {
    return JSON.parse(readFileSync(join(root, ".claude-plugin", "plugin.json"), "utf8")).version;
  } catch {
    return null;
  }
}

function pendingRequired(from) {
  try {
    const registry = JSON.parse(readFileSync(join(root, "migrations.json"), "utf8"));
    return (registry.migrations || []).filter((m) => m.required && cmp(m.version, from) > 0);
  } catch {
    return [];
  }
}

try {
  const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const config = loadConfig(cwd);
  if (config) {
    const lines = [];
    const version = pluginVersion();

    if (!config.configuredWith) {
      lines.push(
        `- This project was configured before the crew setup marker existed${version ? ` (plugin is now ${version})` : ""}. ` +
          "Run `/crew:setup` to see what can be declared — it asks before writing anything, and " +
          "accepting the current state as-is closes this notice for good."
      );
    } else {
      for (const m of pendingRequired(config.configuredWith)) {
        lines.push(
          `- Required migration pending since ${m.version} — ${m.title}. ` +
            `Configured with ${config.configuredWith}. See \`${m.doc}\`, then run \`/crew:setup\`.`
        );
      }
    }

    for (const unknown of (config.design && config.design.unknown) || []) {
      lines.push(
        `- \`crew.json\` declares \`design.${unknown}\`, which this plugin version does not recognize. ` +
          "That capability is treated as unavailable — the roles will say so rather than assume it."
      );
    }

    if (lines.length) {
      process.stdout.write(`\n## crew — project configuration\n\n${lines.join("\n")}\n`);
    }
  }
} catch {
  // Configuration status is a convenience; it must never break the session.
}
