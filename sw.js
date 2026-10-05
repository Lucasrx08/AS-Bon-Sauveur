const APP_VERSION='31.7.1';
const BUILD_ID='20261005-audit-fixes-r1';
const CACHE_PREFIX='as-bon-sauveur-build-';
const CACHE_NAME=`${CACHE_PREFIX}${APP_VERSION}-${BUILD_ID}`;
const META_KEY='./__bs_build_meta__';
const APP_SHELL_URL='./index.html';
const OFFLINE_URL='./offline.html';
const CDN_ASSETS=[
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0',
  'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js'
];
const PRECACHE=[
  APP_SHELL_URL,
  OFFLINE_URL,
  './manifest.webmanifest?v=31.7.1',
  './assets/logo-as.png?v=31.7.1','./assets/logo-as.png',
  './assets/logo-football.png','./assets/logo-escalade.png','./assets/logo-gymnastique.png','./assets/logo-ecoledirecte.svg',
  './assets/shop-sweat-sapphire.webp','./assets/shop-tshirt-skyblue.webp',
  './assets/programme-v21-14-hd.png','./assets/programme-tv-v24-hd.png','./assets/convocation-v21-14-hd.png',
  './assets/fonts/Anton-Regular.ttf','./assets/fonts/BroshK.ttf',
  './v19.css?v=31.7.1','./v20.css?v=31.7.1','./v21.css?v=31.7.1','./v21-8-design.css?v=31.7.1',
  './v21-9-polish.css?v=31.7.1','./v21-10-ui.css?v=31.7.1','./v21-12-pdf.css?v=31.7.1',
  './v21-15.css?v=31.7.1','./v22.css?v=31.7.1','./v22-1.css?v=31.7.1','./v27.css?v=31.7.1',
  './v30-specialty-colors.css?v=31.7.1','./v31-mobile.css?v=31.7.1',
  './v31-release.js?v=31.7.1','./v31-runtime.js?v=31.7.1','./config.js?v=31.7.1',
  './v29-bootstrap.js?v=31.7.1','./v22-preflight.js?v=31.7.1','./v20-stability.js?v=31.7.1',
  './v20-preflight.js?v=31.7.1','./v19-app.js?v=31.7.1','./v24-time.js?v=31.7.1',
  './v20-exports.js?v=31.7.1','./v30-auth-simple.js?v=31.7.1','./v31-7-security.js?v=31.7.1','./v20-bridge.js?v=31.7.1',
  './v20-admin.js?v=31.7.1','./v20-postboot.js?v=31.7.1','./v21-admin.js?v=31.7.1',
  './v21-role-guard.js?v=31.7.1','./v21-instagram-button.js?v=31.7.1','./v21-pin-auth.js?v=31.7.1',
  './v21-8-finance.js?v=31.7.1','./v21-9-admin-icons.js?v=31.7.1','./v21-9-finance.js?v=31.7.1',
  './v21-10.js?v=31.7.1','./v21-11-reports.js?v=31.7.1','./v21-12-pdf.js?v=31.7.1',
  './v22-runtime.js?v=31.7.1','./v22-1-privacy.js?v=31.7.1','./v25-audit-fixes.js?v=31.7.1',
  './v27.js?v=31.7.1','./v28.js?v=31.7.1','./v29.js?v=31.7.1','./v30-multispecialty.js?v=31.7.1',
  './v31-mobile-lock.js?v=31.7.1','./v31-6-table-sort.js?v=31.7.1',
  ...CDN_ASSETS
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await cache.addAll([APP_SHELL_URL,OFFLINE_URL].map(url=>new Request(url,{cache:'reload'})));
    await Promise.allSettled(PRECACHE.slice(2).map(async url=>{
      const request=new Request(url,{cache:'reload'});
      const response=await fetch(request);
      if(response?.ok||response?.type==='opaque')await cache.put(request,response.clone());
    }));
    await cache.put(META_KEY,new Response(JSON.stringify({version:APP_VERSION,build:BUILD_ID,installedAt:Date.now()}),{headers:{'Content-Type':'application/json'}}));
    await self.skipWaiting();
  })());
});

async function cleanupBuildCaches(){
  const keys=await caches.keys();
  const obsolete=keys.filter(key=>key!==CACHE_NAME&&key.startsWith('as-bon-sauveur-'));
  await Promise.all(obsolete.map(key=>caches.delete(key)));
}

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    await cleanupBuildCaches();
    await self.clients.claim();
  })());
});

self.addEventListener('message',event=>{
  const data=event.data||{};
  if(data.type==='SKIP_WAITING')self.skipWaiting();
  if(data.type==='GET_VERSION'){
    const payload={type:'BS_SW_VERSION',version:APP_VERSION,build:BUILD_ID};
    if(event.ports?.[0])event.ports[0].postMessage(payload);
    else event.source?.postMessage?.(payload);
  }
});

async function networkWithTimeout(request,timeoutMs=4500){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{return await fetch(request,{cache:'no-store',signal:controller.signal})}
  finally{clearTimeout(timer)}
}

async function navigationResponse(request){
  const current=await caches.open(CACHE_NAME);
  try{
    const response=await networkWithTimeout(new Request(request,{cache:'no-store'}));
    if(!response?.ok)throw new Error(`Navigation HTTP ${response?.status||0}`);
    current.put(APP_SHELL_URL,response.clone()).catch(()=>{});
    return response;
  }catch{
    return (await current.match(APP_SHELL_URL))||(await current.match(OFFLINE_URL))||Response.error();
  }
}

async function staticResponse(request){
  const current=await caches.open(CACHE_NAME);
  const currentHit=await current.match(request);
  if(currentHit)return currentHit;
  try{
    const response=await fetch(request,{cache:'no-store'});
    if(response?.ok||response?.type==='opaque')current.put(request,response.clone()).catch(()=>{});
    return response;
  }catch{return Response.error()}
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  const trustedCdn=CDN_ASSETS.includes(url.href);
  if(url.origin!==self.location.origin&&!trustedCdn)return;
  if(url.origin===self.location.origin&&(url.pathname.endsWith('/sw.js')||url.pathname.endsWith('/version.json'))){
    event.respondWith(fetch(request,{cache:'no-store'}));
    return;
  }
  if(request.mode==='navigate'){
    event.respondWith(navigationResponse(request));
    return;
  }
  const isStatic=trustedCdn||['script','style','image','font'].includes(request.destination)||url.pathname.endsWith('.webmanifest');
  if(isStatic)event.respondWith(staticResponse(request));
});
