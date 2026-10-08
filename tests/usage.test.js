const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');

function project(t, config = { mode: 'team' }, local = null) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-usage-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'crew.json'), JSON.stringify(config));
  if (local) { fs.mkdirSync(path.join(dir, '.crew')); fs.writeFileSync(path.join(dir, '.crew/local.json'), JSON.stringify(local)); }
  return dir;
}
const hook = (input, env = {}) => spawnSync(process.execPath, [path.join(root, 'hooks/record-usage.js')], {
  input: JSON.stringify(input), encoding: 'utf8', windowsHide: true, env: { ...process.env, CREW_TELEMETRY: '', ...env } });
const log = dir => { try { return fs.readFileSync(path.join(dir, '.crew/usage.jsonl'), 'utf8'); } catch { return ''; } };

test('nothing is recorded without a personal opt-in, even if the shared crew.json asks for it', t => {
  const dir = project(t, { mode: 'team', telemetry: true });
  hook({ cwd: dir, tool_name: 'Agent', tool_input: { subagent_type: 'crew:data-architect' } });
  assert.equal(log(dir), '');
});

test('with a personal opt-in, only the date, kind and a catalog name are stored — never prompt text', t => {
  const dir = project(t, { mode: 'team' }, { telemetry: true });
  hook({ cwd: dir, tool_name: 'Agent', tool_input: { subagent_type: 'crew:data-architect', prompt: 'salary of ana@acme.com' } });
  hook({ cwd: dir, tool_name: 'Skill', tool_input: { skill: 'crew:planning' } });
  hook({ cwd: dir, hook_event_name: 'UserPromptSubmit', prompt: 'SYS: the password is hunter2' });
  hook({ cwd: dir, hook_event_name: 'UserPromptSubmit', prompt: '/crew:zz private stuff' });
  const text = log(dir);
  for (const leak of ['ana@acme.com', 'salary', 'hunter2', 'private', 'zz']) assert.ok(!text.includes(leak), leak);
  const lines = text.trim().split('\n').map(l => JSON.parse(l));
  assert.deepEqual(lines.map(l => `${l.kind}:${l.name}`), ['agent:data-architect', 'skill:planning', 'command:sys', 'command:other']);
  assert.match(lines[0].at, /^\d{4}-\d{2}-\d{2}$/, 'date only, no time of day');
  assert.match(fs.readFileSync(path.join(dir, '.crew/.gitignore'), 'utf8'), /usage\.jsonl[\s\S]*local\.json/);
});

test('crew.json can forbid it for everyone; the env opt-in works; old lines are pruned and --purge deletes', t => {
  const forbidden = project(t, { mode: 'team', telemetry: false }, { telemetry: true });
  hook({ cwd: forbidden, tool_name: 'Skill', tool_input: { skill: 'planning' } }, { CREW_TELEMETRY: '1' });
  assert.equal(log(forbidden), '');
  const dir = project(t);
  fs.mkdirSync(path.join(dir, '.crew'));
  fs.writeFileSync(path.join(dir, '.crew/usage.jsonl'), JSON.stringify({ at: '2000-01-01', kind: 'agent', name: 'crew' }) + '\n');
  hook({ cwd: dir, tool_name: 'Skill', tool_input: { skill: 'design' } }, { CREW_TELEMETRY: '1' });
  assert.doesNotMatch(log(dir), /2000-01-01/);
  const report = spawnSync(process.execPath, [path.join(root, 'scripts/metrics.js'), 'catalog', '--cwd', dir], { encoding: 'utf8', windowsHide: true }).stdout;
  assert.match(report, /\| skill \| design \| 1 \| 1 \|/);
  assert.match(report, /Roles not used in 90 days: .*data-architect/);
  spawnSync(process.execPath, [path.join(root, 'scripts/metrics.js'), 'catalog', '--purge', '--cwd', dir], { windowsHide: true });
  assert.equal(log(dir), '');
});

test('the doctor blocks when a personal log is under version control', t => {
  const dir = project(t);
  spawnSync('git', ['init', '-q'], { cwd: dir, windowsHide: true });
  fs.mkdirSync(path.join(dir, '.crew'));
  fs.writeFileSync(path.join(dir, '.crew/usage.jsonl'), '{}\n');
  spawnSync('git', ['add', '-f', '.crew/usage.jsonl'], { cwd: dir, windowsHide: true });
  const out = JSON.parse(spawnSync(process.execPath, [path.join(root, 'scripts/doctor.js'), '--cwd', dir, '--json'], { encoding: 'utf8', windowsHide: true }).stdout);
  assert.ok(out.findings.some(f => f.what === 'a personal crew log is under version control' && f.severity === 'blocking'));
});
