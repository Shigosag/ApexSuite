const db = require('../database/connection');

async function processAIQuery(prompt, companyId, branchId) {
  const query = prompt.toLowerCase().trim();
  let text = '';
  let payload = null;

  if (query.includes('restock') || query.includes('low stock') || query.includes('inventory')) {
    const lowStockRes = await db.query(`
      SELECT p.name, p.sku, bi.stock_qty, p.min_stock_alert, p.cost_price, p.selling_price
      FROM branch_inventory bi 
      JOIN products p ON bi.product_id = p.id 
      WHERE p.company_id = $1 AND bi.branch_id = $2 AND bi.stock_qty <= p.min_stock_alert
    `, [companyId, branchId]);

    const lowStock = lowStockRes.rows;

    if (lowStock.length > 0) {
      const recommendations = lowStock.map(item => {
        const reorderQty = Math.max(20, item.min_stock_alert * 3);
        const estCost = (reorderQty * parseFloat(item.cost_price)).toFixed(2);
        return {
          ...item,
          recommended_reorder_qty: reorderQty,
          estimated_reorder_cost: `$${estCost}`
        };
      });

      text = `AI Inventory Diagnostic: Alert! Found ${lowStock.length} items operating below threshold. Recommended purchase orders compiled below:`;
      payload = recommendations;
    } else {
      text = `AI Inventory Diagnostic: All branch warehouses are currently stocked at optimal levels. No critical restock required.`;
      payload = [];
    }

  } else if (query.includes('profit') || query.includes('loss') || query.includes('p&l') || query.includes('margin')) {
    const revRes = await db.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total 
      FROM orders 
      WHERE status = 'Completed' AND branch_id IN (SELECT id FROM branches WHERE company_id = $1)
    `, [companyId]);
    const rev = parseFloat(revRes.rows[0].total || 0);

    const expRes = await db.query(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM expenses 
      WHERE branch_id IN (SELECT id FROM branches WHERE company_id = $1)
    `, [companyId]);
    const exp = parseFloat(expRes.rows[0].total || 0);

    const net = rev - exp;
    const margin = rev > 0 ? ((net / rev) * 100).toFixed(1) : '0';

    text = `P&L Executive Insight:\n• Total Gross Revenue: $${rev.toFixed(2)}\n• Operating Costs: $${exp.toFixed(2)}\n• Net Profit: $${net.toFixed(2)}\n• Profit Margin Ratio: ${margin}%`;
    payload = { gross_revenue: rev, total_expenses: exp, net_profit: net, profit_margin_pct: `${margin}%` };

  } else if (query.includes('expense') || query.includes('spending') || query.includes('cost')) {
    const expTotalRes = await db.query(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM expenses 
      WHERE branch_id IN (SELECT id FROM branches WHERE company_id = $1)
    `, [companyId]);
    const expTotal = parseFloat(expTotalRes.rows[0].total || 0);

    const breakdownRes = await db.query(`
      SELECT category, SUM(amount) as cat_total 
      FROM expenses 
      WHERE branch_id IN (SELECT id FROM branches WHERE company_id = $1)
      GROUP BY category ORDER BY cat_total DESC
    `, [companyId]);

    text = `Operating Expense Audit: Cumulative spending recorded is $${expTotal.toFixed(2)}. Category distribution breakdown below:`;
    payload = breakdownRes.rows;

  } else if (query.includes('revenue') || query.includes('grow') || query.includes('sales')) {
    const totalSalesRes = await db.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as sum 
      FROM orders 
      WHERE status='Completed' AND branch_id IN (SELECT id FROM branches WHERE company_id = $1)
    `, [companyId]);
    
    text = `Revenue Strategy Recommendations:\n1. Cross-Sell at POS: Bundle top-selling accessories with core inventory items.\n2. Conversion Pipeline: Follow up on high-value proposals in CRM.\n3. Price Adjustments: Marginal 3% increase on high-demand inventory could improve gross margins.`;
    payload = {
      sales_volume: parseInt(totalSalesRes.rows[0].count, 10),
      gross_sales: parseFloat(totalSalesRes.rows[0].sum || 0),
      action_items: ['POS Cross-selling', 'High-value CRM deal closing', 'Margin optimization']
    };

  } else {
    const countOrdersRes = await db.query(`
      SELECT COUNT(*) as count FROM orders 
      WHERE branch_id IN (SELECT id FROM branches WHERE company_id = $1)
    `, [companyId]);

    const countCustRes = await db.query(`
      SELECT COUNT(*) as count FROM customers 
      WHERE company_id = $1
    `, [companyId]);

    const countOrders = parseInt(countOrdersRes.rows[0].count, 10);
    const countCust = parseInt(countCustRes.rows[0].count, 10);

    text = `ApexSuite Strategy Assistant Online: Active monitoring enabled across ${countCust} client profiles and ${countOrders} completed sales orders. Ask me about P&L metrics, stock alerts, or expense breakdowns.`;
    payload = { total_clients: countCust, total_orders: countOrders };
  }

  return { prompt, response: text, data: payload, timestamp: new Date().toISOString() };
}

module.exports = { processAIQuery };
