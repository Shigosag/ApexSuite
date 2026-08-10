const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const env = require('./src/config/env');
const logger = require('./src/config/logger');
const { runMigrations } = require('./src/database/migrations');
const { initBackgroundJobs } = require('./src/jobs/cronTasks');

const app = express();

// Security Stack & Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Static Uploads & Client SPA Mounting
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));
app.use(express.static(path.join(__dirname, '../client/src')));

// API Routes
app.use('/api/v1', require('./src/routes/apiRouter'));

// SPA Fallback Route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/src/index.html'));
});

// Global Central Error Middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled Server Exception:', err.stack || err.message);
  res.status(500).json({ success: false, error: err.message || 'Internal Enterprise Server Error' });
});

async function startServer() {
  try {
    // Execute Neon Database Schema & Migration Engine
    await runMigrations();

    // Initialize Automated Background Scheduler Tasks
    initBackgroundJobs();

    // Start HTTP Server
    app.listen(env.PORT, () => {
      logger.info(`=============================================================`);
      logger.info(`🚀 APEXSUITE ENTERPRISE AI ERP, CRM & POS ENGINE RUNNING`);
      logger.info(`🟢 URL: http://localhost:${env.PORT}`);
      logger.info(`🐘 Database: PostgreSQL`);
      logger.info(`🎨 Branding: Powered by Shigosag (#f34b7d)`);
      logger.info(`=============================================================`);
    });
  } catch (err) {
    logger.error('Fatal Server Initialization Failure:', err.message);
    process.exit(1);
  }
}

startServer();
