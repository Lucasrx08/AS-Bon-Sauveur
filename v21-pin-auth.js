(() => {
'use strict';
const cfg=window.APP_CONFIG||{};
if(!(cfg.supabaseUrl&&cfg.supabaseAnonKey&&window.supabase))return;
const sb=window.__BS_SUPABASE_CLIENT||window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
const VERIFIED='bs-v20-verified-role';
const ROLE_KEY='bs-demo-role-v4';
const roleLabels={public:'Espace public',educator_escalade:'Option Escalade',educator_football:'Section Football',educator_gymnastique:'Sport-études Gymnastique',teacher_as:'Association Sportive',admin:'Administrateur'};
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const toast=msg=>{const el=document.createElement('div');el.className='v19-toast';el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),3200)};

function modal(title,body){
 document.getElementById('v21-pin-modal')?.remove();
 document.getElementById('v20-modal')?.remove();
 const w=document.createElement('div');w.id='v21-pin-modal';w.className='v19-modal-backdrop';
 w.innerHTML=`<div class="v19-modal" role="dialog" aria-modal="true"><div class="v19-modal-head"><h2>${esc(title)}</h2><button type="button" class="v19-icon-btn" aria-label="Fermer" data-close>×</button></div><div class="v19-modal-body">${body}</div></div>`;
 document.body.appendChild(w);
 const close=()=>w.remove();w.querySelector('[data-close]').onclick=close;w.onclick=e=>e.target===w&&close();
 setTimeout(()=>w.querySelector('input,button')?.focus(),30);
 return w;
}
function setStatus(w,msg,type='info'){
 const el=w?.querySelector?.('[data-pin-status]');if(!el)return;
 el.className=`v21-user-status ${type}`;el.textContent=msg||'';el.hidden=!msg;
}

function pinLoginModal(){
 const w=modal('Connexion',`<div class="v21-users-intro"><strong>Accès équipe sportive</strong><p>Saisissez simplement votre nom puis votre code PIN à 6 chiffres.</p></div><form id="v21-pin-login" class="v19-form"><label class="full"><span>Nom / Prénom</span><input required name="loginName" autocomplete="username" autocapitalize="words" placeholder="Ex. Romain Murcia"></label><label class="full"><span>Code PIN</span><input required name="pin" type="password" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="current-password" placeholder="••••••"></label><div class="full v19-modal-actions"><button type="button" class="v19-btn secondary" data-admin-email>Accès administrateur</button><button type="button" class="v19-btn" data-pin-submit>Se connecter</button></div></form><div class="v21-user-status" data-pin-status hidden></div>`);
 const form=w.querySelector('#v21-pin-login'),btn=w.querySelector('[data-pin-submit]');
 const submit=()=>loginWithPin(form,w,btn);
 btn.onclick=submit;
 form.addEventListener('submit',e=>{e.preventDefault();submit()});
 form.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submit()}});
 w.querySelector('[data-admin-email]').onclick=adminEmailModal;
 return w;
}

async function loginWithPin(form,w,btn){
 if(btn.disabled)return;
 const fd=new FormData(form),loginName=String(fd.get('loginName')||'').trim(),pin=String(fd.get('pin')||'').trim();
 if(!loginName)return setStatus(w,'Saisissez votre nom.','error');
 if(!/^\d{6}$/.test(pin))return setStatus(w,'Le code PIN doit contenir exactement 6 chiffres.','error');
 btn.disabled=true;btn.textContent='Connexion…';setStatus(w,'Vérification du code…','info');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 try{
  const r=await fetch(`${cfg.supabaseUrl}/functions/v1/pin-login`,{method:'POST',headers:{'Content-Type':'application/json','apikey':cfg.supabaseAnonKey},body:JSON.stringify({loginName,pin}),signal:controller.signal});
  let data={};try{data=await r.json()}catch{}
  if(!r.ok||data?.error)throw new Error(data?.error||'Connexion impossible.');
  const {error}=await sb.auth.setSession({access_token:data.access_token,refresh_token:data.refresh_token});
  if(error)throw error;
  btn.textContent='Ouverture…';setStatus(w,'Connexion réussie. Ouverture de votre espace…','success');
  setTimeout(()=>location.reload(),180);
 }catch(err){
  const msg=err?.name==='AbortError'?'Le serveur met trop de temps à répondre. Réessayez.':(err?.message||'Connexion impossible.');
  setStatus(w,msg,'error');toast(msg);btn.disabled=false;btn.textContent='Se connecter';
 }finally{clearTimeout(timer)}
}

function adminEmailModal(){
 const w=modal('Accès administrateur',`<div class="v21-users-intro"><strong>Compte administrateur de secours</strong><p>Cet accès par e-mail est conservé uniquement pour l’administration.</p></div><form id="v21-admin-email-login" class="v19-form"><label class="full"><span>Adresse e-mail</span><input required type="email" name="email" autocomplete="username"></label><label class="full"><span>Mot de passe</span><input required type="password" name="password" autocomplete="current-password"></label><div class="full v19-modal-actions"><button type="button" class="v19-btn secondary" data-back-pin>Retour au PIN</button><button type="button" class="v19-btn" data-email-submit>Se connecter</button></div></form><div class="v21-user-status" data-pin-status hidden></div>`);
 const form=w.querySelector('#v21-admin-email-login'),btn=w.querySelector('[data-email-submit]');
 const submit=()=>loginAdminEmail(form,w,btn);
 btn.onclick=submit;form.addEventListener('submit',e=>{e.preventDefault();submit()});form.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submit()}});
 w.querySelector('[data-back-pin]').onclick=pinLoginModal;
 return w;
}
async function loginAdminEmail(form,w,btn){
 if(btn.disabled)return;
 const fd=new FormData(form),email=String(fd.get('email')||'').trim(),password=String(fd.get('password')||'');
 if(!email||!password)return setStatus(w,'Renseignez votre e-mail et votre mot de passe.','error');
 btn.disabled=true;btn.textContent='Connexion…';setStatus(w,'Connexion administrateur…','info');
 try{
  const {data,error}=await sb.auth.signInWithPassword({email,password});if(error)throw error;
  if(!data?.user)throw new Error('Connexion impossible.');
  btn.textContent='Ouverture…';setStatus(w,'Connexion réussie.','success');setTimeout(()=>location.reload(),180);
 }catch(err){const msg=err?.message||'Connexion impossible.';setStatus(w,msg,'error');btn.disabled=false;btn.textContent='Se connecter'}
}

async function profileModal(){
 let session=null;
 try{session=(await sb.auth.getSession())?.data?.session||null}catch{}
 if(!session?.user)return pinLoginModal();
 let profile=null;
 try{profile=(await sb.from('profiles').select('display_name,role,email').eq('id',session.user.id).single())?.data||null}catch{}
 const name=profile?.display_name||'Utilisateur',role=profile?.role||sessionStorage.getItem(VERIFIED)||'public';
 const w=modal('Mon espace',`<div class="v19-stack"><div class="v19-card"><strong>${esc(name)}</strong><div class="v19-meta">${esc(roleLabels[role]||role)}</div></div><button type="button" class="v19-btn" data-pin-logout>Se déconnecter</button></div>`);
 w.querySelector('[data-pin-logout]').onclick=async()=>{try{await sb.auth.signOut()}catch{}sessionStorage.removeItem(VERIFIED);localStorage.setItem(ROLE_KEY,'public');location.reload()};
 return w;
}

function install(){
 if(!window.app)return setTimeout(install,80);
 window.app.profile=profileModal;
}
install();
})();
