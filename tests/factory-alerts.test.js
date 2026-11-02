const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn, spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { tempHome } = require('./fixtures/factory-fake');
const root = path.resolve(__dirname, '..');
const PROJECT = '11111111-2222-4333-8444-555555555555';
const TOKEN = 'fct_' + 'c'.repeat(40);
const DAY = 86400000;

function repo(t, crew) {
  const dir = tempHome(t);
  fs.writeFileSync(path.join(dir, 'crew.json'), JSON.stringify(crew));
  return dir;
}
function connected(t, fields) {
  const home = tempHome(t);
  fs.writeFileSync(path.join(home, 'factory-token'), TOKEN);
  if (fields) {
    const fingerprint = createHash('sha256').update(TOKEN).digest('hex');
    fs.writeFileSync(path.join(home, 'factory-token.json'), JSON.stringify({ fingerprint, ...fields }));
  }
  return home;
}
const env = (home, extra = {}) => ({ ...process.env, CREW_HOME: home, FACTORY_TOKEN: '', CREW_CAPTURE: '',
  CREW_FACTORY_ENV: '', CREW_FACTORY_URL: '', PLUGIN_ROOT: '', CLAUDE_PLUGIN_ROOT: root, ...extra });
// Runs the capture hook and returns the systemMessage it printed, or null.
function capture(event, home, extra) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(root, 'hooks/capture-activity.js')], { env: env(home, extra), windowsHide: true });
    let stdout = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.on('close', (status) => {
      assert.equal(status, 0);
      resolve(stdout ? JSON.parse(stdout).systemMessage : null);
    });
    child.stdin.end(JSON.stringify(event));
  });
}
const start = (cwd) => ({ session_id: 's1', hook_event_name: 'SessionStart', cwd });
const fresh = () => ({ expiresAt: new Date(Date.now() + 60 * DAY).toISOString() });

test('a revoked or expired token is shown to the person at session start, with what to do', async t => {
  const dir = repo(t, { factory: { projectId: PROJECT, url: 'http://127.0.0.1:9' } });
  const revoked = connected(t, fresh());
  fs.writeFileSync(path.join(revoked, 'factory-token.rejected'), createHash('sha256').update(TOKEN).digest('hex'));
  assert.match(await capture(start(dir), revoked), /^crew · factory: factory rejected .* Run `\/crew:factory login`/);
  assert.equal(fs.existsSync(path.join(revoked, 'activity')), false);
  const expired = connected(t, { expiresAt: new Date(Date.now() - DAY).toISOString() });
  assert.match(await capture(start(dir), expired), /token expired\. Your time is still recorded on this machine/);
});

test('a token that expires within seven days warns; a fresh one stays quiet', async t => {
  const dir = repo(t, { factory: { projectId: PROJECT, url: 'http://127.0.0.1:9' } });
  const soon = new Date(Date.now() + 3 * DAY).toISOString();
  assert.match(await capture(start(dir), connected(t, { expiresAt: soon })), new RegExp(`expires on ${soon.slice(0, 10)}`));
  assert.equal(await capture(start(dir), connected(t, fresh())), null);
});

test('a crew repository not linked to factory warns when the person is connected, unless it opted out', async t => {
  const loose = repo(t, { mode: 'team' });
  assert.match(await capture(start(loose), connected(t, fresh())), /not linked to a factory project.*\/crew:factory link/);
  assert.equal(await capture(start(repo(t, { factory: { capture: false } })), connected(t, fresh())), null);
  assert.equal(await capture(start(loose), tempHome(t)), null);
  assert.equal(await capture(start(loose), connected(t, fresh()), { CREW_CAPTURE: 'off' }), null);
  assert.equal(await capture({ ...start(loose), hook_event_name: 'Stop' }, connected(t, fresh())), null);
});

function refusing(t) {
  const srv = http.createServer((req, res) => res.writeHead(401).end('{}'));
  t.after(() => srv.close());
  return new Promise((resolve) => srv.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${srv.address().port}/api/v1`)));
}

test('a 401 met while sending at the end of a reply is shown once, when it happens', async t => {
  const api = await refusing(t);
  const dir = repo(t, { factory: { projectId: PROJECT, url: api } });
  const home = connected(t, fresh());
  fs.mkdirSync(path.join(home, 'activity'));
  fs.writeFileSync(path.join(home, 'activity', 's1.json'), JSON.stringify({ lastEventAt: Date.now() - 120000, promptAt: Date.now() - 60000 }));
  const stop = { session_id: 's1', hook_event_name: 'Stop', cwd: dir };
  assert.match(await capture(stop, home), /factory rejected this machine's token/);
  assert.equal(await capture(stop, home), null);
});

test('session start gives the agent the same sentence the person sees', t => {
  const dir = repo(t, { configuredWith: '1.2.1', mode: 'team' });
  const run = spawnSync(process.execPath, [path.join(root, 'hooks/session-start.js')], {
    input: JSON.stringify({ cwd: dir }), encoding: 'utf8', windowsHide: true, env: env(connected(t, fresh())) });
  assert.match(run.stdout, /- Factory: this repository is not linked to a factory project/);
});
