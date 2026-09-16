(() => {
'use strict';
const cfg=window.APP_CONFIG||{};
const STORE='bs-app-data-v4',ROLE_KEY='bs-demo-role-v4',VERIFIED='bs-v20-verified-role',SENT_ORDERS='bs-v20-sent-orders',PASSWORD_SETUP='bs-v20-password-setup';
const roleLabels={public:'Élèves / Parents',educator_escalade:'Option Escalade',educator_football:'Section Football',educator_gymnastique:'Sport-études Gymnastique',teacher_as:'Association Sportive',admin:'Administrateur'};
const hasSupabase=!!(cfg.supabaseUrl&&cfg.supabaseAnonKey&&window.supabase);
const hashParams=new URLSearchParams((location.hash||'').replace(/^#/,''));
const queryParams=new URLSearchParams(location.search||'');
const authFlowType=hashParams.get('type')||queryParams.get('type')||'';
const incomingPasswordFlow=['invite','recovery'].includes(authFlowType)||queryParams.has('code');
if(incomingPasswordFlow)sessionStorage.setItem(PASSWORD_SETUP,'1');
const passwordSetupFlow=()=>sessionStorage.getItem(PASSWORD_SETUP)==='1';
const appRedirect=()=>location.origin+location.pathname;
const sb=hasSupabase?(window.__BS_SUPABASE_CLIENT||window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey)):null;
if(sb)window.__BS_SUPABASE_CLIENT=sb;
let currentUser=null,currentRole='public',term=1,syncTimer=null,hydrating=false;

const camel=o=>Object.fromEntries(Object.entries(o||{}).map(([k,v])=>[k.replace(/_([a-z])/g,(_,c)=>c.toUpperCase()),v]));
const snake=o=>Object.fromEntries(Object.entries(o||{}).map(([k,v])=>[k.replace(/[A-Z]/g,m=>'_'+m.toLowerCase()),v]));
const safeJson=(s,f)=>{try{const value=JSON.parse(s);return value&&typeof value==='object'?value:f}catch{return f}};
const emptyData=()=>({events:[],documents:[],products:[],students:[],appreciations:[],licenses:[],convocations:[],reports:[],orders:[],eventRegistrations:[],specialtyNotes:{},termSettings:{}});
const uid=(p='x')=>p+Math.random().toString(36).slice(2,10);
const toast=msg=>{const el=document.createElement('div');el.className='v19-toast';el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),3200)};
function clearPrivateCache(){const data=safeJson(localStorage.getItem(STORE),{});data.students=[];data.licenses=[];data.appreciations=[];data.reports=[];data.eventRegistrations=[];data.convocations=(data.convocations||[]).map(({studentIds,...convocation})=>convocation);localStorage.setItem(STORE,JSON.stringify(data))}

function modal(title,body){
 document.getElementById('v20-modal')?.remove();
 const w=document.createElement('div');w.id='v20-modal';w.className='v19-modal-backdrop';w.setAttribute('role','presentation');
 w.innerHTML=`<div class="v19-modal" role="dialog" aria-modal="true" aria-labelledby="v20-modal-title"><div class="v19-modal-head"><h2 id="v20-modal-title">${title}</h2><button class="v19-icon-btn" type="button" aria-label="Fermer" data-close>×</button></div><div class="v19-modal-body">${body}</div></div>`;
 document.body.appendChild(w);const close=()=>w.remove();w.querySelector('[data-close]').onclick=close;w.addEventListener('click',e=>e.target===w&&close());
 const onKey=e=>{if(e.key==='Escape'){close();document.removeEventListener('keydown',onKey)}};document.addEventListener('keydown',onKey);
 setTimeout(()=>w.querySelector('input,button,select,textarea')?.focus(),20);return w;
}

function loginModal(){
 if(!hasSupabase){return modal('Espace sécurisé',`<div class="v19-empty"><strong>Connexion non activée.</strong><br><br>L’application publique reste disponible, mais les espaces éducateurs et administrateur sont verrouillés tant que Supabase n’est pas configuré.</div>`)}
 return modal('Connexion',`<form id="v20-login" class="v19-form"><label class="full"><span>Adresse e-mail</span><input required type="email" name="email" autocomplete="username"></label><label class="full"><span>Mot de passe</span><input required type="password" name="password" autocomplete="current-password"></label><div class="full v19-modal-actions"><button type="button" class="v19-btn secondary" id="v20-forgot">Mot de passe oublié</button><button class="v19-btn" type="submit">Se connecter</button></div></form>`);
}
function passwordModal(){
 if(!currentUser)return loginModal();
 return modal('Définir mon mot de passe',`<form id="v20-set-password" class="v19-form"><div class="full v19-card"><strong>${currentUser.email||'Compte sécurisé'}</strong><div class="v19-meta">Utilisez au moins 12 caractères avec majuscule, minuscule, chiffre et symbole. La double authentification protège en plus le compte administrateur.</div></div><label class="full"><span>Nouveau mot de passe</span><input required minlength="12" type="password" name="password" autocomplete="new-password"></label><label class="full"><span>Confirmer le mot de passe</span><input required minlength="12" type="password" name="confirm" autocomplete="new-password"></label><div class="full v19-modal-actions"><button class="v19-btn" type="submit">Enregistrer mon mot de passe</button></div></form>`);
}
function profileModal(){
 if(!currentUser)return loginModal();
 const w=modal('Mon espace',`<div class="v19-stack"><div class="v19-card"><strong>${currentUser.email||''}</strong><div class="v19-meta">${roleLabels[currentRole]||currentRole}</div></div><button class="v19-btn secondary" id="v20-change-password">Définir / modifier mon mot de passe</button><button class="v19-btn" id="v20-logout">Se déconnecter</button></div>`);
 w.querySelector('#v20-logout').onclick=logout;w.querySelector('#v20-change-password').onclick=passwordModal;return w;
}
async function logout(){await sb?.auth.signOut();sessionStorage.removeItem(VERIFIED);sessionStorage.removeItem(PASSWORD_SETUP);sessionStorage.removeItem('bs-auth-method');clearPrivateCache();localStorage.setItem(ROLE_KEY,'public');currentUser=null;currentRole='public';location.reload()}

async function authenticateSession(){
 if(!hasSupabase){sessionStorage.removeItem(VERIFIED);localStorage.setItem(ROLE_KEY,'public');return}
 sb.auth.onAuthStateChange(async(evt,session)=>{
  if(evt==='SIGNED_OUT'||!session?.user){sessionStorage.removeItem(VERIFIED);clearPrivateCache();localStorage.setItem(ROLE_KEY,'public');currentUser=null;currentRole='public';location.reload();return}
  if(evt==='PASSWORD_RECOVERY'){sessionStorage.setItem(PASSWORD_SETUP,'1');await hydrateUser(session.user,false,true);setTimeout(passwordModal,60);return}
  if(['SIGNED_IN','USER_UPDATED'].includes(evt)){await hydrateUser(session.user,false,true);if(passwordSetupFlow())setTimeout(passwordModal,60)}
 });
 const {data:{session}}=await sb.auth.getSession();
 if(!session?.user){sessionStorage.removeItem(VERIFIED);localStorage.setItem(ROLE_KEY,'public');await hydratePublic();return}
 await hydrateUser(session.user,false,true);
 if(passwordSetupFlow())setTimeout(passwordModal,80);
}
async function hydrateUser(user,forceReload=false,suppressReload=false){
 const {data:profile,error}=await sb.from('profiles').select('display_name,email,role').eq('id',user.id).single();
 if(error){toast('Profil utilisateur inaccessible');return}
 currentUser={id:user.id,email:profile.email||user.email,name:profile.display_name||user.email};currentRole=profile.role||'public';
 sessionStorage.setItem(VERIFIED,currentRole);localStorage.setItem(ROLE_KEY,currentRole);
 const authMethod=sessionStorage.getItem('bs-auth-method')||'email';
 if(currentRole==='admin'&&authMethod!=='pin'&&sb?.auth?.mfa){
  const {data:aal,error:aalError}=await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if(aalError){clearPrivateCache();window.dispatchEvent(new CustomEvent('bs-admin-mfa-error',{detail:{message:aalError.message||'Vérification MFA impossible'}}));return}
  if(aal?.currentLevel!=='aal2'){clearPrivateCache();window.dispatchEvent(new CustomEvent('bs-admin-mfa-required',{detail:aal||{}}));return}
 }
 await hydrateAll();
 const marker='bs-v20-role-applied';
 if(!suppressReload&&(forceReload||sessionStorage.getItem(marker)!==currentRole)){sessionStorage.setItem(marker,currentRole);location.reload()}
 else sessionStorage.setItem(marker,currentRole);
}
async function hydratePublic(){
 const data={...emptyData(),...safeJson(localStorage.getItem(STORE),{})};hydrating=true;
 data.students=[];data.licenses=[];data.appreciations=[];data.reports=[];data.eventRegistrations=[];data.convocations=(data.convocations||[]).map(({studentIds,...convocation})=>convocation);
 const maps=[['events','v20_events'],['documents','v20_documents'],['products','v20_products'],['convocations','v20_convocations'],['specialtyNotes','v20_specialty_notes']];
 for(const [key,table] of maps){const {data:rows,error}=await sb.from(table).select('*');if(!error&&Array.isArray(rows)){if(key==='specialtyNotes'){data.specialtyNotes={};rows.map(camel).forEach(r=>data.specialtyNotes[r.specialty]={message:r.message||'',expiresAt:r.expiresAt||'',active:!!r.active})}else data[key]=rows.map(camel)}}
 localStorage.setItem(STORE,JSON.stringify(data));hydrating=false;window.app?.hydrateFromServer?.(data,'public');
}
async function hydrateAll(){
 hydrating=true;const data={...emptyData(),...safeJson(localStorage.getItem(STORE),{})};
 const maps=[['events','v20_events'],['documents','v20_documents'],['products','v20_products'],['students','v20_students'],['licenses','v20_licenses'],['convocations','v20_convocations'],['reports','v20_reports'],['orders','v20_orders']];
 if(currentRole==='admin'||currentRole.startsWith('educator_'))maps.push(['appreciations','v20_appreciations']);else data.appreciations=[];
 if(['teacher_as','admin'].includes(currentRole))maps.push(['eventRegistrations','v20_event_registrations']);else data.eventRegistrations=[];
 for(const [key,table] of maps){const {data:rows,error}=await sb.from(table).select('*');if(!error&&Array.isArray(rows))data[key]=rows.map(camel)}
 const {data:links,error:linkErr}=await sb.from('v20_convocation_students').select('*');if(!linkErr&&Array.isArray(links)){const ls=links.map(camel);data.convocations=(data.convocations||[]).map(c=>({...c,studentIds:ls.filter(x=>x.convocationId===c.id).map(x=>x.studentId)}))}
 const {data:notes,error:nErr}=await sb.from('v20_specialty_notes').select('*');if(!nErr){data.specialtyNotes={};(notes||[]).map(camel).forEach(r=>data.specialtyNotes[r.specialty]={message:r.message||'',expiresAt:r.expiresAt||'',active:!!r.active})}
 const {data:terms,error:tErr}=await sb.from('v20_term_settings').select('*');if(!tErr){data.termSettings={};(terms||[]).map(camel).forEach(r=>data.termSettings[r.term]={deadline:r.deadline||'',end:r.termEnd||''})}
 localStorage.setItem(STORE,JSON.stringify(data));hydrating=false;window.app?.hydrateFromServer?.(data,currentRole);
}

function cleanRow(row){const x=snake(row);for(const k of Object.keys(x))if(x[k]==='')x[k]=null;delete x.student_ids;delete x.image;return x}
async function upsertTable(table,rows){if(!rows?.length)return;const {error}=await sb.from(table).upsert(rows.map(cleanRow));if(error)console.warn(table,error.message)}
async function persistEvent(event){
 if(!sb)throw new Error('SERVICE_UNAVAILABLE');
 const {error}=await sb.from('v20_events').upsert(cleanRow({...event,publicVisible:true}));
 if(error)throw error;
 return true;
}
window.__BS_PERSIST_EVENT=persistEvent;

async function persistReport(report){
 if(!sb)throw new Error('SERVICE_UNAVAILABLE');
 const payload=cleanRow({...report,updatedAt:new Date().toISOString()});
 const {data,error}=await sb.from('v20_reports').upsert(payload).select('*').single();
 if(error)throw error;
 return camel(data);
}
window.__BS_PERSIST_REPORT=persistReport;

async function persistConvocation(convocation,eventId=''){
 if(!sb)throw new Error('SERVICE_UNAVAILABLE');
 const studentIds=(convocation.studentIds||[]).map(String),base={...convocation};delete base.studentIds;
 const payload=cleanRow({...base,status:base.status||'published',publicVisible:true,updatedAt:new Date().toISOString()});
 const {data,error}=await sb.from('v20_convocations').upsert(payload).select('*').single();if(error)throw error;
 const {error:deleteLinksError}=await sb.from('v20_convocation_students').delete().eq('convocation_id',String(convocation.id));if(deleteLinksError)throw deleteLinksError;
 if(studentIds.length){
  const {error:linksError}=await sb.from('v20_convocation_students').insert(studentIds.map(studentId=>({convocation_id:String(convocation.id),student_id:studentId})));if(linksError)throw linksError;
 }
 const {error:unlinkError}=await sb.from('v20_events').update({convocation_id:null}).eq('convocation_id',String(convocation.id));if(unlinkError)throw unlinkError;
 if(eventId){
  const {error:eventError}=await sb.from('v20_events').update({convocation_id:String(convocation.id),registration_open:false}).eq('id',String(eventId));if(eventError)throw eventError;
 }
 return {...camel(data),studentIds};
}
window.__BS_PERSIST_CONVOCATION=persistConvocation;

async function persistAppreciation(appreciation){
 if(!sb||!currentUser)throw new Error('SERVICE_UNAVAILABLE');
 const payload=cleanRow({...appreciation,educatorId:appreciation.educatorId||currentUser.id,updatedAt:new Date().toISOString()});
 const {data,error}=await sb.from('v20_appreciations').upsert(payload).select('*').single();if(error)throw error;
 return camel(data);
}
window.__BS_PERSIST_APPRECIATION=persistAppreciation;

async function persistSpecialtyNote(specialty,note){
 if(!sb)throw new Error('SERVICE_UNAVAILABLE');
 const payload={specialty,message:note.message||null,expires_at:note.expiresAt||null,active:!!note.active,public_visible:true,updated_at:new Date().toISOString()};
 const {data,error}=await sb.from('v20_specialty_notes').upsert(payload).select('*').single();if(error)throw error;
 return camel(data);
}
window.__BS_PERSIST_SPECIALTY_NOTE=persistSpecialtyNote;

async function persistTerms(settings){
 if(!sb)throw new Error('SERVICE_UNAVAILABLE');
 const rows=Object.entries(settings||{}).map(([t,v])=>({term:Number(t),deadline:v.deadline||null,term_end:v.end||null,updated_at:new Date().toISOString()}));
 const {data,error}=await sb.from('v20_term_settings').upsert(rows).select('*');if(error)throw error;
 return (data||[]).map(camel);
}
window.__BS_PERSIST_TERMS=persistTerms;

let lastServerRefresh=0;
async function refreshFromServer(){
 if(!currentUser||hydrating)return false;
 await hydrateAll();lastServerRefresh=Date.now();return true;
}
window.__BS_REFRESH_DATA=refreshFromServer;
window.addEventListener('focus',()=>{if(currentUser&&Date.now()-lastServerRefresh>15000)refreshFromServer().catch(()=>{})});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&currentUser&&Date.now()-lastServerRefresh>15000)refreshFromServer().catch(()=>{})});

