// An agent turn counts only its active stretches: a silence over 15 minutes
// inside it (a tool waiting for the person, a machine asleep) cuts it, live
// and in a rebuild from transcripts.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { applyEvent } = require('../hooks/lib/activity-rules');
const { activeStretches, stretches } = require('../hooks/lib/turn-activity');
const root = path.resolve(__dirname, '..');
const PROJECT = '11111111-2222-4333-8444-555555555555';
const TASK = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const MIN = 60000;
const SECRET = 'SECRETWORD';

function tmp(t, name) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `crew-${name}-`));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}
const iso = (ms) => new Date(ms).toISOString();
const user = (at, content = SECRET) => ({ type: 'user', timestamp: iso(at), message: { role: 'user', content } });
const toolUse = (at) => ({ type: 'assistant', timestamp: iso(at), message: { id: `m${at}`, role: 'assistant',
  content: [{ type: 'tool_use', name: 'mcp__ccd_session__start_session', input: { title: SECRET } }] } });
const toolResult = (at) => ({ type: 'user', timestamp: iso(at), message: { role: 'user', content: [{ type: 'tool_result', content: SECRET }] } });
const answer = (at, text = 'one two three') => ({ type: 'assistant', timestamp: iso(at), message: { id: `a${at}`, role: 'assistant', content: [{ type: 'text', text }] } });
function write(file, records) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, records.map((r) => JSON.stringify(r)).join('\n') + '\n');
  return file;
}
const rel = (list, base) => list.map((s) => [(s.start - base) / MIN, (s.end - base) / MIN]);

test('a suspended machine: the night between two bursts of work is cut out', () => {
  const t0 = Date.parse('2026-11-04T01:15:00Z');
  const points = [0, 3, 12].map((m) => t0 + m * MIN).concat([687, 690, 692].map((m) => t0 + m * MIN));
  assert.deepEqual(rel(stretches(points), t0), [[0, 12], [687, 692]]);
  // A gap of exactly 15 minutes still belongs to the stretch.
  assert.deepEqual(rel(stretches([t0, t0 + 15 * MIN, t0 + 16 * MIN]), t0), [[0, 16]]);
});

test('scripted events: one agent interval per stretch, the words on the last, a new block after the silence', () => {
  let n = 0;
  const ctx = { sessionId: 's', projectId: PROJECT, newId: (kind) => `${kind}-${++n}` };
  const t0 = Date.parse('2026-11-04T01:15:00Z');
  let state = applyEvent({}, { name: 'SessionStart' }, t0, ctx).state;
  state = applyEvent(state, { name: 'UserPromptSubmit' }, t0 + MIN, ctx).state;
  state = applyEvent(state, { name: 'Declare', taskId: TASK }, t0 + 2 * MIN, ctx).state;
  const stretchesOf = [{ start: t0 + MIN, end: t0 + 12 * MIN }, { start: t0 + 687 * MIN, end: t0 + 692 * MIN }];
  const step = applyEvent(state, { name: 'Stop', stretches: stretchesOf, responseWords: 30 }, t0 + 692 * MIN, ctx);
  const agent = step.intervals;
  assert.deepEqual(agent.map((i) => [i.kind, (Date.parse(i.startedAt) - t0) / MIN, (Date.parse(i.endedAt) - t0) / MIN, i.responseWords]),
    [['agent', 1, 12, undefined], ['agent', 687, 692, 30]]);
  assert.notEqual(agent[0].blockId, agent[1].blockId);
  assert.deepEqual(agent.map((i) => i.declaredTaskId), [TASK, TASK]);
  // Without stretches (an unreadable transcript) the run stays whole.
  const whole = applyEvent(state, { name: 'Stop' }, t0 + 692 * MIN, ctx).intervals;
  assert.deepEqual(whole.map((i) => (Date.parse(i.endedAt) - Date.parse(i.startedAt)) / MIN), [691]);
});

test('a tool waiting for the person, a turn without gaps, and a subagent working while the main thread is quiet', t => {
  const dir = tmp(t, 'turn');
  const t0 = Date.parse('2026-11-04T01:15:00Z');
  const at = (m) => t0 + m * MIN;
  const waiting = write(path.join(dir, 'wait.jsonl'), [answer(at(-30)), user(at(0)), toolUse(at(11)), toolResult(at(507)), answer(at(512))]);
  assert.deepEqual(rel(activeStretches(waiting, at(0), at(512)), t0), [[0, 11], [507, 512]]);
  const steady = write(path.join(dir, 'steady.jsonl'), [user(at(0)), toolUse(at(8)), toolResult(at(9)), answer(at(20))]);
  assert.deepEqual(rel(activeStretches(steady, at(0), at(20)), t0), [[0, 20]]);
  const delegated = write(path.join(dir, 'task.jsonl'), [user(at(0)), toolUse(at(1)), toolResult(at(45)), answer(at(46))]);
  write(path.join(dir, 'task', 'subagents', 'agent-x.jsonl'), [10, 20, 30, 40].map((m) => ({ ...answer(at(m)), isSidechain: true })));
  assert.deepEqual(rel(activeStretches(delegated, at(0), at(46)), t0), [[0, 46]]);
  assert.equal(activeStretches(path.join(dir, 'missing.jsonl'), at(0), at(46)), null);
});

test('the Stop hook queues the cut turn and keeps no text of the transcript', t => {
  const repo = tmp(t, 'repo');
  const home = tmp(t, 'home');
  fs.writeFileSync(path.join(repo, 'crew.json'), JSON.stringify({ mode: 'team', factory: { projectId: PROJECT, url: 'http://127.0.0.1:9' } }));
  const now = Date.now();
  const promptAt = now - 512 * MIN;
  const transcript = write(path.join(repo, 's.jsonl'),
    [user(promptAt), toolUse(promptAt + 11 * MIN), toolResult(now - 5 * MIN), answer(now - MIN, 'four words right here')]);
  fs.mkdirSync(path.join(home, 'activity'), { recursive: true });
  fs.writeFileSync(path.join(home, 'activity', 's.json'), JSON.stringify({ lastEventAt: promptAt, promptAt }));
  const run = spawnSync(process.execPath, [path.join(root, 'hooks/capture-activity.js')], {
    input: JSON.stringify({ session_id: 's', hook_event_name: 'Stop', cwd: repo, transcript_path: transcript }), encoding: 'utf8',
    env: { ...process.env, CREW_HOME: home, FACTORY_TOKEN: 'fct_x', CREW_CAPTURE: '', CREW_FACTORY_ENV: '', CREW_FACTORY_URL: '', CREW_READING_TIME: '' },
    windowsHide: true,
  });
  assert.equal(run.status, 0, run.stderr);
  const queue = fs.readFileSync(path.join(home, 'activity', 'queue.jsonl'), 'utf8');
  const items = queue.trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual(items.map((i) => [i.kind, Math.round((Date.parse(i.endedAt) - Date.parse(i.startedAt)) / MIN), i.responseWords]),
    [['agent', 11, undefined], ['agent', 5, 4]]);
  for (const name of fs.readdirSync(path.join(home, 'activity'))) {
    assert.equal(fs.readFileSync(path.join(home, 'activity', name), 'utf8').includes(SECRET), false, name);
  }
});
