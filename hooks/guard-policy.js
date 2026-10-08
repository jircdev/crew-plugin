// PreToolUse hook on Edit/Write: an agent must not quietly relax the controls
// it works under. Relaxing means lowering `quality`, turning off `metrics` or
// `testing`, switching to `solo`, raising ceilings, disabling hooks in the
// host settings or granting bypass permissions (lib/policy.js lists them).
//
// A relaxation is allowed when the project registered its key, with a
// rationale and an unexpired date, in the crew:policy block of
// docs/DEVIATIONS.md. Otherwise: denied in a team project with
// `quality: enforce`, a notice everywhere else.
//
// FAIL CLOSED when the project is governed and the file is a policy file: an
// error here must not become the way to switch the guards off.
const { readFileSync, existsSync } = require("node:fs");
const { dirname } = require("node:path");
const { configFor } = require("./lib/config");
const { findRoot } = require("./lib/ceilings");
const { readBlock } = require("./lib/deviation-lines");
const { relaxations, kindOf } = require("./lib/policy");

function emit(output) {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", ...output } }));
  process.exit(0);
}
const deny = (reason) => emit({ permissionDecision: "deny",
  permissionDecisionReason: reason + " [Why blocked & how to fix: docs/en/enforcement.md in the crew plugin]" });

function resulting(input, current) {
  if (input.tool_name === "Write") return input.tool_input.content || "";
  const oldStr = input.tool_input.old_string || "";
  if (!oldStr || !current.includes(oldStr)) return null;
  const newStr = input.tool_input.new_string || "";
  return input.tool_input.replace_all ? current.split(oldStr).join(newStr) : current.replace(oldStr, newStr);
}

let cfg = null;
let path = "";
try {
  const input = JSON.parse(readFileSync(0, "utf8").replace(/^\uFEFF/, ""));
  if (input.tool_name !== "Edit" && input.tool_name !== "Write") process.exit(0);
  path = (input.tool_input && input.tool_input.file_path) || "";
  if (!kindOf(path)) process.exit(0);
  cfg = configFor(path, input.cwd);

  const current = existsSync(path) ? readFileSync(path, "utf8") : "";
  const next = resulting(input, current);
  if (next === null) process.exit(0);

  const found = relaxations(path, current, next);
  if (!found.length) process.exit(0);
  const root = findRoot(dirname(path)) || dirname(path);
  const registered = readBlock(root, "policy").filter((e) => !e.expired && e.reason);
  const missing = found.filter((key) => !registered.some((e) => e.rule.toLowerCase() === key.toLowerCase()));
  if (!missing.length) process.exit(0);

  const detail = `This edit relaxes a control the agents work under (${missing.join(", ")}). A relaxation ` +
    `is a project decision: register each key with its rationale (and ideally an owner and an expiry) in the ` +
    `crew:policy block of docs/DEVIATIONS.md, e.g. "${missing[0]}   # why · owner: … · expires: YYYY-MM-DD", ` +
    `after the owner agrees. Never relax it to get past a guard.`;
  if (cfg && cfg.mode !== "solo" && cfg.quality === "enforce") deny(`Policy relaxation denied: ${detail}`);
  emit({ additionalContext: `Crew notice: ${detail}` });
} catch {
  if (cfg && kindOf(path)) deny("The crew policy guard could not evaluate this edit to a policy file, so it is " +
    "denied (this guard fails closed). Make the edit in smaller steps or ask the user to make it.");
}
process.exit(0);
