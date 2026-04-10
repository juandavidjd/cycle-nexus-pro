// LiveODI Service Worker — minimal para PWA install
const CACHE_NAME = 'liveodi-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Network-first: siempre busca en red, cache solo como fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
