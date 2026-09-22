(() => {
'use strict';

const VERSION='v25.1-20260915';
const STORE='bs-app-data-v4';
const VERIFIED='bs-v20-verified-role';

const CLASSES=[
 '6e AVIGNON','6e Georges BIZET','6e Paul CEZANNE','6e Alphonse DAUDET',
 '5e Jacqueline AURIOL','5e Adrienne BOLLAND','5e Bessie COLEMAN','5e Elise DEROCHE',
 '4e ESTANGUET','4e FLESSEL','4e Cyril MORE','4e DELAUNAY',
 '3e Antonio GAUDI','3e BARCELONE','3e CASTILLE','3e DALI','3e ESPINOZA',
 'Seconde Pro ECP','Seconde Pro Maslow','Seconde Pro Henderson','Seconde GT',
 'Première Pro ECP','Première Pro Curie','Première Pro Pasteur','Première ST2S',
 'Terminale ST2S','Terminale ASSP'
];
const LICENSE_CATEGORIES=['Benjamin','Benjamine','Minime fille','Minime garçon','Lycéen','Lycéenne'];
const SPECIALTIES=['Association Sportive','Section Football','Option Escalade','Sport-études Gymnastique'];
const PAYMENTS=['Chèque','Espèces','Ticket Spot 50','Cart’@too','Virement'];

const app=()=>window.app||null;
const sb=()=>window.__BS_SUPABASE_CLIENT||null;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,' ').replace(/[^a-z0-9]+/g,' ').trim();
const uid=p=>p+Math.random().toString(36).slice(2,10);
const options=(items,current)=>items.map(x=>`<option value="${esc(x)}" ${x===current?'selected':''}>${esc(x)}</option>`).join('');
const toast=(message,delay=3200)=>{const el=document.createElement('div');el.className='v19-toast';el.textContent=message;document.body.appendChild(el);setTimeout(()=>el.remove(),delay)};
const manager=()=>{const role=app()?.role?.()||'public';return ['teacher_as','admin'].includes(role)&&sessionStorage.getItem(VERIFIED)===role};
function persist(data){localStorage.setItem(STORE,JSON.stringify(data))}

/* ---------- Licences fiables ---------- */
function closeLicenseModal(){document.getElementById('v251-license-modal')?.remove()}
function licenseModal(title,body){
 closeLicenseModal();app()?.closeModal?.();
 const w=document.createElement('div');w.id='v251-license-modal';w.className='v19-modal-backdrop';
 w.innerHTML=`<div class="v19-modal wide" role="dialog" aria-modal="true" aria-labelledby="v251-license-title"><div class="v19-modal-head"><h2 id="v251-license-title">${esc(title)}</h2><button class="v19-icon-btn" type="button" data-close aria-label="Fermer">×</button></div><div class="v19-modal-body">${body}</div></div>`;
 document.body.appendChild(w);w.querySelector('[data-close]').onclick=closeLicenseModal;w.addEventListener('click',e=>{if(e.target===w)closeLicenseModal()});return w;
}
async function persistLicenseRows(student,license,isNewStudent=false,previousStudent=null){
 const client=sb();if(!client)throw new Error('Connexion à la base indisponible.');
 const studentRow={id:student.id,full_name:student.fullName,class_name:student.className,specialty:student.specialty,active:true};
 const licenseRow={id:license.id,student_id:license.studentId,full_name:license.fullName,class_name:license.className,category:license.category||null,contribution:license.contribution||null,payment_status:license.paymentStatus||'En attente',amount:Number(license.amount||0),charter_signed:license.charterSigned||'Non',section_option:license.sectionOption};
 const {error:studentError}=await client.from('v20_students').upsert(studentRow);if(studentError)throw studentError;
 const {error:licenseError}=await client.from('v20_licenses').upsert(licenseRow);
 if(licenseError){
  try{if(!isNewStudent&&previousStudent)await client.from('v20_students').upsert({id:previousStudent.id,full_name:previousStudent.fullName,class_name:previousStudent.className,specialty:previousStudent.specialty,active:true})}catch{}
  throw licenseError;
 }
 const {data:check,error:checkError}=await client.from('v20_licenses').select('id').eq('id',license.id).limit(1);if(checkError)throw checkError;if(!check?.length)throw new Error('La licence n’a pas été confirmée par le serveur.');
}
function editLicense(id){
 if(!manager())return toast('Accès gestion requis.');const data=app()?.readData?.();if(!data)return;
 const current=id?(data.licenses||[]).find(x=>String(x.id)===String(id)):null;
 const w=licenseModal(current?'Modifier une licence':'Ajouter une licence',`<form id="v251-license-form" class="v19-form">
  <label class="full"><span>Nom & prénom</span><input name="fullName" required maxlength="120" value="${esc(current?.fullName||'')}"></label>
  <label><span>Classe</span><select name="className">${options(CLASSES,current?.className||CLASSES[0])}</select></label>
  <label><span>Catégorie</span><select name="category">${options(LICENSE_CATEGORIES,LICENSE_CATEGORIES.includes(current?.category)?current.category:LICENSE_CATEGORIES[0])}</select></label>
  <label><span>Cotisation</span><select name="contribution">${options(PAYMENTS,current?.contribution||PAYMENTS[0])}</select></label>
  <label><span>Statut du paiement</span><select name="paymentStatus">${options(['En attente','Payé'],current?.paymentStatus||'En attente')}</select></label>
  <label><span>Montant</span><input type="number" min="0" step="0.01" name="amount" value="${esc(String(current?.amount??20))}"></label>
  <label><span>Charte signée</span><select name="charterSigned">${options(['Oui','Non'],current?.charterSigned||'Non')}</select></label>
  <label class="full"><span>Spécialité</span><select name="sectionOption">${options(SPECIALTIES,current?.sectionOption||'Association Sportive')}</select></label>
  <div class="full v2115-form-status" data-status aria-live="polite"></div>
  <div class="full v19-modal-actions"><button class="v19-btn" type="submit">Enregistrer</button></div></form>`);
 const form=w.querySelector('#v251-license-form'),status=w.querySelector('[data-status]'),button=form.querySelector('[type="submit"]');
 form.onsubmit=async e=>{
  e.preventDefault();const fd=new FormData(form),fullName=String(fd.get('fullName')||'').trim().replace(/\s+/g,' ');if(!fullName)return;
  const studentId=current?.studentId||uid('s'),license={id:current?.id||uid('l'),studentId,fullName,className:String(fd.get('className')||''),category:String(fd.get('category')||''),contribution:String(fd.get('contribution')||''),paymentStatus:String(fd.get('paymentStatus')||'En attente'),amount:Number(fd.get('amount')||0),charterSigned:String(fd.get('charterSigned')||'Non'),sectionOption:String(fd.get('sectionOption')||'Association Sportive')};
  const student={id:studentId,fullName,className:license.className,specialty:license.sectionOption};
  const previousStudent=(data.students||[]).find(x=>String(x.id)===String(studentId));
  button.disabled=true;button.textContent='Enregistrement…';status.textContent='Enregistrement dans la base centrale…';status.className='full v2115-form-status';
  try{await persistLicenseRows(student,license,!current,previousStudent?{...previousStudent}:null);data.students=data.students||[];data.licenses=data.licenses||[];const s=data.students.find(x=>String(x.id)===String(studentId));s?Object.assign(s,student):data.students.push(student);const l=data.licenses.find(x=>String(x.id)===String(license.id));l?Object.assign(l,license):data.licenses.push(license);persist(data);closeLicenseModal();app()?.go?.('licenses');(window.__BS_SAVED?window.__BS_SAVED('Licence enregistrée'):toast('Licence enregistrée dans la base centrale.'))}catch(error){console.error('V25.1 licence',error);button.disabled=false;button.textContent='Enregistrer';status.textContent='Enregistrement impossible : '+(error?.message||'erreur serveur');status.className='full v2115-form-status error'}
 };
}
async function updateLicenseField(id,column,localKey,next){
 if(!manager())return toast('Accès gestion requis.');const data=app()?.readData?.(),license=(data?.licenses||[]).find(x=>String(x.id)===String(id));if(!license)return;
 const client=sb();if(!client)return toast('Connexion à la base indisponible.');
 try{const payload={};payload[column]=next;const {error}=await client.from('v20_licenses').update(payload).eq('id',String(id));if(error)throw error;license[localKey]=next;persist(data);app()?.go?.('licenses');if(window.__BS_SAVED)window.__BS_SAVED('Licence mise à jour')}catch(error){console.error('V25.1 licence update',error);toast('Modification non enregistrée : '+(error?.message||'erreur serveur'),4800)}
}
function toggleLicensePayment(id){const data=app()?.readData?.(),l=(data?.licenses||[]).find(x=>String(x.id)===String(id));if(!l)return;return updateLicenseField(id,'payment_status','paymentStatus',l.paymentStatus==='Payé'?'En attente':'Payé')}
function toggleLicenseCharter(id){const data=app()?.readData?.(),l=(data?.licenses||[]).find(x=>String(x.id)===String(id));if(!l)return;return updateLicenseField(id,'charter_signed','charterSigned',l.charterSigned==='Oui'?'Non':'Oui')}
async function commitImport(){
 if(!manager())return toast('Accès gestion requis.');const rows=(window.__v19ImportRows||[]).filter(x=>x.valid),sp=document.querySelector('#v19-import-sp')?.value||'Association Sportive',defaultPayment=document.querySelector('#v19-import-payment')?.value||'Chèque';if(!rows.length)return alert('Aucune ligne valide à importer.');
 const data=app()?.readData?.();if(!data)return;data.students=data.students||[];data.licenses=data.licenses||[];
 const button=document.querySelector('#v19-import-preview .v19-btn');if(button){button.disabled=true;button.textContent='Import en cours…'}
 let added=0,updated=0,failed=0;
 for(const row of rows){
  let license=data.licenses.find(x=>norm(x.fullName)===norm(row.fullName)&&norm(x.className)===norm(row.className));
  const isNew=!license,studentId=license?.studentId||uid('s');
  const payment=PAYMENTS.includes(row.contribution)?row.contribution:defaultPayment;
  const nextLicense=license?{...license,fullName:row.fullName,className:row.className,category:row.category,contribution:payment,sectionOption:sp}:{id:uid('l'),studentId,fullName:row.fullName,className:row.className,category:row.category,contribution:payment,paymentStatus:'En attente',amount:20,charterSigned:'Non',sectionOption:sp};
  const previousStudent=data.students.find(x=>String(x.id)===String(studentId)),nextStudent={id:studentId,fullName:row.fullName,className:row.className,specialty:sp};
  try{await persistLicenseRows(nextStudent,nextLicense,isNew,previousStudent?{...previousStudent}:null);if(license)Object.assign(license,nextLicense);else data.licenses.push(nextLicense);if(previousStudent)Object.assign(previousStudent,nextStudent);else data.students.push(nextStudent);isNew?added++:updated++}catch(error){failed++;console.error('V25.1 import licence',row,error)}
 }
 persist(data);app()?.closeModal?.();app()?.go?.('licenses');if(failed)alert(`${added} ajouté(s) · ${updated} mis à jour · ${failed} échec(s). Les lignes en échec n’ont pas été ajoutées localement.`);else (window.__BS_SAVED?window.__BS_SAVED('Import validé',`${added} élève(s) ajouté(s) · ${updated} mis à jour · base centrale synchronisée.`):toast(`${added} élève(s) ajouté(s) · ${updated} mis à jour.`));
}

async function bulkLicensePaymentMode(){
 if(!manager())return toast('Accès gestion requis.');
 const mode=document.querySelector('#v19-bulk-license-payment')?.value||'';
 if(!PAYMENTS.includes(mode))return toast('Choisissez un mode de paiement.');
 const ids=(window.__v19VisibleLicenseIds||[]).map(String).filter(Boolean);
 if(!ids.length)return toast('Aucune licence dans la sélection.');
 if(!confirm(`Appliquer « ${mode} » à ${ids.length} licence(s) de la sélection actuelle ?`))return;
 const client=sb();if(!client)return toast('Connexion à la base indisponible.');
 const button=document.querySelector('.v19-license-bulk .v19-btn');if(button){button.disabled=true;button.textContent='Mise à jour…'}
 try{
  const {error}=await client.from('v20_licenses').update({contribution:mode}).in('id',ids);if(error)throw error;
  const data=app()?.readData?.();if(data){(data.licenses||[]).forEach(l=>{if(ids.includes(String(l.id)))l.contribution=mode});persist(data)}
  app()?.go?.('licenses');if(window.__BS_SAVED)window.__BS_SAVED('Licences mises à jour',`${ids.length} licence(s) · ${mode} · base centrale synchronisée.`);else toast(`${ids.length} licence(s) mises à jour : ${mode}.`);
 }catch(error){console.error('V27.8 paiement licences en masse',error);if(button){button.disabled=false;button.textContent=`Appliquer à ${ids.length} licence(s)`}toast('Mise à jour impossible : '+(error?.message||'erreur serveur'),4800)}
}

/* ---------- Commandes fiables ---------- */
function normalizeOrderDates(){const data=app()?.readData?.();if(!data)return;(data.orders||[]).forEach(o=>{const raw=String(o.createdAt||'');if(/^\d{4}-\d{2}-\d{2}/.test(raw))o.createdAt=raw.slice(0,10)})}
async function toggleOrder(id,kind){
 if(!manager()||!['paid','distributed'].includes(kind))return;const data=app()?.readData?.(),order=(data?.orders||[]).find(x=>String(x.id)===String(id));if(!order)return;
 const client=sb();if(!client)return toast('Connexion à la base indisponible.');const next=!order[kind],payload={};payload[kind]=next;
 try{const {error}=await client.from('v20_orders').update(payload).eq('id',String(id));if(error)throw error;order[kind]=next;persist(data);app()?.go?.('orders');if(window.__BS_SAVED)window.__BS_SAVED('Commande mise à jour')}catch(error){console.error('V25.1 commande',error);toast('Modification non enregistrée : '+(error?.message||'erreur serveur'),4800)}
}

/* ---------- Interface ---------- */
function injectSafetyCss(){if(document.getElementById('v251-safety-css'))return;const s=document.createElement('style');s.id='v251-safety-css';s.textContent='.v19-shell{padding-bottom:170px!important}.v19-container{padding-bottom:145px!important}body{scroll-padding-bottom:150px}.v251-charter{min-width:82px;justify-content:center}.v19-modal-backdrop .v19-form input:not([type="checkbox"]),.v19-modal-backdrop .v19-form select{height:48px!important;min-height:48px!important;padding:0 14px!important;border-radius:15px!important;font-size:16px!important;line-height:48px!important}.v19-modal-backdrop .v19-form input[type="number"],.v19-modal-backdrop .v19-form input[type="date"],.v19-modal-backdrop .v19-form input[type="time"]{height:48px!important;min-height:48px!important}.v19-modal-backdrop .v19-form textarea{min-height:96px!important;padding:12px 14px!important;border-radius:15px!important;font-size:16px!important}.v19-modal-backdrop .v19-form label>span,.v19-modal-backdrop .v19-label{min-height:16px;display:flex;align-items:flex-end}.v19-modal-backdrop .v19-form{align-items:end}@media(max-width:620px){.v19-shell{padding-bottom:145px!important}.v19-container{padding-bottom:120px!important}.v19-modal-backdrop .v19-form input:not([type="checkbox"]),.v19-modal-backdrop .v19-form select{height:50px!important;min-height:50px!important}}';document.head.appendChild(s)}
function patchVersion(){if(window.__BS_RELEASE?.major>=29)return;document.querySelectorAll('.v221-privacy-footer span').forEach(x=>x.textContent='V25.1')}
function patchEventDefaults(){const modal=[...document.querySelectorAll('.v19-modal')].find(x=>/Ajouter un événement/i.test(x.querySelector('.v19-modal-head h2')?.textContent||''));if(!modal)return;const start=modal.querySelector('input[name="startTime"]'),end=modal.querySelector('input[name="endTime"]');if(start&&!start.value)start.value='12:30';if(end&&!end.value)end.value='14:30'}
function patchCharterCells(){
 const title=(document.querySelector('.v19-page-head h1')?.textContent||'').trim();if(title!=='Licences')return;
 const table=document.querySelector('.v19-table');if(!table)return;const heads=[...table.querySelectorAll('thead th')],index=heads.findIndex(th=>norm(th.textContent)==='charte');if(index<0)return;
 table.querySelectorAll('tbody tr').forEach(row=>{const cells=row.children,cell=cells[index];if(!cell||cell.querySelector('[data-v251-charter]'))return;const edit=row.querySelector('button[onclick*="editLicense"]'),m=(edit?.getAttribute('onclick')||'').match(/editLicense\('([^']+)'\)/);if(!m)return;const id=m[1],license=(app()?.readData?.()?.licenses||[]).find(x=>String(x.id)===String(id));const yes=license?.charterSigned==='Oui';cell.innerHTML=`<button type="button" class="v19-status v251-charter ${yes?'on':'off'}" data-v251-charter="${esc(id)}"><span>${yes?'Oui':'Non'}</span><svg class="v19-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 9 4-4 4 4M16 15l-4 4-4-4"/></svg></button>`;cell.querySelector('button').onclick=()=>toggleLicenseCharter(id)})
}
function sortHomeCards(){
 const hero=document.querySelector('.v19-hero');if(!hero)return;const heads=[...document.querySelectorAll('.v19-section-head')],head=heads.find(x=>/À venir/i.test(x.textContent||''));const stack=head?.nextElementSibling;if(!stack?.classList.contains('v19-stack'))return;
 const events=(app()?.readData?.()?.events||[]).filter(e=>String(e.date||'')>=new Date().toISOString().slice(0,10)).slice().sort((a,b)=>(String(a.date||'')+String(a.startTime||'')).localeCompare(String(b.date||'')+String(b.startTime||'')));
 const order=new Map();events.forEach((e,i)=>{const d=new Date(String(e.date||'')+'T12:00:00'),day=String(d.getDate()),month=d.toLocaleDateString('fr-FR',{month:'short'}).replace('.','').toUpperCase();order.set(`${norm(e.title)}|${day}|${month}`,i)});
 const cards=[...stack.querySelectorAll('.v19-event-card')];cards.sort((a,b)=>{const key=x=>`${norm(x.querySelector('.v19-event-body h3')?.textContent)}|${(x.querySelector('.v19-date strong')?.textContent||'').trim()}|${(x.querySelector('.v19-date span')?.textContent||'').trim().toUpperCase()}`;return(order.get(key(a))??999)-(order.get(key(b))??999)}).forEach(card=>stack.appendChild(card));
}
function hidePublicTests(){if(app()?.role?.()!=='public')return;document.querySelectorAll('.v19-product').forEach(card=>{if(norm(card.querySelector('h3')?.textContent)==='test')card.remove()})}
function afterRender(){normalizeOrderDates();patchVersion();patchEventDefaults();patchCharterCells();hidePublicTests()}
function wrapNavigation(target){if(target.__v251GoWrapped)return;const original=target.go?.bind(target);if(!original)return;target.go=route=>{if(route==='orders')normalizeOrderDates();const result=original(route);setTimeout(afterRender,0);return result};target.__v251GoWrapped=true}


function install(){
 const target=app();if(!target)return setTimeout(install,80);
 target.editLicense=editLicense;target.toggleLicensePayment=toggleLicensePayment;target.toggleLicenseCharter=toggleLicenseCharter;target.commitImport=commitImport;target.bulkLicensePaymentMode=bulkLicensePaymentMode;target.toggleOrder=toggleOrder;
 wrapNavigation(target);injectSafetyCss();afterRender();
 window.addEventListener('bs-app-rendered',()=>requestAnimationFrame(afterRender));
 window.ASV25={version:VERSION,features:['server-first-deletes','server-first-licenses','reliable-license-import','clickable-charter','server-first-order-status','order-date-normalization','chronological-home','bottom-nav-safe-area','30-minute-inactivity-timeout']};
 if(!window.__BS_RELEASE)document.documentElement.dataset.appVersion='25.1';
}
install();
})();
