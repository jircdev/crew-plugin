// In-memory store. Tests reset it with seed().
let invoices = [];
let accounts = [];

function seed(data = {}) {
  invoices = (data.invoices || []).map((i) => ({ ...i }));
  accounts = (data.accounts || []).map((a) => ({ ...a }));
}

const allInvoices = () => invoices;
const allAccounts = () => accounts;
const addInvoice = (invoice) => { invoices.push(invoice); return invoice; };
const removeInvoice = (id) => { invoices = invoices.filter((i) => i.id !== id); };

module.exports = { seed, allInvoices, allAccounts, addInvoice, removeInvoice };
