(() => {
'use strict';
const VERIFIED='bs-v20-verified-role';
const ROLE_KEY='bs-demo-role-v4';
const PUBLIC_LABEL='Espace public';
const ALLOWED=['public','educator_escalade','educator_football','educator_gymnastique','teacher_as','admin'];
const AVATAR={public:'P',teacher_as:'AS',admin:'A',educator_football:'FO',educator_escalade:'ES',educator_gymnastique:'GY'};
const ROLE_TITLE={public:'Espace public',teacher_as:'Association Sportive',admin:'Administrateur',educator_football:'Section Football',educator_escalade:'Option Escalade',educator_gymnastique:'Sport-études Gymnastique'};

function hasStoredAuth(){
  try{
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i)||'';
      if(/^sb-.*-auth-token$/.test(key)&&localStorage.getItem(key))return true;
    }
  }catch{}
  return false;
}
function authoritativeRole(){
  const verified=sessionStorage.getItem(VERIFIED);
  if(ALLOWED.includes(verified))return verified;
  const remembered=localStorage.getItem(ROLE_KEY)||'public';
  if(hasStoredAuth()&&ALLOWED.includes(remembered))return remembered;
  return 'public';
}
function appRole(){try{return window.app?.role?.()||localStorage.getItem(ROLE_KEY)||'public'}catch{return 'public'}}
function isEducator(r){return /^educator_/.test(r)}

function syncAvatar(r,root=document){
  root.querySelectorAll?.('.v19-avatar').forEach(el=>{
    const value=AVATAR[r]||'P';
    if(el.textContent!==value)el.textContent=value;
    const title=ROLE_TITLE[r]||PUBLIC_LABEL;
    el.setAttribute('aria-label',title);
    el.title=title;
  });
}
function replacePublicLabel(root=document){
  if(authoritativeRole()!=='public')return;
  root.querySelectorAll?.('.v19-meta,.v20-access-card span').forEach(el=>{
    const t=(el.textContent||'').trim();
    if(t==='Élèves / Parents'||t==='Élève / Parent'||t==='Élèves/Parents')el.textContent=PUBLIC_LABEL;
  });
}

function removeForbiddenAdminUI(r){
  if(r==='admin')return;
  document.querySelectorAll('[data-v20-users],[data-v21-docs],[data-v21-products],.v19-admin-cards').forEach(el=>el.remove());
  document.querySelectorAll('#v20-users-modal,#v21-admin-modal').forEach(el=>el.remove());
  const kicker=(document.querySelector('.v19-page-head .v19-kicker')?.textContent||'').trim().toUpperCase();
  const title=(document.querySelector('.v19-page-head h1')?.textContent||'').trim().toUpperCase();
  if(kicker.includes('ADMIN')||title==='ADMINISTRATION'||title==='ADMINISTRATEUR')window.app?.go?.('home');
}

let syncing=false;
function enforce(){
  if(syncing)return;
  syncing=true;
  try{
    const r=authoritativeRole();
    document.body.dataset.bsRole=r;
    const shown=appRole();
    const verified=sessionStorage.getItem(VERIFIED);

    // Plus aucun reload de synchronisation de rôle. Quand Supabase a réellement validé
    // un rôle, on réhydrate simplement l'interface courante avec les données déjà chargées.
    if(shown!==r&&ALLOWED.includes(verified)){
      localStorage.setItem(ROLE_KEY,r);
      const data=window.app?.readData?.();
      if(data&&typeof window.app?.hydrateFromServer==='function')window.app.hydrateFromServer(data,r);
    }

    syncAvatar(r);
    removeForbiddenAdminUI(r);
    replacePublicLabel();
    if(isEducator(r))document.querySelectorAll('.v21-admin-shortcuts,.v19-admin-action').forEach(el=>el.remove());
  }finally{
    syncing=false;
  }
}

window.addEventListener('bs-role-verified',()=>setTimeout(enforce,0));
window.addEventListener('pageshow',enforce);
window.addEventListener('focus',enforce);
window.addEventListener('bs-app-rendered',()=>requestAnimationFrame(enforce));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)enforce()});
enforce();
})();
