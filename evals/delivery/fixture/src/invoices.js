const store = require('./store');
const { can } = require('./permissions');
const { PermissionError, ValidationError } = require('./errors');

let next = 1;

function createInvoice(user, { customer, date, items, taxRate = 0.21 }) {
  if (!can(user, 'invoices.create')) throw new PermissionError('cannot create invoices');
  if (!Array.isArray(items) || !items.length) throw new ValidationError('an invoice needs items');
  const invoice = { id: `INV-${next++}`, accountId: user.accountId, customer, date, items, taxRate };
  return store.addInvoice(invoice);
}

function invoiceTotal(invoice) {
  let total = 0;
  for (const item of invoice.items) {
    const line = item.price * item.qty;
    const tax = Math.round(line * invoice.taxRate * 100) / 100;
    total += line + tax;
  }
  return Math.round(total * 100) / 100;
}

function listInvoices(user) {
  if (!can(user, 'invoices.read')) throw new PermissionError('cannot read invoices');
  return store.allInvoices().filter((i) => i.accountId === user.accountId);
}

function deleteInvoice(user, id) {
  if (!can(user, 'invoices.delete')) throw new PermissionError('cannot delete invoices');
  const invoice = store.allInvoices().find((i) => i.id === id && i.accountId === user.accountId);
  if (!invoice) throw new ValidationError(`no invoice ${id}`);
  store.removeInvoice(id);
}

module.exports = { createInvoice, invoiceTotal, listInvoices, deleteInvoice };
