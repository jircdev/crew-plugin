// Reading time: the capture sends the word count of the turn's last answer
// and nothing else from the conversation (factory work-blocks, condition 7).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { applyEvent } = require('../hooks/lib/activity-rules');
const { lastAnswerWords, countWords } = require('../hooks/lib/response-words');
const { sendable } = require('../hooks/lib/activity-batches');
const root = path.resolve(__dirname, '..');
const PROJECT = '11111111-2222-4333-8444-555555555555';
const ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const MIN = 60000;
const T0 = Date.parse('2026-09-28T10:00:00Z');
const SECRET = 'SECRETWORD';

function tmp(t, name) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `crew-${name}-`));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}
const words = (n, w = SECRET) => Array(n).fill(w).join(' ');
const user = (content, extra = {}) => ({ type: 'user', message: { role: 'user', content }, ...extra });
const answer = (id, content) => ({ type: 'assistant', message: { id, role: 'assistant', content } });
const text = (n) => ({ type: 'text', text: words(n) });

// Two turns. In the current one: a prompt, a tool call, its result, a
// sidechain, then the final answer split into thinking + two text records.
function transcript(dir, extra = []) {
  const records = [
    user(words(50)), answer('m0', [text(30)]),
    user(words(40)), answer('m1', [text(7)]), answer('m1', [{ type: 'tool_use', name: 'Bash', input: { command: words(9) } }]),
    user([{ type: 'tool_result', content: words(60) }]),
    answer('side', [text(11)]), { ...answer('side2', [text(13)]), isSidechain: true },
    user(words(5), { isMeta: true }),
    answer('m2', [{ type: 'thinking', thinking: words(80) }]), answer('m2', [text(3)]), answer('m2', [text(2)]),
    { type: 'system', content: words(4) }, { type: 'last-prompt', lastPrompt: words(40) },
    ...extra,
  ];
  const file = path.join(dir, 'session.jsonl');
  fs.writeFileSync(file, records.map((r) => JSON.stringify(r)).join('\n') + '\n');
  return file;
}

test('scripted events: the count rides only on the agent interval its Stop closes', () => {
  let n = 0;
  const ctx = { sessionId: 's', projectId: PROJECT, newId: () => `id-${++n}` };
  let state = {};
  const out = [];
  for (const [name, at, responseWords] of [['SessionStart', 0], ['UserPromptSubmit', 1], ['Declare', 2], ['Stop', 5, 120],
    ['UserPromptSubmit', 8], ['Stop', 9, 0], ['UserPromptSubmit', 10, 99], ['UserPromptSubmit', 12],
    ['Stop', 13, 1.5], ['UserPromptSubmit', 14], ['Stop', 15, -1], ['SessionEnd', 16, 50]]) {
    const step = applyEvent(state, { name, taskId: name === 'Declare' ? ID : undefined, responseWords }, T0 + at * MIN, ctx);
    state = step.state;
    out.push(...step.intervals.map((i) => [i.kind, (Date.parse(i.startedAt) - T0) / MIN, i.responseWords]));
  }
  assert.deepEqual(out, [
    ['human', 0, undefined], ['agent', 1, 120], ['human', 5, undefined], ['agent', 8, 0],
    ['human', 9, undefined],
    // An interrupted turn has no Stop, so no count; a bad count is dropped.
    ['agent', 10, undefined], ['agent', 12, undefined], ['human', 13, undefined], ['agent', 14, undefined],
    ['human', 15, undefined],
  ]);
  // A cut in the middle of a reply: only the piece the Stop closes counts.
  const cutCtx = { sessionId: 's', projectId: PROJECT, newId: (k) => `${k}-${++n}` };
  let s2 = applyEvent({}, { name: 'SessionStart' }, T0, cutCtx).state;
  s2 = applyEvent(s2, { name: 'Declare', taskId: ID }, T0, cutCtx).state;
  s2 = applyEvent(s2, { name: 'UserPromptSubmit' }, T0 + MIN, cutCtx).state;
  const cut = applyEvent(s2, { name: 'Complete' }, T0 + 2 * MIN, cutCtx);
  const end = applyEvent(cut.state, { name: 'Stop', responseWords: 40 }, T0 + 3 * MIN, cutCtx);
  assert.deepEqual([...cut.intervals, ...end.intervals].map((i) => i.responseWords), [undefined, 40]);
});

test('the count reads only the last answer of the current turn', t => {
  const dir = tmp(t, 'words');
  assert.equal(lastAnswerWords(transcript(dir)), 5);
  // A turn whose answer has no text yet counts zero; earlier turns never fill in.
  assert.equal(lastAnswerWords(transcript(dir, [user(words(3))])), 0);
  assert.equal(lastAnswerWords(transcript(dir, [user([{ type: 'tool_result', content: 'x' }])])), 5);
  assert.equal(countWords('  one\ttwo\nthree  '), 3);
  assert.equal(countWords(''), 0);
});

