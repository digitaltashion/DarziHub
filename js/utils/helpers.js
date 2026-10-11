// =========================================================
// DarziHub — Shared UI helpers
// =========================================================

const t = (k, l) => I18n.t(k, l);
const esc = (s) => Fmt.escapeHtml(s);

const UI = (() => {
  function el(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    return tpl.content.firstElementChild;
  }
  function openSheet(innerHtml, opts = {}) {
    closeSheet();
    const overlay = el(`<div class="overlay" id="active-sheet-overlay"></div>`);
    const sheet = el(`<div class="sheet ${opts.wide ? 'sheet-wide' : ''}">${innerHtml}</div>`);
    overlay.appendChild(sheet);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSheet(); });
    requestAnimationFrame(() => overlay.classList.add('show'));
    if (window.lucide) lucide.createIcons();
    return sheet;
  }
  function closeSheet() {
    const overlay = document.getElementById('active-sheet-overlay');
    if (!overlay) return;
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 180);
  }
  function confirm(message, opts = {}) {
    return new Promise((resolve) => {
      const sheet = openSheet(`
        <div class="sheet-title">${opts.title || t('areYouSure')}</div>
        <p class="text-faint" style="padding: 0 20px 8px;">${message}</p>
        <div style="display:flex; gap:10px; padding: 12px 20px 20px;">
          <button class="btn btn-ghost btn-block" id="confirm-cancel">${t('cancel')}</button>
          <button class="btn ${opts.danger ? 'btn-danger' : 'btn-primary'} btn-block" id="confirm-ok">${opts.okLabel || t('confirm')}</button>
        </div>
      `);
      sheet.querySelector('#confirm-cancel').onclick = () => { closeSheet(); resolve(false); };
      sheet.querySelector('#confirm-ok').onclick = () => { closeSheet(); resolve(true); };
    });
  }
  function toast(message, type = 'default') { Toast.show(message, type); }
  return { el, openSheet, closeSheet, confirm, toast };
})();

function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
function debounce(fn, wait = 250) {
  let tm;
  return (...args) => { clearTimeout(tm); tm = setTimeout(() => fn(...args), wait); };
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(n, from) {
  const d = from ? new Date(from + 'T00:00:00') : new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Resize + compress a photo so IndexedDB stays small
function compressImage(file, max = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image')); };
    img.src = url;
  });
}

// Phone → WhatsApp international format (default country code from settings)
function waNumber(phone, cc = '92') {
  let d = String(phone || '').replace(/[^\d]/g, '');
  if (!d) return '';
  if (d.startsWith('00')) return d.slice(2);
  if (d.startsWith('0')) return cc + d.slice(1);
  return d;
}

// Shared page chrome ------------------------------------------------
function topbar(title, { back, right } = {}) {
  const left = back
    ? `<div class="icon-btn" onclick="${back === 'history' ? 'history.back()' : `Router.navigate('${back}')`}"><i data-lucide="arrow-left" class="flip"></i></div>`
    : '<div style="width:38px;"></div>';
  return `<div class="topbar">${left}<h1>${title}</h1>${right || '<div style="width:38px;"></div>'}</div>`;
}
function emptyState(icon, title, text, btnHtml = '') {
  return `<div class="empty-state glass card"><div class="icon-wrap"><i data-lucide="${icon}"></i></div>
    <h3>${title}</h3><p>${text}</p>${btnHtml}</div>`;
}
function kv(k, v) { return `<div class="kv-row"><span class="k">${k}</span><span class="v">${v}</span></div>`; }
function loadingHtml() { return `<div class="screen"><div class="text-faint" style="padding:40px 0; text-align:center;">${t('loading')}</div></div>`; }
