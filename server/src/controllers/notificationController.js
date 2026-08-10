const db = require('../database/connection');

class NotificationController {
  async getNotifications(req, res) {
    try {
      const notifs = await db.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30', [req.user.id]);
      res.json({ success: true, data: notifs.rows });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async markRead(req, res) {
    try {
      await db.query('UPDATE notifications SET is_read = 1 WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async markAllRead(req, res) {
    try {
      await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = $1', [req.user.id]);
      res.json({ success: true, message: 'All notifications marked as read.' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new NotificationController();
