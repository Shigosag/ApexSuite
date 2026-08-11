/**
 * Shared System Utility Helpers
 */

function formatCurrency(amount, currencySymbol = '$') {
  const val = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  const formatted = val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${currencySymbol}${formatted}`;
}

function generateCode(prefix = 'REF') {
  return `${prefix}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 899 + 100)}`;
}

function calculateTax(amount, taxRate = 0.07) {
  return Math.round(Math.max(0, amount) * taxRate * 100) / 100;
}

function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '');
}

module.exports = {
  formatCurrency,
  generateCode,
  calculateTax,
  sanitizeInput
};
