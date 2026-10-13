#!/usr/bin/env node
// Delivery evaluation: does crew make an agent deliver correct software with
// less intervention, in less time and at lower cost? Runs every task of
// evals/delivery with and without crew and archives the result per version.
//
//   node scripts/eval-delivery.js [--tasks a,b] [--variants crew,bare] [--runs 3]
//                                 [--model <id>] [--agent <cmd.js>] [--out <dir>] [--keep] [--no-preflight]
//   node scripts/eval-delivery.js report <result.json> [<previous.json>]
//
// Real runs spend API money and need Claude Code signed in (or ANTHROPIC_API_KEY).
const fs = require('node:fs');
const path = require('node:path');
const ws = require('./lib/eval-workspace');
const { converse, call } = require('./lib/eval-agent');
const { render } = require('./lib/eval-report');

function parse(argv) {
  const opt = { tasks: [], variants: ['crew', 'bare'], runs: 3, out: path.join(ws.EVAL, 'results'), preflight: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = () => argv[++i];
    if (a === '--tasks') opt.tasks = val().split(',').filter(Boolean);
    else if (a === '--variants') opt.variants = val().split(',').filter(Boolean);
    else if (a === '--runs') opt.runs = Math.max(1, parseInt(val(), 10) || 1);
    else if (a === '--model') opt.model = val();
    else if (a === '--agent') opt.agent = path.resolve(val());
    else if (a === '--out') opt.out = path.resolve(val());
    else if (a === '--keep') opt.keep = true;
    else if (a === '--no-preflight') opt.preflight = false;
    else throw new Error(`unknown option: ${a}`);
  }
  return opt;
}

const PROBE = 'Reply with exactly the word CREW if a skill or command named crew:planning is available to you in this session, and with exactly NONE otherwise.';

// A variant that does not load what it claims makes every number meaningless:
// the bare variant must not see crew (the person's own setup leaking in), and
// the crew variant must.
function preflight(opt, plugin) {
  for (const variant of opt.variants) {
    const cwd = ws.tmp('crew-eval-probe-');
    const r = call(opt.agent, { prompt: PROBE, cwd, variant, plugin, model: opt.model });
    ws.remove(cwd);
    if (r.is_error) throw new Error(`preflight (${variant}): the agent failed — ${String(r.result).slice(0, 300)}`);
    const sees = /\bCREW\b/.test(r.result || '');
    if (sees !== (variant === 'crew')) throw new Error(`preflight (${variant}): crew is ${sees ? 'visible' : 'missing'}; the variants are not isolated`);
  }
}

function runOne(opt, task, variant, run, plugin) {
  const cwd = ws.prepareWorkspace();
  try {
    const talk = converse({ agent: opt.agent, task, cwd, variant, plugin, model: opt.model });
    const regression = ws.regression(cwd);
    const acceptance = ws.acceptance(task, cwd);
    return { task: task.id, kind: task.kind, variant, run, acceptance, regression, ...talk, workspace: opt.keep ? cwd : undefined };
  } finally {
    if (!opt.keep) ws.remove(cwd);
  }
}

function evaluate(opt) {
  const tasks = ws.loadTasks(opt.tasks);
  const plugin = ws.pluginCopy();
  try {
    if (opt.preflight) preflight(opt, plugin);
    const runs = [];
    for (const task of tasks) for (const variant of opt.variants) for (let run = 1; run <= opt.runs; run++) {
      process.stderr.write(`${task.id} · ${variant} · run ${run}/${opt.runs}\n`);
      runs.push(runOne(opt, task, variant, run, plugin));
    }
    return runs;
  } finally {
    ws.remove(plugin);
  }
}

function archive(opt, runs) {
  const version = JSON.parse(fs.readFileSync(path.join(ws.ROOT, '.claude-plugin', 'plugin.json'), 'utf8')).version;
  const date = new Date().toISOString();
  const result = { meta: { pluginVersion: version, model: opt.model || null, runs: opt.runs, date, agent: opt.agent ? 'custom' : 'claude' }, runs };
  fs.mkdirSync(opt.out, { recursive: true });
  const base = path.join(opt.out, `${version}-${date.slice(0, 16).replace(/[-:T]/g, '')}`);
  fs.writeFileSync(`${base}.json`, JSON.stringify(result, null, 2) + '\n');
  fs.writeFileSync(`${base}.md`, render(result));
  return base;
}

function main(argv) {
  if (argv[0] === 'report') {
    const read = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
    process.stdout.write(render(read(argv[1]), argv[2] ? read(argv[2]) : null));
    return 0;
  }
  const opt = parse(argv);
  const base = archive(opt, evaluate(opt));
  process.stdout.write(`${base}.md\n`);
  return 0;
}

if (require.main === module) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (e) {
    process.stderr.write(`crew delivery evaluation: ${e.message}\n`);
    process.exitCode = 2;
  }
}

module.exports = { parse, evaluate, archive, preflight };
