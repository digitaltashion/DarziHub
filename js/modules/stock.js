// DarziHub — Stock (fabric, thread, buttons, lining…)
const Stock = (() => {
  const UNITS = ['meter', 'yard', 'piece', 'spool', 'box'];
  const CATS = ['fabric', 'thread', 'button', 'lining', 'other'];

  async function html() {
    const list = await Repo.listStock();
    const low = list.filter(s => Number(s.minQty) > 0 && Number(s.qty) <= Number(s.minQty));
    return `
      <div class="glass card" style="display:flex; justify-content:space-between; align-items:center;">
        <div><div class="text-faint text-sm">${t('stockItems')}</div><div class="stat-value" style="font-size:22px;">${list.length}${low.length ? ` <span class="badge badge-cancelled" style="vertical-align:middle;">${low.length} ${t('lowStock')}</span>` : ''}</div></div>
        <button class="btn btn-primary btn-sm" onclick="Stock.openEdit()"><i data-lucide="plus"></i> ${t('addStock')}</button>
      </div>
      <div class="glass card" style="padding: 6px 16px;">
        ${list.length ? list.map(s => {
          const isLow = Number(s.minQty) > 0 && Number(s.qty) <= Number(s.minQty);
          return `<div class="list-item card-tap" onclick="Stock.openAdjust(${s.id})">
            <div class="avatar"><i data-lucide="package"></i></div>
            <div class="li-body"><div class="li-title">${esc(s.name)}</div><div class="li-sub">${t('sc_' + (s.category || 'other'))}</div></div>
            <div class="li-trail"><div class="${isLow ? 'text-danger' : ''}" style="font-weight:700;">${s.qty} ${t('u_' + (s.unit || 'piece'))}</div>
              ${isLow ? `<div class="text-danger" style="font-size:11px;">${t('lowStock')}</div>` : ''}</div></div>`; }).join('')
          : `<div class="text-faint text-sm" style="padding:22px 0; text-align:center;">${t('noStock')}</div>`}
      </div>`;
  }

  async function openEdit(id) {
    const s = id ? await Repo.getStock(id) : { unit: 'meter', category: 'fabric' };
    const sheet = UI.openSheet(`
      <div class="grabber"></div><div class="sheet-title">${id ? t('editStock') : t('addStock')}</div>
      <div class="sheet-body">
        <div class="field"><label>${t('name')} *</label><input type="text" id="s-name" value="${esc(s.name || '')}" placeholder="${t('stockNamePh')}" /></div>
        <div class="row-2">
          <div class="field"><label>${t('category')}</label><select id="s-cat">${CATS.map(k => `<option value="${k}" ${s.category === k ? 'selected' : ''}>${t('sc_' + k)}</option>`).join('')}</select></div>
          <div class="field"><label>${t('unit')}</label><select id="s-unit">${UNITS.map(k => `<option value="${k}" ${s.unit === k ? 'selected' : ''}>${t('u_' + k)}</option>`).join('')}</select></div>
        </div>
        <div class="row-2">
          ${id ? '' : `<div class="field"><label>${t('openingQty')}</label><input type="number" inputmode="decimal" id="s-qty" min="0" /></div>`}
          <div class="field"><label>${t('minQty')}</label><input type="number" inputmode="decimal" id="s-min" min="0" value="${esc(s.minQty || '')}" /></div>
        </div>
      </div>
      <div class="sheet-actions"><button class="btn btn-ghost btn-block" id="s-c">${t('cancel')}</button>
        <button class="btn btn-primary btn-block" id="s-ok">${t('save')}</button></div>`);
    qs('#s-c', sheet).onclick = () => UI.closeSheet();
    qs('#s-ok', sheet).onclick = async () => {
      const name = qs('#s-name', sheet).value.trim();
      if (!name) { UI.toast(t('nameRequired'), 'error'); return; }
      const data = { ...(id ? s : {}), name, category: qs('#s-cat', sheet).value, unit: qs('#s-unit', sheet).value, minQty: qs('#s-min', sheet).value };
      if (!id) data.qty = qs('#s-qty', sheet).value;
      await Repo.saveStock(data); UI.closeSheet(); UI.toast(t('saved'), 'success'); Router.refresh();
    };
  }

  async function openAdjust(id) {
    const [s, log] = await Promise.all([Repo.getStock(id), Repo.stockLogFor(id)]);
    const sheet = UI.openSheet(`
      <div class="grabber"></div>
      <div class="sheet-title">${esc(s.name)}<span style="font-weight:800;">${s.qty} ${t('u_' + (s.unit || 'piece'))}</span></div>
      <div class="sheet-body">
        <div class="row-2">
          <div class="field"><label>${t('quantity')}</label><input type="number" inputmode="decimal" id="a-qty" min="0" /></div>
          <div class="field"><label>${t('note')}</label><input type="text" id="a-note" /></div>
        </div>
        <div style="display:flex; gap:10px; margin-bottom:14px;">
          <button class="btn btn-primary btn-block" id="a-add"><i data-lucide="plus"></i> ${t('stockIn')}</button>
          <button class="btn btn-ghost btn-block" id="a-use"><i data-lucide="minus"></i> ${t('stockOut')}</button>
        </div>
        ${log.length ? `<div class="text-faint text-sm" style="font-weight:700; margin-bottom:4px;">${t('history')}</div>
          ${log.map(l => `<div class="kv-row"><span class="k">${Fmt.date(l.date, { short: true })}${l.note ? ' · ' + esc(l.note === 'opening' ? t('openingQty') : l.note) : ''}</span>
            <span class="v ${l.delta < 0 ? 'text-danger' : 'text-success'}">${l.delta > 0 ? '+' : ''}${l.delta}</span></div>`).join('')}` : ''}
        <div style="display:flex; gap:10px; margin-top:14px;">
          <button class="btn btn-ghost btn-block" id="a-edit"><i data-lucide="pencil"></i> ${t('edit')}</button>
          <button class="btn btn-danger btn-block" id="a-del"><i data-lucide="trash-2"></i> ${t('delete')}</button>
        </div>
      </div>`);
    const apply = async (sign) => {
      const q = Number(qs('#a-qty', sheet).value);
      if (!(q > 0)) { UI.toast(t('amountRequired'), 'error'); return; }
      await Repo.adjustStock(id, sign * q, qs('#a-note', sheet).value);
      UI.closeSheet(); UI.toast(t('saved'), 'success'); Router.refresh();
    };
    qs('#a-add', sheet).onclick = () => apply(1);
    qs('#a-use', sheet).onclick = () => apply(-1);
    qs('#a-edit', sheet).onclick = () => { UI.closeSheet(); openEdit(id); };
    qs('#a-del', sheet).onclick = async () => {
      UI.closeSheet();
      if (!await UI.confirm(t('deleteStockMsg'), { danger: true, okLabel: t('delete') })) return;
      await Repo.deleteStock(id); UI.toast(t('deleted'), 'success'); Router.refresh();
    };
  }

  return { html, openEdit, openAdjust };
})();
