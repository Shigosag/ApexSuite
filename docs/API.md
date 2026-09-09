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

### POST `/auth/change-password`
Updates the password for an authenticated session. Requires `current_password` and `new_password`.

---

## 2. Company & Branch Administration (`/company`)

### GET `/company/branches`
Retrieves all registered branch locations for the workspace.

### POST `/company/branches`
Registers a new branch location (Requires `Admin` role).

### PUT `/company/branches/:branchId`
Updates branch details (Requires `Admin` role).

### DELETE `/company/branches/:branchId`
Deletes a non-HQ branch location (Requires `Admin` role).

### GET `/company/employees`
Retrieves employee directory accounts.

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
Removes a customer profile and associated deal references.

### GET `/crm/notes/:customerId`
Retrieves engagement timeline notes for a customer.

### POST `/crm/notes`
Adds an engagement/communication note for a customer.

### GET `/crm/leads`
Retrieves active deal pipelines scoped to company.

### POST `/crm/leads`
Creates a new deal pipeline lead.

### PUT `/crm/leads/:id`
Updates deal details with strict company ownership check.

### DELETE `/crm/leads/:id`
Deletes a deal pipeline with company ownership check.

### PATCH `/crm/leads/stage`
Updates deal stage status (`New`, `Contacted`, `Proposal`, `Won`, `Lost`).

---

## 4. Inventory & Warehouse Management (`/inventory`)

### GET `/inventory/products`
Fetches catalog items with real-time branch stock quantities and low-stock alerts.

### POST `/inventory/products`
Creates a new inventory product entry (Requires `Admin` or `Manager` role).

### PUT `/inventory/products/:id`
Updates product specifications.

### DELETE `/inventory/products/:id`
Deletes a product entry.

### POST `/inventory/stock-adjust`
Adjusts inventory count (`+` or `-`).

### POST `/inventory/stock-transfer`
Executes an atomic inter-branch stock transfer with row-level locks.

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
Processes an atomic checkout transaction using row-level locking (`SELECT FOR UPDATE`), updates stock, creates payment transactions, and generates invoices.

### GET `/pos/orders`
Retrieves recent sales orders for the current branch.

### POST `/pos/refund`
Executes a refund for a previously completed order, reversing inventory and updating ledger accounts.

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

### POST `/finance/accounts-payable/pay`
Settles a supplier bill, deducting from Cash operating account.

### GET `/finance/chart-of-accounts`
Fetches general chart of account ledgers and balances.

---

## 7. AI Strategy Copilot (`/ai`)

### POST `/ai/query`
Executes analytical queries regarding business metrics, inventory diagnostics, or P&L margin summaries.

---

## 8. File Uploads (`/files`)

### POST `/files/upload`
Uploads binary attachments to disk storage with MIME and extension validation.

---

## 9. Notifications & Audit (`/notifications`, `/audit`)

### GET `/notifications`
Fetches user notifications.

### PATCH `/notifications/read-all`
Marks all user notifications as read.

### GET `/audit/logs`
Fetches security telemetry logs (Requires `Admin` role).
