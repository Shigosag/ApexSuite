const db = require('../database/connection');

class CRMController {
  async getCustomers(req, res) {
    try {
      const customers = await db.query(`
        SELECT c.*, COALESCE(SUM(o.total_amount), 0) as total_spent, COUNT(o.id) as order_count
        FROM customers c
        LEFT JOIN orders o ON c.id = o.customer_id
        WHERE c.company_id = $1
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `, [req.user.company_id]);
      res.json({ success: true, data: customers.rows });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async createCustomer(req, res) {
    const { name, email, phone, company_name, segment, tags } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Customer name and email are required.' });
    }
    try {
      const company = await db.query('SELECT id FROM companies WHERE id = $1', [req.user.company_id]);
      if (company.rows.length === 0) {
        return res.status(401).json({ success: false, error: 'Invalid company workspace. Please re-login.' });
      }

      const info = await db.query(
        'INSERT INTO customers (company_id, name, email, phone, company_name, segment, tags) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [req.user.company_id, name, email, phone || '', company_name || '', segment || 'General', tags || '']
      );

      res.json({ success: true, customer_id: info.rows[0].id, message: 'Customer profile saved.' });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async updateCustomer(req, res) {
    const { id } = req.params;
    const { name, email, phone, company_name, segment } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Customer name and email are required.' });
    }
    try {
      const updateResult = await db.query(
        'UPDATE customers SET name = $1, email = $2, phone = $3, company_name = $4, segment = $5 WHERE id = $6 AND company_id = $7',
        [name, email, phone || '', company_name || '', segment || 'General', id, req.user.company_id]
      );
      if (updateResult.rowCount === 0) {
        return res.status(404).json({ success: false, error: 'Customer not found or unauthorized.' });
      }
      res.json({ success: true, message: 'Customer profile updated.' });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async deleteCustomer(req, res) {
    try {
      const deleteResult = await db.query('DELETE FROM customers WHERE id = $1 AND company_id = $2', [req.params.id, req.user.company_id]);
      if (deleteResult.rowCount === 0) {
        return res.status(404).json({ success: false, error: 'Customer not found or unauthorized.' });
      }
      res.json({ success: true, message: 'Customer profile deleted.' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getLeads(req, res) {
    try {
      const leads = await db.query(`
        SELECT l.*, c.name as customer_name, c.email as customer_email
        FROM leads l
        JOIN customers c ON l.customer_id = c.id
        WHERE c.company_id = $1
        ORDER BY l.id DESC
      `, [req.user.company_id]);
      res.json({ success: true, data: leads.rows });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async createLead(req, res) {
    const { customer_id, title, value, stage } = req.body;
    if (!customer_id || !title) {
      return res.status(400).json({ success: false, error: 'Customer ID and deal title are required.' });
    }
    try {
      const custCheck = await db.query('SELECT id FROM customers WHERE id = $1 AND company_id = $2', [customer_id, req.user.company_id]);
      if (custCheck.rows.length === 0) {
        return res.status(403).json({ success: false, error: 'Unauthorized: Target customer does not belong to your company.' });
      }

      const info = await db.query('INSERT INTO leads (customer_id, title, value, stage) VALUES ($1, $2, $3, $4) RETURNING id', [
        customer_id,
        title,
        value || 0.0,
        stage || 'New'
      ]);
      res.json({ success: true, lead_id: info.rows[0].id });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async updateLead(req, res) {
    const { id } = req.params;
    const { title, value, stage } = req.body;
    if (!title) return res.status(400).json({ success: false, error: 'Deal title is required.' });
    try {
      const updateResult = await db.query(`
        UPDATE leads
        SET title = $1, value = $2, stage = $3
        WHERE id = $4 AND customer_id IN (SELECT id FROM customers WHERE company_id = $5)
      `, [title, value || 0.0, stage || 'New', id, req.user.company_id]);

      if (updateResult.rowCount === 0) {
        return res.status(404).json({ success: false, error: 'Deal not found or unauthorized.' });
      }
      res.json({ success: true, message: 'Deal lead updated.' });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async deleteLead(req, res) {
    const { id } = req.params;
    try {
      const deleteResult = await db.query(`
        DELETE FROM leads 
        WHERE id = $1 AND customer_id IN (SELECT id FROM customers WHERE company_id = $2)
      `, [id, req.user.company_id]);

      if (deleteResult.rowCount === 0) {
        return res.status(404).json({ success: false, error: 'Deal lead not found or unauthorized.' });
      }
      res.json({ success: true, message: 'Deal lead deleted.' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async updateLeadStage(req, res) {
    const { lead_id, stage } = req.body;
    try {
      const updateResult = await db.query(`
        UPDATE leads 
        SET stage = $1 
        WHERE id = $2 AND customer_id IN (SELECT id FROM customers WHERE company_id = $3)
      `, [stage, lead_id, req.user.company_id]);

      if (updateResult.rowCount === 0) {
        return res.status(404).json({ success: false, error: 'Deal lead not found or unauthorized.' });
      }
      res.json({ success: true, message: 'Lead deal stage updated.' });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async addNote(req, res) {
    const { customer_id, content } = req.body;
    if (!customer_id || !content) return res.status(400).json({ success: false, error: 'Customer ID and content required.' });
    try {
      const custCheck = await db.query('SELECT id FROM customers WHERE id = $1 AND company_id = $2', [customer_id, req.user.company_id]);
      if (custCheck.rows.length === 0) {
        return res.status(403).json({ success: false, error: 'Unauthorized: Customer does not belong to your company.' });
      }

      const info = await db.query('INSERT INTO crm_notes (customer_id, author_id, content) VALUES ($1, $2, $3) RETURNING id', [
        customer_id,
        req.user.id,
        content
      ]);
      res.json({ success: true, note_id: info.rows[0].id });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async getNotes(req, res) {
    try {
      const notes = await db.query(`
        SELECT n.*, u.name as author_name
        FROM crm_notes n
        LEFT JOIN users u ON n.author_id = u.id
        JOIN customers c ON n.customer_id = c.id
        WHERE n.customer_id = $1 AND c.company_id = $2
        ORDER BY n.created_at DESC
      `, [req.params.customerId, req.user.company_id]);
      res.json({ success: true, data: notes.rows });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new CRMController();
