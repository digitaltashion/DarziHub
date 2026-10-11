// =========================================================
// DarziHub — App bootstrap
// =========================================================

const App = (() => {
  function renderShell() {
    document.body.innerHTML = `
      <div id="app"><div id="screen-root"></div></div>
      <div class="bottom-nav glass-strong">
        <div class="nav-item" data-route="dashboard" onclick="Router.navigate('/dashboard')"><i data-lucide="layout-dashboard"></i><span>${t('navHome')}</span></div>
        <div class="nav-item" data-route="orders" onclick="Router.navigate('/orders')"><i data-lucide="scissors"></i><span>${t('navOrders')}</span></div>
        <div class="nav-item" data-route="customers" onclick="Router.navigate('/customers')"><i data-lucide="users"></i><span>${t('navCustomers')}</span></div>
        <div class="nav-item" data-route="accounts" onclick="Router.navigate('/accounts')"><i data-lucide="wallet"></i><span>${t('navAccounts')}</span></div>
        <div class="nav-item" data-route="settings" onclick="Router.navigate('/settings')"><i data-lucide="settings"></i><span>${t('navSettings')}</span></div>
      </div>`;
    if (window.lucide) lucide.createIcons();
  }

  function registerRoutes() {
    Router.register('/dashboard', { src: 'js/modules/dashboard.js', run: (p) => Dashboard.render(p) });

    Router.register('/customers', { src: 'js/modules/customers.js', run: (p) => Customers.renderList(p) });
    Router.register('/customers/new', { src: 'js/modules/customers.js', run: (p) => Customers.renderForm(p) });
    Router.register('/customers/:id/edit', { src: 'js/modules/customers.js', run: (p) => Customers.renderForm(p) });
    Router.register('/customers/:id/measure/:garment', { src: 'js/modules/customers.js', run: (p) => Customers.renderMeasure(p) });
    Router.register('/customers/:id', { src: ['js/modules/orders.js', 'js/modules/customers.js'], run: (p) => Customers.renderDetail(p) });

    Router.register('/orders', { src: 'js/modules/orders.js', run: (p) => Orders.renderList(p) });
    Router.register('/orders/new', { src: 'js/modules/orders.js', run: (p) => Orders.renderForm(p) });
    Router.register('/orders/:id/edit', { src: 'js/modules/orders.js', run: (p) => Orders.renderForm(p) });
    Router.register('/orders/:id/receipt', { src: 'js/modules/receipt.js', run: (p) => Receipt.render(p) });
    Router.register('/orders/:id', { src: 'js/modules/orders.js', run: (p) => Orders.renderDetail(p) });

    Router.register('/accounts', { src: ['js/modules/stock.js', 'js/modules/customers.js', 'js/modules/accounts.js'], run: (p) => Accounts.render(p) });
    Router.register('/settings', { src: 'js/modules/settings.js', run: (p) => SettingsScreen.render(p) });
    Router.register('/backup', { src: 'js/modules/backup.js', run: (p) => Backup.render(p) });
  }

  async function setLang(lang) {
    I18n.set(lang);
    const s = await Repo.getSettings();
    s.language = lang;
    await Repo.saveSettings(s);
    renderShell();
    Router.refresh();
  }
  function toggleLang() { setLang(I18n.lang === 'ur' ? 'en' : 'ur'); }

  async function init() {
    const s = await Repo.getSettings();
    I18n.set(localStorage.getItem('lang') || s.language || 'ur');
    if (Lock.has()) await Lock.show();
    renderShell();
    registerRoutes();
    Router.start();
    notifyToday();
  }

  // Once-a-day local notification when the app is opened (no server push)
  async function notifyToday() {
    try {
      const s = await Repo.getSettings();
      if (!s.notifyEnabled || !('Notification' in window) || Notification.permission !== 'granted') return;
      const today = todayStr();
      if (s.lastNotifyDay === today) return;
      const st = await Repo.dashboardStats();
      const parts = [
        st.dueTodayCount ? `${st.dueTodayCount} ${t('remDueToday')}` : null,
        st.trialCount ? `${st.trialCount} ${t('remTrial')}` : null,
        st.lowStock.length ? `${st.lowStock.length} ${t('remLowStock')}` : null
      ].filter(Boolean);
      if (!parts.length) return;
      const opts = { body: parts.join(' · '), icon: 'icons/icon-192.png', tag: 'darzi-daily' };
      const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
      if (reg) await reg.showNotification('DarziHub', opts); else new Notification('DarziHub', opts);
      s.lastNotifyDay = today; await Repo.saveSettings(s);
    } catch (e) { /* notifications are best-effort */ }
  }

  // Re-lock when the app has been in the background for over a minute
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hiddenAt = Date.now();
    else if (Lock.has() && hiddenAt && Date.now() - hiddenAt > 60000) Lock.show();
  });

  return { init, setLang, toggleLang };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
