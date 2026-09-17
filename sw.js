const APP_VERSION='31.2.0';
const BUILD_ID='20260917-mobile-lock';
const CACHE_PREFIX='as-bon-sauveur-build-';
const CACHE_NAME=`${CACHE_PREFIX}${APP_VERSION}-${BUILD_ID}`;
const NAV_CACHE='as-bon-sauveur-navigation';
const META_KEY='./__bs_build_meta__';
const NAV_KEY='./__bs_last_navigation__';
const OFFLINE_URL='./offline.html';

const PRECACHE=[
  OFFLINE_URL,
  './manifest.webmanifest?v=31.2.0',
  './assets/logo-as.png?v=31.2.0',
  './v31-mobile.css?v=31.2.0',
  './v31-mobile-lock.js?v=31.2.0'
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
  })());
});

async function installedAt(cacheName){
  try{
    const cache=await caches.open(cacheName);
    const meta=await cache.match(META_KEY);
    if(!meta)return 0;
    const parsed=await meta.json();
    return Number(parsed?.installedAt)||0;
  }catch{return 0}
}

async function cleanupBuildCaches(){
  const keys=await caches.keys();
  const previous=keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME);
  const dated=[];
  for(const key of previous)dated.push({key,installedAt:await installedAt(key)});
  dated.sort((a,b)=>b.installedAt-a.installedAt);
  const keepPrevious=dated[0]?.key||null;
  await Promise.all(dated.filter(item=>item.key!==keepPrevious).map(item=>caches.delete(item.key)));
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
  const navCache=await caches.open(NAV_CACHE);
  try{
    const response=await networkWithTimeout(request);
    if(response?.ok)navCache.put(NAV_KEY,response.clone()).catch(()=>{});
    return response;
  }catch{
    return (await navCache.match(NAV_KEY))||(await caches.match(OFFLINE_URL))||Response.error();
  }
}

async function staticResponse(request){
  const current=await caches.open(CACHE_NAME);
  const currentHit=await current.match(request);
  if(currentHit)return currentHit;
  const previousHit=await caches.match(request);
  if(previousHit)return previousHit;
  try{
    const response=await fetch(request);
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
