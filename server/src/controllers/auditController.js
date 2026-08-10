const db = require('../database/connection');

class AuditController {
  async getLogs(req, res) {
    try {
      const logs = await db.query(`
        SELECT a.*, u.name as user_name, u.email as user_email
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.timestamp DESC
        LIMIT 100
      `);
      res.json({ success: true, data: logs.rows });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new AuditController();
