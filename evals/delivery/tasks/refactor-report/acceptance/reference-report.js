const { invoiceTotal } = require('../src/invoices');
const { formatMoney } = require('../src/money');

// Frozen copy of the original buildReport: the refactor must reproduce its output.
function reference(account, invoices, today) {
  const lines = [];
  lines.push(`Report for ${account.name}`);
  lines.push(`Generated ${today}`);
  lines.push('');
  const own = invoices.filter((i) => i.accountId === account.id);
  if (!own.length) {
    lines.push('No invoices.');
    return lines.join('\n');
  }
  lines.push('Invoices');
  const sorted = [...own].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  for (const invoice of sorted) {
    const total = invoiceTotal(invoice);
    lines.push(`  ${invoice.id}  ${invoice.date}  ${invoice.customer.padEnd(20)}  ${formatMoney(total).padStart(10)}`);
  }
  lines.push('');
  lines.push('By customer');
  const byCustomer = {};
  for (const invoice of own) {
    byCustomer[invoice.customer] = (byCustomer[invoice.customer] || 0) + invoiceTotal(invoice);
  }
  const customers = Object.keys(byCustomer).sort();
  for (const customer of customers) {
    lines.push(`  ${customer.padEnd(20)}  ${formatMoney(byCustomer[customer]).padStart(10)}`);
  }
  lines.push('');
  let grand = 0;
  for (const invoice of own) grand += invoiceTotal(invoice);
  lines.push(`Total  ${formatMoney(grand)}`);
  const overdue = [];
  for (const invoice of sorted) {
    if (invoice.dueDate && invoice.dueDate < today && !invoice.paid) overdue.push(invoice);
  }
  if (overdue.length) {
    lines.push('');
    lines.push('Overdue');
    for (const invoice of overdue) {
      const days = Math.round((Date.parse(today) - Date.parse(invoice.dueDate)) / 86400000);
      lines.push(`  ${invoice.id}  ${invoice.customer}  ${days} days`);
    }
  }
  return lines.join('\n');
}

module.exports = { reference };
