const { test } = require('node:test');
const assert = require('node:assert/strict');
const { invoiceTotal } = require('../src/invoices');

const invoice = (items, taxRate = 0.21) => ({ id: 'X', accountId: 'a1', customer: 'Acme', items, taxRate });

test('the reported invoice totals 1.27', () => {
  assert.equal(invoiceTotal(invoice([{ price: 0.35, qty: 1 }, { price: 0.35, qty: 1 }, { price: 0.35, qty: 1 }])), 1.27);
});

test('tax is rounded once on the subtotal', () => {
  assert.equal(invoiceTotal(invoice([{ price: 0.1, qty: 3 }])), 0.36);
  assert.equal(invoiceTotal(invoice([{ price: 19.99, qty: 3 }, { price: 0.05, qty: 7 }])), 72.99);
});

test('round half up at the cent', () => {
  assert.equal(invoiceTotal(invoice([{ price: 0.5, qty: 1 }], 0.01)), 0.51);
});

test('totals without tax are exact', () => {
  assert.equal(invoiceTotal(invoice([{ price: 0.1, qty: 1 }, { price: 0.2, qty: 1 }], 0)), 0.3);
});
