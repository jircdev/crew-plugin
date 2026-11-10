// Stop hook: the baseline's "Reply shape" made checkable. Reads the reply that
// closed the turn from the transcript; when it runs past the word, table or
// heading limits and the person did not ask for a report, plan or document,
// the stop is blocked once and the agent rewrites the reply short.
//
// Applies in solo and team alike (reply shape is conversation, not delivery
// ceremony); `quality: "off"` silences it. Blocks once per stop
// (stop_hook_active). Anything unexpected fails open.
const { readFileSync } = require("node:fs");
const { loadConfig } = require("./lib/config");
const { LIMITS, lastTurn, breaches } = require("./lib/reply");

try {
  const input = JSON.parse(readFileSync(0, "utf8").replace(/^\s+/, "")); // \s covers a byte-order mark
  if (input.stop_hook_active || !input.transcript_path) process.exit(0);
  const cfg = loadConfig(input.cwd || process.cwd());
  if (cfg && cfg.quality === "off") process.exit(0);

  const { prompt, reply } = lastTurn(readFileSync(input.transcript_path, "utf8"));
  const found = breaches(prompt, reply);
  if (!found.length) process.exit(0);

  process.stdout.write(JSON.stringify({
    decision: "block",
    reason:
      `Crew reply shape: the closing reply has ${found.join(", ")}. Nobody asked for a report, plan or ` +
      `document, so rewrite it as the baseline's "Reply shape" asks: verdict first, one line per question asked, ` +
      `no tables or headings, technical choices decided by you with a one-line reason, at most ${LIMITS.words} ` +
      `words. Send only the rewritten reply, with no apology or mention of this notice.` +
      " [Why blocked & how to fix: docs/en/enforcement.md in the crew plugin]",
  }));
} catch {
  // Fail open: a guard bug must never block legitimate work.
}
process.exit(0);
