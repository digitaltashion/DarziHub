// DarziHub — Dashboard
const Dashboard = (() => {
  async function render() {
    const root = qs('#screen-root');
    root.innerHTML = loadingHtml();
    const [s, settings, custMap] = await Promise.all([Repo.dashboardStats(), Repo.getSettings(), Repo.customerMap()]);
    const shop = I18n.lang === 'ur' ? (settings.shopNameUr || settings.shopName) : (settings.shopName || settings.shopNameUr);

    root.innerHTML = `
      <div class="topbar">
        <div>
          <div class="text-faint text-sm" style="font-weight:600;">${greeting()}</div>
          <h1>${esc(shop)}</h1>
        </div>
        <div class="lang-toggle" onclick="App.toggleLang()">${I18n.lang === 'ur' ? 'EN' : 'اردو'}</div>
      </div>
      <div class="screen">
        <div class="glass card hero-card">
          <div class="hero-label">${t('pendingBalance')}</div>
          <div class="hero-value">${Fmt.money(s.receivable)}</div>
          <div class="text-faint text-sm" style="margin-top:6px;">${t('pendingBalanceHint')}</div>
        </div>

        ${s.backupDue ? `<div class="glass card banner card-tap" onclick="Router.navigate('/backup')"><i data-lucide="database-backup"></i>
          <div><div style="font-weight:700;">${t('backupDueTitle')}</div><div class="text-faint text-sm">${t('backupDueHint')}</div></div></div>` : ''}
        ${reminders(s)}

        <div class="stat-grid">
          <div class="glass card stat-card stat-tone-blue card-tap" onclick="Router.navigate('/orders')">
            <div class="icon-wrap"><i data-lucide="scissors"></i></div>
            <div class="stat-value">${s.pendingCount}</div><div class="stat-label">${t('pendingOrders')}</div>
          </div>
          <div class="glass card stat-card stat-tone-green card-tap" onclick="Router.navigate('/orders?status=ready')">
            <div class="icon-wrap"><i data-lucide="package-check"></i></div>
            <div class="stat-value">${s.readyCount}</div><div class="stat-label">${t('readyForPickup')}</div>
          </div>
          <div class="glass card stat-card stat-tone-orange card-tap" onclick="Router.navigate('/orders?status=due')">
            <div class="icon-wrap"><i data-lucide="alarm-clock"></i></div>
            <div class="stat-value">${s.dueCount}</div><div class="stat-label">${t('dueToday')}</div>
          </div>
          <div class="glass card stat-card stat-tone-violet card-tap" onclick="Router.navigate('/accounts')">
            <div class="icon-wrap"><i data-lucide="trending-up"></i></div>
            <div class="stat-value" style="font-size:21px;">${Fmt.money(s.month.income)}</div><div class="stat-label">${t('incomeThisMonth')}</div>
          </div>
        </div>

        <div class="section-label" style="display:flex; justify-content:space-between; align-items:center;">
          <span>${t('upcomingDeliveries')}</span>
          <a href="#/orders" class="text-sm" style="color:var(--c-primary-1); font-weight:700;">${t('seeAll')}</a>
        </div>
        <div class="glass card" style="padding: 6px 16px;">
          ${s.upcoming.length ? s.upcoming.map(o => Parts.orderRow(o, custMap[o.customerId])).join('') : `
            <div class="empty-state" style="padding: 30px 10px;">
              <div class="icon-wrap"><i data-lucide="scissors"></i></div>
              <h3>${t('noPending')}</h3><p>${t('noPendingHint')}</p>
            </div>`}
        </div>

        <div class="section-label">${t('quickActions')}</div>
        <div style="display:flex; gap:10px; margin-bottom:10px;">
          <button class="btn btn-primary btn-block" onclick="Router.navigate('/orders/new')"><i data-lucide="plus"></i> ${t('newOrder')}</button>
          <button class="btn btn-ghost btn-block" onclick="Router.navigate('/customers/new')"><i data-lucide="user-plus"></i> ${t('newCustomer')}</button>
        </div>
        <div style="display:flex; gap:10px;">
          <button class="btn btn-ghost btn-block" onclick="Router.navigate('/accounts?tab=khata')"><i data-lucide="banknote"></i> ${t('khata')}</button>
          <button class="btn btn-ghost btn-block" onclick="Router.navigate('/accounts?tab=expenses&add=1')"><i data-lucide="receipt"></i> ${t('addExpense')}</button>
        </div>
      </div>`;
    if (window.lucide) lucide.createIcons();
  }

  function reminders(s) {
    const rows = [
      [s.dueTodayCount, 'alarm-clock', 'remDueToday', '/orders?status=due', true],
      [s.dueTomorrowCount, 'calendar-clock', 'remDueTomorrow', '/orders', false],
      [s.trialCount, 'ruler', 'remTrial', '/orders', false],
      [s.urgentCount, 'flame', 'remUrgent', '/orders', true],
      [s.lowStock.length, 'package', 'remLowStock', '/accounts?tab=stock', true]
    ].filter(r => r[0] > 0);
    if (!rows.length) return '';
    return `<div class="section-label" style="margin-top:6px;">${t('reminders')}</div>
      <div class="glass card" style="padding: 4px 16px;">${rows.map(([n, icon, key, href, hot]) => `
        <div class="list-item card-tap" onclick="Router.navigate('${href}')">
          <i data-lucide="${icon}" style="width:20px; height:20px; color:${hot ? 'var(--c-danger)' : 'var(--c-primary-1)'};"></i>
          <div class="li-body"><div class="li-title" style="font-size:14.5px;">${t(key)}</div></div>
          <div style="font-weight:800;">${n}</div></div>`).join('')}</div>`;
  }

  function greeting() {
    const h = new Date().getHours();
    return h < 12 ? t('goodMorning') : h < 17 ? t('goodAfternoon') : t('goodEvening');
  }
  return { render };
})();
