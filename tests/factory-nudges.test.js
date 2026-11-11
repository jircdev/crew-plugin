// The two factory nudges: declare the activity of an edited work item, and ask
// at a commit whether it closes the task. Each runs as the real hook process
// against a temp repository and an isolated ~/.crew.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { applyEvent } = require('../hooks/lib/activity-rules');
const { commits } = require('../hooks/nudge-closure');

const root = path.resolve(__dirname, '..');
const PROJECT = '11111111-2222-4333-8444-555555555555';
const TASK = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const OTHER = 'bbbbbbbb-cccc-4ddd-8eee-ffffffffffff';
let sessions = 0;

function tmp(t, name) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `crew-${name}-`));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}
function put(dir, file, text) {
  const target = path.join(dir, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text);
  return target;
}
function setup(t, crew = { mode: 'team', factory: { projectId: PROJECT, url: 'http://127.0.0.1:9' } }) {
  const dir = tmp(t, 'repo');
  put(dir, 'crew.json', JSON.stringify(crew));
  put(dir, 'docs/requirements/x/001-item.md', `# Item\n\n- **Factory activity:** ${TASK}\n- **Status:** Open\n`);
  put(dir, 'docs/stories/plain.md', '# Plain story\n\n- **Status:** Open\n');
  return { dir, home: tmp(t, 'home'), session: `s${process.pid}-${++sessions}-${Date.now()}` };
}
function run(hook, input, home, extra = {}) {
  const r = spawnSync(process.execPath, [path.join(root, 'hooks', hook)], {
    input: JSON.stringify(input), encoding: 'utf8', windowsHide: true,
    env: { ...process.env, CREW_HOME: home, FACTORY_TOKEN: 'test-token', CREW_CAPTURE: '', ...extra },
  });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout ? JSON.parse(r.stdout).hookSpecificOutput.additionalContext : null;
}
function seed(home, session, state) {
  put(home, `activity/${session}.json`, JSON.stringify(state));
}
const edit = (s, file) => ({ hook_event_name: 'PostToolUse', tool_name: 'Edit', session_id: s.session, cwd: s.dir,
  tool_input: { file_path: path.join(s.dir, file) } });

test('declare: editing a linked item with nothing declared tells the agent to declare it, once', (t) => {
  const s = setup(t);
  const text = run('nudge-declare.js', edit(s, 'docs/requirements/x/001-item.md'), s.home);
  assert.match(text, new RegExp(`declare_work with activityId ${TASK}`));
  assert.match(text, /docs\/requirements\/x\/001-item\.md/);
  assert.match(text, /no activity declared/);
  assert.equal(run('nudge-declare.js', edit(s, 'docs/requirements/x/001-item.md'), s.home), null);
});

test('declare: another declared activity is named; the same one is silent', (t) => {
  const s = setup(t);
  seed(s.home, s.session, { blockId: 'b1', blockTaskId: OTHER });
  assert.match(run('nudge-declare.js', edit(s, 'docs/requirements/x/001-item.md'), s.home), new RegExp(`another activity declared \\(${OTHER}\\)`));
  const same = setup(t);
  seed(same.home, same.session, { blockId: 'b1', blockTaskId: TASK });
  assert.equal(run('nudge-declare.js', edit(same, 'docs/requirements/x/001-item.md'), same.home), null);
});

test('declare: an activity this session completed stays closed when its status is edited', (t) => {
  const s = setup(t);
  const ctx = { sessionId: s.session, projectId: PROJECT, newId: () => 'id' };
  let { state } = applyEvent({}, { name: 'SessionStart' }, 1000, ctx);
  state = applyEvent(state, { name: 'Declare', taskId: TASK }, 2000, ctx).state;
  state = applyEvent(state, { name: 'Complete' }, 3000, ctx).state;
  assert.deepEqual(state.completed, [TASK]);
  seed(s.home, s.session, state);
  assert.equal(run('nudge-declare.js', edit(s, 'docs/requirements/x/001-item.md'), s.home), null);
  // Declaring it again (a reopen) takes it off the completed list.
  assert.deepEqual(applyEvent(state, { name: 'Declare', taskId: TASK }, 4000, ctx).state.completed, []);
});

