const { listInvoices, invoiceTotal } = require('./invoices');
const { can } = require('./permissions');
const { PermissionError } = require('./errors');

// A leading = + - @ makes a spreadsheet run the cell as a formula.
const neutral = (value) => (/^[=+\-@\t\r]/.test(value) ? `'${value}` : value);
const cell = (value) => {
  const text = neutral(String(value));
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

function exportInvoices(user, { from, to }) {
  if (!can(user, 'invoices.export')) throw new PermissionError('cannot export invoices');
  const rows = listInvoices(user)
    .filter((i) => i.date >= from && i.date <= to)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map((i) => [i.id, i.date, i.customer, invoiceTotal(i).toFixed(2)].map(cell).join(','));
  return ['id,date,customer,total', ...rows].join('\n') + '\n';
}

module.exports = { exportInvoices };
