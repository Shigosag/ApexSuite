function renderSidebar(activePage = 'dashboard') {
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
    <aside id="appSidebar" class="${isCollapsed ? 'w-20' : 'w-60'} glass-panel border-r border-slate-800/80 p-3 space-y-2 sticky top-[69px] h-[calc(100vh-69px)] shrink-0 transition-all duration-300 overflow-hidden">
      <button onclick="navigate('dashboard')" title="Dashboard" class="${getNavClass('dashboard')}">
        <i data-lucide="layout-dashboard" class="${getIconClass('dashboard')}"></i>
        <span class="${isCollapsed ? 'hidden' : 'inline'} truncate">Dashboard</span>
      </button>
      <button onclick="navigate('crm')" title="CRM & Clients" class="${getNavClass('crm')}">
        <i data-lucide="users" class="${getIconClass('crm')}"></i>
        <span class="${isCollapsed ? 'hidden' : 'inline'} truncate">CRM & Clients</span>
      </button>
      <button onclick="navigate('inventory')" title="Inventory" class="${getNavClass('inventory')}">
        <i data-lucide="package" class="${getIconClass('inventory')}"></i>
        <span class="${isCollapsed ? 'hidden' : 'inline'} truncate">Inventory</span>
      </button>
      <button onclick="navigate('pos')" title="POS Checkout" class="${getNavClass('pos')}">
        <i data-lucide="shopping-cart" class="${getIconClass('pos')}"></i>
        <span class="${isCollapsed ? 'hidden' : 'inline'} truncate">POS Checkout</span>
      </button>
      <button onclick="navigate('finance')" title="Finance" class="${getNavClass('finance')}">
        <i data-lucide="dollar-sign" class="${getIconClass('finance')}"></i>
        <span class="${isCollapsed ? 'hidden' : 'inline'} truncate">Finance</span>
      </button>
      <button onclick="navigate('ai')" title="AI Assistant" class="${getNavClass('ai')}">
        <i data-lucide="sparkles" class="${getIconClass('ai')}"></i>
        <span class="${isCollapsed ? 'hidden' : 'inline'} truncate">AI Assistant</span>
      </button>
      <button onclick="navigate('settings')" title="Settings" class="${getNavClass('settings')}">
        <i data-lucide="settings" class="${getIconClass('settings')}"></i>
        <span class="${isCollapsed ? 'hidden' : 'inline'} truncate">Settings</span>
      </button>
    </aside>
  `;
}
