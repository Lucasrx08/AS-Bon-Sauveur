(() => {
'use strict';
if(!window.app)return;
const cfg=window.APP_CONFIG||{};
const V=window.__BS_V22||{};
const sb=V.sb||window.__BS_SUPABASE_CLIENT||null;
const STORE=V.STORE||'bs-app-data-v4';
const ROLE_KEY=V.ROLE_KEY||'bs-demo-role-v4';
const VERIFIED=V.VERIFIED||'bs-v20-verified-role';
const APP_REDIRECT='https://lucasrx08.github.io/AS-Bon-Sauveur/';
const ROLE_LABELS={public:'Espace public',educator_football:'Section Football',educator_gymnastique:'Sport-études Gymnastique',educator_escalade:'Option Escalade',teacher_as:'Association Sportive',admin:'Administrateur'};
const ROLE_BRAND={public:['assets/logo-as.png','ASSOCIATION SPORTIVE\nDU BON SAUVEUR','P'],teacher_as:['assets/logo-as.png','ASSOCIATION SPORTIVE\nDU BON SAUVEUR','AS'],admin:['assets/logo-as.png','ASSOCIATION SPORTIVE\nDU BON SAUVEUR','A'],educator_football:['assets/logo-football.png','SECTION FOOTBALL','F'],educator_gymnastique:['assets/logo-gymnastique.png','SPORT-ÉTUDES\nGYMNASTIQUE','G'],educator_escalade:['assets/logo-escalade.png','OPTION ESCALADE','E']};
const POLES=[['Association','Association Sportive','Activités, compétitions et rendez-vous AS.','assets/logo-as.png','Association Sportive','as'],['Section','Section Football','Entraînements, rencontres et convocations.','assets/logo-football.png','Section Football','football'],['Sport-études','Gymnastique','Planning, entraînements et informations.','assets/logo-gymnastique.png','Sport-études Gymnastique','gym'],['Option','Escalade','Séances, sorties et convocations.','assets/logo-escalade.png','Option Escalade','escalade']];
const SPECIALTIES=['Association Sportive','Section Football','Option Escalade','Sport-études Gymnastique'];
const SIZES=['7/8 ans','9/11 ans','12/13 ans','XS','S','M','L','XL','XXL','XXXL','XXXXL'];
const PAYMENTS=['Espèces','Virement','Chèque'];
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clone=x=>JSON.parse(JSON.stringify(x||{}));
const safe=(s,f)=>{try{return JSON.parse(s)}catch{return f}};
const uid=p=>p+Math.random().toString(36).slice(2,10);
const wait=(p,ms)=>Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms))]);
const base={go:app.go,setRole:app.setRole,search:app.search,setTerm:app.setTerm,order:app.order,validateApp:app.validateApp,profile:app.profile};
let currentRole=localStorage.getItem(ROLE_KEY)||'public',currentUser=null,currentTerm=1,pendingProductId=null,authApplying=null;
let syncBusy=false,syncTimer=null,suppressSync=false;
const nativeSet=Storage.prototype.setItem;
let confirmedSnapshot=clone(app.readData()),latestSnapshot=clone(app.readData());

function toast(msg,type='info'){
 const el=document.createElement('div');el.className=`v19-toast v22-toast-${type}`;el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),3400);
}
function modal(title,body,{wide=false,id='v22-modal'}={}){
 document.getElementById(id)?.remove();
 const w=document.createElement('div');w.id=id;w.className='v19-modal-backdrop';
 w.innerHTML=`<div class="v19-modal ${wide?'wide':''}" role="dialog" aria-modal="true" aria-labelledby="${id}-title"><div class="v19-modal-head"><h2 id="${id}-title">${esc(title)}</h2><button type="button" class="v19-icon-btn" data-close aria-label="Fermer">×</button></div><div class="v19-modal-body">${body}</div></div>`;
 document.body.appendChild(w);const close=()=>w.remove();w.querySelector('[data-close]').onclick=close;w.onclick=e=>e.target===w&&close();return w;
}
function persistSilently(data){
 suppressSync=true;nativeSet.call(localStorage,STORE,JSON.stringify(data));confirmedSnapshot=clone(data);latestSnapshot=clone(data);suppressSync=false;
}
function replaceData(data){
 const target=app.readData();Object.keys(target).forEach(k=>delete target[k]);Object.assign(target,clone(data));persistSilently(target);
}
function fmt(d){return d?new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(d+'T12:00:00')):'—'}
function money(n){return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(Number(n||0))}
function opts(list,current=''){return list.map(x=>`<option value="${esc(x)}" ${x===current?'selected':''}>${esc(x)}</option>`).join('')}

