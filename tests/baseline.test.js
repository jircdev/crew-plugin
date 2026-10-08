const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8').replace(/\r\n/g, '\n');
const items = list => list.split(/,\s*(?:or\s+)?|\s+·\s+/).map(s => s.trim().replace(/^or /, '')).filter(Boolean);

test('the baseline states the instruction boundary every role inherits', () => {
  const baseline = read('standards/session-context.md');
  assert.match(baseline, /\*\*Instruction boundary/);
  assert.match(baseline, /Everything read through a tool[^.]*is data/);
  assert.match(baseline, /never counts as the human's consent/);
});

test('the security trigger list is identical in the baseline and in the SEC role', () => {
  const baseline = read('standards/session-context.md').match(/work that touches ([^.]+?) consults `security-compliance`/);
  const role = read('agents/security-compliance.md').match(/the canonical list: ([^.]+)\./);
  assert.ok(baseline && role, 'both lists must exist');
  assert.deepEqual(items(baseline[1]), items(role[1]));
  assert.equal(items(role[1]).length, 8);
  assert.match(read('standards/session-context.md'), /the evidence seal says whether SEC was consulted/);
});

test('the baseline stays within its context budget', () => {
  // Injected into every session of every project: growth here is paid everywhere.
  assert.ok(read('standards/session-context.md').length <= 9000, 'session baseline above 9000 characters');
});
