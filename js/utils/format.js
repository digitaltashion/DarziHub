// =========================================================
// DarziHub — Formatting utilities (language-aware)
// =========================================================

const Fmt = {
  currency: 'Rs',
  money(amount) {
    const n = Number(amount) || 0;
    const s = Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
    return `${n < 0 ? '-' : ''}${this.currency} ${s}`;
  },
  _d(ts) {
    if (!ts) return null;
    const d = (typeof ts === 'string' && /^\d{4}-\d\d-\d\d$/.test(ts)) ? new Date(ts + 'T00:00:00') : new Date(ts);
    return isNaN(d.getTime()) ? null : d;
  },
  date(ts, opts = {}, lang) {
    const d = this._d(ts);
    if (!d) return '—';
    const loc = (lang || I18n.lang) === 'ur' ? 'ur-PK-u-nu-latn' : 'en-GB';
    return d.toLocaleDateString(loc, { day: 'numeric', month: opts.short ? 'short' : 'long', year: 'numeric' });
  },
  monthYear(y, m) {
    const loc = I18n.lang === 'ur' ? 'ur-PK-u-nu-latn' : 'en-GB';
    return new Date(y, m, 1).toLocaleDateString(loc, { month: 'long', year: 'numeric' });
  },
  initials(name) {
    if (!name) return '?';
    return name.trim().split(/\s+/).slice(0, 2).map(w => Array.from(w)[0]?.toUpperCase() || '').join('');
  },
  daysFromToday(dateStr) {
    const d = this._d(dateStr);
    if (!d) return null;
    const now = new Date(); now.setHours(0, 0, 0, 0);
    return Math.round((d - now) / 86400000);
  },
  escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
};
