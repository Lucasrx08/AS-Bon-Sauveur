const CACHE = 'bs-sport-v2-20260907';
const ASSETS = [
  './','./index.html','./styles.css','./app.js','./config.js','./manifest.webmanifest',
  './assets/logo-as.png','./assets/logo-football.png','./assets/logo-escalade.png','./assets/logo-gymnastique.png'
];
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});
self.addEventListener('activate', e => e.waitUntil(Promise.all([
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))),
  self.clients.claim()
])));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(caches.match(e.request).then(cached => {
    const network = fetch(e.request).then(resp => {
      if (resp && resp.ok) caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
      return resp;
    }).catch(() => cached || caches.match('./index.html'));
    return cached || network;
  }));
});
