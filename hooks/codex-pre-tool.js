// Codex transport only. Policy stays in the Claude-compatible Edit/Write guards.
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');
const { patchInputs } = require('./lib/patch-input');
const guards = ['guard-immutable', 'guard-estimation', 'guard-timestamps', 'guard-code-quality', 'guard-shape', 'guard-policy'];
function deny(reason) {
  return { hookSpecificOutput: { hookEventName: 'PreToolUse',
    permissionDecision: 'deny', permissionDecisionReason: reason } };
}
function evaluate(input) {
  if (input.tool_name !== 'apply_patch') return null;
  const notices = [];
  for (const edit of patchInputs(input)) {
    for (const guard of guards) {
      const run = spawnSync(process.execPath, [join(__dirname, `${guard}.js`)], {
        input: JSON.stringify(edit), encoding: 'utf8', timeout: 10000,
        cwd: input.cwd || process.cwd(), windowsHide: true,
      });
      if (run.error || run.status !== 0) throw new Error(`${guard} did not complete`);
      if (!run.stdout.trim()) continue;
      const output = JSON.parse(run.stdout);
      const decision = output.hookSpecificOutput;
      if (decision?.permissionDecision === 'deny') return output;
      if (decision?.permissionDecisionReason) notices.push(decision.permissionDecisionReason);
      if (decision?.additionalContext) notices.push(decision.additionalContext);
    }
  }
  // Do not emit an explicit allow: leave other hooks and host approval intact.
  return notices.length ? { hookSpecificOutput: { hookEventName: 'PreToolUse',
    additionalContext: [...new Set(notices)].join('\n') } } : null;
}
if (require.main === module) {
  let output;
  try { output = evaluate(JSON.parse(readFileSync(0, 'utf8').replace(/^\uFEFF/, ''))); }
  catch (error) {
    output = deny(`Crew could not evaluate this patch: ${error.message}. Use a smaller patch with unique exact context; do not bypass the guards using shell writes.`);
  }
  if (output) process.stdout.write(JSON.stringify(output));
}
module.exports = { evaluate };
