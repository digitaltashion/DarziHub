// =========================================================
// DarziHub — Service Worker
// Offline-first: precache the app shell, then serve CDN
// vendor libraries and static assets from cache with
// background revalidation. No network calls are required
// for the app to function after first load.
// =========================================================

importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.1.0/workbox-sw.js');

const APP_VERSION = 'darzihub-v2';

if (workbox) {
  workbox.core.setCacheNameDetails({ prefix: APP_VERSION });

  const APP_SHELL = [
    './',
    './index.html',
    './css/animations.css',
    './css/components.css',
    './css/main.css',
    './icons/apple-touch-icon.png',
    './icons/favicon-32.png',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/icon-maskable-512.png',
    './js/app.js',
    './js/components/lock.js',
    './js/components/toast.js',
    './js/db/db.js',
    './js/modules/accounts.js',
    './js/modules/backup.js',
    './js/modules/clients.js',
    './js/modules/contract-pdf.js',
    './js/modules/contracts.js',
    './js/modules/customers.js',
    './js/modules/dashboard.js',
    './js/modules/orders.js',
    './js/modules/receipt.js',
    './js/modules/router.js',
    './js/modules/settings.js',
    './js/modules/stock.js',
    './js/utils/format.js',
    './js/utils/garments.js',
    './js/utils/helpers.js',
    './js/utils/i18n.js',
    './js/utils/parts.js',
    './manifest.json'
  ];

  workbox.precaching.precacheAndRoute(APP_SHELL.map(url => ({ url, revision: APP_VERSION })));

  // Vendor CDN libraries — cache-first, so the app works fully offline
  // after the first successful load.
  workbox.routing.registerRoute(
    ({ url }) => ['cdnjs.cloudflare.com', 'unpkg.com'].includes(url.hostname),
    new workbox.strategies.CacheFirst({
      cacheName: `${APP_VERSION}-vendor`,
      plugins: [new workbox.expiration.ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 })]
    })
  );

  // Everything else app-local: stale-while-revalidate so updates land
  // on next load without breaking offline use.
  workbox.routing.registerRoute(
    ({ url }) => url.origin === self.location.origin,
    new workbox.strategies.StaleWhileRevalidate({ cacheName: `${APP_VERSION}-local` })
  );

  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
  });
} else {
  // Workbox failed to load (e.g. no network on first visit) — fall
  // back to a no-op worker rather than breaking the page.
  self.addEventListener('fetch', () => {});
}
