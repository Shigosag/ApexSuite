async function renderInventoryPage() {
  const [prodRes, branchRes, catRes, supRes] = await Promise.all([
    apiService.getProducts().catch(() => ({ data: [] })),
    apiService.getBranches().catch(() => ({ data: [] })),
    apiService.getCategories().catch(() => ({ data: [] })),
    apiService.getSuppliers().catch(() => ({ data: [] }))
  ]);

  const products = prodRes.data || [];
  const branches = branchRes.data || [];
  const categories = catRes.data || [];
  const suppliers = supRes.data || [];
  const currSym = getCurrencySymbol();

  // Group Stock Asset Value by Category for Chart.js Bar Chart
  const catValueMap = {};
  products.forEach(p => {
    const cat = p.category_name || 'General';
    const val = (parseFloat(p.selling_price) || 0) * (parseInt(p.current_stock, 10) || 0);
    catValueMap[cat] = (catValueMap[cat] || 0) + val;
  });
  const invCatLabels = Object.keys(catValueMap);
  const invCatData = Object.values(catValueMap);

  setTimeout(() => {
    const ctx = document.getElementById('inventoryAssetChart');
    if (ctx && typeof Chart !== 'undefined' && invCatLabels.length > 0) {
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: invCatLabels,
          datasets: [{
            label: `Asset Value (${currSym})`,
            data: invCatData,
            backgroundColor: ['#f34b7d', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'],
            borderRadius: 8,
            maxBarThickness: 60
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
            y: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(255, 255, 255, 0.05)' }, beginAtZero: true }
          }
        }
      });
    }
  }, 100);

  window.switchInventoryTab = (tab) => {
    document.querySelectorAll('.inv-tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.inv-tab-btn').forEach(el => {
      el.classList.remove('pink-btn', 'text-white');
      el.classList.add('text-gray-400', 'hover:text-white');
    });

    const activeContent = document.getElementById(`inv-tab-${tab}`);
    const activeBtn = document.getElementById(`btn-inv-${tab}`);

    if (activeContent) activeContent.classList.remove('hidden');
    if (activeBtn) {
      activeBtn.classList.add('pink-btn', 'text-white');
      activeBtn.classList.remove('text-gray-400');
    }
    lucide.createIcons();
  };

  window.openEditProductModal = (p) => {
    openModal(`Edit Product: ${p.name}`, `
      <form onsubmit="handleStockAdjustSubmit(event, ${p.id})" class="space-y-3">
        <div>
          <label class="text-[10px] text-gray-400">Product Name</label>
          <input type="text" value="${p.name}" disabled class="w-full bg-slate-900/60 border border-slate-700 rounded-xl p-2 text-xs text-gray-400">
        </div>
        <div>
          <label class="text-[10px] text-gray-400">Stock Adjustment Quantity (+ / -)</label>
          <input type="number" id="adjQty" placeholder="e.g. 10 or -5" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs">
        </div>
        <div>
          <label class="text-[10px] text-gray-400">Reason</label>
          <input type="text" id="adjReason" placeholder="e.g. Inventory Restock" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs">
        </div>
        <button type="submit" class="w-full pink-btn py-2.5 rounded-xl font-bold text-xs mt-2">Update Stock Level</button>
      </form>
    `);
  };

  window.handleStockAdjustSubmit = async (e, prodId) => {
    e.preventDefault();
    try {
      await apiService.adjustStock({
        product_id: prodId,
        adjustment_qty: parseInt(document.getElementById('adjQty').value, 10),
        reason: document.getElementById('adjReason').value
      });
      closeModal();
      showToast('Inventory level updated!', 'success');
      navigate('inventory');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  window.deleteProductItem = async (id) => {
    if (!confirm('Are you sure you want to delete this product from inventory?')) return;
    try {
      await apiService.deleteProduct(id);
      showToast('Product removed.', 'success');
      navigate('inventory');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  window.openNewProductModal = () => {
    openModal('Create New Product Entry', `
      <form onsubmit="handleCreateProduct(event)" class="space-y-3">
        <input type="text" id="pName" placeholder="Product Name *" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs">
        <div class="grid grid-cols-2 gap-2">
          <input type="text" id="pSKU" placeholder="SKU *" required class="bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs">
          <input type="text" id="pBarcode" placeholder="Barcode" class="bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs">
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-[10px] text-gray-400">Category</label>
            <select id="pCategory" class="w-full mt-0.5 bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs">
              <option value="">Uncategorized</option>
              ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="text-[10px] text-gray-400">Supplier</label>
            <select id="pSupplier" class="w-full mt-0.5 bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs">
              <option value="">No Direct Supplier</option>
              ${suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <input type="number" step="0.01" id="pCost" placeholder="Cost Price *" required class="bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs">
          <input type="number" step="0.01" id="pPrice" placeholder="Selling Price *" required class="bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs">
        </div>
        <div class="grid grid-cols-2 gap-2">
          <input type="number" id="pAlert" placeholder="Min Stock Alert" value="10" class="bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs">
          <input type="number" id="pInitial" placeholder="Initial Stock Qty" value="20" class="bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs">
        </div>
        <button type="submit" class="w-full pink-btn py-2.5 rounded-xl font-bold text-xs mt-2">Save Product Entry</button>
      </form>
    `);
  };

  window.handleCreateProduct = async (e) => {
    e.preventDefault();
    const catVal = document.getElementById('pCategory').value;
    const supVal = document.getElementById('pSupplier').value;

    try {
      await apiService.createProduct({
        name: document.getElementById('pName').value,
        sku: document.getElementById('pSKU').value,
        barcode: document.getElementById('pBarcode').value,
        category_id: catVal ? parseInt(catVal, 10) : null,
        supplier_id: supVal ? parseInt(supVal, 10) : null,
        cost_price: parseFloat(document.getElementById('pCost').value),
        selling_price: parseFloat(document.getElementById('pPrice').value),
        min_stock_alert: parseInt(document.getElementById('pAlert').value, 10),
        initial_stock: parseInt(document.getElementById('pInitial').value, 10)
      });
      closeModal();
      showToast('Product entry saved to inventory!', 'success');
      navigate('inventory');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  window.openCreateCategoryModal = () => {
    openModal('Add Product Category', `
      <form onsubmit="handleCreateCategory(event)" class="space-y-3">
        <input type="text" id="catName" placeholder="Category Name *" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
        <button type="submit" class="w-full pink-btn py-2.5 rounded-xl font-bold text-xs">Save Category</button>
      </form>
    `);
  };

  window.handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await apiService.createCategory({ name: document.getElementById('catName').value });
      closeModal();
      showToast('Category created!', 'success');
      navigate('inventory');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  window.openCreateSupplierModal = () => {
    openModal('Register Inventory Supplier', `
      <form onsubmit="handleCreateSupplier(event)" class="space-y-3">
        <input type="text" id="supName" placeholder="Supplier Company Name *" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
        <input type="text" id="supContact" placeholder="Contact Person Name" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
        <input type="email" id="supEmail" placeholder="Email Address" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
        <input type="text" id="supPhone" placeholder="Phone Number" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
        <button type="submit" class="w-full pink-btn py-2.5 rounded-xl font-bold text-xs">Save Supplier</button>
      </form>
    `);
  };

  window.handleCreateSupplier = async (e) => {
    e.preventDefault();
    try {
      await apiService.createSupplier({
        name: document.getElementById('supName').value,
        contact_name: document.getElementById('supContact').value,
        email: document.getElementById('supEmail').value,
        phone: document.getElementById('supPhone').value
      });
      closeModal();
      showToast('Supplier profile saved!', 'success');
      navigate('inventory');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  window.openStockTransferModal = (prodId, prodName) => {
    openModal(`Stock Transfer: ${prodName}`, `
      <form onsubmit="handleStockTransfer(event, ${prodId})" class="space-y-3">
        <div>
          <label class="text-[10px] text-gray-400">Target Branch Location</label>
          <select id="tToBranch" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs">
            ${branches.map(b => `<option value="${b.id}">${b.name} (${b.location})</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="text-[10px] text-gray-400">Transfer Quantity</label>
          <input type="number" id="tQty" min="1" value="5" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs">
        </div>
        <button type="submit" class="w-full pink-btn py-2.5 rounded-xl font-bold text-xs mt-2">Execute Transfer</button>
      </form>
    `);
  };

  window.handleStockTransfer = async (e, prodId) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('apex_user')) || {};
    try {
      await apiService.transferStock({
        product_id: prodId,
        from_branch_id: user.branch_id || 1,
        to_branch_id: document.getElementById('tToBranch').value,
        quantity: parseInt(document.getElementById('tQty').value, 10)
      });
      closeModal();
      showToast('Inter-branch stock transfer completed!', 'success');
      navigate('inventory');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-xl font-bold">Inventory & Warehouse Management</h2>
          <p class="text-xs text-gray-400">Multi-branch stock monitoring, categories, suppliers, and low-inventory alerts</p>
        </div>
        <div class="flex gap-2">
          <button onclick="openNewProductModal()" class="pink-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
            <i data-lucide="plus-circle" class="w-4 h-4 text-white"></i> Add Product
          </button>
        </div>
      </div>

      <!-- Top Section: Inventory Asset Value Bar Chart -->
      <div class="glass-panel p-5 rounded-2xl border border-slate-800">
        <h3 class="font-bold text-xs border-b border-slate-800 pb-2 mb-3 flex justify-between items-center">
          <span>Inventory Asset Value Distribution by Category</span>
          <i data-lucide="bar-chart-2" class="w-4 h-4 pink-brand-text"></i>
        </h3>
        <div class="h-40 relative">
          ${invCatLabels.length === 0 ? '<p class="text-xs text-gray-500 text-center pt-16">No inventory products found.</p>' : '<canvas id="inventoryAssetChart"></canvas>'}
        </div>
      </div>

      <div class="flex gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
        <button id="btn-inv-catalog" onclick="switchInventoryTab('catalog')" class="inv-tab-btn px-4 py-2 rounded-xl pink-btn text-white flex items-center gap-2">
          <i data-lucide="package" class="w-4 h-4"></i> Product Catalog (${products.length})
        </button>
        <button id="btn-inv-categories" onclick="switchInventoryTab('categories')" class="inv-tab-btn px-4 py-2 rounded-xl text-gray-400 hover:text-white flex items-center gap-2">
          <i data-lucide="folder-tree" class="w-4 h-4"></i> Categories (${categories.length})
        </button>
        <button id="btn-inv-suppliers" onclick="switchInventoryTab('suppliers')" class="inv-tab-btn px-4 py-2 rounded-xl text-gray-400 hover:text-white flex items-center gap-2">
          <i data-lucide="truck" class="w-4 h-4"></i> Suppliers (${suppliers.length})
        </button>
      </div>

      <!-- Tab 1: Product Catalog -->
      <div id="inv-tab-catalog" class="inv-tab-content glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-800/60 uppercase text-gray-400">
            <tr>
              <th class="p-4">SKU / Barcode</th>
              <th class="p-4">Product Description</th>
              <th class="p-4 font-mono">Cost</th>
              <th class="p-4 font-mono">Price</th>
              <th class="p-4">Stock Qty</th>
              <th class="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            ${products.length === 0 ? '<tr><td colspan="6" class="p-4 text-center text-gray-500">No inventory products found.</td></tr>' : products.map(p => `
              <tr class="${p.is_low_stock ? 'bg-red-500/10' : ''}">
                <td class="p-4 font-mono">
                  <span class="font-bold text-gray-200">${p.sku}</span><br>
                  <span class="text-[10px] text-gray-400">${p.barcode || 'N/A'}</span>
                </td>
                <td class="p-4">
                  <p class="font-bold">${p.name}</p>
                  <p class="text-[10px] text-gray-400">${p.variant_name || 'Standard'} • ${p.category_name || 'General'}</p>
                </td>
                <td class="p-4 font-mono text-gray-400">${formatCurrency(p.cost_price)}</td>
                <td class="p-4 font-mono pink-brand-text font-bold">${formatCurrency(p.selling_price)}</td>
                <td class="p-4">
                  <span class="font-bold ${p.is_low_stock ? 'text-red-400' : 'text-slate-200'}">${p.current_stock} ${p.unit}</span>
                  ${p.is_low_stock ? '<span class="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-red-500/20 text-red-400 font-bold"><i data-lucide="alert-triangle" class="w-3 h-3"></i> LOW STOCK</span>' : '<span class="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 font-bold"><i data-lucide="check" class="w-3 h-3"></i> IN STOCK</span>'}
                </td>
                <td class="p-4 text-right space-x-1">
                  <button onclick='openEditProductModal(${JSON.stringify(p).replace(/'/g, "&#39;")})' class="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-[11px] font-semibold text-gray-300">
                    Adjust
                  </button>
                  <button onclick="openStockTransferModal(${p.id}, '${p.name.replace(/'/g, "\\'")}')" class="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-[11px] font-semibold text-gray-300">
                    Transfer
                  </button>
                  <button onclick="deleteProductItem(${p.id})" class="p-1 rounded-lg bg-red-950/60 border border-red-500/30 text-red-400 hover:bg-red-900 inline-flex items-center">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Tab 2: Categories -->
      <div id="inv-tab-categories" class="inv-tab-content glass-panel rounded-2xl border border-slate-800 overflow-hidden hidden">
        <div class="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 class="font-bold text-xs">Product Categories</h3>
          <button onclick="openCreateCategoryModal()" class="pink-btn px-3 py-1.5 rounded-xl text-xs font-bold">+ New Category</button>
        </div>
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-800/60 uppercase text-gray-400">
            <tr><th class="p-4">Category Name</th></tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            ${categories.length === 0 ? '<tr><td class="p-4 text-center text-gray-500">No categories found.</td></tr>' : categories.map(c => `
              <tr><td class="p-4 font-bold text-slate-200">${c.name}</td></tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Tab 3: Suppliers -->
      <div id="inv-tab-suppliers" class="inv-tab-content glass-panel rounded-2xl border border-slate-800 overflow-hidden hidden">
        <div class="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 class="font-bold text-xs">Approved Suppliers</h3>
          <button onclick="openCreateSupplierModal()" class="pink-btn px-3 py-1.5 rounded-xl text-xs font-bold">+ New Supplier</button>
        </div>
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-800/60 uppercase text-gray-400">
            <tr><th class="p-4">Supplier Name</th><th class="p-4">Contact Person</th><th class="p-4">Email</th><th class="p-4">Phone</th></tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            ${suppliers.length === 0 ? '<tr><td colspan="4" class="p-4 text-center text-gray-500">No suppliers registered.</td></tr>' : suppliers.map(s => `
              <tr>
                <td class="p-4 font-bold text-slate-200">${s.name}</td>
                <td class="p-4 text-gray-400">${s.contact_name || 'N/A'}</td>
                <td class="p-4 text-gray-400">${s.email || 'N/A'}</td>
                <td class="p-4 font-mono text-gray-400">${s.phone || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
