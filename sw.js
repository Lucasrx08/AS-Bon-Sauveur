const CACHE='as-bon-sauveur-v20-20260909-2';
const CORE=[
  './','./index.html','./config.js','./manifest.webmanifest',
  './v19.css','./v20.css','./v19-app.js','./v20-exports.js','./v20-preflight.js','./v20-bridge.js','./v20-admin.js','./v20-postboot.js',
  './assets/convocation-template.png.b64','./assets/programme-template.png.b64',
  './assets/logo-as.png','./assets/logo-ecoledirecte.svg','./assets/shop-tshirt-skyblue.webp','./assets/shop-sweat-sapphire.webp'
];
self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));
});
self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(resp=>{
      if(resp?.ok)caches.open(CACHE).then(c=>c.put('./index.html',resp.clone()));
      return resp;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>{
    const network=fetch(event.request).then(resp=>{
      if(resp?.ok)caches.open(CACHE).then(c=>c.put(event.request,resp.clone()));
      return resp;
    }).catch(()=>cached);
    return cached||network;
  }));
});
