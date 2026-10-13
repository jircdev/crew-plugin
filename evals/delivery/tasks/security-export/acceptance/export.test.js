const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const store = require('../src/store');
const { exportInvoices } = require('../src/export');

const accountant = { id: 'u1', role: 'accountant', accountId: 'a1' };
const viewer = { id: 'u2', role: 'viewer', accountId: 'a1' };
const item = [{ price: 10, qty: 1 }];
const RANGE = { from: '2026-01-01', to: '2026-01-31' };

beforeEach(() => store.seed({ invoices: [
  { id: 'INV-1', accountId: 'a1', customer: 'Acme', date: '2026-01-10', items: item, taxRate: 0.21 },
  { id: 'INV-2', accountId: 'a2', customer: 'Rival', date: '2026-01-11', items: item, taxRate: 0.21 },
  { id: 'INV-3', accountId: 'a1', customer: '=HYPERLINK("http://x.test","click")', date: '2026-01-12', items: item, taxRate: 0.21 },
  { id: 'INV-4', accountId: 'a1', customer: 'Smith, Jones & "Co"', date: '2026-01-13', items: item, taxRate: 0.21 },
  { id: 'INV-5', accountId: 'a1', customer: 'Late', date: '2026-02-01', items: item, taxRate: 0.21 },
] }));

const rows = (csv) => csv.trim().split(/\r?\n/);

test('the export has a header and the account invoices in range', () => {
  const lines = rows(exportInvoices(accountant, RANGE));
  assert.match(lines[0], /^id,date,customer,total$/);
  assert.match(lines[1], /^INV-1,2026-01-10,Acme,12\.10$/);
  assert.ok(!lines.some((l) => l.includes('INV-5')), 'out-of-range invoice exported');
});

test('invoices of another account never appear', () => {
  const csv = exportInvoices(accountant, RANGE);
  assert.ok(!csv.includes('INV-2') && !csv.includes('Rival'));
});

test('a user without the export permission is refused', () => {
  assert.throws(() => exportInvoices(viewer, RANGE));
});

test('cells that a spreadsheet would run as a formula are neutralized', () => {
  const line = rows(exportInvoices(accountant, RANGE)).find((l) => l.startsWith('INV-3'));
  const customer = line.split(',').slice(2, -1).join(',');
  assert.ok(!/^"?[=+\-@]/.test(customer), `formula left executable: ${customer}`);
});

test('commas and quotes in a value are escaped', () => {
  const line = rows(exportInvoices(accountant, RANGE)).find((l) => l.startsWith('INV-4'));
  assert.ok(line.includes('"Smith, Jones & ""Co"""'), line);
});
