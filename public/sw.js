/* Simple PWA service worker for Vite static site */
const SW_VERSION = "v1.0.1";
const STATIC_CACHE = `static-${SW_VERSION}`;
const RUNTIME_CACHE = `runtime-${SW_VERSION}`;

const CORE_ASSETS = [
  "/",                 // SPA shell
  "/index.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/og-image.jpg",
];

// Basic cap so image cache doesn't grow unbounded
const MAX_RUNTIME_ENTRIES = 150;

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      // use addAll; if any fail we still want SW to install
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Clean old caches
      const keys = await caches.keys();
      await Promise.all(
        keys.map((k) =>
          k === STATIC_CACHE || k === RUNTIME_CACHE ? null : caches.delete(k)
        )
      );

      // Enable navigation preload for faster first loads
      if (self.registration.navigationPreload) {
        try {
          await self.registration.navigationPreload.enable();
        } catch {
          /* ignore */
        }
      }

      await self.clients.claim();
    })()
  );
});

// HTML: network-first (+ navigation preload)
// Images: cache-first (+ cap)
// JS/CSS: stale-while-revalidate (same-origin only)
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  const dest = request.destination;

  // Only GETs are cacheable; skip analytics
  if (request.method !== "GET" || /(^|\.)plausible\.io$/.test(url.hostname)) {
    return;
  }

  // Avoid a Chrome/Safari quirk for OIC + cross-origin
  if (request.cache === "only-if-cached" && request.mode !== "same-origin") {
    return;
  }

  // ---- Navigations / HTML (network-first with preload) ----
  const isHTML =
    request.mode === "navigate" ||
    (dest === "document" &&
      request.headers.get("accept")?.includes("text/html"));

  if (isHTML) {
    event.respondWith(
      (async () => {
        try {
          // If navigation preload is available, prefer it
          const preload = await event.preloadResponse;
          if (preload) {
            caches.open(RUNTIME_CACHE).then((c) => c.put(request, preload.clone()));
            return preload;
          }

          const net = await fetch(request);
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, net.clone()));
          return net;
        } catch {
          // Fallback to cache, then to the shell
          const cached = await caches.match(request);
          return cached || (await caches.match("/index.html"));
        }
      })()
    );
    return;
  }

  // ---- Images (incl. Supabase storage) - cache-first ----
  const isRecipeImage =
    dest === "image" ||
    /\/storage\/v1\/object\/public\/recipe-images/.test(url.pathname);

  if (isRecipeImage) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        try {
          const res = await fetch(request);
          const copy = res.clone();
          const cache = await caches.open(RUNTIME_CACHE);
          await cache.put(request, copy);
          limitCache(cache, MAX_RUNTIME_ENTRIES).catch(() => {});
          return res;
        } catch {
          return cached; // if fetch fails and we had nothing, will be undefined -> network error shows
        }
      })()
    );
    return;
  }

  // ---- JS/CSS (same-origin) - stale-while-revalidate ----
  const sameOrigin = url.origin === self.location.origin;
  if (sameOrigin && (dest === "script" || dest === "style")) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        const fetchPromise = fetch(request)
          .then(async (res) => {
            const copy = res.clone();
            const cache = await caches.open(RUNTIME_CACHE);
            await cache.put(request, copy);
            return res;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })()
    );
    return;
  }

  // For everything else, fall through to network (no caching)
});

// Utility: keep the runtime cache from growing forever
async function limitCache(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  const toDelete = keys.length - maxEntries;
  for (let i = 0; i < toDelete; i++) {
    await cache.delete(keys[i]);
  }
}
