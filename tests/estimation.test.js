const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { estimationTable } = require('../hooks/lib/estimation');
const { resolve } = require('../hooks/lib/standards');
const { problems, deprecations } = require('../hooks/lib/shape');
const { state } = require('../hooks/lib/work-state');
const root = path.resolve(__dirname, '..');

function fixture(t, config) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-est-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  if (config) put(dir, 'crew.json', JSON.stringify(config));
  return dir;
}
function put(dir, file, text) {
  const target = path.join(dir, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text);
  return target;
}
function hook(script, input) {
  const out = spawnSync(process.execPath, [path.join(root, 'hooks', script)], {
    input: JSON.stringify(input), encoding: 'utf8', cwd: input.cwd, windowsHide: true,
    env: { ...process.env, PLUGIN_ROOT: '', CLAUDE_PLUGIN_ROOT: '' },
  });
  assert.equal(out.status, 0, out.stderr);
  return out.stdout.trim() ? JSON.parse(out.stdout).hookSpecificOutput : null;
}
const write = (dir, rel, content) => ({ cwd: dir, tool_name: 'Write', tool_input: { file_path: path.join(dir, rel), content } });

const CURRENT = '| Milestone | Est. hours | Est. AI hours | Started | Finished | Actual hours | Actual AI hours | Notes |\n|---|---|---|---|---|---|---|---|\n';
const LEGACY = '| Milestone | Est. hours | Started | Finished | Actual hours | Notes |\n|---|---|---|---|---|---|\n';
const S = '2000-01-01 00:00 Z', F = '2000-01-01 01:00 Z';
const item = (status, table) => `# 001 — x\n\n- **Status:** ${status}\n\n## Estimation\n\n${table}`;
const closedCurrent = (rows) => item('Closed', CURRENT + rows);

test('reader: the current table by column name, the legacy one by position', () => {
  const current = estimationTable(item('Open', CURRENT + `| Build | 4 | 0.5 | ${S} | ${F} | 1 | 0.4 | |\n| **Total** | 4 | 0.5 | — | — | 1 | 0.4 | |\n`));
  assert.equal(current.ai, true);
  assert.deepEqual([current.rows[0].est, current.rows[0].estAi, current.rows[0].started, current.rows[0].actual, current.rows[0].actualAi], ['4', '0.5', S, '1', '0.4']);
  assert.equal(current.rows[1].total, true);
  const legacy = estimationTable(item('Open', LEGACY + `| Build | 4 | ${S} | ${F} | 1 | AI est. 0.5 h |\n`));
  assert.equal(legacy.ai, false);
  assert.deepEqual([legacy.rows[0].est, legacy.rows[0].started, legacy.rows[0].actual, legacy.rows[0].estAi], ['4', S, '1', undefined]);
  const spanish = estimationTable(item('Open', '| Hito | Est. horas | Est. horas IA | Inicio | Fin | Horas reales | Horas IA reales | Notas |\n|---|---|---|---|---|---|---|---|\n| A | 2 | 1 | x | y | 3 | 0.5 | |\n'));
  assert.deepEqual([spanish.rows[0].est, spanish.rows[0].estAi, spanish.rows[0].started, spanish.rows[0].actual, spanish.rows[0].actualAi], ['2', '1', 'x', '3', '0.5']);
});

test('closure gate: the AI columns must be answered once the table carries them', t => {
  const dir = fixture(t, { mode: 'team' });
  const close = (content) => hook('guard-estimation.js', write(dir, 'docs/requirements/p/001-x.md', content));
  const review = `| Human review | 1 | 0 | ${S} | ${F} | 0.5 | — | |\n`;
  assert.equal(close(closedCurrent(`| Build | 4 | 0.5 | ${S} | ${F} | 1 | 0.4 | |\n${review}| **Total** | 5 | 0.5 | — | — | 1.5 | 0.4 | |\n`)), null,
    'a complete table closes; "—" answers Actual AI hours');
  assert.match(close(closedCurrent(`| Build | 4 | | ${S} | ${F} | 1 | 0.4 | |\n| **Total** | 4 | 0 | — | — | 1 | 0.4 | |\n`)).permissionDecisionReason,
    /"Build" is missing Est\. AI hours or Actual AI hours/);
  assert.match(close(closedCurrent(`| Build | 4 | 0.5 | ${S} | ${F} | 1 | 0.4 | |\n| **Total** | 4 | | — | — | 1 | 0.4 | |\n`)).permissionDecisionReason,
    /Total\*\* row is missing estimated or actual AI hours/);
});

test('closure gate: a legacy table still closes, with or without "AI est." in Notes', t => {
  const dir = fixture(t, { mode: 'team' });
  for (const notes of ['', 'AI est. 0.5 h']) {
    const content = item('Closed', LEGACY + `| Build | 4 | ${S} | ${F} | 1 | ${notes} |\n| **Total** | 4 | — | — | 1 | |\n`);
    assert.equal(hook('guard-estimation.js', write(dir, 'docs/requirements/p/001-x.md', content)), null);
  }
});

