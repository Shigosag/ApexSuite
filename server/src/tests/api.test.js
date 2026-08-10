// Set dummy test environment variables before requiring config
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_for_testing_12345';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_jwt_refresh_secret_key_for_testing_12345';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/testdb';

const test = require('node:test');
const assert = require('node:assert');
const { formatCurrency, calculateTax, sanitizeInput } = require('../utils/helpers');

test('Utility Helpers - Tax Calculation', () => {
  const tax = calculateTax(100, 0.07);
  assert.strictEqual(tax, 7.00);
});

test('Utility Helpers - Currency Formatting', () => {
  const formatted = formatCurrency(1250.5, '$');
  assert.strictEqual(formatted, '$1250.50');
});

test('Utility Helpers - Input Sanitization', () => {
  const sanitized = sanitizeInput('<script>alert("xss")</script>');
  assert.strictEqual(sanitized, 'scriptalert("xss")/script');
});

test('Environment Configuration Check', () => {
  const env = require('../config/env');
  assert.ok(env.PORT, 'PORT must be set');
  assert.ok(env.JWT_SECRET, 'JWT_SECRET must be set');
  assert.ok(env.DATABASE_URL, 'DATABASE_URL must be set');
});