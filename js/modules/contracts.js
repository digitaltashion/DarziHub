// =========================================================
// ContractHub — Contracts
// =========================================================

const Contracts = (() => {

  const STATUSES = ['draft', 'sent', 'signed', 'active', 'completed', 'cancelled'];

  // ---------------- List ----------------

  async function renderList() {
    const root = qs('#screen-root');
    root.innerHTML = `<div class="screen"><div class="text-faint" style="padding:40px 0; text-align:center;">Loading…</div></div>`;

    const [contracts, clients] = await Promise.all([Repo.listContracts(), Repo.listClients()]);
    const clientMap = Object.fromEntries(clients.map(c => [c.id, c]));

    root.innerHTML = `
      <div class="topbar">
        <h1>Contracts</h1>
        <div class="icon-btn" onclick="Router.navigate('/contracts/new')"><i data-lucide="plus"></i></div>
      </div>
      <div class="screen">
        <div class="glass search-bar">
          <i data-lucide="search"></i>
          <input type="text" id="contract-search" placeholder="Search by client, software, or number…" />
        </div>
        <div class="segmented" id="status-filter" style="margin-bottom:16px;">
          <button class="active" data-status="all">All</button>
          ${STATUSES.map(s => `<button data-status="${s}">${Fmt.statusLabel(s)}</button>`).join('')}
        </div>
        <div id="contract-list-body">
          ${contracts.length ? renderRows(contracts, clientMap) : emptyState()}
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();

    let currentStatus = 'all';
    function applyFilters() {
      const term = qs('#contract-search').value.trim().toLowerCase();
      let filtered = contracts;
      if (currentStatus !== 'all') filtered = filtered.filter(c => c.status === currentStatus);
      if (term) {
        filtered = filtered.filter(c => {
          const client = clientMap[c.clientId];
          const hay = [c.softwareName, c.title, c.contractNumber, client && client.companyName].filter(Boolean).join(' ').toLowerCase();
          return hay.includes(term);
        });
      }
      qs('#contract-list-body').innerHTML = filtered.length ? renderRows(filtered, clientMap) : emptyState(!!term || currentStatus !== 'all');
      if (window.lucide) lucide.createIcons();
    }

    qs('#contract-search').addEventListener('input', debounce(applyFilters, 200));
    qsa('#status-filter button').forEach(btn => {
      btn.addEventListener('click', () => {
        qsa('#status-filter button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentStatus = btn.dataset.status;
        applyFilters();
      });
    });
  }

  function renderRows(list, clientMap) {
    return `<div class="glass card" style="padding: 6px 16px;">
      ${list.map(c => rowHtml(c, true, clientMap[c.clientId])).join('')}
    </div>`;
  }

  function rowHtml(c, showClient, client) {
    return `
      <div class="list-item card-tap" onclick="Router.navigate('/contracts/${c.id}')">
        <div class="avatar">${Fmt.initials(client ? client.companyName : (c.softwareName || 'C'))}</div>
        <div class="li-body">
          <div class="li-title">${Fmt.escapeHtml(c.softwareName || c.title || 'Untitled contract')}</div>
          <div class="li-sub">${showClient && client ? Fmt.escapeHtml(client.companyName) + ' · ' : ''}${c.contractNumber}</div>
        </div>
        <div class="li-trail">
          <div style="font-weight:700; font-size:13.5px;">${Fmt.money(c.amount, c.currency)}</div>
          <span class="badge badge-${c.status}" style="margin-top:4px;">${Fmt.statusLabel(c.status)}</span>
        </div>
      </div>
    `;
  }

  function emptyState(isFiltered) {
    return `
      <div class="empty-state glass card">
        <div class="icon-wrap"><i data-lucide="${isFiltered ? 'search-x' : 'file-text'}"></i></div>
        <h3>${isFiltered ? 'No matches' : 'No contracts yet'}</h3>
        <p>${isFiltered ? 'Try a different search or filter.' : 'Create a contract for a client to see it here.'}</p>
        ${isFiltered ? '' : `<button class="btn btn-primary" style="margin-top:16px;" onclick="Router.navigate('/contracts/new')"><i data-lucide="plus"></i> New Contract</button>`}
      </div>
    `;
  }

  // ---------------- Form (create/edit) ----------------

  let scheduleRows = [];
  let scheduleSeq = 0;

  async function renderForm(params) {
    const isEdit = !!params.id;
    const contract = isEdit ? await Repo.getContract(params.id) : {};
    const presetClientId = params.query && params.query.clientId;
    const [clients, settings] = await Promise.all([Repo.listClients(), Repo.getSettings()]);
    const root = qs('#screen-root');

    scheduleRows = (contract.paymentSchedule || []).map(r => ({ ...r, _key: ++scheduleSeq }));
    const paymentType = contract.paymentType || 'full';
    const currency = contract.currency || settings.currency || 'PKR';

    if (!clients.length) {
      root.innerHTML = `
        <div class="topbar"><div class="icon-btn" onclick="history.back()"><i data-lucide="arrow-left"></i></div><h1>New Contract</h1><div style="width:38px;"></div></div>
        <div class="screen">
          <div class="empty-state glass card">
            <div class="icon-wrap"><i data-lucide="user-plus"></i></div>
            <h3>Add a client first</h3>
            <p>You need at least one client before creating a contract.</p>
            <button class="btn btn-primary" style="margin-top:16px;" onclick="Router.navigate('/clients/new')"><i data-lucide="plus"></i> Add Client</button>
          </div>
        </div>`;
      if (window.lucide) lucide.createIcons();
      return;
    }

    root.innerHTML = `
      <div class="topbar">
        <div class="icon-btn" onclick="history.back()"><i data-lucide="arrow-left"></i></div>
        <h1>${isEdit ? 'Edit Contract' : 'New Contract'}</h1>
        <div style="width:38px;"></div>
      </div>
      <div class="screen">
        <form id="contract-form">

          <div class="section-label" style="margin-top:0;">Client</div>
          <div class="glass card">
            <div class="field" style="margin-bottom:0;">
              <label>Select Client *</label>
              <select name="clientId" required>
                <option value="">Choose a client…</option>
                ${clients.map(c => `<option value="${c.id}" ${String(c.id) === String(contract.clientId || presetClientId) ? 'selected' : ''}>${Fmt.escapeHtml(c.companyName)}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="section-label">Software / Service</div>
          <div class="glass card">
            <div class="field">
              <label>Contract Title *</label>
              <input type="text" name="softwareName" required value="${Fmt.escapeHtml(contract.softwareName || '')}" placeholder="e.g. Point of Sale System Development" />
            </div>
            <div class="field" style="margin-bottom:0;">
              <label>Scope of Work</label>
              <textarea name="scopeDescription" placeholder="Describe what will be delivered — modules, features, platforms…">${Fmt.escapeHtml(contract.scopeDescription || '')}</textarea>
            </div>
          </div>

          <div class="section-label">Pricing</div>
          <div class="glass card">
            <div class="row-2">
              <div class="field">
                <label>Total Amount *</label>
                <input type="number" name="amount" min="0" step="0.01" required value="${contract.amount ?? ''}" placeholder="0" />
              </div>
              <div class="field">
                <label>Currency</label>
                <input type="text" name="currency" value="${Fmt.escapeHtml(currency)}" placeholder="PKR" />
              </div>
            </div>
            <div class="field">
              <label>Payment Type</label>
              <div class="segmented" id="payment-type-toggle">
                <button type="button" data-type="full" class="${paymentType === 'full' ? 'active' : ''}">Full Payment</button>
                <button type="button" data-type="installments" class="${paymentType === 'installments' ? 'active' : ''}">Installments</button>
              </div>
            </div>
            <input type="hidden" name="paymentType" id="payment-type-value" value="${paymentType}" />

            <div id="schedule-builder" style="${paymentType === 'installments' ? '' : 'display:none;'}">
              <label style="display:block; font-size:13px; font-weight:600; color:var(--c-ink-soft); margin: 4px 4px 8px;">Installments</label>
              <div id="schedule-rows"></div>
              <button type="button" class="btn btn-subtle btn-sm" id="add-schedule-row"><i data-lucide="plus"></i> Add Installment</button>
              <div class="schedule-total" id="schedule-total"></div>
            </div>
          </div>

          <div class="section-label">Timeline</div>
          <div class="glass card">
            <div class="row-2">
              <div class="field">
                <label>Start Date</label>
                <input type="date" name="startDate" value="${Fmt.dateInput(contract.startDate) || Fmt.dateInput(Date.now())}" />
              </div>
              <div class="field">
                <label>Delivery Date</label>
                <input type="date" name="deliveryDate" value="${Fmt.dateInput(contract.deliveryDate)}" />
              </div>
            </div>
            <div class="field" style="margin-bottom:0;">
              <label>Support / Warranty Period (months)</label>
              <input type="number" name="supportPeriodMonths" min="0" value="${contract.supportPeriodMonths ?? '3'}" placeholder="3" />
            </div>
          </div>

          <div class="section-label">Status</div>
          <div class="glass card">
            <select name="status">
              ${STATUSES.map(s => `<option value="${s}" ${((contract.status || 'draft') === s) ? 'selected' : ''}>${Fmt.statusLabel(s)}</option>`).join('')}
            </select>
          </div>

          <div class="section-label">Terms &amp; Conditions</div>
          <div class="glass card">
            <textarea class="terms-textarea" name="termsAndConditions" placeholder="Terms and conditions for this contract">${Fmt.escapeHtml(contract.termsAndConditions != null ? contract.termsAndConditions : settings.defaultTerms)}</textarea>
            <div class="hint">Pre-filled from your default terms in Settings — edit freely for this contract.</div>
          </div>

          <div class="section-label">Notes</div>
          <div class="glass card">
            <textarea name="notes" placeholder="Internal notes (not shown on the PDF)">${Fmt.escapeHtml(contract.notes || '')}</textarea>
          </div>

          <button type="submit" class="btn btn-primary btn-block">
            <i data-lucide="check"></i> ${isEdit ? 'Save Changes' : 'Create Contract'}
          </button>
        </form>
      </div>
    `;
    if (window.lucide) lucide.createIcons();

    renderScheduleRows(currency);

    qs('#payment-type-toggle').addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      qsa('#payment-type-toggle button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      qs('#payment-type-value').value = btn.dataset.type;
      qs('#schedule-builder').style.display = btn.dataset.type === 'installments' ? '' : 'none';
      if (btn.dataset.type === 'installments' && scheduleRows.length === 0) {
        addScheduleRow();
      }
    });

    qs('#add-schedule-row').addEventListener('click', () => addScheduleRow());

    qs('#contract-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = Object.fromEntries(fd.entries());
      data.amount = parseFloat(data.amount) || 0;
      data.supportPeriodMonths = data.supportPeriodMonths ? parseInt(data.supportPeriodMonths, 10) : 0;
      data.startDate = data.startDate ? new Date(data.startDate).getTime() : null;
      data.deliveryDate = data.deliveryDate ? new Date(data.deliveryDate).getTime() : null;
      if (data.paymentType === 'installments') {
        collectScheduleFromDOM();
        data.paymentSchedule = scheduleRows.map(r => ({
          label: r.label, amount: parseFloat(r.amount) || 0,
          dueDate: r.dueDate ? new Date(r.dueDate).getTime() : null
        }));
      } else {
        data.paymentSchedule = [];
      }
      if (!data.clientId) { UI.toast('Please select a client', 'error'); return; }
      if (isEdit) data.id = Number(params.id);
      data.clientId = Number(data.clientId);
      const id = await Repo.saveContract(data);
      UI.toast(isEdit ? 'Contract updated' : 'Contract created', 'success');
      Router.navigate(`/contracts/${id}`);
    });
  }

  function addScheduleRow() {
    scheduleRows.push({ _key: ++scheduleSeq, label: `Installment ${scheduleRows.length + 1}`, amount: '', dueDate: '' });
    renderScheduleRows();
  }

  function collectScheduleFromDOM() {
    qsa('.schedule-row').forEach(row => {
      const key = Number(row.dataset.key);
      const item = scheduleRows.find(r => r._key === key);
      if (!item) return;
      item.label = row.querySelector('.sched-label').value;
      item.amount = row.querySelector('.sched-amount').value;
      item.dueDate = row.querySelector('.sched-date').value;
    });
  }

  function renderScheduleRows() {
    const wrap = qs('#schedule-rows');
    if (!wrap) return;
    collectScheduleFromDOM();
    wrap.innerHTML = scheduleRows.map(r => `
      <div class="schedule-row" data-key="${r._key}">
        <input type="text" class="sched-label" placeholder="Label (e.g. Advance)" value="${Fmt.escapeHtml(r.label || '')}" />
        <input type="number" class="sched-amount" placeholder="Amount" min="0" step="0.01" value="${r.amount || ''}" />
        <input type="date" class="sched-date" value="${r.dueDate ? Fmt.dateInput(r.dueDate) : ''}" />
        <button type="button" class="sched-remove" onclick="Contracts.removeScheduleRow(${r._key})"><i data-lucide="x"></i></button>
      </div>
    `).join('');
    if (window.lucide) lucide.createIcons();
    qsa('.schedule-row input').forEach(inp => inp.addEventListener('input', updateScheduleTotal));
    updateScheduleTotal();
  }

  function removeScheduleRow(key) {
    collectScheduleFromDOM();
    scheduleRows = scheduleRows.filter(r => r._key !== key);
    renderScheduleRows();
  }

  function updateScheduleTotal() {
    const totalEl = qs('#schedule-total');
    if (!totalEl) return;
    const amountField = qs('input[name="amount"]');
    const contractTotal = parseFloat(amountField ? amountField.value : 0) || 0;
    let sum = 0;
    qsa('.sched-amount').forEach(inp => { sum += parseFloat(inp.value) || 0; });
    const mismatch = Math.abs(sum - contractTotal) > 0.01 && contractTotal > 0;
    totalEl.className = 'schedule-total' + (mismatch ? ' mismatch' : '');
    totalEl.innerHTML = `<span>Installments total</span><span>${sum.toLocaleString()} ${mismatch ? `(contract: ${contractTotal.toLocaleString()})` : ''}</span>`;
  }

  // ---------------- Detail ----------------

  async function renderDetail(params) {
    const contract = await Repo.getContract(params.id);
    const root = qs('#screen-root');
    if (!contract) { Router.navigate('/contracts'); return; }
    const [client, settings] = await Promise.all([Repo.getClient(contract.clientId), Repo.getSettings()]);

    root.innerHTML = `
      <div class="topbar">
        <div class="icon-btn" onclick="Router.navigate('/contracts')"><i data-lucide="arrow-left"></i></div>
        <h1>Contract</h1>
        <div class="icon-btn" onclick="Contracts.openActions(${contract.id})"><i data-lucide="more-horizontal"></i></div>
      </div>
      <div class="screen">
        <div class="glass card">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
            <div>
              <div class="text-faint text-sm mono" style="font-weight:700;">${contract.contractNumber}</div>
              <h2 style="font-size:18px; margin-top:4px;">${Fmt.escapeHtml(contract.softwareName || contract.title || 'Untitled contract')}</h2>
            </div>
            <span class="badge badge-${contract.status}">${Fmt.statusLabel(contract.status)}</span>
          </div>
          ${client ? `
            <div class="list-item card-tap" style="margin-top:12px; padding-left:0; padding-right:0;" onclick="Router.navigate('/clients/${client.id}')">
              <div class="avatar" style="width:38px;height:38px;border-radius:11px;font-size:13px;">${Fmt.initials(client.companyName)}</div>
              <div class="li-body">
                <div class="li-title" style="font-size:14px;">${Fmt.escapeHtml(client.companyName)}</div>
                <div class="li-sub">${Fmt.escapeHtml(client.contactPerson || 'View client')}</div>
              </div>
              <i data-lucide="chevron-right" style="color:var(--c-ink-faint); width:18px; height:18px;"></i>
            </div>
          ` : ''}
        </div>

        <div class="section-label">Status</div>
        <div class="status-stepper">
          ${STATUSES.map(s => `
            <div class="status-chip ${s === contract.status ? 'current' : ''}" onclick="Contracts.changeStatus(${contract.id}, '${s}')">${Fmt.statusLabel(s)}</div>
          `).join('')}
        </div>

        <div class="section-label">Contract Details</div>
        <div class="glass card">
          ${contract.scopeDescription ? `<p class="text-sm" style="line-height:1.6; margin-bottom:14px;">${Fmt.escapeHtml(contract.scopeDescription)}</p><hr class="divider" />` : ''}
          <div class="kv-row"><span class="k">Total Amount</span><span class="v">${Fmt.money(contract.amount, contract.currency)}</span></div>
          <div class="kv-row"><span class="k">Payment Type</span><span class="v">${contract.paymentType === 'installments' ? 'Installments' : 'Full Payment'}</span></div>
          <div class="kv-row"><span class="k">Start Date</span><span class="v">${Fmt.date(contract.startDate)}</span></div>
          <div class="kv-row"><span class="k">Delivery Date</span><span class="v">${Fmt.date(contract.deliveryDate)}</span></div>
          <div class="kv-row"><span class="k">Support Period</span><span class="v">${contract.supportPeriodMonths || 0} month${contract.supportPeriodMonths === 1 ? '' : 's'}</span></div>
        </div>

        ${contract.paymentType === 'installments' && contract.paymentSchedule && contract.paymentSchedule.length ? `
          <div class="section-label">Payment Schedule</div>
          <div class="glass card">
            ${contract.paymentSchedule.map(p => `
              <div class="line-item">
                <div>
                  <div style="font-weight:600; font-size:13.5px;">${Fmt.escapeHtml(p.label || 'Installment')}</div>
                  <div class="text-faint text-sm">${Fmt.date(p.dueDate, { short: true })}</div>
                </div>
                <div style="font-weight:700;">${Fmt.money(p.amount, contract.currency)}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${contract.notes ? `
          <div class="section-label">Internal Notes</div>
          <div class="glass card"><p class="text-sm text-soft" style="line-height:1.6;">${Fmt.escapeHtml(contract.notes)}</p></div>
        ` : ''}

        <div class="section-label">Terms &amp; Conditions</div>
        <div class="glass card">
          <p class="text-sm text-soft" style="line-height:1.7; white-space:pre-wrap;">${Fmt.escapeHtml(contract.termsAndConditions || settings.defaultTerms)}</p>
        </div>

        <button class="btn btn-primary btn-block" id="generate-pdf-btn">
          <i data-lucide="file-down"></i> Generate Contract PDF
        </button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();

    qs('#generate-pdf-btn').addEventListener('click', async () => {
      const btn = qs('#generate-pdf-btn');
      btn.disabled = true;
      btn.innerHTML = `<i data-lucide="loader" class="spin"></i> Generating…`;
      if (window.lucide) lucide.createIcons();
      try {
        await ContractPDF.generate(contract, client, settings);
        UI.toast('PDF generated', 'success');
      } catch (err) {
        console.error(err);
        UI.toast('Could not generate PDF', 'error');
      }
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="file-down"></i> Generate Contract PDF`;
      if (window.lucide) lucide.createIcons();
    });
  }

  function openActions(id) {
    UI.openSheet(`
      <div class="grabber"></div>
      <div class="sheet-title">Contract Options</div>
      <div class="sheet-body" style="padding-bottom:20px;">
        <div class="list-item card-tap" onclick="UI.closeSheet(); Router.navigate('/contracts/${id}/edit')">
          <div class="avatar" style="background:rgba(62,107,255,0.12); color:var(--c-primary-1);"><i data-lucide="pencil"></i></div>
          <div class="li-body"><div class="li-title">Edit Contract</div></div>
        </div>
        <div class="list-item card-tap" onclick="Contracts.confirmDelete(${id})">
          <div class="avatar" style="background:rgba(255,71,87,0.12); color:var(--c-danger);"><i data-lucide="trash-2"></i></div>
          <div class="li-body"><div class="li-title" style="color:var(--c-danger);">Delete Contract</div></div>
        </div>
      </div>
    `);
    if (window.lucide) lucide.createIcons();
  }

  async function changeStatus(id, status) {
    await Repo.setContractStatus(id, status);
    UI.toast(`Status set to ${Fmt.statusLabel(status)}`, 'success');
    renderDetail({ id });
  }

  async function confirmDelete(id) {
    UI.closeSheet();
    const ok = await UI.confirm('This will permanently delete the contract.', { danger: true, okLabel: 'Delete' });
    if (!ok) return;
    await Repo.deleteContract(id);
    UI.toast('Contract deleted', 'success');
    Router.navigate('/contracts');
  }

  return {
    renderList, renderForm, renderDetail, rowHtml,
    openActions, changeStatus, confirmDelete, removeScheduleRow
  };
})();
