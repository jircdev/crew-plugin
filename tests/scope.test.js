const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');

function repo(t, size) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-scope-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const git = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8', windowsHide: true });
  git('init', '-q');
  fs.writeFileSync(path.join(dir, 'crew.json'), JSON.stringify({ mode: 'team' }));
  git('add', '.'); git('-c', 'user.name=t', '-c', 'user.email=t@example.invalid', 'commit', '-qm', 'base');
  const item = path.join(dir, 'docs/requirements/p/001-x.md');
  fs.mkdirSync(path.dirname(item), { recursive: true });
  const stamp = new Date(Date.now() + 60000).toISOString().slice(0, 16).replace('T', ' ') + ' Z';
  fs.writeFileSync(item, `# 001\n\n- **Status:** In progress\n${size ? `- **Size:** ${size}\n` : ''}\n## Estimation\n\n| Milestone | Est. hours | Started | Finished | Actual hours | Notes |\n|---|---|---|---|---|---|\n| A | 1 | ${stamp} | | | |\n| **Total** | 1 | — | — | | |\n`);
  return dir;
}
const hook = cwd => {
  const r = spawnSync(process.execPath, [path.join(root, 'hooks/nudge-scope.js')], { encoding: 'utf8', windowsHide: true,
    input: JSON.stringify({ cwd, tool_name: 'Write', tool_input: { file_path: path.join(cwd, 'x') } }) });
  return r.stdout.trim() ? JSON.parse(r.stdout).hookSpecificOutput.additionalContext : null;
};

test('a trivial item that grows past three files gets one scope notice', t => {
  const dir = repo(t, 'trivial');
  assert.equal(hook(dir), null, 'one changed file is within size');
  for (let i = 0; i < 4; i++) fs.writeFileSync(path.join(dir, `f${i}.js`), 'x');
  assert.match(hook(dir), /past the 3 a "trivial" item anticipates/);
  assert.equal(hook(dir), null, 'notified once');
});

test('no size, large, or no single active item stays silent', t => {
  for (const size of [null, 'large']) {
    const dir = repo(t, size);
    for (let i = 0; i < 40; i++) fs.writeFileSync(path.join(dir, `f${i}.js`), 'x');
    assert.equal(hook(dir), null, String(size));
  }
});
