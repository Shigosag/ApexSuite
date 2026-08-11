let posCart = [];

async function renderPOSPage() {
  const [prodRes, custRes, ordersRes] = await Promise.all([
    apiService.getProducts().catch(() => ({ data: [] })),
    apiService.getCustomers().catch(() => ({ data: [] })),
    apiService.getPOSOrders().catch(() => ({ data: [] }))
  ]);

  const allProducts = prodRes.data || [];
  const customers = custRes.data || [];
  const recentOrders = ordersRes.data || [];

  window.filterPOSProducts = () => {
    const query = document.getElementById('posSearch')?.value.toLowerCase().trim() || '';
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query) || (p.barcode && p.barcode.includes(query)));
    
    const grid = document.getElementById('posGrid');
    if (grid) {
      grid.innerHTML = filtered.length === 0 
        ? '<p class="text-xs text-gray-500 col-span-3 text-center py-8">No products match search query.</p>'
        : filtered.map(p => `
            <div onclick="addPOSItem(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.selling_price})" class="glass-panel p-4 rounded-xl border border-slate-800 hover:border-[#f34b7d] cursor-pointer transition-all space-y-2">
              <div class="flex justify-between text-[10px] text-gray-400 font-mono">
                <span>${p.sku}</span>
                <span>Qty: ${p.current_stock}</span>
              </div>
              <h4 class="font-bold text-xs truncate">${p.name}</h4>
              <p class="text-xs font-bold pink-brand-text font-mono">${formatCurrency(p.selling_price)}</p>
            </div>
          `).join('');
    }
  };

  window.addPOSItem = (id, name, price) => {
    const exist = posCart.find(i => i.product_id === id);
    if (exist) {
      exist.quantity += 1;
    } else {
      posCart.push({ product_id: id, name, unit_price: price, quantity: 1 });
    }
    updatePOSCartUI();
  };

  window.updatePOSQty = (id, change) => {
    const item = posCart.find(i => i.product_id === id);
    if (item) {
      item.quantity += change;
      if (item.quantity <= 0) {
        posCart = posCart.filter(i => i.product_id !== id);
      }
    }
    updatePOSCartUI();
  };

  window.clearPOSBasket = () => {
    posCart = [];
    updatePOSCartUI();
    showToast('Basket cleared.', 'success');
  };

  window.downloadReceiptPDF = async (orderId) => {
    try {
      await apiService.downloadReceiptBlob(orderId);
      showToast('PDF Receipt generated successfully.', 'success');
    } catch (err) {
      showToast('Failed to download receipt PDF: ' + err.message, 'error');
    }
  };

  window.openRefundOrderModal = (orderId, orderNum, totalAmount) => {
    openModal(`Order Refund: ${orderNum}`, `
      <form onsubmit="handleRefundOrderSubmit(event, ${orderId})" class="space-y-3">
        <div>
          <label class="text-[10px] text-gray-400">Order Number</label>
          <p class="font-mono font-bold text-xs text-white">${orderNum}</p>
        </div>
        <div>
          <label class="text-[10px] text-gray-400">Refund Amount *</label>
          <input type="number" step="0.01" id="refundAmount" value="${totalAmount}" required class="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-mono">
        </div>
        <div>
          <label class="text-[10px] text-gray-400">Refund Reason *</label>
          <input type="text" id="refundReason" placeholder="e.g. Returned damaged item" required class="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
        </div>
        <button type="submit" class="w-full bg-red-950 hover:bg-red-900 border border-red-500/30 text-red-200 py-2.5 rounded-xl font-bold text-xs mt-2">Execute Order Refund</button>
      </form>
    `);
  };

  window.handleRefundOrderSubmit = async (e, orderId) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('refundAmount').value);
    const reason = document.getElementById('refundReason').value;

    try {
      await apiService.processPOSRefund(orderId, amount, reason);
      closeModal();
      showToast('Order refunded successfully.', 'success');
      navigate('pos');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  window.checkoutPOS = async () => {
    if (posCart.length === 0) {
      return showToast('Basket is empty. Select products to checkout.', 'error');
    }
    const custId = document.getElementById('posCustomerSelect').value;
    const pMethod = document.getElementById('posPayMethod').value;
    const discount = parseFloat(document.getElementById('posDiscount').value) || 0;

    try {
      const res = await apiService.checkout(posCart, pMethod, discount, custId ? parseInt(custId, 10) : null);
      showToast(`POS Order ${res.data.orderNum} completed!`, 'success');
      
      await downloadReceiptPDF(res.data.orderId);

      posCart = [];
      updatePOSCartUI();
      navigate('pos');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  setTimeout(() => updatePOSCartUI(), 50);

  return `
    <div class="space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-4">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-xl font-bold">Point-of-Sale Register</h2>
              <p class="text-xs text-gray-400">Scan or search inventory items to populate customer basket</p>
            </div>
            <input type="text" id="posSearch" oninput="filterPOSProducts()" placeholder="Search product name or SKU..." class="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs w-64 focus:outline-none focus:border-[#f34b7d]">
          </div>

          <div id="posGrid" class="grid grid-cols-2 md:grid-cols-3 gap-3">
            ${allProducts.map(p => `
              <div onclick="addPOSItem(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.selling_price})" class="glass-panel p-4 rounded-xl border border-slate-800 hover:border-[#f34b7d] cursor-pointer transition-all space-y-2">
                <div class="flex justify-between text-[10px] text-gray-400 font-mono">
                  <span>${p.sku}</span>
                  <span>Qty: ${p.current_stock}</span>
                </div>
                <h4 class="font-bold text-xs truncate">${p.name}</h4>
                <p class="text-xs font-bold pink-brand-text font-mono">${formatCurrency(p.selling_price)}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between h-[600px]">
          <div class="space-y-4">
            <div class="border-b border-slate-800 pb-3 flex justify-between items-center">
              <h3 class="font-bold text-xs">Checkout Cart</h3>
              <div class="flex items-center gap-2">
                <span class="text-[10px] pink-brand-text font-mono font-bold" id="cartCountBadge">0 items</span>
                <button onclick="clearPOSBasket()" title="Clear Basket" class="text-[10px] text-gray-400 hover:text-red-400">Clear</button>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] text-gray-400">Select Customer Account</label>
              <select id="posCustomerSelect" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs">
                <option value="">Walk-in Customer</option>
                ${customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
              </select>
            </div>

            <div id="cartItemsList" class="space-y-2 text-xs divide-y divide-slate-800 max-h-52 overflow-y-auto"></div>
          </div>

          <div class="border-t border-slate-800 pt-3 space-y-3">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-[10px] text-gray-400">Discount Amount</label>
                <input type="number" id="posDiscount" value="0" onchange="updatePOSCartUI()" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-1.5 text-xs">
              </div>
              <div>
                <label class="text-[10px] text-gray-400">Payment Type</label>
                <select id="posPayMethod" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-1.5 text-xs">
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
            </div>

            <div class="space-y-1 text-xs font-mono">
              <div class="flex justify-between text-gray-400"><span>Subtotal:</span><span id="posSubtotal">${formatCurrency(0)}</span></div>
              <div class="flex justify-between text-gray-400"><span>Estimated Tax (7%):</span><span id="posTax">${formatCurrency(0)}</span></div>
              <div class="flex justify-between font-bold text-sm text-white pt-1 border-t border-slate-800"><span>Grand Total:</span><span id="posGrandTotal" class="pink-brand-text">${formatCurrency(0)}</span></div>
            </div>

            <button onclick="checkoutPOS()" class="w-full pink-btn py-3 rounded-xl font-bold text-xs pink-glow">Complete Transaction</button>
          </div>
        </div>
      </div>

      <!-- Recent POS Transactions History -->
      <div class="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div class="p-4 border-b border-slate-800 font-bold text-xs">Recent Branch Transactions</div>
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-800/60 uppercase text-gray-400">
            <tr><th class="p-4">Order #</th><th class="p-4">Customer</th><th class="p-4">Cashier</th><th class="p-4">Method</th><th class="p-4">Status</th><th class="p-4 font-mono">Total</th><th class="p-4 text-right">Actions</th></tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            ${recentOrders.length === 0 ? '<tr><td colspan="7" class="p-4 text-center text-gray-500">No transaction logs recorded.</td></tr>' : recentOrders.map(o => {
              const isIncomeEntry = o.order_number.startsWith('INC-');
              const customerLabel = isIncomeEntry ? 'Direct Capital / Income Entry' : (o.customer_name || 'Walk-in Customer');

              return `
                <tr>
                  <td class="p-4 font-mono font-bold">${o.order_number}</td>
                  <td class="p-4">${customerLabel}</td>
                  <td class="p-4 text-gray-400">${o.cashier_name || 'System Cashier'}</td>
                  <td class="p-4"><span class="px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700">${o.payment_method}</span></td>
                  <td class="p-4"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${o.status === 'Refunded' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}">${o.status || 'Completed'}</span></td>
                  <td class="p-4 font-mono font-bold text-emerald-400">${formatCurrency(o.total_amount)}</td>
                  <td class="p-4 text-right flex justify-end gap-1">
                    ${o.status !== 'Refunded' && !isIncomeEntry ? `
                      <button onclick="openRefundOrderModal(${o.id}, '${o.order_number}', ${o.total_amount})" class="px-2 py-1 rounded-lg bg-red-950/60 border border-red-500/30 hover:bg-red-900 text-[11px] font-semibold text-red-300">
                        Refund
                      </button>
                    ` : ''}
                    <button onclick="downloadReceiptPDF(${o.id})" class="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-[11px] font-semibold text-gray-300 flex items-center gap-1.5">
                      <i data-lucide="file-text" class="w-3.5 h-3.5 pink-brand-text"></i> PDF
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function updatePOSCartUI() {
  const container = document.getElementById('cartItemsList');
  if (!container) return;

  let subtotal = 0;
  let totalQty = 0;

  container.innerHTML = posCart.length === 0 
    ? '<p class="text-gray-500 text-[11px] text-center py-4">No items added to basket.</p>'
    : posCart.map(i => {
        const line = i.unit_price * i.quantity;
        subtotal += line;
        totalQty += i.quantity;
        return `
          <div class="flex justify-between items-center py-1.5">
            <div>
              <p class="font-bold">${i.name}</p>
              <p class="text-[10px] text-gray-400 font-mono">${formatCurrency(i.unit_price)} x ${i.quantity}</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold">${formatCurrency(line)}</span>
              <button onclick="updatePOSQty(${i.product_id}, -1)" class="w-5 h-5 rounded bg-slate-800 border border-slate-700 text-xs">-</button>
              <button onclick="updatePOSQty(${i.product_id}, 1)" class="w-5 h-5 rounded bg-slate-800 border border-slate-700 text-xs">+</button>
            </div>
          </div>
        `;
      }).join('');

  const discount = parseFloat(document.getElementById('posDiscount')?.value) || 0;
  const tax = Math.max(0, subtotal - discount) * 0.07;
  const grandTotal = Math.max(0, subtotal - discount + tax);

  if (document.getElementById('posSubtotal')) document.getElementById('posSubtotal').innerText = formatCurrency(subtotal);
  if (document.getElementById('posTax')) document.getElementById('posTax').innerText = formatCurrency(tax);
  if (document.getElementById('posGrandTotal')) document.getElementById('posGrandTotal').innerText = formatCurrency(grandTotal);
  if (document.getElementById('cartCountBadge')) document.getElementById('cartCountBadge').innerText = `${totalQty} items`;
}
