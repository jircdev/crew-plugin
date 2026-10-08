const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { stale } = require('../scripts/lib/as-is-freshness');
const root = path.resolve(__dirname, '..');

function repo(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-adopt-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const git = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8', windowsHide: true });
  git('init', '-q');
  fs.writeFileSync(path.join(dir, 'a.js'), 'one\n');
  git('add', '.'); git('-c', 'user.name=t', '-c', 'user.email=t@example.invalid', 'commit', '-qm', 'one');
  return { dir, head: git('rev-parse', 'HEAD').stdout.trim() };
}
const spec = (commit, files) => `# Cap\n\n- **Commit:** ${commit}\n- **Files read:** ${files}\n- **Deferred:** None\n`;

test('an as-is spec is fresh until a file it was read from changes', t => {
  const { dir, head } = repo(t);
  fs.mkdirSync(path.join(dir, 'docs/as-is'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'docs/as-is/cap.md'), spec(head, '`a.js`'));
  assert.deepEqual(stale(dir), []);
  fs.appendFileSync(path.join(dir, 'a.js'), 'two\n');
  const found = stale(dir);
  assert.equal(found.length, 1);
  assert.match(found[0].evidence, /a\.js changed since/);
});

test('an as-is spec without commit, or with an unknown one, is reported for re-extraction', t => {
  const { dir } = repo(t);
  fs.mkdirSync(path.join(dir, 'docs/as-is'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'docs/as-is/none.md'), '# Cap\n');
  fs.writeFileSync(path.join(dir, 'docs/as-is/gone.md'), spec('deadbeefdeadbeef', 'a.js'));
  const what = stale(dir).map(f => f.what).sort();
  assert.deepEqual(what, ["an as-is spec records no commit or files", "an as-is spec's commit is not in this repository"]);
});

test('team scaffold seeds the as-is folder; the adopt command and its Codex skill exist', t => {
  const { dir } = repo(t);
  spawnSync(process.execPath, [path.join(root, 'scripts/init-project.js'), '--target', dir], { windowsHide: true });
  assert.ok(fs.existsSync(path.join(dir, 'docs/as-is/README.md')));
  assert.match(fs.readFileSync(path.join(root, 'skills/adopt/SKILL.md'), 'utf8'), /agents\/researcher\.md/);
});
