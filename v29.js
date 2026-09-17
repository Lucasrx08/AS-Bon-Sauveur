(() => {
'use strict';
const RELEASE=window.__BS_RELEASE||{major:29,label:'V29.1',version:'29.1.0'};

function applyReleaseLabel(){
  document.documentElement.dataset.appVersion=String(RELEASE.major);
  document.querySelectorAll('.v221-privacy-footer span').forEach(el=>{if(el.textContent!==RELEASE.label)el.textContent=RELEASE.label});
}
window.__BS_APPLY_RELEASE_LABEL=applyReleaseLabel;

function restoreTvExport(){
  const install=window.ASV2112_PDF?.installTvButton;
  if(typeof install==='function')install();
}

let applying=false;
const observer=new MutationObserver(()=>{
  if(applying)return;
  applying=true;
  requestAnimationFrame(()=>{applyReleaseLabel();applying=false});
});
observer.observe(document.body,{childList:true,subtree:true,characterData:true});

// À partir de la V30, un seul module pilote le service worker : v30-force-update.js.
// L'ancien enregistrement V29 créait une concurrence avec la V30 et pouvait provoquer
// un changement de contrôleur puis un rechargement à chaque ouverture.
function registerPwa(){
  return;
}

function refreshOperationalData(){
  const fn=window.__BS_REFRESH_DATA;
  if(typeof fn==='function')fn().catch(()=>{});
}
function afterAppRender(){
  requestAnimationFrame(()=>{
    applyReleaseLabel();
    restoreTvExport();
  });
}
window.addEventListener('online',refreshOperationalData);
window.addEventListener('focus',()=>{applyReleaseLabel();restoreTvExport()});
window.addEventListener('bs-app-rendered',afterAppRender);

applyReleaseLabel();
restoreTvExport();
registerPwa();
if(typeof window.__BS_REALTIME_REFRESH==='function')window.__BS_REALTIME_REFRESH().catch(()=>{});

window.ASV29={
  version:RELEASE.version,
  label:RELEASE.label,
  channel:'stable',
  architecture:'server-first',
  realtime:true,
  protections:[
    'cross-device-realtime',
    'no-local-authoritative-overwrite',
    'server-confirmed-events',
    'server-confirmed-reports',
    'server-confirmed-licenses',
    'server-confirmed-license-imports',
    'server-confirmed-convocations',
    'server-confirmed-appreciations',
    'server-confirmed-documents-products-orders',
    'server-confirmed-specialty-notes-terms',
    'public-orders-and-registrations-edge-functions',
    'success-confirmations'
  ]
};
})();
