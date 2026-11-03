const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { readRepository, codeOf } = require('../scripts/lib/repo-hours-read');

const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

// A repository with one requirement, one work log, committed by `email`.
function repo(t, files, email = 'Dev@Example.com') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-repo-hours-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  git(root, 'init', '-q');
  git(root, 'config', 'user.email', email);
  git(root, 'config', 'user.name', 'Dev');
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  }
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', 'docs: SECRET COMMIT MESSAGE');
  return root;
}

const REQUIREMENT = `# 001 — Something

- **Status:** In progress

## Estimation

| Milestone | Est. hours | Est. AI hours | Started | Finished | Actual hours | Actual AI hours | Notes |
|---|---|---|---|---|---|---|---|
| M1 First step | 2 | 0,2 | 2026-10-06 10:00 -03:00 | 2026-10-06 12:30 -03:00 | 1,5 | 0,4 | SECRET NOTE |
| M2 Second step | 1 | 0,1 | — | — | — | — | |
| **Total** | **3** | **0,3** | — | — | — | — | |
`;

const WORK_LOG = `# A day of work

- **Date**: 2026-10-07
- **Duration**: 09:00 -03:00 a 10:30 -03:00, SECRET PROSE about [the requirement](../../requirements/plan/001-something.md).
`;

test('reads timed estimation rows with their commit author and nothing else', (t) => {
  const root = repo(t, { 'docs/requirements/plan/001-something.md': REQUIREMENT });
  const read = readRepository(root, 'acme/app');
  assert.deepEqual(read.requirements, [{
    path: 'docs/requirements/plan/001-something.md',
    code: 'R:plan/001',
    externalKey: 'acme/app:docs/requirements/plan/001-something.md',
    title: '001 — Something',
    milestones: [
      { code: 'M1', title: 'First step', estimatedHours: 2 },
      { code: 'M2', title: 'Second step', estimatedHours: 1 },
    ],
  }]);
  const [file] = read.files;
  assert.equal(file.rows.length, 1);
  assert.deepEqual({ ...file.rows[0], commit: undefined }, {
    milestone: 'M1', start: '2026-10-06T10:00:00-03:00', end: '2026-10-06T12:30:00-03:00',
    actualHours: 1.5, actualAiHours: 0.4, authorEmail: 'Dev@Example.com', commit: undefined,
  });
  assert.match(file.rows[0].commit, /^[0-9a-f]{40}$/);
  assert.doesNotMatch(JSON.stringify(read), /SECRET/);
});

test('reads a work log window on its date, linked to the work item it names', (t) => {
  const root = repo(t, {
    'docs/requirements/plan/001-something.md': REQUIREMENT,
    'docs/work/2026-10/2026-10-07_day.md': WORK_LOG,
  });
  const log = readRepository(root, 'acme/app').files.find((f) => f.kind === 'work_log');
  assert.equal(log.linkedPath, 'docs/requirements/plan/001-something.md');
  assert.deepEqual(log.rows.map((r) => [r.start, r.end, r.authorEmail]), [
    ['2026-10-07T09:00:00-03:00', '2026-10-07T10:30:00-03:00', 'Dev@Example.com'],
  ]);
  assert.doesNotMatch(JSON.stringify(log), /SECRET/);
});

test('leaves out rows that are not committed yet', (t) => {
  const root = repo(t, { 'README.md': 'x' });
  fs.mkdirSync(path.join(root, 'docs/requirements/plan'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs/requirements/plan/001-something.md'), REQUIREMENT);
  const read = readRepository(root, 'acme/app');
  assert.equal(read.files[0].rows.length, 0);
  assert.equal(read.notes.uncommitted, 1);
});

test('gives each milestone a code unique in its table, and each work item a short code', () => {
  assert.equal(codeOf('docs/stories/login/002-x.md'), 'S:login/002');
  const long = codeOf(`docs/requirements/${'a'.repeat(80)}/003-x.md`);
  assert.ok(long.length <= 60);
  assert.match(long, /^R:a+~[0-9a-f]{6}\/003$/);
});
