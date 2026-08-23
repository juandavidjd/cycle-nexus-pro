// LiveODI Service Worker — minimal para PWA install
const CACHE_NAME = 'liveodi-v1';
const ODI_OPERATOR_SW_IDENTITY = 'ODI_OPERATOR_SW_SAFE_R1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('message', (event) => {
  const msg = event.data;
  if (!msg || msg.type !== 'ODI_OPERATOR_SW_HANDSHAKE') return;
  const reply = {
    type: 'ODI_OPERATOR_SW_HANDSHAKE_ACK',
    identity: ODI_OPERATOR_SW_IDENTITY,
    nonce: msg.nonce,
  };
  if (event.ports && event.ports[0]) {
    event.ports[0].postMessage(reply);
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Operator grant must bypass SW mediation completely.
  // Stage A serverless is a structural stub and remains the sole responder.
  if (
    event.request.method === 'POST' &&
    url.origin === self.location.origin &&
    url.pathname === '/api/operator-grant'
  ) {
    return;
  }

  // Network-first: siempre busca en red, cache solo como fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