async function syncSnapshot(){
 if(!hasSupabase||hydrating)return;
 const data=safeJson(localStorage.getItem(STORE),{});
 // V28 : le cache local n'est plus autoritaire. Les écritures privées sont server-first.
 // Seules les anciennes commandes publiques locales peuvent encore être transmises ici.
 await submitPublicOrders(data.orders||[]);
}
async function submitPublicOrders(orders){
 if(!hasSupabase||!orders.length)return;const sent=new Set(safeJson(localStorage.getItem(SENT_ORDERS),'[]'));
 for(const o of orders){if(sent.has(o.id))continue;const payload=snake({...o,id:o.id||uid('o'),createdAt:o.createdAt||new Date().toISOString()});const {error}=await sb.from('v20_orders').insert(payload);if(!error){sent.add(o.id);localStorage.setItem(SENT_ORDERS,JSON.stringify([...sent]))}}
}

function installStorageSync(){
 // V28 : aucune synchronisation en masse depuis localStorage.
 // Cela évite qu'un appareil resté ouvert écrase les données plus récentes d'un autre utilisateur.
}
function loadScript(src,key){return new Promise((resolve,reject)=>{if(window[key])return resolve();const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}
function wrapLazyDependencies(){
 if(!window.app)return;
 const xlsx=()=>loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js','XLSX');
 const excel=()=>loadScript('https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js','ExcelJS');
 const pdf=()=>loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js','jspdf');
 for(const name of ['openLicenseImport']){const orig=window.app[name];if(orig)window.app[name]=async(...a)=>{await xlsx();return orig(...a)}}
 for(const name of ['downloadLicenseTemplate','exportExcel','exportRegistrationsExcel']){const orig=window.app[name];if(orig)window.app[name]=async(...a)=>{await excel();return orig(...a)}}
 for(const name of ['exportConvocation','exportCalendarPDF']){const orig=window.app[name];if(orig)window.app[name]=async(...a)=>{await pdf();return orig(...a)}}
}
function overrideSecurityUI(){
 if(!window.app)return;
 window.app.profile=profileModal;window.app.setRole=()=>toast('Le changement de rôle est protégé par la connexion.');
 const origSetTerm=window.app.setTerm;if(origSetTerm)window.app.setTerm=t=>{term=Number(t)||1;return origSetTerm(t)};
 const origValidate=window.app.validateApp;
 const canWriteAppreciation=studentId=>{
  if(!currentRole.startsWith('educator_'))return false;
  const d0=window.app.readData(),lic=(d0.licenses||[]).find(x=>String(x.studentId)===String(studentId));const allowed=['Section Football','Option Escalade','Sport-études Gymnastique'];const roleSpecialty={educator_football:'Section Football',educator_escalade:'Option Escalade',educator_gymnastique:'Sport-études Gymnastique'}[currentRole]||null;
  return !!lic&&allowed.includes(lic.sectionOption)&&(!roleSpecialty||lic.sectionOption===roleSpecialty);
 };
 const saveAppreciationServer=async(studentId,status)=>{
  if(!canWriteAppreciation(studentId))return;
  const text=String(document.querySelector('#v19-app-text')?.value||'').trim();if(status==='validated'&&!text)return alert('Saisissez une appréciation.');
  const d=window.app.readData();let a=(d.appreciations||[]).find(x=>String(x.studentId)===String(studentId)&&Number(x.term||1)===Number(term));
  const row={id:a?.id||uid('a'),studentId,term:Number(term)||1,text,status,educatorId:a?.educatorId||currentUser?.id||null};
  try{const saved=await persistAppreciation(row);if(a)Object.assign(a,row,saved);else d.appreciations.push({...row,...saved});localStorage.setItem(STORE,JSON.stringify(d));window.app.closeModal?.();window.app.go?.('appreciations');toast(status==='validated'?'Appréciation enregistrée dans la base centrale.':'Brouillon enregistré dans la base centrale.')}
  catch(error){console.error('Appréciation serveur',error);toast('Appréciation non enregistrée : vérifiez votre connexion puis réessayez.',4800)}
 };
 window.app.saveAppDraft=studentId=>saveAppreciationServer(studentId,'draft');
 window.app.validateApp=async studentId=>{
  if(!canWriteAppreciation(studentId))return;
  if(cfg.enableExternalGrammar===true&&origValidate)return origValidate(studentId);
  return saveAppreciationServer(studentId,'validated');
 };
}
function enhanceA11y(root=document){
 root.querySelectorAll('img:not([alt])').forEach(img=>img.alt=img.closest('.v19-brand')?'Logo Association Sportive du Bon Sauveur':'Illustration');
 root.querySelectorAll('.v19-avatar').forEach(b=>b.setAttribute('aria-label',currentUser?'Ouvrir mon profil':'Ouvrir la connexion'));
 root.querySelectorAll('.v19-bottom-nav').forEach(n=>n.setAttribute('aria-label','Navigation principale'));
 root.querySelectorAll('.v19-modal').forEach(m=>{m.setAttribute('role','dialog');m.setAttribute('aria-modal','true')});
 root.querySelectorAll('.v19-modal-head .v19-icon-btn').forEach(b=>b.setAttribute('aria-label','Fermer'));
 root.querySelectorAll('.v19-product img').forEach(img=>{img.loading='lazy';img.decoding='async'});
}
function observeA11y(){enhanceA11y();window.addEventListener('bs-app-rendered',()=>requestAnimationFrame(()=>enhanceA11y()))}

async function init(){
 installStorageSync();wrapLazyDependencies();overrideSecurityUI();observeA11y();
 document.addEventListener('submit',async e=>{
  if(e.target?.id==='v20-login'){
   e.preventDefault();const fd=new FormData(e.target);const {error}=await sb.auth.signInWithPassword({email:String(fd.get('email')),password:String(fd.get('password'))});if(error)toast('Connexion impossible : '+error.message);else{document.getElementById('v20-modal')?.remove();toast('Connexion réussie')};return
  }
  if(e.target?.id==='v20-set-password'){
   e.preventDefault();const fd=new FormData(e.target);const password=String(fd.get('password')||''),confirm=String(fd.get('confirm')||'');
   if(password.length<12)return toast('Utilisez au moins 12 caractères.');
   if(!/[a-z]/.test(password)||!/[A-Z]/.test(password)||!/[0-9]/.test(password)||!(/[^A-Za-z0-9]/.test(password)))return toast('Ajoutez une majuscule, une minuscule, un chiffre et un symbole.');
   if(password!==confirm)return toast('Les deux mots de passe sont différents.');
   const submit=e.target.querySelector('button[type=submit]');if(submit){submit.disabled=true;submit.textContent='Enregistrement…'}
   const {error}=await sb.auth.updateUser({password});
   if(error){if(submit){submit.disabled=false;submit.textContent='Enregistrer mon mot de passe'}return toast('Impossible d’enregistrer le mot de passe : '+error.message)}
   sessionStorage.removeItem(PASSWORD_SETUP);history.replaceState({},'',appRedirect());document.getElementById('v20-modal')?.remove();toast('Mot de passe enregistré avec succès.');return
  }
 });
 document.addEventListener('click',async e=>{if(e.target?.id!=='v20-forgot')return;const email=String(document.querySelector('#v20-login [name=email]')?.value||'').trim();if(!email)return toast('Saisissez votre adresse e-mail.');const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:appRedirect()});if(error)toast(error.message);else toast('E-mail de réinitialisation envoyé')});
 await authenticateSession();
}
init().catch(e=>console.error('V20 bridge',e));
})();
