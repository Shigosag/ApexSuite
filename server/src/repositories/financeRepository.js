const db = require('../database/connection');

class FinanceRepository {
  async getFinancialSummary(companyId = null, branchId = null) {
    let targetCompanyId = companyId;
    if (!targetCompanyId && branchId) {
      const b = await db.query('SELECT company_id FROM branches WHERE id = $1', [branchId]);
      if (b.rows.length > 0) targetCompanyId = b.rows[0].company_id;
    }
    if (!targetCompanyId) {
      const c = await db.query('SELECT id FROM companies ORDER BY id ASC LIMIT 1');
      targetCompanyId = c.rows.length > 0 ? c.rows[0].id : 1;
    }

    const companyBranches = await db.query('SELECT id FROM branches WHERE company_id = $1', [targetCompanyId]);
    const branchIds = companyBranches.rows.map(b => b.id);

    let rev = 0;
    let exp = 0;

    if (branchIds.length > 0) {
      const placeholders = branchIds.map((_, i) => `$${i + 1}`).join(',');

      const revRow = await db.query(`
        SELECT COALESCE(SUM(total_amount), 0) as total 
        FROM orders 
        WHERE (status = 'Completed' OR status IS NULL)
          AND branch_id IN (${placeholders})
      `, branchIds);
      rev = parseFloat(revRow.rows[0].total || 0);

      const expRow = await db.query(`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM expenses 
        WHERE branch_id IN (${placeholders})
      `, branchIds);
      exp = parseFloat(expRow.rows[0].total || 0);
    }

    const arRow = await db.query(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM accounts_receivable 
      WHERE status = 'Outstanding' 
        AND customer_id IN (SELECT id FROM customers WHERE company_id = $1)
    `, [targetCompanyId]);
    const ar = parseFloat(arRow.rows[0].total || 0);

    const apRow = await db.query(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM accounts_payable 
      WHERE status = 'Unpaid'
        AND supplier_id IN (SELECT id FROM suppliers WHERE company_id = $1)
    `, [targetCompanyId]);
    const ap = parseFloat(apRow.rows[0].total || 0);

    const net = rev - exp;

    return { revenue: rev, expenses: exp, net_profit: net, accounts_receivable: ar, accounts_payable: ap };
  }

  async logExpense(branchId, category, description, amount, expenseDate) {
    await db.query('INSERT INTO expenses (branch_id, category, description, amount, expense_date) VALUES ($1, $2, $3, $4, $5)', [branchId, category, description, amount, expenseDate]);
  }
}

module.exports = new FinanceRepository();
