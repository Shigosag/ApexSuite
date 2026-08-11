async function renderFinancePage() {
  const [summaryRes, expRes, coaRes, invRes, apRes] = await Promise.all([
    apiService.getFinanceSummary().catch(() => ({ data: { revenue: 0, expenses: 0, net_profit: 0, accounts_receivable: 0, accounts_payable: 0 } })),
    apiService.getExpenses().catch(() => ({ data: [] })),
    apiService.getChartOfAccounts().catch(() => ({ data: [] })),
    apiService.getInvoices().catch(() => ({ data: [] })),
    apiService.getAccountsPayable().catch(() => ({ data: [] }))
  ]);

  const summary = summaryRes.data || { revenue: 0, expenses: 0, net_profit: 0, accounts_receivable: 0, accounts_payable: 0 };
  const coa = coaRes.data || [];
  const invoices = invRes.data || [];
  const accountsPayable = apRes.data || [];

  const netProfitVal = summary.net_profit || 0;
  let netProfitColorClass = 'text-slate-300';
  if (netProfitVal > 0) netProfitColorClass = 'text-emerald-400';
  else if (netProfitVal < 0) netProfitColorClass = 'text-red-400';

  const formattedNetProfit = netProfitVal < 0 
    ? `-${formatCurrency(Math.abs(netProfitVal))}` 
    : formatCurrency(netProfitVal);

  window.openLogIncomeModal = () => {
    openModal('Record Sales Income', `
      <form onsubmit="handleLogIncome(event)" class="space-y-3">
        <input type="text" id="iDesc" placeholder="Income Description *" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
        <input type="number" step="0.01" id="iAmount" placeholder="Amount *" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
        <button type="submit" class="w-full pink-btn py-2.5 rounded-xl font-bold text-xs mt-2">Log Sales Income</button>
      </form>
    `);
  };

  window.handleLogIncome = async (e) => {
    e.preventDefault();
    try {
      await apiService.logIncome({
        description: document.getElementById('iDesc').value,
        amount: parseFloat(document.getElementById('iAmount').value)
      });
      closeModal();
      showToast('Sales Income logged successfully!', 'success');
      navigate('finance');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  window.openLogExpenseModal = () => {
    openModal('Record Company Expense', `
      <form onsubmit="handleLogExpense(event)" class="space-y-3">
        <select id="eCat" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
          <option value="Utilities & Rent">Utilities & Rent</option>
          <option value="Inventory Logistics">Inventory Logistics</option>
          <option value="Payroll">Payroll</option>
          <option value="Software & Tech">Software & Tech</option>
        </select>
        <input type="text" id="eDesc" placeholder="Expense Description *" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
        <input type="number" step="0.01" id="eAmount" placeholder="Amount *" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
        <button type="submit" class="w-full pink-btn py-2.5 rounded-xl font-bold text-xs mt-2">Log Expense</button>
      </form>
    `);
  };

  window.handleLogExpense = async (e) => {
    e.preventDefault();
    try {
      await apiService.logExpense({
        category: document.getElementById('eCat').value,
        description: document.getElementById('eDesc').value,
        amount: parseFloat(document.getElementById('eAmount').value)
      });
      closeModal();
      showToast('Operating expense logged!', 'success');
      navigate('finance');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  window.openLogPayableModal = async () => {
    const supRes = await apiService.getSuppliers().catch(() => ({ data: [] }));
    const suppliers = supRes.data || [];

    openModal('Record Supplier Account Payable', `
      <form onsubmit="handleLogPayableSubmit(event)" class="space-y-3">
        <div>
          <label class="text-[10px] text-gray-400">Select Supplier *</label>
          <select id="apSupplier" required class="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
            ${suppliers.length === 0 ? '<option value="">No suppliers found</option>' : suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="text-[10px] text-gray-400">Bill Amount *</label>
          <input type="number" step="0.01" id="apAmount" placeholder="e.g. 1200.00 *" required class="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-mono">
        </div>
        <div>
          <label class="text-[10px] text-gray-400">Due Date *</label>
          <input type="date" id="apDueDate" required class="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
        </div>
        <button type="submit" class="w-full pink-btn py-2.5 rounded-xl font-bold text-xs mt-2">Record Supplier Bill</button>
      </form>
    `);
  };

  window.handleLogPayableSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiService.logAccountPayable({
        supplier_id: parseInt(document.getElementById('apSupplier').value, 10),
        amount: parseFloat(document.getElementById('apAmount').value),
        due_date: document.getElementById('apDueDate').value
      });
      closeModal();
      showToast('Supplier bill recorded in Accounts Payable.', 'success');
      navigate('finance');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  window.openPayPayableModal = (ap) => {
    openModal(`Settle Supplier Bill: ${ap.supplier_name || 'Vendor'}`, `
      <form onsubmit="handlePayPayableSubmit(event, ${ap.id}, ${ap.amount})" class="space-y-3">
        <div>
          <label class="text-[10px] text-gray-400">Supplier Name</label>
          <p class="font-bold text-xs text-white mt-0.5">${ap.supplier_name || 'Direct Vendor'}</p>
        </div>
        <div>
          <label class="text-[10px] text-gray-400">Outstanding Bill Amount</label>
          <p class="font-mono font-bold text-red-400 text-sm">${formatCurrency(ap.amount)}</p>
        </div>
        <button type="submit" class="w-full pink-btn py-2.5 rounded-xl font-bold text-xs mt-2">Confirm Payment & Deduct Cash</button>
      </form>
    `);
  };

  window.handlePayPayableSubmit = async (e, payableId, amount) => {
    e.preventDefault();
    try {
      await apiService.payAccountPayable({ payable_id: payableId, amount });
      closeModal();
      showToast('Supplier bill paid and deducted from Cash account.', 'success');
      navigate('finance');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  window.openPayInvoiceModal = (inv) => {
    openModal(`Settle Invoice ${inv.invoice_number}`, `
      <form onsubmit="handlePayInvoice(event, ${inv.id})" class="space-y-3">
        <div>
          <label class="text-[10px] text-gray-400">Customer Account</label>
          <p class="font-bold text-xs text-white mt-0.5">${inv.customer_name || 'Direct Customer'}</p>
        </div>
        <div>
          <label class="text-[10px] text-gray-400">Outstanding Balance</label>
          <p class="font-mono font-bold text-amber-400 text-sm">${formatCurrency(inv.amount_due)}</p>
        </div>
        <div>
          <label class="text-[10px] text-gray-400">Payment Amount *</label>
          <input type="number" step="0.01" id="payAmount" value="${inv.amount_due}" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs font-mono">
        </div>
        <div>
          <label class="text-[10px] text-gray-400">Payment Method</label>
          <select id="payMethod" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs">
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
          </select>
        </div>
        <button type="submit" class="w-full pink-btn py-2.5 rounded-xl font-bold text-xs mt-2">Process Payment Settlement</button>
      </form>
    `);
  };

  window.handlePayInvoice = async (e, invoiceId) => {
    e.preventDefault();
    try {
      await apiService.payInvoice({
        invoice_id: invoiceId,
        amount: parseFloat(document.getElementById('payAmount').value),
        payment_method: document.getElementById('payMethod').value
      });
      closeModal();
      showToast('Invoice settled successfully!', 'success');
      navigate('finance');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-xl font-bold">Finance & General Ledger</h2>
          <p class="text-xs text-gray-400">Financial statements, Chart of Accounts, Invoices, and Accounts Payable</p>
        </div>
        <div class="flex gap-2">
          <button onclick="openLogIncomeModal()" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all">
            <i data-lucide="trending-up" class="w-4 h-4"></i> Record Income
          </button>
          <button onclick="openLogExpenseModal()" class="pink-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
            <i data-lucide="plus-circle" class="w-4 h-4 text-white"></i> Record Expense
          </button>
          <button onclick="openLogPayableModal()" class="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
            <i data-lucide="file-text" class="w-4 h-4 text-amber-400"></i> Record Payable
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 class="font-bold text-xs border-b border-slate-800 pb-2">P&L Profitability Statement</h3>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between py-1 border-b border-slate-800/50"><span>Gross Revenue</span><span class="font-mono text-emerald-400 font-bold">${formatCurrency(summary.revenue)}</span></div>
            <div class="flex justify-between py-1 border-b border-slate-800/50"><span>Operating Expenses</span><span class="font-mono text-red-400 font-bold">-${formatCurrency(summary.expenses)}</span></div>
            <div class="flex justify-between py-1 border-b border-slate-800/50"><span>Accounts Receivable</span><span class="font-mono text-amber-400 font-bold">${formatCurrency(summary.accounts_receivable)}</span></div>
            <div class="flex justify-between py-1 border-b border-slate-800/50"><span>Accounts Payable</span><span class="font-mono text-red-300 font-bold">${formatCurrency(summary.accounts_payable || 0)}</span></div>
            <div class="flex justify-between py-2 font-bold text-sm pt-2"><span>Net Profit</span><span class="font-mono ${netProfitColorClass}">${formattedNetProfit}</span></div>
          </div>
        </div>

        <div class="lg:col-span-2 glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div class="p-4 border-b border-slate-800 font-bold text-xs">General Chart of Accounts</div>
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-800/60 uppercase text-gray-400">
              <tr><th class="p-4">Account Code</th><th class="p-4">Account Name</th><th class="p-4">Type</th><th class="p-4 font-mono">Current Balance</th></tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              ${coa.map(a => `
                <tr>
                  <td class="p-4 font-mono font-bold">${a.code}</td>
                  <td class="p-4 font-medium">${a.name}</td>
                  <td class="p-4"><span class="px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700">${a.type}</span></td>
                  <td class="p-4 font-mono font-bold">${formatCurrency(a.balance)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Invoices Ledger -->
        <div class="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div class="p-4 border-b border-slate-800 font-bold text-xs">Accounts Receivable & Invoices</div>
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-800/60 uppercase text-gray-400">
              <tr><th class="p-4">Invoice #</th><th class="p-4 font-mono">Amount Due</th><th class="p-4">Status</th><th class="p-4 text-right">Action</th></tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              ${invoices.length === 0 ? '<tr><td colspan="4" class="p-4 text-center text-gray-500">No invoice records found.</td></tr>' : invoices.map(inv => `
                <tr>
                  <td class="p-4 font-mono font-bold">${inv.invoice_number}</td>
                  <td class="p-4 font-mono font-bold pink-brand-text">${formatCurrency(inv.amount_due)}</td>
                  <td class="p-4">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${inv.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400' : inv.status === 'Overdue' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}">
                      ${inv.status}
                    </span>
                  </td>
                  <td class="p-4 text-right">
                    ${inv.status !== 'Paid' ? `
                      <button onclick='openPayInvoiceModal(${JSON.stringify(inv).replace(/'/g, "&#39;")})' class="px-2 py-1 rounded-lg bg-emerald-950 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900 text-[11px] font-semibold">
                        Settle
                      </button>
                    ` : '<span class="text-[10px] text-gray-500 font-mono">Settled</span>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Accounts Payable Ledger -->
        <div class="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div class="p-4 border-b border-slate-800 font-bold text-xs">Accounts Payable (Supplier Bills)</div>
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-800/60 uppercase text-gray-400">
              <tr><th class="p-4">Supplier</th><th class="p-4 font-mono">Amount</th><th class="p-4">Due Date</th><th class="p-4">Status</th><th class="p-4 text-right">Action</th></tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              ${accountsPayable.length === 0 ? '<tr><td colspan="5" class="p-4 text-center text-gray-500">No unpaid supplier bills.</td></tr>' : accountsPayable.map(ap => `
                <tr>
                  <td class="p-4 font-bold text-slate-200">${ap.supplier_name || 'Direct Vendor'}</td>
                  <td class="p-4 font-mono font-bold text-red-400">${formatCurrency(ap.amount)}</td>
                  <td class="p-4 font-mono text-gray-400">${ap.due_date}</td>
                  <td class="p-4"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${ap.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}">${ap.status}</span></td>
                  <td class="p-4 text-right">
                    ${ap.status !== 'Paid' ? `
                      <button onclick='openPayPayableModal(${JSON.stringify(ap).replace(/'/g, "&#39;")})' class="px-2 py-1 rounded-lg bg-emerald-950 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900 text-[11px] font-semibold">
                        Settle Bill
                      </button>
                    ` : '<span class="text-[10px] text-gray-500 font-mono">Paid</span>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
