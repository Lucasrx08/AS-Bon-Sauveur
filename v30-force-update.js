(() => {
'use strict';
const VERSION='30.0.2-stable-20260917';

async function refreshServiceWorker(){
  if(!('serviceWorker' in navigator)||!window.isSecureContext)return;
  try{
    const registration=await navigator.serviceWorker.register(`./sw.js?v=${VERSION}`,{scope:'./',updateViaCache:'none'});
    if(registration.waiting)registration.waiting.postMessage({type:'SKIP_WAITING'});
  }catch(error){console.warn('V30 service worker update',error)}
}

window.addEventListener('load',refreshServiceWorker,{once:true});
window.__BS_FORCE_UPDATE=refreshServiceWorker;
window.ASV30_FORCE_UPDATE={version:VERSION,cacheReset:false,autoReload:false};
})();