test('declare: silent without factory, in solo, with capture paused, or on an unlinked file', (t) => {
  const plain = setup(t);
  assert.equal(run('nudge-declare.js', edit(plain, 'docs/stories/plain.md'), plain.home), null);
  const solo = setup(t, { mode: 'solo', factory: { projectId: PROJECT } });
  assert.equal(run('nudge-declare.js', edit(solo, 'docs/requirements/x/001-item.md'), solo.home), null);
  const off = setup(t, { mode: 'team' });
  assert.equal(run('nudge-declare.js', edit(off, 'docs/requirements/x/001-item.md'), off.home), null);
  const paused = setup(t);
  assert.equal(run('nudge-declare.js', edit(paused, 'docs/requirements/x/001-item.md'), paused.home, { CREW_CAPTURE: 'off' }), null);
  const noToken = setup(t);
  assert.equal(run('nudge-declare.js', edit(noToken, 'docs/requirements/x/001-item.md'), noToken.home, { FACTORY_TOKEN: '' }), null);
});

test('closure: which commands count as a commit', () => {
  assert.equal(commits('git commit -m "x" -- a.js'), true);
  assert.equal(commits('git add a.js && git -C repo commit -m "y"'), true);
  assert.equal(commits('bash ~/.claude/scripts/git-cut.sh -m "z" -- a.js'), true);
  assert.equal(commits('bash ~/.claude/scripts/git-cut.sh --claim -- a.js'), false);
  assert.equal(commits('git commit --dry-run -m x'), false);
  assert.equal(commits('git log -1 && echo "git commit"'), false);
});

function git(dir, ...args) {
  const r = spawnSync('git', ['-c', 'user.name=Crew Test', '-c', 'user.email=test@example.invalid', ...args], { cwd: dir, encoding: 'utf8', windowsHide: true });
  assert.equal(r.status, 0, r.stderr);
}
const shell = (s, command) => ({ hook_event_name: 'PostToolUse', tool_name: 'Bash', session_id: s.session, cwd: s.dir, tool_input: { command } });

test('closure: a fresh commit asks whether it closes the task, with the whole circuit, once', (t) => {
  const s = setup(t);
  git(s.dir, 'init', '-q');
  git(s.dir, 'add', '.');
  git(s.dir, 'commit', '-q', '-m', 'first');
  seed(s.home, s.session, { blockId: 'b1', blockTaskId: TASK });
  const text = run('nudge-closure.js', shell(s, 'git commit -m "first"'), s.home);
  assert.match(text, /does this commit close the task\?/);
  assert.match(text, new RegExp(`declared is ${TASK}`));
  assert.match(text, /update_activity, action complete/);
  assert.match(text, /my_week with that activityId/);
  assert.match(text, /rounded up to the next 5 minutes, at least 10 minutes/);
  assert.match(text, /never ask about them/);
  assert.match(text, new RegExp(`create_activity in project ${PROJECT}, under the story or requirement in progress, without assignee`));
  assert.match(text, /"No planificado" is the fallback/);
  assert.match(text, /intermediate commits never ask about hours/);
  assert.match(text, /update_time on the day's record, or log_time/);
  assert.equal(run('nudge-closure.js', shell(s, 'git commit -m "first"'), s.home), null);
});

test('closure: silent for non-commits, stale HEAD, solo, no factory or no token', (t) => {
  const s = setup(t);
  git(s.dir, 'init', '-q');
  git(s.dir, 'add', '.');
  git(s.dir, 'commit', '-q', '-m', 'old', '--date', '2020-01-01T00:00:00Z');
  assert.equal(run('nudge-closure.js', shell(s, 'git status'), s.home), null);
  const stale = { ...process.env, GIT_COMMITTER_DATE: '2020-01-01T00:00:00Z' };
  spawnSync('git', ['-c', 'user.name=T', '-c', 'user.email=t@example.invalid', 'commit', '-q', '--allow-empty', '-m', 'stale'], { cwd: s.dir, env: stale });
  assert.equal(run('nudge-closure.js', shell(s, 'git commit -m stale'), s.home), null);
  for (const crew of [{ mode: 'solo', factory: { projectId: PROJECT } }, { mode: 'team' }]) {
    const other = setup(t, crew);
    git(other.dir, 'init', '-q');
    git(other.dir, 'add', '.');
    git(other.dir, 'commit', '-q', '-m', 'c');
    assert.equal(run('nudge-closure.js', shell(other, 'git commit -m c'), other.home), null);
  }
  const noToken = setup(t);
  git(noToken.dir, 'init', '-q');
  git(noToken.dir, 'add', '.');
  git(noToken.dir, 'commit', '-q', '-m', 'c');
  assert.equal(run('nudge-closure.js', shell(noToken, 'git commit -m c'), noToken.home, { FACTORY_TOKEN: '' }), null);
});
