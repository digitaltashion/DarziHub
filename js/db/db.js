// =========================================================
// DarziHub — IndexedDB layer (Dexie)
// Fully offline: nothing is ever sent to a server.
// =========================================================

const db = new Dexie('DarziHubDB');
db.version(1).stores({
  customers: '++id, name, phone, createdAt',
  orders: '++id, customerId, orderNumber, status, deliveryDate, orderDate, createdAt',
  payments: '++id, customerId, orderId, date',
  expenses: '++id, date, category',
  settings: 'id'
});

// v2: family members (headId), stock, cash book
db.version(2).stores({
  customers: '++id, name, phone, headId, createdAt',
  orders: '++id, customerId, orderNumber, status, deliveryDate, orderDate, createdAt',
  payments: '++id, customerId, orderId, date',
  expenses: '++id, date, category',
  stock: '++id, name, category',
  stockLog: '++id, stockId, date',
  cashDay: 'date',
  settings: 'id'
});

const STATUSES = ['new', 'cutting', 'stitching', 'ready', 'delivered', 'cancelled'];
const PENDING = ['new', 'cutting', 'stitching', 'ready'];
const EXPENSE_CATS = ['cloth', 'notions', 'rent', 'bills', 'helper', 'transport', 'other'];

const DEFAULT_SETTINGS = {
  id: 'main',
  shopName: 'My Tailor Shop',
  shopNameUr: 'میری ٹیلرنگ شاپ',
  ownerName: '',
  phone: '',
  address: '',
  logo: null,
  currency: 'Rs',
  countryCode: '92',
  orderPrefix: 'ORD',
  language: 'ur',
  receiptFormat: 'thermal80',   // thermal80 | thermal58 | a4
  footerEn: 'Thank you! Please bring this slip at delivery.',
  footerUr: 'شکریہ! ڈیلیوری کے وقت یہ پرچی ساتھ لائیں۔',
  rates: {},                    // default stitching rate per garment key
  notifyEnabled: false,
  lastNotifyDay: '',
  lastBackupAt: 0,
  readyMsgEn: 'Assalam o Alaikum {name}, your order {order} is ready for pickup at {shop}. Balance due: {balance}. Thank you!',
  readyMsgUr: 'السلام علیکم {name}، آپ کا آرڈر {order} تیار ہے، {shop} سے وصول کر لیں۔ باقی رقم: {balance}۔ شکریہ!',
  dueMsgEn: 'Assalam o Alaikum {name}, a gentle reminder: your balance of {balance} at {shop} is pending. Thank you!',
  dueMsgUr: 'السلام علیکم {name}، یاد دہانی: {shop} کی طرف آپ کی {balance} رقم باقی ہے۔ شکریہ!',
  updatedAt: Date.now()
};

// Pure calculation used everywhere
function calcOrder(o) {
  const items = (o && o.items) || [];
  const subtotal = items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.rate) || 0) + (Number(i.fabricAmount) || 0), 0);
  const discount = Number(o && o.discount) || 0;
  return { subtotal, discount, total: Math.max(0, subtotal - discount) };
}

