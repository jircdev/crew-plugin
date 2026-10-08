// PostToolUse hook on Edit/Write: notice when the change in flight has grown
// past the size of its work item. The active item is the one with an open
// milestone (Started without Finished); its optional `Size:` sets the ceiling
// (trivial 3 files, small 10, standard 30, large none). Files counted are those
// changed since that milestone started, committed or not.
//
// Notice only, once per item and size, and silent when there is no single
// active item, no size, no git, or solo mode. Anything unexpected stays silent.
const { readFileSync, writeFileSync, existsSync } = require("node:fs");
const { join } = require("node:path");
const { tmpdir } = require("node:os");
const { createHash } = require("node:crypto");
const { spawnSync } = require("node:child_process");
const { loadConfig } = require("./lib/config");
const { findRoot } = require("./lib/ceilings");
const { state } = require("./lib/work-state");

const LIMIT = { trivial: 3, small: 10, standard: 30 };

function git(root, args) {
  const r = spawnSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true, timeout: 5000 });
  return r.status === 0 ? r.stdout.trim() : null;
}

function isoOf(stamp) {
  const m = String(stamp).match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s*(Z|[+-]\d{2}:?\d{2})?/);
  return m ? `${m[1]}T${m[2]}:00${m[3] || ""}` : null;
}

try {
  const input = JSON.parse(readFileSync(0, "utf8").replace(/^\uFEFF/, ""));
  if (input.tool_name !== "Edit" && input.tool_name !== "Write") process.exit(0);
  const cwd = input.cwd || process.cwd();
  const cfg = loadConfig(cwd);
  if (cfg && cfg.mode === "solo") process.exit(0);
  const root = findRoot(cwd) || cwd;

  const items = [...new Set(state(root).open.map((o) => o.file))];
  if (items.length !== 1) process.exit(0);
  const file = items[0];
  const head = readFileSync(join(root, file), "utf8").slice(0, 800);
  const size = ((head.match(/\*\*Size:\*\*\s*(trivial|small|standard|large)\b/i) || [])[1] || "").toLowerCase();
  if (!LIMIT[size]) process.exit(0);

  const started = state(root).open.filter((o) => o.file === file).map((o) => isoOf(o.started)).filter(Boolean).sort()[0];
  const base = started && git(root, ["rev-list", "-1", `--before=${started}`, "HEAD"]);
  const changed = new Set([
    ...((base && git(root, ["diff", "--name-only", base])) || "").split("\n"),
    ...(git(root, ["ls-files", "--others", "--exclude-standard"]) || "").split("\n"),
  ].filter(Boolean));
  if (changed.size <= LIMIT[size]) process.exit(0);

  const marker = join(tmpdir(), "crew-scope-" + createHash("sha256").update(`${root}|${file}|${size}`).digest("hex").slice(0, 16));
  if (existsSync(marker)) process.exit(0);
  writeFileSync(marker, String(changed.size));

  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext:
    `Crew scope notice: ${changed.size} files changed since the open milestone of \`${file}\` started, past the ` +
    `${LIMIT[size]} a "${size}" item anticipates. Re-size it out loud (the delivery circuit's Size rubric) and add ` +
    `the steps the new size needs, or split the extra work into its own item.` } }));
} catch {
  // Silent: a notice is never worth an error.
}
process.exit(0);
