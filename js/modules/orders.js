// DarziHub — Orders, payments
const Orders = (() => {
  const FLOW = ['new', 'cutting', 'stitching', 'ready', 'delivered'];
  let draft = null; // one-shot form state kept while user jumps to measurement screen

  // ---------------- List ----------------
  async function renderList(params) {
    const root = qs('#screen-root');
    root.innerHTML = loadingHtml();
    const filter = (params.query && params.query.status) || 'pending';
    const [orders, custMap] = await Promise.all([Repo.listOrders(), Repo.customerMap()]);
    const today = todayStr();
    const test = {
      pending: o => PENDING.includes(o.status),
      due: o => PENDING.includes(o.status) && o.deliveryDate && o.deliveryDate <= today,
      all: () => true
    };
    const match = (o) => (test[filter] || (x => x.status === filter))(o);
    const chips = ['pending', 'due', 'ready', 'delivered', 'cancelled', 'all'];
    const label = (c) => t(['pending', 'due', 'all'].includes(c) ? 'f_' + c : 'st_' + c);
    let list = orders.filter(match);
    if (filter !== 'delivered' && filter !== 'all' && filter !== 'cancelled') {
      list.sort((a, b) => (a.deliveryDate || '9999').localeCompare(b.deliveryDate || '9999'));
    }

    root.innerHTML = `
      ${topbar(t('navOrders'), { right: `<div class="icon-btn" onclick="Router.navigate('/orders/new')"><i data-lucide="plus"></i></div>` })}
      <div class="screen">
        <div class="glass search-bar"><i data-lucide="search"></i>
          <input type="text" id="ord-search" placeholder="${t('searchOrders')}" /></div>
        <div class="chips">${chips.map(c => `<div class="status-chip ${c === filter ? 'current' : ''}" onclick="Router.navigate('/orders?status=${c}')">${label(c)}</div>`).join('')}</div>
        <div id="ord-body">${body(list, custMap)}</div>
      </div>`;
    if (window.lucide) lucide.createIcons();

    qs('#ord-search').addEventListener('input', debounce((e) => {
      const q = e.target.value.trim().toLowerCase();
      const f = !q ? list : list.filter(o => [o.orderNumber, (custMap[o.customerId] || {}).name, (custMap[o.customerId] || {}).phone].filter(Boolean).join(' ').toLowerCase().includes(q));
      qs('#ord-body').innerHTML = body(f, custMap);
      if (window.lucide) lucide.createIcons();
    }, 200));
  }
  function body(list, custMap) {
    if (!list.length) return emptyState('scissors', t('noOrders'), t('noOrdersHint'),
      `<button class="btn btn-primary" style="margin-top:16px;" onclick="Router.navigate('/orders/new')"><i data-lucide="plus"></i> ${t('newOrder')}</button>`);
    return `<div class="glass card" style="padding: 6px 16px;">${list.map(o => Parts.orderRow(o, custMap[o.customerId])).join('')}</div>`;
  }

  // ---------------- Form ----------------
  async function renderForm(params) {
    const isEdit = !!params.id;
    const [customers, settings] = await Promise.all([Repo.listCustomers(), Repo.getSettings()]);
    const root = qs('#screen-root');

    if (!customers.length) {
      root.innerHTML = `${topbar(t('newOrder'), { back: 'history' })}<div class="screen">${emptyState('users', t('noCustomers'), t('needCustomerFirst'),
        `<button class="btn btn-primary" style="margin-top:16px;" onclick="Router.navigate('/customers/new?next=order')"><i data-lucide="user-plus"></i> ${t('addCustomer')}</button>`)}</div>`;
      if (window.lucide) lucide.createIcons();
      return;
    }

    const rate = (g) => settings.rates && settings.rates[g] ? settings.rates[g] : '';
    let st;
    if (isEdit) st = JSON.parse(JSON.stringify(await Repo.getOrder(params.id)));
    else if (draft) st = draft;
    else st = { customerId: Number(params.query.customerId) || '', orderDate: todayStr(), deliveryDate: '', trialDate: '', urgent: false, photos: [], fabricReceived: '', fabricMeters: '', discount: '', notes: '', advance: '',
      items: [{ garment: 'qameez', qty: 1, rate: rate('qameez'), fabricAmount: '', notes: '' }] };
    draft = null;
    let custObj = customers.find(c => c.id === Number(st.customerId));

    root.innerHTML = `
      ${topbar(isEdit ? t('editOrder') : t('newOrder'), { back: 'history' })}
      <div class="screen">
        <div class="glass card">
          <div class="field"><label>${t('customer')} *</label>
            <div style="display:flex; gap:8px;">
              <select id="o-cust"><option value="">${t('selectCustomer')}</option>
                ${customers.map(c => `<option value="${c.id}" ${c.id === Number(st.customerId) ? 'selected' : ''}>${esc(c.name)}${c.phone ? ' · ' + esc(c.phone) : ''}</option>`).join('')}</select>
              <div class="icon-btn" style="flex-shrink:0;" onclick="Router.navigate('/customers/new?next=order')"><i data-lucide="user-plus"></i></div>
            </div></div>
          <div class="row-2">
            <div class="field" style="margin-bottom:0;"><label>${t('orderDate')}</label><input type="date" id="o-date" value="${esc(st.orderDate || todayStr())}" /></div>
            <div class="field" style="margin-bottom:0;"><label>${t('deliveryDate')}</label><input type="date" id="o-delivery" value="${esc(st.deliveryDate || '')}" /></div>
          </div>
          <div class="row-2" style="margin-top:12px;">
            <div class="field" style="margin-bottom:0;"><label>${t('trialDate')}</label><input type="date" id="o-trial" value="${esc(st.trialDate || '')}" /></div>
            <div class="field" style="margin-bottom:0; display:flex; align-items:flex-end;">
              <label class="check-row"><input type="checkbox" id="o-urgent" ${st.urgent ? 'checked' : ''} /> <span>${t('urgent')}</span></label></div>
          </div>
        </div>

        <div class="section-label">${t('items')}</div>
        <div id="items"></div>
        <button type="button" class="btn btn-ghost btn-block" id="add-item"><i data-lucide="plus"></i> ${t('addItem')}</button>

        <div class="section-label">${t('billing')}</div>
        <div class="glass card">
          <div class="row-2">
            <div class="field"><label>${t('discount')}</label><input type="number" inputmode="decimal" id="o-discount" min="0" value="${esc(st.discount ?? '')}" /></div>
            ${isEdit ? '<div></div>' : `<div class="field"><label>${t('advance')}</label><input type="number" inputmode="decimal" id="o-advance" min="0" value="${esc(st.advance ?? '')}" /></div>`}
          </div>
          <div id="totals"></div>
        </div>
        <div class="glass card"><div class="field" style="margin-bottom:0;"><label>${t('orderNotes')}</label>
          <textarea id="o-notes" style="min-height:70px;">${esc(st.notes || '')}</textarea></div></div>

        <div class="glass card">
          <div class="field"><label>${t('customerFabric')}</label>
            <input type="text" id="o-fabric" placeholder="${t('customerFabricPh')}" value="${esc(st.fabricReceived || '')}" /></div>
          <div class="field" style="margin-bottom:0;"><label>${t('fabricMeters')}</label>
            <input type="number" inputmode="decimal" id="o-fmeters" min="0" step="0.05" value="${esc(st.fabricMeters ?? '')}" /></div>
        </div>
        <div class="glass card">
          <div class="field" style="margin-bottom:10px;"><label>${t('photos')}</label>
            <input type="file" id="o-photo" accept="image/*" multiple />
            <div class="hint">${t('photosHint')}</div></div>
          <div class="photo-grid" id="photo-grid"></div>
        </div>

        <button type="button" class="btn btn-primary btn-block" id="o-save"><i data-lucide="check"></i> ${isEdit ? t('saveChanges') : t('saveOrder')}</button>
      </div>`;

    const totals = () => {
      const disc = Number(qs('#o-discount').value) || 0;
      const c = calcOrder({ items: st.items, discount: disc });
      const adv = isEdit ? 0 : Number((qs('#o-advance') || {}).value) || 0;
      qs('#totals').innerHTML = `
        <div class="totals-row"><span>${t('subtotal')}</span><span>${Fmt.money(c.subtotal)}</span></div>
        ${disc ? `<div class="totals-row"><span>${t('discount')}</span><span>- ${Fmt.money(disc)}</span></div>` : ''}
        <div class="totals-row grand"><span>${t('total')}</span><span>${Fmt.money(c.total)}</span></div>
        ${isEdit ? '' : `<div class="totals-row"><span>${t('balance')}</span><span class="${c.total - adv > 0 ? 'text-danger' : 'text-success'}">${Fmt.money(c.total - adv)}</span></div>`}`;
    };

    const draw = () => {
      const m = (custObj && custObj.measurements) || {};
      qs('#items').innerHTML = st.items.map((it, i) => `
        <div class="item-card">
          <div class="item-head">
            <select data-i="${i}" data-f="garment">${Garments.optionsHtml(it.garment)}</select>
            ${st.items.length > 1 ? `<button type="button" class="sched-remove" data-rm="${i}"><i data-lucide="x"></i></button>` : ''}
          </div>
          <div class="row-3">
            <div class="field" style="margin-bottom:8px;"><label>${t('qty')}</label><input type="number" inputmode="numeric" min="1" data-i="${i}" data-f="qty" value="${esc(it.qty)}" /></div>
            <div class="field" style="margin-bottom:8px;"><label>${t('stitchRate')}</label><input type="number" inputmode="decimal" min="0" data-i="${i}" data-f="rate" value="${esc(it.rate)}" /></div>
            <div class="field" style="margin-bottom:8px;"><label>${t('fabricAmount')}</label><input type="number" inputmode="decimal" min="0" data-i="${i}" data-f="fabricAmount" value="${esc(it.fabricAmount)}" /></div>
          </div>
          <input type="text" data-i="${i}" data-f="notes" placeholder="${t('itemNotesPh')}" value="${esc(it.notes || '')}" />
          ${custObj && !m[it.garment] ? `<div class="text-sm text-danger" style="margin-top:8px;">${t('noMeasurementYet')}
            <a href="javascript:void(0)" data-measure="${it.garment}" style="color:var(--c-primary-1); font-weight:700;">${t('takeNow')}</a></div>` : ''}
        </div>`).join('');
      if (window.lucide) lucide.createIcons();
      totals();
    };
    draw();

    const items = qs('#items');
    items.addEventListener('input', (e) => {
      const el = e.target; if (el.dataset.i === undefined || el.tagName === 'SELECT') return;
      st.items[el.dataset.i][el.dataset.f] = el.value; totals();
    });
    items.addEventListener('change', (e) => {
      const el = e.target;
      if (el.tagName === 'SELECT' && el.dataset.f === 'garment') {
        const it = st.items[el.dataset.i]; it.garment = el.value;
        if (rate(el.value)) it.rate = rate(el.value);
        draw();
      }
    });
    items.addEventListener('click', (e) => {
      const rm = e.target.closest('[data-rm]');
      if (rm) { st.items.splice(Number(rm.dataset.rm), 1); draw(); return; }
      const ms = e.target.closest('[data-measure]');
      if (ms) { draft = { ...collect(), items: st.items }; Router.navigate(`/customers/${custObj.id}/measure/${ms.dataset.measure}`); }
    });
    qs('#add-item').onclick = () => { st.items.push({ garment: 'qameez', qty: 1, rate: rate('qameez'), fabricAmount: '', notes: '' }); draw(); };
    qs('#o-cust').onchange = (e) => { st.customerId = Number(e.target.value) || ''; custObj = customers.find(c => c.id === st.customerId); draw(); };
    qs('#o-discount').oninput = totals;
    if (qs('#o-advance')) qs('#o-advance').oninput = totals;

    const drawPhotos = () => {
      st.photos = st.photos || [];
      qs('#photo-grid').innerHTML = st.photos.map((p, i) => `<div class="photo-thumb"><img src="${p}" alt=""><button type="button" data-ph="${i}"><i data-lucide="x"></i></button></div>`).join('');
      if (window.lucide) lucide.createIcons();
    };
    drawPhotos();
    qs('#photo-grid').addEventListener('click', (e) => {
      const b = e.target.closest('[data-ph]'); if (!b) return;
      st.photos.splice(Number(b.dataset.ph), 1); drawPhotos();
    });
    qs('#o-photo').addEventListener('change', async (e) => {
      for (const f of Array.from(e.target.files)) {
        if ((st.photos || []).length >= 6) { UI.toast(t('maxPhotos'), 'error'); break; }
        try { st.photos.push(await compressImage(f)); } catch (err) { UI.toast(t('photoFailed'), 'error'); }
      }
      e.target.value = ''; drawPhotos();
    });

    function collect() {
      return { ...st, customerId: Number(qs('#o-cust').value) || '', orderDate: qs('#o-date').value, deliveryDate: qs('#o-delivery').value,
        trialDate: qs('#o-trial').value, urgent: qs('#o-urgent').checked, fabricReceived: qs('#o-fabric').value, fabricMeters: qs('#o-fmeters').value,
        discount: qs('#o-discount').value, notes: qs('#o-notes').value, advance: qs('#o-advance') ? qs('#o-advance').value : '' };
    }

    qs('#o-save').onclick = async () => {
      const f = collect();
      if (!f.customerId) { UI.toast(t('selectCustomerErr'), 'error'); return; }
      const valid = st.items.filter(i => i.garment && Number(i.qty) > 0);
      if (!valid.length) { UI.toast(t('addItemErr'), 'error'); return; }
      const cust = customers.find(c => c.id === f.customerId);
      const snap = {};
      valid.forEach(i => { if (cust.measurements && cust.measurements[i.garment]) snap[i.garment] = cust.measurements[i.garment]; });
      const data = {
        ...(isEdit ? { id: Number(params.id), orderNumber: st.orderNumber, status: st.status, createdAt: st.createdAt } : {}),
        customerId: f.customerId, orderDate: f.orderDate || todayStr(), deliveryDate: f.deliveryDate,
        items: valid.map(i => ({ garment: i.garment, qty: Number(i.qty), rate: Number(i.rate) || 0, fabricAmount: Number(i.fabricAmount) || 0, notes: i.notes || '' })),
        discount: Number(f.discount) || 0, notes: f.notes, measurements: snap,
        trialDate: f.trialDate || '', urgent: !!f.urgent, photos: st.photos || [], fabricReceived: f.fabricReceived || '', fabricMeters: Number(f.fabricMeters) || 0
      };
      const id = await Repo.saveOrder(data, isEdit ? 0 : Number(f.advance) || 0);
      UI.toast(t('saved'), 'success');
      Router.navigate(`/orders/${id}`);
    };
  }

  // ---------------- Detail ----------------
  async function renderDetail(params) {
    const o = await Repo.getOrder(params.id);
    if (!o) { Router.navigate('/orders'); return; }
    const [c, pays] = await Promise.all([Repo.getCustomer(o.customerId), Repo.listPaymentsForOrder(o.id)]);
    const calc = calcOrder(o);
    const paid = pays.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const balance = calc.total - paid;

    qs('#screen-root').innerHTML = `
      ${topbar(esc(o.orderNumber), { back: '/orders', right: `<div class="icon-btn" onclick="Orders.openActions(${o.id})"><i data-lucide="more-horizontal"></i></div>` })}
      <div class="screen">
        <div class="glass detail-header" style="cursor:pointer;" onclick="Router.navigate('/customers/${o.customerId}')">
          <div class="avatar">${esc(Fmt.initials(c ? c.name : '?'))}</div>
          <div style="flex:1; min-width:0;">
            <h2>${esc(c ? c.name : '—')}</h2>
            <div class="sub">${esc(c && c.phone || '')}</div>
            <div style="margin-top:6px;">${Parts.statusBadge(o.status)}</div>
          </div>
        </div>

        <div class="glass card">
          ${kv(t('orderDate'), Fmt.date(o.orderDate))}
          ${kv(t('deliveryDate'), o.deliveryDate ? Fmt.date(o.deliveryDate) : '—')}
          ${o.trialDate ? kv(t('trialDate'), Fmt.date(o.trialDate)) : ''}
          ${o.urgent ? kv(t('urgent'), '<i data-lucide="flame" style="width:16px;height:16px;color:var(--c-danger);"></i>') : ''}
          ${o.deliveredAt ? kv(t('deliveredOn'), Fmt.date(o.deliveredAt)) : ''}
        </div>

        <div class="section-label">${t('status')}</div>
        <div class="glass card"><div class="status-stepper">
          ${FLOW.map(s => `<div class="status-chip ${o.status === s ? 'current' : ''}" onclick="Orders.setStatus(${o.id}, '${s}')">${t('st_' + s)}</div>`).join('')}
        </div></div>

        <div class="section-label">${t('items')}</div>
        <div class="glass card" style="padding: 6px 16px;">
          ${o.items.map(i => `<div class="line-item">
            <div><div class="li-title">${i.qty}× ${esc(Garments.name(i.garment))}</div>
              <div class="text-faint text-sm">${t('stitchRate')}: ${Fmt.money(i.rate)}${i.fabricAmount ? ` · ${t('fabricAmount')}: ${Fmt.money(i.fabricAmount)}` : ''}</div>
              ${i.notes ? `<div class="text-sm text-soft">${esc(i.notes)}</div>` : ''}</div>
            <div style="font-weight:700;">${Fmt.money(i.qty * i.rate + (i.fabricAmount || 0))}</div></div>`).join('')}
        </div>

        <div class="glass card">
          <div class="totals-row"><span>${t('subtotal')}</span><span>${Fmt.money(calc.subtotal)}</span></div>
          ${calc.discount ? `<div class="totals-row"><span>${t('discount')}</span><span>- ${Fmt.money(calc.discount)}</span></div>` : ''}
          <div class="totals-row grand"><span>${t('total')}</span><span>${Fmt.money(calc.total)}</span></div>
          <div class="totals-row"><span>${t('paid')}</span><span class="text-success">${Fmt.money(paid)}</span></div>
          <div class="totals-row"><span>${t('balance')}</span><span class="${balance > 0 ? 'text-danger' : 'text-success'}" style="font-weight:800;">${Fmt.money(balance)}</span></div>
        </div>

        <div class="section-label" style="display:flex; justify-content:space-between; align-items:center;">
          <span>${t('payments')}</span>
          <button class="btn btn-sm btn-primary" onclick="Orders.openPaymentSheet(${o.customerId}, ${o.id})"><i data-lucide="plus"></i> ${t('receivePayment')}</button>
        </div>
        <div class="glass card" style="padding: 6px 16px;">
          ${pays.length ? pays.map(p => `<div class="list-item card-tap" onclick="Orders.deletePayment(${p.id})">
            <div class="li-body"><div class="li-title text-success">${Fmt.money(p.amount)}</div>
              <div class="li-sub">${Fmt.date(p.date, { short: true })}${p.note ? ' · ' + esc(p.note === 'advance' ? t('advance') : p.note) : ''}</div></div></div>`).join('')
            : `<div class="text-faint text-sm" style="padding:18px 0;">${t('noPayments')}</div>`}
        </div>

        ${o.fabricReceived || o.fabricMeters ? `<div class="glass card">${kv(t('customerFabric'), esc(o.fabricReceived || '—') + (o.fabricMeters ? ` · ${o.fabricMeters} ${t('u_meter')}` : ''))}</div>` : ''}
        ${(o.photos || []).length ? `<div class="section-label">${t('photos')}</div><div class="photo-grid" style="margin-bottom:14px;">${o.photos.map((p, i) => `<div class="photo-thumb" onclick="Orders.viewPhoto(${o.id}, ${i})"><img src="${p}" alt=""></div>`).join('')}</div>` : ''}
        ${o.notes ? `<div class="glass card">${kv(t('orderNotes'), esc(o.notes))}</div>` : ''}

        <div style="display:flex; gap:10px; margin-top:6px;">
          <button class="btn btn-primary btn-block" onclick="Router.navigate('/orders/${o.id}/receipt')"><i data-lucide="printer"></i> ${t('receiptPrint')}</button>
          <button class="btn btn-ghost btn-block" onclick="Router.navigate('/orders/${o.id}/receipt?view=slip')"><i data-lucide="ruler"></i> ${t('measureSlip')}</button>
        </div>
        <div style="display:flex; gap:10px; margin-top:10px;">
          <button class="btn btn-ghost btn-block" onclick="Router.navigate('/orders/${o.id}/receipt?view=tag')"><i data-lucide="tag"></i> ${t('tagView')}</button>
          <button class="btn btn-ghost btn-block" onclick="Router.navigate('/orders/${o.id}/receipt?view=fabric')"><i data-lucide="shirt"></i> ${t('fabricSlip')}</button>
        </div>
        ${c && c.phone ? `<button class="btn btn-ghost btn-block" style="margin-top:10px;" onclick="Orders.offerMessage(${o.id}, '${o.status === 'ready' ? 'ready' : 'due'}')"><i data-lucide="message-circle"></i> ${t(o.status === 'ready' ? 'sendReadyMsg' : 'sendDueMsg')}</button>` : ''}
      </div>`;
    if (window.lucide) lucide.createIcons();
  }

  async function setStatus(id, status) {
    await Repo.setOrderStatus(id, status);
    if (status === 'delivered') {
      const o = await Repo.getOrder(id);
      const bal = calcOrder(o).total - await Repo.orderPaid(id);
      if (bal > 0) UI.toast(`${t('balanceDue')}: ${Fmt.money(bal)}`, 'default');
    }
    Router.refresh();
    if (status === 'ready') offerMessage(id, 'ready');
  }

  // Preview a WhatsApp message (ready / due reminder) and send it with one tap
  async function offerMessage(id, kind) {
    const o = await Repo.getOrder(id);
    const [c, settings] = await Promise.all([Repo.getCustomer(o.customerId), Repo.getSettings()]);
    if (!c || !c.phone) return;
    const bal = calcOrder(o).total - await Repo.orderPaid(id);
    const text = Msg.build(kind, settings, c, o, bal);
    const sheet = UI.openSheet(`
      <div class="grabber"></div><div class="sheet-title">${t(kind === 'ready' ? 'sendReadyMsg' : 'sendDueMsg')}</div>
      <div class="sheet-body"><div class="glass card" style="white-space:pre-wrap; line-height:1.9;">${esc(text)}</div></div>
      <div class="sheet-actions"><button class="btn btn-ghost btn-block" id="m-skip">${t('skip')}</button>
        <button class="btn btn-primary btn-block" id="m-send"><i data-lucide="message-circle"></i> WhatsApp</button></div>`);
    qs('#m-skip', sheet).onclick = () => UI.closeSheet();
    qs('#m-send', sheet).onclick = () => { UI.closeSheet(); Msg.open(c.phone, text, settings.countryCode); };
  }

  async function viewPhoto(id, i) {
    const o = await Repo.getOrder(id);
    const sheet = UI.openSheet(`<div class="grabber"></div><div class="sheet-body" style="padding-top:16px;">
      <img src="${o.photos[i]}" style="width:100%; border-radius:14px;" alt=""></div>`);
  }

  function openActions(id) {
    const sheet = UI.openSheet(`
      <div class="grabber"></div>
      <div class="sheet-body" style="padding-top:16px;">
        <button class="btn btn-ghost btn-block" id="a-edit" style="margin-bottom:10px;"><i data-lucide="pencil"></i> ${t('editOrder')}</button>
        <button class="btn btn-ghost btn-block" id="a-cancel" style="margin-bottom:10px;"><i data-lucide="ban"></i> ${t('cancelOrder')}</button>
        <button class="btn btn-danger btn-block" id="a-del"><i data-lucide="trash-2"></i> ${t('deleteOrder')}</button>
      </div>`);
    qs('#a-edit', sheet).onclick = () => { UI.closeSheet(); Router.navigate(`/orders/${id}/edit`); };
    qs('#a-cancel', sheet).onclick = async () => { UI.closeSheet(); await Repo.setOrderStatus(id, 'cancelled'); Router.refresh(); };
    qs('#a-del', sheet).onclick = async () => {
      UI.closeSheet();
      if (!await UI.confirm(t('deleteOrderMsg'), { danger: true, okLabel: t('delete') })) return;
      await Repo.deleteOrder(id); UI.toast(t('deleted'), 'success'); Router.navigate('/orders');
    };
  }

  // ---------------- Payments ----------------
  async function openPaymentSheet(customerId, orderId) {
    const orders = (await Repo.listOrdersForCustomer(customerId)).filter(o => o.status !== 'cancelled');
    const withBal = [];
    for (const o of orders) { const b = calcOrder(o).total - await Repo.orderPaid(o.id); withBal.push({ o, b }); }
    const open = withBal.filter(x => x.b > 0);
    const preset = orderId ? withBal.find(x => x.o.id === Number(orderId)) : (open.length === 1 ? open[0] : null);

    const sheet = UI.openSheet(`
      <div class="grabber"></div>
      <div class="sheet-title">${t('receivePayment')}</div>
      <div class="sheet-body">
        <div class="field"><label>${t('forOrder')}</label>
          <select id="p-order"><option value="">${t('generalKhata')}</option>
            ${open.concat(preset && !open.includes(preset) ? [preset] : []).map(x => `<option value="${x.o.id}" data-bal="${x.b}" ${preset && preset.o.id === x.o.id ? 'selected' : ''}>${esc(x.o.orderNumber)} · ${t('balance')} ${Fmt.money(x.b)}</option>`).join('')}</select></div>
        <div class="row-2">
          <div class="field"><label>${t('amount')} *</label><input type="number" inputmode="decimal" id="p-amount" min="1" value="${preset && preset.b > 0 ? preset.b : ''}" /></div>
          <div class="field"><label>${t('date')}</label><input type="date" id="p-date" value="${todayStr()}" /></div>
        </div>
        <div class="field"><label>${t('payMethod')}</label>
          <select id="p-method"><option value="cash">${t('cash')}</option><option value="online">${t('online')}</option></select></div>
        <div class="field"><label>${t('note')}</label><input type="text" id="p-note" /></div>
      </div>
      <div class="sheet-actions">
        <button class="btn btn-ghost btn-block" id="p-cancel">${t('cancel')}</button>
        <button class="btn btn-primary btn-block" id="p-save">${t('save')}</button>
      </div>`);
    qs('#p-order', sheet).onchange = (e) => { const b = e.target.selectedOptions[0].dataset.bal; qs('#p-amount', sheet).value = b || ''; };
    qs('#p-cancel', sheet).onclick = () => UI.closeSheet();
    qs('#p-save', sheet).onclick = async () => {
      const amount = Number(qs('#p-amount', sheet).value);
      if (!(amount > 0)) { UI.toast(t('amountRequired'), 'error'); return; }
      await Repo.addPayment({ customerId, orderId: qs('#p-order', sheet).value || null, amount, date: qs('#p-date', sheet).value || todayStr(), method: qs('#p-method', sheet).value, note: qs('#p-note', sheet).value });
      UI.closeSheet(); UI.toast(t('saved'), 'success'); Router.refresh();
    };
  }

  async function deletePayment(id) {
    if (!await UI.confirm(t('deletePaymentMsg'), { danger: true, okLabel: t('delete') })) return;
    await Repo.deletePayment(id); UI.toast(t('deleted'), 'success'); Router.refresh();
  }

  return { renderList, renderForm, renderDetail, setStatus, offerMessage, viewPhoto, openActions, openPaymentSheet, deletePayment };
})();
