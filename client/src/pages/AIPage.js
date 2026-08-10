async function renderAIPage() {
  window.executeAIQueryPrompt = async (forcedPrompt = null) => {
    const prompt = forcedPrompt || document.getElementById('aiInputPrompt').value;
    if (!prompt) return;

    const box = document.getElementById('aiResponseTerminal');
    box.innerHTML = `<p class="text-xs text-gray-400 italic flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin pink-brand-text"></i> ApexSuite Strategy Copilot analyzing database context...</p>`;
    lucide.createIcons();

    try {
      const res = await apiService.queryAI(prompt);
      
      let formattedDataHtml = '';
      if (res.data) {
        if (Array.isArray(res.data)) {
          formattedDataHtml = `
            <div class="mt-3 glass-panel rounded-xl border border-slate-800 overflow-hidden">
              <table class="w-full text-left text-[11px]">
                <thead class="bg-slate-800/80 uppercase text-gray-400">
                  <tr><th class="p-2.5">Product Name</th><th class="p-2.5">SKU</th><th class="p-2.5">Stock</th><th class="p-2.5">Reorder Qty</th><th class="p-2.5">Est. Cost</th></tr>
                </thead>
                <tbody class="divide-y divide-slate-800">
                  ${res.data.map(item => `
                    <tr>
                      <td class="p-2.5 font-bold">${item.name}</td>
                      <td class="p-2.5 font-mono text-gray-400">${item.sku}</td>
                      <td class="p-2.5 font-bold text-red-400">${item.stock_qty}</td>
                      <td class="p-2.5 font-bold text-emerald-400">${item.recommended_reorder_qty || 'N/A'}</td>
                      <td class="p-2.5 font-mono text-amber-400 font-bold">${item.estimated_reorder_cost || 'N/A'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `;
        } else {
          formattedDataHtml = `
            <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
              ${Object.entries(res.data).map(([key, val]) => {
                const k = key.toLowerCase();
                const num = typeof val === 'number' ? val : parseFloat(val);
                
                let colorClass = 'text-slate-200';
                if (!isNaN(num)) {
                  if (k.includes('expense') || k.includes('cost') || k.includes('loss')) {
                    colorClass = num !== 0 ? 'text-red-400' : 'text-slate-300';
                  } else if (num > 0) {
                    colorClass = 'text-emerald-400';
                  } else if (num < 0) {
                    colorClass = 'text-red-400';
                  } else {
                    colorClass = 'text-slate-300';
                  }
                }

                let displayVal = val;
                if (typeof val === 'number') {
                  displayVal = val < 0 ? `-${formatCurrency(Math.abs(val))}` : formatCurrency(val);
                }

                return `
                  <div class="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
                    <p class="text-[10px] text-gray-400 capitalize">${key.replace(/_/g, ' ')}</p>
                    <p class="font-bold font-mono ${colorClass} mt-0.5">${displayVal}</p>
                  </div>
                `;
              }).join('')}
            </div>
          `;
        }
      }

      box.innerHTML = `
        <div class="space-y-3">
          <p class="font-bold pink-brand-text text-xs flex items-center gap-1.5">
            <i data-lucide="sparkles" class="w-4 h-4"></i> ApexSuite Strategy Insight:
          </p>
          <div class="text-xs leading-relaxed whitespace-pre-line text-gray-200">${res.response}</div>
          ${formattedDataHtml}
        </div>
      `;
      lucide.createIcons();
    } catch (err) {
      box.innerHTML = `<p class="text-xs text-red-400 font-bold">${err.message}</p>`;
    }
  };

  return `
    <div class="glass-panel p-6 rounded-2xl border border-slate-800/80 max-w-3xl space-y-6">
      <div>
        <h2 class="text-xl font-bold flex items-center gap-2">
          <i data-lucide="sparkles" class="w-5 h-5 pink-brand-text"></i> Strategy Copilot
        </h2>
        <p class="text-xs text-gray-400 mt-1">Ask questions regarding revenue trends, low stock items, or operational forecasts.</p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button onclick="executeAIQueryPrompt('What products need restocking?')" class="bg-slate-800 border border-slate-700 hover:border-[#f34b7d] px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all">
          <i data-lucide="package-search" class="w-4 h-4 pink-brand-text"></i> Stock Audit
        </button>
        <button onclick="executeAIQueryPrompt('P&L Profit overview')" class="bg-slate-800 border border-slate-700 hover:border-[#f34b7d] px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all">
          <i data-lucide="bar-chart-3" class="w-4 h-4 pink-brand-text"></i> P&L Summary
        </button>
        <button onclick="executeAIQueryPrompt('How to increase my revenue')" class="bg-slate-800 border border-slate-700 hover:border-[#f34b7d] px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all">
          <i data-lucide="trending-up" class="w-4 h-4 text-emerald-400"></i> Revenue Strategy
        </button>
      </div>

      <div id="aiResponseTerminal" class="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 min-h-[160px] flex items-center justify-center">
        <p class="text-xs text-gray-500">Select a prompt button or input a question below.</p>
      </div>

      <div class="flex gap-2">
        <input type="text" id="aiInputPrompt" placeholder="Ask AI Assistant about business metrics..." class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#f34b7d]">
        <button onclick="executeAIQueryPrompt()" class="pink-btn px-5 py-2.5 rounded-xl text-xs font-bold pink-glow flex items-center gap-2">
          <i data-lucide="send" class="w-4 h-4"></i> Send Query
        </button>
      </div>
    </div>
  `;
}
