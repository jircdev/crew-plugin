const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { execFileSync } = require('node:child_process');
const { randomUUID, createHash } = require('node:crypto');
const { normalizeFactory } = require('../hooks/lib/factory-env');
const { factory: fakeFactory, tempHome, runScript, browser, TOKEN, PERSON } = require('./fixtures/factory-fake');

const PROJECT = '11111111-2222-4333-8444-555555555555';
const OLD = 'fct_old_' + 'b'.repeat(36);
const cfg = { factory: normalizeFactory({ projectId: PROJECT }) };
const queue = () => require('../hooks/lib/activity-queue');
const factory = () => require('../hooks/lib/factory');
const fingerprint = (token) => createHash('sha256').update(token).digest('hex');

function home(t) {
  const dir = tempHome(t);
  process.env.CREW_HOME = dir;
  return dir;
}
function interval(minutesAgo = 5) {
  const end = Date.now() - minutesAgo * 60000;
  return { id: randomUUID(), kind: 'human', startedAt: new Date(end - 60000).toISOString(),
    endedAt: new Date(end).toISOString(), sessionId: 's', projectId: PROJECT };
}
// Writes the metadata login would have stored for `token`.
function meta(dir, token, fields) {
  fs.writeFileSync(path.join(dir, 'factory-token.json'), JSON.stringify({ fingerprint: fingerprint(token), ...fields }));
}
const items = (dir) => {
  const file = path.join(dir, 'activity', 'queue.jsonl');
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean) : [];
};
const status = (dir) => JSON.parse(fs.readFileSync(path.join(dir, 'activity', 'status.json'), 'utf8'));
function refuse(t) {
  let calls = 0;
  const srv = http.createServer((req, res) => { calls++; res.writeHead(401).end('{}'); });
  t.after(() => srv.close());
  return new Promise((resolve) => srv.listen(0, '127.0.0.1', () =>
    resolve({ url: `http://127.0.0.1:${srv.address().port}/api/v1`, calls: () => calls })));
}

test('an expired token keeps the queue and keeps capturing; nothing is sent until the next login', async t => {
  const dir = home(t);
  process.env.FACTORY_TOKEN = OLD;
  t.after(() => { delete process.env.FACTORY_TOKEN; });
  meta(dir, OLD, { expiresAt: new Date(Date.now() - 3600000).toISOString() });
  queue().enqueue([interval(), interval(), interval(50 * 24 * 60)]);
  const api = await refuse(t);
  await queue().flush(api.url, OLD, Date.now());
  assert.equal(api.calls(), 0);
  assert.equal(items(dir).length, 2, 'the interval older than 45 days goes');
  assert.equal(queue().queuedCount(), 2);
  assert.equal(items(dir).length, 2, 'counting moves nothing');
  assert.equal(status(dir).problem, 'expired');
  assert.equal(factory().tokenState(OLD), 'expired');
  assert.equal(factory().captureToken(cfg), OLD);
});

test('a 401 at the expiry keeps the queue; a 401 before it is a revocation and clears everything', async t => {
  const dir = home(t);
  const api = await refuse(t);
  meta(dir, OLD, { expiresAt: new Date(Date.now() + 60000).toISOString() });
  queue().enqueue([interval()]);
  await queue().flush(api.url, OLD, Date.now());
  assert.equal(items(dir).length, 1);
  assert.equal(status(dir).problem, 'expired');
  meta(dir, OLD, { expiresAt: new Date(Date.now() + 86400000).toISOString() });
  fs.rmSync(path.join(dir, 'factory-token.rejected'), { force: true });
  await queue().flush(api.url, OLD, Date.now());
  assert.deepEqual(items(dir), []);
  assert.equal(status(dir).problem, 'rejected');
  assert.equal(factory().tokenState(OLD), 'revoked');
});

test('the status keeps when a problem started across flushes', async t => {
  const dir = home(t);
  queue().enqueue([interval()]);
  await queue().flush('http://127.0.0.1:9/api/v1', 'fct_x', Date.now());
  const first = status(dir);
  await queue().flush('http://127.0.0.1:9/api/v1', 'fct_x', Date.now() + 60000);
  assert.equal(status(dir).since, first.since);
  assert.notEqual(status(dir).at, first.at);
});

test('the activity folder is readable by its owner only', t => {
  const dir = home(t);
  const folder = queue().activityDir();
  if (process.platform === 'win32') {
    const acl = execFileSync('icacls', [folder], { encoding: 'utf8' });
    assert.ok(acl.includes(os.userInfo().username));
    assert.equal(/BUILTIN\\Users|Everyone|Authenticated Users/i.test(acl), false, acl);
  } else {
    assert.equal(fs.statSync(folder).mode & 0o777, 0o700);
  }
  assert.ok(fs.existsSync(path.join(dir, 'activity')));
});

