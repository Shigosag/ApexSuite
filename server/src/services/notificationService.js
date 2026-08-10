const db = require('../database/connection');

async function notifyUser(userId, title, message, type = 'info') {
  try {
    await db.query('INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)', [userId, title, message, type]);
  } catch (err) {
    console.error('Failed to generate user notification:', err.message);
  }
}

module.exports = { notifyUser };
