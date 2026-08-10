function renderModal(title, content, sizeClass = 'max-w-md') {
  return `
    <div id="appModal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="glass-panel p-6 rounded-2xl w-full ${sizeClass} border border-slate-700 space-y-4 shadow-2xl">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 class="font-bold text-sm text-white">${title}</h3>
          <button onclick="closeModal()" class="p-1 rounded-lg hover:bg-slate-800 text-gray-400 hover:text-white">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
        <div>${content}</div>
      </div>
    </div>
  `;
}
