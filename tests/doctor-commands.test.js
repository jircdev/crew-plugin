const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');

function project(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-doctor-cmd-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  spawnSync('git', ['init', '-q'], { cwd: dir, windowsHide: true });
  fs.writeFileSync(path.join(dir, 'crew.json'), JSON.stringify({ mode: 'team' }));
  return dir;
}
const doctor = (dir, ...args) => spawnSync(process.execPath, [path.join(root, 'scripts/doctor.js'), ...args, '--cwd', dir], { encoding: 'utf8', windowsHide: true });

test('doctor standard prints a path standard and lists every item off it', t => {
  const dir = project(t);
  assert.match(doctor(dir, 'standard', 'docs/requirements/p/001-x.md').stdout, /Table "Estimation": Milestone \| Est\. hours/);
  assert.match(doctor(dir, 'standard').stdout, /Every work item follows its standard/);
  fs.mkdirSync(path.join(dir, 'docs/requirements/p'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'docs/requirements/p/001-x.md'), '# 001\n\n- **Status:** Draft\n');
  const out = doctor(dir, 'standard').stdout;
  assert.match(out, /1 work item\(s\) depart from their standard/);
  assert.match(out, /docs\/requirements\/p\/001-x\.md\n  - header field "Plan" is missing/);
  const diag = JSON.parse(doctor(dir, '--json').stdout).findings.find(f => /depart from their standard/.test(f.what));
  assert.match(diag.action, /\/crew:doctor standard/);
});

test('doctor security files a dated report and silences the session notice', t => {
  const dir = project(t);
  fs.mkdirSync(path.join(dir, '.claude'));
  fs.writeFileSync(path.join(dir, '.claude/settings.json'), JSON.stringify({ disableAllHooks: true }));
  const out = doctor(dir, 'security').stdout;
  assert.match(out, /SEC-HOOKS-OFF/);
  assert.match(out, /Report filed: docs\/security\/scan-\d{4}-\d{2}-\d{2}\.md/);
  const start = spawnSync(process.execPath, [path.join(root, 'hooks/session-start.js')], { input: JSON.stringify({ cwd: dir }), encoding: 'utf8', windowsHide: true,
    env: { ...process.env, CLAUDE_PLUGIN_ROOT: root, PLUGIN_ROOT: '' } }).stdout;
  assert.doesNotMatch(start, /crew — security/);
});
