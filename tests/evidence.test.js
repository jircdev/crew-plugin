const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createHash } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { fingerprint } = require('../hooks/lib/code-state');
const root = path.resolve(__dirname, '..');
const ok = { kind: 'unit', cmd: 'node -e "process.exit(0)"' };

function repo(t, testing) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-evidence-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'crew.json'), JSON.stringify({ mode: 'team', testing }));
  fs.mkdirSync(path.join(dir, 'src'));
  fs.writeFileSync(path.join(dir, 'src', 'a.js'), 'module.exports = 1;\n');
  const git = (...args) => spawnSync('git', args, { cwd: dir, windowsHide: true });
  git('init', '-q');
  git('add', '-A');
  git('-c', 'user.name=t', '-c', 'user.email=t@example.invalid', 'commit', '-qm', 'init');
  return { dir, git };
}

function verify(dir) {
  spawnSync(process.execPath, [path.join(root, 'scripts/verify.js'), '--cwd', dir], { encoding: 'utf8', windowsHide: true });
  const receipts = path.join(dir, 'docs/verification/receipts');
  const newest = fs.readdirSync(receipts).map((f) => [f, fs.statSync(path.join(receipts, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];
  return newest.replace(/\.json$/, '').split('-').pop();
}

const TABLE = '## Estimation\n\n| Milestone | Est. hours | Started | Finished | Actual hours | Notes |\n|---|---|---|---|---|---|\n| A | 1 | 2000-01-01 00:00 Z | 2000-01-01 01:00 Z | 1 | |\n| **Total** | 1 | — | — | 1 | |\n';

function close(dir, rows, criteria = '') {
  const file = path.join(dir, 'docs/stories/f/001-x.md');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const body = (s) => `# 001\n\n- **Status:** ${s}\n\n${criteria}${TABLE}\n## Verification\n\n| Scenario | Level | Harness | Artifact | Status |\n|---|---|---|---|---|\n${rows.join('\n')}\n`;
  fs.writeFileSync(file, body('Validated'));
  const run = spawnSync(process.execPath, [path.join(root, 'hooks/guard-estimation.js')], { encoding: 'utf8', windowsHide: true,
    input: JSON.stringify({ cwd: dir, tool_name: 'Write', tool_input: { file_path: file, content: body('Closed') } }) });
  return run.stdout.trim() ? JSON.parse(run.stdout).hookSpecificOutput.permissionDecisionReason : null;
}

test('the code fingerprint follows code content, ignores docs and survives a commit', t => {
  const { dir, git } = repo(t, { commands: [ok] });
  const before = fingerprint(dir);
  fs.mkdirSync(path.join(dir, 'docs'));
  fs.writeFileSync(path.join(dir, 'docs', 'note.md'), 'x');
  fs.writeFileSync(path.join(dir, 'README.md'), 'x');
  assert.equal(fingerprint(dir), before, 'documentation must not count');
  fs.writeFileSync(path.join(dir, 'src', 'a.js'), 'module.exports = 2;\n');
  const changed = fingerprint(dir);
  assert.notEqual(changed, before);
  fs.writeFileSync(path.join(dir, 'src', 'b.js'), 'module.exports = 3;\n');
  assert.notEqual(fingerprint(dir), changed, 'an untracked file counts');
  const withB = fingerprint(dir);
  git('add', '-A');
  git('-c', 'user.name=t', '-c', 'user.email=t@example.invalid', 'commit', '-qm', 'more');
  assert.equal(fingerprint(dir), withB);
});

test('a receipt taken before the code changed cannot close a passing row', t => {
  const { dir } = repo(t, { commands: [ok], receipts: true });
  const first = verify(dir);
  assert.equal(close(dir, [`| s | unit | node | t.js | passing (receipt: ${first}) |`]), null);
  fs.writeFileSync(path.join(dir, 'src', 'a.js'), 'module.exports = 2;\n');
  assert.match(close(dir, [`| s | unit | node | t.js | passing (receipt: ${first}) |`]), /taken before the code changed/);
  const second = verify(dir);
  assert.equal(close(dir, [`| s | unit | node | t.js | passing (receipt: ${second}) |`]), null);
});

test('a receipt from before code fingerprints is still accepted on the old rule', t => {
  const { dir } = repo(t, { commands: [ok], receipts: true });
  const body = { command: ok.cmd, kind: 'unit', exitCode: 0, startedAt: 'a', finishedAt: 'b', head: null, dirty: false, outputTail: '' };
  const id = createHash('sha256').update(JSON.stringify(body)).digest('hex').slice(0, 12);
  const receipts = path.join(dir, 'docs/verification/receipts');
  fs.mkdirSync(receipts, { recursive: true });
  fs.writeFileSync(path.join(receipts, `2026-01-01-${id}.json`), JSON.stringify({ id, ...body }));
  assert.equal(close(dir, [`| s | unit | node | t.js | passing (receipt: ${id}) |`]), null);
});

const CRITERIA = '## Acceptance criteria\n\n1. A discount applies before tax.\n2. A discount over 100 is rejected.\n\n';

test('with testing.criteria, every numbered criterion needs a verification row that cites it', t => {
  const { dir } = repo(t, { commands: [ok], criteria: true });
  assert.match(close(dir, ['| AC1 discount before tax | unit | node | t.js | passing |'], CRITERIA), /AC2 are cited by no verification row/);
  assert.equal(close(dir, ['| AC1 discount before tax | unit | node | t.js | passing |', '| AC2 over 100 | unit | node | t.js | not verified — pending |'], CRITERIA), null);
});

test('without testing.criteria, uncited criteria close as before', t => {
  const { dir } = repo(t, { commands: [ok] });
  assert.equal(close(dir, ['| discount | unit | node | t.js | passing |'], CRITERIA), null);
});
