const db = require('../database/connection');
const logger = require('../config/logger');

function initBackgroundJobs() {
  logger.info('Initializing automated background task scheduler...');

  runLowStockAlertCheck();
  runOverdueInvoiceFlagger();

  setInterval(async () => {
    try {
      await runLowStockAlertCheck();
      await runOverdueInvoiceFlagger();
    } catch (err) {
      logger.error('Background task execution failed:', err.message);
    }
  }, 15 * 60 * 1000);
}

async function runLowStockAlertCheck() {
  try {
    const lowStockItemsRes = await db.query(`
      SELECT bi.branch_id, p.id as product_id, p.name, bi.stock_qty, p.min_stock_alert, b.company_id
      FROM branch_inventory bi
      JOIN products p ON bi.product_id = p.id
      JOIN branches b ON bi.branch_id = b.id
      WHERE bi.stock_qty <= p.min_stock_alert
    `);

    for (const item of lowStockItemsRes.rows) {
      // Find all users belonging to this company
      const usersRes = await db.query('SELECT id FROM users WHERE company_id = $1', [item.company_id]);
      
      for (const user of usersRes.rows) {
        // Prevent duplicate unread notifications for the same product
        const existingNotif = await db.query(`
          SELECT id FROM notifications 
          WHERE user_id = $1 AND title = 'Low Stock Alert' AND message LIKE $2 AND is_read = 0
        `, [user.id, `%${item.name}%`]);

        if (existingNotif.rows.length === 0) {
          await db.query(`
            INSERT INTO notifications (user_id, title, message, type)
            VALUES ($1, 'Low Stock Alert', $2, 'warning')
          `, [user.id, `Stock for "${item.name}" is low (${item.stock_qty} remaining, minimum threshold is ${item.min_stock_alert}).`]);
        }
      }
    }

    if (lowStockItemsRes.rows.length > 0) {
      logger.warn(`Background Job: Created notifications for ${lowStockItemsRes.rows.length} low-stock items.`);
    }
  } catch (err) {
    logger.error('Low stock background check failed:', err.message);
  }
}

async function runOverdueInvoiceFlagger() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const updated = await db.query(`
      UPDATE invoices 
      SET status = 'Overdue' 
      WHERE status = 'Unpaid' AND due_date < $1
    `, [today]);

    if (updated.rowCount > 0) {
      logger.info(`Background Job: Marked ${updated.rowCount} unpaid invoices as Overdue.`);
    }
  } catch (err) {
    logger.error('Overdue invoice flagger job failed:', err.message);
  }
}

module.exports = { initBackgroundJobs };
