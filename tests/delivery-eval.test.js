const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const ws = require('../scripts/lib/eval-workspace');
const { asks } = require('../scripts/lib/eval-agent');
const { aggregate, render } = require('../scripts/lib/eval-report');

const root = path.resolve(__dirname, '..');
const agent = path.join(__dirname, 'fixtures', 'fake-agent.js');

function evaluate(t, args, env = {}) {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-eval-out-'));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-eval-home-'));
  t.after(() => { fs.rmSync(out, { recursive: true, force: true }); fs.rmSync(home, { recursive: true, force: true }); });
  const run = spawnSync(process.execPath, [path.join(root, 'scripts', 'eval-delivery.js'), '--agent', agent, '--out', out, ...args], {
    encoding: 'utf8', windowsHide: true, env: { ...process.env, ...env, HOME: home, USERPROFILE: home },
  });
  const json = fs.readdirSync(out).find((f) => f.endsWith('.json'));
  return { run, out, home, result: json ? JSON.parse(fs.readFileSync(path.join(out, json), 'utf8')) : null };
}

test('a full run records acceptance, own suite, interventions, time, tokens and cost for every task and variant', t => {
  const { run, result } = evaluate(t, ['--runs', '1']);
  assert.equal(run.status, 0, run.stderr);
  assert.equal(result.runs.length, 8);
  for (const r of result.runs) {
    assert.equal(r.acceptance.passed, r.acceptance.total, `${r.task} ${r.variant}`);
    assert.ok(r.acceptance.total > 0 && r.regression === true);
    assert.equal(r.interventions, 0);
    assert.ok(r.durationMs >= 0 && r.usage.cost > 0 && r.usage.input > 0);
  }
});

test('an agent that changes nothing fails acceptance and keeps the own suite green', t => {
  const { result } = evaluate(t, ['--tasks', 'defect-rounding', '--variants', 'bare', '--runs', '1'], { FAKE_AGENT: 'nothing' });
  const [r] = result.runs;
  assert.ok(r.acceptance.passed < r.acceptance.total);
  assert.ok(r.acceptance.failed.some((n) => /1.27/.test(n)), r.acceptance.failed.join('; '));
  assert.equal(r.regression, true);
});

test('a question the agent asks counts as one intervention, and the task clarification answers it', t => {
  const { result } = evaluate(t, ['--tasks', 'feature-discount', '--variants', 'crew', '--runs', '1'], { FAKE_AGENT: 'ask' });
  const [r] = result.runs;
  assert.equal(r.interventions, 1);
  assert.equal(r.acceptance.passed, r.acceptance.total);
  assert.equal(r.usage.turns, 2);
});

test('preflight aborts when the bare variant can see crew', t => {
  const { run, result } = evaluate(t, ['--runs', '1'], { FAKE_AGENT: 'leak' });
  assert.equal(run.status, 2);
  assert.match(run.stderr, /preflight \(bare\): crew is visible/);
  assert.equal(result, null);
});

test('the acceptance tests are out of the agent reach while it works', t => {
  const cwd = ws.prepareWorkspace();
  const plugin = ws.pluginCopy();
  t.after(() => { ws.remove(cwd); ws.remove(plugin); });
  assert.ok(!fs.existsSync(path.join(cwd, '.acceptance')));
  assert.ok(fs.existsSync(path.join(cwd, 'src', 'invoices.js')));
  assert.ok(!fs.existsSync(path.join(plugin, 'evals')) && !fs.existsSync(path.join(plugin, 'tests')));
  assert.ok(fs.existsSync(path.join(plugin, 'skills', 'planning', 'SKILL.md')));
});

test('a run leaves the person configuration untouched', t => {
  const { home } = evaluate(t, ['--tasks', 'defect-rounding', '--runs', '1']);
  assert.deepEqual(fs.readdirSync(home), []);
});

test('a reply that ends in a question is waiting for a person', () => {
  assert.equal(asks('I will add it.\nShould discounts apply per item?'), true);
  assert.equal(asks('Done. All tests pass.'), false);
  assert.equal(asks('Should I? Done anyway.'), false);
});

test('the report compares crew against no crew per task', () => {
  const run = (variant, passed, cost) => ({ task: 'x', variant, acceptance: { passed, total: 4 }, regression: true,
    interventions: 0, durationMs: 60000, usage: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0, cost }, error: null });
  const rows = aggregate([run('crew', 4, 0.5), run('bare', 2, 0.3)]);
  assert.equal(rows.find((r) => r.variant === 'crew').acceptance, 1);
  const md = render({ meta: { pluginVersion: '9.9.9', model: null, runs: 1, date: 'now' }, runs: [run('crew', 4, 0.5), run('bare', 2, 0.3)] });
  assert.match(md, /\| x \| 50% \| 0\.0 \| 0\.0 \| 0\.20 \|/);
});

test('model and session values that a shell could run are refused', () => {
  const claude = path.join(root, 'scripts', 'lib', 'eval-claude.js');
  for (const req of [{ model: 'opus&calc' }, { resume: 'abc|calc' }]) {
    const run = spawnSync(process.execPath, [claude], { input: JSON.stringify({ prompt: 'x', cwd: os.tmpdir(), ...req }), encoding: 'utf8', windowsHide: true,
      env: { ...process.env, CREW_EVAL_CLAUDE: 'definitely-not-a-command' } });
    assert.match(JSON.parse(run.stdout).result, /refused/);
  }
});
