const APP_VERSION='31.6.2';
const BUILD_ID='20260925-ios-update-fix';
const CACHE_PREFIX='as-bon-sauveur-build-';
const CACHE_NAME=`${CACHE_PREFIX}${APP_VERSION}-${BUILD_ID}`;
const META_KEY='./__bs_build_meta__';
const OFFLINE_URL='./offline.html';

const PRECACHE=[
  OFFLINE_URL,
  './manifest.webmanifest?v=31.6.2',
  './assets/logo-as.png?v=31.6.2',
  './v31-mobile.css?v=31.6.2',
  './v31-mobile-lock.js?v=31.6.2',
  './v31-6-table-sort.js?v=31.6.2'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await cache.add(new Request(OFFLINE_URL,{cache:'reload'}));
    await Promise.allSettled(PRECACHE.slice(1).map(async url=>{
      const response=await fetch(new Request(url,{cache:'reload'}));
      if(response?.ok)await cache.put(url,response.clone());
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
  try{
    const response=await networkWithTimeout(new Request(request,{cache:'no-store'}));
    if(response?.ok)return response;
    throw new Error(`Navigation HTTP ${response?.status||0}`);
  }catch{
    return (await caches.match(OFFLINE_URL))||Response.error();
  }
}

async function staticResponse(request){
  const current=await caches.open(CACHE_NAME);
  const currentHit=await current.match(request);
  if(currentHit)return currentHit;
  try{
    const response=await fetch(request,{cache:'no-store'});
    if(response?.ok&&response.type==='basic')current.put(request,response.clone()).catch(()=>{});
    return response;
  }catch{return Response.error()}
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(url.pathname.endsWith('/sw.js')||url.pathname.endsWith('/version.json')){
    event.respondWith(fetch(request,{cache:'no-store'}));
    return;
  }
  if(request.mode==='navigate'){
    event.respondWith(navigationResponse(request));
    return;
  }
  const isStatic=['script','style','image','font'].includes(request.destination)||url.pathname.endsWith('.webmanifest');
  if(isStatic)event.respondWith(staticResponse(request));
});
