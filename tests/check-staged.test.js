const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const script = path.resolve(__dirname, '..', 'scripts', 'check-staged.js');

function repo(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-gate-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  spawnSync('git', ['init', '-q'], { cwd: dir, windowsHide: true });
  return dir;
}
const git = (dir, args, input) => spawnSync('git', args, { cwd: dir, input, encoding: 'utf8', windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
const gate = (dir, ...args) => spawnSync(process.execPath, [script, ...args], { cwd: dir, encoding: 'utf8', windowsHide: true });

test('--all checks every tracked file even when the listing exceeds 1 MB', t => {
  const dir = repo(t);
  // Index entries only (no working-tree files): a listing well over Node's 1 MB default buffer.
  const blob = git(dir, ['hash-object', '-w', '--stdin'], '').stdout.trim();
  const entries = Array.from({ length: 20000 }, (_, i) => `100644 ${blob} 0\tpad/${String(i).padStart(6, '0')}-${'x'.repeat(60)}.txt`);
  const r = git(dir, ['update-index', '--index-info'], entries.join('\n') + '\n');
  assert.equal(r.status, 0, r.stderr);
  fs.writeFileSync(path.join(dir, 'big.js'), 'x\n'.repeat(400));
  git(dir, ['add', 'big.js']);
  assert.ok(git(dir, ['ls-files']).stdout.length > 1024 * 1024, 'fixture listing must exceed 1 MB');
  const out = gate(dir, '--all');
  assert.equal(out.status, 1, out.stderr);
  assert.match(out.stderr, /big\.js — 400 lines/);
});

test('a listing that fails is a loud failure, never an empty pass', t => {
  const dir = repo(t);
  fs.writeFileSync(path.join(dir, 'a.js'), 'x\n');
  git(dir, ['add', 'a.js']);
  fs.writeFileSync(path.join(dir, '.git', 'index'), 'not an index');
  for (const args of [['--all'], []]) {
    const out = gate(dir, ...args);
    assert.equal(out.status, 2, `${args.join(' ')}: ${out.stderr}`);
    assert.match(out.stderr, /could not list the files to check/);
  }
});

test('staged mode still passes clean and catches an oversized staged file', t => {
  const dir = repo(t);
  fs.writeFileSync(path.join(dir, 'ok.js'), 'x\n');
  git(dir, ['add', 'ok.js']);
  assert.equal(gate(dir).status, 0);
  fs.writeFileSync(path.join(dir, 'big.js'), 'x\n'.repeat(400));
  git(dir, ['add', 'big.js']);
  const out = gate(dir);
  assert.equal(out.status, 1);
  assert.match(out.stderr, /big\.js/);
});
