// Stop hook: closure-trace reminder. If the repo follows the crew standard
// (docs/work/ exists) and there are commits dated today but no work entry
// dated today, block the stop once with a reminder. Conventions without
// enforcement drift — this is the enforcement. Anything unexpected fails open.
// Modes (crew.json): team-only — in solo the delivery circuit does not apply.
const { readFileSync, readdirSync, existsSync } = require("node:fs");
const { execSync } = require("node:child_process");
const { join } = require("node:path");
const { loadConfig } = require("./lib/config");

function git(args, cwd) {
  return execSync(`git ${args}`, { cwd, stdio: ["ignore", "pipe", "ignore"] })
    .toString()
    .trim();
}

try {
  const input = JSON.parse(readFileSync(0, "utf8").replace(/^﻿/, ""));
  if (input.stop_hook_active) process.exit(0);

  const cwd = input.cwd || process.cwd();
  const root = git("rev-parse --show-toplevel", cwd);
  if (!root) process.exit(0);

  const cfg = loadConfig(root);
  if (cfg && cfg.mode === "solo") process.exit(0);

  const workDir = join(root, "docs", "work");
  if (!existsSync(workDir)) process.exit(0); // project does not follow the standard

  // local date as YYYY-MM-DD (the hook runs on the user's machine)
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const commitsToday = git(
    `log --since="${today} 00:00:00" --format=%H -1 HEAD`,
    root,
  );
  if (!commitsToday) process.exit(0);

  const month = today.slice(0, 7);
  const monthDir = join(workDir, month);
  const hasEntry =
    existsSync(monthDir) &&
    readdirSync(monthDir).some((f) => f.startsWith(today) && f.endsWith(".md"));
  if (hasEntry) process.exit(0);

  process.stdout.write(
    JSON.stringify({
      decision: "block",
      reason:
        `There are commits dated today (${today}) but no docs/work/${month}/${today}-*.md entry. ` +
        `The crew standard requires a work entry for every significant closed iteration ` +
        `(format: docs/work/README.md — What changed / Why / How / Promoted knowledge / Follow-ups). ` +
        `Write it now, or skip explicitly if the change is below the significance bar ` +
        `(self-evident fixes, minor renames, doc-only changes).`,
    }),
  );
} catch {
  // Fail open: a guard bug must never block legitimate work.
}
process.exit(0);
