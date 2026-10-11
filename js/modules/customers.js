// DarziHub — Customers, measurements & khata
const Customers = (() => {

  // ---------------- List ----------------
  async function renderList() {
    const root = qs('#screen-root');
    root.innerHTML = loadingHtml();
    const [list, sums] = await Promise.all([Repo.listCustomers(), Repo.customerSummaries()]);

    root.innerHTML = `
      ${topbar(t('navCustomers'), { right: `<div class="icon-btn" onclick="Router.navigate('/customers/new')"><i data-lucide="plus"></i></div>` })}
      <div class="screen">
        <div class="glass search-bar"><i data-lucide="search"></i>
          <input type="text" id="cust-search" placeholder="${t('searchCustomers')}" /></div>
        <div id="cust-body">${list.length ? rows(list, sums) : emptyState('users', t('noCustomers'), t('noCustomersHint'),
          `<button class="btn btn-primary" style="margin-top:16px;" onclick="Router.navigate('/customers/new')"><i data-lucide="plus"></i> ${t('addCustomer')}</button>`)}</div>
      </div>`;
    if (window.lucide) lucide.createIcons();

    qs('#cust-search').addEventListener('input', debounce((e) => {
      const q = e.target.value.trim().toLowerCase();
      const f = !q ? list : list.filter(c => [c.name, c.phone, c.address].filter(Boolean).join(' ').toLowerCase().includes(q));
      qs('#cust-body').innerHTML = f.length ? rows(f, sums) : emptyState('search-x', t('noMatches'), t('tryDifferent'));
      if (window.lucide) lucide.createIcons();
    }, 200));
  }

  function rows(list, sums) {
    return `<div class="glass card" style="padding: 6px 16px;">${list.map(c => {
      const s = sums[c.id] || { balance: 0, orderCount: 0 };
      return `
      <div class="list-item card-tap" onclick="Router.navigate('/customers/${c.id}')">
        <div class="avatar">${esc(Fmt.initials(c.name))}</div>
        <div class="li-body">
          <div class="li-title">${esc(c.name)}</div>
          <div class="li-sub">${esc(c.phone || t('noPhone'))}${c.headId ? ' · ' + t('family') : ''}</div>
        </div>
        <div class="li-trail">
          ${s.balance > 0 ? `<div class="text-danger" style="font-weight:700; font-size:13.5px;">${Fmt.money(s.balance)}</div><div class="text-faint" style="font-size:11px;">${t('balanceDue')}</div>`
            : `<div style="font-weight:700; font-size:13.5px;">${s.orderCount}</div><div class="text-faint" style="font-size:11px;">${t('orders')}</div>`}
        </div>
      </div>`; }).join('')}</div>`;
  }

  // ---------------- Form ----------------
  async function renderForm(params) {
    const isEdit = !!params.id;
    const c = isEdit ? await Repo.getCustomer(params.id) : { gender: (params.query && params.query.gender) || 'both' };
    if (!isEdit && params.query && params.query.headId) {
      const h = await Repo.getCustomer(params.query.headId);
      if (h) { c.headId = h.id; c.phone = h.phone; c.address = h.address; }
    }
    const root = qs('#screen-root');
    const seg = (v, label) => `<button type="button" data-g="${v}" class="${(c.gender || 'both') === v ? 'active' : ''}" onclick="Customers.setGender(this,'${v}')">${label}</button>`;

    root.innerHTML = `
      ${topbar(isEdit ? t('editCustomer') : t('newCustomer'), { back: 'history' })}
      <div class="screen">
        <form id="cust-form">
          <input type="hidden" name="gender" value="${c.gender || 'both'}" />
          <input type="hidden" name="headId" value="${c.headId || ''}" />
          <div class="glass card">
            <div class="field"><label>${t('name')} *</label>
              <input type="text" name="name" required value="${esc(c.name || '')}" placeholder="${t('namePh')}" /></div>
            <div class="field"><label>${t('phone')}</label>
              <input type="tel" name="phone" value="${esc(c.phone || '')}" placeholder="03xx-xxxxxxx" /></div>
            <div class="field"><label>${t('customerType')}</label>
              <div class="segmented" id="gender-seg">${seg('gents', t('gents'))}${seg('ladies', t('ladies'))}${seg('both', t('both'))}</div></div>
            <div class="field"><label>${t('address')}</label>
              <textarea name="address" style="min-height:70px;">${esc(c.address || '')}</textarea></div>
            <div class="field" style="margin-bottom:0;"><label>${t('notes')}</label>
              <textarea name="notes" style="min-height:70px;">${esc(c.notes || '')}</textarea></div>
          </div>
          <button type="submit" class="btn btn-primary btn-block"><i data-lucide="check"></i> ${isEdit ? t('saveChanges') : t('addCustomer')}</button>
        </form>
      </div>`;
    if (window.lucide) lucide.createIcons();

    qs('#cust-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      if (!data.name.trim()) { UI.toast(t('nameRequired'), 'error'); return; }
      if (data.headId) data.headId = Number(data.headId); else delete data.headId;
      if (isEdit) { data.id = Number(params.id); data.measurements = c.measurements || {}; }
      const id = await Repo.saveCustomer(data);
      UI.toast(t('saved'), 'success');
      if (!isEdit && params.query && (params.query.next === 'order' || params.query.headId)) Router.navigate(`/orders/new?customerId=${id}`);
      else Router.navigate(`/customers/${id}`);
    });
  }
  function setGender(btn, v) {
    qsa('#gender-seg button').forEach(b => b.classList.toggle('active', b === btn));
    qs('input[name="gender"]').value = v;
  }

  // ---------------- Measurement editor ----------------
  async function renderMeasure(params) {
    const c = await Repo.getCustomer(params.id);
    const g = Garments.byKey[params.garment];
    if (!c || !g) { Router.navigate('/customers'); return; }
    const saved = (c.measurements || {})[g.key] || { values: {}, style: '' };

    qs('#screen-root').innerHTML = `
      ${topbar(esc(Garments.name(g.key)), { back: 'history' })}
      <div class="screen">
        <div class="text-faint text-sm" style="margin:0 4px 12px;">${esc(c.name)} · ${t('inches')}</div>
        <form id="m-form">
          <div class="glass card">
            <div class="m-grid">
              ${g.fields.map(f => `<div class="field"><label>${esc(Garments.fieldLabel(f))}</label>
                <input type="number" inputmode="decimal" step="0.05" min="0" name="${f}" value="${esc(saved.values[f] ?? '')}" /></div>`).join('')}
            </div>
            <div class="field" style="margin:16px 0 0;"><label>${t('styleNotes')}</label>
              <textarea name="__style" style="min-height:80px;" placeholder="${t('styleNotesPh')}">${esc(saved.style || '')}</textarea></div>
          </div>
          <button type="submit" class="btn btn-primary btn-block"><i data-lucide="check"></i> ${t('saveMeasurements')}</button>
        </form>
      </div>`;
    if (window.lucide) lucide.createIcons();

    qs('#m-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target).entries());
      const style = fd.__style || ''; delete fd.__style;
      const values = {};
      Object.entries(fd).forEach(([k, v]) => { if (String(v).trim() !== '') values[k] = v; });
      await Repo.saveMeasurement(c.id, g.key, values, style);
      UI.toast(t('saved'), 'success');
      history.back();
    });
  }

  // ---------------- Detail ----------------
  async function renderDetail(params) {
    const c = await Repo.getCustomer(params.id);
    if (!c) { Router.navigate('/customers'); return; }
    const root = qs('#screen-root');
    const [orders, sum, pays, settings, members, head] = await Promise.all([
      Repo.listOrdersForCustomer(c.id), Repo.customerSummary(c.id), Repo.listPaymentsForCustomer(c.id), Repo.getSettings(),
      Repo.listMembers(c.id), c.headId ? Repo.getCustomer(c.headId) : null]);
    const wa = waNumber(c.phone, settings.countryCode);
    const groups = Garments.groups(c.gender || 'both');
    const m = c.measurements || {};

    root.innerHTML = `
      ${topbar(t('customer'), { back: '/customers', right: `<div class="icon-btn" onclick="Customers.openActions(${c.id})"><i data-lucide="more-horizontal"></i></div>` })}
      <div class="screen">
        <div class="glass detail-header">
          <div class="avatar">${esc(Fmt.initials(c.name))}</div>
          <div style="flex:1; min-width:0;">
            <h2>${esc(c.name)}</h2>
            <div class="sub">${esc(c.phone || t('noPhone'))} · ${t(c.gender === 'gents' ? 'gents' : c.gender === 'ladies' ? 'ladies' : 'both')}</div>
            <div class="contact-actions">
              ${c.phone ? `<a class="icon-btn" href="tel:${esc(c.phone)}"><i data-lucide="phone"></i></a>` : ''}
              ${wa ? `<a class="icon-btn" href="https://wa.me/${wa}" target="_blank" rel="noopener"><i data-lucide="message-circle"></i></a>` : ''}
            </div>
          </div>
        </div>

        <div class="stat-grid">
          <div class="glass card stat-card stat-tone-blue"><div class="icon-wrap"><i data-lucide="scissors"></i></div>
            <div class="stat-value">${sum.orderCount}</div><div class="stat-label">${t('orders')}</div></div>
          <div class="glass card stat-card ${sum.balance > 0 ? 'stat-tone-orange' : 'stat-tone-green'}"><div class="icon-wrap"><i data-lucide="wallet"></i></div>
            <div class="stat-value" style="font-size:21px;">${Fmt.money(sum.balance)}</div><div class="stat-label">${t('balanceDue')}</div></div>
        </div>

        <div style="display:flex; gap:10px; margin:6px 0 4px;">
          <button class="btn btn-primary btn-block" onclick="Router.navigate('/orders/new?customerId=${c.id}')"><i data-lucide="plus"></i> ${t('newOrder')}</button>
          <button class="btn btn-ghost btn-block" onclick="Orders.openPaymentSheet(${c.id})"><i data-lucide="banknote"></i> ${t('receivePayment')}</button>
        </div>

        ${sum.balance > 0 && c.phone ? `<button class="btn btn-ghost btn-block" style="margin-top:10px;" onclick="Customers.remind(${c.id})"><i data-lucide="message-circle"></i> ${t('sendDueMsg')}</button>` : ''}

        <div class="section-label" style="display:flex; justify-content:space-between; align-items:center;">
          <span>${t('family')}</span>
          <button class="btn btn-sm btn-ghost" onclick="Router.navigate('/customers/new?headId=${head ? head.id : c.id}')"><i data-lucide="user-plus"></i> ${t('addMember')}</button>
        </div>
        <div class="glass card" style="padding: 6px 16px;">
          ${head ? `<div class="list-item card-tap" onclick="Router.navigate('/customers/${head.id}')"><div class="avatar">${esc(Fmt.initials(head.name))}</div>
            <div class="li-body"><div class="li-title">${esc(head.name)}</div><div class="li-sub">${t('familyHead')}</div></div></div>` : ''}
          ${members.map(mm => `<div class="list-item card-tap" onclick="Router.navigate('/customers/${mm.id}')"><div class="avatar">${esc(Fmt.initials(mm.name))}</div>
            <div class="li-body"><div class="li-title">${esc(mm.name)}</div></div></div>`).join('')}
          ${!head && !members.length ? `<div class="text-faint text-sm" style="padding:16px 0;">${t('noFamily')}</div>` : ''}
        </div>

        <div class="section-label">${t('measurements')}</div>
        <div class="glass card" style="padding: 6px 16px;">
          ${groups.map(gr => `
            <div class="text-faint text-sm" style="font-weight:700; padding:12px 0 2px;">${t(gr)}</div>
            ${Garments.LIST.filter(g => g.group === gr).map(g => `
              <div class="list-item card-tap" onclick="Router.navigate('/customers/${c.id}/measure/${g.key}')">
                <div class="li-body"><div class="li-title">${esc(Garments.name(g.key))}</div></div>
                ${m[g.key] ? `<span class="m-chip saved">${t('saved')}</span>` : `<span class="m-chip empty">${t('notTaken')}</span>`}
                <i data-lucide="chevron-right" class="flip" style="color:var(--c-ink-faint); width:18px;"></i>
              </div>`).join('')}`).join('')}
        </div>

        <div class="section-label">${t('orders')}</div>
        <div class="glass card" style="padding: 6px 16px;">
          ${orders.length ? orders.map(o => Parts.orderRow(o, c, false)).join('') : `<div class="text-faint text-sm" style="padding:18px 0;">${t('noOrdersYet')}</div>`}
        </div>

        <div class="section-label">${t('payments')}</div>
        <div class="glass card" style="padding: 6px 16px;">
          ${pays.length ? pays.map(p => `
            <div class="list-item card-tap" onclick="Orders.deletePayment(${p.id}, true)">
              <div class="li-body"><div class="li-title text-success">${Fmt.money(p.amount)}</div>
                <div class="li-sub">${Fmt.date(p.date, { short: true })}${p.note ? ' · ' + esc(p.note === 'advance' ? t('advance') : p.note) : ''}</div></div>
            </div>`).join('') : `<div class="text-faint text-sm" style="padding:18px 0;">${t('noPayments')}</div>`}
        </div>

        ${c.address || c.notes ? `<div class="section-label">${t('details')}</div><div class="glass card">
          ${c.address ? kv(t('address'), esc(c.address)) : ''}${c.notes ? kv(t('notes'), esc(c.notes)) : ''}</div>` : ''}
      </div>`;
    if (window.lucide) lucide.createIcons();
  }

  async function remind(id) {
    const [c, sum, settings] = await Promise.all([Repo.getCustomer(id), Repo.customerSummary(id), Repo.getSettings()]);
    const text = Msg.build('due', settings, c, null, sum.balance);
    const sheet = UI.openSheet(`
      <div class="grabber"></div><div class="sheet-title">${t('sendDueMsg')}</div>
      <div class="sheet-body"><div class="glass card" style="white-space:pre-wrap; line-height:1.9;">${esc(text)}</div></div>
      <div class="sheet-actions"><button class="btn btn-ghost btn-block" id="m-skip">${t('skip')}</button>
        <button class="btn btn-primary btn-block" id="m-send"><i data-lucide="message-circle"></i> WhatsApp</button></div>`);
    qs('#m-skip', sheet).onclick = () => UI.closeSheet();
    qs('#m-send', sheet).onclick = () => { UI.closeSheet(); Msg.open(c.phone, text, settings.countryCode); };
  }

  function openActions(id) {
    const sheet = UI.openSheet(`
      <div class="grabber"></div>
      <div class="sheet-body" style="padding-top:16px;">
        <button class="btn btn-ghost btn-block" id="a-edit" style="margin-bottom:10px;"><i data-lucide="pencil"></i> ${t('editCustomer')}</button>
        <button class="btn btn-danger btn-block" id="a-del"><i data-lucide="trash-2"></i> ${t('deleteCustomer')}</button>
      </div>`);
    qs('#a-edit', sheet).onclick = () => { UI.closeSheet(); Router.navigate(`/customers/${id}/edit`); };
    qs('#a-del', sheet).onclick = async () => {
      UI.closeSheet();
      if (!await UI.confirm(t('deleteCustomerMsg'), { danger: true, okLabel: t('delete') })) return;
      try { await Repo.deleteCustomer(id); UI.toast(t('deleted'), 'success'); Router.navigate('/customers'); }
      catch (err) { UI.toast(err.message, 'error'); }
    };
  }

  return { renderList, renderForm, renderMeasure, renderDetail, setGender, openActions, remind };
})();
