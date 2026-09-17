(() => {
'use strict';

function release(){return window.__BS_RELEASE||{major:29,label:'V29.1',version:'29.1.0'}}
function applyReleaseLabel(){
  const current=release();
  document.documentElement.dataset.appVersion=String(current.major);
  document.querySelectorAll('.v221-privacy-footer span').forEach(el=>{if(el.textContent!==current.label)el.textContent=current.label});
}
window.__BS_APPLY_RELEASE_LABEL=applyReleaseLabel;

function restoreTvExport(){
  const install=window.ASV2112_PDF?.installTvButton;
  if(typeof install==='function')install();
}

function registerPwa(){
  // V31 centralise entièrement le service worker dans v31-runtime.js.
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
document.addEventListener('DOMContentLoaded',applyReleaseLabel,{once:true});

applyReleaseLabel();
restoreTvExport();
registerPwa();
if(typeof window.__BS_REALTIME_REFRESH==='function')window.__BS_REALTIME_REFRESH().catch(()=>{});

const current=release();
window.ASV29={
  version:current.version,
  label:current.label,
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