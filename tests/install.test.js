const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');

function repo(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-install-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  spawnSync('git', ['init', '-q'], { cwd: dir, windowsHide: true });
  return dir;
}
const node = (script, ...args) => spawnSync(process.execPath, [path.join(root, 'scripts', script), ...args], { encoding: 'utf8', windowsHide: true });
const bash = (...args) => spawnSync('bash', [path.join(root, 'scripts/init-project.sh'), ...args], { encoding: 'utf8', windowsHide: true });

test('init: --dry-run writes nothing; a real run records every file it wrote and never overwrites', t => {
  const dir = repo(t);
  const dry = JSON.parse(node('init-project.js', '--target', dir, '--dry-run', '--json').stdout);
  assert.ok(dry.actions.some(a => a.path === 'crew.json' && a.action === 'wrote'));
  assert.deepEqual(fs.readdirSync(dir), ['.git']);
  fs.writeFileSync(path.join(dir, 'AGENTS.md'), 'mine');
  const real = bash('--target', dir);
  assert.equal(real.status, 0, real.stderr);
  assert.equal(fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8'), 'mine');
  const state = JSON.parse(fs.readFileSync(path.join(dir, '.crew/install-state.json'), 'utf8'));
  assert.ok(!state.files.some(f => f.path === 'AGENTS.md'), 'a pre-existing file is never recorded as crew\'s');
  assert.ok(state.files.some(f => f.path === 'docs/requirements/README.md'));
  assert.match(fs.readFileSync(path.join(dir, '.git/hooks/pre-commit'), 'utf8'), /check-quality\.sh/);
});

test('init migrates a pre-0.24 pre-commit hook in place', t => {
  const dir = repo(t);
  fs.mkdirSync(path.join(dir, '.git/hooks'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.git/hooks/pre-commit'), '#!/usr/bin/env bash\nbash "/x/crew/bin/check-quality.sh" || exit 1  # crew quality gate\n');
  const out = node('init-project.js', '--target', dir);
  assert.match(out.stdout, /migrated/);
  assert.match(fs.readFileSync(path.join(dir, '.git/hooks/pre-commit'), 'utf8'), /\/scripts\/check-quality\.sh/);
});

test('doctor reports against declarations; repair restores; uninstall keeps edited files', t => {
  const dir = repo(t);
  node('init-project.js', '--target', dir);
  let report = JSON.parse(node('doctor.js', '--cwd', dir, '--json').stdout).findings;
  assert.ok(!report.some(f => f.severity === 'blocking'), JSON.stringify(report));
  fs.rmSync(path.join(dir, 'docs/INDEX.md'));
  fs.writeFileSync(path.join(dir, 'crew.json'), JSON.stringify({ mode: 'team', configuredWith: '0.20.0', testing: { receipts: true } }));
  const run = node('doctor.js', '--cwd', dir, '--json');
  assert.equal(run.status, 1);
  report = JSON.parse(run.stdout).findings.map(f => f.what);
  assert.ok(report.includes('a scaffolded file is missing'));
  assert.ok(report.some(w => /required migration pending since 0\.23\.0/.test(w)));
  assert.ok(report.includes('testing.receipts without testing.commands'));
  node('doctor.js', 'repair', '--cwd', dir);
  assert.ok(fs.existsSync(path.join(dir, 'docs/INDEX.md')));
  fs.appendFileSync(path.join(dir, 'docs/MAINTAINING.md'), '\nour rule\n');
  node('doctor.js', 'uninstall', '--cwd', dir);
  assert.ok(fs.existsSync(path.join(dir, 'docs/MAINTAINING.md')), 'edited file kept');
  assert.ok(!fs.existsSync(path.join(dir, 'docs/INDEX.md')));
  assert.ok(!fs.existsSync(path.join(dir, '.crew')));
  assert.doesNotMatch(fs.readFileSync(path.join(dir, '.git/hooks/pre-commit'), 'utf8'), /crew quality gate/);
});
