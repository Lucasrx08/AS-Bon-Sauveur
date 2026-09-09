(() => {
'use strict';
const cfg=window.APP_CONFIG||{};
const STORE='bs-app-data-v4',ROLE_KEY='bs-demo-role-v4',VERIFIED='bs-v20-verified-role',SENT_ORDERS='bs-v20-sent-orders';
const roleLabels={public:'Élèves / Parents',educator_escalade:'Option Escalade',educator_football:'Section Football',educator_gymnastique:'Sport-études Gymnastique',teacher_as:'Association Sportive',admin:'Administrateur'};
const hasSupabase=!!(cfg.supabaseUrl&&cfg.supabaseAnonKey&&window.supabase);
const sb=hasSupabase?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey):null;
let currentUser=null,currentRole='public',term=1,syncTimer=null,hydrating=false;

const camel=o=>Object.fromEntries(Object.entries(o||{}).map(([k,v])=>[k.replace(/_([a-z])/g,(_,c)=>c.toUpperCase()),v]));
const snake=o=>Object.fromEntries(Object.entries(o||{}).map(([k,v])=>[k.replace(/[A-Z]/g,m=>'_'+m.toLowerCase()),v]));
const safeJson=(s,f)=>{try{return JSON.parse(s)}catch{return f}};
const uid=(p='x')=>p+Math.random().toString(36).slice(2,10);
const toast=msg=>{const el=document.createElement('div');el.className='v19-toast';el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),2600)};

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
function profileModal(){
 if(!currentUser)return loginModal();
 const w=modal('Mon espace',`<div class="v19-stack"><div class="v19-card"><strong>${currentUser.email||''}</strong><div class="v19-meta">${roleLabels[currentRole]||currentRole}</div></div><button class="v19-btn secondary" id="v20-reset">Réinitialiser mon mot de passe</button><button class="v19-btn" id="v20-logout">Se déconnecter</button></div>`);
 w.querySelector('#v20-logout').onclick=logout;w.querySelector('#v20-reset').onclick=resetOwnPassword;return w;
}
async function resetOwnPassword(){if(!currentUser?.email)return;const {error}=await sb.auth.resetPasswordForEmail(currentUser.email,{redirectTo:location.href});if(error)toast(error.message);else{document.getElementById('v20-modal')?.remove();toast('E-mail de réinitialisation envoyé')}}
async function logout(){await sb?.auth.signOut();sessionStorage.removeItem(VERIFIED);localStorage.setItem(ROLE_KEY,'public');currentUser=null;currentRole='public';location.reload()}

