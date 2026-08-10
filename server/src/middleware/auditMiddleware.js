const db = require('../database/connection');
const logger = require('../config/logger');

function auditLog(action) {
  return (req, res, next) => {
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const userId = req.user ? req.user.id : null;
          const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
          const details = JSON.stringify({
            method: req.method,
            url: req.originalUrl,
            params: req.params,
            query: req.query
          });

          await db.query('INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)', [userId, action, details, ip]);
        } catch (err) {
          logger.error('Audit logging failed:', err.message);
        }
      }
    });
    next();
  };
}

module.exports = { auditLog };
