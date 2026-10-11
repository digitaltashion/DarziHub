// DarziHub — Accounts: monthly summary, khata (pending balances), expenses
const Accounts = (() => {
  let ym = null; // {y, m}
  function cur() { if (!ym) { const d = new Date(); ym = { y: d.getFullYear(), m: d.getMonth() }; } return ym; }
  function shift(n) { const c = cur(); const d = new Date(c.y, c.m + n, 1); ym = { y: d.getFullYear(), m: d.getMonth() }; Router.refresh(); }

  async function render(params) {
    const tab = (params.query && params.query.tab) || 'summary';
    const root = qs('#screen-root');
    root.innerHTML = loadingHtml();
    const tabs = [['summary', t('summary')], ['khata', t('khata')], ['cash', t('cashBook')], ['expenses', t('expenses')], ['stock', t('stock')]];
    let inner = '';
    if (tab === 'summary') inner = await summary();
    else if (tab === 'khata') inner = await khata();
    else if (tab === 'cash') inner = await cash(params.query && params.query.d);
    else if (tab === 'stock') inner = await Stock.html();
    else inner = await expenses();

    root.innerHTML = `
      ${topbar(t('navAccounts'))}
      <div class="screen">
        <div class="chips no-print">${tabs.map(([v, l]) => `<div class="status-chip ${v === tab ? 'current' : ''}" onclick="Router.navigate('/accounts?tab=${v}')">${l}</div>`).join('')}</div>
        ${inner}
      </div>`;
    if (window.lucide) lucide.createIcons();
    if (tab === 'cash') cashCalc();
    if (tab === 'expenses' && params.query.add) { history.replaceState(null, '', '#/accounts?tab=expenses'); openExpenseSheet(); }
  }

  function monthNav() {
    const c = cur();
    return `<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
      <div class="icon-btn" onclick="Accounts.shift(-1)"><i data-lucide="chevron-left" class="flip"></i></div>
      <div style="font-weight:700; font-size:16px;">${Fmt.monthYear(c.y, c.m)}</div>
      <div class="icon-btn" onclick="Accounts.shift(1)"><i data-lucide="chevron-right" class="flip"></i></div></div>`;
  }

  async function summary() {
    const c = cur(); const [s, wl] = await Promise.all([Repo.monthSummary(c.y, c.m), Repo.workload(14)]);
    return `${monthNav()}
      <div class="glass card hero-card"><div class="hero-label">${t('profit')}</div>
        <div class="hero-value ${s.profit < 0 ? 'text-danger' : ''}">${Fmt.money(s.profit)}</div>
        <div class="text-faint text-sm" style="margin-top:6px;">${t('profitHint')}</div></div>
      <div class="stat-grid">
        <div class="glass card stat-card stat-tone-green"><div class="icon-wrap"><i data-lucide="banknote"></i></div>
          <div class="stat-value" style="font-size:21px;">${Fmt.money(s.income)}</div><div class="stat-label">${t('incomeReceived')}</div></div>
        <div class="glass card stat-card stat-tone-orange"><div class="icon-wrap"><i data-lucide="receipt"></i></div>
          <div class="stat-value" style="font-size:21px;">${Fmt.money(s.expenses)}</div><div class="stat-label">${t('expenses')}</div></div>
        <div class="glass card stat-card stat-tone-blue"><div class="icon-wrap"><i data-lucide="scissors"></i></div>
          <div class="stat-value">${s.orders}</div><div class="stat-label">${t('ordersTaken')}</div></div>
        <div class="glass card stat-card stat-tone-violet"><div class="icon-wrap"><i data-lucide="package-check"></i></div>
          <div class="stat-value">${s.delivered}</div><div class="stat-label">${t('delivered')}</div></div>
      </div>
      <div class="section-label">${t('garmentsStitched')}</div>
      <div class="glass card" style="padding: 6px 16px;">
        ${s.garments.length ? s.garments.map(([g, n]) => `<div class="kv-row"><span>${esc(Garments.name(g))}</span><span class="v">${n}</span></div>`).join('')
          : `<div class="text-faint text-sm" style="padding:18px 0;">${t('noData')}</div>`}
      </div>

      <div class="section-label">${t('workload')}</div>
      <div class="glass card" style="padding: 6px 16px;">
        ${wl.length ? wl.map(w => `<div class="kv-row"><span>${Fmt.date(w.date, { short: true })}${w.date === todayStr() ? ' · ' + t('today') : ''}</span>
          <span class="v ${w.pieces >= 8 ? 'text-danger' : ''}">${w.pieces} ${t('pieces')} · ${w.orders} ${t('orders')}</span></div>`).join('')
          : `<div class="text-faint text-sm" style="padding:18px 0;">${t('noData')}</div>`}
      </div>

      <div class="no-print" style="display:flex; gap:10px; margin-top:6px;">
        <button class="btn btn-ghost btn-block" onclick="Accounts.exportCsv()"><i data-lucide="file-spreadsheet"></i> CSV</button>
        <button class="btn btn-ghost btn-block" onclick="window.print()"><i data-lucide="printer"></i> ${t('print')}</button>
      </div>`;
  }

  // CSV of the selected month (BOM so Excel shows Urdu correctly)
  async function exportCsv() {
    const c = cur(); const d = await Repo.monthData(c.y, c.m);
    const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [['Type', 'Date', 'Ref', 'Customer', 'Details', 'Amount']];
    d.orders.forEach(o => rows.push(['Order', o.orderDate, o.orderNumber, (d.customers[o.customerId] || {}).name, Garments.summary(o.items, 'en') + ' [' + o.status + ']', calcOrder(o).total]));
    d.payments.forEach(p => rows.push(['Payment', p.date, p.orderId || '', (d.customers[p.customerId] || {}).name, (p.method || 'cash') + (p.note ? ' ' + p.note : ''), p.amount]));
    d.expenses.forEach(e => rows.push(['Expense', e.date, '', '', t('cat_' + e.category, 'en') + (e.note ? ' ' + e.note : ''), -Math.abs(e.amount)]));
    const csv = '\ufeff' + rows.map(r => r.map(q).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `darzihub-${c.y}-${String(c.m + 1).padStart(2, '0')}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  // ---------------- Cash book (roznamcha) ----------------
  let cashCtx = { cashIn: 0, out: 0 };
  async function cash(dateStr) {
    const d = dateStr || todayStr();
    const [x, cm] = await Promise.all([Repo.cashDayData(d), Repo.customerMap()]);
    cashCtx = { cashIn: x.cashIn, out: x.out };
    return `<div class="glass card"><div class="field" style="margin-bottom:0;"><label>${t('date')}</label>
        <input type="date" id="c-date" value="${d}" onchange="Router.navigate('/accounts?tab=cash&d=' + this.value)" /></div></div>
      <div class="glass card">
        <div class="field"><label>${t('openingCash')}</label><input type="number" inputmode="decimal" id="c-open" value="${x.opening}" oninput="Accounts.cashCalc()" /></div>
        <div class="totals-row"><span>${t('cashReceived')}</span><span class="text-success">+ ${Fmt.money(x.cashIn)}</span></div>
        <div class="totals-row"><span>${t('expenses')}</span><span class="text-danger">- ${Fmt.money(x.out)}</span></div>
        <div class="totals-row grand"><span>${t('expectedCash')}</span><span id="c-exp">—</span></div>
        <div class="totals-row"><span class="text-faint">${t('onlineReceived')}</span><span class="text-faint">${Fmt.money(x.onlineIn)}</span></div>
        <div class="field" style="margin-top:14px;"><label>${t('countedCash')}</label><input type="number" inputmode="decimal" id="c-close" value="${x.closing ?? ''}" oninput="Accounts.cashCalc()" /></div>
        <div id="c-diff" style="margin-bottom:12px; font-weight:700;"></div>
        <button class="btn btn-primary btn-block" onclick="Accounts.saveCash('${d}')"><i data-lucide="check"></i> ${t('save')}</button>
      </div>
      <div class="section-label">${t('todaysEntries')}</div>
      <div class="glass card" style="padding: 6px 16px;">
        ${x.payments.concat(x.expenses).length ? x.payments.map(p => `<div class="kv-row"><span>${esc((cm[p.customerId] || {}).name || '—')}${p.method === 'online' ? ' · ' + t('online') : ''}</span><span class="v text-success">+ ${Fmt.money(p.amount)}</span></div>`).join('')
          + x.expenses.map(e => `<div class="kv-row"><span>${t('cat_' + e.category)}${e.note ? ' · ' + esc(e.note) : ''}</span><span class="v text-danger">- ${Fmt.money(e.amount)}</span></div>`).join('')
          : `<div class="text-faint text-sm" style="padding:18px 0;">${t('noData')}</div>`}
      </div>`;
  }
  function cashCalc() {
    const open = Number((qs('#c-open') || {}).value) || 0;
    const exp = open + cashCtx.cashIn - cashCtx.out;
    if (qs('#c-exp')) qs('#c-exp').textContent = Fmt.money(exp);
    const cl = (qs('#c-close') || {}).value;
    const box = qs('#c-diff'); if (!box) return;
    if (cl === '' || cl == null) { box.textContent = ''; return; }
    const diff = Number(cl) - exp;
    box.className = diff === 0 ? 'text-success' : 'text-danger';
    box.textContent = diff === 0 ? t('cashMatches') : `${t('cashDiff')}: ${diff > 0 ? '+' : ''}${Fmt.money(diff)}`;
  }
  async function saveCash(date) {
    const cl = qs('#c-close').value;
    await Repo.saveCashDay({ date, opening: Number(qs('#c-open').value) || 0, closing: cl === '' ? null : Number(cl) });
    UI.toast(t('saved'), 'success');
  }

  async function khata() {
    const [customers, sums, settings] = await Promise.all([Repo.listCustomers(), Repo.customerSummaries(), Repo.getSettings()]);
    const list = customers.map(c => ({ c, s: sums[c.id] })).filter(x => x.s && x.s.balance > 0).sort((a, b) => b.s.balance - a.s.balance);
    const total = list.reduce((a, x) => a + x.s.balance, 0);
    return `<div class="glass card hero-card"><div class="hero-label">${t('pendingBalance')}</div>
        <div class="hero-value">${Fmt.money(total)}</div><div class="text-faint text-sm" style="margin-top:6px;">${list.length} ${t('customersOwe')}</div></div>
      <div class="glass card" style="padding: 6px 16px;">
        ${list.length ? list.map(({ c, s }) => `
          <div class="list-item card-tap" onclick="Router.navigate('/customers/${c.id}')">
            <div class="avatar">${esc(Fmt.initials(c.name))}</div>
            <div class="li-body"><div class="li-title">${esc(c.name)}</div><div class="li-sub">${esc(c.phone || '')}</div></div>
            <div class="li-trail"><div class="text-danger" style="font-weight:700;">${Fmt.money(s.balance)}</div></div>
            ${c.phone ? `<div class="icon-btn" onclick="event.stopPropagation(); Customers.remind(${c.id})"><i data-lucide="message-circle"></i></div>` : ''}
          </div>`).join('') : `<div class="text-faint text-sm" style="padding:22px 0; text-align:center;">${t('nobodyOwes')}</div>`}
      </div>`;
  }

  async function expenses() {
    const c = cur(); const list = await Repo.listExpenses(c.y, c.m);
    const total = list.reduce((a, e) => a + (Number(e.amount) || 0), 0);
    return `${monthNav()}
      <div class="glass card" style="display:flex; justify-content:space-between; align-items:center;">
        <div><div class="text-faint text-sm">${t('totalExpenses')}</div><div class="stat-value" style="font-size:22px;">${Fmt.money(total)}</div></div>
        <button class="btn btn-primary btn-sm" onclick="Accounts.openExpenseSheet()"><i data-lucide="plus"></i> ${t('addExpense')}</button>
      </div>
      <div class="glass card" style="padding: 6px 16px;">
        ${list.length ? list.map(e => `
          <div class="list-item card-tap" onclick="Accounts.deleteExpense(${e.id})">
            <div class="li-body"><div class="li-title">${t('cat_' + e.category)}</div>
              <div class="li-sub">${Fmt.date(e.date, { short: true })}${e.note ? ' · ' + esc(e.note) : ''}</div></div>
            <div class="li-trail" style="font-weight:700;">${Fmt.money(e.amount)}</div>
          </div>`).join('') : `<div class="text-faint text-sm" style="padding:22px 0; text-align:center;">${t('noExpenses')}</div>`}
      </div>`;
  }

  function openExpenseSheet() {
    const sheet = UI.openSheet(`
      <div class="grabber"></div>
      <div class="sheet-title">${t('addExpense')}</div>
      <div class="sheet-body">
        <div class="row-2">
          <div class="field"><label>${t('amount')} *</label><input type="number" inputmode="decimal" id="e-amount" min="1" /></div>
          <div class="field"><label>${t('date')}</label><input type="date" id="e-date" value="${todayStr()}" /></div>
        </div>
        <div class="field"><label>${t('category')}</label>
          <select id="e-cat">${EXPENSE_CATS.map(k => `<option value="${k}">${t('cat_' + k)}</option>`).join('')}</select></div>
        <div class="field"><label>${t('note')}</label><input type="text" id="e-note" /></div>
      </div>
      <div class="sheet-actions">
        <button class="btn btn-ghost btn-block" id="e-cancel">${t('cancel')}</button>
        <button class="btn btn-primary btn-block" id="e-save">${t('save')}</button>
      </div>`);
    qs('#e-cancel', sheet).onclick = () => UI.closeSheet();
    qs('#e-save', sheet).onclick = async () => {
      const amount = Number(qs('#e-amount', sheet).value);
      if (!(amount > 0)) { UI.toast(t('amountRequired'), 'error'); return; }
      await Repo.addExpense({ amount, date: qs('#e-date', sheet).value || todayStr(), category: qs('#e-cat', sheet).value, note: qs('#e-note', sheet).value });
      UI.closeSheet(); UI.toast(t('saved'), 'success'); Router.refresh();
    };
  }

  async function deleteExpense(id) {
    if (!await UI.confirm(t('deleteExpenseMsg'), { danger: true, okLabel: t('delete') })) return;
    await Repo.deleteExpense(id); UI.toast(t('deleted'), 'success'); Router.refresh();
  }

  return { render, shift, exportCsv, cashCalc, saveCash, openExpenseSheet, deleteExpense };
})();