test('timestamps guard reads the current table by name; AI hours may exceed the wall clock', t => {
  const dir = fixture(t, { mode: 'solo', metrics: true });
  const rel = 'docs/stories/f/001-x.md';
  const stale = hook('guard-timestamps.js', write(dir, rel, item('Open', CURRENT + `| Build | 4 | 1 | ${S} | | | | |\n`)));
  assert.match(stale.permissionDecisionReason, /"Build": Started "2000-01-01 00:00 Z" is not the real current time/);
  put(dir, rel, item('Open', CURRENT + `| Build | 4 | 1 | ${S} | | | | |\n`));
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())} Z`;
  const span = (now - Date.parse('2000-01-01T00:00:00Z')) / 3600000;
  const finished = item('Open', CURRENT + `| Build | 4 | 1 | ${S} | ${stamp} | 1 | ${Math.ceil(span * 3)} | parallel agents |\n`);
  assert.equal(hook('guard-timestamps.js', write(dir, rel, finished)), null);
  const planned = item('Open', CURRENT + '| Build | 4 | 1 | | | | | |\n| **Total** | 4 | 1 | — | — | | | |\n');
  assert.equal(hook('guard-timestamps.js', write(dir, 'docs/stories/f/002-y.md', planned)), null, 'the Total row is not a milestone');
});

test('shape: legacy and current estimation tables stand for one another during the window', t => {
  const dir = fixture(t, {});
  const target = path.join(dir, 'docs/requirements/p/001-x.md');
  const crew = resolve(target, root);
  const legacyItem = item('Draft', LEGACY + '| A | 1 | | | | |\n| **Total** | 1 | — | — | | |\n');
  assert.ok(!problems(legacyItem, crew).some((p) => /table "Estimation"/.test(p)), 'legacy item conforms to the crew template');
  assert.match(deprecations(legacyItem, crew)[0], /legacy shape, accepted until the next minor version/);
  const tpl = fs.readFileSync(path.join(root, 'templates/docs/requirements/README.md'), 'utf8')
    .replace(/\| Milestone \| Est\. hours \| Est\. AI hours[^\n]*\n[^\n]*\n/, LEGACY);
  put(dir, 'docs/requirements/README.md', tpl);
  const own = resolve(target, root);
  assert.equal(own.source, 'project');
  const currentItem = item('Draft', CURRENT + '| A | 1 | 0 | | | | | |\n| **Total** | 1 | 0 | — | — | | | |\n');
  assert.ok(!problems(currentItem, own).some((p) => /table "Estimation"/.test(p)), 'current item conforms to a legacy project template');
  const other = item('Draft', '| Hito | Horas |\n|---|---|\n| A | 1 |\n| **Total** | 1 |\n');
  assert.ok(problems(other, own).some((p) => /table "Estimation" has columns Hito \| Horas/), 'any other shape still deviates');
});

test('conformance: prints the dual-estimate rule and flags legacy tables as deprecated', t => {
  const dir = fixture(t);
  const file = put(dir, 'docs/requirements/p/001-x.md', item('Draft', LEGACY + '| A | 1 | | | | |\n| **Total** | 1 | — | — | | |\n'));
  const run = (...args) => spawnSync(process.execPath, [path.join(root, 'scripts/conformance.js'), ...args], { encoding: 'utf8', windowsHide: true });
  const described = run(file).stdout;
  assert.match(described, /Table "Estimation": Milestone \| Est\. hours \| Est\. AI hours \| Started/);
  assert.match(described, /Every milestone carries two estimates/);
  const checked = run('--check', file).stdout;
  assert.doesNotMatch(checked, /table "Estimation"/);
  assert.match(checked, /· deprecated: the estimation table has no AI columns/);
});

test('metrics: AI estimate deviation is reported only where the table carries both AI figures', t => {
  const dir = fixture(t);
  spawnSync('git', ['init', '-q'], { cwd: dir, windowsHide: true });
  const rows = (ai) => `| Build | 4 | ${ai} | 2026-10-01 10:00 -03:00 | 2026-10-01 12:00 -03:00 | 1 | 0.5 | |\n| Human review | 1 | 0 | 2026-10-01 12:00 -03:00 | 2026-10-01 13:00 -03:00 | 1 | — | |\n`;
  put(dir, 'docs/requirements/p/001-a.md', closedCurrent(rows('1') + '| **Total** | 5 | 1 | — | — | 2 | 0.5 | |\n'));
  put(dir, 'docs/requirements/p/002-b.md', item('Closed', LEGACY + '| A | 2 | 2026-10-01 10:00 -03:00 | 2026-10-01 13:00 -03:00 | 3 | |\n| **Total** | 2 | — | — | 3 | |\n'));
  const out = spawnSync(process.execPath, [path.join(root, 'scripts/metrics.js')], { cwd: dir, encoding: 'utf8', windowsHide: true }).stdout;
  assert.match(out, /\| Item \| Lead \(days\) \| Exec \(h\) \| Est \(h\) \| Actual \(h\) \| Deviation \| Est AI \(h\) \| Actual AI \(h\) \| AI deviation \|/);
  assert.match(out, /001-a\.md \| [\d.]+ \| 3\.0 \| 5\.0 \| 2\.0 \| -60% \| 1\.0 \| 0\.5 \| -50% \|/);
  assert.match(out, /002-b\.md \| [\d.]+ \| 3\.0 \| 2\.0 \| 3\.0 \| 50% \| — \| — \| — \|/);
  assert.match(out, /AI estimate deviation: avg -50% \(1 of 2 items carry both AI figures\)/);
});

test('work state finds open milestones in the current table', t => {
  const dir = fixture(t);
  put(dir, 'docs/requirements/p/001-x.md', item('In progress', CURRENT + `| Build | 4 | 1 | ${S} | | | | |\n| **Total** | 4 | 1 | — | — | | | |\n`));
  assert.deepEqual(state(dir).open.map((o) => [o.milestone, o.started]), [['Build', S]]);
});
