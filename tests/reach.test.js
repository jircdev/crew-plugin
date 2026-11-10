const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');

function project(t, config = { mode: 'solo' }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-reach-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'crew.json'), JSON.stringify(config));
  return dir;
}
let n = 0;
const session = () => `s-${process.pid}-${Date.now()}-${n++}`;
const edit = (dir, id, rel) => {
  const r = spawnSync(process.execPath, [path.join(root, 'hooks/nudge-reach.js')], { encoding: 'utf8', windowsHide: true,
    input: JSON.stringify({ cwd: dir, session_id: id, tool_name: 'Edit', tool_input: { file_path: path.join(dir, rel) } }) });
  return r.stdout.trim() ? JSON.parse(r.stdout).hookSpecificOutput : null;
};

test('an edit that leaves the first area gets one notice per new area, in solo mode too', (t) => {
  const dir = project(t);
  const id = session();
  assert.equal(edit(dir, id, 'packages/frontend/src/login.tsx'), null, 'the first edit sets the area');
  assert.equal(edit(dir, id, 'packages/frontend/src/other.tsx'), null, 'same area');
  assert.match(edit(dir, id, 'packages/backend/src/auth.ts').additionalContext, /from packages\/frontend into packages\/backend/);
  assert.equal(edit(dir, id, 'packages/backend/src/session.ts'), null, 'notified once per area');
});

test('docs, work records and tests never count as reach', (t) => {
  const dir = project(t);
  const id = session();
  edit(dir, id, 'src/report.js');
  for (const rel of ['docs/guide.md', 'tests/report.test.js', 'README.md', 'docs/work/2026-11/x.md']) {
    assert.equal(edit(dir, id, rel), null, rel);
  }
});

test('a protected path asks the person once per session', (t) => {
  const dir = project(t, { mode: 'solo', scope: { protected: ['packages/backend/src/auth/**'] } });
  const id = session();
  const first = edit(dir, id, 'packages/backend/src/auth/guard.ts');
  assert.equal(first.permissionDecision, 'ask');
  assert.match(first.permissionDecisionReason, /never to make a behavior pass/);
  assert.notEqual((edit(dir, id, 'packages/backend/src/auth/guard.ts') || {}).permissionDecision, 'ask');
});

test('quality off silences it', (t) => {
  const dir = project(t, { quality: 'off', scope: { protected: ['**'] } });
  const id = session();
  assert.equal(edit(dir, id, 'a/x.js'), null);
  assert.equal(edit(dir, id, 'b/y.js'), null);
});
