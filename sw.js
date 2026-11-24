// Aima service worker: makes the app open offline.
const CACHE = 'aima-v5';
const SHELL = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'cycle.js',
  'pixel.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// App files: network first so updates show right away, cache when offline.
// Fonts: cache first, they never change.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameOrigin && !isFont) return;

  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: sameOrigin });
      if (isFont && cached) return cached;
      try {
        // 'no-cache' asks the server whether the file changed, so updates show on the next open.
        const res = await fetch(req, sameOrigin ? { cache: 'no-cache' } : undefined);
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      } catch {
        return cached || (req.mode === 'navigate' ? cache.match('index.html') : Response.error());
      }
    })
  );
});
