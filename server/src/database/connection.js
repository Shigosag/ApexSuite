const { Pool } = require('pg');
const env = require('../config/env');
const logger = require('../config/logger');

const isLocalhost = env.DATABASE_URL.includes('localhost') || env.DATABASE_URL.includes('127.0.0.1');

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  logger.error('Unexpected database pool error:', err.message);
});

// Test connection on startup
pool.query('SELECT NOW()')
  .then(() => logger.info('🐘 Connected to PostgreSQL database successfully!'))
  .catch((err) => logger.error('❌ Database connection failed:', err.message));

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};