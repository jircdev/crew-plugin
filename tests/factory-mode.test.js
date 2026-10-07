const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { spawn, spawnSync } = require('node:child_process');
const { loadConfig } = require('../hooks/lib/config');
const { render, deviation, parseRpc } = require('../scripts/metrics-factory');
const root = path.resolve(__dirname, '..');
const PROJECT = '11111111-2222-4333-8444-555555555555';
const TASK = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const FACTORY = { projectId: PROJECT };
const TABLE = '## Estimation\n| Milestone | Est. hours | Started | Finished | Actual hours | Notes |\n|---|---|---|---|---|---|\n';

function fixture(t, config) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-factory-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'crew.json'), JSON.stringify(config));
  return dir;
}
function hook(file, input) {
  const run = spawnSync(process.execPath, [path.join(root, 'hooks', file + '.js')], {
    input: JSON.stringify(input), encoding: 'utf8', cwd: input.cwd, windowsHide: true,
    env: { ...process.env, PLUGIN_ROOT: '', CLAUDE_PLUGIN_ROOT: '' },
  });
  assert.equal(run.status, 0, run.stderr);
  return run.stdout.trim() ? JSON.parse(run.stdout) : null;
}
function write(dir, content, guard = 'guard-estimation') {
  const file_path = path.join(dir, 'docs/stories/f/001-x.md');
  return hook(guard, { cwd: dir, tool_name: 'Write', tool_input: { file_path, content } });
}
function patch(dir, content) {
  const body = '*** Add File: docs/stories/f/001-x.md\n' + content.trimEnd().split('\n').map((l) => '+' + l).join('\n');
  return hook('codex-pre-tool', { cwd: dir, tool_name: 'apply_patch', tool_input: { command: `*** Begin Patch\n${body}\n*** End Patch` } });
}
const reason = (out) => out?.hookSpecificOutput?.permissionDecisionReason || '';

test('crew.json factory block normalizes url, environment, capture and a missing projectId', t => {
  const full = loadConfig(fixture(t, { factory: { projectId: PROJECT, url: 'https://x/api/v1/', capture: false } }));
  assert.deepEqual(full.factory, { projectId: PROJECT, environment: null, url: 'https://x/api/v1', web: null,
    capture: false, unknown: [] });
  const bare = loadConfig(fixture(t, { factory: FACTORY }));
  assert.equal(bare.factory.url, null);
  assert.equal(bare.factory.capture, true);
  assert.deepEqual(loadConfig(fixture(t, { factory: { ...FACTORY, environment: 'qa' } })).factory.unknown, ['environment=qa']);
  assert.deepEqual(loadConfig(fixture(t, { factory: {} })).factory.unknown, ['projectId=missing']);
  assert.equal(loadConfig(fixture(t, { mode: 'team' })).factory, null);
});

test('factory mode closes on the Factory activity header instead of the estimation table, on both transports', t => {
  for (const mode of ['team', 'solo']) {
    const dir = fixture(t, { mode, factory: FACTORY });
    const missing = write(dir, '# 001\n- **Status:** Closed\n');
    assert.match(reason(missing), /no \*\*Factory activity:\*\* header/);
    assert.deepEqual(patch(dir, '# 001\n- **Status:** Closed\n'), missing);
    const linked = `# 001\n- **Status:** Closed\n- **Factory task:** ${TASK}\n`;
    assert.equal(write(dir, linked), null);
    assert.equal(patch(dir, linked), null);
    assert.equal(write(dir, linked.replace('Factory task', 'Factory activity')), null);
  }
});

test('declared testing still gates closure in factory mode', t => {
  const dir = fixture(t, { factory: FACTORY, testing: { guide: 'docs/testing.md' } });
  const out = write(dir, `# 001\n- **Status:** Closed\n- **Factory task:** ${TASK}\n`);
  assert.match(reason(out), /no Verification section/);
});

test('without a usable factory block the guards behave exactly as before', t => {
  const dir = fixture(t, { mode: 'team', metrics: true, factory: {} });
  assert.match(reason(write(dir, `- **Status:** Closed\n- **Factory task:** ${TASK}\n`)), /no Estimation section/);
  const stale = `- **Status:** Open\n${TABLE}| A | 1 | 2000-01-01 00:00 Z | | | |\n`;
  assert.match(reason(write(dir, stale, 'guard-timestamps')), /not the real/);
  const factory = fixture(t, { mode: 'team', metrics: true, factory: FACTORY });
  assert.equal(write(factory, stale, 'guard-timestamps'), null);
});

test('session start names an incomplete factory block', t => {
  const dir = fixture(t, { configuredWith: '0.25.0', factory: {} });
  const run = spawnSync(process.execPath, [path.join(root, 'hooks/session-start.js')], {
    input: JSON.stringify({ cwd: dir }), encoding: 'utf8', windowsHide: true,
    env: { ...process.env, PLUGIN_ROOT: '', CLAUDE_PLUGIN_ROOT: root },
  });
  assert.ok(run.stdout.includes('`factory.projectId=missing`'));
});

