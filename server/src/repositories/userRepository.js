const db = require('../database/connection');

class UserRepository {
  async findByEmail(email) {
    const res = await db.query(`
      SELECT u.*, c.name as company_name 
      FROM users u 
      JOIN companies c ON u.company_id = c.id 
      WHERE u.email = $1
    `, [email]);
    return res.rows[0] || null;
  }

  async findById(id) {
    const res = await db.query(`
      SELECT id, company_id, branch_id, name, email, role, department, created_at 
      FROM users 
      WHERE id = $1
    `, [id]);
    return res.rows[0] || null;
  }

  async recordLoginHistory(userId, ip, userAgent) {
    await db.query('INSERT INTO login_history (user_id, ip_address, user_agent) VALUES ($1, $2, $3)', [userId, ip, userAgent]);
  }

  async saveRefreshToken(userId, token) {
    await db.query('UPDATE users SET refresh_tokens = $1 WHERE id = $2', [token, userId]);
  }
}

module.exports = new UserRepository();
