// DarziHub — Settings
const SettingsScreen = (() => {
  async function render() {
    const s = await Repo.getSettings();
    const root = qs('#screen-root');
    let logo = s.logo;

    root.innerHTML = `
      ${topbar(t('navSettings'))}
      <div class="screen">
        <div class="section-label" style="margin-top:0;">${t('language')}</div>
        <div class="glass card"><div class="segmented">
          <button class="${I18n.lang === 'ur' ? 'active' : ''}" onclick="App.setLang('ur')">اردو</button>
          <button class="${I18n.lang === 'en' ? 'active' : ''}" onclick="App.setLang('en')">English</button></div></div>

        <form id="set-form">
          <div class="section-label">${t('shopInfo')}</div>
          <div class="glass card">
            <div class="field"><label>${t('logo')}</label>
              <div class="logo-upload"><div class="logo-preview" id="logo-prev">${logo ? `<img src="${logo}">` : '<i data-lucide="image"></i>'}</div>
                <div style="flex:1;"><input type="file" id="logo-file" accept="image/png,image/jpeg" />
                <div class="hint">${t('logoHint')}</div></div></div></div>
            <div class="field"><label>${t('shopNameEn')}</label><input type="text" name="shopName" value="${esc(s.shopName)}" /></div>
            <div class="field"><label>${t('shopNameUr')}</label><input type="text" name="shopNameUr" dir="rtl" value="${esc(s.shopNameUr)}" /></div>
            <div class="field"><label>${t('ownerName')}</label><input type="text" name="ownerName" value="${esc(s.ownerName)}" /></div>
            <div class="field"><label>${t('phone')}</label><input type="tel" name="phone" value="${esc(s.phone)}" /></div>
            <div class="field" style="margin-bottom:0;"><label>${t('address')}</label><textarea name="address" style="min-height:70px;">${esc(s.address)}</textarea></div>
          </div>

          <div class="section-label">${t('billingSettings')}</div>
          <div class="glass card"><div class="row-3">
            <div class="field" style="margin-bottom:0;"><label>${t('currency')}</label><input type="text" name="currency" value="${esc(s.currency)}" /></div>
            <div class="field" style="margin-bottom:0;"><label>${t('countryCode')}</label><input type="tel" name="countryCode" value="${esc(s.countryCode)}" /></div>
            <div class="field" style="margin-bottom:0;"><label>${t('orderPrefix')}</label><input type="text" name="orderPrefix" value="${esc(s.orderPrefix)}" /></div>
          </div></div>

          <div class="section-label">${t('receiptSettings')}</div>
          <div class="glass card">
            <div class="field"><label>${t('defaultFormat')}</label>
              <select name="receiptFormat">${[['thermal80', t('thermal80')], ['thermal58', t('thermal58')], ['a4', 'A4']].map(([v, l]) => `<option value="${v}" ${s.receiptFormat === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
            <div class="field"><label>${t('footerEn')}</label><input type="text" name="footerEn" value="${esc(s.footerEn)}" /></div>
            <div class="field" style="margin-bottom:0;"><label>${t('footerUr')}</label><input type="text" name="footerUr" dir="rtl" value="${esc(s.footerUr)}" /></div>
          </div>

          <div class="section-label">${t('securityNotify')}</div>
          <div class="glass card">
            <div class="list-item" style="padding-top:0;">
              <div class="li-body"><div class="li-title">${t('pinLock')}</div><div class="li-sub">${Lock.has() ? t('pinOn') : t('pinOff')}</div></div>
              <button type="button" class="btn btn-sm btn-ghost" onclick="SettingsScreen.pinAction()">${Lock.has() ? t('manage') : t('setPin')}</button>
            </div>
            <div class="list-item" style="border-bottom:none; padding-bottom:0;">
              <div class="li-body"><div class="li-title">${t('dailyAlerts')}</div><div class="li-sub">${s.notifyEnabled ? t('pinOn') : t('pinOff')}</div></div>
              <button type="button" class="btn btn-sm btn-ghost" onclick="SettingsScreen.toggleNotify()">${s.notifyEnabled ? t('disable') : t('enable')}</button>
            </div>
            <p class="text-faint text-sm" style="margin-top:10px;">${t('alertsHint')}</p>
          </div>

          <div class="section-label">${t('msgTemplates')}</div>
          <div class="glass card">
            <p class="text-faint text-sm" style="margin-bottom:12px;">${t('msgTemplatesHint')}</p>
            <div class="field"><label>${t('readyMsg')} (English)</label><textarea name="readyMsgEn" style="min-height:70px;">${esc(s.readyMsgEn)}</textarea></div>
            <div class="field"><label>${t('readyMsg')} (اردو)</label><textarea name="readyMsgUr" dir="rtl" style="min-height:70px;">${esc(s.readyMsgUr)}</textarea></div>
            <div class="field"><label>${t('dueMsg')} (English)</label><textarea name="dueMsgEn" style="min-height:70px;">${esc(s.dueMsgEn)}</textarea></div>
            <div class="field" style="margin-bottom:0;"><label>${t('dueMsg')} (اردو)</label><textarea name="dueMsgUr" dir="rtl" style="min-height:70px;">${esc(s.dueMsgUr)}</textarea></div>
          </div>

          <div class="section-label">${t('defaultRates')}</div>
          <div class="glass card">
            <p class="text-faint text-sm" style="margin-bottom:12px;">${t('defaultRatesHint')}</p>
            <div class="m-grid">${Garments.LIST.map(g => `<div class="field"><label>${esc(Garments.name(g.key))}</label>
              <input type="number" inputmode="decimal" min="0" data-rate="${g.key}" value="${esc((s.rates || {})[g.key] ?? '')}" /></div>`).join('')}</div>
          </div>

          <button type="submit" class="btn btn-primary btn-block"><i data-lucide="check"></i> ${t('saveChanges')}</button>
        </form>

        <div class="glass card backup-option" style="margin-top:16px;" onclick="Router.navigate('/backup')">
          <div class="icon-wrap" style="background:rgba(62,107,255,0.12); color:var(--c-primary-1);"><i data-lucide="database-backup"></i></div>
          <div class="li-body"><div class="li-title">${t('backupRestore')}</div><div class="li-sub">${t('backupHint')}</div></div>
          <i data-lucide="chevron-right" class="flip" style="color:var(--c-ink-faint);"></i>
        </div>
      </div>`;
    if (window.lucide) lucide.createIcons();

    qs('#logo-file').addEventListener('change', async (e) => {
      const f = e.target.files[0]; if (!f) return;
      if (f.size > 1.5 * 1024 * 1024) { UI.toast(t('logoTooBig'), 'error'); return; }
      logo = await readFileAsDataURL(f);
      qs('#logo-prev').innerHTML = `<img src="${logo}">`;
    });

    qs('#set-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = { ...s, ...Object.fromEntries(new FormData(e.target).entries()), logo };
      data.rates = {};
      qsa('[data-rate]').forEach(i => { if (i.value !== '') data.rates[i.dataset.rate] = Number(i.value); });
      await Repo.saveSettings(data);
      UI.toast(t('saved'), 'success');
    });
  }
  async function toggleNotify() {
    const s = await Repo.getSettings();
    if (s.notifyEnabled) { s.notifyEnabled = false; await Repo.saveSettings(s); UI.toast(t('saved'), 'success'); return render(); }
    if (!('Notification' in window)) { UI.toast(t('notifUnsupported'), 'error'); return; }
    const p = await Notification.requestPermission();
    if (p !== 'granted') { UI.toast(t('notifDenied'), 'error'); return; }
    s.notifyEnabled = true; s.lastNotifyDay = ''; await Repo.saveSettings(s);
    UI.toast(t('saved'), 'success'); render();
  }

  async function pinAction() {
    if (!Lock.has()) {
      const a = await Lock.prompt(t('newPin')); if (!a) return;
      const b = await Lock.prompt(t('confirmPin')); if (!b) return;
      if (a !== b) { UI.toast(t('pinMismatch'), 'error'); return; }
      await Lock.set(a); UI.toast(t('pinSet'), 'success'); return render();
    }
    const cur = await Lock.prompt(t('enterCurrentPin')); if (!cur) return;
    if (!await Lock.verify(cur)) { UI.toast(t('wrongPin'), 'error'); return; }
    const sheet = UI.openSheet(`
      <div class="grabber"></div>
      <div class="sheet-body" style="padding-top:16px;">
        <button class="btn btn-ghost btn-block" id="pin-change" style="margin-bottom:10px;"><i data-lucide="key-round"></i> ${t('changePin')}</button>
        <button class="btn btn-danger btn-block" id="pin-remove"><i data-lucide="lock-open"></i> ${t('removePin')}</button>
      </div>`);
    qs('#pin-change', sheet).onclick = async () => {
      UI.closeSheet();
      const a = await Lock.prompt(t('newPin')); if (!a) return;
      const b = await Lock.prompt(t('confirmPin')); if (!b) return;
      if (a !== b) { UI.toast(t('pinMismatch'), 'error'); return; }
      await Lock.set(a); UI.toast(t('pinSet'), 'success');
    };
    qs('#pin-remove', sheet).onclick = () => { Lock.remove(); UI.closeSheet(); UI.toast(t('pinRemoved'), 'success'); render(); };
  }

  return { render, toggleNotify, pinAction };
})();
