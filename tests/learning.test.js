const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { fromEval } = require('../scripts/learning');
const root = path.resolve(__dirname, '..');

function project(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-learning-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'crew.json'), JSON.stringify({ stack: { specs: [{ area: 'backend', kind: 'doc', ref: 'docs/stack/node.md' }] } }));
  return dir;
}
const learning = (dir, ...args) => spawnSync(process.execPath, [path.join(root, 'scripts', 'metrics.js'), 'learning', ...args, '--cwd', dir], { encoding: 'utf8', windowsHide: true });

test('a record keeps the date and three closed values, nothing else, out of version control', t => {
  const dir = project(t);
  assert.equal(learning(dir, 'record', '--kind', 'defect', '--stage', 'cause', '--origin', 'stack:backend').status, 0);
  const [line] = fs.readFileSync(path.join(dir, '.crew', 'learning.jsonl'), 'utf8').trim().split('\n');
  assert.deepEqual(Object.keys(JSON.parse(line)).sort(), ['at', 'kind', 'origin', 'stage']);
  assert.match(JSON.parse(line).at, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(fs.readFileSync(path.join(dir, '.crew', '.gitignore'), 'utf8'), /^learning\.jsonl$/m);
});

test('values outside the closed lists are refused', t => {
  const dir = project(t);
  assert.match(learning(dir, 'record', '--kind', 'defect', '--stage', 'design', '--origin', 'method').stdout, /stage for defect/);
  assert.match(learning(dir, 'record', '--kind', 'feature', '--stage', 'test', '--origin', 'stack:mobile').stdout, /origin must be/);
  assert.match(learning(dir, 'record', '--kind', 'feature', '--stage', 'test', '--origin', 'role:somebody').stdout, /origin must be/);
  assert.equal(learning(dir, 'record', '--kind', 'feature', '--stage', 'test', '--origin', 'role:qa-test-architect').status, 0);
  assert.ok(!fs.readFileSync(path.join(dir, '.crew', 'learning.jsonl'), 'utf8').includes('mobile'));
});

test('the retro sends a repeated stack failure to the project and a repeated method failure to crew', t => {
  const dir = project(t);
  for (let i = 0; i < 2; i++) {
    learning(dir, 'record', '--kind', 'defect', '--stage', 'cause', '--origin', 'stack:backend');
    learning(dir, 'record', '--kind', 'feature', '--stage', 'criteria', '--origin', 'method');
  }
  learning(dir, 'record', '--kind', 'refactor', '--stage', 'pin', '--origin', 'method');
  const out = learning(dir, 'retro').stdout;
  assert.match(out, /\| stack:backend \| defect \| cause \| 2 \| Project: propose a change to docs\/stack\/node\.md/);
  assert.match(out, /\| method \| feature \| criteria \| 2 \| crew: proposal in the plugin's proposals\/ for the execution craft/);
  assert.doesNotMatch(out, /refactor/, 'a failure seen once is a note');
});

const runs = (acceptance, interventions = 0) => ({
  meta: { pluginVersion: '1.0.0', date: 'd' },
  runs: ['feature-discount', 'defect-rounding'].map((task) => ({ task, kind: 'feature', variant: 'crew', acceptance: { passed: acceptance, total: 4 },
    regression: true, interventions, durationMs: 1000, usage: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0, cost: 0.1 }, error: null })),
});

test('compare accepts a change only when no task gets worse', t => {
  const dir = project(t);
  const write = (name, data) => { const f = path.join(dir, name); fs.writeFileSync(f, JSON.stringify(data)); return f; };
  const base = write('a.json', runs(3));
  const same = learning(dir, 'compare', base, write('b.json', runs(4)));
  assert.equal(same.status, 0);
  assert.match(same.stdout, /Verdict: incorporable/);
  const worse = learning(dir, 'compare', base, write('c.json', runs(2)));
  assert.equal(worse.status, 1);
  assert.match(worse.stdout, /feature-discount got worse in acceptance/);
  assert.equal(learning(dir, 'compare', base, write('d.json', runs(3, 1))).status, 1, 'more interventions is worse');
});

test('failing crew runs of the delivery evaluation become method entries', () => {
  const entries = fromEval({ runs: [
    { task: 'defect-rounding', kind: 'defect', variant: 'crew', acceptance: { passed: 2, total: 4 }, regression: true, interventions: 1 },
    { task: 'defect-rounding', kind: 'defect', variant: 'bare', acceptance: { passed: 0, total: 4 }, regression: true, interventions: 0 },
  ] });
  assert.deepEqual(entries.map((e) => `${e.origin}:${e.kind}:${e.stage}`), ['method:defect:verify', 'method:defect:reproduce']);
});

test('a kind that is a built-in object name is refused, not crashed on', t => {
  const dir = project(t);
  const run = learning(dir, 'record', '--kind', 'constructor', '--stage', 'x', '--origin', 'method');
  assert.equal(run.status, 1);
  assert.match(run.stdout, /kind must be one of/);
});
