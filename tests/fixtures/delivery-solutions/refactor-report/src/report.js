const { invoiceTotal } = require('./invoices');
const { formatMoney } = require('./money');

const byDate = (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

function invoiceLines(sorted) {
  return ['Invoices', ...sorted.map((invoice) =>
    `  ${invoice.id}  ${invoice.date}  ${invoice.customer.padEnd(20)}  ${formatMoney(invoiceTotal(invoice)).padStart(10)}`)];
}

function customerLines(own) {
  const byCustomer = {};
  for (const invoice of own) byCustomer[invoice.customer] = (byCustomer[invoice.customer] || 0) + invoiceTotal(invoice);
  return ['By customer', ...Object.keys(byCustomer).sort().map((customer) =>
    `  ${customer.padEnd(20)}  ${formatMoney(byCustomer[customer]).padStart(10)}`)];
}

function totalLine(own) {
  let grand = 0;
  for (const invoice of own) grand += invoiceTotal(invoice);
  return `Total  ${formatMoney(grand)}`;
}

function overdueLines(sorted, today) {
  const overdue = sorted.filter((invoice) => invoice.dueDate && invoice.dueDate < today && !invoice.paid);
  if (!overdue.length) return [];
  return ['', 'Overdue', ...overdue.map((invoice) => {
    const days = Math.round((Date.parse(today) - Date.parse(invoice.dueDate)) / 86400000);
    return `  ${invoice.id}  ${invoice.customer}  ${days} days`;
  })];
}

// Monthly report for one account. Plain text, one section after another.
function buildReport(account, invoices, today) {
  const header = [`Report for ${account.name}`, `Generated ${today}`, ''];
  const own = invoices.filter((i) => i.accountId === account.id);
  if (!own.length) return [...header, 'No invoices.'].join('\n');
  const sorted = [...own].sort(byDate);
  return [...header, ...invoiceLines(sorted), '', ...customerLines(own), '', totalLine(own),
    ...overdueLines(sorted, today)].join('\n');
}

module.exports = { buildReport };
