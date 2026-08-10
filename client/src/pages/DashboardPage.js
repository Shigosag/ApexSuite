async function renderDashboardPage() {
  const [summaryRes, ordersRes] = await Promise.all([
    apiService.getFinanceSummary().catch(() => ({ data: { revenue: 0, expenses: 0, net_profit: 0, accounts_receivable: 0 } })),
    apiService.getPOSOrders().catch(() => ({ data: [] }))
  ]);

  const d = summaryRes.data || { revenue: 0, expenses: 0, net_profit: 0, accounts_receivable: 0 };
  const orders = ordersRes.data || [];
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
            ${orders.length === 0 ? '<p class="text-gray-500 py-4 text-center">No transactions recorded.</p>' : orders.map(o => `
              <div class="pt-2 flex justify-between items-center">
                <div class="min-w-0">
                  <p class="font-bold font-mono truncate">${o.order_number}</p>
                  <p class="text-[10px] text-gray-400 truncate">${o.customer_name || 'Walk-in Customer'} • ${o.payment_method}</p>
                </div>
                <span class="font-bold font-mono text-emerald-400 shrink-0 ml-2">${formatCurrency(o.total_amount)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}
