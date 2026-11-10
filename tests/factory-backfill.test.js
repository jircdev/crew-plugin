const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { factory, tempHome, runScript, TOKEN } = require('./fixtures/factory-fake');
const { isHumanPrompt } = require('../scripts/lib/transcripts');

const PROJECT = '11111111-2222-4333-8444-555555555555';
const TASK = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const MIN = 60000;
const T0 = Math.floor((Date.now() - 2 * 86400000) / MIN) * MIN;
const at = (m) => new Date(T0 + m * MIN).toISOString();

const prompt = (m, text = 'SECRET PROMPT', extra = {}) => ({ type: 'user', timestamp: at(m), message: { role: 'user', content: text }, ...extra });
const reply = (m, content = [{ type: 'text', text: 'SECRET ANSWER' }]) => ({ type: 'assistant', timestamp: at(m), message: { role: 'assistant', content } });
const toolResult = (m) => ({ type: 'user', timestamp: at(m), message: { role: 'user', content: [{ type: 'tool_result', content: 'SECRET OUTPUT' }] } });

// A repository linked to factory, a connected machine and a Claude config dir
// holding `sessions` ({ id, cwd?, records }) as transcripts.
function world(t, sessions, crew = { factory: { projectId: PROJECT } }) {
  const repo = tempHome(t);
  fs.writeFileSync(path.join(repo, 'crew.json'), JSON.stringify(crew));
  const home = tempHome(t);
  fs.writeFileSync(path.join(home, 'factory-token'), TOKEN);
  const fingerprint = createHash('sha256').update(TOKEN).digest('hex');
  fs.writeFileSync(path.join(home, 'factory-token.json'), JSON.stringify({ fingerprint, connectedAt: at(-60), expiresAt: at(90 * 24 * 60) }));
  const config = tempHome(t);
  fs.mkdirSync(path.join(config, 'projects', 'C--repo', 'subagents'), { recursive: true });
  for (const s of sessions) {
    const lines = s.records.map((r, i) => JSON.stringify({ uuid: `${s.id}-${i}`, sessionId: s.id, cwd: s.cwd || repo, ...r }));
    // A `null` line and a torn line stand for what a crash can leave behind.
    fs.writeFileSync(path.join(config, 'projects', 'C--repo', `${s.id}.jsonl`), ['null', ...lines, '{"torn'].join('\n') + '\n');
  }
  return { repo, home, config };
}
const run = (w, fake, args = []) => runScript('factory-backfill', args, { home: w.home, cwd: w.repo, api: fake.api,
  env: { CLAUDE_CONFIG_DIR: w.config } });
const rebuilt = (w) => {
  process.env.CLAUDE_CONFIG_DIR = w.config;
  process.env.CREW_HOME = w.home;
  return require('../scripts/factory-backfill').rebuild(w.repo, PROJECT, T0 - 3600000, Date.now()).intervals;
};
const spans = (items) => items.map((i) => [i.kind, (Date.parse(i.startedAt) - T0) / MIN, (Date.parse(i.endedAt) - T0) / MIN]);

const SESSION = { id: 'sess-a', records: [
  { type: 'user', timestamp: at(0), isMeta: true, message: { role: 'user', content: 'meta' } },
  prompt(2), reply(3, [{ type: 'tool_use', name: 'Edit', input: { file_path: 'docs/stories/f/001-x.md' } }]),
  toolResult(4), reply(10), prompt(11, '<task-notification>done</task-notification>'), reply(12),
  prompt(15), toolResult(16), reply(20),
] };

// A turn a notification opened adds no agent time: only turns the person started count.
test('a transcript rebuilds the intervals live capture would have built, with the edited work item', t => {
  const w = world(t, [SESSION]);
  fs.mkdirSync(path.join(w.repo, 'docs/stories/f'), { recursive: true });
  fs.writeFileSync(path.join(w.repo, 'docs/stories/f/001-x.md'), `# 001\n- **Factory activity:** ${TASK}\n`);
  const items = rebuilt(w);
  assert.deepEqual(spans(items), [['human', 0, 2], ['agent', 2, 10], ['human', 10, 15], ['agent', 15, 20]]);
  assert.ok(items.every((i) => i.source === 'backfill' && i.projectId === PROJECT && i.sessionId === 'sess-a'));
  assert.equal(items[1].taskId, TASK);
  assert.equal(JSON.stringify(items).includes('SECRET'), false);
});

test('tool results, meta records, subagents, notifications and other sessions never count as prompts', () => {
  assert.equal(isHumanPrompt(toolResult(1)), false);
  assert.equal(isHumanPrompt(prompt(1, 'x', { isMeta: true })), false);
  assert.equal(isHumanPrompt(prompt(1, 'x', { isSidechain: true })), false);
  assert.equal(isHumanPrompt(prompt(1, 'x', { isCompactSummary: true })), false);
  assert.equal(isHumanPrompt(prompt(1, 'x', { turnOrigin: 'sdk' })), false);
  assert.equal(isHumanPrompt(prompt(1, '<task-notification>x</task-notification>')), false);
  assert.equal(isHumanPrompt(prompt(1, '[Request interrupted by user]')), false);
  assert.equal(isHumanPrompt(prompt(1, 'fix it', { turnOrigin: 'human' })), true);
  assert.equal(isHumanPrompt(prompt(1, [{ type: 'image' }, { type: 'text', text: 'look' }])), true);
});

