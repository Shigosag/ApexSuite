const inventoryRepository = require('../repositories/inventoryRepository');
const db = require('../database/connection');
const { pool } = require('../database/connection');

class InventoryController {
  async getProducts(req, res) {
    try {
      const branchId = req.query.branch_id || req.user.branch_id;
      const products = await inventoryRepository.getAllProducts(req.user.company_id, branchId);
      res.json({ success: true, data: products });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async createProduct(req, res) {
    const { category_id, supplier_id, sku, barcode, name, unit, weight, description, variant_name, cost_price, selling_price, min_stock_alert, initial_stock } = req.body;
    if (!sku || !name || selling_price === undefined) {
      return res.status(400).json({ success: false, error: 'SKU, Name, and Selling Price are required.' });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const info = await client.query(`
        INSERT INTO products (company_id, category_id, supplier_id, sku, barcode, name, unit, weight, description, variant_name, cost_price, selling_price, min_stock_alert)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
      `, [
        req.user.company_id,
        category_id || null,
        supplier_id || null,
        sku,
        barcode || `BC-${Date.now()}`,
        name,
        unit || 'Pcs',
        weight || 0.0,
        description || '',
        variant_name || 'Standard',
        cost_price || 0.0,
        selling_price,
        min_stock_alert || 10
      ]);

      const productId = info.rows[0].id;
      await client.query('INSERT INTO branch_inventory (branch_id, product_id, stock_qty) VALUES ($1, $2, $3)', [req.user.branch_id, productId, initial_stock || 0]);
      await client.query("INSERT INTO stock_movements (product_id, branch_id, type, quantity, reason) VALUES ($1, $2, 'IN', $3, 'Initial Inventory Setup')", [productId, req.user.branch_id, initial_stock || 0]);
      await client.query('COMMIT');

      res.json({ success: true, product_id: productId, message: 'Product created and inventory seeded.' });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, error: err.message });
    } finally {
      client.release();
    }
  }

  async deleteProduct(req, res) {
    try {
      await db.query('DELETE FROM products WHERE id = $1 AND company_id = $2', [req.params.id, req.user.company_id]);
      res.json({ success: true, message: 'Product removed from inventory.' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async adjustStock(req, res) {
    const { product_id, branch_id, adjustment_qty, reason } = req.body;
    try {
      await inventoryRepository.adjustStock(product_id, branch_id || req.user.branch_id, parseInt(adjustment_qty, 10), reason || 'Manual Adjustment');
      res.json({ success: true, message: 'Stock level updated.' });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async transferStock(req, res) {
    const { product_id, from_branch_id, to_branch_id, quantity } = req.body;
    if (!product_id || !from_branch_id || !to_branch_id || !quantity) {
      return res.status(400).json({ success: false, error: 'All transfer fields are required.' });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const sourceInvRes = await client.query('SELECT stock_qty FROM branch_inventory WHERE branch_id = $1 AND product_id = $2', [from_branch_id, product_id]);
      const sourceInv = sourceInvRes.rows[0];

      if (!sourceInv || parseInt(sourceInv.stock_qty, 10) < quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Insufficient stock in source branch for transfer.' });
      }

      await client.query('UPDATE branch_inventory SET stock_qty = stock_qty - $1 WHERE branch_id = $2 AND product_id = $3', [quantity, from_branch_id, product_id]);
      
      const targetInvRes = await client.query('SELECT stock_qty FROM branch_inventory WHERE branch_id = $1 AND product_id = $2', [to_branch_id, product_id]);
      if (targetInvRes.rows.length > 0) {
        await client.query('UPDATE branch_inventory SET stock_qty = stock_qty + $1 WHERE branch_id = $2 AND product_id = $3', [quantity, to_branch_id, product_id]);
      } else {
        await client.query('INSERT INTO branch_inventory (branch_id, product_id, stock_qty) VALUES ($1, $2, $3)', [to_branch_id, product_id, quantity]);
      }

      await client.query("INSERT INTO stock_transfers (product_id, from_branch_id, to_branch_id, quantity, status) VALUES ($1, $2, $3, $4, 'Completed')", [
        product_id,
        from_branch_id,
        to_branch_id,
        quantity
      ]);

      await client.query('COMMIT');
      res.json({ success: true, message: 'Inter-branch stock transfer completed successfully.' });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, error: err.message });
    } finally {
      client.release();
    }
  }

  async getCategories(req, res) {
    try {
      const cats = await db.query('SELECT * FROM categories WHERE company_id = $1 OR company_id IS NULL ORDER BY name ASC', [req.user.company_id]);
      res.json({ success: true, data: cats.rows });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async createCategory(req, res) {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Category name is required.' });
    try {
      const info = await db.query('INSERT INTO categories (company_id, name) VALUES ($1, $2) RETURNING id', [req.user.company_id, name]);
      res.json({ success: true, category_id: info.rows[0].id });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async getSuppliers(req, res) {
    try {
      const suppliers = await db.query('SELECT * FROM suppliers WHERE company_id = $1 OR company_id IS NULL ORDER BY name ASC', [req.user.company_id]);
      res.json({ success: true, data: suppliers.rows });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async createSupplier(req, res) {
    const { name, contact_name, email, phone, address } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Supplier name is required.' });
    try {
      const info = await db.query('INSERT INTO suppliers (company_id, name, contact_name, email, phone, address) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id', [
        req.user.company_id,
        name,
        contact_name || '',
        email || '',
        phone || '',
        address || ''
      ]);
      res.json({ success: true, supplier_id: info.rows[0].id });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
}

module.exports = new InventoryController();
