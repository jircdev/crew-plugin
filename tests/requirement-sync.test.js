const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { withLink } = require('../scripts/lib/requirement-sync');
const { ensureHook, MARK } = require('../scripts/lib/requirement-hook');
const w = require('./requirement-world');

const { ACTIVITY, TOKEN, REL, requirement } = w;
const LINK = new RegExp(`\\*\\*Factory activity:\\*\\* ${ACTIVITY}`);

test('committing a new requirement loads it and writes its link in the commit and in the file', async t => {
  const f = await w.factory(t);
  const r = w.repo(t, { api: f.api });
  const out = await w.run(r);
  assert.equal(out.status, 0, out.stderr);
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].url, '/api/v1/activity/requirements');
  assert.equal(f.calls[0].auth, `Bearer ${TOKEN}`);
  assert.deepEqual(f.calls[0].body.repository, { provider: 'github', repo: 'acme/plans' });
  assert.equal(f.calls[0].body.status, 'proposed');
  assert.equal(f.calls[0].body.costCenterName, 'MVP');
  assert.equal(f.calls[0].body.milestones.length, 3);
  assert.match(w.staged(r.dir), LINK);
  assert.match(w.working(r.dir), LINK);
  assert.doesNotMatch(out.stderr + out.stdout, new RegExp(TOKEN));

  // Loading it again changes nothing in the file.
  const before = w.staged(r.dir);
  assert.equal((await w.run(r)).status, 0);
  assert.equal(w.staged(r.dir), before);
});

test('through the real hook, a commit by path carries the link and leaves the file clean', async t => {
  const f = await w.factory(t);
  const r = w.repo(t, { api: f.api });
  w.git(r.dir, ['commit', '-qm', 'base', '--', 'crew.json']);
  assert.equal(ensureHook(r.dir, w.PLUGIN).action, 'wrote');
  const done = await w.commit(r, ['-qm', 'plan', '--', REL]);
  assert.equal(done.status, 0, done.stderr);
  assert.match(w.git(r.dir, ['show', `HEAD:${REL}`]).stdout, LINK);
  assert.equal(w.git(r.dir, ['status', '--short']).stdout.trim(), '');
});

test('factory down: the commit goes on, the file waits in the queue, and the session retry writes the link', async t => {
  const r = w.repo(t);
  const out = await w.run(r);
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stderr, /NOT loaded into factory/);
  assert.doesNotMatch(w.staged(r.dir), /Factory activity/);
  const waiting = w.queued(r.home);
  assert.equal(waiting.length, 1);
  assert.deepEqual(Object.keys(waiting[0]).sort(), ['hash', 'path', 'queuedAt', 'root']);
  assert.doesNotMatch(JSON.stringify(waiting), /invoice each|fct_/i);

  const f = await w.factory(t);
  const cfg = JSON.parse(fs.readFileSync(path.join(r.dir, 'crew.json'), 'utf8'));
  cfg.factory.url = f.api;
  fs.writeFileSync(path.join(r.dir, 'crew.json'), JSON.stringify(cfg));
  const session = await w.run(r, ['--session'], {}, JSON.stringify({ cwd: r.dir }));
  assert.equal(session.status, 0, session.stderr);
  assert.match(session.stdout, /reached factory after waiting in the queue/);
  assert.match(session.stdout, /added its requirement step/);
  assert.match(w.working(r.dir), LINK);
  assert.deepEqual(w.queued(r.home), []);
  assert.match(fs.readFileSync(path.join(r.dir, '.git', 'hooks', 'pre-commit'), 'utf8'), new RegExp(MARK));
});

test('a factory deployed before the entry existed queues the file like a factory that is down', async t => {
  const f = await w.factory(t, () => [404, { status: false, error: { message: 'Not found' } }]);
  const r = w.repo(t, { api: f.api });
  const out = await w.run(r);
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stderr, /does not take requirements at commit yet/);
  assert.equal(w.queued(r.home).length, 1);
});

test('factory refuses, or the machine cannot sign in: the commit stops with the reason', async t => {
  const f = await w.factory(t, () => [400, { status: false, error: { message: 'The project has no open cost center named "MVP"' } }]);
  const r = w.repo(t, { api: f.api });
  const refused = await w.run(r);
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /factory refused it \(HTTP 400: The project has no open cost center named "MVP"\)/);
  assert.match(refused.stderr, /\*\*Factory:\*\* skip/);
  assert.doesNotMatch(refused.stderr, new RegExp(TOKEN));
  assert.doesNotMatch(w.staged(r.dir), /Factory activity/);

  const signedOut = await w.run(r, [], { FACTORY_TOKEN: null });
  assert.equal(signedOut.status, 1);
  assert.match(signedOut.stderr, /not connected to factory\. Run \/crew:factory login/);
  assert.equal(f.calls.length, 1);
});

test('a token factory no longer accepts stops a file without link and queues a linked one', async t => {
  const f = await w.factory(t, () => [401, { status: false, error: { message: 'Personal access token is unknown, revoked or expired' } }]);
  const fresh = w.repo(t, { api: f.api });
  const stopped = await w.run(fresh);
  assert.equal(stopped.status, 1);
  assert.match(stopped.stderr, /does not accept the token.*\/crew:factory login/);

  const linked = w.repo(t, { api: f.api, text: withLink(requirement(), ACTIVITY) });
  const out = await w.run(linked);
  assert.equal(out.status, 0, out.stderr);
  assert.equal(w.queued(linked.home).length, 1);
});

test('Factory: skip sends nothing and stands as the link; a secret stops the commit before sending', async t => {
  const f = await w.factory(t);
  const skip = w.repo(t, { api: f.api, text: requirement('Draft', '- **Factory:** skip\n') });
  assert.equal((await w.run(skip)).status, 0);

  const leak = w.repo(t, { api: f.api, text: `${requirement()}\nUse ghp_abcdefghijklmnopqrstuvwxyz0123456789 to deploy.\n` });
  const out = await w.run(leak);
  assert.equal(out.status, 1);
  assert.match(out.stderr, /GitHub token in plain text/);
  assert.doesNotMatch(out.stderr, /ghp_abcdefghijklmnopqrstuvwxyz0123456789/);
  assert.equal(f.calls.length, 0);
});

test('without factory in crew.json, or with the step turned off, nothing happens', async t => {
  const f = await w.factory(t);
  const plain = w.repo(t, { api: f.api, factory: false });
  assert.equal((await w.run(plain)).status, 0);
  const off = w.repo(t, { api: f.api });
  assert.equal((await w.run(off, [], { CREW_REQUIREMENT_SYNC: 'off' })).status, 0);
  const session = await w.run(plain, ['--session'], {}, JSON.stringify({ cwd: plain.dir }));
  assert.equal(session.stdout, '');
  assert.ok(!fs.existsSync(path.join(plain.dir, '.git', 'hooks', 'pre-commit')));
  assert.equal(f.calls.length, 0);
});
