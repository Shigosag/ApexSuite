const jwt = require('jsonwebtoken');
const env = require('../config/env');
const db = require('../database/connection');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  if (!token && req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access denied. Missing authorization token.' });
  }

  jwt.verify(token, env.JWT_SECRET, async (err, user) => {
    if (err) {
      return res.status(401).json({ success: false, error: 'Session expired or invalid token. Please log in again.' });
    }

    try {
      const userRes = await db.query('SELECT u.id, u.company_id, u.branch_id, u.role, u.name, u.email FROM users u WHERE u.id = $1', [user.id]);
      const dbUser = userRes.rows[0];

      if (!dbUser) {
        return res.status(401).json({ success: false, error: 'User account no longer exists in database. Please log in again.' });
      }

      const companyRes = await db.query('SELECT id FROM companies WHERE id = $1', [dbUser.company_id]);
      if (companyRes.rows.length === 0) {
        return res.status(401).json({ success: false, error: 'Workspace company no longer exists. Please re-authenticate.' });
      }

      let validBranchId = dbUser.branch_id;
      if (validBranchId) {
        const branchRes = await db.query('SELECT id FROM branches WHERE id = $1 AND company_id = $2', [validBranchId, dbUser.company_id]);
        if (branchRes.rows.length === 0) validBranchId = null;
      }

      if (!validBranchId) {
        const hqBranchRes = await db.query('SELECT id FROM branches WHERE company_id = $1 ORDER BY is_headquarters DESC, id ASC LIMIT 1', [dbUser.company_id]);
        validBranchId = hqBranchRes.rows.length > 0 ? hqBranchRes.rows[0].id : null;
      }

      req.user = {
        ...user,
        id: dbUser.id,
        company_id: dbUser.company_id,
        branch_id: validBranchId,
        role: dbUser.role,
        name: dbUser.name,
        email: dbUser.email
      };

      next();
    } catch (dbErr) {
      return res.status(500).json({ success: false, error: 'Database verification error: ' + dbErr.message });
    }
  });
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Access forbidden: Insufficient privileges.' });
    }
    next();
  };
}

module.exports = { authenticateToken, requireRole };
