/* FunBet minimal service worker — required for installability */
const CACHE = 'funbet-shell-v1';
const SHELL = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  // Network-first for API / socket; cache-first for static shell
  if (request.url.includes('/api/') || request.url.includes('socket.io')) {
    return;
  }
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request)
        .then((res) => {
          if (res.ok && request.url.startsWith(self.location.origin)) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetched;
    })
  );
});
