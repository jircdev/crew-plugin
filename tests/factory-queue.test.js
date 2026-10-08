const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { randomUUID } = require('node:crypto');
const { resolveFactory, normalizeFactory } = require('../hooks/lib/factory-env');

const PROJECT = '11111111-2222-4333-8444-555555555555';
const PROD = 'https://api.factory.balearesgroup.com/api/v1';
const DEV = 'https://api.dev.factory.balearesgroup.com/api/v1';

test('environment resolution: machine variables win over crew.json, prod by default', () => {
  const block = (raw) => normalizeFactory({ projectId: PROJECT, ...raw });
  assert.equal(resolveFactory(block({}), {}).api, PROD);
  assert.equal(resolveFactory(block({}), {}).web, 'https://factory.balearesgroup.com');
  assert.equal(resolveFactory(block({ environment: 'dev' }), {}).api, DEV);
  assert.equal(resolveFactory(block({ environment: 'dev' }), {}).web, 'https://dev.factory.balearesgroup.com');
  assert.equal(resolveFactory(block({ url: 'http://x/api/v1/' }), {}).api, 'http://x/api/v1');
  assert.equal(resolveFactory(block({ url: 'http://x/api/v1' }), { CREW_FACTORY_ENV: 'dev' }).api, DEV);
  assert.equal(resolveFactory(block({ environment: 'dev' }), { CREW_FACTORY_URL: 'http://y' }).api, 'http://y');
  assert.equal(resolveFactory(block({}), { CREW_FACTORY_WEB_URL: 'http://w/' }).web, 'http://w');
  const unknown = resolveFactory(block({ environment: 'qa' }), {});
  assert.equal(unknown.api, PROD);
  assert.match(unknown.warning, /unknown factory environment "qa"/);
});

// The queue module reads CREW_HOME at call time, so each test gets its own.
function home(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-queue-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  process.env.CREW_HOME = dir;
  return dir;
}
const queue = () => require('../hooks/lib/activity-queue');
const factory = () => require('../hooks/lib/factory');

function interval(minutesAgo = 5) {
  const end = Date.now() - minutesAgo * 60000;
  return { id: randomUUID(), kind: 'human', startedAt: new Date(end - 60000).toISOString(),
    endedAt: new Date(end).toISOString(), sessionId: 'x'.repeat(120), projectId: PROJECT,
    taskRef: { system: 'repo', externalKey: 'repo:docs/stories/a/very/long/path/to/a/story-file-name.md' } };
}

// handler(batch) → [status, body]
function server(t, handler) {
  const sizes = [];
  const srv = http.createServer((req, res) => {
    let body = '';
    req.on('data', (d) => { body += d; });
    req.on('end', () => {
      sizes.push(JSON.parse(body).intervals.length);
      const [status, text] = handler(JSON.parse(body).intervals, Buffer.byteLength(body));
      res.writeHead(status, { 'Content-Type': 'application/json' }).end(text);
    });
  });
  t.after(() => srv.close());
  return new Promise((resolve) => srv.listen(0, '127.0.0.1', () =>
    resolve({ url: `http://127.0.0.1:${srv.address().port}/api/v1`, sizes })));
}
const items = (dir) => {
  const file = path.join(dir, 'activity', 'queue.jsonl');
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean) : [];
};
const log = (dir) => fs.readFileSync(path.join(dir, 'activity', 'errors.log'), 'utf8');
const status = (dir) => JSON.parse(fs.readFileSync(path.join(dir, 'activity', 'status.json'), 'utf8'));

test('batches stay under the server body limit and a 413 splits the batch', async t => {
  const dir = home(t);
  const many = Array.from({ length: 600 }, () => interval());
  assert.ok(queue().batches(many).every((b) => Buffer.byteLength(JSON.stringify({ intervals: b })) < 100 * 1024));
  const api = await server(t, (batch, bytes) => (bytes > 20000 ? [413, '{}'] : [202, '{}']));
  queue().enqueue(many);
  await queue().flush(api.url, 'fct_ok', Date.now());
  assert.equal(items(dir).length, 0);
  assert.equal(api.sizes.reduce((a, n) => a + n, 0) > 600, true);
  assert.deepEqual(status(dir), {});
});

test('offline and 5xx keep the queue, log counts only and record the problem once', async t => {
  const dir = home(t);
  queue().enqueue([interval(), interval()]);
  await queue().flush('http://127.0.0.1:9/api/v1', 'fct_ok', Date.now());
  assert.equal(items(dir).length, 2);
  assert.equal(status(dir).problem, 'unreachable');
  const api = await server(t, () => [503, '{"message":"down"}']);
  await queue().flush(api.url, 'fct_ok', Date.now());
  assert.equal(items(dir).length, 2);
  assert.equal(status(dir).problem, 'unavailable');
  assert.match(log(dir), /unreachable: 2 intervals kept/);
  assert.match(log(dir), /HTTP 503: 2 intervals kept/);
});

test('a missing person record keeps the intervals; other validation errors drop them', async t => {
  const dir = home(t);
  queue().enqueue([interval()]);
  let api = await server(t, () => [400, '{"message":"User has no person record"}']);
  await queue().flush(api.url, 'fct_ok', Date.now());
  assert.equal(items(dir).length, 1);
  assert.equal(status(dir).problem, 'no-person');
  api = await server(t, () => [400, '{"message":"endedAt must be after startedAt"}']);
  await queue().flush(api.url, 'fct_ok', Date.now());
  assert.equal(items(dir).length, 0);
});

test('a 401 pauses capture until the token changes and clears everything local', async t => {
  const dir = home(t);
  const cfg = { factory: normalizeFactory({ projectId: PROJECT }) };
  process.env.FACTORY_TOKEN = 'fct_revoked_secret';
  t.after(() => { delete process.env.FACTORY_TOKEN; });
  fs.mkdirSync(path.join(dir, 'activity'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'activity', 'session-a.json'), '{}');
  queue().enqueue([interval(), interval()]);
  const api = await server(t, () => [401, '{"message":"No personal access token provided"}']);
  await queue().flush(api.url, 'fct_revoked_secret', Date.now());
  assert.deepEqual(items(dir), []);
  assert.equal(fs.existsSync(path.join(dir, 'activity', 'session-a.json')), false);
  assert.equal(status(dir).problem, 'rejected');
  assert.equal(factory().captureToken(cfg), null);
  const secretFree = log(dir) + fs.readFileSync(path.join(dir, 'factory-token.rejected'), 'utf8');
  assert.equal(secretFree.includes('fct_revoked_secret'), false);
  assert.equal(log(dir).includes(PROJECT), false);
  process.env.FACTORY_TOKEN = 'fct_new_token';
  assert.equal(factory().captureToken(cfg), 'fct_new_token');
});
