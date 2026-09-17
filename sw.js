const APP_VERSION='30.0.5';
const BUILD_ID='20260917-stop-reload-loop';
const CACHE_PREFIX='as-bon-sauveur-';
const CACHE_NAME=`as-bon-sauveur-build-${APP_VERSION}-${BUILD_ID}`;
const NAV_CACHE='as-bon-sauveur-navigation';
const META_KEY='./__bs_build_meta__';
const NAV_KEY='./__bs_last_navigation__';
const OFFLINE_URL='./offline.html';
const SAFE_URL='./safe-v30.0.3.html';

const CORE_ASSETS=[
  OFFLINE_URL,
  SAFE_URL,
  './manifest.webmanifest?v=30.0.5',
  './assets/logo-as.png?v=30.0.5',
  './assets/logo-football.png',
  './assets/logo-gymnastique.png',
  './assets/logo-escalade.png',
  './v19.css?v=30.0.1-force-20260917',
  './v20.css?v=30.0.1-force-20260917',
  './v21.css?v=30.0.1-force-20260917',
  './v21-8-design.css?v=30.0.1-force-20260917',
  './v21-9-polish.css?v=30.0.1-force-20260917',
  './v21-10-ui.css?v=30.0.1-force-20260917',
  './v21-12-pdf.css?v=30.0.1-force-20260917',
  './v21-15.css?v=30.0.1-force-20260917',
  './v22.css?v=30.0.1-force-20260917',
  './v22-1.css?v=30.0.1-force-20260917',
  './v27.css?v=30.0.1-force-20260917',
  './v30-specialty-colors.css?v=30.0.3-colors-20260917',
  './config.js?v=30.0.1-force-20260917',
  './v30-force-update.js?v=30.0.5-stop-loop-20260917',
  './v29-bootstrap.js?v=30.0.1-force-20260917',
  './v30-release.js?v=30.0.5-stop-loop-20260917',
  './v22-preflight.js?v=30.0.1-force-20260917',
  './v20-stability.js?v=30.0.1-force-20260917',
  './v20-preflight.js?v=30.0.1-force-20260917',
  './v19-app.js?v=30.0.1-force-20260917',
  './v24-time.js?v=30.0.1-force-20260917',
  './v20-exports.js?v=30.0.1-force-20260917',
  './v30-auth-simple.js?v=30.0.1-force-20260917',
  './v20-bridge.js?v=30.0.1-force-20260917',
  './v20-admin.js?v=30.0.1-force-20260917',
  './v20-postboot.js?v=30.0.1-force-20260917',
  './v21-admin.js?v=30.0.1-force-20260917',
  './v21-auth-fix.js?v=30.0.1-force-20260917',
  './v21-role-guard.js?v=30.0.1-force-20260917',
  './v21-instagram-button.js?v=30.0.1-force-20260917',
  './v21-pin-auth.js?v=30.0.1-force-20260917',
  './v21-8-finance.js?v=30.0.1-force-20260917',
  './v21-9-admin-icons.js?v=30.0.1-force-20260917',
  './v21-9-finance.js?v=30.0.1-force-20260917',
  './v21-10.js?v=30.0.1-force-20260917',
  './v21-11-reports.js?v=30.0.1-force-20260917',
  './v21-12-pdf.js?v=30.0.1-force-20260917',
  './v22-runtime.js?v=30.0.1-force-20260917',
  './v22-1-privacy.js?v=30.0.1-force-20260917',
  './v25-audit-fixes.js?v=30.0.1-force-20260917',
  './v27.js?v=30.0.1-force-20260917',
  './v28.js?v=30.0.1-force-20260917',
  './v29.js?v=30.0.5-stop-loop-20260917',
  './v30-multispecialty.js?v=30.0.1-force-20260917',
  './v30-release-safe-30.0.3.js?v=30.0.3-safe-20260917'
];

async function fetchFresh(url){
  const response=await fetch(new Request(url,{cache:'reload'}));
  if(!response||!response.ok)throw new Error(`Asset indisponible: ${url}`);
  return response;
}

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    for(const url of CORE_ASSETS){
      const response=await fetchFresh(url);
      await cache.put(url,response.clone());
    }
    await cache.put(META_KEY,new Response(JSON.stringify({version:APP_VERSION,build:BUILD_ID,installedAt:Date.now()}),{headers:{'Content-Type':'application/json'}}));
  })());
});

async function cleanupOldBuildCaches(){
  const keys=await caches.keys();
  const buildKeys=keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME&&key!==NAV_CACHE);
  const dated=[];
  for(const key of buildKeys){
    let installedAt=0;
    try{
      const cache=await caches.open(key);
      const meta=await cache.match(META_KEY);
      if(meta){
        const parsed=await meta.json();
        installedAt=Number(parsed?.installedAt)||0;
      }
    }catch{}
    dated.push({key,installedAt});
  }
  dated.sort((a,b)=>b.installedAt-a.installedAt);
  const keepPrevious=dated[0]?.key;
  await Promise.all(dated.filter(item=>item.key!==keepPrevious).map(item=>caches.delete(item.key)));
}

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    await self.clients.claim();
    await cleanupOldBuildCaches();
    const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    clients.forEach(client=>client.postMessage({type:'BS_SW_ACTIVATED',version:APP_VERSION,build:BUILD_ID}));
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

async function networkWithTimeout(request,timeoutMs=6000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{return await fetch(request,{cache:'no-store',signal:controller.signal})}
  finally{clearTimeout(timer)}
}

async function normalNavigation(request){
  const navCache=await caches.open(NAV_CACHE);
  try{
    const response=await networkWithTimeout(request,6000);
    if(response&&response.ok)await navCache.put(NAV_KEY,response.clone());
    return response;
  }catch{
    return (await navCache.match(NAV_KEY))||(await caches.match(SAFE_URL))||(await caches.match(OFFLINE_URL))||Response.error();
  }
}

async function safeNavigation(){
  return (await caches.match(SAFE_URL))||fetch(SAFE_URL,{cache:'no-store'});
}

async function cacheFirst(request){
  const current=await caches.open(CACHE_NAME);
  const own=await current.match(request);
  if(own)return own;
  const older=await caches.match(request);
  if(older)return older;
  try{
    const response=await fetch(request);
    if(response&&response.ok&&response.type==='basic')current.put(request,response.clone()).catch(()=>{});
    return response;
  }catch{
    return Response.error();
  }
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  if(url.pathname.endsWith('/version.json')||url.pathname.endsWith('/sw.js')){
    event.respondWith(fetch(request,{cache:'no-store'}));
    return;
  }

  if(request.mode==='navigate'){
    if(url.searchParams.get('bs_safe')==='1')event.respondWith(safeNavigation());
    else event.respondWith(normalNavigation(request));
    return;
  }

  const staticAsset=['script','style','image','font'].includes(request.destination)||url.pathname.endsWith('.webmanifest');
  if(staticAsset)event.respondWith(cacheFirst(request));
});
