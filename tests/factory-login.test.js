const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const TOKEN = 'fct_' + 'a'.repeat(40);

// A fake factory: exchange checks the PKCE pair; self answers for TOKEN.
function factory(t) {
  const seen = { exchange: [], deleted: 0 };
  const challenges = new Map();
  const srv = http.createServer((req, res) => {
    let body = '';
    req.on('data', (d) => { body += d; });
    req.on('end', () => {
      const json = (status, data) => res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(data));
      if (req.url === '/api/v1/access-tokens/loopback/exchange') {
        const { code, verifier } = JSON.parse(body);
        seen.exchange.push({ code, auth: req.headers.authorization });
        const expected = challenges.get(code);
        challenges.delete(code);
        const ok = expected && createHash('sha256').update(verifier).digest('base64url') === expected;
        return ok ? json(200, { success: true, data: { token: TOKEN, expiresAt: '2027-01-05T00:00:00Z' } })
          : json(400, { status: false, error: { message: 'Invalid or expired authorization code' } });
      }
      const authed = req.headers.authorization === `Bearer ${TOKEN}`;
      if (req.url === '/api/v1/access-tokens/self' && req.method === 'GET') {
        return authed ? json(200, { success: true, data: { personName: 'Ana', expiresAt: '2027-01-05T00:00:00Z' } }) : json(401, {});
      }
      if (req.url === '/api/v1/access-tokens/self' && req.method === 'DELETE') { seen.deleted++; return res.writeHead(204).end(); }
      json(404, {});
    });
  });
  t.after(() => srv.close());
  return new Promise((resolve) => srv.listen(0, '127.0.0.1', () =>
    resolve({ api: `http://127.0.0.1:${srv.address().port}/api/v1`, seen, approve: (code, challenge) => challenges.set(code, challenge) })));
}

function run(t, action, api, onLine) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-login-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  return runIn(home, action, api, onLine);
}
function runIn(home, action, api, onLine = () => {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(root, 'scripts/factory-login.js'), action], {
      cwd: home, windowsHide: true,
      env: { ...process.env, CREW_HOME: home, FACTORY_TOKEN: '', CREW_FACTORY_ENV: '', CREW_FACTORY_URL: api,
        CREW_FACTORY_WEB_URL: 'https://web.example', CREW_LOGIN_NO_BROWSER: '1', CREW_LOGIN_TIMEOUT_MS: '3000' } });
    let stdout = '';
    child.stdout.on('data', (d) => { stdout += d; onLine(stdout); });
    child.on('close', (status) => resolve({ status, stdout, home }));
  });
}

// Plays the browser: reads the printed approval link and posts to the callback.
// Every answer the listener gave lands in `answers` (status and Location).
function browser(fake, { state, code = 'one-time-code', deny = false, host, replay = false, answers = [] } = {}) {
  let done = false;
  return (stdout) => {
    const link = stdout.match(/https:\/\/web\.example\/my-hours\/connect\?\S+/);
    if (!link || done) return;
    done = true;
    const params = new URL(link[0]).searchParams;
    fake.approve(code, params.get('challenge'));
    const form = new URLSearchParams(deny ? { state: params.get('state'), error: 'denied' }
      : { state: state || params.get('state'), code }).toString();
    const post = () => {
      const req = http.request({ host: '127.0.0.1', port: params.get('port'), path: '/callback', method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Host: host || `127.0.0.1:${params.get('port')}` } },
      (res) => { answers.push({ status: res.statusCode, location: res.headers.location, cache: res.headers['cache-control'] }); res.resume(); });
      req.on('error', () => {});
      req.end(form);
    };
    post();
    if (replay) post();
  };
}

test('login trades the one-time code for the token, stores it owner-only and never prints it', async t => {
  const fake = await factory(t);
  const out = await run(t, 'login', fake.api, browser(fake));
  assert.equal(out.status, 0, out.stdout);
  assert.match(out.stdout, /Connected to factory custom/);
  assert.equal(out.stdout.includes(TOKEN), false);
  assert.equal(fs.readFileSync(path.join(out.home, 'factory-token'), 'utf8').trim(), TOKEN);
  assert.equal(fake.seen.exchange[0].auth, undefined);
  if (process.platform !== 'win32') assert.equal(fs.statSync(path.join(out.home, 'factory-token')).mode & 0o777, 0o600);
  const link = new URL(out.stdout.match(/https:\/\/\S+/)[0]);
  assert.ok(Number(link.searchParams.get('port')) >= 1024);
  assert.equal(link.searchParams.get('challenge').length, 43);
  // The next step registers the MCP of the same factory, reading the stored file.
  assert.ok(out.stdout.includes(`factory '${fake.api}/mcp'`), out.stdout);
  assert.ok(out.stdout.includes(path.join(out.home, 'factory-token')), out.stdout);
});

