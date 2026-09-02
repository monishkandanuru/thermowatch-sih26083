const CACHE_NAME = 'thermowatch-v6';
const SHELL = ['/', '/manifest.webmanifest', '/favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const sensitiveApi = [
    '/api/session',
    '/api/alerts',
    '/api/incidents',
    '/api/history',
    '/api/audit',
  ].some((path) => url.pathname.startsWith(path));
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && !sensitiveApi) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        if (sensitiveApi) {
          return new Response(
            JSON.stringify({ error: 'This record is unavailable offline.' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } },
          );
        }
        const cached = await caches.match(request);
        if (cached) return cached;
        if (url.pathname.startsWith('/api/')) {
          return new Response(
            JSON.stringify({ error: 'No cached data is available offline.' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } },
          );
        }
        return caches.match('/');
      }),
  );
});
