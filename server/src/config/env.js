require('dotenv').config();

const requiredSecrets = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL'];
for (const secret of requiredSecrets) {
  if (!process.env[secret]) {
    console.error(`[FATAL SECURITY ERROR] Missing environment variable: ${secret}`);
    process.exit(1);
  }
}

module.exports = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'production',
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  COMPANY_NAME: process.env.COMPANY_NAME || 'ApexSuite Inc.',
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads'
};
