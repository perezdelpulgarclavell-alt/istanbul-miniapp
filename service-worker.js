
const APP_CACHE = 'istanbul-miniapp-v2';
// Importa lista generada en build con imágenes a precachear
try { importScripts('./assets/precache-list.js'); } catch(e) { /* optional */ }

const PRECACHE_URLS = [
  './',
  './index.html',
  './offline.html',
  './assets/styles.css',
  './assets/app.js',
  './assets/offline.js',
  './assets/snapshot.html',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
      .then(()=>{
        if (self.__SNAP_IMAGES && Array.isArray(self.__SNAP_IMAGES)) {
          return caches.open(APP_CACHE).then(cache => cache.addAll(self.__SNAP_IMAGES.map(u => new Request(u, {mode:'no-cors'}))));
        }
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== APP_CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// Documentos: network-first con fallback a offline completo
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.mode === 'navigate' || (req.destination === 'document' && url.origin === self.location.origin)) {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(APP_CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('./offline.html')))
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(r => r || fetch(req).then((res) => {
        if (req.method === 'GET') {
          const copy = res.clone();
          caches.open(APP_CACHE).then(c => c.put(req, copy));
        }
        return res;
      }))
    );
    return;
  }

  // cross-origin: stale-while-revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(APP_CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});
