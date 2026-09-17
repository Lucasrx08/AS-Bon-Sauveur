const CACHE_NAME='as-bon-sauveur-v30-0-1-force-20260917';
const OFFLINE_URL='./offline.html';
const PRECACHE=[
  OFFLINE_URL,
  './manifest.webmanifest?v=30.0.1-force-20260917',
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
    await Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)));
    await self.clients.claim();
    const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    clients.forEach(client=>client.postMessage({type:'BS_V30_FORCE_REFRESH'}));
  })());
});

self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
  if(event.data?.type==='CLEAR_APP_CACHES'){
    event.waitUntil((async()=>{
      const keys=await caches.keys();
      await Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)));
    })());
  }
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

  const cacheable=['image','font'].includes(request.destination)||url.pathname.endsWith('.webmanifest');
  if(!cacheable){
    event.respondWith(fetch(request,{cache:'no-store'}).catch(()=>caches.match(request)));
    return;
  }

  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    try{
      const response=await fetch(request,{cache:'reload'});
      if(response&&response.ok&&response.type==='basic')cache.put(request,response.clone()).catch(()=>{});
      return response;
    }catch{
      return (await cache.match(request))||Response.error();
    }
  })());
});
