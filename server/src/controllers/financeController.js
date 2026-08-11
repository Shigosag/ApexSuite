const financeRepository = require('../repositories/financeRepository');
const db = require('../database/connection');
const { pool } = require('../database/connection');

class FinanceController {
  async getSummary(req, res) {
    try {
      const summary = await financeRepository.getFinancialSummary(req.user.company_id, req.user.branch_id);
      res.json({ success: true, data: summary });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getExpenses(req, res) {
    try {
      const expenses = await db.query('SELECT * FROM expenses WHERE branch_id IN (SELECT id FROM branches WHERE company_id = $1) ORDER BY expense_date DESC LIMIT 100', [req.user.company_id]);
      res.json({ success: true, data: expenses.rows });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async logExpense(req, res) {
    const { category, description, amount, expense_date } = req.body;
    if (!category || !amount) {
      return res.status(400).json({ success: false, error: 'Category and amount are required.' });
    }

    if (!req.user.branch_id) {
      return res.status(400).json({ success: false, error: 'No active branch location assigned. Please register a branch in Settings first.' });
    }

    try {
      await financeRepository.logExpense(req.user.branch_id, category, description || '', amount, expense_date || new Date().toISOString().split('T')[0]);
      res.json({ success: true, message: 'Expense recorded successfully.' });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async logIncome(req, res) {
    const { description, amount, income_date } = req.body;
    if (!amount) {
      return res.status(400).json({ success: false, error: 'Income amount is required.' });
    }

    if (!req.user.branch_id) {
      return res.status(400).json({ success: false, error: 'No active branch location assigned. Please register a branch in Settings first.' });
    }

    const client = await pool.connect();

    try {
      const orderNum = `INC-${Date.now().toString().slice(-6)}`;
      const dateStr = income_date || new Date().toISOString();

      await client.query('BEGIN');
      await client.query(`
        INSERT INTO orders (branch_id, cashier_id, order_number, total_amount, tax_amount, discount_amount, payment_method, status, created_at)
        VALUES ($1, $2, $3, $4, 0, 0, 'Cash', 'Completed', $5)
      `, [req.user.branch_id, req.user.id, orderNum, amount, dateStr]);

      await client.query("UPDATE chart_of_accounts SET balance = balance + $1 WHERE code = '1000' AND company_id = $2", [amount, req.user.company_id]);
      await client.query("UPDATE chart_of_accounts SET balance = balance + $1 WHERE code = '4000' AND company_id = $2", [amount, req.user.company_id]);
      await client.query('COMMIT');

      res.json({ success: true, message: 'Sales income recorded successfully.' });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, error: err.message });
    } finally {
      client.release();
    }
  }

  async getInvoices(req, res) {
    try {
      const invoices = await db.query(`
        SELECT i.*, c.name as customer_name
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        WHERE i.order_id IN (SELECT id FROM orders WHERE branch_id IN (SELECT id FROM branches WHERE company_id = $1))
        ORDER BY i.created_at DESC
      `, [req.user.company_id]);
      res.json({ success: true, data: invoices.rows });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async payInvoice(req, res) {
    const { invoice_id, amount, payment_method } = req.body;
    if (!invoice_id || !amount) {
      return res.status(400).json({ success: false, error: 'Invoice ID and payment amount are required.' });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query("INSERT INTO payments (invoice_id, amount, payment_method) VALUES ($1, $2, $3)", [invoice_id, amount, payment_method || 'Bank Transfer']);
      await client.query("UPDATE invoices SET status = 'Paid' WHERE id = $1", [invoice_id]);
      await client.query("UPDATE accounts_receivable SET status = 'Settled' WHERE invoice_id = $1", [invoice_id]);
      await client.query("UPDATE chart_of_accounts SET balance = balance + $1 WHERE code = '1000' AND company_id = $2", [amount, req.user.company_id]);
      await client.query('COMMIT');

      res.json({ success: true, message: 'Invoice payment settled.' });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, error: err.message });
    } finally {
      client.release();
    }
  }

  async getAccountsPayable(req, res) {
    try {
      const ap = await db.query(`
        SELECT ap.*, s.name as supplier_name
        FROM accounts_payable ap
        LEFT JOIN suppliers s ON ap.supplier_id = s.id
        WHERE s.company_id = $1
        ORDER BY ap.due_date ASC
      `, [req.user.company_id]);
      res.json({ success: true, data: ap.rows });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async logAccountPayable(req, res) {
    const { supplier_id, amount, due_date } = req.body;
    if (!supplier_id || !amount || !due_date) {
      return res.status(400).json({ success: false, error: 'Supplier ID, amount, and due date are required.' });
    }

    try {
      const info = await db.query(`
        INSERT INTO accounts_payable (supplier_id, amount, due_date, status)
        VALUES ($1, $2, $3, 'Unpaid')
        RETURNING id
      `, [supplier_id, amount, due_date]);

      res.json({ success: true, payable_id: info.rows[0].id, message: 'Supplier bill recorded in Accounts Payable.' });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async payAccountPayable(req, res) {
    const { payable_id, amount } = req.body;
    if (!payable_id || !amount) {
      return res.status(400).json({ success: false, error: 'Payable ID and amount are required.' });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query("UPDATE accounts_payable SET status = 'Paid' WHERE id = $1", [payable_id]);
      await client.query("UPDATE chart_of_accounts SET balance = balance - $1 WHERE code = '1000' AND company_id = $2", [amount, req.user.company_id]);
      await client.query('COMMIT');

      res.json({ success: true, message: 'Supplier bill paid and deducted from Cash account.' });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, error: err.message });
    } finally {
      client.release();
    }
  }

  async getChartOfAccounts(req, res) {
    try {
      const accounts = await db.query('SELECT * FROM chart_of_accounts WHERE company_id = $1 ORDER BY code ASC', [req.user.company_id]);
      res.json({ success: true, data: accounts.rows });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new FinanceController();
