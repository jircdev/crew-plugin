// Test-only hook for the runtime smoke: appends what the host sent (event,
// tool name, source, the keys of tool_input) to CREW_SMOKE_HOOK_LOG. It is
// copied into the isolated package only, never shipped, and never blocks.
const { readFileSync, appendFileSync } = require('node:fs');
try {
  const input = JSON.parse(readFileSync(0, 'utf8').replace(/^\uFEFF/, ''));
  if (process.env.CREW_SMOKE_HOOK_LOG) {
    appendFileSync(process.env.CREW_SMOKE_HOOK_LOG, JSON.stringify({
      event: input.hook_event_name, tool: input.tool_name || null, source: input.source || input.trigger || null,
      inputKeys: input.tool_input && typeof input.tool_input === 'object' ? Object.keys(input.tool_input) : null,
      host: process.env.PLUGIN_ROOT ? 'codex' : 'claude',
    }) + '\n');
  }
} catch { /* never interfere */ }
process.exit(0);
