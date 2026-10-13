const GRANTS = {
  admin: ['invoices.read', 'invoices.create', 'invoices.delete', 'invoices.export'],
  accountant: ['invoices.read', 'invoices.create', 'invoices.export'],
  viewer: ['invoices.read'],
};

function can(user, action) {
  return Boolean(user && (GRANTS[user.role] || []).includes(action));
}

module.exports = { can, GRANTS };
