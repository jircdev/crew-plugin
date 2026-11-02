// A fake factory and a fake browser for the /crew:factory scripts. The fake
// answers the loopback exchange (checking the PKCE pair), /access-tokens/self,
// the MCP endpoint (whoami) and the interval ingest, for TOKEN or for any
// token listed in `tokens`.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..', '..');
const TOKEN = 'fct_' + 'a'.repeat(40);
const PERSON = { personId: '99999999-8888-4777-8666-555555555555', name: 'Ana' };
const PROJECTS = [
  { id: '11111111-2222-4333-8444-555555555555', name: 'Portal', slug: 'portal', color: '#000', packages: [{ id: 'p', name: 'Budget' }] },
  { id: '22222222-3333-4444-8555-666666666666', name: 'Factory', slug: 'factory', color: '#fff', packages: [] },
];

// options: { token, person, projects, ingest: status, noMcp: answer 403 on the MCP }
function factory(t, options = {}) {
  const seen = { exchange: [], deleted: 0, mcp: [], intervals: [] };
  const live = options.token || TOKEN;
  const person = options.person || PERSON;
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
        return ok ? json(200, { success: true, data: { token: live, expiresAt: '2027-01-05T00:00:00Z' } })
          : json(400, { status: false, error: { message: 'Invalid or expired authorization code' } });
      }
      const authed = req.headers.authorization === `Bearer ${live}`;
      if (!authed && req.url !== '/api/v1/access-tokens/self') return json(401, {});
      if (req.url === '/api/v1/access-tokens/self' && req.method === 'GET') {
        return authed ? json(200, { success: true, data: { personName: person.name, expiresAt: '2027-01-05T00:00:00Z' } }) : json(401, {});
      }
      if (req.url === '/api/v1/access-tokens/self' && req.method === 'DELETE') { seen.deleted++; return res.writeHead(204).end(); }
      if (req.url === '/api/v1/mcp' && options.noMcp) return json(403, {});
      if (req.url === '/api/v1/mcp') {
        const call = JSON.parse(body);
        seen.mcp.push({ name: call.params.name, accept: req.headers.accept });
        const result = { person: { ...person, photoUrl: null }, timezone: 'UTC', defaultProjectId: null,
          projects: options.projects || PROJECTS };
        return json(200, { jsonrpc: '2.0', id: call.id, result: { content: [{ type: 'text', text: JSON.stringify(result) }] } });
      }
      if (req.url === '/api/v1/activity/intervals') {
        seen.intervals.push(...JSON.parse(body).intervals);
        return json(options.ingest || 202, { success: true });
      }
      json(404, {});
    });
  });
  t.after(() => srv.close());
  return new Promise((resolve) => srv.listen(0, '127.0.0.1', () =>
    resolve({ api: `http://127.0.0.1:${srv.address().port}/api/v1`, seen, approve: (code, challenge) => challenges.set(code, challenge) })));
}

function tempHome(t) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-login-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  return home;
}

// Runs scripts/<script>.js with an isolated CREW_HOME. cwd defaults to home.
function runScript(script, args, { home, api, cwd, env = {}, onLine = () => {} }) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(root, 'scripts', `${script}.js`), ...args], {
      cwd: cwd || home, windowsHide: true,
      env: { ...process.env, CREW_HOME: home, FACTORY_TOKEN: '', CREW_FACTORY_ENV: '', CREW_FACTORY_URL: api,
        CREW_FACTORY_WEB_URL: 'https://web.example', CREW_LOGIN_NO_BROWSER: '1', CREW_LOGIN_TIMEOUT_MS: '3000', ...env } });
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

module.exports = { factory, tempHome, runScript, browser, TOKEN, PERSON, PROJECTS, root };
