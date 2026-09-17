(() => {
'use strict';

const VERSION='31.0.0';
const SW_URL='./sw.js';
const LAST_CHECK_KEY='bs-v31-sw-last-check';
const READY_KEY='bs-v31-update-ready';
const CHECK_COOLDOWN=6*60*60*1000;
let registrationPromise=null;

function showUpdateReady(){
  if(sessionStorage.getItem(READY_KEY)==='1')return;
  sessionStorage.setItem(READY_KEY,'1');
  const notify=()=>{
    if(typeof window.__BS_SAVED==='function'){
      window.__BS_SAVED('Mise à jour prête','Elle sera appliquée automatiquement à la prochaine ouverture de l’application.');
      return;
    }
    const existing=document.getElementById('bs-v31-update-ready');
    if(existing)return;
    const el=document.createElement('div');
    el.id='bs-v31-update-ready';
    el.setAttribute('role','status');
    el.setAttribute('aria-live','polite');
    el.textContent='Mise à jour prête — elle sera appliquée à la prochaine ouverture.';
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
    if(navigator.serviceWorker.controller){
      showUpdateReady();
      return;
    }
    // Première installation : on peut activer immédiatement puisqu'aucune ancienne version ne contrôle la page.
    try{worker.postMessage({type:'SKIP_WAITING'})}catch{}
  };
  if(worker.state==='installed')onState();
  else worker.addEventListener('statechange',onState);
  if(registration?.waiting&&navigator.serviceWorker.controller)showUpdateReady();
}

async function registerPwa({forceCheck=false}={}){
  if(!('serviceWorker' in navigator)||!window.isSecureContext)return null;
  if(!registrationPromise){
    registrationPromise=navigator.serviceWorker.register(SW_URL,{scope:'./',updateViaCache:'none'}).then(reg=>{
      if(reg.waiting)showUpdateReady();
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

window.addEventListener('load',()=>registerPwa({forceCheck:true}),{once:true});
window.addEventListener('online',()=>registerPwa({forceCheck:false}));
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden)registerPwa({forceCheck:false});
});

// Aucun rechargement automatique n'est déclenché par un changement de contrôleur.
// La version courante continue jusqu'à la prochaine ouverture : pas de boucle, pas de perte de saisie.
navigator.serviceWorker?.addEventListener('controllerchange',()=>{});

window.__BS_CHECK_UPDATE=()=>registerPwa({forceCheck:true});
window.ASV31_RUNTIME={version:VERSION,singleServiceWorkerOwner:true,autoReload:false,updateOnNextOpen:true};
})();
