async function renderSettingsPage() {
  const [branchesRes, empRes, auditRes] = await Promise.all([
    apiService.getBranches().catch(() => ({ data: [] })),
    apiService.getEmployees().catch(() => ({ data: [] })),
    apiService.getAuditLogs().catch(() => ({ data: [] }))
  ]);

  const branches = (branchesRes.data || []).sort((a, b) => (b.is_headquarters ? 1 : 0) - (a.is_headquarters ? 1 : 0));
  const employees = empRes.data || [];
  const auditLogs = auditRes.data || [];
  const user = JSON.parse(localStorage.getItem('apex_user')) || { company: 'ApexSuite Inc.', role: 'Admin' };
  const currentCurrency = localStorage.getItem('apex_currency') || 'USD';

  window.switchSettingsTab = (tab) => {
    document.querySelectorAll('.settings-tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.settings-tab-btn').forEach(el => {
      el.classList.remove('pink-btn', 'text-white');
      el.classList.add('text-gray-400', 'hover:text-white');
    });

    const activeContent = document.getElementById(`tab-${tab}`);
    const activeBtn = document.getElementById(`btn-tab-${tab}`);

    if (activeContent) activeContent.classList.remove('hidden');
    if (activeBtn) {
      activeBtn.classList.add('pink-btn', 'text-white');
      activeBtn.classList.remove('text-gray-400');
    }
    lucide.createIcons();
  };

  window.saveWorkspaceGeneralSettings = () => {
    const newComp = document.getElementById('setCompName').value;
    const newTax = document.getElementById('setTaxId').value;
    const newCurr = document.getElementById('setCurrency').value;

    user.company = newComp;
    user.tax_id = newTax;
    localStorage.setItem('apex_user', JSON.stringify(user));
    changeCurrency(newCurr);
    showToast('Workspace company profile updated!', 'success');
  };

  window.openCreateBranchModal = () => {
    openModal('Register New Branch Location', `
      <form onsubmit="handleCreateBranch(event)" class="space-y-3">
        <div>
          <label class="text-[10px] text-gray-400">Branch Name *</label>
          <input type="text" id="bName" placeholder="e.g. West Coast Outlet" required class="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
        </div>
        <div>
          <label class="text-[10px] text-gray-400">Location / Physical Address *</label>
          <input type="text" id="bLocation" placeholder="e.g. San Francisco, CA" required class="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
        </div>
        <div>
          <label class="text-[10px] text-gray-400">Branch Type *</label>
          <select id="bType" class="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
            <option value="Standard Outlet">Standard Outlet / Store</option>
            <option value="Regional Branch">Regional Branch</option>
            <option value="Headquarters (HQ)">Headquarters (HQ)</option>
          </select>
        </div>
        <button type="submit" class="w-full pink-btn py-2.5 rounded-xl font-bold text-xs mt-2">Save Branch Location</button>
      </form>
    `);
  };

  window.handleCreateBranch = async (e) => {
    e.preventDefault();
    const branchType = document.getElementById('bType').value;
    try {
      await apiService.request('/company/branches', 'POST', {
        name: document.getElementById('bName').value,
        location: document.getElementById('bLocation').value,
        branch_type: branchType,
        is_headquarters: branchType === 'Headquarters (HQ)'
      });
      closeModal();
      showToast('Branch location saved!', 'success');
      navigate('settings');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  window.openEditBranchModal = (b) => {
    openModal(`Edit Branch: ${b.name}`, `
      <form onsubmit="handleEditBranch(event, ${b.id})" class="space-y-3">
        <div>
          <label class="text-[10px] text-gray-400">Branch Name *</label>
          <input type="text" id="editBName" value="${b.name}" required class="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
        </div>
        <div>
          <label class="text-[10px] text-gray-400">Physical Address / Location *</label>
          <input type="text" id="editBLocation" value="${b.location || ''}" required class="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
        </div>
        <div>
          <label class="text-[10px] text-gray-400">Branch Type *</label>
          <select id="editBType" class="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
            <option value="Standard Outlet" ${b.branch_type === 'Standard Outlet' ? 'selected' : ''}>Standard Outlet / Store</option>
            <option value="Regional Branch" ${b.branch_type === 'Regional Branch' || (!b.is_headquarters && !b.branch_type) ? 'selected' : ''}>Regional Branch</option>
            <option value="Headquarters (HQ)" ${b.is_headquarters || b.branch_type === 'Headquarters (HQ)' ? 'selected' : ''}>Headquarters (HQ)</option>
          </select>
        </div>
        <button type="submit" class="w-full pink-btn py-2.5 rounded-xl font-bold text-xs mt-2">Update Branch Details</button>
      </form>
    `);
  };

  window.handleEditBranch = async (e, branchId) => {
    e.preventDefault();
    const branchType = document.getElementById('editBType').value;
    try {
      await apiService.request(`/company/branches/${branchId}`, 'PUT', {
        name: document.getElementById('editBName').value,
        location: document.getElementById('editBLocation').value,
        branch_type: branchType,
        is_headquarters: branchType === 'Headquarters (HQ)'
      });
      closeModal();
      showToast('Branch location updated!', 'success');
      navigate('settings');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  window.deleteBranchLocation = (branchId, branchName) => {
    openConfirmModal(
      'Delete Branch Location',
      `Are you sure you want to delete branch "${branchName}"?`,
      async () => {
        try {
          await apiService.request(`/company/branches/${branchId}`, 'DELETE');
          showToast('Branch location deleted.', 'success');
          navigate('settings');
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    );
  };

  window.openDeleteAccountConfirmModal = () => {
    openModal('Confirm Permanent Workspace Deletion', `
      <div class="space-y-4">
        <p class="text-xs text-red-300 leading-relaxed bg-red-950/40 p-3 rounded-xl border border-red-500/30">
          ⚠️ <strong>WARNING:</strong> Deleting <strong class="text-white">${user.company}</strong> will permanently purge all products, financial logs, CRM profiles, and user accounts. This action is irreversible.
        </p>
        <div>
          <label class="text-[10px] text-gray-400">Type <strong>DELETE</strong> to confirm:</label>
          <input type="text" id="confirmDeleteInput" placeholder="DELETE" class="w-full mt-1 bg-slate-900 border border-red-500/50 rounded-xl p-2 text-xs font-mono">
        </div>
        <div class="flex gap-2">
          <button onclick="closeModal()" class="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2.5 rounded-xl text-xs font-bold text-gray-300">
            Cancel
          </button>
          <button onclick="executeAccountDeletion()" class="flex-1 bg-red-950 hover:bg-red-900 border border-red-500/50 text-red-200 py-2.5 rounded-xl font-bold text-xs">
            Delete Workspace
          </button>
        </div>
      </div>
    `);
  };

  window.executeAccountDeletion = () => {
    const input = document.getElementById('confirmDeleteInput')?.value;
    if (input !== 'DELETE') {
      return showToast('Please type DELETE to confirm workspace destruction.', 'error');
    }

    apiService.request('/company/account', 'DELETE')
      .then(() => {
        closeModal();
        showToast('Company workspace deleted.', 'success');
        logout();
      })
      .catch(err => {
        closeModal();
        showToast(err.message, 'error');
      });
  };

  window.openCreateEmployeeModal = () => {
    openModal('Create Employee Account', `
      <form onsubmit="handleCreateEmployee(event)" class="space-y-3">
        <input type="text" id="eName" placeholder="Full Name *" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
        <input type="email" id="eEmail" placeholder="Email Address *" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
        <input type="password" id="ePass" placeholder="Password *" required class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
        <div class="grid grid-cols-2 gap-2">
          <select id="eRole" class="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
            <option value="Employee">Employee</option>
            <option value="Manager">Manager</option>
            <option value="Admin">Admin</option>
          </select>
          <input type="text" id="eDept" placeholder="Department" class="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
        </div>
        <button type="submit" class="w-full pink-btn py-2.5 rounded-xl font-bold text-xs mt-2">Create Employee</button>
      </form>
    `);
  };

  window.handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      await apiService.createEmployee({
        name: document.getElementById('eName').value,
        email: document.getElementById('eEmail').value,
        password: document.getElementById('ePass').value,
        role: document.getElementById('eRole').value,
        department: document.getElementById('eDept').value
      });
      closeModal();
      showToast('Employee user created!', 'success');
      navigate('settings');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  window.deleteEmployeeAccount = (id) => {
    openConfirmModal(
      'Remove Employee Account',
      'Are you sure you want to remove this employee account from your workspace directory?',
      async () => {
        try {
          await apiService.deleteEmployee(id);
          showToast('Employee account removed.', 'success');
          navigate('settings');
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    );
  };

  window.exportDatabaseDataCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,Module,Status,ExportDate\nInventory,Active," + new Date().toISOString() + "\nSales,Completed," + new Date().toISOString();
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ApexSuite_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV System report generated!', 'success');
  };

  return `
    <div class="space-y-6">
      <div>
        <h2 class="text-xl font-bold flex items-center gap-2">
          <i data-lucide="settings" class="w-5 h-5 pink-brand-text"></i> Workspace Administration & Settings
        </h2>
        <p class="text-xs text-gray-400 mt-1">Configure company profiles, multi-branch hierarchy, employee permissions, and system security logs</p>
      </div>

      <div class="flex gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold overflow-x-auto">
        <button id="btn-tab-general" onclick="switchSettingsTab('general')" class="settings-tab-btn px-4 py-2 rounded-xl pink-btn text-white flex items-center gap-2">
          <i data-lucide="sliders" class="w-4 h-4"></i> Company Details
        </button>
        <button id="btn-tab-branches" onclick="switchSettingsTab('branches')" class="settings-tab-btn px-4 py-2 rounded-xl text-gray-400 hover:text-white flex items-center gap-2">
          <i data-lucide="building-2" class="w-4 h-4"></i> Branch Network (${branches.length})
        </button>
        <button id="btn-tab-employees" onclick="switchSettingsTab('employees')" class="settings-tab-btn px-4 py-2 rounded-xl text-gray-400 hover:text-white flex items-center gap-2">
          <i data-lucide="users" class="w-4 h-4"></i> Employees (${employees.length})
        </button>
        <button id="btn-tab-audit" onclick="switchSettingsTab('audit')" class="settings-tab-btn px-4 py-2 rounded-xl text-gray-400 hover:text-white flex items-center gap-2">
          <i data-lucide="shield-alert" class="w-4 h-4"></i> Audit Trail
        </button>
        <button id="btn-tab-export" onclick="switchSettingsTab('export')" class="settings-tab-btn px-4 py-2 rounded-xl text-gray-400 hover:text-white flex items-center gap-2">
          <i data-lucide="download" class="w-4 h-4"></i> Data Export
        </button>
        <button id="btn-tab-danger" onclick="switchSettingsTab('danger')" class="settings-tab-btn px-4 py-2 rounded-xl text-red-400 hover:text-red-300 flex items-center gap-2">
          <i data-lucide="trash-2" class="w-4 h-4"></i> Danger Zone
        </button>
      </div>

      <!-- Tab 1: General Profile -->
      <div id="tab-general" class="settings-tab-content glass-panel p-6 rounded-2xl border border-slate-800 max-w-2xl space-y-4">
        <h3 class="font-bold text-sm border-b border-slate-800 pb-2">Workspace Profile</h3>
        <div class="space-y-3">
          <div>
            <label class="text-xs text-gray-400">Company Name *</label>
            <input type="text" id="setCompName" value="${user.company}" class="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs">
          </div>
          <div>
            <label class="text-xs text-gray-400">Tax Identification Number (Tax ID)</label>
            <input type="text" id="setTaxId" value="${user.tax_id || 'TAX-998877'}" class="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs font-mono">
          </div>
          <div>
            <label class="text-xs text-gray-400">Default Currency *</label>
            <select id="setCurrency" class="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs font-mono font-bold">
              <option value="USD" ${currentCurrency === 'USD' ? 'selected' : ''}>USD ($) - US Dollar</option>
              <option value="NGN" ${currentCurrency === 'NGN' ? 'selected' : ''}>NGN (₦) - Nigerian Naira</option>
              <option value="GBP" ${currentCurrency === 'GBP' ? 'selected' : ''}>GBP (£) - British Pound</option>
              <option value="EUR" ${currentCurrency === 'EUR' ? 'selected' : ''}>EUR (€) - Euro</option>
              <option value="CAD" ${currentCurrency === 'CAD' ? 'selected' : ''}>CAD (C$) - Canadian Dollar</option>
            </select>
          </div>
          <button onclick="saveWorkspaceGeneralSettings()" class="pink-btn px-5 py-2.5 rounded-xl font-bold text-xs pink-glow mt-2">Save Profile Changes</button>
        </div>
      </div>

      <!-- Tab 2: Branches -->
      <div id="tab-branches" class="settings-tab-content glass-panel rounded-2xl border border-slate-800 overflow-hidden hidden">
        <div class="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 class="font-bold text-xs">Company Branch Locations</h3>
          <button onclick="openCreateBranchModal()" class="pink-btn px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <i data-lucide="plus-circle" class="w-4 h-4 text-white"></i> Add Branch
          </button>
        </div>
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-800/60 uppercase text-gray-400">
            <tr><th class="p-4">Branch Name</th><th class="p-4">Location</th><th class="p-4">Type</th><th class="p-4 font-mono">Date Registered</th><th class="p-4 text-right">Action</th></tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            ${branches.map(b => `
              <tr>
                <td class="p-4 font-bold flex items-center gap-2">
                  <i data-lucide="building" class="w-4 h-4 pink-brand-text"></i> ${b.name}
                </td>
                <td class="p-4 text-gray-300">${b.location || 'Primary Location'}</td>
                <td class="p-4">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold ${b.is_headquarters ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-gray-400'}">
                    ${b.is_headquarters ? 'Headquarters (HQ)' : (b.branch_type || 'Regional Branch')}
                  </span>
                </td>
                <td class="p-4 font-mono text-gray-400">${new Date(b.created_at).toLocaleDateString()}</td>
                <td class="p-4 text-right space-x-1">
                  <button onclick='openEditBranchModal(${JSON.stringify(b).replace(/'/g, "&#39;")})' class="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-[11px] font-semibold text-gray-300">
                    Edit
                  </button>
                  ${!b.is_headquarters ? `
                    <button onclick="deleteBranchLocation(${b.id}, '${b.name.replace(/'/g, "\\'")}')" class="p-1.5 rounded-lg bg-red-950/60 border border-red-500/30 text-red-400 hover:bg-red-900 inline-flex items-center">
                      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                  ` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Tab 3: Employees -->
      <div id="tab-employees" class="settings-tab-content glass-panel rounded-2xl border border-slate-800 overflow-hidden hidden">
        <div class="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 class="font-bold text-xs">Employee Directory & Access Roles</h3>
          <button onclick="openCreateEmployeeModal()" class="pink-btn px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <i data-lucide="user-plus" class="w-4 h-4 text-white"></i> Add Employee
          </button>
        </div>
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-800/60 uppercase text-gray-400">
            <tr><th class="p-4">Employee Name</th><th class="p-4">Email</th><th class="p-4">Role</th><th class="p-4">Department</th><th class="p-4 text-right">Action</th></tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            ${employees.map(e => `
              <tr>
                <td class="p-4 font-bold text-slate-200">${e.name}</td>
                <td class="p-4 text-gray-400">${e.email}</td>
                <td class="p-4">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold ${e.role === 'Admin' ? 'bg-pink-500/20 pink-brand-text' : 'bg-slate-800 text-slate-300'}">
                    ${e.role}
                  </span>
                </td>
                <td class="p-4 text-gray-300">${e.department || 'General'}</td>
                <td class="p-4 text-right">
                  <button onclick="deleteEmployeeAccount(${e.id})" class="p-1 rounded-lg bg-red-950/60 border border-red-500/30 text-red-400 hover:bg-red-900">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Tab 4: Audit Logs -->
      <div id="tab-audit" class="settings-tab-content glass-panel rounded-2xl border border-slate-800 overflow-hidden hidden">
        <div class="p-4 border-b border-slate-800 font-bold text-xs">Workspace Security Audit Logs</div>
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-800/60 uppercase text-gray-400">
            <tr><th class="p-4">Timestamp</th><th class="p-4">User</th><th class="p-4">Action</th><th class="p-4">IP Address</th></tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            ${auditLogs.length === 0 ? '<tr><td colspan="4" class="p-4 text-center text-gray-500">No activity logs found.</td></tr>' : auditLogs.map(a => `
              <tr>
                <td class="p-4 font-mono text-gray-400">${new Date(a.timestamp).toLocaleString()}</td>
                <td class="p-4 font-bold">${a.user_name || 'System'}</td>
                <td class="p-4"><span class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 border border-slate-700 pink-brand-text">${a.action}</span></td>
                <td class="p-4 font-mono text-gray-400">${a.ip_address || '127.0.0.1'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Tab 5: Data Export -->
      <div id="tab-export" class="settings-tab-content glass-panel p-6 rounded-2xl border border-slate-800 max-w-2xl space-y-4 hidden">
        <h3 class="font-bold text-sm border-b border-slate-800 pb-2">Data Backup & Telemetry Export</h3>
        <p class="text-xs text-gray-400 leading-relaxed">Export inventory catalogs, customer registries, and finance ledger balances to a standard raw CSV file for external reporting or offline backups.</p>
        <button onclick="exportDatabaseDataCSV()" class="pink-btn px-5 py-2.5 rounded-xl font-bold text-xs pink-glow flex items-center gap-2">
          <i data-lucide="download" class="w-4 h-4 text-white"></i> Export System Telemetry (CSV)
        </button>
      </div>

      <!-- Tab 6: Danger Zone -->
      <div id="tab-danger" class="settings-tab-content glass-panel p-6 rounded-2xl border border-slate-800 max-w-2xl space-y-4 hidden">
        <h3 class="font-bold text-sm text-red-400 border-b border-slate-800 pb-2 flex items-center gap-1.5">
          <i data-lucide="alert-octagon" class="w-4 h-4"></i> Danger Zone: Account Destruction
        </h3>
        <p class="text-xs text-gray-400 leading-relaxed">Permanently delete your company account workspace, wiping all products, CRM records, and financial entries. This action cannot be undone.</p>
        <button onclick="openDeleteAccountConfirmModal()" class="bg-red-950 hover:bg-red-900 border border-red-500/50 text-red-200 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2">
          <i data-lucide="trash-2" class="w-4 h-4"></i> Delete Company Workspace Permanently
        </button>
      </div>
    </div>
  `;
}
