const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { spawn, spawnSync } = require('node:child_process');
const { applyEvent, taskHintFor } = require('../hooks/lib/activity-rules');
const root = path.resolve(__dirname, '..');
const PROJECT = '11111111-2222-4333-8444-555555555555';
const TASK = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const MIN = 60000;
const T0 = Date.parse('2026-09-28T10:00:00Z');

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
// A project in factory mode plus an isolated ~/.crew.
function project(t, factory = { projectId: PROJECT, url: 'http://127.0.0.1:9' }) {
  const dir = tmp(t, 'repo');
  put(dir, 'crew.json', JSON.stringify({ mode: 'team', factory }));
  return { dir, home: tmp(t, 'home') };
}
function env(home, extra = {}) {
  return { ...process.env, CREW_HOME: home, FACTORY_TOKEN: '', CREW_CAPTURE: '', ...extra };
}
function runSync(input, home, extra) {
  const run = spawnSync(process.execPath, [path.join(root, 'hooks/capture-activity.js')], {
    input: typeof input === 'string' ? input : JSON.stringify(input), encoding: 'utf8',
    env: env(home, extra), windowsHide: true,
  });
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stdout, '');
  return run;
}
function runAsync(input, home, extra) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(root, 'hooks/capture-activity.js')], { env: env(home, extra), windowsHide: true });
    let stdout = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.on('close', (status) => resolve({ status, stdout }));
    child.stdin.end(JSON.stringify(input));
  });
}
function queued(home) {
  const file = path.join(home, 'activity', 'queue.jsonl');
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : [];
}
function seedState(home, sessionId, state) {
  put(home, `activity/${sessionId}.json`, JSON.stringify(state));
}

test('scripted events with a fake clock build human and agent intervals and cut idle gaps', () => {
  let n = 0;
  const ctx = { sessionId: 's1', projectId: PROJECT, newId: () => `id-${++n}` };
  let state = {};
  const out = [];
  for (const [name, at] of [['SessionStart', 0], ['UserPromptSubmit', 5], ['Stop', 10],
    ['UserPromptSubmit', 40], ['Stop', 41], ['SessionEnd', 42]]) {
    const step = applyEvent(state, { name }, T0 + at * MIN, ctx);
    state = step.state;
    out.push(...step.intervals.map((i) => [i.kind, (Date.parse(i.startedAt) - T0) / MIN, (Date.parse(i.endedAt) - T0) / MIN]));
  }
  assert.deepEqual(out, [
    ['human', 0, 5], ['human', 5, 10], ['agent', 5, 10],
    ['human', 40, 41], ['agent', 40, 41], ['human', 41, 42],
  ]);
});

test('an edit to a story sets the task hint without counting as presence', t => {
  const { dir } = project(t);
  const story = put(dir, 'docs/stories/login/001-sign-in.md', `# 001\n\n- **Status:** In progress\n- **Factory task:** ${TASK}\n`);
  const hint = taskHintFor(dir, story, dir);
  assert.deepEqual(hint, { taskId: TASK, taskRef: { system: 'repo', externalKey: `${path.basename(dir)}:docs/stories/login/001-sign-in.md` } });
  assert.equal(taskHintFor(dir, put(dir, 'src/app.js', 'x'), dir), null);
  const ctx = { sessionId: 's', projectId: PROJECT, newId: () => 'id' };
  const start = applyEvent({}, { name: 'SessionStart' }, T0, ctx).state;
  const edited = applyEvent(start, { name: 'PostToolUse', hint }, T0 + 20 * MIN, ctx);
  assert.equal(edited.intervals.length, 0);
  assert.equal(edited.state.lastEventAt, T0);
  const next = applyEvent(edited.state, { name: 'UserPromptSubmit' }, T0 + 5 * MIN, ctx).intervals[0];
  assert.equal(next.taskId, TASK);
  assert.equal(next.projectId, PROJECT);
  assert.equal(next.sessionId, 's');
});

test('without a token, paused, outside factory mode or on garbage input it stays silent and writes nothing', t => {
  const { dir, home } = project(t);
  const event = { session_id: 's', hook_event_name: 'UserPromptSubmit', cwd: dir };
  runSync(event, home);
  runSync(event, home, { FACTORY_TOKEN: 'fct_x', CREW_CAPTURE: 'off' });
  runSync('not json', home, { FACTORY_TOKEN: 'fct_x' });
  const plain = tmp(t, 'plain');
  put(plain, 'crew.json', JSON.stringify({ mode: 'team' }));
  runSync({ ...event, cwd: plain }, home, { FACTORY_TOKEN: 'fct_x' });
  const paused = project(t, { projectId: PROJECT, capture: false });
  runSync({ ...event, cwd: paused.dir }, paused.home, { FACTORY_TOKEN: 'fct_x' });
  assert.equal(fs.existsSync(path.join(home, 'activity')), false);
  assert.equal(fs.existsSync(path.join(paused.home, 'activity')), false);
});

