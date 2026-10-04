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
    <!-- Mobile Backdrop Overlay: Clicking outside closes sidebar -->
    <div id="sidebarBackdrop" onclick="closeMobileSidebar()" class="${isCollapsed ? 'hidden' : 'block md:hidden'} fixed inset-0 bg-black/60 backdrop-blur-xs z-30 transition-opacity"></div>

    <aside id="appSidebar" class="${isCollapsed ? 'hidden md:flex md:w-20' : 'flex fixed md:relative z-40 top-[65px] md:top-0 bottom-0 left-0 w-64'} glass-panel border-r border-slate-800/80 p-3 flex-col justify-between h-[calc(100vh-65px)] md:h-full shrink-0 transition-all duration-300 overflow-y-auto">
      <div class="space-y-2 pt-2">
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

      <!-- Mobile User & Logout Footer -->
      <div class="pt-4 border-t border-slate-800/80 space-y-2 md:hidden">
        <div class="px-3 py-2 bg-slate-900/80 rounded-xl border border-slate-800">
          <p class="text-xs font-bold text-white truncate">${user.name}</p>
          <span class="text-[10px] pink-brand-text font-bold uppercase tracking-wider">${user.role}</span>
        </div>
        <button onclick="logout()" class="w-full py-2 text-xs text-red-400 font-semibold bg-red-950/40 border border-red-500/20 rounded-xl hover:bg-red-900/50 transition-all flex items-center justify-center gap-2">
          <i data-lucide="log-out" class="w-3.5 h-3.5"></i> Logout
        </button>
      </div>
    </aside>
  `;
}