function seedQueue(dir, n) {
  fs.mkdirSync(path.join(dir, 'activity'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'activity', 'queue.jsonl'),
    Array.from({ length: n }, () => JSON.stringify(interval())).join('\n') + '\n');
}

test('a login of the same person on the same factory sends the time kept while the token was expired', async t => {
  const fake = await fakeFactory(t);
  const dir = tempHome(t);
  fs.writeFileSync(path.join(dir, 'factory-token'), OLD);
  meta(dir, OLD, { expiresAt: '2026-10-30T00:00:00Z', connectedAt: '2026-08-01T00:00:00Z', person: PERSON.personId, api: fake.api });
  seedQueue(dir, 3);
  const out = await runScript('factory-login', ['login'], { home: dir, api: fake.api, onLine: browser(fake) });
  assert.equal(out.status, 0, out.stdout);
  assert.match(out.stdout, /Sent 3 intervals/);
  assert.equal(fake.seen.intervals.length, 3);
  const stored = JSON.parse(fs.readFileSync(path.join(dir, 'factory-token.json'), 'utf8'));
  assert.equal(stored.connectedAt, '2026-08-01T00:00:00Z');
  assert.equal(stored.expiresAt, '2027-01-05T00:00:00Z');
  assert.equal(stored.fingerprint, fingerprint(TOKEN));
  assert.equal(out.stdout.includes(TOKEN), false);
});

test('a login of another person or another factory never sends the queued time', async t => {
  const fake = await fakeFactory(t);
  for (const previous of [{ person: 'someone-else', api: fake.api }, { person: PERSON.personId, api: 'https://other/api/v1' }, null]) {
    const dir = tempHome(t);
    if (previous) meta(dir, OLD, { expiresAt: '2026-10-30T00:00:00Z', ...previous });
    seedQueue(dir, 2);
    const out = await runScript('factory-login', ['login'], { home: dir, api: fake.api, onLine: browser(fake) });
    assert.equal(out.status, 0, out.stdout);
    assert.match(out.stdout, /Discarded 2 queued intervals/);
    assert.equal(items(dir).length, 0);
  }
  assert.equal(fake.seen.intervals.length, 0);
});

test('status says an expired token keeps the time; logout clears the queue', async t => {
  const fake = await fakeFactory(t);
  const dir = tempHome(t);
  fs.writeFileSync(path.join(dir, 'factory-token'), OLD);
  meta(dir, OLD, { expiresAt: '2026-10-30T00:00:00Z' });
  seedQueue(dir, 2);
  const out = await runScript('factory-login', ['status'], { home: dir, api: fake.api });
  assert.match(out.stdout, /expired on 2026-10-30\. Your time is still recorded here/);
  assert.match(out.stdout, /2 captured intervals are waiting/);
  await runScript('factory-login', ['logout'], { home: dir, api: fake.api });
  assert.equal(items(dir).length, 0);
  assert.equal(fs.existsSync(path.join(dir, 'factory-token.json')), false);
});

test('a folder left open by an earlier version is locked down on first use', t => {
  const dir = home(t);
  fs.mkdirSync(path.join(dir, 'activity'), { mode: 0o755 });
  queue().activityDir();
  assert.ok(fs.existsSync(path.join(dir, 'activity', '.owner-only')));
  if (process.platform !== 'win32') assert.equal(fs.statSync(path.join(dir, 'activity')).mode & 0o777, 0o700);
});

test('a login factory cannot identify holds the queue aside; a later confirmed login sends it', async t => {
  const options = { noMcp: true };
  const fake = await fakeFactory(t, options);
  const dir = tempHome(t);
  meta(dir, OLD, { expiresAt: '2026-10-30T00:00:00Z', person: PERSON.personId, api: fake.api });
  seedQueue(dir, 2);
  const held = await runScript('factory-login', ['login'], { home: dir, api: fake.api, onLine: browser(fake) });
  assert.match(held.stdout, /Kept 2 queued intervals aside: factory could not confirm whose they are/);
  assert.equal(fake.seen.intervals.length, 0);
  assert.equal(items(dir).length, 0);
  options.noMcp = false;
  const sent = await runScript('factory-login', ['login'], { home: dir, api: fake.api, onLine: browser(fake) });
  assert.equal(sent.status, 0, sent.stdout);
  assert.match(sent.stdout, /Sent 2 intervals/);
  assert.equal(fake.seen.intervals.length, 2);
});
