const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const store = require('../src/store');
const { createInvoice, invoiceTotal, listInvoices, deleteInvoice } = require('../src/invoices');
const { PermissionError } = require('../src/errors');

const admin = { id: 'u1', role: 'admin', accountId: 'a1' };
const viewer = { id: 'u2', role: 'viewer', accountId: 'a1' };
const other = { id: 'u3', role: 'admin', accountId: 'a2' };

beforeEach(() => store.seed());

test('an invoice totals its items with tax', () => {
  const invoice = createInvoice(admin, { customer: 'Acme', date: '2026-01-10', items: [{ price: 100, qty: 2 }] });
  assert.equal(invoiceTotal(invoice), 242);
});

test('a viewer cannot create invoices', () => {
  assert.throws(() => createInvoice(viewer, { customer: 'Acme', items: [{ price: 1, qty: 1 }] }), PermissionError);
});

test('users only list invoices of their own account', () => {
  createInvoice(admin, { customer: 'Acme', date: '2026-01-10', items: [{ price: 10, qty: 1 }] });
  assert.equal(listInvoices(other).length, 0);
  assert.equal(listInvoices(admin).length, 1);
});

test('an admin of another account cannot delete an invoice', () => {
  const invoice = createInvoice(admin, { customer: 'Acme', date: '2026-01-10', items: [{ price: 10, qty: 1 }] });
  assert.throws(() => deleteInvoice(other, invoice.id));
  assert.equal(listInvoices(admin).length, 1);
});
