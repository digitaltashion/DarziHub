// =========================================================
// DarziHub — PIN lock (soft lock: keeps casual eyes out;
// data in IndexedDB and backup files are NOT encrypted)
// =========================================================

const Lock = (() => {
  const KEY = 'darzi_pin_hash', SALT = 'darzi_pin_salt';

  async function hash(pin, salt) {
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${pin}`));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback for non-secure contexts (plain http): weaker, but still not plain text
    let h = 5381; const s = `${salt}:${pin}`;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return 'x' + h.toString(16);
  }
  const has = () => !!localStorage.getItem(KEY);
  async function set(pin) {
    const salt = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(SALT, salt);
    localStorage.setItem(KEY, await hash(pin, salt));
  }
  function remove() { localStorage.removeItem(KEY); localStorage.removeItem(SALT); }
  async function verify(pin) { return (await hash(pin, localStorage.getItem(SALT) || '')) === localStorage.getItem(KEY); }

  let showing = null;
  // Full-screen keypad. Resolves when unlocked.
  function show() {
    if (showing) return showing;
    showing = new Promise((resolve) => {
      let pin = '', fails = 0;
      const el = document.createElement('div');
      el.id = 'lock-screen'; el.className = 'lock-screen';
      el.innerHTML = `
        <div class="lock-box glass-strong">
          <div class="avatar" style="width:56px; height:56px; margin:0 auto 14px;"><i data-lucide="lock"></i></div>
          <div class="lock-title">${t('enterPin')}</div>
          <div class="lock-dots" dir="ltr">${[0, 1, 2, 3].map(i => `<span data-d="${i}"></span>`).join('')}</div>
          <div class="lock-msg" id="lock-msg"></div>
          <div class="lock-pad" dir="ltr">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-k="${n}">${n}</button>`).join('')}
            <button data-k="clear" class="lock-alt">C</button><button data-k="0">0</button><button data-k="back" class="lock-alt">⌫</button>
          </div>
          <a href="javascript:void(0)" id="lock-forgot" class="text-sm" style="display:none; color:var(--c-danger); font-weight:700; margin-top:14px;">${t('forgotPin')}</a>
        </div>`;
      document.body.appendChild(el);
      if (window.lucide) lucide.createIcons();

      const paint = () => qsa('.lock-dots span', el).forEach((d, i) => d.classList.toggle('on', i < pin.length));
      el.addEventListener('click', async (e) => {
        const b = e.target.closest('button'); if (!b) return;
        const k = b.dataset.k;
        if (k === 'back') pin = pin.slice(0, -1);
        else if (k === 'clear') pin = '';
        else if (pin.length < 4) pin += k;
        paint();
        if (pin.length === 4) {
          if (await verify(pin)) { el.remove(); showing = null; resolve(); }
          else {
            fails++; pin = ''; paint();
            qs('#lock-msg', el).textContent = t('wrongPin');
            qs('.lock-dots', el).classList.add('shake'); setTimeout(() => qs('.lock-dots', el).classList.remove('shake'), 400);
            if (fails >= 5) qs('#lock-forgot', el).style.display = 'inline-block';
          }
        }
      });
      qs('#lock-forgot', el).onclick = async () => {
        if (!await UI.confirm(t('forgotPinMsg'), { danger: true, okLabel: t('eraseEverything') })) return;
        await Repo.wipeAll(); remove(); location.reload();
      };
    });
    return showing;
  }

  // Small sheet that asks for a 4-digit PIN; resolves string or null
  function prompt(title) {
    return new Promise((resolve) => {
      const sheet = UI.openSheet(`
        <div class="grabber"></div><div class="sheet-title">${title}</div>
        <div class="sheet-body"><div class="field"><input type="password" inputmode="numeric" maxlength="4" pattern="[0-9]*" id="pin-in" style="text-align:center; font-size:22px; letter-spacing:8px;" /></div></div>
        <div class="sheet-actions"><button class="btn btn-ghost btn-block" id="pin-c">${t('cancel')}</button>
        <button class="btn btn-primary btn-block" id="pin-ok">${t('confirm')}</button></div>`);
      const done = (v) => { UI.closeSheet(); resolve(v); };
      qs('#pin-c', sheet).onclick = () => done(null);
      qs('#pin-ok', sheet).onclick = () => {
        const v = qs('#pin-in', sheet).value.trim();
        if (!/^\d{4}$/.test(v)) { UI.toast(t('pin4'), 'error'); return; }
        done(v);
      };
      setTimeout(() => qs('#pin-in', sheet) && qs('#pin-in', sheet).focus(), 250);
    });
  }

  return { has, set, remove, verify, show, prompt };
})();
