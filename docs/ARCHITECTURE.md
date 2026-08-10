# ApexSuite System Architecture & Design Specification

## 1. System Overview
ApexSuite is an enterprise-grade, multi-tenant AI-powered Business Management System combining Enterprise Resource Planning (ERP), Customer Relationship Management (CRM), Point-of-Sale (POS), and Financial Accounting.

---

## 2. Technology Stack & Decoupled Architecture

```
+-------------------------------------------------------------------------+
|                          BROWSER CLIENT SPA                             |
|      HTML5 | Vanilla ES6 Modular Scripts | Tailwind CSS | Chart.js      |
+-------------------------------------------------------------------------+
                                   │
                           HTTP / REST API + JWT
                                   │
+-------------------------------------------------------------------------+
|                           EXPRESS API ROUTER                            |
|             Helmet Security | CORS | Express Rate Limiters              |
+-------------------------------------------------------------------------+
                                   │
+-------------------------------------------------------------------------+
|                      MIDDLEWARE & SECURITY LAYER                        |
|        JWT Authentication | RBAC Guard | Asynchronous Audit Logger      |
+-------------------------------------------------------------------------+
                                   │
+-------------------------------------------------------------------------+
|                      BUSINESS SERVICES & CONTROLLERS                    |
|      Auth Service | AI Strategy Engine | Order Repo | PDF Engine        |
+-------------------------------------------------------------------------+
                                   │
+-------------------------------------------------------------------------+
|                      RELATIONAL POSTGRESQL DATABASE                     |
|         Connection Pooling | SSL Encryption | 18 Performance Indexes     |
+-------------------------------------------------------------------------+
```

### Core Technologies
* **Backend Runtime**: Node.js v22 LTS (PostgreSQL Persistence via `pg`)
* **API Engine**: Express.js, Helmet, CORS, Express-Rate-Limit, Morgan
* **Persistence Layer**: Cloud Serverless Relational PostgreSQL Database Engine
* **Document Engine**: PDFKit for server-side invoice generation
* **Client Architecture**: Vanilla ES6 Modular SPA (Single Page Application)
* **Styling & UI**: Tailwind CSS (Dark/Light glassmorphism themes), Lucide Icons

---

## 3. Database Layer & Indexing Strategy

PostgreSQL is configured for high-concurrency connection pooling via `pg.Pool` with active SSL encryption:

```javascript
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
```

### Performance Indexes
Explicit indexes optimize search paths and prevent full table scans across core entities:
* `idx_users_email` & `idx_users_company`
* `idx_products_company` & `idx_products_sku`
* `idx_branch_inventory_product` (Composite index on product_id + branch_id)
* `idx_customers_company`
* `idx_orders_branch` & `idx_orders_customer`
* `idx_order_items_order`
* `idx_invoices_order`
* `idx_expenses_branch`
* `idx_audit_logs_user`
* `idx_notifications_user`

---

## 4. Security Hardening Architecture

1. **Token Authentication Lifecycle**:
   * Access Tokens (8-hour expiration) signed via `JWT_SECRET`.
   * Refresh Tokens (7-day expiration) stored securely in user tables.
2. **Rate Limiting Protection**:
   * Auth Rate Limiter: Maximum 20 requests per 15 minutes per IP on `/auth/*` routes.
   * API Rate Limiter: Maximum 300 requests per minute per IP globally.
3. **Role-Based Access Control (RBAC)**:
   * Roles: `Admin`, `Manager`, `Employee`.
   * Guard middleware restricts administrative actions (e.g., deleting branches, creating user accounts, viewing audit logs) to authorized roles.
4. **Non-Blocking Audit Telemetry**:
   * Audit middleware captures method, URL, route parameters, User ID, and client IP address asynchronously upon request completion.

---

## 5. Deployment & Containerization Strategy

### Docker Multi-Stage Build (`Dockerfile`)
* **Builder Stage**: Compiles and resolves node dependencies on Node 22 Alpine Linux.
* **Runner Stage**: Minimal Alpine runtime executing under a non-root `node` user with built-in HTTP healthchecks.

### Docker Compose (`docker-compose.yml`)
* Mounts persistent named volumes for file uploads (`apex_uploads`).
* Applies restart policies (`restart: unless-stopped`) and environment variable injections.