const { invoiceTotal } = require('./invoices');
const { formatMoney } = require('./money');

// Ledger lines for the bank import: `<id>;<date>;<total>`, one per invoice.
// The bank parses the total as a plain decimal number.
function ledgerLines(invoices) {
  return invoices.map((invoice) => `${invoice.id};${invoice.date};${formatMoney(invoiceTotal(invoice))}`).join('\n');
}

module.exports = { ledgerLines };
