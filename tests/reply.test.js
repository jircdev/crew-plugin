const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { lastTurn, measure, breaches } = require('../hooks/lib/reply');
const root = path.resolve(__dirname, '..');

const user = (content) => JSON.stringify({ type: 'user', message: { role: 'user', content } });
const said = (text, tool) => JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [
  { type: 'text', text }, ...(tool ? [{ type: 'tool_use', id: 't', name: 'Read', input: {} }] : [])] } });
const result = () => JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't', content: 'x' }] } });

const LONG = Array.from({ length: 300 }, (_, i) => `word${i}`).join(' ');
const TABLES = '| a | b |\n|---|---|\n| 1 | 2 |\n\ntext\n\n| c | d |\n| --- | --- |\n| 3 | 4 |';

function run(t, lines, extra = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-reply-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const transcript = path.join(dir, 't.jsonl');
  fs.writeFileSync(transcript, lines.join('\n'));
  if (extra.config) fs.writeFileSync(path.join(dir, 'crew.json'), JSON.stringify(extra.config));
  const r = spawnSync(process.execPath, [path.join(root, 'hooks/guard-reply.js')], { encoding: 'utf8', windowsHide: true,
    input: JSON.stringify({ cwd: dir, transcript_path: transcript, stop_hook_active: !!extra.active }) });
  return r.stdout.trim() ? JSON.parse(r.stdout) : null;
}

test('the closing reply is the text after the last tool call, and the prompt the last one a person typed', () => {
  const turn = lastTurn([user('¿es de crew? ¿lo cumple?'), said('looking', true), result(),
    user('<system-reminder>noise</system-reminder>'), said('Sí. No. Hay que agregarlo.')].join('\n'));
  assert.equal(turn.prompt, '¿es de crew? ¿lo cumple?');
  assert.equal(turn.reply, 'Sí. No. Hay que agregarlo.');
});

test('words, tables and headings are counted outside code fences', () => {
  const m = measure(`# One\n## Two\n### Three\n${TABLES}\n\`\`\`\n| x |\n|---|\n\`\`\``);
  assert.equal(m.headings, 3);
  assert.equal(m.tables, 2);
});

test('a short verdict passes, and a long or over-structured reply is a breach', () => {
  assert.deepEqual(breaches('¿lo cumple?', 'No. Hay que sumar el paso al método.'), []);
  assert.match(breaches('¿lo cumple?', LONG).join(), /300 words/);
  assert.match(breaches('¿lo cumple?', TABLES).join(), /2 tables/);
});

test('a requested report, plan or document licenses length', () => {
  for (const ask of ['write the report', 'armá el plan', 'redactá el documento', 'explicalo en detalle']) {
    assert.deepEqual(breaches(ask, LONG), [], ask);
  }
});

test('the Stop hook blocks an over-long reply once, and stays silent when quality is off', (t) => {
  const lines = [user('¿es de crew?'), said(LONG)];
  assert.equal(run(t, lines).decision, 'block');
  assert.match(run(t, lines).reason, /verdict first/);
  assert.equal(run(t, lines, { active: true }), null, 'blocks once per stop');
  assert.equal(run(t, lines, { config: { quality: 'off' } }), null);
  assert.equal(run(t, [user('¿es de crew?'), said('Sí.')]), null);
});
