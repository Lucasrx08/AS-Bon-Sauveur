(() => {
'use strict';
const cfg=window.APP_CONFIG||{};
if(!(cfg.supabaseUrl&&cfg.supabaseAnonKey&&window.supabase))return;
const sb=window.__BS_SUPABASE_CLIENT||window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const roles={educator_football:'Section Football',educator_escalade:'Option Escalade',educator_gymnastique:'Sport-études Gymnastique',teacher_as:'Association Sportive',admin:'Administrateur'};
const toast=msg=>{const el=document.createElement('div');el.className='v19-toast';el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),3200)};
const wait=(p,ms)=>Promise.race([p,new Promise((_,reject)=>setTimeout(()=>reject(new Error('timeout')),ms))]);

function modal(title,body=''){
 document.getElementById('v20-users-modal')?.remove();
 const w=document.createElement('div');w.id='v20-users-modal';w.className='v19-modal-backdrop';
 w.innerHTML=`<div class="v19-modal wide" role="dialog" aria-modal="true"><div class="v19-modal-head"><h2>${esc(title)}</h2><button type="button" class="v19-icon-btn" aria-label="Fermer" data-close>×</button></div><div class="v19-modal-body" data-users-body>${body}</div></div>`;
 document.body.appendChild(w);const close=()=>w.remove();w.querySelector('[data-close]').onclick=close;w.onclick=e=>e.target===w&&close();return w;
}
function body(w,html){const el=w?.querySelector?.('[data-users-body]');if(el)el.innerHTML=html}
function status(w,msg,type='info'){
 const el=w?.querySelector?.('[data-user-status]');if(!el)return;
 el.className=`v21-user-status ${type}`;el.textContent=msg||'';el.hidden=!msg;
}
function storedAccessToken(){
 try{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i)||'';if(!key.startsWith('sb-')||!key.endsWith('-auth-token'))continue;const raw=localStorage.getItem(key);if(!raw)continue;const data=JSON.parse(raw);const token=data?.access_token||data?.currentSession?.access_token||data?.session?.access_token;if(token)return token}}catch{}
 return '';
}
async function accessToken(){
 try{const out=await wait(sb.auth.getSession(),1800);const token=out?.data?.session?.access_token;if(token)return token}catch{}
 const fallback=storedAccessToken();if(fallback)return fallback;
 throw new Error('Session administrateur indisponible. Reconnectez-vous puis réessayez.');
}
async function callAdmin(payload){
 const token=await accessToken();const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{
  const r=await fetch(`${cfg.supabaseUrl}/functions/v1/admin-users`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`,'apikey':cfg.supabaseAnonKey},body:JSON.stringify(payload),signal:controller.signal});
  let data={};try{data=await r.json()}catch{}
  if(!r.ok||data?.error)throw new Error(data?.error||`Erreur ${r.status}`);return data;
 }catch(e){if(e?.name==='AbortError')throw new Error('Le serveur ne répond pas. Réessayez.');throw e}finally{clearTimeout(timer)}
}

async function openUsers(){
 const w=modal('Utilisateurs & accès','<div class="v19-empty"><strong>Chargement des accès…</strong></div>');
 try{
  const data=await callAdmin({action:'list_access'});renderUsers(w,data.accounts||[]);
 }catch(err){body(w,`<div class="v21-user-status error">${esc(err?.message||'Impossible de charger les accès.')}</div>`)}
}
function renderUsers(w,users){
 const rows=users.map(u=>{
  const self=!!u.self,mode=u.mode==='pin'?'pin':'email';
  const identity=mode==='pin'?`<div class="v19-meta">Connexion : ${esc(u.loginName||u.displayName||'—')} · Code PIN</div>`:`<div class="v19-meta">${esc(u.email||'Ancien compte e-mail')}</div>`;
  let actions='';
  if(self) actions='<span class="v21-you-badge">Vous</span>';
  else if(mode==='pin') actions=`<div class="v21-user-actions"><button type="button" class="v19-btn small secondary" data-reset-pin="${esc(u.id)}" data-login="${esc(u.loginName||u.displayName||'')}">Changer le PIN</button><button type="button" class="v19-btn small v21-danger" data-remove="${esc(u.id)}" data-name="${esc(u.displayName||'cet utilisateur')}">Supprimer l’accès</button></div>`;
  else actions=`<div class="v21-user-actions"><button type="button" class="v19-btn small secondary" data-convert="${esc(u.id)}" data-name="${esc(u.displayName||'Utilisateur')}">Passer en PIN</button><button type="button" class="v19-btn small v21-danger" data-remove="${esc(u.id)}" data-name="${esc(u.displayName||'cet utilisateur')}">Supprimer l’accès</button></div>`;
  return `<tr><td><strong>${esc(u.displayName||'—')}</strong>${self?'<span class="v21-you-badge">Vous</span>':''}${identity}</td><td>${esc(roles[u.role]||u.role||'Public')}</td><td>${actions}</td></tr>`;
 }).join('');
 const roleOptions=Object.entries(roles).map(([v,l])=>`<option value="${v}">${esc(l)}</option>`).join('');
 body(w,`<div class="v21-users-intro"><strong>Créer un accès en quelques secondes</strong><p>Plus d’e-mail ni de mot de passe à récupérer : choisissez simplement le nom de la personne, son rôle et un PIN à 6 chiffres.</p></div><form id="v20-pin-create" class="v19-form"><label><span>Nom / Prénom</span><input required name="displayName" autocomplete="off" placeholder="Ex. Romain Murcia"></label><label><span>Code PIN</span><input required name="pin" type="password" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="new-password" placeholder="6 chiffres"></label><label class="full"><span>Rôle</span><select name="role">${roleOptions}</select></label><div class="full v19-modal-actions"><button class="v19-btn" type="button" data-create-pin>Créer l’accès</button></div></form><div class="v21-user-status" data-user-status hidden></div><div class="v19-section-head"><div><h2>Accès existants</h2><p>${users.length} compte(s).</p></div></div><div class="v19-table-wrap v21-users-table"><table class="v19-table"><thead><tr><th>Utilisateur</th><th>Rôle</th><th>Accès</th></tr></thead><tbody>${rows||'<tr><td colspan="3">Aucun accès.</td></tr>'}</tbody></table></div>`);
 const form=w.querySelector('#v20-pin-create'),btn=w.querySelector('[data-create-pin]');
 const create=()=>createPinAccess(form,w,btn);btn.onclick=create;form.addEventListener('submit',e=>{e.preventDefault();create()});form.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();create()}});
 w.querySelectorAll('[data-reset-pin]').forEach(b=>b.onclick=()=>resetPin(b.dataset.resetPin,b.dataset.login,w));
 w.querySelectorAll('[data-convert]').forEach(b=>b.onclick=()=>convertToPin(b.dataset.convert,b.dataset.name,w));
 w.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>removeAccess(b.dataset.remove,b.dataset.name,w));
}
async function createPinAccess(form,w,btn){
 if(btn.disabled)return;const fd=new FormData(form),displayName=String(fd.get('displayName')||'').trim(),pin=String(fd.get('pin')||'').trim(),role=String(fd.get('role')||'');
 if(!displayName)return status(w,'Renseignez le nom et le prénom.','error');
 if(!/^\d{6}$/.test(pin))return status(w,'Le PIN doit contenir exactement 6 chiffres.','error');
 btn.disabled=true;btn.textContent='Création…';status(w,'Création de l’accès…','info');
 try{await callAdmin({action:'create_pin_access',displayName,loginName:displayName,pin,role});status(w,`Accès créé : ${displayName} peut maintenant se connecter avec son nom et son PIN.`,'success');toast('Accès PIN créé');setTimeout(openUsers,900)}catch(err){const msg=err?.message||'Création impossible.';status(w,msg,'error');toast(msg)}finally{btn.disabled=false;btn.textContent='Créer l’accès'}
}
async function resetPin(userId,loginName,w){
 const pin=prompt('Nouveau code PIN à 6 chiffres :','');if(pin===null)return;if(!/^\d{6}$/.test(String(pin).trim()))return status(w,'Le PIN doit contenir exactement 6 chiffres.','error');
 status(w,'Modification du PIN…','info');
 try{await callAdmin({action:'reset_pin',userId,pin:String(pin).trim(),loginName});status(w,'Nouveau PIN enregistré.','success');toast('PIN modifié')}catch(err){status(w,err?.message||'Modification impossible.','error')}
}
async function convertToPin(userId,displayName,w){
 const loginName=prompt('Nom utilisé pour se connecter :',displayName||'');if(loginName===null)return;const cleanName=String(loginName).trim();if(!cleanName)return;
 const pin=prompt('Choisissez un code PIN à 6 chiffres :','');if(pin===null)return;if(!/^\d{6}$/.test(String(pin).trim()))return status(w,'Le PIN doit contenir exactement 6 chiffres.','error');
 status(w,`Conversion de ${displayName} vers le code PIN…`,'info');
 try{await callAdmin({action:'convert_to_pin',userId,displayName:displayName||cleanName,loginName:cleanName,pin:String(pin).trim()});status(w,'Compte converti. L’ancienne adresse e-mail n’est plus utilisée.','success');toast('Compte converti en PIN');setTimeout(openUsers,900)}catch(err){status(w,err?.message||'Conversion impossible.','error')}
}
async function removeAccess(userId,name,w){
 if(!userId)return;const ok=confirm(`Supprimer définitivement l’accès de ${name} ?\n\nLa personne ne pourra plus se connecter. Vous pourrez recréer un accès PIN plus tard.`);if(!ok)return;
 status(w,`Suppression de l’accès de ${name}…`,'info');
 try{await callAdmin({action:'remove_access',userId});status(w,'Accès supprimé définitivement.','success');toast('Accès supprimé');setTimeout(openUsers,700)}catch(err){const msg=err?.message||'Suppression impossible.';status(w,msg,'error');toast(msg)}
}
function inject(){
 if(sessionStorage.getItem('bs-v20-verified-role')!=='admin')return;
 const grid=document.querySelector('.v19-admin-cards');if(!grid||grid.querySelector('[data-v20-users]'))return;
 const b=document.createElement('button');b.className='v19-card v19-admin-action';b.dataset.v20Users='1';b.innerHTML='<div><h3>Utilisateurs & accès</h3><p>Créer les accès par nom + PIN, modifier les codes et supprimer les accès.</p></div>';b.onclick=openUsers;grid.appendChild(b);
}
new MutationObserver(inject).observe(document.body,{childList:true,subtree:true});inject();
})();
