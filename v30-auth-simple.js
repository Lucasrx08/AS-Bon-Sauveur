(() => {
'use strict';

// V30 — accès équipe simplifié : une seule authentification (nom + PIN,
// ou compte administrateur de secours). La couche MFA historique n'est plus
// exigée par l'interface. Les droits Supabase et les rôles restent inchangés.
const AUTH_METHOD='bs-auth-method';

// v20-bridge utilise la valeur "pin" comme accès opérationnel à facteur unique.
// La session Supabase reste, elle, la source d'identité et de rôle.
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

cleanLegacyMfaUi();
updateLegacyCopy();
new MutationObserver(()=>{
  cleanLegacyMfaUi();
  updateLegacyCopy();
}).observe(document.body,{childList:true,subtree:true});

window.ASV30_AUTH={version:'30.0.0',mode:'single-factor-team-access',mfaRequired:false};
})();
