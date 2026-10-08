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
const { summary } = require("./lib/work-state.js");
const { findRoot } = require("./lib/ceilings.js");

const root = process.env.PLUGIN_ROOT || process.env.CLAUDE_PLUGIN_ROOT || join(__dirname, "..");
let event = {};
try { event = JSON.parse(readFileSync(0, "utf8").replace(/^\uFEFF/, "")); } catch { /* Legacy/manual invocation. */ }

try {
  process.stdout.write(readFileSync(join(root, "standards", "session-context.md"), "utf8"));
  if (process.env.PLUGIN_ROOT) {
    process.stdout.write(`\n\nCrew plugin root: ${root}\n` + readFileSync(join(root, "integrations", "codex", "README.md"), "utf8"));
  }
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

// Factory capture health, one line at most. A missing token is the person's
// choice and stays silent; a rejected token, an unreachable factory or a
// missing person record are worth one line per session.
function factoryLines(config) {
  const { factoryMode, factoryToken, isRejected } = require("./lib/factory");
  if (!factoryMode(config)) return [];
  const { resolveFactory } = require("./lib/factory-env");
  const { readStatus } = require("./lib/activity-queue");
  const target = resolveFactory(config.factory);
  const out = target.warning ? [`- Factory: ${target.warning}.`] : [];
  const token = factoryToken();
  if (!token) return out;
  const problem = isRejected(token) ? "rejected" : readStatus().problem;
  const text = {
    rejected: "factory rejected this machine's token (revoked or expired), so capture is paused. " +
      "Run `/crew:factory login` to resume it.",
    unreachable: `factory (${target.api}) did not answer; captured time stays queued on this machine for up to 45 days.`,
    unavailable: `factory (${target.api}) answered with an error; captured time stays queued on this machine for up to 45 days.`,
    "no-person": "factory has no person record for this token's user; captured time stays queued until one is linked.",
  }[problem];
  if (text) out.push(`- Factory: ${text}`);
  return out;
}

try {
  const cwd = event.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
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

    // Two shapes reach `unknown`: a value this version does not know
    // (`kind=…`) and a declaration missing what makes it usable
    // (`ref=missing`). Both cost the capability, so both are reported — with
    // the wording that matches which one it is.
    for (const [section, cfg] of [
      ["design", config.design],
      ["testing", config.testing],
      ["factory", config.factory],
    ]) {
      for (const unknown of (cfg && cfg.unknown) || []) {
        const incomplete = unknown.endsWith("=missing");
        lines.push(
          `- \`crew.json\` declares \`${section}.${unknown}\`, which ` +
            (incomplete
              ? "is incomplete. "
              : "this plugin version does not recognize. ") +
            "That capability is treated as unavailable — the roles will say so rather than assume it."
        );
      }
    }

    lines.push(...factoryLines(config));

    if (lines.length) {
      process.stdout.write(`\n## crew — project configuration\n\n${lines.join("\n")}\n`);
    }
  }
} catch {
  // Configuration status is a convenience; it must never break the session.
}

// Security scan freshness: one line when the agent configuration (instructions,
// settings, MCP, agents) changed since the last recorded scan, or was never
// scanned. Only in crew projects; never runs the scan itself.
try {
  const cwd = event.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  if (loadConfig(cwd)) {
    const projectRoot = findRoot(cwd) || cwd;
    const { fingerprint } = require("../scripts/sec-scan.js");
    let last = null;
    try { last = JSON.parse(readFileSync(join(projectRoot, ".crew", "sec-scan.json"), "utf8")).hash; } catch { /* never scanned */ }
    if (fingerprint(projectRoot) !== last) {
      process.stdout.write(`\n## crew — security\n\n- The agent configuration ${last ? "changed since the last security scan" : "has no recorded security scan"}. ` +
        "Ask `security-compliance` to run `scripts/sec-scan.js --report` (read-only; secrets masked).\n");
    }
  }
} catch {
  // Never break the session over a notice.
}

// Work in progress, derived from the repo (never from transcripts): at most six
// lines, silent when nothing is in flight, and skipped in solo mode where the
// delivery circuit does not apply. Also runs after a compaction, which is when
// an open milestone is most easily forgotten.
try {
  const cwd = event.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const config = loadConfig(cwd);
  if (!(config && config.mode === "solo")) {
    const lines = summary(findRoot(cwd) || cwd);
    if (lines.length) process.stdout.write(`\n## crew — work in progress\n\n${lines.join("\n")}\n`);
  }
} catch {
  // Never break the session over a status line.
}
