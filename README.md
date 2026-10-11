# DarziHub — Tailor Shop Manager (English + اردو)

Offline-first PWA for a solo tailor: customers, measurements, orders, khata, expenses and receipts.
Same stack and colours as ContractHub — vanilla JS, Dexie/IndexedDB, hash router with lazy modules,
installable PWA, iOS-style "liquid glass" UI. No login, no server; data stays on the phone.

## Urdu font (important)
Copy `JameelNooriNastaleeq.ttf` into `fonts/` (exact name). `css/main.css` loads it locally with
`@font-face`. Without it the app falls back to Noto Nastaliq / the system Urdu font.

## Features
- **Language**: English ⇄ اردو toggle (Home top corner + Settings). Urdu switches the whole UI to RTL.
- **Customers**: gents / ladies / both, phone (call + WhatsApp buttons), address, notes.
- **Measurements** (inches): per customer, per garment. Gents: qameez, shalwar, pant, shirt, waistcoat, coat, sherwani.
  Ladies: qameez, trouser, blouse, frock/maxi, gharara. Plus "other". Bilingual field labels + style notes.
- **Orders**: multiple garments per order, qty, stitching rate (auto-filled from Settings), fabric amount,
  per-item notes, discount, advance, delivery date. Status: New → Cutting → Stitching → Ready → Delivered (or Cancelled).
  Measurements are snapshotted into the order.
- **Payments / Khata**: advance + later payments per order, general khata payments, per-customer balance,
  "Khata" list of everyone who owes money.
- **Accounts**: monthly income received, expenses, profit, orders taken/delivered, garments count; expense tracking by category.
- **Receipts**: Thermal 80mm, Thermal 58mm, A4 — Print, PDF (browser "Save as PDF"), WhatsApp text message.
  Also a **measurement slip** (job slip) for the cutting table. Receipt language (اردو/English) is selectable per print.
- **Settings**: shop name (EN + UR), logo, phone, address, currency, country code (for WhatsApp), order prefix,
  default receipt format/footer, default stitching rates.
- **Backup & Restore** (JSON), erase-all.

## v2 additions
- **WhatsApp**: one-tap "order ready" message when status → Ready; payment reminder from Khata / customer page.
  Message texts editable in Settings (`{name} {order} {balance} {shop}`), separate Urdu and English versions.
- **Reminders**: trial date + urgent flag on orders; Home shows due today/tomorrow, trials, urgent, low stock;
  optional once-a-day notification when the app is opened (no background push).
- **Photos** (design/fabric, up to 6 per order, compressed and stored on the phone).
- **Customer's own fabric** (description + meters) with its own receipt, and **garment tags** (one per piece).
- **Family profiles**: add wife/children as linked profiles with their own measurements.
- **Stock**: fabric, thread, buttons, lining — stock in/out history and low-stock alerts.
- **Cash book (roznamcha)**: opening cash, cash vs online payments, expenses, expected vs counted cash.
- **Reports**: workload for next 14 days, monthly CSV export (Excel-friendly, Urdu-safe), print.
- **PIN lock** (soft lock, 4 digits, re-locks after 1 min in background) and **weekly backup reminder**;
  backup uses the phone share sheet (WhatsApp/Drive) when available.
- DB schema is now v2 (auto-migrates existing data). Backups from v1 still import.

Not included: cloud sync / multi-device, QR codes on tags.

## Run
Static files only. Serve over http(s) so the service worker can install:
```
npx serve .
```
First load needs internet once (Dexie + Lucide from CDN); afterwards it works offline.

## Structure
```
index.html, manifest.json, sw.js
css/      main.css (theme, RTL, Urdu, print) · components.css · animations.css
fonts/    JameelNooriNastaleeq.ttf  (add this)
js/components/ toast.js · lock.js (PIN)
js/utils/     i18n.js (all EN/UR strings) · garments.js (garments + measurement fields) · format.js · helpers.js · parts.js
js/db/db.js   Dexie schema + Repo
js/modules/   dashboard · customers · orders · receipt · accounts · stock · settings · backup · router
```
To add a garment: edit `LIST` in `js/utils/garments.js`. To add/change text: edit `js/utils/i18n.js`.
