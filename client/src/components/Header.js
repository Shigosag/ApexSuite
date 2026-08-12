function renderHeader() {
  const user = JSON.parse(localStorage.getItem('apex_user')) || { name: 'Segun Arulogun Gabriel', role: 'Admin' };
  const currentCurrency = localStorage.getItem('apex_currency') || 'USD';

  setTimeout(async () => {
    try {
      const res = await apiService.getNotifications();
      const unreadList = (res.data || []).filter(n => !n.is_read);
      const counter = document.getElementById('notifBadgeCounter');
      if (counter) {
        if (unreadList.length > 0) {
          counter.innerText = unreadList.length > 9 ? '9+' : unreadList.length;
          counter.classList.remove('hidden');
        } else {
          counter.classList.add('hidden');
        }
      }
    } catch (err) {
      console.error('Notification count check failed:', err.message);
    }
  }, 100);

  window.toggleNotificationPopover = async () => {
    const popover = document.getElementById('notifPopover');
    if (!popover) return;

    if (popover.classList.contains('hidden')) {
      popover.classList.remove('hidden');
      try {
        const res = await apiService.getNotifications();
        const list = res.data || [];
        const container = document.getElementById('notifListContainer');
        container.innerHTML = list.length === 0 
          ? '<p class="text-xs text-gray-500 text-center py-4">No notifications found.</p>'
          : list.map(n => `
              <div class="p-2.5 rounded-xl border border-slate-800 space-y-1 ${n.is_read ? 'bg-slate-900/40 opacity-70' : 'bg-slate-900/90 border-pink-500/30'}">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-xs ${n.type === 'warning' ? 'text-amber-400' : 'pink-brand-text'}">${n.title}</span>
                  <span class="text-[9px] text-gray-500">${new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <p class="text-[11px] text-gray-300">${n.message}</p>
              </div>
            `).join('');
      } catch (err) {
        console.error('Failed to load notifications:', err.message);
      }
    } else {
      popover.classList.add('hidden');
    }
  };

  window.markAllNotificationsRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      const counter = document.getElementById('notifBadgeCounter');
      if (counter) counter.classList.add('hidden');
      showToast('Notifications cleared.', 'success');
      toggleNotificationPopover();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return `
    <header class="sticky top-0 z-40 glass-panel px-6 py-3.5 border-b border-slate-800/80 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <button onclick="toggleSidebar()" title="Toggle Navigation" class="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60 hover:border-[#f34b7d] transition-all">
          <i data-lucide="menu" class="w-5 h-5"></i>
        </button>

        <div class="p-2 rounded-xl bg-[#f34b7d] text-white pink-glow">
          <i data-lucide="shield-check" class="w-5 h-5"></i>
        </div>
        <div>
          <h1 class="font-bold text-lg tracking-tight">Apex<span class="pink-brand-text">Suite</span></h1>
          <p class="text-[10px] text-gray-400">Powered by <span class="pink-brand-text font-bold">Shigosag</span></p>
        </div>
      </div>

      <div class="flex items-center space-x-3 relative">
        <!-- Notification Wrapper -->
        <div class="relative inline-block">
          <button onclick="toggleNotificationPopover()" title="Notifications" class="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60 hover:border-[#f34b7d] transition-all relative">
            <i data-lucide="bell" class="w-4 h-4"></i>
            <span id="notifBadgeCounter" class="hidden absolute -top-1.5 -right-1.5 bg-[#f34b7d] text-white text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-lg">0</span>
          </button>

          <!-- Anchored Popover: Left on Mobile, Right on Desktop -->
          <div id="notifPopover" class="hidden absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] glass-panel p-4 rounded-2xl border border-slate-700 shadow-2xl space-y-3 z-50"
            <div class="flex justify-between items-center border-b border-slate-800 pb-2">
              <h4 class="font-bold text-xs text-white">System Notifications</h4>
              <button onclick="markAllNotificationsRead()" class="text-[10px] pink-brand-text hover:underline">Mark all read</button>
            </div>
            <div id="notifListContainer" class="space-y-2 max-h-64 overflow-y-auto break-words"></div>
          </div>
        </div>

        <select onchange="changeCurrency(this.value)" class="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs font-mono font-bold text-pink-brand focus:outline-none cursor-pointer">
          <option value="USD" ${currentCurrency === 'USD' ? 'selected' : ''}>USD ($)</option>
          <option value="NGN" ${currentCurrency === 'NGN' ? 'selected' : ''}>NGN (₦)</option>
          <option value="GBP" ${currentCurrency === 'GBP' ? 'selected' : ''}>GBP (£)</option>
          <option value="EUR" ${currentCurrency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
          <option value="CAD" ${currentCurrency === 'CAD' ? 'selected' : ''}>CAD (C$)</option>
        </select>

        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" id="themeSwitch" onchange="toggleTheme()" class="sr-only peer">
          <div class="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#f34b7d] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
        </label>

        <button onclick="navigate('settings')" title="Workspace Settings" class="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60 hover:border-[#f34b7d] transition-all">
          <i data-lucide="settings" class="w-4 h-4"></i>
        </button>

        <span class="text-xs bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl text-slate-200 font-semibold">${user.name} (${user.role})</span>
        <button onclick="logout()" class="text-xs text-red-400 font-semibold hover:underline">Logout</button>
      </div>
    </header>
  `;
}
