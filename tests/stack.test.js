const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { loadConfig } = require('../hooks/lib/config');
const { diagnose } = require('../scripts/doctor');
const root = path.resolve(__dirname, '..');

function fixture(t, config) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-stack-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'crew.json'), JSON.stringify(config));
  return dir;
}

const SPECS = [
  { area: 'frontend', kind: 'skill', ref: 'react-conventions' },
  { kind: 'doc', ref: 'docs/stack/shared.md' },
  { area: 'backend', kind: 'pack', ref: 'node' },
  { area: 'data', kind: 'doc' },
  { area: 'infra', ref: 'docs/stack/infra.md' },
];

test('crew.json stack transports usable specs and names the unusable ones', t => {
  const { stack } = loadConfig(fixture(t, { stack: { specs: SPECS } }));
  assert.deepEqual(stack.specs, [
    { area: 'frontend', kind: 'skill', ref: 'react-conventions' },
    { area: 'all', kind: 'doc', ref: 'docs/stack/shared.md' },
  ]);
  assert.deepEqual(stack.unknown, ['specs[2].kind=pack', 'specs[3].ref=missing', 'specs[4].kind=missing']);
});

test('an absent stack section stays null', t => {
  assert.equal(loadConfig(fixture(t, { mode: 'solo' })).stack, null);
});

test('session start names an unusable stack declaration', t => {
  const dir = fixture(t, { configuredWith: '1.1.0', stack: { specs: SPECS } });
  const run = spawnSync(process.execPath, [path.join(root, 'hooks', 'session-start.js')], {
    input: JSON.stringify({ cwd: dir }), encoding: 'utf8', cwd: dir, windowsHide: true,
    env: { ...process.env, PLUGIN_ROOT: '', CLAUDE_PLUGIN_ROOT: '' },
  });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /`stack\.specs\[2\]\.kind=pack`, which this plugin version does not recognize/);
  assert.match(run.stdout, /`stack\.specs\[3\]\.ref=missing`, which is incomplete/);
});

test('doctor reports a declared stack document that does not exist', t => {
  const dir = fixture(t, { configuredWith: '1.1.0', stack: { specs: SPECS } });
  const titles = diagnose(dir).map((f) => `${f.what} ${f.evidence}`).join('\n');
  assert.match(titles, /stack\.specs \(all\) points at a missing path/);
  assert.match(titles, /crew\.json stack\.specs\[2\]\.kind=pack is not usable/);
  assert.doesNotMatch(titles, /react-conventions/);
});

test('the session baseline states that stack specifications belong to the project', () => {
  const baseline = fs.readFileSync(path.join(root, 'standards', 'session-context.md'), 'utf8');
  assert.match(baseline, /Stack specifications belong to the project/);
  assert.match(baseline, /under `stack` in `crew\.json`/);
});
