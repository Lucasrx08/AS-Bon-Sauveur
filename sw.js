const CACHE_PREFIX='as-bon-sauveur-';
const CACHE_NAME='as-bon-sauveur-v30-0-2-stable-20260917';
const OFFLINE_URL='./offline.html';
const PRECACHE=[
  OFFLINE_URL,
  './manifest.webmanifest?v=30.0.2-stable-20260917',
  './assets/logo-as.png',
  './assets/logo-football.png',
  './assets/logo-gymnastique.png',
  './assets/logo-escalade.png'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await Promise.allSettled(PRECACHE.map(url=>cache.add(new Request(url,{cache:'reload'}))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
});

async function cacheFirst(request){
  const cache=await caches.open(CACHE_NAME);
  const cached=await cache.match(request);
  if(cached)return cached;
  try{
    const response=await fetch(request);
    if(response&&response.ok&&response.type==='basic')cache.put(request,response.clone()).catch(()=>{});
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

  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      try{return await fetch(request,{cache:'no-cache'})}
      catch{return (await caches.match(OFFLINE_URL))||Response.error()}
    })());
    return;
  }

  const staticAsset=['script','style','image','font'].includes(request.destination)||url.pathname.endsWith('.webmanifest');
  if(staticAsset)event.respondWith(cacheFirst(request));
});