const BACKLOG = {
  projectId: PROJECT, projectName: 'Portal',
  summary: { approvedHours: 100, consumedHours: 30, pendingHours: 80, forecastHours: 110 },
  tasks: [
    { id: 'r1', kind: 'requirement', code: 'R-1', parentId: null, title: 'Accounts', status: 'in_progress',
      originalEstimatedHours: 30, estimatedHours: 37, consumedHours: 0 },
    { id: 't1', kind: 'story', number: 1, parentId: 'r1', title: 'Login', status: 'done', originalEstimatedHours: 10, estimatedHours: 12, consumedHours: 15 },
    { id: 't2', kind: 'task', number: 2, parentId: 'r1', title: 'Reports', status: 'in_progress', originalEstimatedHours: 20, estimatedHours: 25, consumedHours: 15 },
    { id: 'a1', kind: 'appointment', parentId: null, title: 'Kickoff', status: 'done', consumedHours: 1 },
  ],
};

test('metrics renders the activity tree with leaf deviation and the quoted summary', () => {
  assert.equal(deviation(BACKLOG.tasks[1]), 50);
  assert.equal(deviation(BACKLOG.tasks[2]), 25);
  const text = render(BACKLOG);
  assert.ok(text.includes('| R-1 | Accounts | requirement | in_progress | 30.0 | 37.0 | 0.0 | — |'));
  assert.ok(text.includes('| #1 | ↳ Login | story | done | 10.0 | 12.0 | 15.0 | +50% |'));
  assert.equal(text.includes('Kickoff'), false);
  assert.ok(text.includes('Quoted 100.0h · consumed 30.0h · pending 80.0h · forecast 110.0h (+10% vs quoted)'));
  const sse = { type: 'text/event-stream', body: 'event: message\ndata: {"jsonrpc":"2.0","id":7,"result":{}}\n\n' };
  assert.deepEqual(parseRpc(sse, 7), { jsonrpc: '2.0', id: 7, result: {} });
});

function mcp(t, status) {
  const calls = [];
  const srv = http.createServer((req, res) => {
    let body = '';
    req.on('data', (d) => { body += d; });
    req.on('end', () => {
      const msg = JSON.parse(body);
      calls.push({ method: msg.method, accept: req.headers.accept, auth: req.headers.authorization });
      if (status !== 200) return res.writeHead(status).end('{}');
      const result = { content: [{ type: 'text', text: JSON.stringify(BACKLOG) }] };
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result }));
    });
  });
  t.after(() => srv.close());
  return new Promise((resolve) => srv.listen(0, '127.0.0.1', () => resolve({ port: srv.address().port, calls })));
}
function metrics(dir, extra) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(root, 'scripts/metrics.js')], {
      cwd: dir, windowsHide: true,
      env: { ...process.env, CREW_HOME: dir, CREW_FACTORY_ENV: '', CREW_FACTORY_URL: '', ...extra } });
    let stdout = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.on('close', (status) => resolve({ status, stdout }));
  });
}

test('metrics in factory mode calls project_backlog over MCP with one stateless call', async t => {
  const api = await mcp(t, 200);
  const dir = fixture(t, { factory: { ...FACTORY, url: `http://127.0.0.1:${api.port}/api/v1` } });
  const out = await metrics(dir, { FACTORY_TOKEN: 'fct_test' });
  assert.equal(out.status, 0);
  assert.ok(out.stdout.includes('Project: Portal (factory)'));
  assert.deepEqual(api.calls.map((c) => c.method), ['tools/call']);
  assert.ok(api.calls.every((c) => c.auth === 'Bearer fct_test' && c.accept.includes('text/event-stream')));
});

test('metrics falls back to the local report with one notice when factory cannot answer', async t => {
  for (const [status, notice] of [[401, /revoked or expired/], [403, /tasks\.list/]]) {
    const api = await mcp(t, status);
    const dir = fixture(t, { factory: { ...FACTORY, url: `http://127.0.0.1:${api.port}/api/v1` } });
    const out = await metrics(dir, { FACTORY_TOKEN: 'fct_test' });
    assert.equal(out.status, 0);
    assert.match(out.stdout, notice);
    assert.match(out.stdout, /No closed items with estimation data/);
  }
  const offline = fixture(t, { factory: { ...FACTORY, url: 'http://127.0.0.1:9/api/v1' } });
  assert.match((await metrics(offline, { FACTORY_TOKEN: 'fct_test' })).stdout, /factory unreachable/);
  const noToken = fixture(t, { factory: FACTORY });
  assert.match((await metrics(noToken, { FACTORY_TOKEN: '' })).stdout, /not connected to factory/);
});
