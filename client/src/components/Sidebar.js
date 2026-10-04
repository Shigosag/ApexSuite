function renderSidebar(activePage = 'dashboard') {
  const user = JSON.parse(localStorage.getItem('apex_user')) || { name: 'Admin', role: 'Admin' };
  const storedState = localStorage.getItem('apex_sidebar_collapsed');
  const isCollapsed = storedState !== null 
    ? storedState === 'true' 
    : window.innerWidth < 768;

  const getNavClass = (page) => {
    return activePage === page
      ? 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold pink-btn pink-glow transition-all text-white'
      : 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-slate-800/50 transition-all';
  };

  const getIconClass = (page) => {
    return activePage === page ? 'w-4 h-4 shrink-0 text-white' : 'w-4 h-4 shrink-0';
  };

  return `
    <!-- Mobile Backdrop: Click outside to close -->
    <div id="sidebarBackdrop" onclick="closeMobileSidebar()" class="${isCollapsed ? 'hidden' : 'block md:hidden'} fixed inset-0 bg-black/70 backdrop-blur-sm z-30 transition-opacity"></div>

    <!-- Sidebar Drawer: Stays below header, fits 100% of visible flex height -->
    <aside id="appSidebar" class="${isCollapsed ? 'hidden md:flex md:w-20' : 'flex absolute md:relative z-30 inset-y-0 left-0 w-64 shadow-2xl md:shadow-none'} glass-panel border-r border-slate-800/80 p-3 flex-col justify-between h-full shrink-0 transition-all duration-300 overflow-hidden">
      <!-- Navigation Links (Scrollable if screen is short) -->
      <div class="space-y-1.5 overflow-y-auto flex-1 pr-1">
        <button onclick="handleNavClick('dashboard')" title="Dashboard" class="${getNavClass('dashboard')}">
          <i data-lucide="layout-dashboard" class="${getIconClass('dashboard')}"></i>
          <span class="truncate">Dashboard</span>
        </button>
        <button onclick="handleNavClick('crm')" title="CRM & Clients" class="${getNavClass('crm')}">
          <i data-lucide="users" class="${getIconClass('crm')}"></i>
          <span class="truncate">CRM & Clients</span>
        </button>
        <button onclick="handleNavClick('inventory')" title="Inventory" class="${getNavClass('inventory')}">
          <i data-lucide="package" class="${getIconClass('inventory')}"></i>
          <span class="truncate">Inventory</span>
        </button>
        <button onclick="handleNavClick('pos')" title="POS Checkout" class="${getNavClass('pos')}">
          <i data-lucide="shopping-cart" class="${getIconClass('pos')}"></i>
          <span class="truncate">POS Checkout</span>
        </button>
        <button onclick="handleNavClick('finance')" title="Finance" class="${getNavClass('finance')}">
          <i data-lucide="dollar-sign" class="${getIconClass('finance')}"></i>
          <span class="truncate">Finance</span>
        </button>
        <button onclick="handleNavClick('ai')" title="AI Assistant" class="${getNavClass('ai')}">
          <i data-lucide="sparkles" class="${getIconClass('ai')}"></i>
          <span class="truncate">AI Assistant</span>
        </button>
        <button onclick="handleNavClick('settings')" title="Settings" class="${getNavClass('settings')}">
          <i data-lucide="settings" class="${getIconClass('settings')}"></i>
          <span class="truncate">Settings</span>
        </button>
      </div>

      <!-- Mobile User Info & Visible Logout Button -->
      <div class="pt-3 pb-2 border-t border-slate-800/80 shrink-0 space-y-2 md:hidden">
        <div class="px-3 py-2 bg-slate-900/90 rounded-xl border border-slate-800">
          <p class="text-xs font-bold text-white truncate">${user.name}</p>
          <span class="text-[10px] pink-brand-text font-bold uppercase tracking-wider">${user.role}</span>
        </div>
        <button onclick="logout()" class="w-full py-2.5 text-xs text-red-300 font-bold bg-red-950/80 border border-red-500/30 rounded-xl hover:bg-red-900 transition-all flex items-center justify-center gap-2">
          <i data-lucide="log-out" class="w-4 h-4 text-red-400"></i> Logout
        </button>
      </div>
    </aside>
  `;
}
