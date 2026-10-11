// =========================================================
// DarziHub — Garment types & measurement templates
// (all measurements in inches; bilingual labels)
// =========================================================

const Garments = (() => {
  const FIELDS = {
    length:     ['Length', 'لمبائی'],
    shoulder:   ['Shoulder (Teera)', 'تیرہ'],
    sleeve:     ['Sleeve (Bazu)', 'بازو'],
    chest:      ['Chest / Bust', 'چھاتی'],
    waist:      ['Waist (Kamar)', 'کمر'],
    hip:        ['Hip', 'ہپ'],
    hem:        ['Ghera (Width)', 'گھیرا'],
    collar:     ['Collar / Neck (Gala)', 'گلا'],
    cuff:       ['Cuff', 'کف'],
    thigh:      ['Thigh', 'ران'],
    bottom:     ['Bottom (Pancha)', 'پائنچہ'],
    sleeveOpen: ['Sleeve opening', 'آستین کا منہ'],
    frontNeck:  ['Front neck depth', 'آگے کا گلا'],
    backNeck:   ['Back neck depth', 'پیچھے کا گلا'],
    rise:       ['Rise', 'رائز'],
    knee:       ['Knee', 'گھٹنا']
  };

  const LIST = [
    // ---- Gents ----
    { key: 'qameez',    group: 'gents',  en: 'Qameez / Kurta',   ur: 'قمیص / کرتا',   fields: ['length','shoulder','sleeve','chest','waist','hem','collar','cuff'] },
    { key: 'shalwar',   group: 'gents',  en: 'Shalwar',          ur: 'شلوار',          fields: ['length','waist','hip','hem','bottom'] },
    { key: 'pant',      group: 'gents',  en: 'Pant',             ur: 'پینٹ',           fields: ['length','waist','hip','thigh','knee','bottom','rise'] },
    { key: 'shirt',     group: 'gents',  en: 'Shirt',            ur: 'شرٹ',            fields: ['length','shoulder','sleeve','chest','waist','collar','cuff'] },
    { key: 'waistcoat', group: 'gents',  en: 'Waistcoat',        ur: 'واسکٹ',          fields: ['length','shoulder','chest','waist','collar'] },
    { key: 'coat',      group: 'gents',  en: 'Coat / Blazer',    ur: 'کوٹ',            fields: ['length','shoulder','sleeve','chest','waist','hip'] },
    { key: 'sherwani',  group: 'gents',  en: 'Sherwani',         ur: 'شیروانی',        fields: ['length','shoulder','sleeve','chest','waist','hip','collar'] },
    // ---- Ladies ----
    { key: 'lqameez',   group: 'ladies', en: 'Ladies Qameez',    ur: 'لیڈیز قمیص',    fields: ['length','shoulder','sleeve','sleeveOpen','chest','waist','hip','hem','frontNeck','backNeck'] },
    { key: 'ltrouser',  group: 'ladies', en: 'Trouser / Shalwar',ur: 'ٹراؤزر / شلوار', fields: ['length','waist','hip','thigh','hem','bottom'] },
    { key: 'blouse',    group: 'ladies', en: 'Blouse',           ur: 'بلاؤز',          fields: ['length','shoulder','sleeve','sleeveOpen','chest','waist','frontNeck','backNeck'] },
    { key: 'frock',     group: 'ladies', en: 'Frock / Maxi',     ur: 'فراک / میکسی',   fields: ['length','shoulder','sleeve','chest','waist','hip','hem','frontNeck','backNeck'] },
    { key: 'gharara',   group: 'ladies', en: 'Gharara / Sharara',ur: 'غرارہ / شرارہ',  fields: ['length','waist','hip','hem','knee'] },
    // ---- Other ----
    { key: 'other',     group: 'other',  en: 'Other',            ur: 'دیگر',           fields: ['length','chest','waist','hip','shoulder','sleeve'] }
  ];

  const byKey = Object.fromEntries(LIST.map(g => [g.key, g]));
  const name = (key, lang) => { const g = byKey[key]; return g ? ((lang || I18n.lang) === 'ur' ? g.ur : g.en) : key; };
  const fieldLabel = (f, lang) => FIELDS[f] ? FIELDS[f][(lang || I18n.lang) === 'ur' ? 1 : 0] : f;
  const groups = (gender) => {
    if (gender === 'gents') return ['gents', 'other'];
    if (gender === 'ladies') return ['ladies', 'other'];
    return ['gents', 'ladies', 'other'];
  };
  const groupLabel = { gents: 'gents', ladies: 'ladies', other: 'other' };
  const summary = (items, lang) => (items || []).map(i => `${i.qty || 1}× ${name(i.garment, lang)}`).join(', ');

  // <option> list grouped by category
  function optionsHtml(selected) {
    return ['gents', 'ladies', 'other'].map(gr => `
      <optgroup label="${t(groupLabel[gr])}">
        ${LIST.filter(g => g.group === gr).map(g => `<option value="${g.key}" ${g.key === selected ? 'selected' : ''}>${esc(name(g.key))}</option>`).join('')}
      </optgroup>`).join('');
  }

  return { LIST, byKey, name, fieldLabel, groups, summary, optionsHtml };
})();
