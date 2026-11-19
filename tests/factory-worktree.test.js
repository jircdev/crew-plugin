const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { factory, tempHome, runScript, TOKEN } = require('./fixtures/factory-fake');
const { loadConfig } = require('../hooks/lib/config');
const { mainCheckout, counterpart } = require('../hooks/lib/main-checkout');

const MAIN_PROJECT = '11111111-2222-4333-8444-555555555555';
const BRANCH_PROJECT = '99999999-2222-4333-8444-555555555555';
const MIN = 60000;
const T0 = Math.floor((Date.now() - 2 * 86400000) / MIN) * MIN;
const at = (m) => new Date(T0 + m * MIN).toISOString();

// A main checkout linked to prod, a worktree inside it and one beside it,
// both cut from a branch whose crew.json still points at dev and another
// project, and a nested project with a crew.json of its own.
function repository(t, mainCrew = { factory: { projectId: MAIN_PROJECT } }) {
  const main = tempHome(t);
  fs.mkdirSync(path.join(main, '.git'));
  fs.writeFileSync(path.join(main, 'crew.json'), JSON.stringify(mainCrew));
  const stale = JSON.stringify({ factory: { projectId: BRANCH_PROJECT, environment: 'dev' } });
  const worktree = (name, dir) => {
    fs.mkdirSync(path.join(main, '.git', 'worktrees', name), { recursive: true });
    fs.writeFileSync(path.join(main, '.git', 'worktrees', name, 'commondir'), '../..\n');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, '.git'), `gitdir: ${path.join(main, '.git', 'worktrees', name)}\n`);
    fs.writeFileSync(path.join(dir, 'crew.json'), stale);
    return dir;
  };
  const inner = worktree('inner', path.join(main, '.claude', 'worktrees', 'inner'));
  const beside = worktree('beside', path.join(tempHome(t), 'beside'));
  const nested = path.join(main, 'tools', 'other');
  fs.mkdirSync(nested, { recursive: true });
  fs.writeFileSync(path.join(nested, 'crew.json'), JSON.stringify({ factory: { projectId: BRANCH_PROJECT } }));
  return { main, inner, beside, nested };
}

test('a worktree resolves to its main checkout, wherever it lives', t => {
  const r = repository(t);
  assert.equal(mainCheckout(path.join(r.inner, 'src')), r.main);
  assert.equal(mainCheckout(r.beside), r.main);
  assert.equal(mainCheckout(r.main), r.main);
  assert.equal(counterpart(r.main), null);
  assert.equal(counterpart(path.join(r.beside, 'pkg')), path.join(r.main, 'pkg'));
  assert.equal(mainCheckout(tempHome(t)), null);
});

test('live capture in a worktree uses the main checkout link, never the branch copy', t => {
  const r = repository(t);
  for (const dir of [r.inner, r.beside]) {
    const cfg = loadConfig(path.join(dir, 'src'));
    assert.equal(cfg.factory.projectId, MAIN_PROJECT);
    assert.equal(cfg.factory.environment || 'prod', 'prod');
  }
  assert.equal(loadConfig(r.nested).factory.projectId, BRANCH_PROJECT, 'a nested project keeps its own link');
});

test('a main checkout without a factory link leaves the worktree its own', t => {
  const r = repository(t, { mode: 'team' });
  assert.equal(loadConfig(r.inner).factory.projectId, BRANCH_PROJECT);
});

// Sessions in each place, written as Claude Code transcripts.
function transcripts(t, sessions) {
  const config = tempHome(t);
  fs.mkdirSync(path.join(config, 'projects', 'p'), { recursive: true });
  for (const [id, cwd] of sessions) {
    const records = [
      { type: 'user', timestamp: at(0), message: { role: 'user', content: 'prompt' } },
      { type: 'assistant', timestamp: at(10), message: { role: 'assistant', content: [{ type: 'text', text: 'answer' }] } },
    ].map((r, i) => JSON.stringify({ uuid: `${id}-${i}`, sessionId: id, cwd, ...r }));
    fs.writeFileSync(path.join(config, 'projects', 'p', `${id}.jsonl`), records.join('\n') + '\n');
  }
  return config;
}

test('backfill counts worktree sessions for the repository they belong to, and only those', t => {
  const r = repository(t);
  const removed = path.join(r.main, '.claude', 'worktrees', 'gone');
  const config = transcripts(t, [['main', r.main], ['inner', path.join(r.inner, 'src')], ['beside', r.beside],
    ['removed', removed], ['nested', r.nested], ['elsewhere', tempHome(t)]]);
  process.env.CLAUDE_CONFIG_DIR = config;
  t.after(() => { delete process.env.CLAUDE_CONFIG_DIR; });
  const { rebuild } = require('../scripts/factory-backfill');
  const { intervals } = rebuild(r.main, MAIN_PROJECT, T0 - 3600000, Date.now());
  const sessions = [...new Set(intervals.map((i) => i.sessionId))].sort();
  assert.deepEqual(sessions, ['beside', 'inner', 'main', 'removed']);
  assert.ok(intervals.every((i) => i.projectId === MAIN_PROJECT));
});

test('backfill run from inside a worktree rebuilds the main repository on its link', async t => {
  const fake = await factory(t);
  const r = repository(t);
  const home = tempHome(t);
  fs.writeFileSync(path.join(home, 'factory-token'), TOKEN);
  const fingerprint = createHash('sha256').update(TOKEN).digest('hex');
  fs.writeFileSync(path.join(home, 'factory-token.json'), JSON.stringify({ fingerprint, connectedAt: at(-60) }));
  const config = transcripts(t, [['main', r.main], ['inner', r.inner]]);
  const out = await runScript('factory-backfill', [], { home, cwd: r.inner, api: fake.api, env: { CLAUDE_CONFIG_DIR: config } });
  assert.equal(out.status, 0, out.stdout);
  assert.match(out.stdout, new RegExp(`${path.basename(r.main)} → factory project ${MAIN_PROJECT}.*from 2 sessions`));
});

test('a folder recorded in Git Bash form is read as the Windows path it names', { skip: process.platform !== 'win32' }, () => {
  const { nativePath } = require('../scripts/lib/transcripts');
  assert.equal(nativePath('/c/w/bg/jad/.claude/worktrees/x'), 'C:/w/bg/jad/.claude/worktrees/x');
  assert.equal(nativePath('C:\w\bg\jad'), 'C:\w\bg\jad');
});
