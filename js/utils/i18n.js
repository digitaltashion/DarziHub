// =========================================================
// DarziHub — Translations (English / اردو)
// Each entry: key: [English, Urdu]
// =========================================================

const I18n = (() => {
  const D = {
    // ---- navigation
    navHome: ['Home', 'ہوم'], navOrders: ['Orders', 'آرڈرز'], navCustomers: ['Customers', 'گاہک'],
    navAccounts: ['Accounts', 'حساب'], navSettings: ['Settings', 'سیٹنگز'],
    // ---- common
    loading: ['Loading…', 'لوڈ ہو رہا ہے…'], loadFailed: ['Failed to load screen', 'اسکرین لوڈ نہیں ہو سکی'],
    save: ['Save', 'محفوظ کریں'], saveChanges: ['Save changes', 'تبدیلیاں محفوظ کریں'], saved: ['Saved', 'محفوظ ہو گیا'],
    cancel: ['Cancel', 'منسوخ'], confirm: ['Confirm', 'تصدیق'], areYouSure: ['Are you sure?', 'کیا آپ کو یقین ہے؟'],
    delete: ['Delete', 'حذف کریں'], deleted: ['Deleted', 'حذف ہو گیا'], seeAll: ['See all', 'سب دیکھیں'],
    search: ['Search', 'تلاش'], noMatches: ['No matches', 'کچھ نہیں ملا'], tryDifferent: ['Try a different search.', 'کوئی اور لفظ تلاش کریں۔'],
    noData: ['No data yet', 'ابھی کوئی ڈیٹا نہیں'], date: ['Date', 'تاریخ'], note: ['Note', 'نوٹ'], notes: ['Notes', 'نوٹس'],
    amount: ['Amount', 'رقم'], amountRequired: ['Enter a valid amount', 'درست رقم لکھیں'], details: ['Details', 'تفصیل'],
    today: ['Today', 'آج'], tomorrow: ['Tomorrow', 'کل'], overdue: ['Overdue', 'دیر ہو گئی'],
    inches: ['all measurements in inches', 'تمام ناپ انچ میں'],
    // ---- greetings / dashboard
    goodMorning: ['Good morning', 'صبح بخیر'], goodAfternoon: ['Good afternoon', 'سلام'], goodEvening: ['Good evening', 'شام بخیر'],
    pendingBalance: ['Pending balance (Khata)', 'باقی رقم (کھاتہ)'], pendingBalanceHint: ['Total amount customers still owe you', 'گاہکوں سے وصول ہونے والی کل رقم'],
    pendingOrders: ['Pending orders', 'زیرِ تکمیل آرڈر'], readyForPickup: ['Ready for pickup', 'تیار ہیں'], dueToday: ['Due / overdue', 'آج یا دیر'],
    incomeThisMonth: ['Received this month', 'اس ماہ وصولی'], upcomingDeliveries: ['Upcoming deliveries', 'آنے والی ڈیلیوریاں'],
    noPending: ['No pending orders', 'کوئی آرڈر باقی نہیں'], noPendingHint: ['New orders will show up here.', 'نئے آرڈر یہاں نظر آئیں گے۔'],
    quickActions: ['Quick actions', 'فوری کام'], newOrder: ['New order', 'نیا آرڈر'], newCustomer: ['New customer', 'نیا گاہک'],
    khata: ['Khata', 'کھاتہ'], addExpense: ['Add expense', 'خرچہ لکھیں'],
    // ---- customers
    customer: ['Customer', 'گاہک'], addCustomer: ['Add customer', 'گاہک شامل کریں'], editCustomer: ['Edit customer', 'گاہک میں تبدیلی'],
    deleteCustomer: ['Delete customer', 'گاہک حذف کریں'], deleteCustomerMsg: ['This customer and their payments will be deleted.', 'یہ گاہک اور اس کی ادائیگیاں حذف ہو جائیں گی۔'],
    customerHasOrders: ['This customer has orders. Delete those first.', 'اس گاہک کے آرڈر موجود ہیں، پہلے انہیں حذف کریں۔'],
    searchCustomers: ['Search customers…', 'گاہک تلاش کریں…'], noCustomers: ['No customers yet', 'ابھی کوئی گاہک نہیں'],
    noCustomersHint: ['Add your first customer to start taking orders.', 'آرڈر لینے کے لیے پہلا گاہک شامل کریں۔'],
    needCustomerFirst: ['Add a customer first, then create the order.', 'پہلے گاہک شامل کریں، پھر آرڈر بنائیں۔'],
    name: ['Name', 'نام'], namePh: ['e.g. Ahmed Khan', 'مثلاً احمد خان'], nameRequired: ['Name is required', 'نام ضروری ہے'],
    phone: ['Phone', 'فون'], noPhone: ['No phone', 'فون نہیں'], address: ['Address', 'پتہ'],
    customerType: ['Customer type', 'گاہک کی قسم'], gents: ['Gents', 'جینٹس'], ladies: ['Ladies', 'لیڈیز'], both: ['Both', 'دونوں'], other: ['Other', 'دیگر'],
    balanceDue: ['Balance due', 'باقی رقم'], orders: ['Orders', 'آرڈر'], noOrdersYet: ['No orders yet', 'ابھی کوئی آرڈر نہیں'],
    measurements: ['Measurements', 'ناپ'], notTaken: ['Not taken', 'ناپ نہیں لیا'], saveMeasurements: ['Save measurements', 'ناپ محفوظ کریں'],
    styleNotes: ['Style / design notes', 'ڈیزائن / سٹائل نوٹس'], styleNotesPh: ['e.g. band collar, side pockets, plain cuff', 'مثلاً بین کالر، سائیڈ جیب، سادہ کف'],
    // ---- orders
    navOrdersTitle: ['Orders', 'آرڈرز'], searchOrders: ['Search by name, phone or order no…', 'نام، فون یا آرڈر نمبر سے تلاش کریں…'],
    noOrders: ['No orders here', 'یہاں کوئی آرڈر نہیں'], noOrdersHint: ['Tap + to create a new order.', 'نیا آرڈر بنانے کے لیے + دبائیں۔'],
    f_pending: ['Pending', 'زیرِ تکمیل'], f_due: ['Due', 'ڈیلیوری کا وقت'], f_all: ['All', 'سب'],
    st_new: ['New', 'نیا'], st_cutting: ['Cutting', 'کٹنگ'], st_stitching: ['Stitching', 'سلائی'], st_ready: ['Ready', 'تیار'],
    st_delivered: ['Delivered', 'ڈیلیور'], st_cancelled: ['Cancelled', 'منسوخ'],
    status: ['Status', 'حالت'], editOrder: ['Edit order', 'آرڈر میں تبدیلی'], cancelOrder: ['Cancel order', 'آرڈر منسوخ کریں'],
    deleteOrder: ['Delete order', 'آرڈر حذف کریں'], deleteOrderMsg: ['This order and its payments will be deleted permanently.', 'یہ آرڈر اور اس کی ادائیگیاں ہمیشہ کے لیے حذف ہو جائیں گی۔'],
    orderDate: ['Order date', 'آرڈر کی تاریخ'], deliveryDate: ['Delivery date', 'ڈیلیوری کی تاریخ'], deliveredOn: ['Delivered on', 'ڈیلیور ہوا'],
    selectCustomer: ['Select customer…', 'گاہک چنیں…'], selectCustomerErr: ['Please select a customer', 'براہ کرم گاہک چنیں'],
    items: ['Items', 'کپڑے'], addItem: ['Add another item', 'ایک اور کپڑا شامل کریں'], addItemErr: ['Add at least one item', 'کم از کم ایک کپڑا شامل کریں'],
    qty: ['Qty', 'تعداد'], stitchRate: ['Stitching', 'سلائی'], fabricAmount: ['Fabric', 'کپڑا'], itemNotesPh: ['Design notes for this item', 'اس کپڑے کے لیے ڈیزائن نوٹ'],
    noMeasurementYet: ['No measurements saved for this garment.', 'اس کپڑے کا ناپ محفوظ نہیں۔'], takeNow: ['Take now', 'ابھی لکھیں'],
    billing: ['Billing', 'بلنگ'], subtotal: ['Subtotal', 'کل رقم (چھوٹ سے پہلے)'], discount: ['Discount', 'رعایت'], total: ['Total', 'کل رقم'],
    advance: ['Advance', 'ایڈوانس'], paid: ['Paid', 'ادا شدہ'], balance: ['Balance', 'باقی'], orderNotes: ['Order notes', 'آرڈر نوٹس'], saveOrder: ['Save order', 'آرڈر محفوظ کریں'],
    payments: ['Payments', 'ادائیگیاں'], receivePayment: ['Receive payment', 'رقم وصول کریں'], noPayments: ['No payments yet', 'ابھی کوئی ادائیگی نہیں'],
    forOrder: ['For order', 'کس آرڈر کے لیے'], generalKhata: ['General (khata)', 'عمومی (کھاتہ)'], deletePaymentMsg: ['Delete this payment?', 'یہ ادائیگی حذف کریں؟'],
    item: ['Item', 'کپڑا'], orderNo: ['Order no.', 'آرڈر نمبر'],
    // ---- receipt
    receipt: ['Receipt', 'رسید'], receiptPrint: ['Receipt / Print', 'رسید / پرنٹ'], measureSlip: ['Measurement slip', 'ناپ کی پرچی'],
    print: ['Print', 'پرنٹ'], thermal80: ['Thermal 80mm', 'تھرمل 80mm'], thermal58: ['Thermal 58mm', 'تھرمل 58mm'],
    pdfHint: ['For PDF: choose "Save as PDF" in the print window.', 'پی ڈی ایف کے لیے پرنٹ ونڈو میں "Save as PDF" چنیں۔'],
    // ---- accounts
    summary: ['Summary', 'خلاصہ'], expenses: ['Expenses', 'خرچے'], profit: ['Profit this month', 'اس ماہ منافع'],
    profitHint: ['Money received minus expenses', 'وصول شدہ رقم منفی خرچے'], incomeReceived: ['Received', 'وصولی'],
    ordersTaken: ['Orders taken', 'آرڈر لیے'], delivered: ['Delivered', 'ڈیلیور'], garmentsStitched: ['Garments ordered', 'کپڑوں کی تعداد'],
    customersOwe: ['customers owe money', 'گاہکوں کی رقم باقی ہے'], nobodyOwes: ['No pending balances 🎉', 'کوئی رقم باقی نہیں 🎉'],
    totalExpenses: ['Total expenses', 'کل خرچہ'], noExpenses: ['No expenses this month', 'اس ماہ کوئی خرچہ نہیں'], category: ['Category', 'قسم'],
    deleteExpenseMsg: ['Delete this expense?', 'یہ خرچہ حذف کریں؟'],
    cat_cloth: ['Fabric / material', 'کپڑا / مال'], cat_notions: ['Thread, buttons, lining', 'دھاگہ، بٹن، استر'], cat_rent: ['Shop rent', 'دکان کا کرایہ'],
    cat_bills: ['Electricity / bills', 'بجلی / بل'], cat_helper: ['Helper / wages', 'مددگار / اجرت'], cat_transport: ['Transport', 'ٹرانسپورٹ'], cat_other: ['Other', 'دیگر'],

    // ---- v2: reminders, urgent, trial, photos, fabric, family
    reminders: ['Reminders', 'یاد دہانیاں'], remDueToday: ['deliveries due today / overdue', 'آج کی یا لیٹ ڈیلیوریاں'],
    remDueTomorrow: ['deliveries due tomorrow', 'کل کی ڈیلیوریاں'], remTrial: ['trials today / tomorrow', 'آج / کل ٹرائی'],
    remUrgent: ['urgent orders', 'جلدی والے آرڈر'], remLowStock: ['items low in stock', 'اسٹاک کم ہے'],
    trialDate: ['Trial date', 'ٹرائی کی تاریخ'], urgent: ['Urgent', 'جلدی'],
    photos: ['Photos (design / fabric)', 'تصاویر (ڈیزائن / کپڑا)'], photosHint: ['Up to 6 photos, saved on this phone', 'زیادہ سے زیادہ 6 تصاویر، اسی فون میں محفوظ'],
    maxPhotos: ['Maximum 6 photos', 'زیادہ سے زیادہ 6 تصاویر'], photoFailed: ['Could not add this photo', 'یہ تصویر شامل نہیں ہو سکی'],
    customerFabric: ["Customer's own fabric", 'گاہک کا اپنا کپڑا'], customerFabricPh: ['e.g. 2 suits, grey wash & wear', 'مثلاً 2 سوٹ، گرے واش اینڈ وئیر'],
    fabricMeters: ['Fabric received (meters)', 'کپڑا وصول (میٹر)'], fabricSlip: ['Fabric receipt', 'کپڑے کی رسید'], fabricShort: ['Fabric', 'کپڑا'],
    noFabric: ['No customer fabric recorded for this order.', 'اس آرڈر میں گاہک کا کپڑا درج نہیں۔'], signature: ['Signature', 'دستخط'],
    tagView: ['Garment tags', 'ٹیگ'], slipShort: ['Slip', 'پرچی'],
    family: ['Family', 'خاندان'], addMember: ['Add member', 'فرد شامل کریں'], familyHead: ['Family head', 'گھر کا سربراہ'],
    noFamily: ['Add wife / children / relatives as separate profiles with their own measurements.', 'بیوی / بچوں / رشتہ داروں کے الگ پروفائل بنائیں، ہر ایک کا اپنا ناپ۔'],
    customerHasMembers: ['This customer has family members. Delete them first.', 'اس گاہک کے خاندان کے افراد موجود ہیں، پہلے انہیں حذف کریں۔'],
    // ---- messages
    sendReadyMsg: ['Send "ready" message', '"تیار ہے" کا پیغام بھیجیں'], sendDueMsg: ['Send payment reminder', 'رقم کی یاد دہانی بھیجیں'],
    skip: ['Skip', 'چھوڑیں'], msgTemplates: ['WhatsApp messages', 'واٹس ایپ پیغامات'],
    msgTemplatesHint: ['You can use {name} {order} {balance} {shop} in the text.', 'متن میں {name} {order} {balance} {shop} استعمال کر سکتے ہیں۔'],
    readyMsg: ['Order ready message', 'آرڈر تیار کا پیغام'], dueMsg: ['Payment reminder', 'رقم کی یاد دہانی'],
    // ---- payments
    payMethod: ['Payment method', 'ادائیگی کا طریقہ'], cash: ['Cash', 'نقد'], online: ['Online (JazzCash/Easypaisa/Bank)', 'آن لائن (جاز کیش/ایزی پیسہ/بینک)'],
    // ---- accounts
    cashBook: ['Cash book', 'روزنامچہ'], stock: ['Stock', 'اسٹاک'], workload: ['Workload — next 14 days', 'کام کا بوجھ — اگلے 14 دن'],
    pieces: ['pieces', 'جوڑے/پیس'], openingCash: ['Opening cash', 'شروع کی نقدی'], cashReceived: ['Cash received', 'نقد وصولی'],
    onlineReceived: ['Online received (not in drawer)', 'آن لائن وصولی (گلے میں نہیں)'], expectedCash: ['Expected cash in drawer', 'گلے میں متوقع نقدی'],
    countedCash: ['Counted cash (closing)', 'گنی ہوئی نقدی (بند کرتے وقت)'], cashMatches: ['Cash matches ✔', 'نقدی برابر ہے ✔'],
    cashDiff: ['Difference', 'فرق'], todaysEntries: ['Entries of the day', 'اس دن کی اندراجات'],
    // ---- stock
    stockItems: ['Stock items', 'اسٹاک کی اشیاء'], lowStock: ['Low', 'کم'], addStock: ['Add item', 'شے شامل کریں'], editStock: ['Edit item', 'شے میں تبدیلی'],
    noStock: ['No stock items yet — add fabric, thread, buttons…', 'ابھی کوئی شے نہیں — کپڑا، دھاگہ، بٹن وغیرہ شامل کریں'],
    stockNamePh: ['e.g. White cotton', 'مثلاً سفید کاٹن'], unit: ['Unit', 'اکائی'], openingQty: ['Opening quantity', 'ابتدائی مقدار'],
    minQty: ['Alert when at or below', 'اس مقدار یا کم پر الرٹ'], quantity: ['Quantity', 'مقدار'], stockIn: ['Add stock', 'اسٹاک بڑھائیں'], stockOut: ['Use stock', 'اسٹاک استعمال'],
    history: ['History', 'تفصیل'], edit: ['Edit', 'تبدیلی'], deleteStockMsg: ['Delete this item and its history?', 'یہ شے اور اس کی تفصیل حذف کریں؟'],
    sc_fabric: ['Fabric', 'کپڑا'], sc_thread: ['Thread', 'دھاگہ'], sc_button: ['Buttons', 'بٹن'], sc_lining: ['Lining', 'استر'], sc_other: ['Other', 'دیگر'],
    u_meter: ['m', 'میٹر'], u_yard: ['yd', 'گز'], u_piece: ['pcs', 'عدد'], u_spool: ['spools', 'ریل'], u_box: ['boxes', 'ڈبے'],
    // ---- security & alerts
    securityNotify: ['Security & alerts', 'سیکیورٹی اور الرٹ'], pinLock: ['PIN lock', 'پن لاک'], pinOn: ['On', 'آن'], pinOff: ['Off', 'بند'],
    setPin: ['Set PIN', 'پن لگائیں'], manage: ['Manage', 'تبدیل کریں'], enable: ['Enable', 'آن کریں'], disable: ['Disable', 'بند کریں'],
    dailyAlerts: ['Daily alert when app opens', 'ایپ کھولنے پر روزانہ الرٹ'],
    alertsHint: ['The PIN only keeps casual eyes out — data and backup files are not encrypted. Alerts appear when you open the app (no background push).',
                 'پن صرف عام نظروں سے بچاتا ہے — ڈیٹا اور بیک اپ فائل انکرپٹڈ نہیں۔ الرٹ ایپ کھولنے پر آتا ہے (بیک گراؤنڈ نوٹیفکیشن نہیں)۔'],
    notifUnsupported: ['Notifications are not supported here', 'یہاں نوٹیفکیشن سپورٹ نہیں'], notifDenied: ['Notification permission denied', 'نوٹیفکیشن کی اجازت نہیں ملی'],
    enterPin: ['Enter PIN', 'پن درج کریں'], wrongPin: ['Wrong PIN', 'غلط پن'], forgotPin: ['Forgot PIN?', 'پن بھول گئے؟'],
    forgotPinMsg: ['The only way to reset is to erase all data on this phone. Import a backup afterwards.', 'ری سیٹ کا واحد طریقہ اس فون کا سارا ڈیٹا مٹانا ہے۔ بعد میں بیک اپ امپورٹ کر لیں۔'],
    newPin: ['New 4-digit PIN', 'نیا 4 ہندسوں کا پن'], confirmPin: ['Confirm PIN', 'پن دوبارہ لکھیں'], enterCurrentPin: ['Current PIN', 'موجودہ پن'],
    pin4: ['PIN must be 4 digits', 'پن 4 ہندسوں کا ہونا چاہیے'], pinMismatch: ['PINs do not match', 'پن آپس میں نہیں ملتے'],
    pinSet: ['PIN saved', 'پن محفوظ ہو گیا'], pinRemoved: ['PIN removed', 'پن ہٹا دیا گیا'], changePin: ['Change PIN', 'پن تبدیل کریں'], removePin: ['Remove PIN', 'پن ہٹائیں'],
    // ---- backup reminder
    backupDueTitle: ['Time to back up your data', 'ڈیٹا کا بیک اپ لینے کا وقت'], backupDueHint: ['Last backup was over a week ago — tap to save a copy.', 'آخری بیک اپ ایک ہفتے سے پرانا ہے — کاپی محفوظ کرنے کے لیے دبائیں۔'],
    lastBackup: ['Last backup', 'آخری بیک اپ'], never: ['never', 'کبھی نہیں'],
    // ---- settings
    language: ['Language', 'زبان'], shopInfo: ['Shop information', 'دکان کی معلومات'], logo: ['Logo', 'لوگو'], logoHint: ['PNG/JPG under 1.5MB', 'PNG/JPG، 1.5MB سے کم'],
    logoTooBig: ['Logo is too large (max 1.5MB)', 'لوگو بہت بڑا ہے (زیادہ سے زیادہ 1.5MB)'],
    shopNameEn: ['Shop name (English)', 'دکان کا نام (انگریزی)'], shopNameUr: ['Shop name (Urdu)', 'دکان کا نام (اردو)'], ownerName: ['Owner name', 'مالک کا نام'],
    billingSettings: ['Billing', 'بلنگ'], currency: ['Currency', 'کرنسی'], countryCode: ['Country code', 'ملک کا کوڈ'], orderPrefix: ['Order prefix', 'آرڈر پریفکس'],
    receiptSettings: ['Receipt', 'رسید'], defaultFormat: ['Default format', 'ڈیفالٹ سائز'], footerEn: ['Footer text (English)', 'فوٹر (انگریزی)'], footerUr: ['Footer text (Urdu)', 'فوٹر (اردو)'],
    defaultRates: ['Default stitching rates', 'سلائی کے ڈیفالٹ ریٹ'], defaultRatesHint: ['Auto-filled when you add a garment to an order.', 'آرڈر میں کپڑا شامل کرتے ہی خود بھر جائیں گے۔'],
    backupRestore: ['Backup & Restore', 'بیک اپ اور بحالی'], backupHint: ['Save your data to a file', 'ڈیٹا فائل میں محفوظ کریں'],
    export: ['Export', 'ایکسپورٹ'], exportAll: ['Export all data', 'تمام ڈیٹا ایکسپورٹ کریں'], exportHint: ['Download a JSON backup file', 'JSON بیک اپ فائل ڈاؤن لوڈ کریں'],
    import: ['Import', 'امپورٹ'], importBackup: ['Import from backup', 'بیک اپ سے امپورٹ کریں'], importHint: ['Restore from a saved file', 'محفوظ فائل سے بحال کریں'],
    importMode: ['Import mode', 'امپورٹ کا طریقہ'], modeMerge: ['Merge — add to existing data', 'ملائیں — موجودہ ڈیٹا میں اضافہ'], modeReplace: ['Replace — clear current data first', 'تبدیل کریں — پہلے موجودہ ڈیٹا صاف'],
    imported: ['Backup imported', 'بیک اپ امپورٹ ہو گیا'], invalidBackup: ['Invalid backup file', 'بیک اپ فائل درست نہیں'], backupDone: ['Backup downloaded', 'بیک اپ ڈاؤن لوڈ ہو گیا'],
    dangerZone: ['Danger zone', 'خطرناک حصہ'], eraseAll: ['Erase all data', 'سارا ڈیٹا مٹا دیں'], eraseHint: ['Deletes everything on this device', 'اس ڈیوائس کا سارا ڈیٹا حذف ہو جائے گا'],
    eraseMsg: ['This permanently deletes all customers, orders, payments and settings.', 'تمام گاہک، آرڈر، ادائیگیاں اور سیٹنگز ہمیشہ کے لیے حذف ہو جائیں گی۔'],
    eraseMsg2: ['Are you absolutely sure? Export a backup first.', 'کیا آپ کو مکمل یقین ہے؟ پہلے بیک اپ ایکسپورٹ کر لیں۔'],
    eraseEverything: ['Erase everything', 'سب مٹا دیں'], eraseYes: ['Yes, erase all', 'ہاں، سب مٹا دیں'], erased: ['All data erased', 'سارا ڈیٹا مٹا دیا گیا'],
    backupNote: ['All data stays on this phone. Export a backup regularly and keep a copy safe (WhatsApp/Drive), especially before clearing browser data.',
                 'سارا ڈیٹا اسی فون میں رہتا ہے۔ باقاعدگی سے بیک اپ ایکسپورٹ کر کے محفوظ جگہ (واٹس ایپ/ڈرائیو) رکھیں، خاص طور پر براؤزر ڈیٹا صاف کرنے سے پہلے۔']
  };

  let lang = 'ur';
  function t(k, l) { const e = D[k]; if (!e) return k; return e[(l || lang) === 'ur' ? 1 : 0] || e[0]; }
  function set(l) {
    lang = l === 'en' ? 'en' : 'ur';
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
  }
  return { t, set, get lang() { return lang; }, _dict: D };
})();