async function hydrate(role){return V.hydrateForRole?V.hydrateForRole(role):clone(app.readData())}
async function profileFor(user){
 if(!sb||!user)return null;
 const out=await wait(sb.from('profiles').select('display_name,email,role').eq('id',user.id).single(),2500);
 if(out.error)throw out.error;return out.data;
}
function cacheRole(user,role){
 currentRole=role;localStorage.setItem(ROLE_KEY,role);document.body.dataset.bsRole=role;
 if(role==='public')sessionStorage.removeItem(VERIFIED);else sessionStorage.setItem(VERIFIED,role);
 if(user?.id)V.saveRole?.(user.id,role);
}
async function applySession(session,{goHome=true,forceHydrate=true}={}){
 if(!session?.user)return handleSignedOut();
 if(authApplying)return authApplying;
 authApplying=(async()=>{
  try{
   const p=await profileFor(session.user);const role=ROLE_LABELS[p?.role]?p.role:'public';
   currentUser={id:session.user.id,email:p?.email||session.user.email||'',name:p?.display_name||session.user.email||''};cacheRole(session.user,role);
   if(forceHydrate){const data=await hydrate(role);replaceData(data)}
   if(app.role?.()!==role)base.setRole(role);else if(goHome)base.go('home');
   scheduleEnhance();return true;
  }catch(e){console.error('V22 session',e);toast('Impossible de charger votre espace.','error');return false}
  finally{authApplying=null}
 })();
 return authApplying;
}
async function handleSignedOut(){
 currentUser=null;cacheRole(null,'public');
 try{const data=await hydrate('public');replaceData(data)}catch{replaceData(V.emptyData?.()||{})}
 if(app.role?.()!=='public')base.setRole('public');else base.go('home');scheduleEnhance();
}

function loginModal(){
 const w=modal('Connexion',`<form id="v22-login" class="v19-form"><label class="full"><span>Adresse e-mail</span><input required type="email" name="email" autocomplete="username"></label><label class="full"><span>Mot de passe</span><input required type="password" name="password" autocomplete="current-password"></label><div class="full v19-modal-actions"><button type="button" class="v19-btn secondary" data-forgot>Mot de passe oublié</button><button class="v19-btn" type="submit">Se connecter</button></div><div class="full v22-form-status" data-status></div></form>`);
 const form=w.querySelector('#v22-login'),btn=form.querySelector('[type=submit]'),status=form.querySelector('[data-status]');
 form.onsubmit=async e=>{
  e.preventDefault();if(btn.disabled)return;const fd=new FormData(form);btn.disabled=true;btn.textContent='Connexion…';status.textContent='Vérification de votre compte…';
  try{const {data,error}=await wait(sb.auth.signInWithPassword({email:String(fd.get('email')||'').trim(),password:String(fd.get('password')||'')}),5000);if(error)throw error;const ok=await applySession(data.session,{goHome:true,forceHydrate:true});if(ok){w.remove();toast('Connexion réussie','success')}}catch(err){status.textContent='Connexion impossible : '+(err?.message||'erreur inconnue');btn.disabled=false;btn.textContent='Se connecter'}
 };
 w.querySelector('[data-forgot]').onclick=async()=>{
  const email=String(form.elements.email.value||'').trim();if(!email)return status.textContent='Saisissez votre adresse e-mail.';
  status.textContent='Envoi du lien…';try{const {error}=await wait(sb.auth.resetPasswordForEmail(email,{redirectTo:APP_REDIRECT}),5000);if(error)throw error;status.textContent='E-mail de réinitialisation envoyé.'}catch(err){status.textContent=err?.message||'Envoi impossible.'}
 };
 return w;
}
function passwordModal(){
 if(!currentUser)return loginModal();
 const w=modal('Définir mon mot de passe',`<form id="v22-password" class="v19-form"><div class="full v19-card"><strong>${esc(currentUser.email)}</strong><div class="v19-meta">Choisissez un mot de passe d’au moins 10 caractères.</div></div><label class="full"><span>Nouveau mot de passe</span><input required minlength="10" type="password" name="password" autocomplete="new-password"></label><label class="full"><span>Confirmer</span><input required minlength="10" type="password" name="confirm" autocomplete="new-password"></label><div class="full v19-modal-actions"><button class="v19-btn" type="submit">Enregistrer</button></div><div class="full v22-form-status" data-status></div></form>`);
 const form=w.querySelector('form'),btn=form.querySelector('[type=submit]'),status=form.querySelector('[data-status]');
 form.onsubmit=async e=>{e.preventDefault();const fd=new FormData(form),a=String(fd.get('password')||''),b=String(fd.get('confirm')||'');if(a.length<10)return status.textContent='Utilisez au moins 10 caractères.';if(a!==b)return status.textContent='Les deux mots de passe sont différents.';btn.disabled=true;btn.textContent='Enregistrement…';try{const {error}=await wait(sb.auth.updateUser({password:a}),6000);if(error)throw error;history.replaceState({},'',location.pathname);window.__BS_PASSWORD_FLOW=false;w.remove();toast('Mot de passe enregistré','success')}catch(err){status.textContent=err?.message||'Enregistrement impossible.';btn.disabled=false;btn.textContent='Enregistrer'}};
 return w;
}
function profileModal(){
 if(!currentUser)return loginModal();
 const w=modal('Mon espace',`<div class="v19-stack"><div class="v19-card"><strong>${esc(currentUser.name||currentUser.email)}</strong><div class="v19-meta">${esc(currentUser.email)} · ${esc(ROLE_LABELS[currentRole]||currentRole)}</div></div><button class="v19-btn secondary" data-password>Définir / modifier mon mot de passe</button><button class="v19-btn" data-logout>Se déconnecter</button></div>`);
 w.querySelector('[data-password]').onclick=passwordModal;w.querySelector('[data-logout]').onclick=async()=>{const b=w.querySelector('[data-logout]');b.disabled=true;b.textContent='Déconnexion…';try{await wait(sb.auth.signOut(),4000)}catch{}w.remove();await handleSignedOut()};return w;
}
app.profile=()=>currentUser?profileModal():loginModal();
app.setRole=()=>toast('Le profil est défini par votre compte sécurisé.');
if(base.setTerm)app.setTerm=t=>{currentTerm=Number(t)||1;return base.setTerm(t)};
if(base.search){let searchTimer=null;app.search=v=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>base.search(v),110)}}
if(base.order)app.order=id=>{pendingProductId=id;return base.order(id)};

