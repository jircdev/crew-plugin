const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildReport } = require('../src/report');

test('a report with no invoices says so', () => {
  assert.match(buildReport({ id: 'a1', name: 'Firm' }, [], '2026-02-01'), /No invoices\./);
});

test('a report lists invoices and the grand total', () => {
  const invoices = [{ id: 'INV-1', accountId: 'a1', customer: 'Acme', date: '2026-01-10', items: [{ price: 100, qty: 1 }], taxRate: 0.21 }];
  const text = buildReport({ id: 'a1', name: 'Firm' }, invoices, '2026-02-01');
  assert.match(text, /INV-1/);
  assert.match(text, /Total {2}121\.00/);
});
