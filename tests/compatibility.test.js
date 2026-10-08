const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { patchInputs } = require('../hooks/lib/patch-input');
const { sync } = require('../scripts/sync-codex');
const { build } = require('../scripts/package-plugin');
const root = path.resolve(__dirname, '..');
function fixture(t, config = { mode: 'team', quality: 'enforce' }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-test-'));
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
function hook(file, input, env = {}, base = root) {
  const run = spawnSync(process.execPath, [path.join(base, 'hooks', file + '.js')], {
    input: JSON.stringify(input), encoding: 'utf8', env: { ...process.env, PLUGIN_ROOT: '', CLAUDE_PLUGIN_ROOT: '', ...env },
    cwd: input.cwd, windowsHide: true,
  });
  assert.equal(run.status, 0, run.stderr);
  return run.stdout.trim() ? JSON.parse(run.stdout) : null;
}
function patch(cwd, body) {
  return { cwd, hook_event_name: 'PreToolUse', tool_name: 'apply_patch',
    tool_input: { command: `*** Begin Patch\n${body}\n*** End Patch` } };
}
function decision(output) { return output?.hookSpecificOutput?.permissionDecision; }
function add(file, content) { return `*** Add File: ${file}\n` + content.trimEnd().split('\n').map(l => '+' + l).join('\n'); }

test('every command has a synchronized entry point; all 17 roles are reachable', () => {
  const outputs = sync(true);
  const joined = [...outputs.values()].join('\n');
  for (const role of fs.readdirSync(path.join(root, 'agents'))) assert.ok(joined.includes(`agents/${role}`), role);
  assert.equal(outputs.size, fs.readdirSync(path.join(root, 'commands')).length + 1);
});

test('parser reconstructs add, multiple hunks, CRLF, rename and delete without writing', t => {
  const dir = fixture(t);
  put(dir, 'a.txt', 'one\r\ntwo\r\nthree\r\nfour\r\n');
  const edits = patchInputs(patch(dir, '*** Update File: a.txt\n*** Move to: moved.txt\n@@\n one\n-two\n+TWO\n@@\n three\n-four\n+FOUR\n*** End of File\n' + add('new.txt', 'hello')));
  assert.equal(edits[0].tool_input.content, '');
  assert.equal(edits[1].tool_input.content, 'one\nTWO\nthree\nFOUR\n');
  assert.equal(edits[2].tool_input.content, 'hello\n');
  assert.equal(fs.existsSync(path.join(dir, 'moved.txt')), false);
  assert.equal(patchInputs(patch(dir, '*** Delete File: a.txt'))[0].tool_input.content, '');
});

test('unsupported and ambiguous patches deny with a correction, never silently pass', t => {
  const dir = fixture(t);
  put(dir, 'a.txt', 'same\nsame\n');
  for (const body of ['*** Update File: a.txt\n@@\n-same\n+other',
    '*** Update File: a.txt\n@@ jump\n-same\n+other',
    '*** Unexpected', '*** Delete File: a.txt\n*** Delete File: a.txt']) {
    assert.equal(decision(hook('codex-pre-tool', patch(dir, body))), 'deny');
  }
  assert.equal(hook('codex-pre-tool', { cwd: dir, tool_name: 'Bash' }), null);
});

test('function/class jump markers preserve skipped lines and disambiguate repeated bodies', t => {
  const dir = fixture(t);
  put(dir, 'module.py', 'class A:\n    def first():\n        old\nclass B:\n    def second():\n        old\n    def third():\n        tail\n');
  const input = patch(dir, '*** Update File: module.py\n@@ class B:\n@@ def second():\n-        old\n+        changed\n@@     def third():\n-        tail\n+        end\n*** End of File');
  input.tool_input.command = input.tool_input.command.replace('@@ class B:\n@@ def second():', '@@ class B:\n     def second():');
  const output = patchInputs(input)[0].tool_input.content;
  assert.equal(output, 'class A:\n    def first():\n        old\nclass B:\n    def second():\n        changed\n    def third():\n        end\n');
  const indented = patchInputs(patch(dir, '*** Update File: module.py\n@@ def second():\n-        old\n+        changed'));
  assert.ok(indented[0].tool_input.content.includes('first():\n        old'));
  assert.ok(indented[0].tool_input.content.includes('second():\n        changed'));
  assert.throws(() => patchInputs(patch(dir, '*** Update File: module.py\n@@ absent\n-        old\n+        changed')), /context was not found/);
});

test('immutable work entries deny edit, delete and move on both transports', t => {
  const dir = fixture(t);
  const relative = 'docs/work/2026-09/2026-09-07-test.md';
  const target = put(dir, relative, 'history\n');
  const legacy = hook('guard-immutable', { cwd: dir, tool_name: 'Write', tool_input: { file_path: target, content: 'changed\n' } });
  assert.equal(decision(legacy), 'deny');
  for (const body of [`*** Delete File: ${relative}`,
    `*** Update File: ${relative}\n@@\n-history\n+changed`,
    `*** Update File: ${relative}\n*** Move to: elsewhere.md\n@@\n-history\n+changed`]) {
    assert.deepEqual(hook('codex-pre-tool', patch(dir, body)), legacy);
  }
});

test('closed item immutability honors team versus solo in both transports', t => {
  for (const mode of ['team', 'solo']) {
    const dir = fixture(t, { mode });
    const relative = 'docs/stories/one.md';
    const target = put(dir, relative, '**Status:** Closed\n');
    const legacy = hook('guard-immutable', { cwd: dir, tool_name: 'Edit', tool_input: { file_path: target, old_string: 'Closed', new_string: 'Open' } });
    const adapted = hook('codex-pre-tool', patch(dir, `*** Update File: ${relative}\n@@\n-**Status:** Closed\n+**Status:** Open`));
    assert.equal(decision(legacy), mode === 'team' ? 'deny' : undefined);
    assert.deepEqual(adapted, legacy);
  }
});

test('closure estimation, declared testing and timestamps reuse canonical decisions', t => {
  for (const [config, content, guard] of [
    [{ mode: 'team' }, '**Status:** Closed\n', 'guard-estimation'],
    [{ mode: 'solo', testing: { guide: 'docs/testing.md' } }, '**Status:** Closed\n', 'guard-estimation'],
    [{ mode: 'solo', metrics: true }, '**Status:** Open\n## Estimation\n| Milestone | Est. hours | Started | Finished | Actual hours | Notes |\n|---|---|---|---|---|---|\n| A | 1 | 2000-01-01 00:00 Z | | | |\n', 'guard-timestamps'],
  ]) {
    const dir = fixture(t, config);
    const relative = 'docs/stories/new.md';
    const legacy = hook(guard, { cwd: dir, tool_name: 'Write', tool_input: { file_path: path.join(dir, relative), content } });
    assert.equal(decision(legacy), 'deny');
    assert.deepEqual(hook('codex-pre-tool', patch(dir, add(relative, content))), legacy);
  }
});

test('quality enforce/advise/off and absent config retain policy; every patch file is checked', t => {
  for (const quality of ['enforce', 'advise', 'off', null]) {
    const dir = fixture(t, quality ? { quality, ceilings: { module: 3 } } : null);
    const content = 'line\n'.repeat(205);
    const relative = 'src/file.js';
    const legacy = hook('guard-code-quality', { cwd: dir, tool_name: 'Write', tool_input: { file_path: path.join(dir, relative), content } });
    const adapted = hook('codex-pre-tool', patch(dir, add('ok.txt', 'ok') + '\n' + add(relative, content)));
    if (quality === 'advise') {
      assert.equal(decision(adapted), undefined);
      assert.equal(adapted.hookSpecificOutput.additionalContext, legacy.hookSpecificOutput.permissionDecisionReason);
    } else assert.deepEqual(adapted, legacy);
  }
});

test('session uses payload cwd; Codex gets adapter and Claude retains baseline', t => {
  const dir = fixture(t);
  for (const codex of [false, true]) {
    const run = spawnSync(process.execPath, [path.join(root, 'hooks/session-start.js')], {
      input: JSON.stringify({ cwd: dir }), encoding: 'utf8', cwd: root,
      env: { ...process.env, PLUGIN_ROOT: codex ? root : '', CLAUDE_PLUGIN_ROOT: root, CLAUDE_PROJECT_DIR: root }, windowsHide: true,
    });
    assert.equal(run.status, 0);
    assert.ok(run.stdout.includes('setup marker'));
    assert.equal(run.stdout.includes('# Crew in Codex'), codex);
  }
});

test('valid closure and historical timestamps are allowed; config walks from nested cwd', t => {
  const dir = fixture(t, { mode: 'solo', metrics: true });
  const content = '**Status:** Open\n## Estimation\n| Milestone | Est. hours | Started | Finished | Actual hours | Notes |\n|---|---|---|---|---|---|\n| A | 1 | 2000-01-01 00:00 Z | 2000-01-01 01:00 Z | 1 | |\n| **Total** | 1 | | | 1 | |\n';
  put(dir, 'docs/stories/valid.md', content);
  const nested = path.join(dir, 'docs');
  const input = patch(nested, '*** Update File: stories/valid.md\n@@\n-**Status:** Open\n+**Status:** Closed');
  assert.equal(hook('codex-pre-tool', input), null);
});

test('hook registrations preserve legacy handlers and include canonical apply_patch', () => {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'hooks/hooks.json'), 'utf8'));
  assert.equal(config.hooks.PreToolUse.find(group => group.matcher === 'Edit|Write').hooks.length, 5);
  assert.ok(config.hooks.PreToolUse.some(group => new RegExp(group.matcher).test('apply_patch')));
  for (const groups of Object.values(config.hooks)) for (const group of groups) for (const handler of group.hooks) {
    const script = handler.command.match(/\$\{CLAUDE_PLUGIN_ROOT\}\/([^" ]+)/)[1];
    assert.ok(fs.existsSync(path.join(root, script)));
  }
});

test('Stop checks work log without transcript assumptions; recursion and solo exit', t => {
  const dir = fixture(t);
  const git = args => {
    const run = spawnSync('git', args, { cwd: dir, encoding: 'utf8', windowsHide: true });
    assert.equal(run.status, 0, run.stderr);
  };
  git(['init']);
  put(dir, 'docs/work/README.md', 'Work log');
  git(['add', '.']);
  git(['-c', 'user.name=Crew Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'fixture']);
  assert.equal(hook('check-work-log', { cwd: dir }).decision, 'block');
  assert.equal(hook('check-work-log', { cwd: dir, stop_hook_active: true }), null);
  put(dir, 'crew.json', JSON.stringify({ mode: 'solo' }));
  assert.equal(hook('check-work-log', { cwd: dir }), null);
});

test('portable package contains both manifests, canonical references and executable guards', t => {
  const dir = fixture(t);
  const packaged = build(path.join(dir, 'crew'));
  assert.throws(() => build(packaged), /must not exist/);
  assert.equal(fs.existsSync(path.join(packaged, '.git')), false);
  for (const [relative] of sync(true)) {
    assert.ok(fs.existsSync(path.join(packaged, relative)), relative);
    if (!relative.endsWith('SKILL.md')) continue;
    const content = fs.readFileSync(path.join(packaged, relative), 'utf8');
    for (const [, ref] of content.matchAll(/\]\(([^)]+)\)/g)) {
      const resolved = path.resolve(packaged, path.dirname(relative), ref);
      assert.ok(resolved.startsWith(packaged + path.sep));
      assert.ok(fs.existsSync(resolved), ref);
    }
  }
  assert.equal(decision(hook('codex-pre-tool', patch(dir, add('huge.js', 'x\n'.repeat(205))), {}, packaged)), 'deny');
});
