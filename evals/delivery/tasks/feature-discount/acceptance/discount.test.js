const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const store = require('../src/store');
const { createInvoice, invoiceTotal } = require('../src/invoices');

const admin = { id: 'u1', role: 'admin', accountId: 'a1' };
const base = { customer: 'Acme', date: '2026-03-01', items: [{ price: 100, qty: 1 }] };

beforeEach(() => store.seed());

test('a discount applies to the subtotal before tax', () => {
  assert.equal(invoiceTotal(createInvoice(admin, { ...base, discount: 10 })), 108.9);
});

test('a full discount leaves nothing to pay', () => {
  assert.equal(invoiceTotal(createInvoice(admin, { ...base, discount: 100 })), 0);
});

test('an invoice without discount is unchanged', () => {
  assert.equal(invoiceTotal(createInvoice(admin, base)), 121);
});

test('a discount outside 0 to 100 is rejected', () => {
  assert.throws(() => createInvoice(admin, { ...base, discount: -1 }));
  assert.throws(() => createInvoice(admin, { ...base, discount: 101 }));
});
