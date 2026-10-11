// =========================================================
// DarziHub — Shared view fragments
// =========================================================

const Parts = {
  statusBadge(s) { return `<span class="badge badge-${s}">${t('st_' + s)}</span>`; },

  dueLabel(o) {
    if (!o.deliveryDate) return '';
    if (o.status === 'delivered' || o.status === 'cancelled') return Fmt.date(o.deliveryDate, { short: true });
    const d = Fmt.daysFromToday(o.deliveryDate);
    if (d < 0) return `<span class="text-danger">${t('overdue')} · ${Fmt.date(o.deliveryDate, { short: true })}</span>`;
    if (d === 0) return `<span class="text-danger">${t('today')}</span>`;
    if (d === 1) return t('tomorrow');
    return Fmt.date(o.deliveryDate, { short: true });
  },

  // One order row. `customer` may be undefined; showCustomer=false hides name.
  orderRow(o, customer, showCustomer = true) {
    const total = calcOrder(o).total;
    return `
      <div class="list-item card-tap" onclick="Router.navigate('/orders/${o.id}')">
        <div class="avatar"><i data-lucide="scissors"></i></div>
        <div class="li-body">
          <div class="li-title">${showCustomer ? esc(customer ? customer.name : '—') : esc(o.orderNumber)}${o.urgent ? ' <i data-lucide="flame" style="width:14px;height:14px;color:var(--c-danger);vertical-align:-2px;"></i>' : ''}</div>
          <div class="li-sub">${esc(Garments.summary(o.items))}</div>
          <div class="li-sub">${showCustomer ? esc(o.orderNumber) + ' · ' : ''}${Parts.dueLabel(o)}</div>
        </div>
        <div class="li-trail">
          <div style="font-weight:700; font-size:13.5px;">${Fmt.money(total)}</div>
          <div style="margin-top:4px;">${Parts.statusBadge(o.status)}</div>
        </div>
      </div>`;
  }
};

// WhatsApp message templates ({name} {order} {balance} {shop})
const Msg = {
  fill(tpl, v) { return String(tpl || '').replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? '')); },
  build(kind, settings, customer, order, balance, lang) {
    const L = lang || I18n.lang;
    const tpl = settings[`${kind}Msg${L === 'ur' ? 'Ur' : 'En'}`];
    return Msg.fill(tpl, {
      name: customer ? customer.name : '', order: order ? order.orderNumber : '',
      balance: Fmt.money(balance), shop: L === 'ur' ? (settings.shopNameUr || settings.shopName) : (settings.shopName || settings.shopNameUr)
    });
  },
  open(phone, text, cc) {
    const n = waNumber(phone, cc);
    if (!n) { UI.toast(t('noPhone'), 'error'); return; }
    window.open(`https://wa.me/${n}?text=${encodeURIComponent(text)}`, '_blank');
  }
};