test('prompt content is never captured and an offline flush keeps the queue', t => {
  const { dir, home } = project(t);
  put(home, 'factory-token', 'fct_from_file\n');
  seedState(home, 's2', { lastEventAt: Date.now() - 2 * MIN, promptAt: Date.now() - MIN });
  runSync({ session_id: 's2', hook_event_name: 'Stop', cwd: dir, prompt: 'SECRET PROMPT',
    last_assistant_message: 'SECRET ANSWER', transcript_path: put(dir, 't.jsonl', 'SECRET') }, home);
  const items = queued(home);
  assert.deepEqual(items.map((i) => i.kind).sort(), ['agent', 'human']);
  const raw = fs.readFileSync(path.join(home, 'activity', 'queue.jsonl'), 'utf8');
  assert.equal(raw.includes('SECRET'), false);
  for (const item of items) assert.deepEqual(Object.keys(item).sort(), ['endedAt', 'id', 'kind', 'projectId', 'sessionId', 'startedAt']);
});

function server(t, status) {
  const received = [];
  const srv = http.createServer((req, res) => {
    let body = '';
    req.on('data', (d) => { body += d; });
    req.on('end', () => {
      received.push({ url: req.url, auth: req.headers.authorization, body: JSON.parse(body) });
      res.writeHead(status, { 'Content-Type': 'application/json' }).end('{"status":true}');
    });
  });
  t.after(() => srv.close());
  return new Promise((resolve) => srv.listen(0, '127.0.0.1', () =>
    resolve({ url: `http://127.0.0.1:${srv.address().port}/api/v1`, received })));
}

test('flush posts batches with the bearer token and empties the queue; SessionEnd drops state', async t => {
  const api = await server(t, 202);
  const { dir, home } = project(t, { projectId: PROJECT, url: api.url + '/' });
  seedState(home, 's3', { lastEventAt: Date.now() - 3 * MIN, promptAt: null });
  const run = await runAsync({ session_id: 's3', hook_event_name: 'SessionEnd', cwd: dir }, home, { FACTORY_TOKEN: 'fct_env' });
  assert.equal(run.status, 0);
  assert.equal(run.stdout, '');
  assert.equal(api.received.length, 1);
  assert.equal(api.received[0].url, '/api/v1/activity/intervals');
  assert.equal(api.received[0].auth, 'Bearer fct_env');
  assert.equal(api.received[0].body.intervals[0].kind, 'human');
  assert.deepEqual(queued(home), []);
  assert.equal(fs.existsSync(path.join(home, 'activity', 's3.json')), false);
});

test('a validation rejection drops the batch and logs one line; stale intervals never leave', async t => {
  const api = await server(t, 400);
  const { dir, home } = project(t, { projectId: PROJECT, url: api.url });
  const old = new Date(Date.now() - 50 * 86400000).toISOString();
  put(home, 'activity/queue.jsonl', JSON.stringify({ id: TASK, kind: 'human', startedAt: old, endedAt: old }) + '\n');
  seedState(home, 's4', { lastEventAt: Date.now() - MIN, promptAt: null });
  await runAsync({ session_id: 's4', hook_event_name: 'Stop', cwd: dir }, home, { FACTORY_TOKEN: 'fct_env' });
  assert.equal(api.received.length, 1);
  assert.equal(api.received[0].body.intervals.length, 1);
  assert.deepEqual(queued(home), []);
  const log = fs.readFileSync(path.join(home, 'activity', 'errors.log'), 'utf8').trim().split('\n');
  assert.equal(log.length, 2);
});

test('SessionStart prunes session state older than 48 h and never the queue', t => {
  const { dir, home } = project(t);
  const old = (Date.now() - 72 * 3600000) / 1000;
  const stale = put(home, 'activity/dead-session.json', '{}');
  const fresh = put(home, 'activity/live-session.json', '{}');
  const interval = { id: TASK, kind: 'human', startedAt: new Date(Date.now() - MIN).toISOString(), endedAt: new Date().toISOString() };
  const queue = put(home, 'activity/queue.jsonl', JSON.stringify(interval) + '\n');
  fs.utimesSync(stale, old, old);
  fs.utimesSync(queue, old, old);
  runSync({ session_id: 's5', hook_event_name: 'SessionStart', cwd: dir }, home, { FACTORY_TOKEN: 'fct_x' });
  assert.equal(fs.existsSync(stale), false);
  assert.equal(fs.existsSync(fresh), true);
  assert.deepEqual(queued(home).map((i) => i.id), [TASK]);
});

test('a Codex apply_patch edit to a story sets the same task hint', t => {
  const { dir, home } = project(t);
  put(dir, 'docs/stories/f/001-x.md', `# 001\n- **Factory task:** ${TASK}\n`);
  const command = '*** Begin Patch\n*** Update File: src/a.js\n@@\n-a\n+b\n' +
    '*** Update File: docs/stories/f/001-x.md\n@@\n-x\n+y\n*** End Patch';
  runSync({ session_id: 's6', hook_event_name: 'PostToolUse', cwd: dir, tool_name: 'apply_patch', tool_input: { command } },
    home, { FACTORY_TOKEN: 'fct_x' });
  const state = JSON.parse(fs.readFileSync(path.join(home, 'activity', 's6.json'), 'utf8'));
  assert.deepEqual(state.taskHint, { taskId: TASK,
    taskRef: { system: 'repo', externalKey: `${path.basename(dir)}:docs/stories/f/001-x.md` } });
});
