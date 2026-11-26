// Fixtures for the requirement step tests: a repository linked to factory with
// one requirement file staged, a fake factory, and the step run as a child.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { spawn, spawnSync } = require('node:child_process');

const PLUGIN = path.resolve(__dirname, '..');
const SCRIPT = path.join(PLUGIN, 'scripts', 'sync-requirements.js');
const PROJECT = '11111111-2222-4333-8444-555555555555';
const ACTIVITY = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const TOKEN = 'fct_test_token_never_printed';
const REL = 'docs/requirements/billing/001-invoices.md';

const requirement = (status = 'Draft', extra = '') => `# 001 — Invoices

- **Status:** ${status}
- **Plan:** billing ([README](README.md))
- **Date:** 2026-11-26
${extra}
## Context

The client downloads each invoice.

## Estimation

| Milestone | Est. hours | Est. AI hours | Started | Finished | Actual hours | Actual AI hours | Notes |
|-----------|-----------|---------------|---------|----------|--------------|-----------------|-------|
| M1 Data model | 4 | 0.5 | 2026-11-26 09:00 -03:00 | 2026-11-26 11:00 -03:00 | 2 | — | |
| M2 Screens | 6 | 1 | 2026-11-26 11:00 -03:00 | | | | |
| Human review | 1 | 0 | | | | | |
| **Total** | 11 | 1.5 | — | — | | | |
`;

const git = (dir, args) => spawnSync('git', args, { cwd: dir, encoding: 'utf8', windowsHide: true });

function repo(t, { api, text = requirement(), factory = true, subcenter = 'MVP' } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-req-'));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-req-home-'));
  t.after(() => { fs.rmSync(dir, { recursive: true, force: true }); fs.rmSync(home, { recursive: true, force: true }); });
  git(dir, ['init', '-q']);
  git(dir, ['config', 'user.email', 'dev@example.invalid']);
  git(dir, ['config', 'user.name', 'Dev']);
  git(dir, ['config', 'core.autocrlf', 'false']);
  git(dir, ['remote', 'add', 'origin', 'https://user:secret@github.com/Acme/Plans.git']);
  const block = factory ? { factory: { projectId: PROJECT, url: api || 'http://127.0.0.1:9', subcenter } } : {};
  fs.writeFileSync(path.join(dir, 'crew.json'), JSON.stringify({ mode: 'team', ...block }));
  fs.mkdirSync(path.join(dir, path.dirname(REL)), { recursive: true });
  fs.writeFileSync(path.join(dir, REL), text);
  git(dir, ['add', '.']);
  return { dir, home };
}

// The person's machine: its own ~/.crew, a token unless `FACTORY_TOKEN: null`.
function envOf(home, extra = {}) {
  const env = { ...process.env, CREW_HOME: home, FACTORY_TOKEN: TOKEN, ...extra };
  for (const name of ['CREW_FACTORY_URL', 'CREW_FACTORY_ENV', 'CREW_REQUIREMENT_SYNC', 'GIT_INDEX_FILE']) if (!(name in extra)) delete env[name];
  if (extra.FACTORY_TOKEN === null) delete env.FACTORY_TOKEN;
  return env;
}

// Async on purpose: the fake factory lives in this process and must answer.
function child(command, args, r, extra, input = '') {
  return new Promise((resolve) => {
    const proc = spawn(command, args, { cwd: r.dir, env: envOf(r.home, extra), windowsHide: true });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => { stdout += d; });
    proc.stderr.on('data', (d) => { stderr += d; });
    proc.on('close', (status) => resolve({ status, stdout, stderr }));
    proc.stdin.end(input);
  });
}
const run = (r, args = [], extra = {}, input = '') => child(process.execPath, [SCRIPT, ...args], r, extra, input);
const commit = (r, args) => child('git', ['commit', ...args], r, {});

const LOADED = () => [200, { status: true, data: { activityId: ACTIVITY, code: 'R:billing/001', status: 'backlog' } }];

// handler(body) → [status, json]
function factory(t, handler = LOADED) {
  const calls = [];
  const srv = http.createServer((req, res) => {
    let body = '';
    req.on('data', (d) => { body += d; });
    req.on('end', () => {
      calls.push({ url: req.url, auth: req.headers.authorization, body: JSON.parse(body) });
      const [status, json] = handler(JSON.parse(body));
      res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(json));
    });
  });
  t.after(() => srv.close());
  return new Promise((resolve) => srv.listen(0, '127.0.0.1', () => resolve({ api: `http://127.0.0.1:${srv.address().port}/api/v1`, calls })));
}

const staged = (dir) => git(dir, ['show', `:${REL}`]).stdout;
const working = (dir) => fs.readFileSync(path.join(dir, REL), 'utf8');
function queued(home) {
  const file = path.join(home, 'requirements', 'queue.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
}

module.exports = { PLUGIN, PROJECT, ACTIVITY, TOKEN, REL, requirement, git, repo, run, commit, factory, staged, working, queued };
