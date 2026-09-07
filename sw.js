const CACHE = 'as-bon-sauveur-v11-20260908-2';
const ASSETS = [
  './','./index.html','./config.js','./manifest.webmanifest',
  './v3.css','./v4.css','./v5.css','./v5-final.css','./v6.css','./v7.css','./v7-fix.css','./v8.css','./v9.css','./v10.css','./v11.css',
  './v10-preflight.js','./v4.js','./v5-preflight.js','./v10-guard.js','./v5-patch.js','./v5-loop-fix.js','./v5-state-fix.js','./v5-final.js','./v7-core.js','./v7-import.js','./v8-core.js','./v8-ed-logo.js','./v10-core.js','./v10-exports.js','./v11-core.js','./v11-exports.js',
  './assets/logo-as.png','./assets/logo-football.png','./assets/logo-escalade.png','./assets/logo-gymnastique.png','./assets/logo-ecoledirecte.svg','./assets/shop-tshirt-skyblue.webp','./assets/shop-sweat-sapphire.webp'
];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const url=new URL(e.request.url);if(url.origin!==self.location.origin)return;e.respondWith(fetch(e.request).then(resp=>{if(resp&&resp.ok)caches.open(CACHE).then(c=>c.put(e.request,resp.clone()));return resp}).catch(()=>caches.match(e.request).then(x=>x||caches.match('./index.html'))))});
