(() => {
'use strict';
const VERSION='28.0.0';

function isPinSession(){return sessionStorage.getItem('bs-auth-method')==='pin'}

function protectPinOperationalSession(){
 if(!isPinSession())return;
 document.getElementById('v26-security')?.remove();
 document.querySelectorAll('[data-v26-secure]').forEach(x=>x.remove());
}

function patchVersion(){
 document.documentElement.dataset.appVersion='28';
 document.querySelectorAll('.v221-privacy-footer span').forEach(x=>x.textContent='V28');
 protectPinOperationalSession();
}

async function register(){
 if(!('serviceWorker' in navigator)||!window.isSecureContext)return;
 try{
  const reg=await navigator.serviceWorker.register('./sw.js?v=28.0.0',{scope:'./'});
  reg.update().catch(()=>{});
 }catch(error){console.warn('V28 service worker',error)}
}

patchVersion();
window.addEventListener('bs-app-rendered',()=>requestAnimationFrame(patchVersion));
window.addEventListener('bs-admin-mfa-required',()=>setTimeout(protectPinOperationalSession,0));
new MutationObserver(()=>requestAnimationFrame(protectPinOperationalSession)).observe(document.body,{childList:true,subtree:true});
register();

window.ASV28={
 version:VERSION,
 mode:'server-first',
 protections:[
  'events','reports','licenses','license-imports','convocations','appreciations',
  'documents','products','orders','specialty-notes','term-settings','registrations'
 ],
 crossDeviceRefresh:true,
 pinOperationalAccess:true
};
})();