const Repo = {
  // ---------------- Settings ----------------
  async getSettings() {
    let s = await db.settings.get('main');
    if (!s) { s = { ...DEFAULT_SETTINGS }; await db.settings.put(s); }
    s = { ...DEFAULT_SETTINGS, ...s };
    Fmt.currency = s.currency || 'Rs';
    return s;
  },
  async saveSettings(data) {
    data.id = 'main'; data.updatedAt = Date.now();
    await db.settings.put(data);
    Fmt.currency = data.currency || 'Rs';
    return data;
  },

  // ---------------- Customers ----------------
  async listCustomers() { return db.customers.orderBy('name').toArray(); },
  async customerMap() { return Object.fromEntries((await db.customers.toArray()).map(c => [c.id, c])); },
  async getCustomer(id) { return db.customers.get(Number(id)); },
  async saveCustomer(data) {
    if (data.id) { await db.customers.update(Number(data.id), data); return Number(data.id); }
    data.createdAt = Date.now();
    data.measurements = data.measurements || {};
    return db.customers.add(data);
  },
  async listMembers(headId) { return db.customers.where('headId').equals(Number(headId)).toArray();
  },
  async saveMeasurement(customerId, garment, values, style) {
    const c = await db.customers.get(Number(customerId));
    const m = { ...(c.measurements || {}) };
    m[garment] = { values, style, updatedAt: Date.now() };
    await db.customers.update(Number(customerId), { measurements: m });
  },
  async deleteCustomer(id) {
    const n = await db.orders.where('customerId').equals(Number(id)).count();
    if (n > 0) throw new Error(t('customerHasOrders'));
    if ((await Repo.listMembers(id)).length) throw new Error(t('customerHasMembers'));
    await db.payments.where('customerId').equals(Number(id)).delete();
    return db.customers.delete(Number(id));
  },
  // Billed / paid / balance for every customer (khata)
  async customerSummaries() {
    const [orders, payments] = await Promise.all([db.orders.toArray(), db.payments.toArray()]);
    const map = {};
    const get = (id) => (map[id] = map[id] || { billed: 0, paid: 0, balance: 0, orderCount: 0 });
    orders.forEach(o => { if (o.status === 'cancelled') return; const s = get(o.customerId); s.billed += calcOrder(o).total; s.orderCount++; });
    payments.forEach(p => { get(p.customerId).paid += Number(p.amount) || 0; });
    Object.values(map).forEach(s => { s.balance = s.billed - s.paid; });
    return map;
  },
  async customerSummary(id) {
    return (await Repo.customerSummaries())[Number(id)] || { billed: 0, paid: 0, balance: 0, orderCount: 0 };
  },

  // ---------------- Orders ----------------
  async listOrders() { return db.orders.orderBy('createdAt').reverse().toArray(); },
  async listOrdersForCustomer(cid) { return (await db.orders.where('customerId').equals(Number(cid)).toArray()).sort((a, b) => b.createdAt - a.createdAt); },
  async getOrder(id) { return db.orders.get(Number(id)); },
  async nextOrderNumber() {
    const s = await Repo.getSettings();
    const y = new Date().getFullYear();
    const pre = `${s.orderPrefix || 'ORD'}-${y}-`;
    const nums = (await db.orders.toArray()).map(o => o.orderNumber).filter(n => n && n.startsWith(pre))
      .map(n => parseInt(n.slice(pre.length), 10)).filter(n => !isNaN(n));
    return pre + String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0');
  },
  async saveOrder(data, advance = 0) {
    const now = Date.now();
    if (data.id) { data.updatedAt = now; await db.orders.update(Number(data.id), data); return Number(data.id); }
    data.createdAt = now; data.updatedAt = now;
    data.orderNumber = data.orderNumber || await Repo.nextOrderNumber();
    data.status = data.status || 'new';
    const id = await db.orders.add(data);
    if (advance > 0) await db.payments.add({ customerId: data.customerId, orderId: id, amount: advance, date: todayStr(), note: 'advance', createdAt: now });
    return id;
  },
  async setOrderStatus(id, status) {
    const patch = { status, updatedAt: Date.now() };
    if (status === 'delivered') patch.deliveredAt = todayStr();
    return db.orders.update(Number(id), patch);
  },
  async deleteOrder(id) {
    await db.payments.where('orderId').equals(Number(id)).delete();
    return db.orders.delete(Number(id));
  },
  async orderPaid(id) {
    return (await db.payments.where('orderId').equals(Number(id)).toArray()).reduce((s, p) => s + (Number(p.amount) || 0), 0);
  },

  // ---------------- Payments ----------------
  async listPaymentsForOrder(id) { return (await db.payments.where('orderId').equals(Number(id)).toArray()).sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt)); },
  async listPaymentsForCustomer(id) { return (await db.payments.where('customerId').equals(Number(id)).toArray()).sort((a, b) => b.createdAt - a.createdAt); },
  async addPayment(p) { p.createdAt = Date.now(); p.customerId = Number(p.customerId); p.orderId = p.orderId ? Number(p.orderId) : null; return db.payments.add(p); },
  async deletePayment(id) { return db.payments.delete(Number(id)); },

  // ---------------- Expenses ----------------
  async listExpenses(y, m) {
    const a = `${y}-${String(m + 1).padStart(2, '0')}-01`, b = `${y}-${String(m + 1).padStart(2, '0')}-31`;
    return (await db.expenses.where('date').between(a, b, true, true).toArray()).sort((x, z) => z.date.localeCompare(x.date) || z.createdAt - x.createdAt);
  },
  async addExpense(e) { e.createdAt = Date.now(); return db.expenses.add(e); },
  async deleteExpense(id) { return db.expenses.delete(Number(id)); },

  // ---------------- Reports ----------------
  async monthSummary(y, m) {
    const a = `${y}-${String(m + 1).padStart(2, '0')}-01`, b = `${y}-${String(m + 1).padStart(2, '0')}-31`;
    const [pay, exp, ord] = await Promise.all([
      db.payments.where('date').between(a, b, true, true).toArray(),
      db.expenses.where('date').between(a, b, true, true).toArray(),
      db.orders.where('orderDate').between(a, b, true, true).toArray()
    ]);
    const income = pay.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const expenses = exp.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const live = ord.filter(o => o.status !== 'cancelled');
    const garments = {};
    live.forEach(o => (o.items || []).forEach(i => { garments[i.garment] = (garments[i.garment] || 0) + (Number(i.qty) || 0); }));
    return {
      income, expenses, profit: income - expenses,
      orders: live.length, delivered: live.filter(o => o.status === 'delivered').length,
      billed: live.reduce((s, o) => s + calcOrder(o).total, 0),
      garments: Object.entries(garments).sort((x, z) => z[1] - x[1])
    };
  },

  // ---------------- Dashboard ----------------
  async dashboardStats() {
    const [orders, sums] = await Promise.all([db.orders.toArray(), Repo.customerSummaries()]);
    const now = new Date();
    const month = await Repo.monthSummary(now.getFullYear(), now.getMonth());
    const today = todayStr();
    const pending = orders.filter(o => PENDING.includes(o.status));
    const upcoming = pending.slice().sort((a, b) => (a.deliveryDate || '9999').localeCompare(b.deliveryDate || '9999')).slice(0, 6);
    const tomorrow = addDays(1);
    const settings = await Repo.getSettings();
    const custCount = await db.customers.count();
    return {
      dueTodayCount: pending.filter(o => o.deliveryDate === today).length,
      dueTomorrowCount: pending.filter(o => o.deliveryDate === tomorrow).length,
      trialCount: pending.filter(o => o.trialDate === today || o.trialDate === tomorrow).length,
      urgentCount: pending.filter(o => o.urgent).length,
      lowStock: await Repo.lowStock(),
      backupDue: custCount > 0 && (Date.now() - (settings.lastBackupAt || 0)) > 7 * 86400000,
      pendingCount: pending.length,
      readyCount: orders.filter(o => o.status === 'ready').length,
      dueCount: pending.filter(o => o.deliveryDate && o.deliveryDate <= today).length,
      receivable: Object.values(sums).reduce((s, x) => s + Math.max(0, x.balance), 0),
      month, upcoming
    };
  },

  // ---------------- Stock ----------------
  async listStock() { return db.stock.orderBy('name').toArray(); },
  async getStock(id) { return db.stock.get(Number(id)); },
  async saveStock(item) {
    item.qty = Number(item.qty) || 0; item.minQty = Number(item.minQty) || 0;
    if (item.id) { await db.stock.update(Number(item.id), item); return Number(item.id); }
    item.createdAt = Date.now();
    const id = await db.stock.add(item);
    if (item.qty) await db.stockLog.add({ stockId: id, date: todayStr(), delta: item.qty, note: 'opening', createdAt: Date.now() });
    return id;
  },
  async adjustStock(id, delta, note) {
    const s = await db.stock.get(Number(id));
    await db.stock.update(s.id, { qty: (Number(s.qty) || 0) + delta });
    await db.stockLog.add({ stockId: s.id, date: todayStr(), delta, note: note || '', createdAt: Date.now() });
  },
  async deleteStock(id) { await db.stockLog.where('stockId').equals(Number(id)).delete(); await db.stock.delete(Number(id)); },
  async stockLogFor(id) { return (await db.stockLog.where('stockId').equals(Number(id)).toArray()).sort((a, b) => b.createdAt - a.createdAt).slice(0, 15); },
  async lowStock() { return (await db.stock.toArray()).filter(s => Number(s.minQty) > 0 && Number(s.qty) <= Number(s.minQty)); },

  // ---------------- Cash book (roznamcha) ----------------
  async cashDayData(date) {
    const [pay, exp, day, all] = await Promise.all([
      db.payments.where('date').equals(date).toArray(), db.expenses.where('date').equals(date).toArray(),
      db.cashDay.get(date), db.cashDay.toArray()]);
    const prev = all.filter(r => r.date < date && r.closing != null && r.closing !== '').sort((a, b) => b.date.localeCompare(a.date))[0];
    const cashIn = pay.filter(p => p.method !== 'online').reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const onlineIn = pay.filter(p => p.method === 'online').reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const out = exp.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    return {
      payments: pay, expenses: exp, cashIn, onlineIn, out,
      opening: day && day.opening != null ? day.opening : (prev ? Number(prev.closing) : 0),
      closing: day ? day.closing : null
    };
  },
  async saveCashDay(row) { return db.cashDay.put(row); },

  // ---------------- Workload & monthly export data ----------------
  async workload(days = 14) {
    const today = todayStr(), end = addDays(days - 1);
    const rows = (await db.orders.toArray()).filter(o => PENDING.includes(o.status) && o.deliveryDate >= today && o.deliveryDate <= end);
    const map = {};
    rows.forEach(o => { const m = (map[o.deliveryDate] = map[o.deliveryDate] || { date: o.deliveryDate, orders: 0, pieces: 0 }); m.orders++; m.pieces += (o.items || []).reduce((s, i) => s + (Number(i.qty) || 0), 0); });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  },
  async monthData(y, m) {
    const a = `${y}-${String(m + 1).padStart(2, '0')}-01`, b = `${y}-${String(m + 1).padStart(2, '0')}-31`;
    const [orders, payments, expenses, customers] = await Promise.all([
      db.orders.where('orderDate').between(a, b, true, true).toArray(),
      db.payments.where('date').between(a, b, true, true).toArray(),
      db.expenses.where('date').between(a, b, true, true).toArray(), Repo.customerMap()]);
    return { orders, payments, expenses, customers };
  },
  async markBackup() { const s = await Repo.getSettings(); s.lastBackupAt = Date.now(); await Repo.saveSettings(s); },

  // ---------------- Backup ----------------
  async exportAll() {
    const [customers, orders, payments, expenses, settings, stock, stockLog, cashDay] = await Promise.all([
      db.customers.toArray(), db.orders.toArray(), db.payments.toArray(), db.expenses.toArray(), db.settings.toArray(),
      db.stock.toArray(), db.stockLog.toArray(), db.cashDay.toArray()]);
    return { app: 'DarziHub', version: 2, exportedAt: new Date().toISOString(), data: { customers, orders, payments, expenses, settings, stock, stockLog, cashDay } };
  },
  async importAll(payload, mode = 'merge') {
    if (!payload || !payload.data) throw new Error(t('invalidBackup'));
    const { customers = [], orders = [], payments = [], expenses = [], settings = [], stock = [], stockLog = [], cashDay = [] } = payload.data;
    await db.transaction('rw', db.customers, db.orders, db.payments, db.expenses, db.settings, db.stock, db.stockLog, db.cashDay, async () => {
      if (mode === 'replace') { await Promise.all([db.customers.clear(), db.orders.clear(), db.payments.clear(), db.expenses.clear(), db.stock.clear(), db.stockLog.clear(), db.cashDay.clear()]); }
      await db.customers.bulkPut(customers); await db.orders.bulkPut(orders);
      await db.payments.bulkPut(payments); await db.expenses.bulkPut(expenses);
      await db.stock.bulkPut(stock); await db.stockLog.bulkPut(stockLog); await db.cashDay.bulkPut(cashDay);
      if (settings.length) await db.settings.bulkPut(settings);
    });
    return { customers: customers.length, orders: orders.length };
  },
  async wipeAll() {
    await db.transaction('rw', db.customers, db.orders, db.payments, db.expenses, db.settings, db.stock, db.stockLog, db.cashDay, async () => {
      await Promise.all([db.customers.clear(), db.orders.clear(), db.payments.clear(), db.expenses.clear(), db.settings.clear(), db.stock.clear(), db.stockLog.clear(), db.cashDay.clear()]);
    });
  }
};
