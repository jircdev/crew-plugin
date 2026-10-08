// PreToolUse hook on shell tools (Claude Bash/PowerShell, Codex shell names).
//
//   · Hook bypass — `--no-verify`, `git commit -n`, `core.hooksPath`: these
//     silently switch off the pre-commit quality gate crew installs. Denied in
//     every project that has a crew.json, in both modes. Without crew.json the
//     legacy rule holds (no new denial), so it is a notice.
//   · Destructive commands — recursive forced deletes, hard resets, forced
//     pushes, DROP/TRUNCATE: a notice asking for the exact targets and the way
//     back. Never a denial: a destructive command is often the right command.
//
// FAIL CLOSED on internal error, unlike every other crew guard, but only for a
// command that mentions git in a crew project: for an evasion guard, "the guard
// crashed" and "the guard was evaded" end the same way, so an error must not
// open the door. Everything else fails open.
const { readFileSync } = require("node:fs");
const { loadConfig } = require("./lib/config");
const { commandOf, hookBypass, destructive } = require("./lib/shell");

const SHELL_TOOLS = /^(Bash|PowerShell|shell|local_shell|exec_command|container\.exec)$/;

function emit(output) {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", ...output } }));
  process.exit(0);
}
const deny = (reason) => emit({ permissionDecision: "deny",
  permissionDecisionReason: reason + " [Why blocked & how to fix: docs/en/enforcement.md in the crew plugin]" });

let input = null;
let cmd = "";
let governed = false;
try {
  input = JSON.parse(readFileSync(0, "utf8").replace(/^\uFEFF/, ""));
  if (!SHELL_TOOLS.test(String(input.tool_name || ""))) process.exit(0);
  cmd = commandOf(input.tool_input);
  if (!cmd) process.exit(0);
  governed = !!loadConfig(input.cwd || process.cwd());

  const bypass = hookBypass(cmd);
  if (bypass) {
    const detail = `\`${bypass}\` switches off the git hooks this project relies on, including the crew ` +
      `quality gate. Run the command without it; if the gate is wrong for this change, fix the code or ` +
      `pre-register the exception in docs/DEVIATIONS.md — never skip the gate.`;
    if (governed) deny(`Hook bypass denied: ${detail}`);
    emit({ additionalContext: `Crew notice: ${detail}` });
  }

  const hits = destructive(cmd);
  if (hits.length) {
    emit({ additionalContext:
      `Crew notice — destructive command (${hits.join(", ")}). Before running it, state the exact targets ` +
      `it will affect and how to undo it (a backup, a branch, a migration down). If you cannot name both, ` +
      `do not run it; ask the user.` });
  }
} catch {
  if (governed && /\bgit\b/.test(cmd)) {
    deny("The crew shell guard could not evaluate this git command, so it is denied (this guard fails " +
      "closed: an error must not become a way around the hooks). Simplify the command and retry.");
  }
}
process.exit(0);
