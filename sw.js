const CACHE_PREFIX='as-bon-sauveur-';
const CACHE_NAME='as-bon-sauveur-v30-1-performance-20260917';
const OFFLINE_URL='./offline.html';
const PRECACHE=[
  OFFLINE_URL,
  './manifest.webmanifest?v=30.1.0',
  './assets/logo-as.png'
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

async function putIfCacheable(cache,request,response){
  if(response&&response.ok&&response.type==='basic'){
    try{await cache.put(request,response.clone())}catch{}
  }
  return response;
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
  if(!staticAsset)return;

  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    const cached=await cache.match(request);
    if(cached){
      event.waitUntil(fetch(request).then(response=>putIfCacheable(cache,request,response)).catch(()=>null));
      return cached;
    }
    try{
      const response=await fetch(request);
      return await putIfCacheable(cache,request,response);
    }catch{
      return Response.error();
    }
  })());
});
