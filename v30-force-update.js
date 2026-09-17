(() => {
'use strict';
const FORCE_VERSION='30.0.1-force-20260917';
const RELOAD_KEY='bs-v30-force-reload';
const CACHE_PATTERN=/(as[-_ ]?bon[-_ ]?sauveur|bon[-_ ]?sauveur)/i;

async function clearAppCaches(){
  if(!('caches' in window))return;
  try{
    const keys=await caches.keys();
    await Promise.all(keys.filter(name=>CACHE_PATTERN.test(name)).map(name=>caches.delete(name)));
  }catch(error){console.warn('V30 cache reset',error)}
}

function reloadOnce(){
  if(sessionStorage.getItem(RELOAD_KEY)==='1')return;
  sessionStorage.setItem(RELOAD_KEY,'1');
  location.reload();
}

async function forceServiceWorkerUpdate(){
  if(!('serviceWorker' in navigator)||!window.isSecureContext)return;
  try{
    await clearAppCaches();
    const registration=await navigator.serviceWorker.register(`./sw.js?v=${FORCE_VERSION}`,{scope:'./',updateViaCache:'none'});
    registration.active?.postMessage({type:'CLEAR_APP_CACHES'});
    if(registration.waiting)registration.waiting.postMessage({type:'SKIP_WAITING'});
    await registration.update().catch(()=>{});
  }catch(error){console.warn('V30 service worker update',error)}
}

navigator.serviceWorker?.addEventListener?.('controllerchange',reloadOnce);
navigator.serviceWorker?.addEventListener?.('message',event=>{
  if(event.data?.type==='BS_V30_FORCE_REFRESH')reloadOnce();
});

window.addEventListener('load',()=>{
  forceServiceWorkerUpdate().finally(()=>setTimeout(()=>sessionStorage.removeItem(RELOAD_KEY),5000));
},{once:true});

window.__BS_FORCE_UPDATE=forceServiceWorkerUpdate;
window.ASV30_FORCE_UPDATE={version:FORCE_VERSION,cacheReset:true};
})();
