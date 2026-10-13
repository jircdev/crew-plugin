#!/usr/bin/env node
// Scripted stand-in for Claude Code in the delivery-evaluation tests. Honors
// the eval-claude.js contract. FAKE_AGENT selects the behavior:
//   solve (default) — copy the reference solution of the task into the workspace
//   ask             — ask one question first, solve after the answer
//   nothing         — change nothing
//   leak            — claim crew is visible in every variant (fails preflight)
const fs = require('node:fs');
const path = require('node:path');

const req = JSON.parse(fs.readFileSync(0, 'utf8'));
const mode = process.env.FAKE_AGENT || 'solve';
const reply = (result, extra = {}) => process.stdout.write(JSON.stringify({
  result, session_id: 'fake-session', num_turns: 1, total_cost_usd: 0.01,
  usage: { input_tokens: 100, output_tokens: 50, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }, ...extra,
}));

if (/crew:planning/.test(req.prompt)) {
  const visible = mode === 'leak' || (req.variant === 'crew' && fs.existsSync(path.join(req.plugin, 'skills', 'planning')));
  reply(visible ? 'CREW' : 'NONE');
} else if (mode === 'ask' && !req.resume) {
  reply('Should the change also cover credit notes?');
} else if (mode === 'nothing') {
  reply('I looked at it and left it as is.');
} else {
  fs.cpSync(path.join(__dirname, 'delivery-solutions', req.task), req.cwd, { recursive: true });
  reply('Done.');
}
