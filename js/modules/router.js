// =========================================================
// DarziHub — Hash router with lazy-loaded route modules
// =========================================================

const Router = (() => {
  const routes = [];
  const loadedScripts = new Set();

  function register(pattern, descriptor) {
    const paramNames = [];
    const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, (m) => { paramNames.push(m.slice(1)); return '([^/]+)'; }) + '$');
    routes.push({ pattern, regex, paramNames, descriptor });
  }

  function loadScript(src) {
    if (loadedScripts.has(src)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => { loadedScripts.add(src); resolve(); };
      s.onerror = reject;
      document.body.appendChild(s);
    });
  }

  async function resolve(hash) {
    const path = (hash || '#/dashboard').replace(/^#/, '') || '/dashboard';
    const [rawPath, queryString] = path.split('?');
    const query = Object.fromEntries(new URLSearchParams(queryString || ''));
    window.scrollTo(0, 0);

    for (const route of routes) {
      const m = rawPath.match(route.regex);
      if (!m) continue;
      const params = {};
      route.paramNames.forEach((name, i) => { params[name] = decodeURIComponent(m[i + 1]); });
      params.query = query;
      const src = route.descriptor.src;
      const srcs = Array.isArray(src) ? src : (src ? [src] : []);
      try { for (const s of srcs) await loadScript(s); }
      catch (e) { console.error('Failed to load route module', e); UI.toast(t('loadFailed'), 'error'); return; }
      setActiveNav(rawPath);
      route.descriptor.run(params);
      return;
    }
    navigate('/dashboard');
  }

  function setActiveNav(path) {
    const top = '/' + (path.split('/')[1] || 'dashboard');
    qsa('.nav-item').forEach(item => item.classList.toggle('active', '/' + item.dataset.route === top));
  }

  function navigate(path) {
    if (location.hash.replace(/^#/, '') === path) resolve('#' + path);
    else location.hash = path;
  }

  function refresh() { resolve(location.hash); }

  function start() {
    window.addEventListener('hashchange', () => resolve(location.hash));
    resolve(location.hash);
  }

  return { register, navigate, refresh, start };
})();
