(() => {
'use strict';
const VERSION='28.1.0';

function isPinSession(){return sessionStorage.getItem('bs-auth-method')==='pin'}

function protectPinOperationalSession(){
 if(!isPinSession())return;
 document.getElementById('v26-security')?.remove();
 document.querySelectorAll('[data-v26-secure]').forEach(x=>x.remove());
}

function patchVersion(){
 if(window.__BS_RELEASE?.major>=29){window.__BS_APPLY_RELEASE_LABEL?.();protectPinOperationalSession();return}
 document.documentElement.dataset.appVersion='28';
 document.querySelectorAll('.v221-privacy-footer span').forEach(x=>x.textContent='V28.1');
 protectPinOperationalSession();
}

function savedMessage(title='Saisie validée',detail='Enregistrée dans la base centrale et synchronisée avec les autres appareils autorisés.'){
 document.getElementById('v281-saved')?.remove();
 const el=document.createElement('div');el.id='v281-saved';el.setAttribute('role','status');el.setAttribute('aria-live','polite');
 el.innerHTML='<div class="v281-saved-icon">✓</div><div><strong></strong><span></span></div>';
 el.querySelector('strong').textContent=title;el.querySelector('span').textContent=detail;
 el.style.cssText='position:fixed;z-index:1400;right:22px;bottom:120px;max-width:430px;display:flex;gap:12px;align-items:center;padding:15px 17px;border-radius:18px;background:#ecfdf3;border:1px solid #abefc6;color:#14532d;box-shadow:0 18px 50px rgba(16,24,40,.16);font-family:inherit;animation:v281in .18s ease-out';
 el.querySelector('.v281-saved-icon').style.cssText='width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#16a34a;color:white;font-weight:900;font-size:20px;flex:0 0 auto';
 el.querySelector('strong').style.cssText='display:block;font-size:15px;margin-bottom:2px';
 el.querySelector('span').style.cssText='display:block;font-size:12px;line-height:1.35;color:#357a4d';
 document.body.appendChild(el);
 setTimeout(()=>{el.style.opacity='0';el.style.transform='translateY(6px)';el.style.transition='.2s';setTimeout(()=>el.remove(),220)},3200);
}
window.__BS_SAVED=savedMessage;

async function register(){
 if(window.__BS_RELEASE?.major>=29)return;
 if(!('serviceWorker' in navigator)||!window.isSecureContext)return;
 try{
  const reg=await navigator.serviceWorker.register('./sw.js?v=28.1.0',{scope:'./'});
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