function localValidate(studentId){
 const text=String(document.querySelector('#v19-app-text')?.value||'').trim();if(!text)return toast('Saisissez une appréciation.','error');
 const d=app.readData();d.appreciations=d.appreciations||[];let a=d.appreciations.find(x=>x.studentId===studentId&&Number(x.term||1)===currentTerm);
 if(a)Object.assign(a,{text,status:'validated',term:currentTerm,educatorId:a.educatorId||currentUser?.id||null});else d.appreciations.push({id:uid('a'),studentId,term:currentTerm,text,status:'validated',educatorId:currentUser?.id||null});
 localStorage.setItem(STORE,JSON.stringify(d));app.closeModal?.();base.go('appreciations');toast('Appréciation enregistrée','success');
}
app.validateApp=localValidate;

function loadScript(src,key){return new Promise((res,rej)=>{if(window[key])return res();const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s)})}
if(app.openLicenseImport){const f=app.openLicenseImport;app.openLicenseImport=async(...a)=>{await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js','XLSX');return f(...a)}}
for(const n of ['downloadLicenseTemplate','exportExcel'])if(app[n]){const f=app[n];app[n]=async(...a)=>{await loadScript('https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js','ExcelJS');return f(...a)}}

function snakeRow(kind,r){
 if(kind==='events')return{id:r.id,title:r.title,age_category:r.ageCategory||null,specialty:r.specialty,date:r.date,start_time:r.startTime||null,end_time:r.endTime||null,place:r.place||null,convocation_id:r.convocationId||null,public_visible:true};
 if(kind==='documents')return{id:r.id,title:r.title,specialty:r.specialty,date:r.date||null,description:r.description||null,url:r.url||null,featured:!!r.featured,public_visible:true};
 if(kind==='products')return{id:r.id,name:r.name,description:r.description||null,price:Number(r.price||0),deadline:r.deadline||null,active:r.active!==false,image:r.image||null,color:r.color||null};
 if(kind==='students')return{id:r.id,full_name:r.fullName,class_name:r.className,specialty:r.specialty,active:r.active!==false};
 if(kind==='licenses')return{id:r.id,student_id:r.studentId||null,full_name:r.fullName,class_name:r.className,category:r.category||null,contribution:r.contribution||null,payment_status:r.paymentStatus||'En attente',amount:Number(r.amount||0),charter_signed:r.charterSigned||null,section_option:r.sectionOption};
 if(kind==='convocations')return{id:r.id,title:r.title,activity:r.activity||null,age_category:r.ageCategory||null,specialty:r.specialty,date:r.date,departure:r.departure||null,return_time:r.returnTime||null,place:r.place||null,meeting_point:r.meetingPoint||null,teacher:r.teacher||null,extra_info:r.extraInfo||null,status:r.status||'published',public_visible:true};
 if(kind==='reports')return{id:r.id,date:r.date,activity:r.activity,teacher:r.teacher||null,level:r.level||null,place:r.place||null,category:r.category||null,participants:Number(r.participants||0),comment:r.comment||null};
 if(kind==='orders')return{id:r.id,product_id:r.productId||null,student_name:r.studentName,class_name:r.className,size:r.size||null,quantity:Number(r.quantity||1),payment_method:r.paymentMethod||null,paid:!!r.paid,distributed:!!r.distributed,color:r.color||null,created_at:r.createdAt||new Date().toISOString()};
 if(kind==='appreciations')return{id:r.id,student_id:r.studentId,educator_id:r.educatorId||currentUser?.id||null,term:Number(r.term||1),text:r.text||'',status:r.status||'draft'};
 return r;
}
const TABLES={events:'v20_events',documents:'v20_documents',products:'v20_products',students:'v20_students',licenses:'v20_licenses',convocations:'v20_convocations',reports:'v20_reports',orders:'v20_orders',appreciations:'v20_appreciations'};
function changedRows(a=[],b=[]){const am=new Map((a||[]).map(x=>[x.id,x])),bm=new Map((b||[]).map(x=>[x.id,x]));return{up:[...bm.values()].filter(x=>!am.has(x.id)||JSON.stringify(am.get(x.id))!==JSON.stringify(x)),del:[...am.keys()].filter(id=>!bm.has(id))}}
async function syncKind(kind,prev,next){
 const {up,del}=changedRows(prev?.[kind]||[],next?.[kind]||[]);if(!up.length&&!del.length)return;
 const table=TABLES[kind];
 if(up.length){const {error}=await sb.from(table).upsert(up.map(r=>snakeRow(kind,r)));if(error)throw error}
 if(del.length){const {error}=await sb.from(table).delete().in('id',del);if(error)throw error}
 if(kind==='convocations'&&up.length){for(const c of up){const {error}=await sb.from('v20_convocation_students').delete().eq('convocation_id',c.id);if(error)throw error;const links=(c.studentIds||[]).map(studentId=>({convocation_id:c.id,student_id:studentId}));if(links.length){const ins=await sb.from('v20_convocation_students').insert(links);if(ins.error)throw ins.error}}}
}
async function syncObjects(prev,next){
 if(currentRole==='admin'&&JSON.stringify(prev.termSettings||{})!==JSON.stringify(next.termSettings||{})){
  const rows=Object.entries(next.termSettings||{}).map(([term,v])=>({term:Number(term),deadline:v.deadline||null,term_end:v.end||null}));if(rows.length){const {error}=await sb.from('v20_term_settings').upsert(rows);if(error)throw error}
 }
 if(['teacher_as','admin'].includes(currentRole)&&JSON.stringify(prev.specialtyNotes||{})!==JSON.stringify(next.specialtyNotes||{})){
  const rows=Object.entries(next.specialtyNotes||{}).map(([specialty,v])=>({specialty,message:v.message||'',expires_at:v.expiresAt||null,active:!!v.active,public_visible:true}));if(rows.length){const {error}=await sb.from('v20_specialty_notes').upsert(rows);if(error)throw error}
 }
}
async function syncDiff(prev,next){
 if(!sb||currentRole==='public')return;
 if(/^educator_/.test(currentRole))return syncKind('appreciations',prev,next);
 for(const kind of ['events','documents','products','students','licenses','convocations','reports','orders','appreciations'])await syncKind(kind,prev,next);
 await syncObjects(prev,next);
}
async function flushSync(){
 clearTimeout(syncTimer);syncTimer=null;if(syncBusy||suppressSync||!sb)return;syncBusy=true;
 const target=clone(latestSnapshot),baseSnap=clone(confirmedSnapshot);
 try{await syncDiff(baseSnap,target);confirmedSnapshot=clone(target)}catch(e){console.error('V22 sync',e);toast('Synchronisation impossible. Les données restent sur cet appareil.','error');syncTimer=setTimeout(flushSync,5000)}finally{syncBusy=false;if(JSON.stringify(confirmedSnapshot)!==JSON.stringify(latestSnapshot)&&!syncTimer)syncTimer=setTimeout(flushSync,300)}
}
Storage.prototype.setItem=function(k,v){
 nativeSet.call(this,k,v);
 if(this===localStorage&&k===STORE&&!suppressSync){latestSnapshot=clone(safe(v,{}));clearTimeout(syncTimer);syncTimer=setTimeout(flushSync,260)}
};

async function publicOrderSubmit(form){
 if(!pendingProductId||!sb)return false;const fd=new FormData(form);const row={id:uid('o'),productId:pendingProductId,studentName:String(fd.get('studentName')||'').trim(),className:String(fd.get('className')||''),size:String(fd.get('size')||''),quantity:Number(fd.get('quantity')||1),paymentMethod:String(fd.get('paymentMethod')||''),color:String(fd.get('color')||'').trim(),paid:false,distributed:false,createdAt:new Date().toISOString()};
 const btn=form.querySelector('[type=submit]');btn.disabled=true;btn.textContent='Envoi…';
 try{const {error}=await sb.from('v20_orders').insert(snakeRow('orders',row));if(error)throw error;const d=app.readData();d.orders=d.orders||[];d.orders.push(row);persistSilently(d);app.closeModal?.();pendingProductId=null;toast('Commande enregistrée ✓','success');return true}catch(e){toast('Commande non envoyée : '+(e?.message||'erreur'),'error');btn.disabled=false;btn.textContent='Enregistrer la commande';return false}
}
document.addEventListener('submit',e=>{
 if(e.target?.id==='v19-order-form'&&currentRole==='public'){e.preventDefault();e.stopImmediatePropagation();publicOrderSubmit(e.target)}
},true);

function buildPoles(){
 const s=document.createElement('section');s.className='v20-poles-section v22-poles';s.innerHTML='<div class="v20-poles-head"><div><span class="v20-poles-kicker">BON SAUVEUR SPORT</span><h2>Nos pôles</h2><p>Retrouvez rapidement les informations de votre activité.</p></div><span class="v20-poles-hint">Choisir un pôle</span></div><div class="v20-poles-grid"></div>';
 const g=s.querySelector('.v20-poles-grid');POLES.forEach((p,i)=>{const b=document.createElement('button');b.type='button';b.className=`v20-pole-card ${p[5]}`;b.innerHTML=`<span class="v20-pole-topline"><span>${esc(p[0])}</span><b>0${i+1}</b></span><span class="v20-pole-medallion"><img src="${p[3]}" alt=""></span><span class="v20-pole-text"><strong>${esc(p[1])}</strong><small>${esc(p[2])}</small></span><span class="v20-pole-footer"><span>Voir le calendrier</span><b>→</b></span>`;b.onclick=()=>{base.go('calendar');setTimeout(()=>app.search(p[4]),40)};g.appendChild(b)});return s;
}
function buildInstagram(){const s=document.createElement('section');s.className='v21-instagram v22-instagram';s.innerHTML=`<div class="v21-instagram-simple"><div class="v21-instagram-simple-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"></circle></svg></div><div class="v21-instagram-simple-copy"><span class="v21-instagram-kicker">LA VIE DE L’AS</span><h2>Suivez-nous sur Instagram</h2><p>Photos, résultats, compétitions et actualités de l’Association Sportive.</p></div><a class="v21-instagram-simple-btn" href="${esc(cfg.instagramUrl||'https://www.instagram.com/as_bs50/')}" target="_blank" rel="noopener noreferrer"><span>Voir les actualités de l’AS</span><span>↗</span></a></div>`;return s}
function repairBrand(){
 const [logo,label,initials]=ROLE_BRAND[currentRole]||ROLE_BRAND.public,html=label.split('\n').map(esc).join('<br>');
 document.querySelectorAll('.v19-brand').forEach(el=>{const img=el.querySelector('img'),span=el.querySelector('span');if(img&&img.getAttribute('src')!==logo)img.setAttribute('src',logo);if(span&&span.innerHTML!==html)span.innerHTML=html});
 document.querySelectorAll('.v19-avatar').forEach(a=>{if(a.textContent!==initials)a.textContent=initials;const title=ROLE_LABELS[currentRole]||currentRole;if(a.title!==title)a.title=title;a.setAttribute('aria-label',currentUser?'Ouvrir mon espace':'Se connecter')});
}
function enhanceHome(){
 const hero=document.querySelector('.v19-hero');if(!hero)return;const c=hero.parentElement;if(!c)return;
 let poles=c.querySelector(':scope > .v22-poles'),insta=c.querySelector(':scope > .v22-instagram');
 if(currentRole==='public'){
  if(!poles){poles=buildPoles();hero.insertAdjacentElement('afterend',poles)}
  if(!insta){insta=buildInstagram();poles.insertAdjacentElement('afterend',insta)}
 }else{poles?.remove();insta?.remove()}
}
function enhancePrivacy(){if(currentRole!=='public')return;document.querySelectorAll('.v19-conv-names,.v19-students').forEach(el=>{if(el.style.display!=='none')el.style.display='none'})}
function enhanceGrammar(){const msg='✓ Correcteur orthographique du navigateur activé';document.querySelectorAll('.v19-term-info .grammar').forEach(el=>{if(el.textContent!==msg)el.textContent=msg});document.querySelectorAll('#v19-app-text').forEach(t=>{t.spellcheck=true;t.lang='fr'})}
function adminInject(){
 if(currentRole!=='admin')return;
 const grid=document.querySelector('.v19-admin-cards');if(grid&&!grid.querySelector('[data-v22-admin]')){
  const wrap=document.createElement('div');wrap.dataset.v22Admin='1';wrap.style.display='contents';wrap.innerHTML='<button class="v19-card v19-admin-action" data-users><div><h3>Utilisateurs & accès</h3><p>Inviter, réinitialiser ou retirer un accès.</p></div></button><button class="v19-card v19-admin-action" data-docs><div><h3>Documents</h3><p>Ajouter, modifier ou supprimer les documents.</p></div></button><button class="v19-card v19-admin-action" data-products><div><h3>Boutique & produits</h3><p>Gérer les articles et leur disponibilité.</p></div></button><button class="v19-card v19-admin-action" data-orders><div><h3>Commandes</h3><p>Créer, modifier et suivre les commandes.</p></div></button>';grid.appendChild(wrap);wrap.querySelector('[data-users]').onclick=openUsers;wrap.querySelector('[data-docs]').onclick=documentsManager;wrap.querySelector('[data-products]').onclick=productsManager;wrap.querySelector('[data-orders]').onclick=ordersManager;
 }
 const kicker=(document.querySelector('.v19-page-head .v19-kicker')?.textContent||'').trim().toUpperCase(),actions=document.querySelector('.v19-page-head .v19-head-actions');
 if(kicker==='DOCUMENTS'&&actions&&!actions.querySelector('[data-v22-docs]')){const b=document.createElement('button');b.className='v19-btn';b.dataset.v22Docs='1';b.textContent='Gérer les documents';b.onclick=documentsManager;actions.appendChild(b)}
 if(kicker==='BOUTIQUE'&&actions&&!actions.querySelector('[data-v22-products]')&&!/gestion des commandes/i.test(document.querySelector('.v19-page-head h1')?.textContent||'')){const b=document.createElement('button');b.className='v19-btn secondary';b.dataset.v22Products='1';b.textContent='Gérer les produits';b.onclick=productsManager;actions.prepend(b)}
 if(/gestion des commandes/i.test(document.querySelector('.v19-page-head h1')?.textContent||'')&&actions&&!actions.querySelector('[data-v22-order]')){const b=document.createElement('button');b.className='v19-btn';b.dataset.v22Order='1';b.textContent='+ Commande';b.onclick=()=>orderForm();actions.prepend(b)}
}
let enhanceQueued=false;function enhance(){enhanceQueued=false;repairBrand();enhanceHome();enhancePrivacy();enhanceGrammar();adminInject()}
function scheduleEnhance(){if(enhanceQueued)return;enhanceQueued=true;requestAnimationFrame(enhance)}
new MutationObserver(scheduleEnhance).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});scheduleEnhance();

