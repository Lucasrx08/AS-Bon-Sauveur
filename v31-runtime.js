(() => {
'use strict';

const VERSION='31.4.0';
const SW_URL='./sw.js';
const LAST_CHECK_KEY=`bs-sw-last-check-${VERSION}`;
const READY_KEY=`bs-update-ready-${VERSION}`;
const CHECK_COOLDOWN=30*60*1000;
const swContainer=navigator.serviceWorker;
const nativeRegister=swContainer?.register?.bind(swContainer)||null;
const hadController=!!swContainer?.controller;
let registrationPromise=null;

function showUpdateReady(){
  if(sessionStorage.getItem(READY_KEY)==='1')return;
  sessionStorage.setItem(READY_KEY,'1');
  const notify=()=>{
    if(typeof window.__BS_SAVED==='function'){
      window.__BS_SAVED('Mise à jour prête','La nouvelle version sera utilisée à la prochaine ouverture de l’application.');
      return;
    }
    if(document.getElementById('bs-v31-update-ready'))return;
    const el=document.createElement('div');
    el.id='bs-v31-update-ready';
    el.setAttribute('role','status');
    el.setAttribute('aria-live','polite');
    el.textContent='Mise à jour prête — nouvelle version à la prochaine ouverture.';
    el.style.cssText='position:fixed;z-index:3000;right:18px;bottom:92px;max-width:min(420px,calc(100vw - 36px));padding:12px 15px;border-radius:15px;background:#fff;border:1px solid #dce5f0;color:#13213a;box-shadow:0 16px 40px rgba(19,33,58,.14);font:700 12px -apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif';
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),5200);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',notify,{once:true});
  else notify();
}

function watchWorker(worker,registration){
  if(!worker)return;
  const onState=()=>{
    if(worker.state!=='installed')return;
    if(swContainer?.controller)showUpdateReady();
    try{worker.postMessage({type:'SKIP_WAITING'})}catch{}
  };
  if(worker.state==='installed')onState();
  else worker.addEventListener('statechange',onState);
  if(registration?.waiting){
    if(swContainer?.controller)showUpdateReady();
    try{registration.waiting.postMessage({type:'SKIP_WAITING'})}catch{}
  }
}

async function registerPwa({forceCheck=false}={}){
  if(!swContainer||!nativeRegister||!window.isSecureContext)return null;
  if(!registrationPromise){
    registrationPromise=nativeRegister(SW_URL,{scope:'./',updateViaCache:'none'}).then(reg=>{
      if(reg.waiting){
        if(swContainer.controller)showUpdateReady();
        try{reg.waiting.postMessage({type:'SKIP_WAITING'})}catch{}
      }
      if(reg.installing)watchWorker(reg.installing,reg);
      reg.addEventListener('updatefound',()=>watchWorker(reg.installing,reg));
      return reg;
    }).catch(error=>{
      registrationPromise=null;
      console.warn('PWA V31',error);
      return null;
    });
  }
  const reg=await registrationPromise;
  if(!reg)return null;
  const now=Date.now();
  const last=Number(localStorage.getItem(LAST_CHECK_KEY)||0);
  if(forceCheck||!last||now-last>CHECK_COOLDOWN){
    localStorage.setItem(LAST_CHECK_KEY,String(now));
    reg.update().catch(()=>{});
  }
  return reg;
}

if(swContainer&&nativeRegister){
  try{
    swContainer.register=function(scriptURL,options){
      try{
        const url=new URL(String(scriptURL||''),location.href);
        if(url.origin===location.origin&&url.pathname.endsWith('/sw.js'))return registerPwa({forceCheck:false});
      }catch{}
      return nativeRegister(scriptURL,options);
    };
  }catch(error){console.warn('PWA V31 compatibilité',error)}
}

registerPwa({forceCheck:false});
window.addEventListener('load',()=>registerPwa({forceCheck:false}),{once:true});
window.addEventListener('online',()=>registerPwa({forceCheck:false}));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)registerPwa({forceCheck:false})});
swContainer?.addEventListener('controllerchange',()=>{if(hadController)showUpdateReady()});

window.__BS_CHECK_UPDATE=()=>registerPwa({forceCheck:true});
window.ASV31_RUNTIME={version:VERSION,singleServiceWorkerOwner:true,autoReload:false,updateOnNextOpen:true,staleBuildFallback:false};
})();
