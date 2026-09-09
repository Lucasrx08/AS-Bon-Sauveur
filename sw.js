self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});
// Stability mode: do not intercept network requests. The application always loads
// the current GitHub Pages assets while Supabase authentication is being stabilized.
self.addEventListener('fetch',()=>{});
