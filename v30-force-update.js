(() => {
'use strict';

const UPDATER_VERSION='30.0.5';
const VERSION_URL='./version.json';
const APPLIED_KEY='bs-app-version-applied';
const PENDING_KEY='bs-app-update-pending';
const RELOADED_KEY='bs-app-update-reloaded-version';
const SUCCESS_KEY='bs-app-update-success';
const PAUSE_KEY='bs-app-update-paused-until';
const CHECK_INTERVAL=60*1000;
const HEALTH_TIMEOUT=18000;

let checking=false;
let lastCheck=0;
let pendingWorker=null;
let pendingVersion='';
let activationNoticeShown=false;

const safeMode=()=>new URLSearchParams(location.search).get('bs_safe')==='1';

// Un seul composant a le droit d'enregistrer sw.js. Les anciens modules V19/V29
// tentaient encore de l'enregistrer sans identifiant de build et provoquaient des
// changements de contrôleur successifs. On neutralise uniquement ces appels hérités.
const swContainer=navigator.serviceWorker;
const nativeRegister=swContainer?.register?.bind(swContainer)||null;
if(swContainer&&nativeRegister&&!swContainer.__bsSingleOwnerRegister){
  try{
    swContainer.register=function(scriptURL,options){
      try{
        const url=new URL(String(scriptURL||''),location.href);
        if(url.pathname.endsWith('/sw.js')&&!url.searchParams.has('build')){
          return Promise.reject(new Error('LEGACY_SW_REGISTRATION_BLOCKED'));
        }
      }catch{}
      return nativeRegister(scriptURL,options);
    };
    Object.defineProperty(swContainer,'__bsSingleOwnerRegister',{value:true,configurable:false,enumerable:false});
  }catch(error){
    console.warn('Protection service worker',error);
  }
}

function semver(value){
  return String(value||'0').split('.').map(part=>Number.parseInt(part,10)||0).slice(0,3);
}
function compareVersions(a,b){
  const av=semver(a),bv=semver(b);
  for(let i=0;i<3;i++){
    if(av[i]!==bv[i])return av[i]-bv[i];
  }
  return 0;
}
function pageVersion(){
  return document.querySelector('meta[name="bs-app-version"]')?.content||window.__BS_RELEASE?.version||'';
}
function versionFromScript(worker){
  try{
    if(!worker?.scriptURL)return'';
    return new URL(worker.scriptURL,location.href).searchParams.get('v')||'';
  }catch{return''}
}
function queryWorkerVersion(worker){
  return new Promise(resolve=>{
    if(!worker)return resolve('');
    const fallback=versionFromScript(worker);
    if(typeof MessageChannel==='undefined')return resolve(fallback);
    const channel=new MessageChannel();
    let done=false;
    const finish=value=>{
      if(done)return;
      done=true;
      clearTimeout(timer);
      resolve(value||fallback);
    };
    const timer=setTimeout(()=>finish(fallback),1400);
    channel.port1.onmessage=event=>finish(event.data?.type==='BS_SW_VERSION'?event.data?.version:fallback);
    try{worker.postMessage({type:'GET_VERSION'},[channel.port2])}
    catch{finish(fallback)}
  });
}
async function controllerVersion(){
  return queryWorkerVersion(navigator.serviceWorker?.controller||null);
}
function paused(){return Number(localStorage.getItem(PAUSE_KEY)||0)>Date.now()}

function showStatus(title,detail,delay=4200){
  if(typeof window.__BS_SAVED==='function'){
    window.__BS_SAVED(title,detail);
    return;
  }
  document.getElementById('bs-update-status')?.remove();
  const el=document.createElement('div');
  el.id='bs-update-status';
  el.setAttribute('role','status');
  el.setAttribute('aria-live','polite');
  el.innerHTML='<strong></strong><span></span>';
  el.querySelector('strong').textContent=title;
  el.querySelector('span').textContent=detail;
  el.style.cssText='position:fixed;z-index:3500;right:18px;bottom:96px;max-width:min(420px,calc(100vw - 36px));padding:14px 16px;border-radius:17px;background:#fff;border:1px solid #dce5f0;color:#13213a;box-shadow:0 18px 48px rgba(19,33,58,.16);font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif';
  el.querySelector('strong').style.cssText='display:block;font-size:14px;margin-bottom:3px';
  el.querySelector('span').style.cssText='display:block;font-size:12px;line-height:1.4;color:#6b7890';
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),delay);
}

