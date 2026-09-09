(() => {
'use strict';
const cfg=window.APP_CONFIG||{};if(!(cfg.supabaseUrl&&cfg.supabaseAnonKey&&window.supabase))return;
const sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const roles={educator_football:'Section Football',educator_escalade:'Option Escalade',educator_gymnastique:'Sport-études Gymnastique',teacher_as:'Association Sportive',admin:'Administrateur'};
const toast=msg=>{const el=document.createElement('div');el.className='v19-toast';el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),2600)};
function modal(title,body){document.getElementById('v20-users-modal')?.remove();const w=document.createElement('div');w.id='v20-users-modal';w.className='v19-modal-backdrop';w.innerHTML=`<div class="v19-modal wide" role="dialog" aria-modal="true" aria-labelledby="v20-users-title"><div class="v19-modal-head"><h2 id="v20-users-title">${esc(title)}</h2><button type="button" class="v19-icon-btn" aria-label="Fermer" data-close>×</button></div><div class="v19-modal-body">${body}</div></div>`;document.body.appendChild(w);const close=()=>w.remove();w.querySelector('[data-close]').onclick=close;w.onclick=e=>e.target===w&&close();return w}
async function openUsers(){
 const {data:{session}}=await sb.auth.getSession();if(!session?.user)return toast('Connexion administrateur requise.');
 const {data:profile}=await sb.from('profiles').select('role').eq('id',session.user.id).single();if(profile?.role!=='admin')return toast('Accès administrateur requis.');
 const {data:users,error}=await sb.from('profiles').select('id,display_name,email,role').order('display_name');if(error)return toast(error.message);
 const rows=(users||[]).map(u=>`<tr><td><strong>${esc(u.display_name||'—')}</strong><div class="v19-meta">${esc(u.email||'—')}</div></td><td>${esc(roles[u.role]||u.role||'Public')}</td><td><button type="button" class="v19-btn small secondary" data-reset="${esc(u.email||'')}">Réinitialiser le mot de passe</button></td></tr>`).join('');
 const roleOptions=Object.entries(roles).map(([v,l])=>`<option value="${v}">${esc(l)}</option>`).join('');
 const w=modal('Utilisateurs & accès',`<form id="v20-invite" class="v19-form"><label><span>Nom affiché</span><input required name="displayName" autocomplete="name"></label><label><span>Adresse e-mail</span><input required type="email" name="email" autocomplete="email"></label><label class="full"><span>Rôle</span><select name="role">${roleOptions}</select></label><div class="full v19-modal-actions"><button class="v19-btn" type="submit">Inviter l’utilisateur</button></div></form><div class="v19-section-head"><div><h2>Comptes existants</h2><p>${users?.length||0} compte(s)</p></div></div><div class="v19-table-wrap"><table class="v19-table"><thead><tr><th>Utilisateur</th><th>Rôle</th><th>Accès</th></tr></thead><tbody>${rows}</tbody></table></div>`);
 w.querySelector('#v20-invite').onsubmit=invite;
 w.querySelectorAll('[data-reset]').forEach(b=>b.onclick=()=>reset(b.dataset.reset));
}
async function invite(e){e.preventDefault();const fd=new FormData(e.target);const body={action:'invite',displayName:String(fd.get('displayName')||''),email:String(fd.get('email')||''),role:String(fd.get('role')||''),redirectTo:location.href};const {error,data}=await sb.functions.invoke('admin-users',{body});if(error||data?.error)return toast(data?.error||error.message);toast('Invitation envoyée');setTimeout(openUsers,300)}
async function reset(email){if(!email)return;const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.href});if(error)toast(error.message);else toast('E-mail de réinitialisation envoyé')}
function inject(){if(sessionStorage.getItem('bs-v20-verified-role')!=='admin')return;const grid=document.querySelector('.v19-admin-cards');if(!grid||grid.querySelector('[data-v20-users]'))return;const b=document.createElement('button');b.className='v19-card v19-admin-action';b.dataset.v20Users='1';b.innerHTML='<div><h3>Utilisateurs & accès</h3><p>Inviter les éducateurs et enseignants, attribuer les rôles et réinitialiser les accès.</p></div>';b.onclick=openUsers;grid.appendChild(b)}
new MutationObserver(inject).observe(document.body,{childList:true,subtree:true});inject();
})();
