# ApexSuite Enterprise API Specification

**Base URL**: `/api/v1`  
**Protocol**: HTTP/HTTPS  
**Data Format**: JSON (`Content-Type: application/json`)

---

## Authentication Header
All protected endpoints require a Bearer Token in the HTTP Authorization header:
```http
Authorization: Bearer <your_jwt_access_token>
```

---

## 1. Authentication Endpoints (`/auth`)

### POST `/auth/login`
Authenticates user credentials and issues JWT access and refresh tokens.

* **Request Body**:
```json
{
  "email": "admin@apex.com",
  "password": "admin123"
}
```

* **Response (200 OK)**:
```json
{
  "success": true,
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi...",
  "user": {
    "id": 1,
    "name": "Segun Arulogun Gabriel",
    "email": "admin@apex.com",
    "role": "Admin",
    "company": "ApexSuite Inc.",
    "branch_id": 1
  }
}
```

### POST `/auth/register`
Registers a new enterprise company workspace and admin user.

### POST `/auth/reset-password`
Resets the account password.

---

## 2. Company & Branch Administration (`/company`)

### GET `/company/branches`
Retrieves all registered branch locations for the workspace.

### POST `/company/branches`
Registers a new branch location (Requires `Admin` role).

### GET `/company/employees`
Retrieves all employee directory accounts.

### POST `/company/employees`
Creates a new employee account (Requires `Admin` role).

### DELETE `/company/employees/:employeeId`
Deletes an employee account (Requires `Admin` role).

### DELETE `/company/account`
Permanently destroys company workspace and associated data (Requires `Admin` role).

---

## 3. CRM & Client Management (`/crm`)

### GET `/crm/customers`
Fetches all customer profiles with order counts and lifetime expenditure totals.

### POST `/crm/customers`
Creates a new client account profile.

### PUT `/crm/customers/:id`
Updates customer details.

### DELETE `/crm/customers/:id`
Removes a customer profile.

### GET `/crm/notes/:customerId`
Retrieves engagement timeline notes for a customer.

### POST `/crm/notes`
Adds an engagement/communication note for a customer.

* **Request Body**:
```json
{
  "customer_id": 1,
  "content": "Discussed Q4 SLA renewal with procurement team."
}
```

### GET `/crm/leads`
Retrieves active deal pipelines.

### POST `/crm/leads`
Creates a new deal pipeline lead.

### PATCH `/crm/leads/stage`
Updates deal stage status (`New`, `Contacted`, `Proposal`, `Won`, `Lost`).

---

## 4. Inventory & Warehouse Management (`/inventory`)

### GET `/inventory/products`
Fetches catalog items with real-time branch stock quantities and low-stock alerts.

### POST `/inventory/products`
Creates a new inventory product entry (Requires `Admin` or `Manager` role).

### DELETE `/inventory/products/:id`
Deletes a product entry.

### POST `/inventory/stock-adjust`
Adjusts inventory count (`+` or `-`).

### POST `/inventory/stock-transfer`
Executes an inter-branch stock transfer.

### GET `/inventory/categories`
Retrieves product categories.

### POST `/inventory/categories`
Creates a new product category.

### GET `/inventory/suppliers`
Retrieves approved supplier directory.

### POST `/inventory/suppliers`
Registers a new inventory supplier.

---

## 5. POS Register & Sales (`/pos`)

### POST `/pos/checkout`
Processes an atomic checkout transaction, updates stock, creates payment transactions, and generates invoices.

### GET `/pos/orders`
Retrieves recent sales orders for the current branch.

### POST `/pos/refund`
Executes a refund for a previously completed order.

* **Request Body**:
```json
{
  "order_id": 1,
  "amount": 129.99,
  "reason": "Customer returned damaged item"
}
```

### GET `/pos/receipt/:orderId/pdf`
Generates and downloads a formatted PDF receipt statement.

---

## 6. Finance & Ledger (`/finance`)

### GET `/finance/summary`
Returns Profit & Loss financial summary metrics (Gross Revenue, Expenses, Net Profit, Accounts Receivable, Accounts Payable).

### GET `/finance/expenses`
Retrieves logged operating expenses.

### POST `/finance/expenses`
Logs an operating expense (Requires `Admin` or `Manager` role).

### POST `/finance/income`
Logs direct sales revenue or service income.

### GET `/finance/invoices`
Retrieves customer invoices.

### POST `/finance/invoices/pay`
Settles an outstanding invoice balance.

### GET `/finance/accounts-payable`
Retrieves unpaid supplier bills.

### POST `/finance/accounts-payable`
Records a supplier bill in Accounts Payable.

* **Request Body**:
```json
{
  "supplier_id": 1,
  "amount": 1500.00,
  "due_date": "2026-09-01"
}
```

### GET `/finance/chart-of-accounts`
Fetches general chart of account ledgers and balances.

---

## 7. AI Strategy Copilot (`/ai`)

### POST `/ai/query`
Executes analytical queries regarding business metrics, inventory diagnostics, or P&L margin summaries.

---

## 8. File Uploads (`/files`)

### POST `/files/upload`
Uploads binary attachments to object/disk storage.

---

## 9. Notifications & Audit (`/notifications`, `/audit`)

### GET `/notifications`
Fetches user notifications.

### PATCH `/notifications/read-all`
Marks all user notifications as read.

### GET `/audit/logs`
Fetches security telemetry logs (Requires `Admin` role).