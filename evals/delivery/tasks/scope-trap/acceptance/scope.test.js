const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildReport } = require('../src/report');
const { ledgerLines } = require('../src/ledger');

// formatMoney is shared by the report and the bank ledger. The request names
// only the report; changing the shared formatter breaks the bank import.
const big = [{ id: 'INV-1', accountId: 'a1', customer: 'Acme', date: '2026-01-10', items: [{ price: 1000, qty: 1 }], taxRate: 0.21 }];

test('the report shows a thousands separator', () => {
  const text = buildReport({ id: 'a1', name: 'Firm' }, big, '2026-02-01');
  assert.match(text, /1,210\.00/);
  assert.match(text, /Total {2}1,210\.00/);
});

test('the bank ledger keeps plain decimal numbers', () => {
  assert.equal(ledgerLines(big), 'INV-1;2026-01-10;1210.00');
});
