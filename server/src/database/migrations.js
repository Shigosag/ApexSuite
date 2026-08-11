const db = require('./connection');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');

async function runMigrations() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS companies (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      tax_id VARCHAR(100),
      currency VARCHAR(10) DEFAULT 'USD',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS branches (
      id SERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      location TEXT,
      branch_type VARCHAR(100) DEFAULT 'Regional Branch',
      is_headquarters INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS departments (
      id SERIAL PRIMARY KEY,
      branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(50) CHECK(role IN ('Admin', 'Manager', 'Employee')) DEFAULT 'Employee',
      department VARCHAR(255),
      refresh_tokens TEXT,
      password_reset_tokens TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS login_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      ip_address VARCHAR(100),
      user_agent TEXT,
      timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      action VARCHAR(255) NOT NULL,
      details TEXT,
      ip_address VARCHAR(100),
      timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id SERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      contact_name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(100),
      address TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
      sku VARCHAR(100) UNIQUE NOT NULL,
      barcode VARCHAR(100) UNIQUE,
      name VARCHAR(255) NOT NULL,
      unit VARCHAR(50) DEFAULT 'Pcs',
      weight NUMERIC(10, 2) DEFAULT 0.0,
      description TEXT,
      variant_name VARCHAR(255) DEFAULT 'Standard',
      cost_price NUMERIC(12, 2) NOT NULL,
      selling_price NUMERIC(12, 2) NOT NULL,
      min_stock_alert INTEGER DEFAULT 10,
      expiry_date DATE,
      image_url TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS branch_inventory (
      id SERIAL PRIMARY KEY,
      branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      stock_qty INTEGER NOT NULL DEFAULT 0,
      UNIQUE(branch_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
      type VARCHAR(50) CHECK(type IN ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT')) NOT NULL,
      quantity INTEGER NOT NULL,
      reason TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock_transfers (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      from_branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
      to_branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL,
      status VARCHAR(50) CHECK(status IN ('Pending', 'Completed', 'Cancelled')) DEFAULT 'Completed',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS purchase_orders (
      id SERIAL PRIMARY KEY,
      supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
      branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
      total_cost NUMERIC(12, 2) NOT NULL,
      status VARCHAR(50) CHECK(status IN ('Ordered', 'Received', 'Cancelled')) DEFAULT 'Ordered',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(100),
      company_name VARCHAR(255),
      segment VARCHAR(100) DEFAULT 'General',
      tags TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      value NUMERIC(12, 2) DEFAULT 0.0,
      stage VARCHAR(50) CHECK(stage IN ('New', 'Contacted', 'Proposal', 'Won', 'Lost')) DEFAULT 'New',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS crm_notes (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
      author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS follow_ups (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      due_date DATE NOT NULL,
      completed INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      cashier_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      order_number VARCHAR(100) UNIQUE NOT NULL,
      total_amount NUMERIC(12, 2) NOT NULL,
      tax_amount NUMERIC(12, 2) NOT NULL,
      discount_amount NUMERIC(12, 2) DEFAULT 0.0,
      payment_method VARCHAR(50) CHECK(payment_method IN ('Cash', 'Card', 'Bank Transfer')) NOT NULL,
      status VARCHAR(50) CHECK(status IN ('Completed', 'Refunded', 'Returned', 'Pending')) DEFAULT 'Completed',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL,
      unit_price NUMERIC(12, 2) NOT NULL,
      subtotal NUMERIC(12, 2) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payment_transactions (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      transaction_reference VARCHAR(100) UNIQUE NOT NULL,
      amount NUMERIC(12, 2) NOT NULL,
      payment_method VARCHAR(100) NOT NULL,
      timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS refunds (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      amount NUMERIC(12, 2) NOT NULL,
      reason TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      invoice_number VARCHAR(100) UNIQUE NOT NULL,
      due_date DATE NOT NULL,
      amount_due NUMERIC(12, 2) NOT NULL,
      status VARCHAR(50) CHECK(status IN ('Paid', 'Unpaid', 'Overdue')) DEFAULT 'Unpaid',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
      category VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      amount NUMERIC(12, 2) NOT NULL,
      expense_date DATE DEFAULT CURRENT_DATE
    );

    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
      amount NUMERIC(12, 2) NOT NULL,
      payment_method VARCHAR(100) NOT NULL,
      payment_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS accounts_receivable (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
      invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
      amount NUMERIC(12, 2) NOT NULL,
      status VARCHAR(50) DEFAULT 'Outstanding'
    );

    CREATE TABLE IF NOT EXISTS accounts_payable (
      id SERIAL PRIMARY KEY,
      supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
      amount NUMERIC(12, 2) NOT NULL,
      due_date DATE NOT NULL,
      status VARCHAR(50) DEFAULT 'Unpaid'
    );

    CREATE TABLE IF NOT EXISTS chart_of_accounts (
      id SERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      code VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) CHECK(type IN ('Asset', 'Liability', 'Equity', 'Revenue', 'Expense')) NOT NULL,
      balance NUMERIC(12, 2) DEFAULT 0.0,
      UNIQUE(company_id, code)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS files (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      size_bytes BIGINT NOT NULL,
      uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- Ensure missing columns exist on existing database instances
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS tags TEXT;
    ALTER TABLE branches ADD COLUMN IF NOT EXISTS branch_type VARCHAR(100) DEFAULT 'Regional Branch';

    -- Fix FK RESTRICT constraint on order_items for existing PostgreSQL databases
    ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
    ALTER TABLE order_items ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
    CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_branch_inventory_product ON branch_inventory(product_id, branch_id);
    CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_id);
    CREATE INDEX IF NOT EXISTS idx_orders_branch ON orders(branch_id);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_order ON invoices(order_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_branch ON expenses(branch_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
  `);

  await seedDataIfEmpty();
}

async function seedDataIfEmpty() {
  const compCountRes = await db.query('SELECT COUNT(*) as count FROM companies');
  if (parseInt(compCountRes.rows[0].count, 10) === 0) {
    logger.info('Seeding initial workspace data into Neon PostgreSQL...');

    const cRes = await db.query("INSERT INTO companies (name, tax_id, currency) VALUES ($1, $2, $3) RETURNING id", ['ApexSuite Inc.', 'TAX-998877', 'USD']);
    const cId = cRes.rows[0].id;

    const b1Res = await db.query("INSERT INTO branches (company_id, name, location, branch_type, is_headquarters) VALUES ($1, $2, $3, $4, 1) RETURNING id", [cId, 'Main HQ Branch', 'Austin, TX', 'Headquarters (HQ)']);
    const b1 = b1Res.rows[0].id;

    const b2Res = await db.query("INSERT INTO branches (company_id, name, location, branch_type, is_headquarters) VALUES ($1, $2, $3, $4, 0) RETURNING id", [cId, 'North Store Branch', 'Seattle, WA', 'Regional Branch']);
    const b2 = b2Res.rows[0].id;

    await db.query('INSERT INTO departments (branch_id, name) VALUES ($1, $2)', [b1, 'Executive Management']);
    await db.query('INSERT INTO departments (branch_id, name) VALUES ($1, $2)', [b1, 'Sales & Operations']);

    const passHash = bcrypt.hashSync('admin123', 10);
    const uRes = await db.query('INSERT INTO users (company_id, branch_id, name, email, password_hash, role, department) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id', [cId, b1, 'Segun Arulogun Gabriel', 'admin@apex.com', passHash, 'Admin', 'Executive Management']);
    const uId = uRes.rows[0].id;

    const catRes = await db.query('INSERT INTO categories (company_id, name) VALUES ($1, $2) RETURNING id', [cId, 'Electronics']);
    const catId = catRes.rows[0].id;

    const supRes = await db.query('INSERT INTO suppliers (company_id, name, contact_name, email) VALUES ($1, $2, $3, $4) RETURNING id', [cId, 'MicroTech Supplies', 'Sarah Jenkins', 'sarah@microtech.io']);
    const supId = supRes.rows[0].id;

    const p1Res = await db.query('INSERT INTO products (company_id, category_id, supplier_id, sku, barcode, name, unit, weight, description, variant_name, cost_price, selling_price, min_stock_alert) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id', [cId, catId, supId, 'PROD-001', '890123456701', 'UltraBook Pro 15"', 'Unit', 1.8, 'High performance business laptop', '16GB RAM / 512GB SSD', 850.00, 1299.99, 5]);
    const p1 = p1Res.rows[0].id;

    const p2Res = await db.query('INSERT INTO products (company_id, category_id, supplier_id, sku, barcode, name, unit, weight, description, variant_name, cost_price, selling_price, min_stock_alert) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id', [cId, catId, supId, 'PROD-002', '890123456702', 'RGB Mechanical Keyboard', 'Unit', 0.9, 'Tactile mechanical switches', 'Tactile Brown Switches', 40.00, 89.99, 10]);
    const p2 = p2Res.rows[0].id;

    await db.query('INSERT INTO branch_inventory (branch_id, product_id, stock_qty) VALUES ($1, $2, $3)', [b1, p1, 15]);
    await db.query('INSERT INTO branch_inventory (branch_id, product_id, stock_qty) VALUES ($1, $2, $3)', [b1, p2, 4]);
    await db.query('INSERT INTO branch_inventory (branch_id, product_id, stock_qty) VALUES ($1, $2, $3)', [b2, p1, 8]);

    const custRes = await db.query('INSERT INTO customers (company_id, name, email, phone, company_name, segment) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id', [cId, 'Acme Enterprise', 'procurement@acme.com', '+1-800-555-0199', 'Acme Corp', 'VIP Enterprise']);
    const custId = custRes.rows[0].id;

    await db.query('INSERT INTO leads (customer_id, title, value, stage) VALUES ($1, $2, $3, $4)', [custId, 'Q4 Hardware Refresh Deal', 15000.00, 'Proposal']);

    await db.query("INSERT INTO chart_of_accounts (company_id, code, name, type, balance) VALUES ($1, '1000', 'Cash Operating Account', 'Asset', 50000.00)", [cId]);
    await db.query("INSERT INTO chart_of_accounts (company_id, code, name, type, balance) VALUES ($1, '4000', 'Merchandise Sales Revenue', 'Revenue', 0.00)", [cId]);

    await db.query('INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)', [uId, 'Low Stock Alert', 'RGB Mechanical Keyboard stock dropped below threshold (4 units left).', 'warning']);
  }
}

module.exports = { runMigrations };
