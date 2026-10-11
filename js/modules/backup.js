// DarziHub — Backup & Restore (JSON)
const Backup = (() => {
  async function render() {
    const st = await Repo.getSettings();
    qs('#screen-root').innerHTML = `
      ${topbar(t('backupRestore'), { back: '/settings' })}
      <div class="screen">
        <div class="section-label" style="margin-top:0;">${t('export')} · <span style="font-weight:500;">${t('lastBackup')}: ${st.lastBackupAt ? Fmt.date(st.lastBackupAt) : t('never')}</span></div>
        <div class="glass card backup-option" onclick="Backup.exportData()">
          <div class="icon-wrap" style="background:rgba(62,107,255,0.12); color:var(--c-primary-1);"><i data-lucide="download"></i></div>
          <div class="li-body"><div class="li-title">${t('exportAll')}</div><div class="li-sub">${t('exportHint')}</div></div>
        </div>
        <div class="section-label">${t('import')}</div>
        <div class="glass card backup-option" onclick="qs('#import-input').click()">
          <div class="icon-wrap" style="background:rgba(122,92,250,0.12); color:var(--c-primary-2);"><i data-lucide="upload"></i></div>
          <div class="li-body"><div class="li-title">${t('importBackup')}</div><div class="li-sub">${t('importHint')}</div></div>
        </div>
        <input type="file" id="import-input" accept="application/json" style="display:none;" />
        <div class="section-label">${t('dangerZone')}</div>
        <div class="glass card backup-option" onclick="Backup.confirmWipe()">
          <div class="icon-wrap" style="background:rgba(255,71,87,0.12); color:var(--c-danger);"><i data-lucide="trash-2"></i></div>
          <div class="li-body"><div class="li-title text-danger">${t('eraseAll')}</div><div class="li-sub">${t('eraseHint')}</div></div>
        </div>
        <p class="text-sm text-faint" style="padding:10px 4px 0; line-height:1.8;">${t('backupNote')}</p>
      </div>`;
    if (window.lucide) lucide.createIcons();
    qs('#import-input').addEventListener('change', handleImport);
  }

  async function exportData() {
    const payload = await Repo.exportAll();
    const json = JSON.stringify(payload, null, 2);
    const name = `darzihub-backup-${todayStr()}.json`;
    // Phone: open the share sheet so the file can go straight to WhatsApp / Drive
    try {
      const file = new File([json], name, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: name });
        await Repo.markBackup(); UI.toast(t('backupDone'), 'success'); return;
      }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    await Repo.markBackup();
    UI.toast(t('backupDone'), 'success');
  }

  async function handleImport(e) {
    const file = e.target.files[0]; if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      const d = payload.data || {};
      const sheet = UI.openSheet(`
        <div class="grabber"></div><div class="sheet-title">${t('importBackup')}</div>
        <div class="sheet-body">
          <p class="text-sm text-soft" style="line-height:1.8; margin-bottom:14px;">${(d.customers || []).length} ${t('navCustomers')}, ${(d.orders || []).length} ${t('navOrders')}</p>
          <div class="field"><label>${t('importMode')}</label><select id="import-mode">
            <option value="merge">${t('modeMerge')}</option><option value="replace">${t('modeReplace')}</option></select></div>
        </div>
        <div class="sheet-actions">
          <button class="btn btn-ghost btn-block" id="i-cancel">${t('cancel')}</button>
          <button class="btn btn-primary btn-block" id="i-ok">${t('import')}</button></div>`);
      qs('#i-cancel', sheet).onclick = () => UI.closeSheet();
      qs('#i-ok', sheet).onclick = async () => {
        const mode = qs('#import-mode', sheet).value; UI.closeSheet();
        try { await Repo.importAll(payload, mode); UI.toast(t('imported'), 'success'); Router.navigate('/dashboard'); }
        catch (err) { UI.toast(err.message, 'error'); }
      };
    } catch (err) { UI.toast(t('invalidBackup'), 'error'); }
    e.target.value = '';
  }

  async function confirmWipe() {
    if (!await UI.confirm(t('eraseMsg'), { danger: true, okLabel: t('eraseEverything') })) return;
    if (!await UI.confirm(t('eraseMsg2'), { danger: true, okLabel: t('eraseYes') })) return;
    await Repo.wipeAll(); UI.toast(t('erased'), 'success'); Router.navigate('/dashboard');
  }
  return { render, exportData, confirmWipe };
})();
