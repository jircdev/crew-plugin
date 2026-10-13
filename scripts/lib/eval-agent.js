// One task, one variant, one run: drive the agent until it stops asking, and
// count what a human would have had to do. The agent is any command that
// honors the JSON contract of eval-claude.js, so tests swap in a scripted one.
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const DEFAULT_AGENT = path.join(__dirname, 'eval-claude.js');
const MAX_ROUNDS = 3;
const PROCEED = 'Proceed with your best judgment and finish the task without asking again.';

function call(agent, request) {
  const run = spawnSync(process.execPath, [agent || DEFAULT_AGENT], {
    input: JSON.stringify(request), encoding: 'utf8', windowsHide: true, maxBuffer: 64 * 1024 * 1024,
  });
  try {
    return JSON.parse(run.stdout);
  } catch {
    return { is_error: true, result: (run.stderr || run.stdout || 'agent produced no JSON').slice(0, 2000) };
  }
}

// A turn that ends in a question is waiting for a person.
function asks(text) {
  const last = String(text || '').trim().split('\n').filter((l) => l.trim()).pop() || '';
  return /\?\s*\**\s*$/.test(last);
}

function addUsage(total, r) {
  const u = r.usage || {};
  total.input += u.input_tokens || 0;
  total.output += u.output_tokens || 0;
  total.cacheRead += u.cache_read_input_tokens || 0;
  total.cacheWrite += u.cache_creation_input_tokens || 0;
  total.cost += r.total_cost_usd || 0;
  total.turns += r.num_turns || 0;
}

// Every answer the runner has to give counts as one intervention: the first
// answer is the task's clarification (what a product owner would say), any
// later one only tells the agent to proceed.
function converse({ agent, task, cwd, variant, plugin, model }) {
  const usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0, turns: 0 };
  const started = Date.now();
  let r = call(agent, { prompt: task.prompt, cwd, variant, plugin, model, task: task.id });
  addUsage(usage, r);
  let interventions = 0;
  while (!r.is_error && asks(r.result) && interventions < MAX_ROUNDS) {
    const reply = interventions === 0 && task.clarification ? task.clarification : PROCEED;
    interventions += 1;
    r = call(agent, { prompt: reply, cwd, variant, plugin, model, task: task.id, resume: r.session_id });
    addUsage(usage, r);
  }
  return { interventions, usage, durationMs: Date.now() - started, error: r.is_error ? String(r.result).slice(0, 500) : null };
}

module.exports = { converse, call, asks, DEFAULT_AGENT };
