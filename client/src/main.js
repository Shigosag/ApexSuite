document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('apex_token');
  if (token) {
    bootApp();
  }
  lucide.createIcons();
});

window.addEventListener('hashchange', () => {
  const page = window.location.hash.replace('#', '');
  if (page && page !== window.currentActivePage) {
    navigate(page);
  }
});

function getCurrencySymbol() {
  const curr = localStorage.getItem('apex_currency') || 'USD';
  const symbols = { 'USD': '$', 'NGN': '₦', 'GBP': '£', 'EUR': '€', 'CAD': 'C$' };
  return symbols[curr] || '$';
}

function formatCurrency(amount) {
  const val = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  const formatted = val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${getCurrencySymbol()}${formatted}`;
}

function formatNetProfitHtml(amount) {
  const val = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  const formatted = formatCurrency(Math.abs(val));

  if (val > 0) {
    return `<span class="text-emerald-400 font-bold font-mono">${formatted}</span>`;
  } else if (val < 0) {
    return `<span class="text-red-400 font-bold font-mono">-${formatted}</span>`;
  } else {
    return `<span class="text-slate-300 font-bold font-mono">${formatted}</span>`;
  }
}

function changeCurrency(newCurrency) {
  localStorage.setItem('apex_currency', newCurrency);
  const activePage = window.currentActivePage || 'dashboard';
  navigate(activePage);
}

function showAuthAlert(message) {
  const banner = document.getElementById('authAlertBanner');
  if (!banner) return;

  banner.className = 'p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 bg-red-950 border-red-500/50 text-red-200';
  banner.innerHTML = `<i data-lucide="alert-circle" class="w-4 h-4 shrink-0"></i> <span>${message}</span>`;
  banner.classList.remove('hidden');
  lucide.createIcons();
}

function clearAuthAlert() {
  const banner = document.getElementById('authAlertBanner');
  if (banner) banner.classList.add('hidden');
}

function showToast(message, type = 'error') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl flex items-center gap-2 pointer-events-auto transition-all duration-300 ${
    type === 'success' ? 'bg-emerald-950 border-emerald-500/50 text-emerald-200' : 'bg-red-950 border-red-500/50 text-red-200'
  }`;
  toast.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}" class="w-4 h-4 shrink-0"></i> <span>${message}</span>`;
  container.appendChild(toast);
  lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function togglePasswordVisibility(inputId, eyeIconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(eyeIconId);
  if (!input || !icon) return;

  if (input.type === 'password') {
    input.type = 'text';
    icon.setAttribute('data-lucide', 'eye-off');
  } else {
    input.type = 'password';
    icon.setAttribute('data-lucide', 'eye');
  }
  lucide.createIcons();
}

function openResetPasswordModal() {
  openModal('Reset Workspace Password', `
    <form onsubmit="handleResetPasswordSubmit(event)" class="space-y-3">
      <div>
        <label class="text-xs text-gray-400">Account Email *</label>
        <input type="email" id="resetEmail" placeholder="admin@acme.com" required class="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
      </div>
      <div>
        <label class="text-xs text-gray-400">New Password *</label>
        <input type="password" id="resetNewPass" placeholder="••••••••" required class="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs">
      </div>
      <button type="submit" class="pink-btn py-2.5 rounded-xl font-bold text-xs w-full">Update Password</button>
    </form>
  `);
}

