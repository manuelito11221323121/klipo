// Service worker mínimo: network-first con caché de respaldo para uso offline.
const CACHE = 'klipo-shell-v2';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  // Memes y sonidos: pesan mucho y se piden por rangos; el navegador los maneja directo.
  if (url.pathname.includes('/biblioteca/') && !url.pathname.endsWith('.json')) return;
  if (req.headers.has('range')) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((m) => m || caches.match('./index.html'))),
  );
});
