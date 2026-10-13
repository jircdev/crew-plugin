const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const { yamlBlock } = require('../scripts/lib/hook-manager');

function repo(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-hookmgr-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  spawnSync('git', ['init', '-q'], { cwd: dir, windowsHide: true });
  return dir;
}
const node = (script, ...args) => spawnSync(process.execPath, [path.join(root, 'scripts', script), ...args], { encoding: 'utf8', windowsHide: true });
const findings = dir => JSON.parse(node('doctor.js', '--cwd', dir, '--json').stdout).findings;
const gateFinding = dir => findings(dir).filter(f => /quality gate|pre-commit gate/.test(f.what));
const hookFile = dir => path.join(dir, '.git/hooks/pre-commit');

// The classroom wiring: a lefthook job resolving the newest cached plugin at run time.
const LEFTHOOK_WIRED = `pre-commit:
  jobs:
    - name: crew-quality-gate
      run: bash -c 'bash $(ls -d ~/.claude/plugins/cache/factory-crew/crew/*/scripts/check-quality.sh | sort -V | tail -1)'
pre-push:
  jobs:
    - run: npm test
`;

test('lefthook: a gate wired as a pre-commit job satisfies the doctor', t => {
  const dir = repo(t);
  fs.writeFileSync(path.join(dir, 'lefthook.yml'), LEFTHOOK_WIRED);
  assert.deepEqual(gateFinding(dir), []);
});

test('lefthook-local.yml wiring counts; a pre-push-only gate does not', t => {
  const dir = repo(t);
  fs.writeFileSync(path.join(dir, 'lefthook.yml'), 'pre-push:\n  jobs:\n    - run: bash check-quality.sh\n');
  const [missing] = gateFinding(dir);
  assert.equal(missing.what, 'the pre-commit quality gate is not wired into Lefthook');
  assert.match(missing.action, /name: crew-quality-gate/);
  assert.doesNotMatch(missing.action, /"/, 'the snippet must carry no double quotes (Lefthook on Windows)');
  fs.writeFileSync(path.join(dir, 'lefthook-local.yml'), LEFTHOOK_WIRED);
  assert.deepEqual(gateFinding(dir), []);
});

test('lefthook: a literal path to a missing script is blocking', t => {
  const dir = repo(t);
  fs.writeFileSync(path.join(dir, 'lefthook.yml'), "pre-commit:\n  jobs:\n    - run: bash '/nowhere/crew/scripts/check-quality.sh'\n");
  const [stale] = gateFinding(dir);
  assert.equal(stale.severity, 'blocking');
  assert.equal(stale.what, 'the pre-commit gate points at a missing script');
});

test('lefthook: repair and init print the job and never write .git/hooks/pre-commit', t => {
  const dir = repo(t);
  fs.writeFileSync(path.join(dir, 'lefthook.yml'), 'pre-push:\n  jobs:\n    - run: npm test\n');
  const before = fs.readFileSync(path.join(dir, 'lefthook.yml'), 'utf8');
  const init = node('init-project.js', '--target', dir);
  assert.match(init.stdout, /manual:\s+lefthook\.yml/);
  const rep = node('doctor.js', 'repair', '--cwd', dir);
  assert.equal(rep.status, 0, rep.stderr);
  assert.match(rep.stdout, /Lefthook owns the pre-commit hook/);
  assert.match(rep.stdout, /run: bash '.*\/scripts\/check-quality\.sh'/);
  assert.ok(!fs.existsSync(hookFile(dir)), 'repair must not write a hook Lefthook regenerates');
  assert.equal(fs.readFileSync(path.join(dir, 'lefthook.yml'), 'utf8'), before, 'crew never edits the manager config');
});

test('husky: .husky/pre-commit is where the gate is looked for and suggested', t => {
  const dir = repo(t);
  fs.mkdirSync(path.join(dir, '.husky'));
  fs.writeFileSync(path.join(dir, '.husky/pre-commit'), 'npx lint-staged\n');
  const [missing] = gateFinding(dir);
  assert.equal(missing.what, 'the pre-commit quality gate is not wired into husky');
  assert.equal(missing.evidence, '.husky/pre-commit');
  node('doctor.js', 'repair', '--cwd', dir);
  assert.ok(!fs.existsSync(hookFile(dir)));
  assert.equal(fs.readFileSync(path.join(dir, '.husky/pre-commit'), 'utf8'), 'npx lint-staged\n');
  fs.appendFileSync(path.join(dir, '.husky/pre-commit'), `bash '${root.replace(/\\/g, '/')}/scripts/check-quality.sh' || exit 1\n`);
  assert.deepEqual(gateFinding(dir), []);
  const un = node('doctor.js', 'uninstall', '--cwd', dir, '--dry-run');
  assert.match(un.stdout, /keep the crew gate in \.husky\/pre-commit/);
});

test('core.hooksPath without a known manager points the doctor at that directory', t => {
  const dir = repo(t);
  spawnSync('git', ['config', 'core.hooksPath', 'githooks'], { cwd: dir, windowsHide: true });
  const [missing] = gateFinding(dir);
  assert.equal(missing.what, 'the pre-commit quality gate is not wired into core.hooksPath');
  assert.equal(missing.evidence, 'githooks/pre-commit');
});

test('no manager: the direct .git/hooks/pre-commit behavior is unchanged', t => {
  const dir = repo(t);
  assert.equal(gateFinding(dir)[0].what, 'the pre-commit quality gate is not installed');
  node('doctor.js', 'repair', '--cwd', dir);
  assert.match(fs.readFileSync(hookFile(dir), 'utf8'), /check-quality\.sh/);
  assert.deepEqual(gateFinding(dir), []);
});

test('yamlBlock stops at the next top-level key', () => {
  assert.match(yamlBlock(LEFTHOOK_WIRED, 'pre-commit'), /crew-quality-gate/);
  assert.doesNotMatch(yamlBlock(LEFTHOOK_WIRED, 'pre-commit'), /npm test/);
});
