const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildReport } = require('../src/report');
const { reference } = require('./reference-report');

const account = { id: 'a1', name: 'Firm' };
const inv = (id, date, customer, extra = {}) => ({
  id, accountId: 'a1', customer, date, items: [{ price: 12.5, qty: 3 }], taxRate: 0.21, ...extra,
});
const CASES = [
  [],
  [inv('INV-1', '2026-01-10', 'Acme')],
  [inv('INV-2', '2026-01-12', 'Beta'), inv('INV-1', '2026-01-10', 'Acme'), { ...inv('INV-9', '2026-01-01', 'Gamma'), accountId: 'a2' }],
  [inv('INV-3', '2026-01-05', 'Acme', { dueDate: '2026-01-20' }), inv('INV-4', '2026-01-06', 'Acme', { dueDate: '2026-01-20', paid: true }),
    inv('INV-5', '2026-01-07', 'Delta', { dueDate: '2026-03-01' })],
];

test('the report text is unchanged for every case', () => {
  for (const invoices of CASES) assert.equal(buildReport(account, invoices, '2026-02-01'), reference(account, invoices, '2026-02-01'));
});

// Function length measured from the line that opens a function to the line that
// closes it, across src/report.js and any new module it requires from src/.
function longest(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  let max = 0;
  lines.forEach((line, i) => {
    if (!/(function\b|=>\s*\{)/.test(line)) return;
    let depth = 0;
    for (let j = i; j < lines.length; j++) {
      depth += (lines[j].match(/\{/g) || []).length - (lines[j].match(/\}/g) || []).length;
      if (depth <= 0 && j > i) { max = Math.max(max, j - i + 1); return; }
      if (depth <= 0 && j === i) return;
    }
  });
  return max;
}

test('no function in the report modules is longer than 25 lines', () => {
  const src = path.join(__dirname, '..', 'src');
  const report = fs.readFileSync(path.join(src, 'report.js'), 'utf8');
  const local = [...report.matchAll(/require\('\.\/([^']+)'\)/g)].map((m) => m[1].replace(/\.js$/, '') + '.js')
    .filter((f) => !['invoices.js', 'money.js', 'store.js', 'permissions.js', 'errors.js'].includes(f));
  for (const file of ['report.js', ...local]) assert.ok(longest(path.join(src, file)) <= 25, `${file} has a function over 25 lines`);
});
