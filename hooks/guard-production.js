// PreToolUse hook on shell tools and MCP tools: work that names production asks
// the human first.
//
//   · A shell command that names production (prod, production, producción, prd,
//     or an environment selector set to it) and runs a database client, a cloud
//     or cluster CLI, a migration tool, a remote shell or a package runner.
//   · An MCP tool that queries data or executes something, with production named
//     in its input.
//
// The decision is "ask", in every project, with or without crew.json: the human
// confirms or refuses that one call. Reads ask too — a query copies production
// data into the conversation. Never a denial: work on production is sometimes
// the right work, and only the human can say so. The reason names the signal and
// the tool, never the command text, which may hold credentials.
//
// Fails open, with a line on stderr: this is a confirmation, not an evasion guard.
// A target hidden in a variable (`psql $DATABASE_URL`) is invisible here; the
// session baseline covers it.
const { readFileSync } = require("node:fs");
const { loadConfig } = require("./lib/config");
const { commandOf } = require("./lib/shell");
const { shellProduction, mcpProduction } = require("./lib/production");
const { findRoot } = require("./lib/ceilings");
const { record } = require("./lib/audit");

const SHELL_TOOLS = /^(Bash|PowerShell|shell|local_shell|exec_command|container\.exec)$/;

try {
  const input = JSON.parse(readFileSync(0, "utf8").replace(/^\uFEFF/, ""));
  const tool = String(input.tool_name || "");
  const hit = SHELL_TOOLS.test(tool)
    ? shellProduction(commandOf(input.tool_input))
    : mcpProduction(tool, input.tool_input);
  if (hit) {
    const cwd = input.cwd || process.cwd();
    record(findRoot(cwd), loadConfig(cwd), { guard: "production", decision: "ask", rule: `production:${hit.tool}` });
    process.stdout.write(JSON.stringify({ hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason:
        `Crew: this call names production ("${hit.signal}") and runs ${hit.tool}. Confirm only if you ` +
        `mean to act on production, and know the exact target and effect. [docs/en/enforcement.md in the crew plugin]`,
    } }));
  }
} catch (error) {
  process.stderr.write(`crew production guard could not evaluate this call (${error.message}); no confirmation was requested.\n`);
}
process.exit(0);
