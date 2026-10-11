// DarziHub — Receipt / measurement slip: thermal 80/58mm, A4 (PDF), print, WhatsApp
const Receipt = (() => {
  let ctx = null; // { o, c, settings, pays, fmt, view, lang }

  async function render(params) {
    const o = await Repo.getOrder(params.id);
    if (!o) { Router.navigate('/orders'); return; }
    const [c, settings, pays] = await Promise.all([Repo.getCustomer(o.customerId), Repo.getSettings(), Repo.listPaymentsForOrder(o.id)]);
    ctx = { o, c, settings, pays, fmt: settings.receiptFormat || 'thermal80', view: ['slip', 'tag', 'fabric'].includes(params.query && params.query.view) ? params.query.view : 'receipt', lang: I18n.lang };
    draw();
  }

  function draw() {
    const { o, fmt, view, lang } = ctx;
    const seg = (items, cur, fn) => `<div class="segmented">${items.map(([v, l]) => `<button class="${v === cur ? 'active' : ''}" onclick="${fn}('${v}')">${l}</button>`).join('')}</div>`;
    qs('#screen-root').innerHTML = `
      ${topbar({ slip: t('measureSlip'), tag: t('tagView'), fabric: t('fabricSlip') }[view] || t('receipt'), { back: `/orders/${o.id}` })}
      <div class="screen">
        <div class="no-print" style="display:grid; gap:10px; margin-bottom:14px;">
          ${seg([['receipt', t('receipt')], ['slip', t('slipShort')], ['tag', t('tagView')], ['fabric', t('fabricShort')]], view, 'Receipt.setView')}
          ${seg([['thermal80', t('thermal80')], ['thermal58', t('thermal58')], ['a4', 'A4']], fmt, 'Receipt.setFmt')}
          ${seg([['ur', 'اردو'], ['en', 'English']], lang, 'Receipt.setLang')}
        </div>
        <div class="paper ${fmt}" dir="${lang === 'ur' ? 'rtl' : 'ltr'}" lang="${lang}" style="${lang === 'ur' ? "font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; line-height:2;" : ''}">
          ${view === 'slip' ? slipHtml() : view === 'tag' ? tagHtml() : view === 'fabric' ? fabricHtml() : receiptHtml()}
        </div>
        <div class="no-print" style="display:flex; gap:10px;">
          <button class="btn btn-primary btn-block" onclick="Receipt.print()"><i data-lucide="printer"></i> ${t('print')}</button>
          <button class="btn btn-ghost btn-block" onclick="Receipt.pdf()"><i data-lucide="file-down"></i> PDF</button>
          <button class="btn btn-ghost btn-block" onclick="Receipt.whatsapp()"><i data-lucide="message-circle"></i> WhatsApp</button>
        </div>
        <p class="text-faint text-sm no-print" style="margin:12px 4px 0;">${t('pdfHint')}</p>
      </div>`;
    if (window.lucide) lucide.createIcons();
    setPageStyle();
  }

  function setPageStyle() {
    let st = qs('#page-style');
    if (!st) { st = document.createElement('style'); st.id = 'page-style'; document.head.appendChild(st); }
    const w = { thermal80: '80mm', thermal58: '58mm' }[ctx.fmt];
    st.textContent = w ? `@page { size: ${w} 297mm; margin: 2mm; } @media print { .paper { width: 100% !important; box-shadow: none !important; padding: 0 !important; } }`
      : `@page { size: A4; margin: 12mm; } @media print { .paper { box-shadow: none !important; max-width: none !important; } }`;
  }

  // ------- shared bits -------
  const shopName = (s, l) => (l === 'ur' ? (s.shopNameUr || s.shopName) : (s.shopName || s.shopNameUr));
  function header() {
    const { settings: s, lang, o } = ctx;
    return `${s.logo ? `<img class="logo" src="${s.logo}" alt="">` : ''}
      <h2>${esc(shopName(s, lang))}</h2>
      <div class="c muted">${esc([s.phone, s.address].filter(Boolean).join(' · '))}</div><hr>`;
  }
  function metaRows() {
    const { o, c, lang } = ctx;
    return `<table>
      <tr><td>${t('orderNo', lang)}</td><td class="num"><b>${esc(o.orderNumber)}</b></td></tr>
      <tr><td>${t('orderDate', lang)}</td><td class="num">${Fmt.date(o.orderDate, { short: true }, lang)}</td></tr>
      <tr><td>${t('customer', lang)}</td><td class="num">${esc(c ? c.name : '—')}</td></tr>
      ${c && c.phone ? `<tr><td>${t('phone', lang)}</td><td class="num" dir="ltr">${esc(c.phone)}</td></tr>` : ''}
      <tr><td>${t('deliveryDate', lang)}</td><td class="num"><b>${o.deliveryDate ? Fmt.date(o.deliveryDate, { short: true }, lang) : '—'}</b></td></tr>
    </table><hr>`;
  }

  // ------- customer receipt -------
  function receiptHtml() {
    const { o, pays, settings: s, lang, fmt } = ctx;
    const calc = calcOrder(o);
    const paid = pays.reduce((a, p) => a + (Number(p.amount) || 0), 0);
    const balance = calc.total - paid;
    const footer = lang === 'ur' ? s.footerUr : s.footerEn;
    const rows = o.items.map(i => ({ n: Garments.name(i.garment, lang), q: i.qty, note: i.notes, amt: i.qty * i.rate + (i.fabricAmount || 0), f: i.fabricAmount }));
    const items = fmt === 'a4'
      ? `<table class="grid"><tr><th>${t('item', lang)}</th><th class="num">${t('qty', lang)}</th><th class="num">${t('amount', lang)}</th></tr>
          ${rows.map(r => `<tr><td>${esc(r.n)}${r.note ? `<div class="muted">${esc(r.note)}</div>` : ''}</td><td class="num">${r.q}</td><td class="num">${Fmt.money(r.amt)}</td></tr>`).join('')}</table>`
      : `<table>${rows.map(r => `<tr><td>${esc(r.n)} × ${r.q}${r.note ? `<div class="muted">${esc(r.note)}</div>` : ''}</td><td class="num">${Fmt.money(r.amt)}</td></tr>`).join('')}</table>`;
    return `${header()}${metaRows()}${items}<hr>
      <table>
        <tr><td>${t('subtotal', lang)}</td><td class="num">${Fmt.money(calc.subtotal)}</td></tr>
        ${calc.discount ? `<tr><td>${t('discount', lang)}</td><td class="num">- ${Fmt.money(calc.discount)}</td></tr>` : ''}
        <tr class="tot"><td>${t('total', lang)}</td><td class="num">${Fmt.money(calc.total)}</td></tr>
        <tr><td>${t('paid', lang)}</td><td class="num">${Fmt.money(paid)}</td></tr>
        <tr class="tot"><td>${t('balance', lang)}</td><td class="num">${Fmt.money(balance)}</td></tr>
      </table><hr>
      <div class="c muted">${esc(footer || '')}</div>`;
  }

  // ------- measurement / job slip -------
  function slipHtml() {
    const { o, c, lang } = ctx;
    const snap = o.measurements || {};
    const live = (c && c.measurements) || {};
    const blocks = o.items.map(i => {
      const m = snap[i.garment] || live[i.garment];
      const g = Garments.byKey[i.garment];
      return `<div style="margin-bottom:8px;">
        <b>${i.qty}× ${esc(Garments.name(i.garment, lang))}</b>${i.notes ? ` <span class="muted">— ${esc(i.notes)}</span>` : ''}
        ${m && g ? `<div class="m-line">${g.fields.filter(f => m.values[f] !== undefined && m.values[f] !== '').map(f =>
          `<span>${esc(Garments.fieldLabel(f, lang))}: <b>${esc(m.values[f])}</b></span>`).join('')}</div>
          ${m.style ? `<div class="muted">${esc(m.style)}</div>` : ''}` : `<div class="muted">${t('noMeasurementYet', lang)}</div>`}
        <hr></div>`;
    }).join('');
    return `<h2>${t('measureSlip', lang)}</h2><div class="c muted">${esc(shopName(ctx.settings, lang))}</div><hr>${metaRows()}${blocks}
      ${o.notes ? `<div><b>${t('orderNotes', lang)}:</b> ${esc(o.notes)}</div>` : ''}
      ${(o.photos || []).length ? `<div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">${o.photos.slice(0, 4).map(p => `<img src="${p}" style="width:70px; height:70px; object-fit:cover; border-radius:6px;">`).join('')}</div>` : ''}`;
  }

  // ------- garment tags (one per piece) -------
  function tagHtml() {
    const { o, c, lang } = ctx;
    const tags = [];
    o.items.forEach(i => { for (let k = 1; k <= (Number(i.qty) || 1); k++) tags.push({ i, k }); });
    return tags.map(({ i, k }) => `
      <div style="page-break-after:always; border:1px dashed #777; padding:6px 8px; margin-bottom:8px; border-radius:6px;">
        <div><b>${esc(o.orderNumber)}</b>${o.urgent ? ' 🔥' : ''}</div>
        <div>${esc(c ? c.name : '—')}</div>
        <div>${esc(Garments.name(i.garment, lang))} (${k}/${i.qty})</div>
        <div class="muted">${t('deliveryDate', lang)}: <b>${o.deliveryDate ? Fmt.date(o.deliveryDate, { short: true }, lang) : '—'}</b></div>
      </div>`).join('');
  }

  // ------- customer's own fabric received -------
  function fabricHtml() {
    const { o, lang } = ctx;
    return `${header()}<div class="c"><b>${t('fabricSlip', lang)}</b></div><hr>${metaRows()}
      ${o.fabricReceived || o.fabricMeters ? `<table>
        <tr><td>${t('customerFabric', lang)}</td><td class="num">${esc(o.fabricReceived || '—')}</td></tr>
        <tr><td>${t('fabricMeters', lang)}</td><td class="num"><b>${o.fabricMeters || '—'}</b></td></tr></table>`
        : `<div class="muted">${t('noFabric', lang)}</div>`}
      <hr><div class="muted">${t('signature', lang)}: ____________</div>`;
  }

  // ------- WhatsApp text -------
  function whatsapp() {
    const { o, c, pays, settings: s, lang } = ctx;
    const calc = calcOrder(o);
    const paid = pays.reduce((a, p) => a + (Number(p.amount) || 0), 0);
    const L = (k) => t(k, lang);
    const msg = [
      `*${shopName(s, lang)}*`,
      `${L('orderNo')}: ${o.orderNumber}`,
      `${L('customer')}: ${c ? c.name : ''}`,
      '',
      ...o.items.map(i => `• ${Garments.name(i.garment, lang)} × ${i.qty} — ${Fmt.money(i.qty * i.rate + (i.fabricAmount || 0))}`),
      '',
      calc.discount ? `${L('discount')}: ${Fmt.money(calc.discount)}` : null,
      `${L('total')}: ${Fmt.money(calc.total)}`,
      `${L('paid')}: ${Fmt.money(paid)}`,
      `*${L('balance')}: ${Fmt.money(calc.total - paid)}*`,
      o.deliveryDate ? `${L('deliveryDate')}: ${Fmt.date(o.deliveryDate, {}, lang)}` : null,
      '',
      lang === 'ur' ? s.footerUr : s.footerEn
    ].filter(x => x !== null).join('\n');
    const num = waNumber(c && c.phone, s.countryCode);
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  function print() { setPageStyle(); window.print(); }
  function pdf() {
    if (ctx.fmt !== 'a4') { ctx.fmt = 'a4'; draw(); }
    UI.toast(t('pdfHint'), 'default');
    setTimeout(print, 400);
  }

  return {
    render, whatsapp, print, pdf,
    setView(v) { ctx.view = v; draw(); },
    setFmt(v) { ctx.fmt = v; draw(); },
    setLang(v) { ctx.lang = v; draw(); }
  };
})();
