/* Ghufran Khalil Petroleum Pump — offline shell + live updates.
   Network-first: every online launch gets the latest index.html from GitHub Pages.
   If the phone is offline, the last good copy opens instead. */
const BUILD = '__BUILD__';
const CACHE = 'gkpp-' + BUILD;
const APP = './index.html';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    fetch(APP, { cache: 'no-store' })
      .then((res) => {
        if (res && res.ok) {
          return caches.open(CACHE).then((cache) => cache.put(APP, res));
        }
      })
      .catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.indexOf('gkpp-') === 0 && key !== CACHE)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const accepts = req.headers.get('accept') || '';
  const isPage = req.mode === 'navigate' || accepts.indexOf('text/html') !== -1;
  if (!isPage) return;

  event.respondWith(
    fetch(req, { cache: 'no-store' })
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(APP, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(APP).then((cached) => cached || caches.match('./index.html')))
  );
});
