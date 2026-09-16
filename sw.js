const CACHE_NAME='as-bon-sauveur-v27';
const OFFLINE_URL='./offline.html';
const PRECACHE=[
  OFFLINE_URL,
  './manifest.webmanifest',
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
    await Promise.all(keys.filter(key=>key!==CACHE_NAME&&key.startsWith('as-bon-sauveur')).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      try{return await fetch(request,{cache:'no-store'})}
      catch{return (await caches.match(OFFLINE_URL))||Response.error()}
    })());
    return;
  }

  const cacheable=['script','style','image','font'].includes(request.destination)||url.pathname.endsWith('.webmanifest');
  if(!cacheable)return;

  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    const cached=await cache.match(request);
    const network=fetch(request).then(response=>{
      if(response&&response.ok&&response.type==='basic')cache.put(request,response.clone()).catch(()=>{});
      return response;
    }).catch(()=>null);
    if(cached){event.waitUntil(network);return cached}
    return (await network)||Response.error();
  })());
});