async function handleResetPasswordSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('resetEmail').value;
  const pass = document.getElementById('resetNewPass').value;

  try {
    await apiService.resetPassword(email, pass);
    closeModal();
    showToast('Password updated successfully! Please log in.', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function switchAuthTab(tab) {
  clearAuthAlert();
  const loginF = document.getElementById('loginForm');
  const regF = document.getElementById('registerForm');
  const loginB = document.getElementById('tabSignInBtn');
  const regB = document.getElementById('tabSignUpBtn');

  if (tab === 'login') {
    loginF.classList.remove('hidden');
    regF.classList.add('hidden');
    if (loginB) loginB.className = 'py-2 rounded-lg bg-[#f34b7d] text-white transition-all';
    if (regB) regB.className = 'py-2 rounded-lg text-gray-400 hover:text-white transition-all';
  } else {
    loginF.classList.add('hidden');
    regF.classList.remove('hidden');
    if (regB) regB.className = 'py-2 rounded-lg bg-[#f34b7d] text-white transition-all';
    if (loginB) loginB.className = 'py-2 rounded-lg text-gray-400 hover:text-white transition-all';
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  clearAuthAlert();
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPass').value;

  try {
    const res = await apiService.login(email, pass);
    localStorage.setItem('apex_token', res.accessToken);
    localStorage.setItem('apex_user', JSON.stringify(res.user));
    bootApp();
  } catch (err) {
    showAuthAlert(err.message);
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  clearAuthAlert();
  const cName = document.getElementById('regCompany').value;
  const aName = document.getElementById('regAdminName').value;
  const email = document.getElementById('regEmail').value;
  const pass = document.getElementById('regPass').value;

  try {
    const res = await apiService.registerCompany(cName, aName, email, pass);
    if (res.accessToken && res.user) {
      localStorage.setItem('apex_token', res.accessToken);
      localStorage.setItem('apex_user', JSON.stringify(res.user));
      bootApp();
    } else {
      const loginRes = await apiService.login(email, pass);
      localStorage.setItem('apex_token', loginRes.accessToken);
      localStorage.setItem('apex_user', JSON.stringify(loginRes.user));
      bootApp();
    }
  } catch (err) {
    showAuthAlert(err.message);
  }
}

function bootApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('appLayout').classList.remove('hidden');
  document.getElementById('headerContainer').innerHTML = renderHeader();

  // Restore current page from URL hash or localStorage upon refresh
  const hashPage = window.location.hash.replace('#', '');
  const savedPage = localStorage.getItem('apex_current_page') || 'dashboard';
  const startPage = hashPage || savedPage;

  document.getElementById('sidebarContainer').innerHTML = renderSidebar(startPage);
  navigate(startPage);
}

function logout() {
  localStorage.clear();
  location.reload();
}

function toggleTheme() {
  const checked = document.getElementById('themeSwitch').checked;
  document.body.className = checked 
    ? 'light-theme min-h-screen flex flex-col font-sans' 
    : 'dark-theme min-h-screen flex flex-col font-sans';
}

function toggleSidebar() {
  const current = localStorage.getItem('apex_sidebar_collapsed') === 'true';
  localStorage.setItem('apex_sidebar_collapsed', (!current).toString());
  
  const activePage = window.currentActivePage || 'dashboard';
  document.getElementById('sidebarContainer').innerHTML = renderSidebar(activePage);
  lucide.createIcons();
}

function openModal(title, bodyHtml, sizeClass = 'max-w-md') {
  const container = document.getElementById('modalContainer');
  container.innerHTML = renderModal(title, bodyHtml, sizeClass);
  lucide.createIcons();
}

function closeModal() {
  const container = document.getElementById('modalContainer');
  container.innerHTML = '';
}

async function navigate(page) {
  window.currentActivePage = page;
  localStorage.setItem('apex_current_page', page);
  window.location.hash = page;
  
  const sidebarNavBtns = document.querySelectorAll('#appSidebar button');
  sidebarNavBtns.forEach(btn => {
    const isTarget = btn.getAttribute('onclick')?.includes(`'${page}'`);
    if (isTarget) {
      btn.className = 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold pink-btn pink-glow transition-all text-white';
    } else {
      btn.className = 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-slate-800/50 transition-all';
    }
  });

  const main = document.getElementById('mainView');
  
  try {
    if (page === 'dashboard') main.innerHTML = await renderDashboardPage();
    else if (page === 'crm') main.innerHTML = await renderCRMPage();
    else if (page === 'inventory') main.innerHTML = await renderInventoryPage();
    else if (page === 'pos') main.innerHTML = await renderPOSPage();
    else if (page === 'finance') main.innerHTML = await renderFinancePage();
    else if (page === 'ai') main.innerHTML = await renderAIPage();
    else if (page === 'settings') main.innerHTML = await renderSettingsPage();
  } catch (err) {
    showToast(`Failed to load ${page} view: ${err.message}`, 'error');
  }

  lucide.createIcons();
}
