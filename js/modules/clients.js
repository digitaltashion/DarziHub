// =========================================================
// ContractHub — Clients
// =========================================================

const Clients = (() => {

  // ---------------- List ----------------

  async function renderList() {
    const root = qs('#screen-root');
    root.innerHTML = `<div class="screen"><div class="text-faint" style="padding:40px 0; text-align:center;">Loading…</div></div>`;

    const clients = await Repo.listClients();
    const withCounts = await Promise.all(clients.map(async c => ({
      ...c,
      contractCount: await Repo.clientContractCount(c.id),
      totalValue: await Repo.clientTotalValue(c.id)
    })));

    root.innerHTML = `
      <div class="topbar">
        <h1>Clients</h1>
        <div class="icon-btn" onclick="Router.navigate('/clients/new')"><i data-lucide="plus"></i></div>
      </div>
      <div class="screen">
        <div class="glass search-bar">
          <i data-lucide="search"></i>
          <input type="text" id="client-search" placeholder="Search clients…" />
        </div>
        <div id="client-list-body">
          ${withCounts.length ? renderRows(withCounts) : emptyState()}
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();

    qs('#client-search').addEventListener('input', debounce((e) => {
      const term = e.target.value.trim().toLowerCase();
      const filtered = !term ? withCounts : withCounts.filter(c =>
        [c.companyName, c.contactPerson, c.phone, c.email, c.city].filter(Boolean).join(' ').toLowerCase().includes(term)
      );
      qs('#client-list-body').innerHTML = filtered.length ? renderRows(filtered) : emptyState(!!term);
      if (window.lucide) lucide.createIcons();
    }, 200));
  }

  function renderRows(list) {
    return `<div class="glass card" style="padding: 6px 16px;">
      ${list.map(c => `
        <div class="list-item card-tap" onclick="Router.navigate('/clients/${c.id}')">
          <div class="avatar">${Fmt.initials(c.companyName)}</div>
          <div class="li-body">
            <div class="li-title">${Fmt.escapeHtml(c.companyName)}</div>
            <div class="li-sub">${Fmt.escapeHtml(c.contactPerson || c.phone || c.email || 'No contact info')}</div>
          </div>
          <div class="li-trail">
            <div style="font-weight:700; font-size:13.5px;">${c.contractCount}</div>
            <div class="text-faint" style="font-size:11px;">contract${c.contractCount === 1 ? '' : 's'}</div>
          </div>
        </div>
      `).join('')}
    </div>`;
  }

  function emptyState(isSearch) {
    return `
      <div class="empty-state glass card">
        <div class="icon-wrap"><i data-lucide="${isSearch ? 'search-x' : 'users'}"></i></div>
        <h3>${isSearch ? 'No matches' : 'No clients yet'}</h3>
        <p>${isSearch ? 'Try a different search term.' : 'Add the businesses you sell software to, then create contracts for them.'}</p>
        ${isSearch ? '' : `<button class="btn btn-primary" style="margin-top:16px;" onclick="Router.navigate('/clients/new')"><i data-lucide="plus"></i> Add Client</button>`}
      </div>
    `;
  }

  // ---------------- Form (add/edit) ----------------

  async function renderForm(params) {
    const isEdit = !!params.id;
    const client = isEdit ? await Repo.getClient(params.id) : {};
    const root = qs('#screen-root');

    root.innerHTML = `
      <div class="topbar">
        <div class="icon-btn" onclick="history.back()"><i data-lucide="arrow-left"></i></div>
        <h1>${isEdit ? 'Edit Client' : 'New Client'}</h1>
        <div style="width:38px;"></div>
      </div>
      <div class="screen">
        <form id="client-form">
          <div class="glass card">
            <div class="field">
              <label>Company / Business Name *</label>
              <input type="text" name="companyName" required value="${Fmt.escapeHtml(client.companyName || '')}" placeholder="e.g. Al-Habib Traders" />
            </div>
            <div class="field">
              <label>Contact Person</label>
              <input type="text" name="contactPerson" value="${Fmt.escapeHtml(client.contactPerson || '')}" placeholder="e.g. Ahmed Khan" />
            </div>
            <div class="row-2">
              <div class="field">
                <label>Phone</label>
                <input type="tel" name="phone" value="${Fmt.escapeHtml(client.phone || '')}" placeholder="03xx-xxxxxxx" />
              </div>
              <div class="field">
                <label>Email</label>
                <input type="email" name="email" value="${Fmt.escapeHtml(client.email || '')}" placeholder="name@company.com" />
              </div>
            </div>
            <div class="field">
              <label>Address</label>
              <textarea name="address" placeholder="Street, area">${Fmt.escapeHtml(client.address || '')}</textarea>
            </div>
            <div class="field">
              <label>City</label>
              <input type="text" name="city" value="${Fmt.escapeHtml(client.city || '')}" placeholder="e.g. Lahore" />
            </div>
            <div class="field" style="margin-bottom:0;">
              <label>Notes</label>
              <textarea name="notes" placeholder="Anything worth remembering about this client">${Fmt.escapeHtml(client.notes || '')}</textarea>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-block">
            <i data-lucide="check"></i> ${isEdit ? 'Save Changes' : 'Add Client'}
          </button>
        </form>
      </div>
    `;
    if (window.lucide) lucide.createIcons();

    qs('#client-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = Object.fromEntries(fd.entries());
      if (!data.companyName.trim()) { UI.toast('Company name is required', 'error'); return; }
      if (isEdit) data.id = Number(params.id);
      const id = await Repo.saveClient(data);
      UI.toast(isEdit ? 'Client updated' : 'Client added', 'success');
      Router.navigate(`/clients/${id}`);
    });
  }

  // ---------------- Detail ----------------

  async function renderDetail(params) {
    const client = await Repo.getClient(params.id);
    const root = qs('#screen-root');
    if (!client) { Router.navigate('/clients'); return; }

    const contracts = await Repo.listContractsForClient(client.id);
    const totalValue = contracts.reduce((s, c) => s + (Number(c.amount) || 0), 0);

    root.innerHTML = `
      <div class="topbar">
        <div class="icon-btn" onclick="Router.navigate('/clients')"><i data-lucide="arrow-left"></i></div>
        <h1>Client</h1>
        <div class="icon-btn" onclick="Clients.openActions(${client.id})"><i data-lucide="more-horizontal"></i></div>
      </div>
      <div class="screen">
        <div class="glass detail-header">
          <div class="avatar">${Fmt.initials(client.companyName)}</div>
          <div style="flex:1; min-width:0;">
            <h2>${Fmt.escapeHtml(client.companyName)}</h2>
            <div class="sub">${Fmt.escapeHtml(client.contactPerson || 'No contact person set')}</div>
            <div class="contact-actions">
              ${client.phone ? `<a class="icon-btn" href="tel:${Fmt.escapeHtml(client.phone)}"><i data-lucide="phone"></i></a>` : ''}
              ${client.email ? `<a class="icon-btn" href="mailto:${Fmt.escapeHtml(client.email)}"><i data-lucide="mail"></i></a>` : ''}
            </div>
          </div>
        </div>

        <div class="stat-grid">
          <div class="glass card stat-card stat-tone-blue">
            <div class="icon-wrap"><i data-lucide="file-text"></i></div>
            <div class="stat-value">${contracts.length}</div>
            <div class="stat-label">Contracts</div>
          </div>
          <div class="glass card stat-card stat-tone-green">
            <div class="icon-wrap"><i data-lucide="wallet"></i></div>
            <div class="stat-value" style="font-size:20px;">${Fmt.money(totalValue)}</div>
            <div class="stat-label">Total Value</div>
          </div>
        </div>

        <div class="glass card">
          ${client.phone ? kv('Phone', Fmt.escapeHtml(client.phone)) : ''}
          ${client.email ? kv('Email', Fmt.escapeHtml(client.email)) : ''}
          ${client.address ? kv('Address', Fmt.escapeHtml(client.address)) : ''}
          ${client.city ? kv('City', Fmt.escapeHtml(client.city)) : ''}
          ${client.notes ? kv('Notes', Fmt.escapeHtml(client.notes)) : ''}
          ${(!client.phone && !client.email && !client.address && !client.city && !client.notes) ? `<div class="text-faint text-sm">No additional details yet.</div>` : ''}
        </div>

        <div class="section-label" style="display:flex; justify-content:space-between; align-items:center;">
          <span>Contracts</span>
          <button class="btn btn-sm btn-primary" onclick="Router.navigate('/contracts/new?clientId=${client.id}')">
            <i data-lucide="plus"></i> New
          </button>
        </div>
        <div class="glass card" style="padding: 6px 16px;">
          ${contracts.length ? contracts.map(c => Contracts.rowHtml(c, false)).join('') : `
            <div class="empty-state" style="padding:26px 10px;">
              <div class="icon-wrap"><i data-lucide="file-plus"></i></div>
              <h3>No contracts yet</h3>
              <p>Create the first contract for this client.</p>
            </div>
          `}
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  function kv(k, v) {
    return `<div class="kv-row"><span class="k">${k}</span><span class="v">${v}</span></div>`;
  }

  function openActions(id) {
    const sheet = UI.openSheet(`
      <div class="grabber"></div>
      <div class="sheet-title">Client Options</div>
      <div class="sheet-body" style="padding-bottom: 20px;">
        <div class="list-item card-tap" onclick="UI.closeSheet(); Router.navigate('/clients/${id}/edit')">
          <div class="avatar" style="background:rgba(62,107,255,0.12); color:var(--c-primary-1);"><i data-lucide="pencil"></i></div>
          <div class="li-body"><div class="li-title">Edit Client</div></div>
        </div>
        <div class="list-item card-tap" onclick="Clients.confirmDelete(${id})">
          <div class="avatar" style="background:rgba(255,71,87,0.12); color:var(--c-danger);"><i data-lucide="trash-2"></i></div>
          <div class="li-body"><div class="li-title" style="color:var(--c-danger);">Delete Client</div></div>
        </div>
      </div>
    `);
    if (window.lucide) lucide.createIcons();
  }

  async function confirmDelete(id) {
    UI.closeSheet();
    const ok = await UI.confirm('This will permanently remove the client. Clients with existing contracts cannot be deleted.', { danger: true, okLabel: 'Delete' });
    if (!ok) return;
    try {
      await Repo.deleteClient(id);
      UI.toast('Client deleted', 'success');
      Router.navigate('/clients');
    } catch (e) {
      UI.toast(e.message, 'error');
    }
  }

  return { renderList, renderForm, renderDetail, openActions, confirmDelete };
})();
