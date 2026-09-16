(() => {
'use strict';
const VERSION='27.9.0';

function patch(){
 if(window.__BS_RELEASE?.major>=29)return;
 document.documentElement.dataset.appVersion='27';
 document.querySelectorAll('.v221-privacy-footer span').forEach(x=>x.textContent='V27.9');
 document.querySelectorAll('[data-v241-tv-export]').forEach(x=>x.remove());
}
async function register(){
 if(!('serviceWorker' in navigator)||!window.isSecureContext)return;
 try{
  const reg=await navigator.serviceWorker.register('./sw.js?v=27.9.0',{scope:'./'});
  reg.update().catch(()=>{});
 }catch(error){console.warn('V27 service worker',error)}
}
patch();
window.addEventListener('bs-app-rendered',()=>requestAnimationFrame(patch));
register();
window.ASV27={version:VERSION,focus:['server-first-reports','pin-admin-reports','cross-device-report-sync']};
})();