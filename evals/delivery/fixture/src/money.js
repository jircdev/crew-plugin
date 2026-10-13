const toCents = (amount) => Math.round(amount * 100);
const fromCents = (cents) => cents / 100;
const formatMoney = (amount) => amount.toFixed(2);

module.exports = { toCents, fromCents, formatMoney };
