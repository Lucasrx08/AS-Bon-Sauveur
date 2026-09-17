(() => {
'use strict';

const AUTH_METHOD='bs-auth-method';
sessionStorage.setItem(AUTH_METHOD,'pin');
window.__BS_ADMIN_MFA_DISABLED=true;

function cleanLegacyMfaUi(){
  document.getElementById('v26-security')?.remove();
  document.querySelectorAll('[data-v26-secure],.v26-badge').forEach(el=>el.remove());
}

function updateLegacyCopy(root=document){
  root.querySelectorAll?.('.v19-meta,.v26-security-lead p').forEach(el=>{
    if((el.textContent||'').includes('La double authentification protège en plus le compte administrateur.')){
      el.textContent=(el.textContent||'').replace('La double authentification protège en plus le compte administrateur.','Votre compte reste protégé par votre authentification et les droits associés à votre profil.');
    }
  });
}

function clean(){
  cleanLegacyMfaUi();
  updateLegacyCopy();
}
clean();
document.addEventListener('DOMContentLoaded',clean,{once:true});
window.addEventListener('bs-app-rendered',()=>requestAnimationFrame(clean));
window.addEventListener('bs-admin-mfa-required',()=>setTimeout(clean,0));

window.ASV30_AUTH={version:'31.0.0',mode:'single-factor-team-access',mfaRequired:false};
})();
