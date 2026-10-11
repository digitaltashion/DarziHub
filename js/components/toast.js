// DarziHub — Toast notifications
const Toast = (() => {
  let container;
  function ensureContainer() {
    if (!container || !container.isConnected) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }
  function show(message, type = 'default') {
    const c = ensureContainer();
    const node = document.createElement('div');
    node.className = `toast toast-${type}`;
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info';
    node.innerHTML = `<i data-lucide="${icon}"></i><span>${Fmt.escapeHtml(message)}</span>`;
    c.appendChild(node);
    if (window.lucide) lucide.createIcons();
    requestAnimationFrame(() => node.classList.add('show'));
    setTimeout(() => { node.classList.remove('show'); setTimeout(() => node.remove(), 250); }, 2800);
  }
  return { show };
})();
