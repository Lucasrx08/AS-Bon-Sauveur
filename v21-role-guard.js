(() => {
'use strict';
const VERIFIED='bs-v20-verified-role';
const ROLE_KEY='bs-demo-role-v4';
const RELOAD_MARK='bs-v21-role-sync-reload';
const PUBLIC_LABEL='Espace public';

function authoritativeRole(){
  const r=sessionStorage.getItem(VERIFIED);
  return ['public','educator_escalade','educator_football','educator_gymnastique','teacher_as','admin'].includes(r)?r:'public';
}
function appRole(){try{return window.app?.role?.()||localStorage.getItem(ROLE_KEY)||'public'}catch{return 'public'}}
function isEducator(r){return /^educator_/.test(r)}

function replacePublicLabel(root=document){
  if(authoritativeRole()!=='public')return;
  root.querySelectorAll?.('.v19-avatar').forEach(el=>{
    if(el.textContent!=='P')el.textContent='P';
    el.setAttribute('aria-label',PUBLIC_LABEL);
    el.title=PUBLIC_LABEL;
  });
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
  if(kicker.includes('ADMIN')||title==='ADMINISTRATION'||title==='ADMINISTRATEUR'){
    window.app?.go?.('home');
  }
}

function enforce(){
  const r=authoritativeRole();
  document.body.dataset.bsRole=r;
  const shown=appRole();

  if(shown!==r){
    localStorage.setItem(ROLE_KEY,r);
    const marker=`${shown}->${r}`;
    if(sessionStorage.getItem(RELOAD_MARK)!==marker){
      sessionStorage.setItem(RELOAD_MARK,marker);
      location.reload();
      return;
    }
  }else{
    sessionStorage.removeItem(RELOAD_MARK);
  }

  removeForbiddenAdminUI(r);
  replacePublicLabel();

  if(isEducator(r)){
    // Un éducateur ne doit jamais conserver une page d'administration ouverte.
    document.querySelectorAll('.v21-admin-shortcuts,.v19-admin-action').forEach(el=>el.remove());
  }
}

window.addEventListener('bs-role-verified',()=>setTimeout(enforce,0));
window.addEventListener('pageshow',enforce);
new MutationObserver(()=>requestAnimationFrame(enforce)).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
enforce();
})();