async function accessToken(){const s=await wait(sb.auth.getSession(),2500);const t=s?.data?.session?.access_token;if(!t)throw new Error('Session administrateur indisponible.');return t}
async function callAdmin(body){const token=await accessToken(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);try{const r=await fetch(`${cfg.supabaseUrl}/functions/v1/admin-users`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`,'apikey':cfg.supabaseAnonKey},body:JSON.stringify(body),signal:controller.signal});let data={};try{data=await r.json()}catch{}if(!r.ok||data.error)throw new Error(data.error||`Erreur ${r.status}`);return data}finally{clearTimeout(timer)}}
async function openUsers(){
 if(currentRole!=='admin')return toast('Accès administrateur requis.','error');
 const w=modal('Utilisateurs & accès','<div class="v22-loading"><i></i><strong>Chargement des comptes…</strong></div>',{wide:true,id:'v22-users-modal'});
 try{const {data:users,error}=await sb.from('profiles').select('id,display_name,email,role').order('display_name');if(error)throw error;renderUsers(w,users||[])}catch(e){w.querySelector('.v19-modal-body').innerHTML=`<div class="v19-empty">Impossible de charger les comptes : ${esc(e?.message||'erreur')}</div>`}
}
function renderUsers(w,users){
 const body=w.querySelector('.v19-modal-body');const roleOpts=Object.entries(ROLE_LABELS).filter(([r])=>r!=='public').map(([r,l])=>`<option value="${r}">${esc(l)}</option>`).join('');
 const rows=users.map(u=>`<div class="v22-user-row"><div><strong>${esc(u.display_name||u.email||'—')}${u.id===currentUser?.id?' <span class="v21-you-badge">Vous</span>':''}</strong><small>${esc(u.email||'')}</small><span>${esc(ROLE_LABELS[u.role]||u.role)}</span></div><div class="v21-user-actions"><button class="v19-btn small secondary" data-reset="${esc(u.email||'')}">Réinitialiser le mot de passe</button>${u.id===currentUser?.id?'':`<button class="v19-btn small v21-danger" data-remove="${esc(u.id)}" data-name="${esc(u.display_name||u.email||'cet utilisateur')}">Supprimer l’accès</button>`}</div></div>`).join('');
 body.innerHTML=`<div class="v21-users-intro"><strong>Inviter un utilisateur</strong><p>Un seul espace sera accessible selon son rôle.</p></div><form class="v19-form" data-invite><label><span>Nom affiché</span><input required name="displayName"></label><label><span>Adresse e-mail</span><input required type="email" name="email"></label><label class="full"><span>Rôle</span><select name="role">${roleOpts}</select></label><div class="full v19-modal-actions"><button class="v19-btn" type="submit">Inviter l’utilisateur</button></div><div class="full v22-form-status" data-status></div></form><div class="v19-section-head"><div><h2>Comptes existants</h2><p>${users.length} compte(s)</p></div></div><div class="v22-users-list">${rows||'<div class="v19-empty">Aucun compte.</div>'}</div>`;
 const f=body.querySelector('[data-invite]'),b=f.querySelector('[type=submit]'),st=f.querySelector('[data-status]');f.onsubmit=async e=>{e.preventDefault();if(b.disabled)return;const fd=new FormData(f);b.disabled=true;b.textContent='Envoi…';st.textContent='Invitation en cours…';try{await callAdmin({action:'invite',displayName:String(fd.get('displayName')||'').trim(),email:String(fd.get('email')||'').trim().toLowerCase(),role:String(fd.get('role')||''),redirectTo:APP_REDIRECT});st.textContent='Invitation envoyée ✓';toast('Invitation envoyée','success');setTimeout(openUsers,650)}catch(err){st.textContent=err?.message||'Invitation impossible.';b.disabled=false;b.textContent='Inviter l’utilisateur'}};
 body.querySelectorAll('[data-reset]').forEach(x=>x.onclick=async()=>{const email=x.dataset.reset;x.disabled=true;x.textContent='Envoi…';try{const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:APP_REDIRECT});if(error)throw error;toast('Lien envoyé à '+email,'success');x.textContent='Lien envoyé'}catch(e){toast(e?.message||'Envoi impossible','error');x.disabled=false;x.textContent='Réinitialiser le mot de passe'}});
 body.querySelectorAll('[data-remove]').forEach(x=>x.onclick=async()=>{if(!confirm(`Supprimer l’accès de ${x.dataset.name} ?`))return;x.disabled=true;x.textContent='Suppression…';try{await callAdmin({action:'remove_access',userId:x.dataset.remove});toast('Accès supprimé','success');setTimeout(openUsers,500)}catch(e){toast(e?.message||'Suppression impossible','error');x.disabled=false;x.textContent='Supprimer l’accès'}});
}

async function remoteUpsert(table,row){const {error}=await sb.from(table).upsert(row);if(error)throw error}
async function remoteDelete(table,id){const {error}=await sb.from(table).delete().eq('id',id);if(error)throw error}
function finishAdmin(data,route){persistSilently(data);base.go(route);toast('Enregistré ✓','success')}
function documentsManager(){
 const d=app.readData(),rows=(d.documents||[]).slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));const w=modal('Gérer les documents',`<div class="v21-admin-toolbar"><strong>${rows.length} document(s)</strong><button class="v19-btn" data-add>+ Document</button></div><div class="v21-admin-list">${rows.map(x=>`<div class="v21-admin-row"><div class="v21-admin-row-main"><strong>${esc(x.title)}</strong><small>${esc(x.specialty)} · ${fmt(x.date)}</small></div><div class="v21-admin-row-actions"><button class="v19-btn small secondary" data-edit="${esc(x.id)}">Modifier</button><button class="v19-btn small v21-danger" data-del="${esc(x.id)}">Supprimer</button></div></div>`).join('')||'<div class="v19-empty">Aucun document.</div>'}</div>`,{wide:true});w.querySelector('[data-add]').onclick=()=>documentForm();w.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>documentForm(b.dataset.edit));w.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>deleteDocument(b.dataset.del))
}
function documentForm(id=''){
 const data=app.readData(),x=(data.documents||[]).find(v=>v.id===id);const w=modal(x?'Modifier le document':'Ajouter un document',`<form class="v19-form"><label class="full"><span>Titre</span><input required name="title" value="${esc(x?.title||'')}"></label><label><span>Spécialité</span><select name="specialty">${opts(SPECIALTIES,x?.specialty||'Association Sportive')}</select></label><label><span>Date</span><input type="date" name="date" value="${esc(x?.date||new Date().toISOString().slice(0,10))}"></label><label class="full"><span>Description</span><textarea name="description">${esc(x?.description||'')}</textarea></label><label class="full"><span>Lien</span><input type="url" name="url" value="${esc(x?.url&&x.url!=='#'?x.url:'')}"></label><div class="full v19-modal-actions"><button class="v19-btn" type="submit">Enregistrer</button></div><div class="full v22-form-status" data-status></div></form>`);const f=w.querySelector('form'),b=f.querySelector('[type=submit]'),st=f.querySelector('[data-status]');f.onsubmit=async e=>{e.preventDefault();const fd=new FormData(f),row={id:x?.id||uid('d'),title:String(fd.get('title')||'').trim(),specialty:String(fd.get('specialty')||''),date:String(fd.get('date')||'')||null,description:String(fd.get('description')||'').trim(),url:String(fd.get('url')||'').trim(),featured:!!x?.featured,publicVisible:true};b.disabled=true;b.textContent='Enregistrement…';try{await remoteUpsert('v20_documents',snakeRow('documents',row));data.documents=data.documents||[];const old=data.documents.find(v=>v.id===row.id);old?Object.assign(old,row):data.documents.push(row);w.remove();finishAdmin(data,'documents')}catch(err){st.textContent=err?.message||'Erreur';b.disabled=false;b.textContent='Enregistrer'}}
}
async function deleteDocument(id){if(!confirm('Supprimer définitivement ce document ?'))return;try{await remoteDelete('v20_documents',id);const d=app.readData();d.documents=(d.documents||[]).filter(x=>x.id!==id);persistSilently(d);documentsManager();toast('Document supprimé','success')}catch(e){toast(e?.message||'Suppression impossible','error')}}
function productsManager(){
 const d=app.readData(),rows=(d.products||[]).slice().sort((a,b)=>(a.name||'').localeCompare(b.name||'','fr'));const w=modal('Gérer les produits',`<div class="v21-admin-toolbar"><strong>${rows.length} produit(s)</strong><button class="v19-btn" data-add>+ Produit</button></div><div class="v21-admin-list">${rows.map(x=>`<div class="v21-admin-row"><div class="v21-admin-row-main"><strong>${esc(x.name)} · ${money(x.price)}</strong><small>${x.active===false?'Masqué':'En vente'}${x.deadline?' · jusqu’au '+fmt(x.deadline):''}</small></div><div class="v21-admin-row-actions"><button class="v19-btn small secondary" data-edit="${esc(x.id)}">Modifier</button><button class="v19-btn small v21-danger" data-del="${esc(x.id)}">Supprimer</button></div></div>`).join('')||'<div class="v19-empty">Aucun produit.</div>'}</div>`,{wide:true});w.querySelector('[data-add]').onclick=()=>productForm();w.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>productForm(b.dataset.edit));w.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>deleteProduct(b.dataset.del))
}
function productForm(id=''){
 const data=app.readData(),x=(data.products||[]).find(v=>v.id===id);const w=modal(x?'Modifier le produit':'Ajouter un produit',`<form class="v19-form"><label class="full"><span>Nom</span><input required name="name" value="${esc(x?.name||'')}"></label><label><span>Prix (€)</span><input required type="number" min="0" step=".01" name="price" value="${esc(x?.price??'')}"></label><label><span>Date limite</span><input type="date" name="deadline" value="${esc(x?.deadline||'')}"></label><label class="full"><span>Description</span><textarea name="description">${esc(x?.description||'')}</textarea></label><label><span>Couleur / modèle</span><input name="color" value="${esc(x?.color||'')}"></label><label><span>Image</span><input name="image" value="${esc(x?.image||'assets/logo-as.png')}"></label><label class="full v19-switch"><input type="checkbox" name="active" ${x?.active===false?'':'checked'}><span>Visible dans la boutique</span></label><div class="full v19-modal-actions"><button class="v19-btn" type="submit">Enregistrer</button></div><div class="full v22-form-status" data-status></div></form>`);const f=w.querySelector('form'),b=f.querySelector('[type=submit]'),st=f.querySelector('[data-status]');f.onsubmit=async e=>{e.preventDefault();const fd=new FormData(f),row={id:x?.id||uid('p'),name:String(fd.get('name')||'').trim(),price:Number(fd.get('price')||0),deadline:String(fd.get('deadline')||'')||null,description:String(fd.get('description')||'').trim(),color:String(fd.get('color')||'').trim(),image:String(fd.get('image')||'').trim()||'assets/logo-as.png',active:fd.get('active')==='on'};b.disabled=true;b.textContent='Enregistrement…';try{await remoteUpsert('v20_products',snakeRow('products',row));data.products=data.products||[];const old=data.products.find(v=>v.id===row.id);old?Object.assign(old,row):data.products.push(row);w.remove();finishAdmin(data,'shop')}catch(err){st.textContent=err?.message||'Erreur';b.disabled=false;b.textContent='Enregistrer'}}
}
async function deleteProduct(id){if(!confirm('Supprimer définitivement ce produit ?'))return;try{await remoteDelete('v20_products',id);const d=app.readData();d.products=(d.products||[]).filter(x=>x.id!==id);persistSilently(d);productsManager();toast('Produit supprimé','success')}catch(e){toast(e?.message||'Suppression impossible','error')}}
function ordersManager(){
 const d=app.readData(),rows=(d.orders||[]).slice().sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));const w=modal('Gérer les commandes',`<div class="v21-admin-toolbar"><strong>${rows.length} commande(s)</strong><button class="v19-btn" data-add>+ Commande</button></div><div class="v21-admin-list">${rows.map(o=>{const p=(d.products||[]).find(x=>x.id===o.productId);return`<div class="v21-admin-row"><div class="v21-admin-row-main"><strong>${esc(o.studentName)} · ${esc(p?.name||'Produit')}</strong><small>${esc(o.className)} · ${esc(o.size||'—')} · Qté ${Number(o.quantity||1)} · ${o.paid?'Payé':'À payer'} · ${o.distributed?'Distribué':'À distribuer'}</small></div><div class="v21-admin-row-actions"><button class="v19-btn small secondary" data-edit="${esc(o.id)}">Modifier</button><button class="v19-btn small v21-danger" data-del="${esc(o.id)}">Supprimer</button></div></div>`}).join('')||'<div class="v19-empty">Aucune commande.</div>'}</div>`,{wide:true});w.querySelector('[data-add]').onclick=()=>orderForm();w.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>orderForm(b.dataset.edit));w.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>deleteOrder(b.dataset.del))
}
function orderForm(id=''){
 const data=app.readData(),x=(data.orders||[]).find(v=>v.id===id),products=(data.products||[]).filter(p=>p.active!==false||p.id===x?.productId);if(!products.length)return toast('Ajoutez d’abord un produit.','error');const w=modal(x?'Modifier la commande':'Ajouter une commande',`<form class="v19-form"><label class="full"><span>Produit</span><select name="productId">${products.map(p=>`<option value="${esc(p.id)}" ${p.id===x?.productId?'selected':''}>${esc(p.name)} — ${money(p.price)}</option>`).join('')}</select></label><label><span>Nom de l’élève</span><input required name="studentName" value="${esc(x?.studentName||'')}"></label><label><span>Classe</span><input required name="className" value="${esc(x?.className||'')}"></label><label><span>Taille</span><select name="size">${opts(SIZES,x?.size||'M')}</select></label><label><span>Quantité</span><input type="number" min="1" max="10" name="quantity" value="${Number(x?.quantity||1)}"></label><label><span>Paiement</span><select name="paymentMethod">${opts(PAYMENTS,x?.paymentMethod||'Chèque')}</select></label><label class="full v19-switch"><input type="checkbox" name="paid" ${x?.paid?'checked':''}><span>Payée</span></label><label class="full v19-switch"><input type="checkbox" name="distributed" ${x?.distributed?'checked':''}><span>Distribuée</span></label><div class="full v19-modal-actions"><button class="v19-btn" type="submit">Enregistrer</button></div><div class="full v22-form-status" data-status></div></form>`);const f=w.querySelector('form'),b=f.querySelector('[type=submit]'),st=f.querySelector('[data-status]');f.onsubmit=async e=>{e.preventDefault();const fd=new FormData(f),row={id:x?.id||uid('o'),productId:String(fd.get('productId')||''),studentName:String(fd.get('studentName')||'').trim(),className:String(fd.get('className')||'').trim(),size:String(fd.get('size')||''),quantity:Number(fd.get('quantity')||1),paymentMethod:String(fd.get('paymentMethod')||''),paid:fd.get('paid')==='on',distributed:fd.get('distributed')==='on',color:x?.color||'',createdAt:x?.createdAt||new Date().toISOString()};b.disabled=true;b.textContent='Enregistrement…';try{await remoteUpsert('v20_orders',snakeRow('orders',row));data.orders=data.orders||[];const old=data.orders.find(v=>v.id===row.id);old?Object.assign(old,row):data.orders.push(row);w.remove();finishAdmin(data,'orders')}catch(err){st.textContent=err?.message||'Erreur';b.disabled=false;b.textContent='Enregistrer'}}
}
async function deleteOrder(id){if(!confirm('Supprimer définitivement cette commande ?'))return;try{await remoteDelete('v20_orders',id);const d=app.readData();d.orders=(d.orders||[]).filter(x=>x.id!==id);persistSilently(d);ordersManager();toast('Commande supprimée','success')}catch(e){toast(e?.message||'Suppression impossible','error')}}

async function initAuth(){
 if(!sb)return;
 try{
  const {data:{session}}=await wait(sb.auth.getSession(),2500);
  if(session?.user){
   const p=await profileFor(session.user),role=ROLE_LABELS[p?.role]?p.role:currentRole;
   currentUser={id:session.user.id,email:p?.email||session.user.email||'',name:p?.display_name||session.user.email||''};
   if(app.role?.()!==role)await applySession(session,{goHome:false,forceHydrate:true});else{cacheRole(session.user,role);scheduleEnhance()}
   if(window.__BS_PASSWORD_FLOW)setTimeout(passwordModal,80);
  }else{currentUser=null;currentRole='public';cacheRole(null,'public');scheduleEnhance()}
 }catch(e){console.warn('V22 auth init',e)}
 sb.auth.onAuthStateChange((event,session)=>{
  if(event==='INITIAL_SESSION')return;
  setTimeout(()=>{
   if(event==='SIGNED_OUT'){if(currentUser||currentRole!=='public')handleSignedOut();return}
   if(['SIGNED_IN','USER_UPDATED','PASSWORD_RECOVERY'].includes(event)&&session?.user){
    if(event==='PASSWORD_RECOVERY')window.__BS_PASSWORD_FLOW=true;
    if(session.user.id!==currentUser?.id||event==='PASSWORD_RECOVERY')applySession(session,{goHome:event!=='PASSWORD_RECOVERY',forceHydrate:true}).then(()=>{if(window.__BS_PASSWORD_FLOW)setTimeout(passwordModal,60)});
   }
  },0);
 });
}
initAuth();
})();