test('sessions of another repository and time before the person connected stay out', t => {
  const elsewhere = { id: 'sess-b', cwd: path.join(path.parse(process.cwd()).root, 'other-repo'), records: [prompt(2), reply(9)] };
  const w = world(t, [SESSION, elsewhere, { id: 'sess-c', records: [prompt(-200), reply(-190)] }]);
  const items = rebuilt(w);
  assert.ok(items.every((i) => i.sessionId === 'sess-a'));
});

test('two rebuilds produce the same ids, and live capture keeps random ones', t => {
  const w = world(t, [SESSION]);
  assert.deepEqual(rebuilt(w).map((i) => i.id), rebuilt(w).map((i) => i.id));
  assert.match(rebuilt(w)[0].id, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/);
});

test('the dry run shows hours per day only and sends nothing; --send sends the rebuilt intervals', async t => {
  const fake = await factory(t);
  const w = world(t, [SESSION]);
  const out = await run(w, fake);
  assert.equal(out.status, 0, out.stdout);
  assert.match(out.stdout, /4 intervals from 1 sessions/);
  assert.match(out.stdout, /\| Day \| Your time \(h\) \| Agent time \(h\) \| Intervals \|/);
  assert.match(out.stdout, /Nothing was sent/);
  assert.equal(/SECRET|C--repo|001-x/.test(out.stdout), false, out.stdout);
  const send = await run(w, fake, ['--send']);
  assert.equal(send.status, 0, send.stdout);
  assert.match(send.stdout, /Sent 4 intervals/);
  assert.equal(fake.seen.intervals.length, 4);
  assert.ok(fake.seen.intervals.every((i) => i.source === 'backfill' && i.sessionId === 'sess-a'));
});

test('sending goes through the live queue to factory', async t => {
  const fake = await factory(t);
  const w = world(t, [SESSION]);
  const items = rebuilt(w);
  const left = await require('../scripts/factory-backfill').send(items, fake.api, TOKEN);
  assert.equal(left, 0);
  assert.deepEqual(fake.seen.intervals.map((i) => i.id).sort(), items.map((i) => i.id).sort());
});

test('without a link, or without a known connection date, it explains what to run', async t => {
  const fake = await factory(t);
  const loose = world(t, [SESSION], { mode: 'team' });
  assert.match((await run(loose, fake)).stdout, /not linked to factory\. Run \/crew:factory link/);
  const w = world(t, [SESSION]);
  fs.rmSync(path.join(w.home, 'factory-token.json'));
  assert.match((await run(w, fake)).stdout, /Pass --since YYYY-MM-DD/);
  assert.match((await run(w, fake, ['--since', at(-1).slice(0, 10)])).stdout, /intervals from 1 sessions/);
});

test('a silence longer than the idle cut inside a reply is never counted as agent time', t => {
  const waiting = { id: 'sess-w', records: [prompt(0), reply(1, [{ type: 'tool_use', name: 'AskUserQuestion', input: {} }]),
    toolResult(40), reply(42)] };
  assert.deepEqual(spans(rebuilt(world(t, [waiting]))), [['agent', 0, 1], ['agent', 40, 42]]);
});

test('a rebuilt turn carries the word count of its last answer only, never its text', t => {
  const answer = (m, id, text, extra = {}) => ({ type: 'assistant', timestamp: at(m), message: { id, role: 'assistant', content: [{ type: 'text', text }] }, ...extra });
  const turn = { id: 'sess-r', records: [prompt(0, 'SECRET a b c d e f'), answer(1, 'm0', 'SECRET one two three four'),
    reply(2, [{ type: 'tool_use', name: 'Bash', input: { command: 'SECRET x y' } }]), toolResult(3),
    answer(4, 'm1', 'SECRET final'), answer(5, 'm1', 'and more'), prompt(8), reply(9, [{ type: 'tool_use', name: 'Bash', input: {} }])] };
  const items = rebuilt(world(t, [turn]));
  assert.deepEqual(items.map((i) => [i.kind, i.responseWords]), [['agent', 4], ['human', undefined], ['agent', 0]]);
  assert.equal(JSON.stringify(items).includes('SECRET'), false);
  process.env.CREW_READING_TIME = 'off';
  try { assert.ok(rebuilt(world(t, [turn])).every((i) => !('responseWords' in i))); } finally { delete process.env.CREW_READING_TIME; }
});

test('a rebuild cuts a tool wait out of the reply, and a subagent at work keeps it whole', t => {
  const waiting = { id: 'sess-wait', records: [prompt(0), reply(2, [{ type: 'tool_use', name: 'Bash', input: {} }]), toolResult(500), reply(505)] };
  assert.deepEqual(spans(rebuilt(world(t, [waiting]))), [['agent', 0, 2], ['agent', 500, 505]]);
  const delegated = { id: 'sess-task', records: [prompt(0), reply(1, [{ type: 'tool_use', name: 'Agent', input: {} }]), toolResult(45), reply(46)] };
  const w = world(t, [delegated]);
  const sub = path.join(w.config, 'projects', 'C--repo', 'sess-task', 'subagents');
  fs.mkdirSync(sub, { recursive: true });
  fs.writeFileSync(path.join(sub, 'agent-x.jsonl'), [10, 20, 30, 40].map((m, i) => JSON.stringify({ uuid: `sub-${i}`, sessionId: 'sess-task',
    isSidechain: true, cwd: w.repo, ...reply(m, [{ type: 'text', text: 'SECRET SUBAGENT' }]) })).join('\n') + '\n');
  const items = rebuilt(w);
  assert.deepEqual(spans(items), [['agent', 0, 46]]);
  assert.equal(items[0].responseWords, 2);
});
