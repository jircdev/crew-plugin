const store = require('./store');
const { can } = require('./permissions');
const { PermissionError, ValidationError } = require('./errors');

let next = 1;

function createInvoice(user, { customer, date, items, taxRate = 0.21, discount = 0 }) {
  if (!can(user, 'invoices.create')) throw new PermissionError('cannot create invoices');
  if (!Array.isArray(items) || !items.length) throw new ValidationError('an invoice needs items');
  if (typeof discount !== 'number' || discount < 0 || discount > 100) throw new ValidationError('discount must be 0 to 100');
  const invoice = { id: `INV-${next++}`, accountId: user.accountId, customer, date, items, taxRate, discount };
  return store.addInvoice(invoice);
}

function invoiceTotal(invoice) {
  const subtotal = invoice.items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.qty, 0);
  const discounted = subtotal * (1 - (invoice.discount || 0) / 100);
  return Math.round(discounted * (1 + invoice.taxRate)) / 100;
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
