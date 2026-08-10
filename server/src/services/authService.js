const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const userRepository = require('../repositories/userRepository');
const db = require('../database/connection');

class AuthService {
  async login(email, password, ip, userAgent) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new Error('Invalid authentication credentials.');

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) throw new Error('Invalid authentication credentials.');

    const payload = { id: user.id, name: user.name, email: user.email, role: user.role, company_id: user.company_id, branch_id: user.branch_id };
    const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '8h' });
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    await userRepository.saveRefreshToken(user.id, refreshToken);
    await userRepository.recordLoginHistory(user.id, ip, userAgent);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, company: user.company_name, branch_id: user.branch_id }
    };
  }

  async registerCompany(companyName, adminName, email, password) {
    const existing = await userRepository.findByEmail(email);
    if (existing) throw new Error('Account email already registered in system.');

    const cRes = await db.query("INSERT INTO companies (name, currency) VALUES ($1, 'USD') RETURNING id", [companyName]);
    const companyId = cRes.rows[0].id;

    const bRes = await db.query("INSERT INTO branches (company_id, name, location, is_headquarters) VALUES ($1, 'Main HQ Branch', 'Primary Location', 1) RETURNING id", [companyId]);
    const branchId = bRes.rows[0].id;

    await db.query("INSERT INTO departments (branch_id, name) VALUES ($1, 'Executive Management')", [branchId]);

    const passHash = bcrypt.hashSync(password, 10);
    const uRes = await db.query("INSERT INTO users (company_id, branch_id, name, email, password_hash, role, department) VALUES ($1, $2, $3, $4, $5, 'Admin', 'Executive Management') RETURNING id", [companyId, branchId, adminName, email, passHash]);
    const userId = uRes.rows[0].id;

    await db.query("INSERT INTO chart_of_accounts (company_id, code, name, type, balance) VALUES ($1, '1000', 'Cash Operating Account', 'Asset', 0.00)", [companyId]);
    await db.query("INSERT INTO chart_of_accounts (company_id, code, name, type, balance) VALUES ($1, '4000', 'Merchandise Sales Revenue', 'Revenue', 0.00)", [companyId]);

    const payload = { id: userId, name: adminName, email, role: 'Admin', company_id: companyId, branch_id: branchId };
    const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '8h' });
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      user: { id: userId, name: adminName, email, role: 'Admin', company: companyName, branch_id: branchId }
    };
  }

  async resetPassword(email, newPassword) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new Error('No registered workspace account found for that email address.');

    const passHash = bcrypt.hashSync(newPassword, 10);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passHash, user.id]);
    return true;
  }
}

module.exports = new AuthService();
