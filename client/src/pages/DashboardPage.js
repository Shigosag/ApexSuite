async function renderDashboardPage() {
  const [summaryRes, ordersRes, productsRes] = await Promise.all([
    apiService.getFinanceSummary().catch(() => ({ data: { revenue: 0, expenses: 0, net_profit: 0, accounts_receivable: 0 } })),
    apiService.getPOSOrders().catch(() => ({ data: [] })),
    apiService.getProducts().catch(() => ({ data: [] }))
  ]);

  const d = summaryRes.data || { revenue: 0, expenses: 0, net_profit: 0, accounts_receivable: 0 };
  const orders = ordersRes.data || [];
  const products = productsRes.data || [];
  const currSym = getCurrencySymbol();

  const netIncomeVal = d.net_profit || 0;
  let netIncomeColorClass = 'text-slate-300';
  let netIncomeStatusText = 'Balanced (No Profit/Loss)';
  if (netIncomeVal > 0) {
    netIncomeColorClass = 'text-emerald-400';
    netIncomeStatusText = '↑ Net Operating Profit';
  } else if (netIncomeVal < 0) {
    netIncomeColorClass = 'text-red-400';
    netIncomeStatusText = '↓ Net Operating Loss';
  }

  const formattedRevenue = formatCurrency(d.revenue || 0);
  const formattedExpenses = formatCurrency(d.expenses || 0);
  const formattedNetIncome = netIncomeVal < 0 
    ? `-${formatCurrency(Math.abs(netIncomeVal))}` 
    : formatCurrency(netIncomeVal);
  const formattedAR = formatCurrency(d.accounts_receivable || 0);

  const lowStockItems = products.filter(p => p.is_low_stock || p.current_stock <= p.min_stock_alert);
  const topProducts = [...products].sort((a, b) => (b.selling_price * b.current_stock) - (a.selling_price * a.current_stock)).slice(0, 4);

  const currentMonthIdx = new Date().getMonth();
  const revenueSeries = Array(12).fill(0);
  const expenseSeries = Array(12).fill(0);
  const netProfitSeries = Array(12).fill(0);

  revenueSeries[currentMonthIdx] = d.revenue || 0;
  expenseSeries[currentMonthIdx] = d.expenses || 0;
  netProfitSeries[currentMonthIdx] = d.net_profit || 0;

  setTimeout(() => {
    const ctx = document.getElementById('revenueChart');
    if (ctx && typeof Chart !== 'undefined') {
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [
            {
              label: `Revenue (${currSym})`,
              data: revenueSeries,
              borderColor: '#10b981',
              backgroundColor: '#10b981',
              pointBackgroundColor: '#10b981',
              borderWidth: 2,
              tension: 0.3,
              fill: false
            },
            {
              label: `Expenses (${currSym})`,
              data: expenseSeries,
              borderColor: '#ef4444',
              backgroundColor: '#ef4444',
              pointBackgroundColor: '#ef4444',
              borderWidth: 2,
              tension: 0.3,
              fill: false
            },
            {
              label: `Net Profit (${currSym})`,
              data: netProfitSeries,
              borderColor: '#f34b7d',
              backgroundColor: '#f34b7d',
              pointBackgroundColor: '#f34b7d',
              borderWidth: 2,
              tension: 0.3,
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: {
                color: '#94a3b8',
                usePointStyle: true,
                pointStyle: 'rectRounded'
              }
            }
          },
          scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
            y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255, 255, 255, 0.05)' }, beginAtZero: true }
          }
        }
      });
    }
  }, 100);

  return `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-xl font-bold">Executive Overview Dashboard</h2>
          <p class="text-xs text-gray-400">Enterprise analytics, financial trends, and transaction history</p>
        </div>
        <button onclick="navigate('pos')" class="pink-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
          <i data-lucide="shopping-cart" class="w-4 h-4 text-white"></i> Launch POS Register
        </button>
      </div>

      <!-- Top KPI Cards Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="glass-panel p-4 lg:p-5 rounded-2xl border border-slate-800 flex flex-col justify-between overflow-hidden min-w-0">
          <p class="text-xs text-gray-400 font-medium truncate">Total Revenue</p>
          <h3 title="${formattedRevenue}" class="text-lg lg:text-xl xl:text-2xl font-bold mt-2 text-emerald-400 font-mono tracking-tight truncate min-w-0">${formattedRevenue}</h3>
          <span class="text-[10px] text-emerald-400 mt-2 truncate">↑ Active Workspace</span>
        </div>

        <div class="glass-panel p-4 lg:p-5 rounded-2xl border border-slate-800 flex flex-col justify-between overflow-hidden min-w-0">
          <p class="text-xs text-gray-400 font-medium truncate">Operating Expenses</p>
          <h3 title="${formattedExpenses}" class="text-lg lg:text-xl xl:text-2xl font-bold mt-2 text-red-400 font-mono tracking-tight truncate min-w-0">${formattedExpenses}</h3>
          <span class="text-[10px] text-red-400 mt-2 truncate">Within target budget</span>
        </div>

        <div class="glass-panel p-4 lg:p-5 rounded-2xl border border-slate-800 flex flex-col justify-between overflow-hidden min-w-0">
          <p class="text-xs text-gray-400 font-medium truncate">Net Income</p>
          <h3 title="${formattedNetIncome}" class="text-lg lg:text-xl xl:text-2xl font-bold mt-2 ${netIncomeColorClass} font-mono tracking-tight truncate min-w-0">${formattedNetIncome}</h3>
          <span class="text-[10px] ${netIncomeColorClass} mt-2 truncate">${netIncomeStatusText}</span>
        </div>

        <div class="glass-panel p-4 lg:p-5 rounded-2xl border border-slate-800 flex flex-col justify-between overflow-hidden min-w-0">
          <p class="text-xs text-gray-400 font-medium truncate">Accounts Receivable</p>
          <h3 title="${formattedAR}" class="text-lg lg:text-xl xl:text-2xl font-bold mt-2 text-amber-400 font-mono tracking-tight truncate min-w-0">${formattedAR}</h3>
          <span class="text-[10px] text-amber-400 mt-2 truncate">Outstanding Invoices</span>
        </div>
      </div>

      <!-- Middle Main Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800">
          <h3 class="font-bold text-sm mb-4">Financial Growth & Operating Trend</h3>
          <div class="h-64 relative">
            <canvas id="revenueChart"></canvas>
          </div>
        </div>

        <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 class="font-bold text-sm">Recent POS Transactions</h3>
          <div class="space-y-3 text-xs divide-y divide-slate-800/60 max-h-64 overflow-y-auto">
            ${orders.length === 0 ? '<p class="text-gray-500 py-4 text-center">No transactions recorded.</p>' : orders.map(o => {
              const isIncomeEntry = o.order_number.startsWith('INC-');
              const customerLabel = isIncomeEntry ? 'Direct Capital / Income Entry' : (o.customer_name || 'Walk-in Customer');

              return `
                <div class="pt-2 flex justify-between items-center">
                  <div class="min-w-0">
                    <p class="font-bold font-mono truncate">${o.order_number}</p>
                    <p class="text-[10px] text-gray-400 truncate">${customerLabel} • ${o.payment_method}</p>
                  </div>
                  <span class="font-bold font-mono text-emerald-400 shrink-0 ml-2">${formatCurrency(o.total_amount)}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- NEW Bottom Executive Analytics Row (Fills Bottom Space) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Widget 1: Top Valued Inventory -->
        <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h4 class="font-bold text-xs text-gray-300 flex items-center justify-between">
            <span>Top Inventory Asset Value</span>
            <i data-lucide="package" class="w-4 h-4 pink-brand-text"></i>
          </h4>
          <div class="space-y-2 text-xs divide-y divide-slate-800/50">
            ${topProducts.length === 0 ? '<p class="text-gray-500 py-2">No inventory data.</p>' : topProducts.map(p => `
              <div class="pt-2 flex justify-between items-center">
                <div class="min-w-0">
                  <p class="font-bold truncate">${p.name}</p>
                  <p class="text-[10px] text-gray-400 font-mono">${p.current_stock} units in stock</p>
                </div>
                <span class="font-bold font-mono pink-brand-text">${formatCurrency(p.selling_price * p.current_stock)}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Widget 2: Stock Risk & Restock Radar -->
        <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h4 class="font-bold text-xs text-gray-300 flex items-center justify-between">
            <span>Inventory Health & Risk Radar</span>
            <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-400"></i>
          </h4>
          <div class="space-y-2 text-xs divide-y divide-slate-800/50">
            ${lowStockItems.length === 0 ? '<p class="text-emerald-400 font-semibold py-2">✓ All inventory operating at optimal stock levels.</p>' : lowStockItems.map(p => `
              <div class="pt-2 flex justify-between items-center">
                <div class="min-w-0">
                  <p class="font-bold text-red-400 truncate">${p.name}</p>
                  <p class="text-[10px] text-gray-400 font-mono">Min alert threshold: ${p.min_stock_alert}</p>
                </div>
                <span class="font-bold font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded">${p.current_stock} left</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Widget 3: Executive Action Shortcuts -->
        <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h4 class="font-bold text-xs text-gray-300 flex items-center justify-between">
            <span>Quick Action Command Hub</span>
            <i data-lucide="zap" class="w-4 h-4 text-emerald-400"></i>
          </h4>
          <div class="grid grid-cols-2 gap-2 text-xs pt-1">
            <button onclick="navigate('pos')" class="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left font-semibold space-y-1">
              <i data-lucide="shopping-cart" class="w-4 h-4 pink-brand-text"></i>
              <p class="text-[11px]">POS Terminal</p>
            </button>
            <button onclick="navigate('crm')" class="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left font-semibold space-y-1">
              <i data-lucide="user-plus" class="w-4 h-4 text-emerald-400"></i>
              <p class="text-[11px]">Add Customer</p>
            </button>
            <button onclick="navigate('inventory')" class="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left font-semibold space-y-1">
              <i data-lucide="plus-circle" class="w-4 h-4 text-blue-400"></i>
              <p class="text-[11px]">Add Product</p>
            </button>
            <button onclick="navigate('finance')" class="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left font-semibold space-y-1">
              <i data-lucide="file-text" class="w-4 h-4 text-amber-400"></i>
              <p class="text-[11px]">Log Expense</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
