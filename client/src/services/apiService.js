class APIService {
  constructor() {
    this.baseUrl = '/api/v1';
  }

  getHeaders() {
    const token = localStorage.getItem('apex_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  async request(endpoint, method = 'GET', body = null) {
    const options = {
      method,
      headers: this.getHeaders()
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${this.baseUrl}${endpoint}`, options);
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        if (!endpoint.includes('/auth/login')) {
          localStorage.clear();
          window.location.reload();
        }
      }
      throw new Error(data.error || 'Request execution failed.');
    }
    return data;
  }

  async downloadReceiptBlob(orderId) {
    const token = localStorage.getItem('apex_token');
    const res = await fetch(`${this.baseUrl}/pos/receipt/${orderId}/pdf`, {
      method: 'GET',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });

    if (!res.ok) {
      throw new Error('Failed to generate PDF receipt.');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_ORD-${orderId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  login(email, password) { return this.request('/auth/login', 'POST', { email, password }); }
  registerCompany(companyName, adminName, email, password) { return this.request('/auth/register', 'POST', { company_name: companyName, admin_name: adminName, email, password }); }
  resetPassword(email, newPassword) { return this.request('/auth/reset-password', 'POST', { email, new_password: newPassword }); }

  getFinanceSummary() { return this.request('/finance/summary'); }
  getExpenses() { return this.request('/finance/expenses'); }
  logExpense(data) { return this.request('/finance/expenses', 'POST', data); }
  logIncome(data) { return this.request('/finance/income', 'POST', data); }
  getInvoices() { return this.request('/finance/invoices'); }
  payInvoice(data) { return this.request('/finance/invoices/pay', 'POST', data); }
  getAccountsPayable() { return this.request('/finance/accounts-payable'); }
  logAccountPayable(data) { return this.request('/finance/accounts-payable', 'POST', data); }
  payAccountPayable(data) { return this.request('/finance/accounts-payable/pay', 'POST', data); }
  getChartOfAccounts() { return this.request('/finance/chart-of-accounts'); }

  getProducts() { return this.request('/inventory/products'); }
  createProduct(data) { return this.request('/inventory/products', 'POST', data); }
  deleteProduct(id) { return this.request(`/inventory/products/${id}`, 'DELETE'); }
  adjustStock(data) { return this.request('/inventory/stock-adjust', 'POST', data); }
  transferStock(data) { return this.request('/inventory/stock-transfer', 'POST', data); }
  getCategories() { return this.request('/inventory/categories'); }
  createCategory(data) { return this.request('/inventory/categories', 'POST', data); }
  getSuppliers() { return this.request('/inventory/suppliers'); }
  createSupplier(data) { return this.request('/inventory/suppliers', 'POST', data); }

  getCustomers() { return this.request('/crm/customers'); }
  createCustomer(data) { return this.request('/crm/customers', 'POST', data); }
  updateCustomer(id, data) { return this.request(`/crm/customers/${id}`, 'PUT', data); }
  deleteCustomer(id) { return this.request(`/crm/customers/${id}`, 'DELETE'); }
  getLeads() { return this.request('/crm/leads'); }
  createLead(data) { return this.request('/crm/leads', 'POST', data); }
  updateLead(id, data) { return this.request(`/crm/leads/${id}`, 'PUT', data); }
  deleteLead(id) { return this.request(`/crm/leads/${id}`, 'DELETE'); }
  updateLeadStage(leadId, stage) { return this.request('/crm/leads/stage', 'PATCH', { lead_id: leadId, stage }); }
  getCustomerNotes(customerId) { return this.request(`/crm/notes/${customerId}`); }
  addCustomerNote(customerId, content) { return this.request('/crm/notes', 'POST', { customer_id: customerId, content }); }

  checkout(items, paymentMethod, discountAmount = 0, customerId = null) {
    return this.request('/pos/checkout', 'POST', { items, payment_method: paymentMethod, discount_amount: discountAmount, customer_id: customerId });
  }
  getPOSOrders() { return this.request('/pos/orders'); }
  processPOSRefund(orderId, amount, reason) { return this.request('/pos/refund', 'POST', { order_id: orderId, amount, reason }); }

  queryAI(prompt) { return this.request('/ai/query', 'POST', { prompt }); }
  getBranches() { return this.request('/company/branches'); }
  getEmployees() { return this.request('/company/employees'); }
  createEmployee(data) { return this.request('/company/employees', 'POST', data); }
  deleteEmployee(id) { return this.request(`/company/employees/${id}`, 'DELETE'); }

  getNotifications() { return this.request('/notifications'); }
  markAllNotificationsRead() { return this.request('/notifications/read-all', 'PATCH'); }

  getAuditLogs() { return this.request('/audit/logs'); }
}

const apiService = new APIService();
