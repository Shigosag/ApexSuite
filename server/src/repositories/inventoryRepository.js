const db = require('../database/connection');

class InventoryRepository {
  async getAllProducts(companyId, branchId) {
    const res = await db.query(`
      SELECT p.*, c.name as category_name, s.name as supplier_name,
        COALESCE(bi.stock_qty, 0) as current_stock,
        CASE WHEN COALESCE(bi.stock_qty, 0) <= p.min_stock_alert THEN 1 ELSE 0 END as is_low_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN branch_inventory bi ON p.id = bi.product_id AND bi.branch_id = $1
      WHERE p.company_id = $2
      ORDER BY p.name ASC
    `, [branchId, companyId]);
    return res.rows;
  }

  async adjustStock(productId, branchId, adjustmentQty, reason) {
    const existingRes = await db.query('SELECT stock_qty FROM branch_inventory WHERE branch_id = $1 AND product_id = $2', [branchId, productId]);
    if (existingRes.rows.length > 0) {
      await db.query('UPDATE branch_inventory SET stock_qty = stock_qty + $1 WHERE branch_id = $2 AND product_id = $3', [adjustmentQty, branchId, productId]);
    } else {
      await db.query('INSERT INTO branch_inventory (branch_id, product_id, stock_qty) VALUES ($1, $2, $3)', [branchId, productId, Math.max(0, adjustmentQty)]);
    }

    await db.query('INSERT INTO stock_movements (product_id, branch_id, type, quantity, reason) VALUES ($1, $2, $3, $4, $5)', [
      productId,
      branchId,
      adjustmentQty >= 0 ? 'IN' : 'OUT',
      Math.abs(adjustmentQty),
      reason
    ]);
  }
}

module.exports = new InventoryRepository();
