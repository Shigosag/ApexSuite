const { pool } = require('../database/connection');

class OrderRepository {
  async createPOSOrder(branchId, cashierId, customerId, items, paymentMethod, discountAmount = 0) {
    let subtotal = 0;
    const validatedItems = [];

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const item of items) {
        // Enforce concurrency safety via SELECT ... FOR UPDATE
        const prodRes = await client.query(`
          SELECT p.*, bi.stock_qty 
          FROM products p 
          JOIN branch_inventory bi ON p.id = bi.product_id 
          WHERE p.id = $1 AND bi.branch_id = $2
          FOR UPDATE OF bi
        `, [item.product_id, branchId]);

        const prod = prodRes.rows[0];
        if (!prod || parseInt(prod.stock_qty, 10) < item.quantity) {
          throw new Error(`Insufficient inventory for item: ${prod ? prod.name : 'Unknown Product'}`);
        }

        const unitPrice = parseFloat(prod.selling_price);
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;

        validatedItems.push({
          product_id: prod.id,
          sku: prod.sku,
          name: prod.name,
          quantity: item.quantity,
          unit_price: unitPrice,
          subtotal: lineTotal
        });

        await client.query('UPDATE branch_inventory SET stock_qty = stock_qty - $1 WHERE branch_id = $2 AND product_id = $3', [item.quantity, branchId, prod.id]);
        await client.query("INSERT INTO stock_movements (product_id, branch_id, type, quantity, reason) VALUES ($1, $2, 'OUT', $3, 'POS Terminal Checkout')", [prod.id, branchId, item.quantity]);
      }

      const tax = Math.max(0, subtotal - discountAmount) * 0.07;
      const total = Math.max(0, subtotal - discountAmount + tax);
      const orderNum = `ORD-${Date.now().toString().slice(-6)}`;

      const orderRes = await client.query(`
        INSERT INTO orders (branch_id, customer_id, cashier_id, order_number, total_amount, tax_amount, discount_amount, payment_method)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [branchId, customerId || null, cashierId, orderNum, total, tax, discountAmount, paymentMethod]);

      const orderId = orderRes.rows[0].id;

      for (const vi of validatedItems) {
        await client.query('INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES ($1, $2, $3, $4, $5)', [orderId, vi.product_id, vi.quantity, vi.unit_price, vi.subtotal]);
      }

      await client.query('INSERT INTO payment_transactions (order_id, transaction_reference, amount, payment_method) VALUES ($1, $2, $3, $4)', [orderId, `TXN-${orderNum}`, total, paymentMethod]);

      const invNum = `INV-${new Date().getFullYear()}-${orderId}`;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const invRes = await client.query('INSERT INTO invoices (order_id, customer_id, invoice_number, due_date, amount_due, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id', [
        orderId,
        customerId || null,
        invNum,
        dueDate.toISOString().split('T')[0],
        total,
        paymentMethod === 'Bank Transfer' ? 'Unpaid' : 'Paid'
      ]);

      if (customerId && paymentMethod === 'Bank Transfer') {
        await client.query('INSERT INTO accounts_receivable (customer_id, invoice_id, amount) VALUES ($1, $2, $3)', [customerId, invRes.rows[0].id, total]);
      }

      // Update Cash Asset (1000) and Revenue (4000) ledgers
      const companyRes = await client.query('SELECT company_id FROM branches WHERE id = $1', [branchId]);
      if (companyRes.rows.length > 0 && paymentMethod !== 'Bank Transfer') {
        const companyId = companyRes.rows[0].company_id;
        await client.query("UPDATE chart_of_accounts SET balance = balance + $1 WHERE code = '1000' AND company_id = $2", [total, companyId]);
        await client.query("UPDATE chart_of_accounts SET balance = balance + $1 WHERE code = '4000' AND company_id = $2", [total, companyId]);
      }

      await client.query('COMMIT');

      return { orderId, orderNum, total, tax, items: validatedItems };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = new OrderRepository();
