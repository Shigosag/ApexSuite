async function renderCRMPage() {
  const [custRes, leadsRes] = await Promise.all([
    apiService.getCustomers().catch(() => ({ data: [] })),
    apiService.getLeads().catch(() => ({ data: [] }))
  ]);

  const customers = custRes.data || [];
  const leads = leadsRes.data || [];

  window.openNewCustomerModal = () => {
    openModal('Register Client Account', `
      <form onsubmit="handleCreateCustomer(event)" class="space-y-3">
        <input type="text" id="cName" placeholder="Client Name *" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
        <input type="email" id="cEmail" placeholder="Email Address *" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
        <input type="text" id="cPhone" placeholder="Phone Number" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
        <input type="text" id="cCompany" placeholder="Company Name" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
        <select id="cSegment" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
          <option value="General">General</option>
          <option value="VIP Enterprise">VIP Enterprise</option>
          <option value="Wholesale">Wholesale</option>
        </select>
        <button type="submit" class="w-full pink-btn py-2.5 rounded-xl font-bold text-xs mt-2">Save Customer Profile</button>
      </form>
    `);
  };

  window.handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      await apiService.createCustomer({
        name: document.getElementById('cName').value,
        email: document.getElementById('cEmail').value,
        phone: document.getElementById('cPhone').value,
        company_name: document.getElementById('cCompany').value,
        segment: document.getElementById('cSegment').value
      });
      closeModal();
      showToast('Client account profile saved!', 'success');
      navigate('crm');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  window.openEditCustomerModal = (c) => {
    openModal(`Edit Customer Profile: ${c.name}`, `
      <form onsubmit="handleUpdateCustomer(event, ${c.id})" class="space-y-3">
        <div>
          <label class="text-[10px] text-gray-400">Client Name *</label>
          <input type="text" id="editCName" value="${c.name}" required class="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
        </div>
        <div>
          <label class="text-[10px] text-gray-400">Email Address *</label>
          <input type="email" id="editCEmail" value="${c.email}" required class="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
        </div>
        <div>
          <label class="text-[10px] text-gray-400">Phone Number</label>
          <input type="text" id="editCPhone" value="${c.phone || ''}" class="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
        </div>
        <div>
          <label class="text-[10px] text-gray-400">Company Name</label>
          <input type="text" id="editCCompany" value="${c.company_name || ''}" class="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
        </div>
        <div>
          <label class="text-[10px] text-gray-400">Customer Segment</label>
          <select id="editCSegment" class="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
            <option value="General" ${c.segment === 'General' ? 'selected' : ''}>General</option>
            <option value="VIP Enterprise" ${c.segment === 'VIP Enterprise' ? 'selected' : ''}>VIP Enterprise</option>
            <option value="Wholesale" ${c.segment === 'Wholesale' ? 'selected' : ''}>Wholesale</option>
          </select>
        </div>
        <button type="submit" class="w-full pink-btn py-2.5 rounded-xl font-bold text-xs mt-2">Update Profile</button>
      </form>
    `);
  };

  window.handleUpdateCustomer = async (e, customerId) => {
    e.preventDefault();
    try {
      await apiService.updateCustomer(customerId, {
        name: document.getElementById('editCName').value,
        email: document.getElementById('editCEmail').value,
        phone: document.getElementById('editCPhone').value,
        company_name: document.getElementById('editCCompany').value,
        segment: document.getElementById('editCSegment').value
      });
      closeModal();
      showToast('Customer profile updated!', 'success');
      navigate('crm');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  window.openCustomerNotesModal = async (cId, cName) => {
    try {
      const res = await apiService.getCustomerNotes(cId);
      const notes = res.data || [];

      openModal(`Engagement Timeline: ${cName}`, `
        <div class="space-y-4 max-w-lg">
          <form onsubmit="handleSaveCustomerNote(event, ${cId}, '${cName.replace(/'/g, "\\'")}')" class="space-y-2 border-b border-slate-800 pb-4">
            <label class="text-[10px] text-gray-400">Add Communication Note / Internal Activity</label>
            <textarea id="noteContent" rows="3" placeholder="Enter notes regarding client meeting, call history, or requirements..." required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#f34b7d]"></textarea>
            <button type="submit" class="pink-btn px-4 py-2 rounded-xl text-xs font-bold w-full">Save Engagement Note</button>
          </form>

          <div class="space-y-2 max-h-60 overflow-y-auto">
            <h4 class="text-xs font-bold text-gray-400">Activity History (${notes.length})</h4>
            ${notes.length === 0 ? '<p class="text-xs text-gray-500 py-3 text-center">No notes recorded for this customer.</p>' : notes.map(n => `
              <div class="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                <div class="flex justify-between items-center text-[10px] text-gray-400">
                  <span class="font-bold text-slate-300">${n.author_name || 'System Staff'}</span>
                  <span>${new Date(n.created_at).toLocaleString()}</span>
                </div>
                <p class="text-xs text-gray-200 leading-relaxed">${n.content}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `, 'max-w-lg');
    } catch (err) {
      showToast('Failed to load customer notes: ' + err.message, 'error');
    }
  };

  window.handleSaveCustomerNote = async (e, customerId, customerName) => {
    e.preventDefault();
    const content = document.getElementById('noteContent').value;
    try {
      await apiService.addCustomerNote(customerId, content);
      showToast('Engagement note saved.', 'success');
      openCustomerNotesModal(customerId, customerName);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  window.deleteCustomerAccount = async (id) => {
    if (!confirm('Are you sure you want to delete this customer profile?')) return;
    try {
      await apiService.deleteCustomer(id);
      showToast('Customer profile deleted.', 'success');
      navigate('crm');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  window.openNewLeadModal = () => {
    if (customers.length === 0) {
      openModal('Create Deal Pipeline', `
        <div class="space-y-4 text-center py-2">
          <div class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs">
            <p class="font-bold">No registered customers found.</p>
            <p class="mt-1 text-[11px]">Please create a client account profile first before opening a deal pipeline.</p>
          </div>
          <button onclick="closeModal(); openNewCustomerModal();" class="pink-btn w-full py-2.5 rounded-xl font-bold text-xs">
            + Add Customer Account First
          </button>
        </div>
      `);
      return;
    }

    openModal('Create Deal Pipeline', `
      <form onsubmit="handleCreateLead(event)" class="space-y-3">
        <div>
          <label class="text-[10px] text-gray-400">Select Customer Account *</label>
          <select id="lCustId" required class="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
            <option value="" disabled selected>-- Select Customer Account --</option>
            ${customers.map(c => `<option value="${c.id}">${c.name} (${c.company_name || 'Individual'})</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="text-[10px] text-gray-400">Deal Title *</label>
          <input type="text" id="lTitle" placeholder="e.g. Q4 Enterprise Contract *" required class="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
        </div>
        <div>
          <label class="text-[10px] text-gray-400">Expected Deal Value *</label>
          <input type="number" step="0.01" id="lValue" placeholder="e.g. 5000 *" required class="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
        </div>
        <div>
          <label class="text-[10px] text-gray-400">Pipeline Stage</label>
          <select id="lStage" class="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Proposal">Proposal</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>
        </div>
        <button type="submit" class="w-full pink-btn py-2.5 rounded-xl font-bold text-xs mt-2">Create Deal Pipeline</button>
      </form>
    `);
  };

  window.handleCreateLead = async (e) => {
    e.preventDefault();
    const custId = document.getElementById('lCustId').value;
    if (!custId) {
      return showToast('Please select a valid customer account.', 'error');
    }

    try {
      await apiService.createLead({
        customer_id: parseInt(custId, 10),
        title: document.getElementById('lTitle').value,
        value: parseFloat(document.getElementById('lValue').value),
        stage: document.getElementById('lStage').value
      });
      closeModal();
      showToast('Deal lead pipeline created!', 'success');
      navigate('crm');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  window.updateLeadStage = async (leadId, newStage) => {
    try {
      await apiService.updateLeadStage(leadId, newStage);
      showToast(`Deal stage updated to ${newStage}`, 'success');
      navigate('crm');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-xl font-bold">CRM & Client Relationships</h2>
          <p class="text-xs text-gray-400">Customer profiles, segmentation, engagement logs, and active deal pipelines</p>
        </div>
        <div class="flex gap-2">
          <button onclick="openNewCustomerModal()" class="pink-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
            <i data-lucide="user-plus" class="w-4 h-4 text-white"></i> Add Customer
          </button>
          <button onclick="openNewLeadModal()" class="bg-slate-800 border border-slate-700 hover:bg-slate-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
            <i data-lucide="trending-up" class="w-4 h-4 pink-brand-text"></i> New Lead
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div class="p-4 border-b border-slate-800 font-bold text-xs">Registered Customer Directory (${customers.length})</div>
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-800/60 uppercase text-gray-400">
              <tr>
                <th class="p-4">Customer Name</th>
                <th class="p-4">Contact</th>
                <th class="p-4">Segment</th>
                <th class="p-4 font-mono">Orders</th>
                <th class="p-4 font-mono">Total Spend</th>
                <th class="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              ${customers.length === 0 ? '<tr><td colspan="6" class="p-4 text-center text-gray-500">No client accounts found. Click "+ Add Customer" above to create one.</td></tr>' : customers.map(c => `
                <tr>
                  <td class="p-4">
                    <p class="font-bold">${c.name}</p>
                    <p class="text-[10px] text-gray-400">${c.company_name || 'Individual'}</p>
                  </td>
                  <td class="p-4">${c.email}<br><span class="text-[10px] text-gray-400">${c.phone || ''}</span></td>
                  <td class="p-4"><span class="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 border border-slate-700 font-medium">${c.segment}</span></td>
                  <td class="p-4 font-mono">${c.order_count || 0}</td>
                  <td class="p-4 font-mono pink-brand-text font-bold">${formatCurrency(c.total_spent || 0)}</td>
                  <td class="p-4 text-right space-x-1">
                    <button onclick="openCustomerNotesModal(${c.id}, '${c.name.replace(/'/g, "\\'")}')" title="Timeline Notes" class="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-[11px] font-semibold text-pink-brand">
                      Notes
                    </button>
                    <button onclick='openEditCustomerModal(${JSON.stringify(c).replace(/'/g, "&#39;")})' class="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-[11px] font-semibold text-gray-300">
                      Edit
                    </button>
                    <button onclick="deleteCustomerAccount(${c.id})" class="p-1 rounded-lg bg-red-950/60 border border-red-500/30 text-red-400 hover:bg-red-900 inline-flex items-center">
                      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="glass-panel p-4 rounded-2xl border border-slate-800 space-y-4">
          <h3 class="font-bold text-xs border-b border-slate-800 pb-2">Active Deal Pipelines</h3>
          <div class="space-y-3 max-h-[500px] overflow-y-auto">
            ${leads.length === 0 ? '<p class="text-gray-500 text-center py-4 text-xs">No active deal leads.</p>' : leads.map(l => `
              <div class="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="font-bold text-xs">${l.title}</h4>
                    <p class="text-[10px] text-gray-400">${l.customer_name}</p>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold ${l.stage === 'Won' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-pink-500/20 pink-brand-text'}">${l.stage}</span>
                </div>
                <div class="flex justify-between items-center pt-1 border-t border-slate-800/60">
                  <p class="text-xs font-mono font-bold text-gray-200">${formatCurrency(l.value)}</p>
                  <select onchange="updateLeadStage(${l.id}, this.value)" class="bg-slate-800 border border-slate-700 text-[10px] rounded px-1.5 py-0.5">
                    <option value="New" ${l.stage === 'New' ? 'selected' : ''}>New</option>
                    <option value="Contacted" ${l.stage === 'Contacted' ? 'selected' : ''}>Contacted</option>
                    <option value="Proposal" ${l.stage === 'Proposal' ? 'selected' : ''}>Proposal</option>
                    <option value="Won" ${l.stage === 'Won' ? 'selected' : ''}>Won</option>
                    <option value="Lost" ${l.stage === 'Lost' ? 'selected' : ''}>Lost</option>
                  </select>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}
