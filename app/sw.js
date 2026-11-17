// Service worker mínimo: network-first con caché de respaldo para uso offline.
const CACHE = 'klipo-shell-v3';
self.addEventListener('install', () => self.skipWaiting());
// Al actualizar: borrar las copias viejas para que nunca se quede una versión anterior
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  // Memes y sonidos: pesan mucho y se piden por rangos; el navegador los maneja directo.
  if (url.pathname.includes('/biblioteca/') && !url.pathname.endsWith('.json')) return;
  if (req.headers.has('range')) return;
  // La página (index.html) siempre se pide al servidor sin usar la memoria del navegador:
  // así cada versión nueva de Klipo se ve al instante.
  const isPage = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html');
  e.respondWith(
    (isPage ? fetch(req.url, { cache: 'no-store', credentials: 'same-origin' }) : fetch(req))
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((m) => m || caches.match('./index.html'))),
  );
});
