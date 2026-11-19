// NHS Ayrshire & Arran Microbiology Test Directory Service Worker (PDM-ATH020-WEB)
const CACHE_VERSION = 'nhs-aa-micro-v1.1.0';
const APP_SHELL = [
  './',
  './index.html',
  './tests.json',
  './manifest.webmanifest',
  './icon-192.svg',
  './icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((oldKey) => caches.delete(oldKey))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (url.pathname.endsWith('tests.json')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResp) => {
          if (networkResp && networkResp.ok) {
            const clone = networkResp.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put('./tests.json', clone));
          }
          return networkResp;
        })
        .catch(() => caches.match('./tests.json'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResp) => {
      const fetchPromise = fetch(event.request)
        .then((networkResp) => {
          if (networkResp && networkResp.ok && url.origin === self.location.origin) {
            const clone = networkResp.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
          }
          return networkResp;
        })
        .catch(() => cachedResp);

      return cachedResp || fetchPromise;
    })
  );
});
