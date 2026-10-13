// Workspaces for the delivery evaluation (evals/delivery). Each run gets a
// fresh copy of the fixture project under the OS temp dir, as a git repo, so
// the agent works on something that looks like a real checkout. The
// acceptance tests stay outside it until the agent has finished; the plugin
// the crew variant loads is a copy without evals/ and tests/, so neither
// variant can read the answers.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const EVAL = path.join(ROOT, 'evals', 'delivery');
const PLUGIN_ENTRIES = ['.claude-plugin', '.codex-plugin', 'agents', 'commands', 'skills',
  'standards', 'templates', 'hooks', 'scripts', 'integrations', 'migrations.json', 'README.md', 'LICENSE'];

const tmp = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix));
const git = (cwd, args) => spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });

function loadTasks(ids) {
  const dir = path.join(EVAL, 'tasks');
  const all = fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, 'task.json')));
  const chosen = ids && ids.length ? ids : all;
  return chosen.map((id) => {
    if (!all.includes(id)) throw new Error(`unknown task: ${id}`);
    return { ...JSON.parse(fs.readFileSync(path.join(dir, id, 'task.json'), 'utf8')), dir: path.join(dir, id) };
  });
}

function prepareWorkspace() {
  const dir = tmp('crew-eval-ws-');
  fs.cpSync(path.join(EVAL, 'fixture'), dir, { recursive: true });
  git(dir, ['init', '-q']);
  git(dir, ['add', '-A']);
  git(dir, ['-c', 'user.name=eval', '-c', 'user.email=eval@example.invalid', 'commit', '-qm', 'fixture']);
  return dir;
}

// The plugin as an installed copy would look, minus anything that holds answers.
function pluginCopy() {
  const dir = tmp('crew-eval-plugin-');
  for (const entry of PLUGIN_ENTRIES) {
    const from = path.join(ROOT, entry);
    if (fs.existsSync(from)) fs.cpSync(from, path.join(dir, entry), {
      recursive: true, filter: (s) => path.basename(s) !== '__pycache__' && !s.endsWith('.pyc'),
    });
  }
  return dir;
}

function nodeTest(cwd, files) {
  // A runner started inside another node --test inherits NODE_TEST_CONTEXT and
  // would report to the parent instead of printing its own summary.
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const r = spawnSync(process.execPath, ['--test', ...files], { cwd, env, encoding: 'utf8', windowsHide: true, timeout: 120000 });
  const count = (name) => Number(((r.stdout || '').match(new RegExp(`^# ${name} (\\d+)`, 'm')) || [])[1] || 0);
  const failed = [...(r.stdout || '').matchAll(/^not ok \d+ - (.+)$/gm)].map((m) => m[1].trim());
  return { status: r.status, pass: count('pass'), fail: count('fail'), failed };
}

// The project's own suite, run before the acceptance tests are copied in.
function regression(dir) {
  return nodeTest(dir, []).status === 0;
}

// Total comes from the test declarations, so a module that fails to load
// counts every one of its tests as failed instead of one file-level failure.
function acceptance(task, dir) {
  const src = path.join(task.dir, 'acceptance');
  const target = path.join(dir, '.acceptance');
  fs.cpSync(src, target, { recursive: true });
  const files = fs.readdirSync(target).filter((f) => f.endsWith('.test.js'));
  const total = files.reduce((n, f) => n + (fs.readFileSync(path.join(target, f), 'utf8').match(/^test\(/gm) || []).length, 0);
  const run = nodeTest(dir, files.map((f) => path.join('.acceptance', f)));
  return { passed: Math.min(run.pass, total), total, failed: run.failed };
}

const remove = (dir) => fs.rmSync(dir, { recursive: true, force: true });

module.exports = { ROOT, EVAL, loadTasks, prepareWorkspace, pluginCopy, regression, acceptance, remove, tmp };
