# ApexSuite System Architecture & Design Specification

## 1. System Overview
ApexSuite is an enterprise multi-tenant Business Management System combining Enterprise Resource Planning (ERP), Customer Relationship Management (CRM), Point-of-Sale (POS), and Financial Accounting.

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
* **Backend Runtime**: Node.js v22 LTS with relational PostgreSQL persistence
* **API Engine**: Express.js, Helmet, CORS, Express-Rate-Limit, Morgan
* **Persistence Layer**: Relational PostgreSQL Database with Connection Pooling (`pg.Pool`)
* **Document Engine**: PDFKit for server-side invoice rendering
* **Client Architecture**: Vanilla ES6 Modular Single Page Application
* **Styling & UI**: Tailwind CSS (Dark/Light glassmorphism themes), Lucide Icons

---

## 3. Database Layer & Concurrency Hardening

1. **Row-Level Concurrency Locking**:
   * Critical stock-decrementing checkout transactions utilize `SELECT ... FOR UPDATE` locks on `branch_inventory` records. This prevents race conditions and overselling under concurrent load.
2. **Double-Entry Balance Updates**:
   * Payments, income entries, expense entries, and refunds operate inside atomic transactions (`BEGIN ... COMMIT`) that simultaneously update cash and revenue ledgers in `chart_of_accounts`.
3. **Foreign Key Cascade and Tenant Scoping**:
   * Data tables enforce company and branch relationships to guarantee data isolation across workspaces.

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
   * Server-side guards inspect token claims and database entity status on every privileged route.
4. **Non-Blocking Audit Telemetry**:
   * Asynchronously captures request metadata, authenticated actor ID, and remote IP upon completion.
