const orderRepository = require('../repositories/orderRepository');
const db = require('../database/connection');
const pdfService = require('../services/pdfService');

class POSController {
  async checkout(req, res) {
    try {
      const { customer_id, payment_method, items, discount_amount } = req.body;
      if (!items || items.length === 0) {
        return res.status(400).json({ success: false, error: 'POS checkout basket cannot be empty.' });
      }
      const result = await orderRepository.createPOSOrder(req.user.branch_id, req.user.id, customer_id, items, payment_method || 'Cash', discount_amount || 0);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async getOrders(req, res) {
    try {
      const orders = await db.query(`
        SELECT o.*,
          CASE
            WHEN o.order_number LIKE 'INC-%' THEN 'Direct Capital / Income Entry'
            ELSE COALESCE(c.name, 'Walk-in Customer')
          END as customer_name,
          u.name as cashier_name
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN users u ON o.cashier_id = u.id
        WHERE o.branch_id = $1
        ORDER BY o.created_at DESC
        LIMIT 50
      `, [req.user.branch_id]);
      res.json({ success: true, data: orders.rows });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async processRefund(req, res) {
    const { order_id, amount, reason } = req.body;
    if (!order_id || !amount || !reason) {
      return res.status(400).json({ success: false, error: 'Order ID, refund amount, and reason are required.' });
    }

    try {
      const orderRes = await db.query('SELECT * FROM orders WHERE id = $1', [order_id]);
      if (orderRes.rows.length === 0) return res.status(404).json({ success: false, error: 'Order record not found.' });

      await db.query('INSERT INTO refunds (order_id, amount, reason) VALUES ($1, $2, $3)', [order_id, amount, reason]);
      await db.query("UPDATE orders SET status = 'Refunded' WHERE id = $1", [order_id]);
      await db.query("UPDATE invoices SET status = 'Overdue' WHERE order_id = $1", [order_id]);

      res.json({ success: true, message: 'Order refund executed successfully.' });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async downloadReceiptPDF(req, res) {
    try {
      const orderRes = await db.query('SELECT * FROM orders WHERE id = $1', [req.params.orderId]);
      if (orderRes.rows.length === 0) return res.status(404).json({ success: false, error: 'Order record not found.' });

      const order = orderRes.rows[0];
      const itemsRes = await db.query('SELECT oi.*, p.name, p.sku FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1', [req.params.orderId]);
      const invoiceRes = await db.query('SELECT * FROM invoices WHERE order_id = $1', [req.params.orderId]);
      const invoice = invoiceRes.rows[0] || { invoice_number: `INV-${order.id}`, status: 'Paid', amount_due: order.total_amount };

      pdfService.generateInvoicePDF({ ...order, items: itemsRes.rows }, invoice, res);
    } catch (err) {
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: err.message });
      }
    }
  }
}

module.exports = new POSController();
