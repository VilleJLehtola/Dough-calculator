/* Simple PWA service worker for Vite static site */
const SW_VERSION = 'v1.0.0';
const STATIC_CACHE = `static-${SW_VERSION}`;
const RUNTIME_CACHE = `runtime-${SW_VERSION}`;
const CORE_ASSETS = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(CORE_ASSETS).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== STATIC_CACHE && k !== RUNTIME_CACHE ? caches.delete(k) : null)))
    ).then(() => self.clients.claim())
  );
});

// HTML: network-first; Images: cache-first; JS/CSS: stale-while-revalidate
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  const dest = request.destination;

  if (request.method !== 'GET' || /plausible\.io/.test(url.hostname)) return;

  // Navigations / HTML
  if (request.mode === 'navigate' || (dest === 'document' && request.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          return resp;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/index.html')))
    );
    return;
  }

  // Images (incl. Supabase storage)
  if (dest === 'image' || /\/storage\/v1\/object\/public\/recipe-images/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((resp) => {
            const copy = resp.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
            return resp;
          })
          .catch(() => cached);
      })
    );
    return;
  }

  // JS/CSS
  if (dest === 'script' || dest === 'style') {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((resp) => {
          const copy = resp.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          return resp;
        });
        return cached || fetchPromise;
      })
    );
  }
});
