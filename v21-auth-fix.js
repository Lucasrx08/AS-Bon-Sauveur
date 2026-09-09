(() => {
'use strict';
const VERIFIED='bs-v20-verified-role';
let loginTimer=null;

document.addEventListener('submit',e=>{
  if(e.target?.id!=='v20-login')return;
  const form=e.target;
  const btn=form.querySelector('button[type="submit"]');
  if(btn){btn.disabled=true;btn.dataset.originalText=btn.textContent;btn.textContent='Connexion…'}
  clearInterval(loginTimer);
  let checks=0;
  loginTimer=setInterval(()=>{
    checks++;
    const role=sessionStorage.getItem(VERIFIED);
    if(role&&role!=='public'){
      clearInterval(loginTimer);
      loginTimer=null;
      if(btn)btn.textContent='Connecté';
      setTimeout(()=>location.reload(),180);
      return;
    }
    if(checks>=50){
      clearInterval(loginTimer);
      loginTimer=null;
      if(btn){btn.disabled=false;btn.textContent=btn.dataset.originalText||'Se connecter'}
    }
  },120);
},true);
})();
