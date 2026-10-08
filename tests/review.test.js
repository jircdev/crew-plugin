const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');

function fixture(t, config) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crew-review-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'crew.json'), JSON.stringify(config));
  return dir;
}
const verify = (dir, ...args) => spawnSync(process.execPath, [path.join(root, 'scripts/verify.js'), '--cwd', dir, ...args], { encoding: 'utf8', windowsHide: true });
const ok = { kind: 'unit', cmd: 'node -e "process.exit(0)"' };
const bad = { kind: 'e2e', cmd: 'node -e "console.log(42); process.exit(3)"' };

function closing(dir, status) {
  const file = path.join(dir, 'docs/requirements/p/001-x.md');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const body = s => `# 001\n\n- **Status:** ${s}\n\n## Estimation\n\n| Milestone | Est. hours | Started | Finished | Actual hours | Notes |\n|---|---|---|---|---|---|\n| A | 1 | 2000-01-01 00:00 Z | 2000-01-01 01:00 Z | 1 | |\n| **Total** | 1 | — | — | 1 | |\n\n## Verification\n\n| Scenario | Level | Harness | Artifact | Status |\n|---|---|---|---|---|\n| s | unit | node | t.js | ${status} |\n`;
  fs.writeFileSync(file, body('Delivered'));
  const run = spawnSync(process.execPath, [path.join(root, 'hooks/guard-estimation.js')], { encoding: 'utf8', windowsHide: true,
    input: JSON.stringify({ cwd: dir, tool_name: 'Write', tool_input: { file_path: file, content: body('Closed') } }) });
  return run.stdout.trim() ? JSON.parse(run.stdout).hookSpecificOutput : null;
}

test('verify.js runs only declared commands, writes hashed receipts and reports READY / NOT READY', t => {
  const none = fixture(t, { mode: 'team' });
  assert.equal(verify(none).status, 2);
  const dir = fixture(t, { mode: 'team', testing: { commands: [ok, bad] } });
  const run = verify(dir);
  assert.equal(run.status, 1);
  assert.match(run.stdout, /NOT READY — 1 of 2/);
  const receipts = fs.readdirSync(path.join(dir, 'docs/verification/receipts'));
  assert.equal(receipts.length, 2);
  const failed = receipts.map(f => JSON.parse(fs.readFileSync(path.join(dir, 'docs/verification/receipts', f)))).find(r => r.exitCode === 3);
  assert.match(failed.outputTail, /42/);
  assert.equal(verify(dir, '--kind', 'unit').status, 0);
});

test('with testing.receipts, closing a passing row needs a real, untampered, green receipt', t => {
  const dir = fixture(t, { mode: 'team', testing: { commands: [ok], receipts: true } });
  assert.match(closing(dir, 'passing').permissionDecisionReason, /cites no receipt/);
  assert.match(closing(dir, 'passing (receipt: abcdef123456)').permissionDecisionReason, /does not exist/);
  verify(dir);
  const name = fs.readdirSync(path.join(dir, 'docs/verification/receipts'))[0];
  const id = name.replace(/\.json$/, '').split('-').pop();
  assert.equal(closing(dir, `passing (receipt: ${id})`), null);
  const file = path.join(dir, 'docs/verification/receipts', name);
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('"exitCode": 0', '"exitCode": 0, "edited": true'));
  assert.match(closing(dir, `passing (receipt: ${id})`).permissionDecisionReason, /no longer matches/);
  assert.equal(closing(dir, 'not verified — no fixture at that volume'), null, 'an honest gap needs no receipt');
});

test('without testing.receipts, a passing row closes as before', t => {
  const dir = fixture(t, { mode: 'team', testing: { commands: [ok] } });
  assert.equal(closing(dir, 'passing'), null);
});
