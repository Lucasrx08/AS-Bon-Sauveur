const CACHE='as-bon-sauveur-v22.0.0';
const PREFIX='as-bon-sauveur-';
const SHELL=['./','./index.html','./confidentialite.html','./manifest.webmanifest','./config.js','./v19.css','./v20.css','./v21.css','./v21-8-design.css','./v21-9-polish.css','./v21-10-ui.css','./v21-12-pdf.css','./v21-15.css','./v22.css','./v22-supabase.js','./v22-bootstrap.js','./v19-app.js','./v20-exports.js','./v22-data.js','./v20-admin.js','./v20-postboot.js','./v21-admin.js','./v21-instagram-button.js','./v21-pin-auth.js','./v21-8-finance.js','./v21-9-admin-icons.js','./v21-9-finance.js','./v21-10.js','./v21-11-reports.js','./v21-12-pdf.js','./v22-privacy.js','./vendor/xlsx-0.18.5.full.min.js','./vendor/exceljs-4.4.0.min.js','./vendor/jspdf-4.2.1.umd.min.js','./assets/logo-as.png','./assets/logo-football.png','./assets/logo-gymnastique.png','./assets/logo-escalade.png','./assets/shop-sweat-sapphire.webp','./assets/shop-tshirt-skyblue.webp','./assets/fonts/Anton-Regular.ttf'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(request.mode==='navigate'){
  event.respondWith(fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));return response}).catch(()=>caches.match('./index.html')));
  return
 }
 event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy))}return response})))
});