function safeToActivate(){
  const active=document.activeElement;
  if(active&&['INPUT','TEXTAREA','SELECT'].includes(active.tagName))return false;
  if(active?.isContentEditable)return false;
  if(document.querySelector('.v19-modal-backdrop,.v19-modal[role="dialog"],[role="dialog"][aria-modal="true"]'))return false;
  return true;
}

async function fetchRemoteVersion(){
  const response=await fetch(`${VERSION_URL}?t=${Date.now()}`,{
    cache:'no-store',
    headers:{Accept:'application/json','Cache-Control':'no-cache'}
  });
  if(!response.ok)throw new Error(`Version HTTP ${response.status}`);
  const remote=await response.json();
  if(!/^\d+\.\d+\.\d+$/.test(String(remote?.version||'')))throw new Error('Version distante invalide');
  if(!remote?.serviceWorker)remote.serviceWorker='sw.js';
  return remote;
}

async function activateWorkerWhenSafe(worker,version){
  if(!worker||!version)return;
  pendingWorker=worker;
  pendingVersion=version;
  if(!safeToActivate()){
    if(!activationNoticeShown){
      activationNoticeShown=true;
      showStatus('Mise à jour prête','Elle sera appliquée automatiquement dès que la saisie en cours sera terminée.',5200);
    }
    return;
  }
  const verified=await queryWorkerVersion(worker);
  if(verified!==version){
    console.warn('Mise à jour différée : service worker non vérifié',version,verified);
    return;
  }
  localStorage.setItem(PENDING_KEY,version);
  worker.postMessage({type:'SKIP_WAITING'});
}

function tryPendingActivation(){
  if(pendingWorker&&pendingVersion&&safeToActivate()){
    activateWorkerWhenSafe(pendingWorker,pendingVersion).catch(()=>{});
  }
}

function watchInstallingWorker(worker,remote){
  if(!worker)return;
  const installed=()=>{
    if(worker.state!=='installed')return;
    if(!navigator.serviceWorker.controller){
      localStorage.setItem(APPLIED_KEY,remote.version);
      localStorage.removeItem(PENDING_KEY);
      return;
    }
    activateWorkerWhenSafe(worker,remote.version).catch(error=>console.warn('Activation mise à jour',error));
  };
  if(worker.state==='installed')installed();
  else worker.addEventListener('statechange',installed);
}

async function installRemote(remote){
  if(!swContainer||!window.isSecureContext||!nativeRegister)return;
  const script=`./${String(remote.serviceWorker||'sw.js').replace(/^\.\//,'')}?v=${encodeURIComponent(remote.version)}&build=${encodeURIComponent(remote.build||'stable')}`;
  const registration=await nativeRegister(script,{scope:'./',updateViaCache:'none'});

  if(registration.waiting){
    const waitingVersion=await queryWorkerVersion(registration.waiting);
    if(waitingVersion===remote.version){
      await activateWorkerWhenSafe(registration.waiting,remote.version);
    }
  }
  if(registration.installing)watchInstallingWorker(registration.installing,remote);
  registration.addEventListener('updatefound',()=>watchInstallingWorker(registration.installing,remote));
  await registration.update().catch(()=>{});
}

async function checkVersion(force=false){
  if(safeMode()||paused()||checking||!navigator.onLine)return;
  const now=Date.now();
  if(!force&&now-lastCheck<CHECK_INTERVAL)return;
  lastCheck=now;
  checking=true;
  try{
    const remote=await fetchRemoteVersion();
    const controlled=await controllerVersion();
    if(controlled&&compareVersions(controlled,remote.version)>0)return;
    if(controlled===remote.version){
      localStorage.setItem(APPLIED_KEY,remote.version);
      localStorage.removeItem(PENDING_KEY);
      return;
    }
    await installRemote(remote);
  }catch(error){
    console.warn('Vérification de mise à jour',error);
  }finally{
    checking=false;
  }
}

