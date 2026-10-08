const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { isExempt } = require('../hooks/lib/ceilings');
const root = path.resolve(__dirname, '..');

function fixture(t, config) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-guard-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  if (config) put(dir, 'crew.json', JSON.stringify(config));
  return dir;
}
function put(dir, file, text) {
  const target = path.join(dir, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text);
  return target;
}
function run(script, input) {
  const out = spawnSync(process.execPath, [path.join(root, 'hooks', script + '.js')], {
    input: JSON.stringify(input), encoding: 'utf8', cwd: input.cwd, windowsHide: true,
    env: { ...process.env, PLUGIN_ROOT: '', CLAUDE_PLUGIN_ROOT: '' },
  });
  assert.equal(out.status, 0, out.stderr);
  return out.stdout.trim() ? JSON.parse(out.stdout).hookSpecificOutput : null;
}
const shell = (cwd, command, tool_name = 'Bash') => run('guard-shell', { cwd, tool_name, tool_input: { command } });

test('shell guard denies hook bypass in crew projects, in both modes; notice without crew.json', t => {
  for (const mode of ['team', 'solo']) {
    const dir = fixture(t, { mode });
    for (const cmd of ['git commit --no-verify -m "x"', 'git commit -nm "x"', 'git -c core.hooksPath=/dev/null commit -m x', 'git config core.hooksPath .nohooks']) {
      assert.equal(shell(dir, cmd).permissionDecision, 'deny', `${mode}: ${cmd}`);
    }
  }
  const legacy = fixture(t, null);
  const out = shell(legacy, 'git commit --no-verify -m x');
  assert.equal(out.permissionDecision, undefined);
  assert.match(out.additionalContext, /switches off the git hooks/);
});

test('shell guard reads flags, never the words inside quotes or a dry-run push', t => {
  const dir = fixture(t, { mode: 'team' });
  assert.equal(shell(dir, 'git commit -m "document why --no-verify is denied"'), null);
  assert.equal(shell(dir, 'git commit -am "x"'), null);
  assert.equal(shell(dir, 'git push -n origin main'), null);
  assert.equal(shell(dir, 'npm test'), null);
});

test('destructive commands get a notice and are never denied; Codex argv commands are read', t => {
  const dir = fixture(t, { mode: 'team', quality: 'enforce' });
  for (const cmd of ['rm -rf build', 'git reset --hard HEAD~1', 'git push --force origin main', 'psql -c "DROP TABLE users"', 'Remove-Item -Recurse -Force .\\dist']) {
    const out = shell(dir, cmd);
    assert.equal(out.permissionDecision, undefined, cmd);
    assert.match(out.additionalContext, /destructive command/, cmd);
  }
  const codex = run('guard-shell', { cwd: dir, tool_name: 'shell', tool_input: { command: ['bash', '-lc', 'git commit --no-verify -m x'] } });
  assert.equal(codex.permissionDecision, 'deny');
});

test('policy guard: relaxing crew.json or host settings is denied under team enforce unless registered', t => {
  const dir = fixture(t, { mode: 'team', quality: 'enforce', metrics: true });
  const file = path.join(dir, 'crew.json');
  const write = content => run('guard-policy', { cwd: dir, tool_name: 'Write', tool_input: { file_path: file, content } });
  const relaxed = JSON.stringify({ mode: 'team', quality: 'advise', metrics: true });
  assert.match(write(relaxed).permissionDecisionReason, /crew\.json quality/);
  assert.equal(write(JSON.stringify({ mode: 'team', quality: 'enforce', metrics: true, testing: { guide: 'x' } })), null, 'tightening passes');
  put(dir, 'docs/DEVIATIONS.md', '<!-- crew:policy\ncrew.json quality   # migration window · owner: ana · expires: 2999-01-01\n-->\n');
  assert.equal(write(relaxed), null, 'a registered relaxation passes');
  put(dir, 'docs/DEVIATIONS.md', '<!-- crew:policy\ncrew.json quality   # migration window · expires: 2000-01-01\n-->\n');
  assert.equal(write(relaxed).permissionDecision, 'deny', 'an expired registration no longer applies');
  const settings = path.join(dir, '.claude', 'settings.json');
  const out = run('guard-policy', { cwd: dir, tool_name: 'Write', tool_input: { file_path: settings, content: '{"disableAllHooks": true}' } });
  assert.match(out.permissionDecisionReason, /settings disableAllHooks/);
});

test('policy guard is a notice under advise, in solo, and without crew.json', t => {
  for (const config of [{ mode: 'team', quality: 'advise' }, { mode: 'solo', quality: 'enforce' }]) {
    const dir = fixture(t, config);
    const out = run('guard-policy', { cwd: dir, tool_name: 'Write', tool_input: { file_path: path.join(dir, 'crew.json'), content: JSON.stringify({ ...config, quality: 'off' }) } });
    assert.equal(out.permissionDecision, undefined);
    assert.match(out.additionalContext, /relaxes a control/);
  }
});

test('Codex apply_patch reaches the policy guard', t => {
  const dir = fixture(t, { mode: 'team', quality: 'enforce' });
  const out = run('codex-pre-tool', { cwd: dir, tool_name: 'apply_patch', tool_input: { command:
    '*** Begin Patch\n*** Update File: crew.json\n@@\n-{"mode":"team","quality":"enforce"}\n+{"mode":"team","quality":"off"}\n*** End Patch' } });
  assert.equal(out.permissionDecision, 'deny');
});

test('an expired code-quality exemption stops applying', t => {
  const dir = fixture(t, { mode: 'team' });
  put(dir, 'docs/DEVIATIONS.md', '<!-- crew:exempt\nsrc/gen/**   # generated · expires: 2000-01-01\nsrc/flat/**  # flat data · owner: ana · expires: 2999-12-31\n-->\n');
  assert.equal(isExempt(dir, path.join(dir, 'src/gen/a.ts')), false);
  assert.equal(isExempt(dir, path.join(dir, 'src/flat/a.ts')), true);
});