async function authenticateSession(){
 if(!hasSupabase){sessionStorage.removeItem(VERIFIED);localStorage.setItem(ROLE_KEY,'public');return}
 const {data:{session}}=await sb.auth.getSession();
 if(!session?.user){sessionStorage.removeItem(VERIFIED);localStorage.setItem(ROLE_KEY,'public');await hydratePublic();return}
 await hydrateUser(session.user);
 sb.auth.onAuthStateChange(async(evt,session)=>{if(evt==='SIGNED_OUT'||!session?.user){sessionStorage.removeItem(VERIFIED);localStorage.setItem(ROLE_KEY,'public');currentUser=null;currentRole='public';location.reload()}else if(['SIGNED_IN','USER_UPDATED','PASSWORD_RECOVERY'].includes(evt)){await hydrateUser(session.user,true)}});
}
async function hydrateUser(user,forceReload=false){
 const {data:profile,error}=await sb.from('profiles').select('display_name,email,role').eq('id',user.id).single();
 if(error){toast('Profil utilisateur inaccessible');return}
 currentUser={id:user.id,email:profile.email||user.email,name:profile.display_name||user.email};currentRole=profile.role||'public';
 sessionStorage.setItem(VERIFIED,currentRole);localStorage.setItem(ROLE_KEY,currentRole);
 await hydrateAll();
 const marker='bs-v20-role-applied';if(forceReload||sessionStorage.getItem(marker)!==currentRole){sessionStorage.setItem(marker,currentRole);location.reload()}
}
async function hydratePublic(){
 const data=safeJson(localStorage.getItem(STORE),{});hydrating=true;
 const maps=[['events','v20_events'],['documents','v20_documents'],['products','v20_products'],['convocations','v20_convocations'],['specialtyNotes','v20_specialty_notes']];
 for(const [key,table] of maps){const {data:rows,error}=await sb.from(table).select('*');if(!error&&Array.isArray(rows)){if(key==='specialtyNotes'){data.specialtyNotes={};rows.map(camel).forEach(r=>data.specialtyNotes[r.specialty]={message:r.message||'',expiresAt:r.expiresAt||'',active:!!r.active})}else data[key]=rows.map(camel)}}
 localStorage.setItem(STORE,JSON.stringify(data));hydrating=false;
}
async function hydrateAll(){
 hydrating=true;const data=safeJson(localStorage.getItem(STORE),{});
 const maps=[['events','v20_events'],['documents','v20_documents'],['products','v20_products'],['students','v20_students'],['appreciations','v20_appreciations'],['licenses','v20_licenses'],['convocations','v20_convocations'],['reports','v20_reports'],['orders','v20_orders']];
 for(const [key,table] of maps){const {data:rows,error}=await sb.from(table).select('*');if(!error&&Array.isArray(rows))data[key]=rows.map(camel)}
 const {data:links,error:linkErr}=await sb.from('v20_convocation_students').select('*');if(!linkErr&&Array.isArray(links)){const ls=links.map(camel);data.convocations=(data.convocations||[]).map(c=>({...c,studentIds:ls.filter(x=>x.convocationId===c.id).map(x=>x.studentId)}))}
 const {data:notes,error:nErr}=await sb.from('v20_specialty_notes').select('*');if(!nErr){data.specialtyNotes={};(notes||[]).map(camel).forEach(r=>data.specialtyNotes[r.specialty]={message:r.message||'',expiresAt:r.expiresAt||'',active:!!r.active})}
 const {data:terms,error:tErr}=await sb.from('v20_term_settings').select('*');if(!tErr){data.termSettings={};(terms||[]).map(camel).forEach(r=>data.termSettings[r.term]={deadline:r.deadline||'',end:r.termEnd||''})}
 localStorage.setItem(STORE,JSON.stringify(data));hydrating=false;
}

async function upsertTable(table,rows){if(!rows?.length)return;const cleaned=rows.map(r=>{const x=snake(r);for(const k of Object.keys(x))if(x[k]==='')x[k]=null;delete x.student_ids;delete x.image;return x});const {error}=await sb.from(table).upsert(cleaned);if(error)console.warn(table,error.message)}
async function syncSnapshot(){
 if(!hasSupabase||hydrating)return;const data=safeJson(localStorage.getItem(STORE),{});
 await submitPublicOrders(data.orders||[]);
 if(!currentUser)return;
 if(['teacher_as','admin'].includes(currentRole)){
  await upsertTable('v20_events',(data.events||[]).map(x=>({...x,publicVisible:true})));
  await upsertTable('v20_documents',(data.documents||[]).map(x=>({...x,publicVisible:true})));
  await upsertTable('v20_products',data.products||[]);
  await upsertTable('v20_students',data.students||[]);
  await upsertTable('v20_licenses',data.licenses||[]);
  await upsertTable('v20_convocations',(data.convocations||[]).map(({studentIds,...x})=>({...x,publicVisible:true,status:x.status||'published'})));
  await upsertTable('v20_reports',data.reports||[]);
  await upsertTable('v20_orders',data.orders||[]);
  const links=(data.convocations||[]).flatMap(c=>(c.studentIds||[]).map(studentId=>({convocation_id:c.id,student_id:studentId})));
  const {error:delErr}=await sb.from('v20_convocation_students').delete().neq('convocation_id','__never__');if(!delErr&&links.length)await sb.from('v20_convocation_students').insert(links);
  const notes=Object.entries(data.specialtyNotes||{}).map(([specialty,n])=>({specialty,message:n.message||'',expires_at:n.expiresAt||null,active:!!n.active,public_visible:true}));if(notes.length)await sb.from('v20_specialty_notes').upsert(notes);
  const terms=Object.entries(data.termSettings||{}).map(([t,v])=>({term:Number(t),deadline:v.deadline||null,term_end:v.end||null}));if(currentRole==='admin'&&terms.length)await sb.from('v20_term_settings').upsert(terms);
 }
 if(currentRole.startsWith('educator_')||['teacher_as','admin'].includes(currentRole)){
  const apps=(data.appreciations||[]).map(a=>({...a,educatorId:a.educatorId||currentUser.id,term:a.term||term}));await upsertTable('v20_appreciations',apps)
 }
}
async function submitPublicOrders(orders){
 if(!hasSupabase||!orders.length)return;const sent=new Set(safeJson(localStorage.getItem(SENT_ORDERS),'[]'));
 for(const o of orders){if(sent.has(o.id))continue;const payload=snake({...o,id:o.id||uid('o'),createdAt:o.createdAt||new Date().toISOString()});const {error}=await sb.from('v20_orders').insert(payload);if(!error){sent.add(o.id);localStorage.setItem(SENT_ORDERS,JSON.stringify([...sent]))}}
}