test('the MCP step reads the token file in the platform shell and never uses ${FACTORY_TOKEN}', () => {
  const { mcpStep } = require('../scripts/lib/factory-mcp-step');
  const api = 'https://api.example/api/v1';
  const windows = mcpStep(api, 'C:\\Users\\ana\\.crew\\factory-token', 'win32');
  assert.match(windows, /PowerShell/);
  assert.match(windows, /Get-Content -Raw 'C:\\Users\\ana\\.crew\\factory-token'/);
  assert.match(windows, /--scope user --transport http factory 'https:\/\/api\.example\/api\/v1\/mcp'/);
  const unix = mcpStep(api, '/home/ana/.crew/factory-token', 'linux');
  assert.match(unix, /^\[ -s '\/home\/ana\/\.crew\/factory-token' \] && /m);
  assert.match(unix, /\$\(tr -d '\\r\\n ' < '\/home\/ana\/\.crew\/factory-token'\)/);
  for (const text of [windows, unix]) assert.equal(text.includes('FACTORY_TOKEN'), false);
});

test('the MCP step escapes a quote in the path and prints no command for an unsafe address', () => {
  const { mcpStep } = require('../scripts/lib/factory-mcp-step');
  const api = 'https://api.example/api/v1';
  assert.match(mcpStep(api, "C:\\Users\\O'Brien\\.crew\\factory-token", 'win32'), /'C:\\Users\\O''Brien\\.crew\\factory-token'/);
  assert.match(mcpStep(api, "/home/o'brien/.crew/factory-token", 'linux'), /'\/home\/o'\\''brien\/\.crew\/factory-token'/);
  const hostile = ['https://x/a;calc', 'https://x/$(id)', 'https://x/a`id`', 'https://user:pw@x/api', 'http://x.example/api',
    'https://x/a --header X:1', 'not a url'];
  for (const bad of hostile) {
    for (const platform of ['win32', 'linux']) {
      const text = mcpStep(bad, '/home/ana/.crew/factory-token', platform);
      assert.equal(text.includes('claude mcp add'), false, `${bad} on ${platform}: ${text}`);
      assert.match(text, /docs\/en\/factory\.md/);
    }
  }
});

test('a forged state, a foreign Host header or a denial never stores a token', async t => {
  const fake = await factory(t);
  const forged = await run(t, 'login', fake.api, browser(fake, { state: 'forged' }));
  assert.match(forged.stdout, /timed out/);
  const hostile = await run(t, 'login', fake.api, browser(fake, { host: 'evil.example' }));
  assert.match(hostile.stdout, /timed out/);
  const denied = await run(t, 'login', fake.api, browser(fake, { deny: true }));
  assert.match(denied.stdout, /declined.*aviso formal/);
  for (const out of [forged, hostile, denied]) {
    assert.equal(out.status, 1);
    assert.equal(fs.existsSync(path.join(out.home, 'factory-token')), false);
  }
  assert.equal(fake.seen.exchange.length, 0);
});

test('a code factory refuses ends the login with the reason factory gave and no token', async t => {
  const fake = await factory(t);
  fake.approve = () => {};
  const out = await run(t, 'login', fake.api, browser(fake));
  assert.equal(out.status, 1);
  assert.match(out.stdout, /Invalid or expired authorization code/);
  assert.equal(fs.existsSync(path.join(out.home, 'factory-token')), false);
});

test('status reports the person and expiry; logout revokes and deletes even when factory is down', async t => {
  const fake = await factory(t);
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-login-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  assert.match((await runIn(home, 'status', fake.api)).stdout, /Not connected/);
  fs.writeFileSync(path.join(home, 'factory-token'), TOKEN);
  assert.match((await runIn(home, 'status', fake.api)).stdout, /as Ana, token expires on 2027-01-05/);
  const loggedOut = (await runIn(home, 'logout', fake.api)).stdout;
  assert.match(loggedOut, /revoked in factory/);
  assert.match(loggedOut, /claude mcp remove factory --scope user/);
  assert.equal(fake.seen.deleted, 1);
  assert.equal(fs.existsSync(path.join(home, 'factory-token')), false);
  fs.writeFileSync(path.join(home, 'factory-token'), TOKEN);
  const offline = await runIn(home, 'logout', 'http://127.0.0.1:9/api/v1');
  assert.match(offline.stdout, /could not confirm the revocation/);
  assert.equal(fs.existsSync(path.join(home, 'factory-token')), false);
});

test('the browser ends on the factory result screen, named only by the outcome', async t => {
  const fake = await factory(t);
  const connected = [];
  const ok = await run(t, 'login', fake.api, browser(fake, { answers: connected }));
  assert.equal(ok.status, 0, ok.stdout);
  assert.deepEqual(connected, [{ status: 303, location: 'https://web.example/my-hours/connect/done?result=connected', cache: 'no-store' }]);
  const declined = [];
  await run(t, 'login', fake.api, browser(fake, { deny: true, answers: declined }));
  assert.equal(declined[0].location, 'https://web.example/my-hours/connect/done?result=denied');
  const refused = [];
  const failing = await factory(t);
  failing.approve = () => {};
  await run(t, 'login', failing.api, browser(failing, { answers: refused }));
  assert.equal(refused[0].location, 'https://web.example/my-hours/connect/done?result=failed');
});

test('a replayed callback is refused and starts no second exchange', async t => {
  const fake = await factory(t);
  const answers = [];
  const out = await run(t, 'login', fake.api, browser(fake, { replay: true, answers }));
  assert.equal(out.status, 0, out.stdout);
  assert.equal(fake.seen.exchange.length, 1);
  assert.ok(answers.length <= 2 && answers.filter((a) => a.status === 303).length === 1);
});