test('turned off, unreadable or not a transcript: no count at all', t => {
  const dir = tmp(t, 'off');
  const file = transcript(dir);
  process.env.CREW_READING_TIME = 'OFF';
  try { assert.equal(lastAnswerWords(file), null); } finally { delete process.env.CREW_READING_TIME; }
  assert.equal(lastAnswerWords(path.join(dir, 'missing.jsonl')), null);
  assert.equal(lastAnswerWords(path.join(dir, 'session.txt')), null);
  assert.equal(lastAnswerWords(undefined), null);
  fs.mkdirSync(path.join(dir, 'folder.jsonl'));
  assert.equal(lastAnswerWords(path.join(dir, 'folder.jsonl')), null);
  const garbage = path.join(dir, 'garbage.jsonl');
  fs.writeFileSync(garbage, `${SECRET} not json\n{"torn`);
  assert.equal(lastAnswerWords(garbage), null);
  const huge = path.join(dir, 'huge.jsonl');
  fs.writeFileSync(huge, [user('go'), answer('m', [{ type: 'text', text: 'a '.repeat(200001) }])].map((r) => JSON.stringify(r)).join('\n'));
  assert.equal(lastAnswerWords(huge), null);
});

test('the queue mirrors factory: a count only on an agent turn, an integer up to 200000', () => {
  const now = Date.now();
  const base = { id: ID, startedAt: new Date(now - MIN).toISOString(), endedAt: new Date(now).toISOString() };
  assert.equal(sendable({ ...base, kind: 'agent', responseWords: 200000 }, now), true);
  assert.equal(sendable({ ...base, kind: 'agent' }, now), true);
  assert.equal(sendable({ ...base, kind: 'human', responseWords: 3 }, now), false);
  assert.equal(sendable({ ...base, kind: 'agent', responseWords: 200001 }, now), false);
  assert.equal(sendable({ ...base, kind: 'agent', responseWords: '12' }, now), false);
});

function server(t, status) {
  const received = [];
  const srv = http.createServer((req, res) => {
    let body = '';
    req.on('data', (d) => { body += d; });
    req.on('end', () => { received.push(body); res.writeHead(status, { 'Content-Type': 'application/json' }).end('{}'); });
  });
  t.after(() => srv.close());
  return new Promise((resolve) => srv.listen(0, '127.0.0.1', () =>
    resolve({ url: `http://127.0.0.1:${srv.address().port}/api/v1`, received })));
}

function hook(input, home, extra = {}) {
  return new Promise((resolve) => {
    const env = { ...process.env, CREW_HOME: home, FACTORY_TOKEN: 'fct_env', CREW_CAPTURE: '', CREW_FACTORY_ENV: '',
      CREW_FACTORY_URL: '', CREW_READING_TIME: '', ...extra };
    const child = spawn(process.execPath, [path.join(root, 'hooks/capture-activity.js')], { env, windowsHide: true });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('close', (status) => resolve({ status, stdout, stderr }));
    child.stdin.end(JSON.stringify(input));
  });
}

// Everything the hook leaves on disk or prints, to prove the text never lands.
function everythingWritten(home, run) {
  const dir = path.join(home, 'activity');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).map((f) => fs.readFileSync(path.join(dir, f), 'utf8')) : [];
  return [...files, run.stdout, run.stderr].join('\n');
}

async function stopWith(t, status, extraEnv) {
  const api = await server(t, status);
  const repo = tmp(t, 'repo');
  const home = tmp(t, 'home');
  fs.writeFileSync(path.join(repo, 'crew.json'), JSON.stringify({ mode: 'team', factory: { projectId: PROJECT, url: api.url } }));
  fs.mkdirSync(path.join(home, 'activity'), { recursive: true });
  fs.writeFileSync(path.join(home, 'activity', 's.json'), JSON.stringify({ lastEventAt: Date.now() - 2 * MIN, promptAt: Date.now() - MIN }));
  const run = await hook({ session_id: 's', hook_event_name: 'Stop', cwd: repo, transcript_path: transcript(repo),
    last_assistant_message: words(4) }, home, extraEnv);
  assert.equal(run.status, 0);
  return { api, home, run };
}

test('the Stop hook sends the integer alone; the answer text reaches no request, file or log', async t => {
  const { api, home, run } = await stopWith(t, 202);
  assert.equal(run.stdout, '');
  assert.equal(api.received.length, 1);
  const [interval] = JSON.parse(api.received[0]).intervals;
  assert.equal(interval.kind, 'agent');
  assert.equal(interval.responseWords, 5);
  assert.deepEqual(Object.keys(interval).sort(), ['endedAt', 'id', 'kind', 'projectId', 'responseWords', 'sessionId', 'startedAt']);
  assert.equal(api.received[0].includes(SECRET), false);
  assert.equal(everythingWritten(home, run).includes(SECRET), false);
});

test('a rejected batch logs no answer text, and CREW_READING_TIME=off sends no count', async t => {
  const rejected = await stopWith(t, 400);
  const log = fs.readFileSync(path.join(rejected.home, 'activity', 'errors.log'), 'utf8');
  assert.ok(log.trim().length > 0);
  assert.equal(everythingWritten(rejected.home, rejected.run).includes(SECRET), false);
  const off = await stopWith(t, 202, { CREW_READING_TIME: 'off' });
  const [interval] = JSON.parse(off.api.received[0]).intervals;
  assert.equal(interval.kind, 'agent');
  assert.equal('responseWords' in interval, false);
});
