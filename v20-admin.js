(() => {
'use strict';
const cfg=window.APP_CONFIG||{};
if(!(cfg.supabaseUrl&&cfg.supabaseAnonKey&&window.supabase))return;
const sb=window.__BS_SUPABASE_CLIENT||window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
const APP_REDIRECT='https://lucasrx08.github.io/AS-Bon-Sauveur/';
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const roles={educator_football:'Section Football',educator_escalade:'Option Escalade',educator_gymnastique:'Sport-études Gymnastique',teacher_as:'Association Sportive',admin:'Administrateur'};
const toast=msg=>{const el=document.createElement('div');el.className='v19-toast';el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),3200)};
const wait=(p,ms)=>Promise.race([p,new Promise((_,reject)=>setTimeout(()=>reject(new Error('timeout')),ms))]);

function modal(title,body){
 document.getElementById('v20-users-modal')?.remove();
 const w=document.createElement('div');w.id='v20-users-modal';w.className='v19-modal-backdrop';
 w.innerHTML=`<div class="v19-modal wide" role="dialog" aria-modal="true" aria-labelledby="v20-users-title"><div class="v19-modal-head"><h2 id="v20-users-title">${esc(title)}</h2><button type="button" class="v19-icon-btn" aria-label="Fermer" data-close>×</button></div><div class="v19-modal-body">${body}</div></div>`;
 document.body.appendChild(w);const close=()=>w.remove();w.querySelector('[data-close]').onclick=close;w.onclick=e=>e.target===w&&close();return w;
}
function status(w,msg,type='info'){
 const el=w?.querySelector?.('[data-user-status]');if(!el)return;
 el.className=`v21-user-status ${type}`;el.textContent=msg||'';el.hidden=!msg;
}
function storedAccessToken(){
 try{
  for(let i=0;i<localStorage.length;i++){
   const key=localStorage.key(i)||'';
   if(!key.startsWith('sb-')||!key.endsWith('-auth-token'))continue;
   const raw=localStorage.getItem(key);if(!raw)continue;
   const data=JSON.parse(raw);
   const token=data?.access_token||data?.currentSession?.access_token||data?.session?.access_token;
   if(token)return token;
  }
 }catch{}
 return '';
}
async function accessToken(){
 try{
  const out=await wait(sb.auth.getSession(),1800);
  const token=out?.data?.session?.access_token;
  if(token)return token;
 }catch{}
 const fallback=storedAccessToken();
 if(fallback)return fallback;
 throw new Error('Session administrateur indisponible. Reconnectez-vous puis réessayez.');
}
async function callAdmin(body){
 const token=await accessToken();
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
 try{
  const r=await fetch(`${cfg.supabaseUrl}/functions/v1/admin-users`,{
   method:'POST',
   headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`,'apikey':cfg.supabaseAnonKey},
   body:JSON.stringify(body),signal:controller.signal
  });
  let data={};try{data=await r.json()}catch{}
  if(!r.ok||data?.error)throw new Error(data?.error||`Erreur ${r.status}`);
  return data;
 }catch(e){
  if(e?.name==='AbortError')throw new Error('Le serveur ne répond pas. Réessayez.');
  throw e;
 }finally{clearTimeout(timer)}
}
async function openUsers(){
 let session=null;
 try{session=(await wait(sb.auth.getSession(),2500))?.data?.session||null}catch{}
 if(!session?.user)return toast('Connexion administrateur requise.');
 const {data:profile}=await sb.from('profiles').select('role').eq('id',session.user.id).single();
 if(profile?.role!=='admin')return toast('Accès administrateur requis.');
 const {data:users,error}=await sb.from('profiles').select('id,display_name,email,role').order('display_name');if(error)return toast(error.message);
 const rows=(users||[]).map(u=>{
  const self=u.id===session.user.id;
  return `<tr><td><strong>${esc(u.display_name||'—')}</strong>${self?'<span class="v21-you-badge">Vous</span>':''}<div class="v19-meta">${esc(u.email||'—')}</div></td><td>${esc(roles[u.role]||u.role||'Public')}</td><td><div class="v21-user-actions"><button type="button" class="v19-btn small secondary" data-reset="${esc(u.email||'')}">Réinitialiser le mot de passe</button>${self?'':`<button type="button" class="v19-btn small v21-danger" data-remove="${esc(u.id)}" data-name="${esc(u.display_name||u.email||'cet utilisateur')}" data-email="${esc(u.email||'')}">Supprimer l’accès</button>`}</div></td></tr>`;
 }).join('');
 const roleOptions=Object.entries(roles).map(([v,l])=>`<option value="${v}">${esc(l)}</option>`).join('');
 const w=modal('Utilisateurs & accès',`<div class="v21-users-intro"><strong>Inviter un utilisateur</strong><p>L’utilisateur recevra un e-mail pour créer son mot de passe et accéder uniquement à l’espace correspondant à son rôle.</p></div><form id="v20-invite" class="v19-form"><label><span>Nom affiché</span><input required name="displayName" autocomplete="name"></label><label><span>Adresse e-mail</span><input required type="email" name="email" autocomplete="email"></label><label class="full"><span>Rôle</span><select name="role">${roleOptions}</select></label><div class="full v19-modal-actions"><button class="v19-btn" type="button" data-submit>Inviter l’utilisateur</button></div></form><div class="v21-user-status" data-user-status hidden></div><div class="v19-section-head"><div><h2>Comptes existants</h2><p>${users?.length||0} compte(s) ayant accès à l’application.</p></div></div><div class="v19-table-wrap v21-users-table"><table class="v19-table"><thead><tr><th>Utilisateur</th><th>Rôle</th><th>Accès</th></tr></thead><tbody>${rows}</tbody></table></div>`);
 const form=w.querySelector('#v20-invite'),btn=w.querySelector('[data-submit]');
 btn.onclick=()=>invite(form,w,btn);
 form.addEventListener('submit',e=>{e.preventDefault();invite(form,w,btn)});
 form.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();invite(form,w,btn)}});
 w.querySelectorAll('[data-reset]').forEach(b=>b.onclick=()=>reset(b.dataset.reset,w));
 w.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>removeAccess(b.dataset.remove,b.dataset.name,b.dataset.email,w));
}
async function invite(form,w,btn){
 if(btn.disabled)return;
 const fd=new FormData(form),email=String(fd.get('email')||'').trim().toLowerCase(),displayName=String(fd.get('displayName')||'').trim(),role=String(fd.get('role')||'');
 if(!displayName)return status(w,'Renseignez le nom affiché.','error');
 if(!email||!/^\S+@\S+\.\S+$/.test(email))return status(w,'Renseignez une adresse e-mail valide.','error');
 btn.disabled=true;btn.textContent='Envoi…';status(w,'Envoi de l’invitation en cours…','info');
 try{
  await callAdmin({action:'invite',displayName,email,role,redirectTo:APP_REDIRECT});
  status(w,`Invitation envoyée à ${email}.`,'success');toast('Invitation envoyée');
  form.reset();
  setTimeout(()=>openUsers(),900);
 }catch(err){
  const msg=err?.message||'Invitation impossible.';status(w,msg,'error');toast(msg);
 }finally{btn.disabled=false;btn.textContent='Inviter l’utilisateur'}
}
async function reset(email,w){
 if(!email)return;status(w,`Envoi du lien de réinitialisation à ${email}…`,'info');
 try{const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:APP_REDIRECT});if(error)throw error;status(w,`E-mail de réinitialisation envoyé à ${email}.`,'success')}catch(err){status(w,err?.message||'Envoi impossible.','error')}
}
async function removeAccess(userId,name,email,w){
 if(!userId)return;
 const ok=confirm(`Supprimer l’accès de ${name} ?\n\nCette personne ne pourra plus se connecter à l’application. Elle pourra être réinvitée plus tard.`);if(!ok)return;
 status(w,`Suppression de l’accès de ${name}…`,'info');
 try{await callAdmin({action:'remove_access',userId});status(w,`Accès supprimé${email?` pour ${email}`:''}.`,'success');setTimeout(()=>openUsers(),700)}catch(err){const msg=err?.message||'Suppression impossible.';status(w,msg,'error');toast(msg)}
}
function inject(){
 if(sessionStorage.getItem('bs-v20-verified-role')!=='admin')return;
 const grid=document.querySelector('.v19-admin-cards');if(!grid||grid.querySelector('[data-v20-users]'))return;
 const b=document.createElement('button');b.className='v19-card v19-admin-action';b.dataset.v20Users='1';b.innerHTML='<div><h3>Utilisateurs & accès</h3><p>Inviter les éducateurs et enseignants, réinitialiser leurs mots de passe et supprimer leurs accès.</p></div>';b.onclick=openUsers;grid.appendChild(b);
}
new MutationObserver(inject).observe(document.body,{childList:true,subtree:true});inject();
})();
