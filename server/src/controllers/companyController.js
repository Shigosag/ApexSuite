const db = require('../database/connection');
const { pool } = require('../database/connection');
const bcrypt = require('bcryptjs');

class CompanyController {
  async getBranches(req, res) {
    try {
      const branches = await db.query('SELECT * FROM branches WHERE company_id = $1 ORDER BY is_headquarters DESC, created_at DESC', [req.user.company_id]);
      res.json({ success: true, data: branches.rows });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async createBranch(req, res) {
    const { name, location, branch_type, is_headquarters } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Branch name is required.' });

    try {
      const company = await db.query('SELECT id FROM companies WHERE id = $1', [req.user.company_id]);
      if (company.rows.length === 0) {
        return res.status(401).json({ success: false, error: 'Company workspace record invalid. Please re-login.' });
      }

      const isHQ = is_headquarters || branch_type === 'Headquarters (HQ)';

      if (isHQ) {
        await db.query('UPDATE branches SET is_headquarters = 0 WHERE company_id = $1', [req.user.company_id]);
      }

      const info = await db.query(
        'INSERT INTO branches (company_id, name, location, branch_type, is_headquarters) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [req.user.company_id, name, location || '', branch_type || 'Regional Branch', isHQ ? 1 : 0]
      );

      res.json({ success: true, branch_id: info.rows[0].id, message: 'Branch registered successfully.' });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async updateBranch(req, res) {
    const { branchId } = req.params;
    const { name, location, branch_type, is_headquarters } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Branch name is required.' });

    try {
      const isHQ = is_headquarters || branch_type === 'Headquarters (HQ)';

      if (isHQ) {
        await db.query('UPDATE branches SET is_headquarters = 0 WHERE company_id = $1', [req.user.company_id]);
      }

      await db.query(
        'UPDATE branches SET name = $1, location = $2, branch_type = $3, is_headquarters = $4 WHERE id = $5 AND company_id = $6',
        [name, location || '', branch_type || 'Regional Branch', isHQ ? 1 : 0, branchId, req.user.company_id]
      );

      res.json({ success: true, message: 'Branch location updated successfully.' });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async deleteBranch(req, res) {
    const { branchId } = req.params;
    try {
      const branchRes = await db.query('SELECT is_headquarters FROM branches WHERE id = $1 AND company_id = $2', [branchId, req.user.company_id]);
      if (branchRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Branch location not found.' });
      }

      if (branchRes.rows[0].is_headquarters) {
        return res.status(400).json({ success: false, error: 'Cannot delete the Headquarters (HQ) branch.' });
      }

      await db.query('DELETE FROM branches WHERE id = $1 AND company_id = $2', [branchId, req.user.company_id]);
      res.json({ success: true, message: 'Branch location deleted.' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getEmployees(req, res) {
    try {
      const users = await db.query(`
        SELECT u.id, u.name, u.email, u.role, u.department, b.name as branch_name, u.created_at
        FROM users u
        LEFT JOIN branches b ON u.branch_id = b.id
        WHERE u.company_id = $1
        ORDER BY u.name ASC
      `, [req.user.company_id]);
      res.json({ success: true, data: users.rows });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async createEmployee(req, res) {
    const { name, email, password, role, department, branch_id } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    }

    try {
      const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) return res.status(400).json({ success: false, error: 'User email already exists.' });

      const passHash = bcrypt.hashSync(password, 10);
      const info = await db.query(
        'INSERT INTO users (company_id, branch_id, name, email, password_hash, role, department) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [req.user.company_id, branch_id || req.user.branch_id, name, email, passHash, role || 'Employee', department || 'General']
      );

      res.json({ success: true, user_id: info.rows[0].id, message: 'Employee user created successfully.' });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async deleteEmployee(req, res) {
    const { employeeId } = req.params;
    if (parseInt(employeeId, 10) === req.user.id) {
      return res.status(400).json({ success: false, error: 'You cannot delete your own logged in user account.' });
    }

    try {
      await db.query('DELETE FROM users WHERE id = $1 AND company_id = $2', [employeeId, req.user.company_id]);
      res.json({ success: true, message: 'Employee user account deleted.' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async deleteAccount(req, res) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const companyId = req.user.company_id;

      // Clean up sales items & orders before deleting products & company
      await client.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE branch_id IN (SELECT id FROM branches WHERE company_id = $1))', [companyId]);
      await client.query('DELETE FROM orders WHERE branch_id IN (SELECT id FROM branches WHERE company_id = $1)', [companyId]);
      await client.query('DELETE FROM products WHERE company_id = $1', [companyId]);
      await client.query('DELETE FROM companies WHERE id = $1', [companyId]);

      await client.query('COMMIT');
      res.json({ success: true, message: 'Company workspace deleted successfully.' });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(500).json({ success: false, error: err.message });
    } finally {
      client.release();
    }
  }
}

module.exports = new CompanyController();
