const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { summary } = require('../hooks/lib/work-state');
const root = path.resolve(__dirname, '..');

function fixture(t, config) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-mem-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  if (config) put(dir, 'crew.json', JSON.stringify(config));
  return dir;
}
function put(dir, file, text) {
  const target = path.join(dir, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text);
}
const item = (status, rows, verification = '') => `# 001\n\n- **Status:** ${status}\n\n## Estimation\n\n| Milestone | Est. hours | Started | Finished | Actual hours | Notes |\n|---|---|---|---|---|---|\n${rows}\n| **Total** | 2 | — | — | | |\n${verification}`;
const hook = (file, input) => spawnSync(process.execPath, [path.join(root, 'hooks', file)], {
  input: JSON.stringify(input), encoding: 'utf8', cwd: input.cwd, windowsHide: true,
  env: { ...process.env, PLUGIN_ROOT: '', CLAUDE_PLUGIN_ROOT: root, CLAUDE_PROJECT_DIR: '' } });

test('an open milestone, a delivered item and planned verification are reported in at most six lines', t => {
  const dir = fixture(t, { mode: 'team' });
  for (let i = 1; i <= 5; i++) put(dir, `docs/requirements/p/00${i}-x.md`, item('In progress', `| M${i} | 1 | 2026-10-07 10:0${i} -03:00 | | | |`));
  put(dir, 'docs/stories/f/001-y.md', item('Delivered', '| A | 1 | 2026-10-07 09:00 -03:00 | 2026-10-07 10:00 -03:00 | 1 | |',
    '\n## Verification\n\n| Scenario | Level | Harness | Artifact | Status |\n|---|---|---|---|---|\n| s | unit | x | t.js | planned |\n'));
  put(dir, 'docs/stories/f/002-closed.md', item('Closed', '| A | 1 | 2026-10-07 09:00 -03:00 | | | |'));
  const lines = summary(dir);
  assert.ok(lines.length <= 6);
  assert.match(lines[0], /Open milestones \(5\).*\+3 more/);
  assert.match(lines[1], /awaiting validation \(1\)/);
  assert.match(lines[2], /still `planned` \(1\)/);
  assert.ok(!lines.join('\n').includes('002-closed'), 'closed items are history');
});

test('SessionStart shows work in progress in team, stays silent in solo and when nothing is in flight', t => {
  const team = fixture(t, { mode: 'team', configuredWith: '0.27.0' });
  put(team, 'docs/requirements/p/001-x.md', item('In progress', '| M | 1 | 2026-10-07 10:00 -03:00 | | | |'));
  assert.match(hook('session-start.js', { cwd: team }).stdout, /## crew — work in progress[\s\S]*001-x\.md` → M/);
  const solo = fixture(t, { mode: 'solo', configuredWith: '0.27.0' });
  put(solo, 'docs/requirements/p/001-x.md', item('In progress', '| M | 1 | 2026-10-07 10:00 -03:00 | | | |'));
  assert.doesNotMatch(hook('session-start.js', { cwd: solo }).stdout, /work in progress/);
  const idle = fixture(t, { mode: 'team', configuredWith: '0.27.0' });
  assert.doesNotMatch(hook('session-start.js', { cwd: idle }).stdout, /work in progress/);
});

test('PreCompact names open milestones and is silent otherwise', t => {
  const dir = fixture(t, { mode: 'team' });
  assert.equal(hook('precompact-reminder.js', { cwd: dir }).stdout, '');
  put(dir, 'docs/requirements/p/001-x.md', item('In progress', '| M | 1 | 2026-10-07 10:00 -03:00 | | | |'));
  assert.match(JSON.parse(hook('precompact-reminder.js', { cwd: dir }).stdout).systemMessage, /1 milestone\(s\) still open/);
});