function installStorageSync(){
 const native=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){native.call(this,k,v);if(this===localStorage&&k===STORE&&!hydrating){clearTimeout(syncTimer);syncTimer=setTimeout(syncSnapshot,500)}};
}
function loadScript(src,key){return new Promise((resolve,reject)=>{if(window[key])return resolve();const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}
function wrapLazyDependencies(){
 if(!window.app)return;
 const xlsx=()=>loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js','XLSX');
 const excel=()=>loadScript('https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js','ExcelJS');
 const pdf=()=>loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js','jspdf');
 for(const name of ['openLicenseImport']){const orig=window.app[name];if(orig)window.app[name]=async(...a)=>{await xlsx();return orig(...a)}}
 for(const name of ['downloadLicenseTemplate','exportExcel']){const orig=window.app[name];if(orig)window.app[name]=async(...a)=>{await excel();return orig(...a)}}
 for(const name of ['exportConvocation','exportCalendarPDF']){const orig=window.app[name];if(orig)window.app[name]=async(...a)=>{await pdf();return orig(...a)}}
}
function overrideSecurityUI(){
 if(!window.app)return;
 window.app.profile=profileModal;window.app.setRole=()=>toast('Le changement de rôle est protégé par la connexion.');
 const origSetTerm=window.app.setTerm;if(origSetTerm)window.app.setTerm=t=>{term=Number(t)||1;return origSetTerm(t)};
 const origValidate=window.app.validateApp;
 window.app.validateApp=async studentId=>{
  if(cfg.enableExternalGrammar===true&&origValidate)return origValidate(studentId);
  const text=String(document.querySelector('#v19-app-text')?.value||'').trim();if(!text)return alert('Saisissez une appréciation.');
  const d=window.app.readData();let a=(d.appreciations||[]).find(x=>x.studentId===studentId&&Number(x.term||1)===term);if(a){a.text=text;a.status='validated';a.term=term;a.educatorId=a.educatorId||currentUser?.id}else{d.appreciations.push({id:uid('a'),studentId,term,text,status:'validated',educatorId:currentUser?.id||null})}
  localStorage.setItem(STORE,JSON.stringify(d));window.app.closeModal?.();toast('Appréciation validée. La correction externe est désactivée par défaut.');location.reload();
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
function observeA11y(){enhanceA11y();new MutationObserver(()=>enhanceA11y()).observe(document.body,{childList:true,subtree:true})}

async function init(){
 installStorageSync();wrapLazyDependencies();overrideSecurityUI();observeA11y();
 document.addEventListener('submit',async e=>{if(e.target?.id!=='v20-login')return;e.preventDefault();const fd=new FormData(e.target);const {error}=await sb.auth.signInWithPassword({email:String(fd.get('email')),password:String(fd.get('password'))});if(error)toast('Connexion impossible : '+error.message);else{document.getElementById('v20-modal')?.remove();toast('Connexion réussie')}});
 document.addEventListener('click',async e=>{if(e.target?.id!=='v20-forgot')return;const email=String(document.querySelector('#v20-login [name=email]')?.value||'').trim();if(!email)return toast('Saisissez votre adresse e-mail.');const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.href});if(error)toast(error.message);else toast('E-mail de réinitialisation envoyé')});
 await authenticateSession();
}
init().catch(e=>console.error('V20 bridge',e));
})();