function markHealthy(){
  const success=sessionStorage.getItem(SUCCESS_KEY);
  const currentPage=pageVersion();
  if(currentPage)localStorage.setItem(APPLIED_KEY,currentPage);
  if(!success)return;
  localStorage.setItem(APPLIED_KEY,success);
  localStorage.removeItem(PENDING_KEY);
  sessionStorage.removeItem(SUCCESS_KEY);
  setTimeout(()=>showStatus(`Application mise à jour — V${success}`,'La nouvelle version est installée et prête sur cet appareil.',5000),300);
}

function appLooksHealthy(){
  const root=document.getElementById('app');
  return !!(root&&root.children.length&&String(root.textContent||'').trim().length>0);
}

function goSafeMode(version=''){
  localStorage.setItem(PAUSE_KEY,String(Date.now()+15*60*1000));
  localStorage.removeItem(PENDING_KEY);
  const target=new URL('./',location.href);
  target.searchParams.set('bs_safe','1');
  if(version)target.searchParams.set('from',version);
  location.replace(target.href);
}

function installHealthGuard(){
  if(safeMode())return;
  setTimeout(()=>{
    if(appLooksHealthy())return;
    const attempted=sessionStorage.getItem(SUCCESS_KEY)||localStorage.getItem(PENDING_KEY)||'';
    if(attempted){
      goSafeMode(attempted);
      return;
    }
    document.getElementById('bs-start-recovery')?.remove();
    const box=document.createElement('div');
    box.id='bs-start-recovery';
    box.style.cssText='position:fixed;inset:0;z-index:5000;display:grid;place-items:center;padding:24px;background:#f4f7fb;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;color:#13213a';
    box.innerHTML='<div style="width:min(520px,100%);background:#fff;border:1px solid #dce5f0;border-radius:26px;padding:26px;box-shadow:0 24px 64px rgba(19,33,58,.14)"><strong style="display:block;font-size:24px;margin-bottom:8px">Chargement incomplet</strong><p style="margin:0 0 18px;color:#6b7890;line-height:1.5">L’application n’a pas terminé son démarrage. Vos données ne sont pas supprimées.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button data-retry style="border:0;border-radius:14px;padding:12px 16px;background:#0757c9;color:#fff;font-weight:800">Réessayer</button><button data-safe style="border:1px solid #dce5f0;border-radius:14px;padding:12px 16px;background:#fff;color:#13213a;font-weight:800">Ouvrir la version stable</button></div></div>';
    document.body.appendChild(box);
    box.querySelector('[data-retry]').onclick=()=>location.reload();
    box.querySelector('[data-safe]').onclick=()=>goSafeMode();
  },HEALTH_TIMEOUT);
}

if(swContainer){
  swContainer.addEventListener('controllerchange',()=>{
    const target=localStorage.getItem(PENDING_KEY)||'';
    if(!target)return;
    if(localStorage.getItem(APPLIED_KEY)===target){
      localStorage.removeItem(PENDING_KEY);
      return;
    }
    if(localStorage.getItem(RELOADED_KEY)===target){
      localStorage.removeItem(PENDING_KEY);
      return;
    }
    localStorage.setItem(RELOADED_KEY,target);
    sessionStorage.setItem(SUCCESS_KEY,target);
    location.reload();
  });
  swContainer.addEventListener('message',event=>{
    if(event.data?.type==='BS_SW_ACTIVATED')tryPendingActivation();
  });
}

window.addEventListener('load',()=>{
  installHealthGuard();
  checkVersion(true);
},{once:true});
window.addEventListener('online',()=>checkVersion(true));
window.addEventListener('focus',()=>{tryPendingActivation();checkVersion(false)});
window.addEventListener('pageshow',()=>{tryPendingActivation();checkVersion(false)});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){tryPendingActivation();checkVersion(false)}});
window.addEventListener('bs-app-rendered',()=>{markHealthy();tryPendingActivation()});
setInterval(()=>checkVersion(false),15*60*1000);

document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{if(appLooksHealthy())markHealthy()},600),{once:true});

window.__BS_CHECK_UPDATE=()=>checkVersion(true);
window.__BS_FORCE_UPDATE=window.__BS_CHECK_UPDATE;
window.ASV30_FORCE_UPDATE={version:UPDATER_VERSION,mode:'single-owner-transactional',cacheReset:false,autoReload:'once-per-version',rollback:true};
})();
