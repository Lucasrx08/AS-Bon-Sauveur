(() => {
'use strict';

const cfg = window.APP_CONFIG || {};
const root = document.getElementById('app');
const STORE = 'bs-app-data-v4';
const ROLE_KEY = 'bs-demo-role-v4';
const BLUE = '#0757C9', NAVY = '#13213A', YELLOW = '#FFD21A', BG = '#F4F7FB', MUTED = '#6B7890';

const CLASSES = [
'6e AVIGNON','6e Georges BIZET','6e Paul CEZANNE','6e Alphonse DAUDET',
'5e Jacqueline AURIOL','5e Adrienne BOLLAND','5e Bessie COLEMAN','5e Elise DEROCHE',
'4e ESTANGUET','4e FLESSEL','4e Cyril MORE','4e DELAUNAY',
'3e Antonio GAUDI','3e BARCELONE','3e CASTILLE','3e DALI','3e ESPINOZA',
'Seconde Pro ECP','Seconde Pro Maslow','Seconde Pro Henderson','Seconde GT',
'Première Pro ECP','Première Pro Curie','Première Pro Pasteur','Première ST2S',
'Terminale ST2S','Terminale ASSP'
];
const AGE_CATEGORIES = ['Benjamin','Benjamine','Minime fille','Minime garçon','Lycéen','Lycéenne','Toutes catégories'];
const LICENSE_CATEGORIES = ['Benjamin','Benjamine','Minime fille','Minime garçon','Lycéen','Lycéenne'];
const SPECIALTIES = ['Association Sportive','Section Football','Option Escalade','Sport-études Gymnastique'];
const EDU_SPECIALTIES = ['Section Football','Option Escalade','Sport-études Gymnastique'];
const PAYMENTS = ['Chèque','Espèces','Ticket Spot 50','Cart’@too','Virement'];
const SHOP_PAYMENTS = ['Espèces','Virement','Chèque'];
const SHOP_SIZES = ['7/8 ans','9/11 ans','12/13 ans','XS','S','M','L','XL','XXL','XXXL','XXXXL'];
const TEACHERS = ['Thomas GONTIER','Guillaume DHERVILLY','Lucas RIGAUX','Maxime PETIT'];
const ACTIVITIES = ['Réunion d’organisation','AG UGSEL Manche','Renforcement - Relaxation','Kayak','Volley-Ball','Handball','Cross de l’établissement','Cross-Country','Trisports','Football','Futsal','Basket-ball','Badminton','Tennis de table','Escalade','Gymnastique','Athlétisme','Course d’orientation','Natation','VTT','Laser Run','Multisports','Autre'];
const LEVELS = ['Entraînement','District','Comité','Territoire','National','Autre'];
const ROLE_LABELS = {
 public:'Élèves / Parents',
 educator_escalade:'Option Escalade',
 educator_football:'Section Football',
 educator_gymnastique:'Sport-études Gymnastique',
 teacher_as:'Association Sportive',
 admin:'Administrateur'
};
const ROLE_SPECIALTY = {
 educator_escalade:'Option Escalade',
 educator_football:'Section Football',
 educator_gymnastique:'Sport-études Gymnastique'
};
const SPEC = {
 'Association Sportive':{class:'as',color:'#D9B41B',short:'AS'},
 'Section Football':{class:'football',color:'#3E8FEA',short:'Football'},
 'Option Escalade':{class:'escalade',color:'#7357D9',short:'Escalade'},
 'Sport-études Gymnastique':{class:'gym',color:'#9558CC',short:'Gymnastique'}
};

const seed = {
 events:[],
 documents:[],
 products:[],
 orders:[],
 students:[],
 appreciations:[],
 licenses:[],
 convocations:[],
 reports:[],
 eventRegistrations:[],
 specialtyNotes:{
  'Section Football':{message:'',expiresAt:'',active:false},
  'Option Escalade':{message:'',expiresAt:'',active:false},
  'Sport-études Gymnastique':{message:'',expiresAt:'',active:false}
 },
 termSettings:{
  1:{deadline:'2026-11-30',end:'2026-12-11'},
  2:{deadline:'2027-03-12',end:'2027-03-19'},
  3:{deadline:'2027-06-11',end:'2027-06-25'}
 }
};

const clone = x => JSON.parse(JSON.stringify(x));
function load(){
 try{
  const raw=JSON.parse(localStorage.getItem(STORE)||'null');
  if(!raw) return clone(seed);
  const d={...clone(seed),...raw};
  d.termSettings={...seed.termSettings,...(raw.termSettings||{})};
  d.specialtyNotes={...seed.specialtyNotes,...(raw.specialtyNotes||{})};
  d.licenses=(d.licenses||[]).map(l=>{
    const map={'Section foot Benjamin':'Benjamin','Section foot Benjamine':'Benjamine','Section foot Minime garçon':'Minime garçon','Section foot Minime fille':'Minime fille','Lycée':'Lycéen'};
    return {...l,category:map[l.category]||l.category};
  });
  d.convocations=(d.convocations||[]).map(c=>{
    let info=String(c.extraInfo||'').trim();
    const equipment=String(c.equipment||'').trim();
    if(equipment&&!norm(info).includes(norm(equipment))) info=[info,equipment].filter(Boolean).join(' · ');
    const out={...c,teacher:c.teacher||'',extraInfo:info}; delete out.equipment; return out;
  });
  d.orders=(d.orders||[]).map(o=>{const x={...o};delete x.ready;return x});
  if((localStorage.getItem(ROLE_KEY)||'public')==='public'){
   d.students=[];d.licenses=[];d.appreciations=[];d.reports=[];d.eventRegistrations=[];
   d.convocations=(d.convocations||[]).map(({studentIds,...convocation})=>convocation);
  }
  return d;
 }catch(e){console.warn(e);return clone(seed)}
}
const state = {
 route:'home',
 role:localStorage.getItem(ROLE_KEY)||'public',
 data:load(),
 dark:localStorage.getItem('bs-dark')==='1',
 term:1,
 filters:{licenses:{},registrations:{specialty:'',eventId:''},appreciationReview:{specialty:'',term:1}},
 search:''
};
if(state.dark) document.body.classList.add('dark');

function save(){localStorage.setItem(STORE,JSON.stringify(state.data))}
function uid(p='x'){return p+Math.random().toString(36).slice(2,10)}
function esc(v=''){return String(v??'').replace(/[&<>"]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]))}
function norm(s=''){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,' ').replace(/[^a-z0-9]+/g,' ').trim()}
function fmtLong(d){return !d?'—':new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(d+'T12:00:00'))}
function fmtShort(d){return !d?'—':new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(d+'T12:00:00'))}
function fmtDateTime(d){if(!d)return'—';const value=new Date(d);return Number.isNaN(value.getTime())?'—':new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(value)}
function todayKey(){const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function money(n){return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(Number(n||0))}
function roleSpecialty(){return ROLE_SPECIALTY[state.role]||null}
function isManager(){return ['teacher_as','admin'].includes(state.role)}
function isAdmin(){return state.role==='admin'}
function isEducator(){return !!roleSpecialty()}
function options(list,current='',blank=null){
 return (blank!==null?`<option value="">${esc(blank)}</option>`:'')+list.map(x=>`<option value="${esc(x)}" ${x===current?'selected':''}>${esc(x)}</option>`).join('');
}
function specBadge(sp){const m=SPEC[sp]||SPEC['Association Sportive'];return `<span class="v19-badge ${m.class}">${esc(sp)}</span>`}
function icon(name){
 const paths={
  home:'<path d="M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  cal:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  flag:'<path d="M5 21V4m0 1h11l-2 4 2 4H5"/>',
  chart:'<path d="M4 20V10m6 10V4m6 16v-7m4 7H2"/>',
  more:'<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
  app:'<path d="M4 5h16v12H8l-4 4z"/><path d="M8 9h8M8 13h5"/>',
  doc:'<path d="M6 2h9l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/>',
  shop:'<path d="M4 7h16l-1 14H5z"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/>',
  users:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 21v-2a6 6 0 0 1 12 0v2M15 15a5 5 0 0 1 6 4v2"/>',
  signup:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3.5h6v3H9zM9 11l2 2 4-4M9 17h6"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1A1.7 1.7 0 0 0 4.6 15 1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z"/>',
  copy:'<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  chevron:'<path d="m8 9 4-4 4 4M16 15l-4 4-4-4"/>'
 };
 return `<svg class="v19-icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name]||paths.more}</svg>`;
}
function toast(msg){const el=document.createElement('div');el.className='v19-toast';el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),2200)}

function currentNav(){
 if(state.role==='public') return [['home','home','Accueil'],['convocations','flag','Convocation'],['calendar','cal','Calendrier'],['shop','shop','Boutique'],['documents','doc','Documents']];
 if(isEducator()) return [['home','home','Accueil'],['calendar','cal','Calendrier'],['appreciations','app','Appréciations']];
 return [['home','home','Accueil'],['calendar','cal','Calendrier'],['convocations','flag','Convocations'],['reports','chart','Bilans'],['more','more','Plus']];
}
function header(){
 const label=ROLE_LABELS[state.role]||'AS';
 const initials=label.split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();
 return `<header class="v19-topbar">
  <button class="v19-brand" onclick="app.go('home')"><img src="assets/logo-as.png"><span>ASSOCIATION SPORTIVE<br>DU BON SAUVEUR</span></button>
  <div class="v19-top-actions"><button class="v19-icon-btn" onclick="app.theme()" aria-label="Thème">${state.dark?'☀':'☾'}</button><button class="v19-avatar" onclick="app.profile()">${esc(initials)}</button></div>
 </header>`;
}
function layout(body){
 return `<div class="v19-shell">${header()}<main class="v19-main">${body}</main><nav class="v19-bottom-nav">${currentNav().map(([r,i,l])=>`<button class="${state.route===r?'active':''}" onclick="app.go('${r}')">${icon(i)}<span>${l}</span></button>`).join('')}</nav></div>`;
}
function pageTitle(kicker,title,sub='',actions=''){
 return `<div class="v19-page-head"><div><div class="v19-kicker">${esc(kicker)}</div><h1>${esc(title)}</h1>${sub?`<p>${esc(sub)}</p>`:''}</div>${actions?`<div class="v19-head-actions">${actions}</div>`:''}</div>`;
}
function eventsVisible(){
 const sp=roleSpecialty();
 return (state.data.events||[]).filter(e=>!sp||e.specialty===sp).slice().sort((a,b)=>(a.date+(a.startTime||'')).localeCompare(b.date+(b.startTime||'')));
}
function eventConvocation(e){
 return !e?null:(state.data.convocations||[]).find(x=>x.id===e.convocationId||(x.date===e.date&&x.specialty===e.specialty&&x.title===e.title))||null;
}
function eventRegistrationAvailable(e){
 return !!e&&!eventConvocation(e)&&!!e.registrationOpen&&String(e.date||'')>=todayKey();
}
function eventCard(e){
 const c=eventConvocation(e);
 const d=new Date(e.date+'T12:00:00');
 return `<article class="v19-card v19-event-card">
  <div class="v19-date"><strong>${d.getDate()}</strong><span>${d.toLocaleDateString('fr-FR',{month:'short'}).replace('.','').toUpperCase()}</span></div>
  <div class="v19-event-body"><h3>${esc(e.title)}</h3><div class="v19-meta">${esc(e.startTime||'—')}${e.endTime?' → '+esc(e.endTime):''} · ${esc(e.place||'—')}</div><div class="v19-meta">${esc(e.ageCategory||'Toutes catégories')}</div>${specBadge(e.specialty)}</div>
  <div class="v19-card-actions">${c?`<button class="v19-chip" onclick="app.openConv('${c.id}')">Voir convocation</button>`:eventRegistrationAvailable(e)?`<button class="v19-chip v2115-registration-chip" onclick="app.openEventRegistration('${e.id}')">Inscription</button>`:''}${isManager()?`<button class="v19-link" onclick="app.editEvent('${e.id}')">Modifier</button><button class="v19-link danger" onclick="app.deleteEvent('${e.id}')">Supprimer</button>`:''}</div>
 </article>`;
}
function specialtyNote(){
 const sp=roleSpecialty(); if(!sp) return '';
 const n=state.data.specialtyNotes?.[sp];
 const valid=n?.active&&String(n.message||'').trim()&&(!n.expiresAt||n.expiresAt>=new Date().toISOString().slice(0,10));
 if(!valid) return '';
 return `<section class="v19-postit"><div class="pin"></div><div><span>À RETENIR</span><p>${esc(n.message)}</p>${n.expiresAt?`<small>Jusqu’au ${fmtShort(n.expiresAt)}</small>`:''}</div></section>`;
}
function homePage(){
 const sp=roleSpecialty();
 const title=sp||"L’Association Sportive du Bon Sauveur";
 const sub=sp?'Rendez-vous, informations et suivi de votre espace.':'Compétitions, entraînements, convocations et informations.';
 const upcoming=eventsVisible().filter(e=>String(e.date||'')>=todayKey());
 const ev=upcoming.slice().sort((a,b)=>Number(eventRegistrationAvailable(b))-Number(eventRegistrationAvailable(a))||(a.date+(a.startTime||'')).localeCompare(b.date+(b.startTime||''))).slice(0,5);
 return `<div class="v19-container">
  <section class="v19-hero"><div class="v19-kicker">SAINT-LÔ · ${sp?esc(sp).toUpperCase():'ASSOCIATION SPORTIVE'}</div><h1>${esc(title)}</h1><p>${esc(sub)}</p></section>
  ${specialtyNote()}
  <div class="v19-section-head"><div><h2>À venir</h2><p>Les prochains rendez-vous.</p></div><button class="v19-link" onclick="app.go('calendar')">Tout voir →</button></div>
  <div class="v19-stack">${ev.map(eventCard).join('')||'<div class="v19-empty">Aucun rendez-vous prévu.</div>'}</div>
 </div>`;
}
function calendarPage(){
 const actions=(isManager()?`<button class="v19-btn" onclick="app.editEvent()">+ Événement</button>`:'')+`<button class="v19-btn yellow" onclick="app.exportCalendarPDF()">Exporter le calendrier</button>`;
 const q=norm(state.search), list=eventsVisible().filter(e=>!q||norm(`${e.title} ${e.place} ${e.ageCategory} ${e.specialty}`).includes(q));
 return `<div class="v19-container">${pageTitle('CALENDRIER','À venir',roleSpecialty()?`Uniquement les rendez-vous liés à ${roleSpecialty()}.`:'Compétitions, entraînements et rendez-vous.',actions)}
 <input class="v19-search" placeholder="Rechercher…" value="${esc(state.search)}" oninput="app.search(this.value)">
 <div class="v19-stack">${list.map(eventCard).join('')||'<div class="v19-empty">Aucun rendez-vous.</div>'}</div></div>`;
}
function convCard(c){
 const names=(c.studentIds||[]).map(studentName).filter(Boolean);
 return `<article class="v19-card v19-conv-card">
  <div class="v19-row"><div><div class="v19-kicker">${esc(c.activity||'ACTIVITÉ')}</div><h3>${esc(c.title||'Convocation')}</h3><div class="v19-meta">${fmtLong(c.date)} · ${esc(c.place||'—')}</div></div>${specBadge(c.specialty)}</div>
  <div class="v19-conv-names"><strong>Élèves convoqués :</strong> ${esc(names.join(' · ')||'Aucun élève')}</div>
  <div class="v19-card-actions"><button class="v19-btn small" onclick="app.openConv('${c.id}')">Consulter</button><button class="v19-btn small yellow" onclick="app.exportConvocation('${c.id}')">Exporter</button>${isManager()?`<button class="v19-link" onclick="app.editConv('${c.id}')">Modifier</button><button class="v19-link danger" onclick="app.deleteConv('${c.id}')">Supprimer</button>`:''}</div>
 </article>`;
}
function convocationsPage(){
 let list=(state.data.convocations||[]).slice().sort((a,b)=>a.date.localeCompare(b.date));
 if(isEducator()) list=list.filter(c=>c.specialty===roleSpecialty());
 const actions=isManager()?`<button class="v19-btn" onclick="app.editConv()">+ Convocation</button><button class="v19-btn secondary" onclick="app.exportExcel('convocations')">Exporter Excel</button>`:'';
 return `<div class="v19-container">${pageTitle('CONVOCATIONS','Convocations','Horaires, informations et élèves convoqués.',actions)}<div class="v19-stack">${list.map(convCard).join('')||'<div class="v19-empty">Aucune convocation.</div>'}</div></div>`;
}
function licensesPage(){
 if(!isManager()) return denied();
 const f=state.filters.licenses||{}; let rows=(state.data.licenses||[]).slice();
 for(const [k,v] of Object.entries(f)){if(!v)continue;const key={specialty:'sectionOption',paymentMethod:'contribution'}[k]||k;rows=rows.filter(x=>x[key]===v)}
 const total=rows.filter(x=>x.paymentStatus==='Payé').reduce((s,x)=>s+Number(x.amount||0),0);
 const actions=`<button class="v19-btn secondary" onclick="app.exportExcel('licenses')">Exporter Excel</button>${isAdmin()?`<button class="v19-btn secondary" onclick="app.downloadLicenseTemplate()">Modèle Excel</button><button class="v19-btn" onclick="app.openLicenseImport()">Importer Excel / CSV</button>`:''}<button class="v19-btn" onclick="app.editLicense()">+ Licence</button>`;
 return `<div class="v19-container">${pageTitle('GESTION','Licences','La base centrale des élèves licenciés.',actions)}
  <div class="v19-filters">
   ${filter('category','Catégorie',['',...LICENSE_CATEGORIES],f.category)}
   ${filter('specialty','Spécialité',['',...SPECIALTIES],f.specialty)}
   ${filter('className','Classe',['',...CLASSES],f.className)}
   ${filter('paymentStatus','Paiement',['','Payé','En attente'],f.paymentStatus)}
   ${filter('paymentMethod','Mode',['',...PAYMENTS],f.paymentMethod)}
   <button class="v19-btn secondary small" onclick="app.clearLicenseFilters()">Effacer</button>
  </div>
  <div class="v19-accounting"><span>${rows.length} licence(s)</span><strong>${money(total)} encaissés dans la sélection</strong></div>
  <div class="v19-table-wrap"><table class="v19-table"><thead><tr><th>Nom & prénom</th><th>Classe</th><th>Catégorie</th><th>Spécialité</th><th>Cotisation</th><th>Statut</th><th>Montant</th><th>Charte</th><th></th></tr></thead><tbody>${rows.map(l=>`<tr><td><strong>${esc(l.fullName)}</strong></td><td>${esc(l.className)}</td><td>${esc(l.category)}</td><td>${esc(l.sectionOption)}</td><td>${esc(l.contribution)}</td><td><button class="v19-status ${l.paymentStatus==='Payé'?'on':'off'}" onclick="app.toggleLicensePayment('${l.id}')"><span>${esc(l.paymentStatus)}</span>${icon('chevron')}</button></td><td>${money(l.amount)}</td><td>${esc(l.charterSigned)}</td><td><button class="v19-link" onclick="app.editLicense('${l.id}')">Modifier</button></td></tr>`).join('')}</tbody></table></div>
 </div>`;
}
function filter(key,label,items,val=''){
 return `<label class="v19-filter"><span>${esc(label)}</span><select onchange="app.licenseFilter('${key}',this.value)">${items.map(x=>`<option value="${esc(x)}" ${x===val?'selected':''}>${esc(x||'Tous')}</option>`).join('')}</select></label>`;
}
function ordersPage(){
 if(!isManager()) return denied();
 const rows=(state.data.orders||[]).slice().sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
 const pending=rows.filter(x=>!x.paid).length, dist=rows.filter(x=>x.paid&&!x.distributed).length;
 return `<div class="v19-container">${pageTitle('BOUTIQUE','Gestion des commandes','Paiement et distribution.',`<button class="v19-btn" onclick="app.exportExcel('orders')">Exporter Excel</button>`)}
  <div class="v19-stats"><div><strong>${rows.length}</strong><span>Commandes</span></div><div><strong>${pending}</strong><span>Paiements en attente</span></div><div><strong>${dist}</strong><span>À distribuer</span></div></div>
  <div class="v19-table-wrap"><table class="v19-table"><thead><tr><th>Élève</th><th>Classe</th><th>Produit</th><th>Taille</th><th>Paiement</th><th>Payé</th><th>Distribution</th><th>Date</th></tr></thead><tbody>${rows.map(o=>`<tr><td><strong>${esc(o.studentName)}</strong></td><td>${esc(o.className)}</td><td>${esc(productName(o.productId))}</td><td>${esc(o.size)}</td><td>${esc(o.paymentMethod)}</td><td><button class="v19-status ${o.paid?'on':'off'}" onclick="app.toggleOrder('${o.id}','paid')"><span>${o.paid?'Payé':'En attente'}</span>${icon('chevron')}</button></td><td><button class="v19-status ${o.distributed?'on':'off'}" onclick="app.toggleOrder('${o.id}','distributed')"><span>${o.distributed?'Distribué':'À distribuer'}</span>${icon('chevron')}</button></td><td>${fmtShort(o.createdAt)}</td></tr>`).join('')}</tbody></table></div>
 </div>`;
}
function reportsPage(){
 if(!isManager()) return denied();
 const rows=(state.data.reports||[]).slice().sort((a,b)=>b.date.localeCompare(a.date));
 return `<div class="v19-container">${pageTitle('BILANS','Bilans AS','Suivi des activités et compétitions.',`<button class="v19-btn secondary" onclick="app.exportExcel('reports')">Exporter Excel</button><button class="v19-btn" onclick="app.editReport()">+ Bilan</button>`)}
 <div class="v19-grid">${rows.map(r=>`<article class="v19-card"><div class="v19-row"><div><h3>${esc(r.activity)}</h3><div class="v19-meta">${fmtShort(r.date)} · ${esc(r.teacher||'')} · ${Number(r.participants||0)} élève(s)</div></div><div><button class="v19-link" onclick="app.editReport('${r.id}')">Modifier</button> <button class="v19-link danger" onclick="app.deleteReport('${r.id}')">Supprimer</button></div></div><div class="v19-report-grid"><span><b>Niveau</b>${esc(r.level||'')}</span><span><b>Lieu</b>${esc(r.place||'')}</span><span><b>Catégorie</b>${esc(r.category||'')}</span></div>${r.comment?`<p>${esc(r.comment)}</p>`:''}</article>`).join('')}</div></div>`;
}
function currentApp(studentId,term=state.term){return (state.data.appreciations||[]).filter(a=>a.studentId===studentId&&Number(a.term)===Number(term)).sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')))[0]||null}
function appreciationsPage(){
 if(!isEducator()&&!isAdmin()) return denied();
 const sp=roleSpecialty();
 const licensed=(state.data.licenses||[]).filter(l=>!sp||l.sectionOption===sp);
 const st=state.data.termSettings?.[state.term]||{};
 return `<div class="v19-container">${pageTitle(sp||'ADMINISTRATION','Appréciations','Suivi annuel et transfert rapide vers ÉcoleDirecte.',`<button class="v19-btn secondary" onclick="app.exportExcel('appreciations')">Exporter Excel</button>`)}
  <div class="v19-term-tabs">${[1,2,3].map(t=>`<button class="${t===state.term?'active':''}" onclick="app.setTerm(${t})">Trimestre ${t}</button>`).join('')}</div>
  <div class="v19-term-info"><div><span>Date limite de saisie</span><strong>${fmtLong(st.deadline)}</strong></div><div><span>Fin du trimestre</span><strong>${fmtLong(st.end)}</strong></div><div class="grammar">✓ Vérification orthographe + grammaire à la validation</div></div>
  <div class="v19-app-list">${licensed.map(l=>appCard(l)).join('')||'<div class="v19-empty">Aucun élève.</div>'}</div>
 </div>`;
}
function appCard(l){
 const cur=currentApp(l.studentId),prev=state.term>1?currentApp(l.studentId,state.term-1):null,text=cur?.text||'';
 return `<article class="v19-card v19-app-card"><div><h3>${esc(l.fullName)}</h3><div class="v19-meta">${esc(l.className)}</div></div>
  <div class="v19-app-prev"><span>TRIMESTRE PRÉCÉDENT</span><p>${esc(prev?.text||'—')}</p></div>
  <div class="v19-app-current"><span>APPRÉCIATION ACTUELLE</span><p class="${text?'':'muted'}">${esc(text||'Aucune appréciation rédigée')}</p></div>
  <div class="v19-app-actions"><button class="v19-btn secondary" ${text?'':'disabled'} onclick="app.copyApp('${l.studentId}')">${icon('copy')} Copier</button><button class="v19-btn" onclick="app.editApp('${l.studentId}')">${text?'Modifier l’appréciation':'Rédiger'}</button></div>
 </article>`;
}
function registrationEvent(eventId){return (state.data.events||[]).find(e=>String(e.id)===String(eventId))||null}
function registrationRows(){
 const f=state.filters.registrations||{},events=new Map((state.data.events||[]).map(e=>[String(e.id),e]));
 return (state.data.eventRegistrations||[]).map(registration=>({registration,event:events.get(String(registration.eventId))||null})).filter(({event})=>event&&(!f.specialty||event.specialty===f.specialty)&&(!f.eventId||String(event.id)===String(f.eventId))).sort((a,b)=>`${a.event.date||''}${a.registration.lastName||''}${a.registration.firstName||''}`.localeCompare(`${b.event.date||''}${b.registration.lastName||''}${b.registration.firstName||''}`,'fr'));
}
function setRegistrationFilter(key,value){if(!isManager())return;state.filters.registrations={...(state.filters.registrations||{}),[key]:String(value||'')};if(key==='specialty')state.filters.registrations.eventId='';render()}
function clearRegistrationFilters(){if(!isManager())return;state.filters.registrations={specialty:'',eventId:''};render()}
function registrationsPage(){
 if(!isManager())return denied();
 const f=state.filters.registrations||{},rows=registrationRows(),eventIds=new Set((state.data.eventRegistrations||[]).map(r=>String(r.eventId))),events=(state.data.events||[]).filter(e=>(e.registrationOpen||eventIds.has(String(e.id)))&&(!f.specialty||e.specialty===f.specialty)).slice().sort((a,b)=>(a.date+a.title).localeCompare(b.date+b.title,'fr')),eventCount=new Set(rows.map(x=>String(x.event.id))).size,classCount=new Set(rows.map(x=>x.registration.className)).size;
 const actions=`<button class="v19-btn secondary" onclick="app.refreshEventRegistrations()">Actualiser</button><button class="v19-btn" ${rows.length?'':'disabled'} onclick="app.exportRegistrationsExcel()">Exporter Excel</button>`;
 return `<div class="v19-container">${pageTitle('INSCRIPTIONS','Inscriptions libres','Les élèves inscrits aux événements sans convocation.',actions)}
  <div class="v2115-filterbar">
   <label class="v19-filter"><span>Spécialité</span><select onchange="app.setRegistrationFilter('specialty',this.value)"><option value="">Toutes</option>${SPECIALTIES.map(x=>`<option value="${esc(x)}" ${x===f.specialty?'selected':''}>${esc(x)}</option>`).join('')}</select></label>
   <label class="v19-filter"><span>Événement</span><select onchange="app.setRegistrationFilter('eventId',this.value)"><option value="">Tous les événements</option>${events.map(e=>`<option value="${esc(e.id)}" ${String(e.id)===String(f.eventId)?'selected':''}>${esc(fmtShort(e.date))} · ${esc(e.title)}</option>`).join('')}</select></label>
   <button class="v19-btn secondary small" onclick="app.clearRegistrationFilters()">Effacer les filtres</button>
  </div>
  <div class="v19-stats v2115-stats"><div><strong>${rows.length}</strong><span>Inscription${rows.length>1?'s':''}</span></div><div><strong>${eventCount}</strong><span>Événement${eventCount>1?'s':''}</span></div><div><strong>${classCount}</strong><span>Classe${classCount>1?'s':''}</span></div></div>
  ${rows.length?`<div class="v19-table-wrap v2115-registration-table"><table class="v19-table"><thead><tr><th>Date</th><th>Événement</th><th>Spécialité</th><th>Nom</th><th>Prénom</th><th>Classe</th><th>Inscrit le</th></tr></thead><tbody>${rows.map(({registration:r,event:e})=>`<tr><td><strong>${esc(fmtShort(e.date))}</strong></td><td>${esc(e.title)}</td><td>${specBadge(e.specialty)}</td><td><strong>${esc(r.lastName)}</strong></td><td>${esc(r.firstName)}</td><td>${esc(r.className)}</td><td>${esc(fmtDateTime(r.createdAt))}</td></tr>`).join('')}</tbody></table></div>`:'<div class="v19-empty">Aucune inscription pour cette sélection.</div>'}
 </div>`;
}
function setAppreciationReviewFilter(key,value){
 if(!isManager())return;const next={...(state.filters.appreciationReview||{})};next[key]=key==='term'?Math.min(3,Math.max(1,Number(value)||1)):String(value||'');state.filters.appreciationReview=next;render();
}
function appreciationReviewRows(){
 const f=state.filters.appreciationReview||{},term=Number(f.term)||1;
 return (state.data.licenses||[]).filter(l=>!f.specialty||l.sectionOption===f.specialty).slice().sort((a,b)=>`${a.sectionOption||''}${a.className||''}${a.fullName||''}`.localeCompare(`${b.sectionOption||''}${b.className||''}${b.fullName||''}`,'fr')).map(license=>({license,appreciation:currentApp(license.studentId,term)}));
}
function appreciationReviewPage(){
 if(!isManager())return denied();
 const f=state.filters.appreciationReview||{},term=Number(f.term)||1,rows=appreciationReviewRows(),completed=rows.filter(x=>String(x.appreciation?.text||'').trim()).length,validated=rows.filter(x=>x.appreciation?.status==='validated').length;
 return `<div class="v19-container">${pageTitle('SUIVI PÉDAGOGIQUE','Appréciations','Consulter et copier les textes rédigés par les éducateurs vers ÉcoleDirecte.',`<button class="v19-btn secondary" onclick="app.refreshAppreciationReview()">Actualiser</button>`)}
  <div class="v2115-filterbar v2115-review-filters">
   <label class="v19-filter"><span>Spécialité</span><select onchange="app.setAppreciationReviewFilter('specialty',this.value)"><option value="">Toutes</option>${SPECIALTIES.map(x=>`<option value="${esc(x)}" ${x===f.specialty?'selected':''}>${esc(x)}</option>`).join('')}</select></label>
   <label class="v19-filter"><span>Trimestre</span><select onchange="app.setAppreciationReviewFilter('term',this.value)">${[1,2,3].map(t=>`<option value="${t}" ${t===term?'selected':''}>Trimestre ${t}</option>`).join('')}</select></label>
  </div>
  <div class="v19-stats v2115-stats"><div><strong>${rows.length}</strong><span>Élève${rows.length>1?'s':''}</span></div><div><strong>${completed}</strong><span>Appréciation${completed>1?'s':''} rédigée${completed>1?'s':''}</span></div><div><strong>${validated}</strong><span>Validée${validated>1?'s':''}</span></div></div>
  <div class="v2115-review-list">${rows.map(({license:l,appreciation:a})=>{const text=String(a?.text||'').trim(),status=a?.status==='validated'?'Validée':a?.status==='draft'?'Brouillon':'À faire';return `<article class="v19-card v2115-review-card"><div class="v2115-review-student"><div><h3>${esc(l.fullName)}</h3><p>${esc(l.className)} · ${esc(l.sectionOption)}</p></div><span class="v2115-review-status ${a?.status||'todo'}">${esc(status)}</span></div><div class="v2115-review-copy"><span>TRIMESTRE ${term}</span><p class="${text?'':'muted'}">${esc(text||'Aucune appréciation rédigée')}</p></div><button class="v19-btn secondary" ${text?'':'disabled'} onclick="app.copyReviewApp('${l.studentId}',${term})">${icon('copy')} Copier pour ÉcoleDirecte</button></article>`}).join('')||'<div class="v19-empty">Aucun élève pour cette sélection.</div>'}</div>
 </div>`;
}
function shopPage(){
 const rows=(state.data.products||[]).filter(p=>p.active!==false);
 return `<div class="v19-container">${pageTitle('BOUTIQUE','Boutique AS','Articles officiels de l’Association Sportive.',isManager()?`<button class="v19-btn" onclick="app.go('orders')">Gérer les commandes</button>`:'')}
 <div class="v19-products">${rows.map(p=>`<article class="v19-card v19-product"><img src="${esc(p.image||'assets/logo-as.png')}"><div><h3>${esc(p.name)}</h3><p>${esc(p.description||'')}</p><strong>${money(p.price)}</strong><div class="v19-meta">Commande avant le ${fmtShort(p.deadline)}</div><button class="v19-btn yellow" onclick="app.order('${p.id}')">Commander</button></div></article>`).join('')}</div></div>`;
}
function documentsPage(){
 return `<div class="v19-container">${pageTitle('DOCUMENTS','Documents','Ressources utiles.')}
 <div class="v19-grid">${(state.data.documents||[]).map(d=>`<article class="v19-card"><div class="v19-row"><div>${icon('doc')}<h3>${esc(d.title)}</h3><p>${esc(d.description||'')}</p><div class="v19-meta">${fmtShort(d.date)}</div></div>${specBadge(d.specialty)}</div><div class="v19-card-actions"><button class="v19-btn secondary" onclick="app.openDoc('${d.id}')">Consulter</button><button class="v19-btn" onclick="app.openDoc('${d.id}')">Télécharger</button></div></article>`).join('')}</div></div>`;
}
function morePage(){
 if(!isManager()) return denied();
 const tiles=[
  ['registrations','signup','Inscriptions'],['appreciationReview','app','Appréciations'],['licenses','users','Licences'],['orders','shop','Commandes'],['shop','shop','Boutique'],['documents','doc','Documents']
 ];
 if(isAdmin()) tiles.push(['admin','settings','Administration']);
 return `<div class="v19-container">${pageTitle('PLUS','Outils','Les fonctions adaptées à votre espace.')}<div class="v19-tools">${tiles.map(([r,i,l])=>`<button class="v19-tool" onclick="app.go('${r}')">${icon(i)}<strong>${l}</strong></button>`).join('')}</div></div>`;
}
function adminPage(){
 if(!isAdmin()) return denied();
 return `<div class="v19-container">${pageTitle('ADMINISTRATION','Administration','Réglages de l’application.')}
 <div class="v19-admin-cards">
  <button class="v19-card v19-admin-action" onclick="app.go('registrations')">${icon('signup')}<div><h3>Inscriptions</h3><p>Voir les élèves inscrits et exporter la liste au format Excel.</p></div></button>
  <button class="v19-card v19-admin-action" onclick="app.go('appreciationReview')">${icon('app')}<div><h3>Appréciations</h3><p>Consulter, filtrer et copier les appréciations vers ÉcoleDirecte.</p></div></button>
  <button class="v19-card v19-admin-action" onclick="app.manageSpecialtyNotes()">${icon('app')}<div><h3>Post-it spécialités</h3><p>Modifier l’information visible par Football, Escalade ou Gymnastique.</p></div></button>
  <button class="v19-card v19-admin-action" onclick="app.manageTerms()">${icon('cal')}<div><h3>Dates des trimestres</h3><p>Configurer les dates limite et fins de trimestre.</p></div></button>
  <button class="v19-card v19-admin-action" onclick="app.openLicenseImport()">${icon('users')}<div><h3>Importer des licenciés</h3><p>Ajouter plusieurs élèves depuis un fichier Excel ou CSV.</p></div></button>
 </div></div>`;
}
function denied(){return `<div class="v19-container"><div class="v19-empty">Cet espace n’est pas accessible avec ce profil.</div></div>`}
function render(){
 const pages={home:homePage,calendar:calendarPage,convocations:convocationsPage,licenses:licensesPage,orders:ordersPage,reports:reportsPage,appreciations:appreciationsPage,registrations:registrationsPage,appreciationReview:appreciationReviewPage,shop:shopPage,documents:documentsPage,more:morePage,admin:adminPage};
 root.innerHTML=layout((pages[state.route]||homePage)());
 window.scrollTo({top:0,behavior:'instant'});
}

function modal(title,html,wide=false){
 closeModal();
 const w=document.createElement('div');w.className='v19-modal-backdrop';w.id='v19-modal';
 w.innerHTML=`<div class="v19-modal ${wide?'wide':''}"><div class="v19-modal-head"><h2>${esc(title)}</h2><button class="v19-icon-btn" onclick="app.closeModal()">×</button></div><div class="v19-modal-body">${html}</div></div>`;
 document.body.appendChild(w);w.addEventListener('click',e=>e.target===w&&closeModal());return w;
}
function closeModal(){document.getElementById('v19-modal')?.remove()}
function profile(){
 const roles=Object.entries(ROLE_LABELS);
 modal('Choisir un espace',`<div class="v19-role-list">${roles.map(([r,l])=>`<button class="${r===state.role?'active':''}" onclick="app.setRole('${r}')"><span>${esc(l)}</span>${r===state.role?'✓':''}</button>`).join('')}</div>`);
}
function setRole(r){state.role=r;localStorage.setItem(ROLE_KEY,r);state.route='home';closeModal();render()}
function go(r){state.route=r;state.search='';render();if(r==='registrations'&&isManager())refreshEventRegistrations(true);if(r==='appreciationReview'&&isManager())refreshAppreciationReview(true)}
function theme(){state.dark=!state.dark;localStorage.setItem('bs-dark',state.dark?'1':'0');document.body.classList.toggle('dark',state.dark);render()}
function search(v){state.search=v;render()}

function editEvent(id){
 if(!isManager())return; const e=id?(state.data.events||[]).find(x=>x.id===id):null;
 const linkedConvocation=eventConvocation(e);
 const m=modal(id?'Modifier un événement':'Ajouter un événement',`<form id="v19-event-form" class="v19-form">
  <label><span>Titre</span><input name="title" required value="${esc(e?.title||'')}"></label>
  <label><span>Catégorie</span><select name="ageCategory">${options(AGE_CATEGORIES,e?.ageCategory||'Toutes catégories')}</select></label>
  <label><span>Spécialité</span><select name="specialty">${options(SPECIALTIES,e?.specialty||'Association Sportive')}</select></label>
  <label><span>Date</span><input type="date" name="date" required value="${esc(e?.date||new Date().toISOString().slice(0,10))}"></label>
  <label><span>Heure de départ</span><input type="time" name="startTime" value="${esc(e?.startTime||'')}"></label>
  <label><span>Heure de retour</span><input type="time" name="endTime" value="${esc(e?.endTime||'')}"></label>
  <label class="full"><span>Lieu</span><input name="place" value="${esc(e?.place||'')}"></label>
  <label class="full v2115-registration-choice"><input type="checkbox" name="registrationOpen" ${e?.registrationOpen&&!linkedConvocation?'checked':''} ${linkedConvocation?'disabled':''}><span><strong>Ouvrir l’inscription libre</strong><small>${linkedConvocation?'Une convocation est déjà liée à cet événement.':'Affiche le bouton Inscription tant qu’aucune convocation n’est disponible.'}</small></span></label>
  <div class="full v2115-form-status" data-event-status aria-live="polite"></div>
  <div class="full v19-modal-actions"><button class="v19-btn" type="submit">Enregistrer</button></div></form>`,true);
 const form=m.querySelector('#v19-event-form'),status=m.querySelector('[data-event-status]'),button=form.querySelector('button[type="submit"]');
 form.onsubmit=async ev=>{ev.preventDefault();const fd=new FormData(form),o={id:e?.id||uid('e'),title:String(fd.get('title')||'').trim(),ageCategory:fd.get('ageCategory'),specialty:fd.get('specialty'),date:fd.get('date'),startTime:fd.get('startTime'),endTime:fd.get('endTime'),place:String(fd.get('place')||'').trim(),convocationId:e?.convocationId||null,registrationOpen:!linkedConvocation&&fd.get('registrationOpen')==='on'};button.disabled=true;button.textContent='Enregistrement…';status.textContent='';status.className='full v2115-form-status';try{if(typeof window.__BS_PERSIST_EVENT!=='function')throw new Error('SERVICE_UNAVAILABLE');await window.__BS_PERSIST_EVENT(o);e?Object.assign(e,o):state.data.events.push(o);save();closeModal();render();toast(o.registrationOpen?'Événement enregistré · inscriptions ouvertes':'Événement enregistré')}catch(error){console.warn('Enregistrement événement',error);button.disabled=false;button.textContent='Enregistrer';status.textContent='L’événement n’a pas pu être enregistré dans la base centrale. Réessayez.';status.className='full v2115-form-status error'}};
}
function deleteEvent(id){if(!isManager())return;const count=(state.data.eventRegistrations||[]).filter(r=>String(r.eventId)===String(id)).length,message=count?`Supprimer cet événement et ses ${count} inscription${count>1?'s':''} ?`:'Supprimer cet événement ?';if(!confirm(message))return;state.data.events=state.data.events.filter(e=>e.id!==id);state.data.eventRegistrations=(state.data.eventRegistrations||[]).filter(r=>String(r.eventId)!==String(id));save();render()}

function studentName(id){return (state.data.students||[]).find(s=>s.id===id)?.fullName||(state.data.licenses||[]).find(l=>l.studentId===id)?.fullName||''}
function openConv(id){
 const c=(state.data.convocations||[]).find(x=>x.id===id);if(!c)return;const names=(c.studentIds||[]).map(studentName).filter(Boolean);
 modal('Convocation',`<div class="v19-conv-detail-head"><div><div class="v19-kicker">${esc(c.activity||'ACTIVITÉ')}</div><h2>${esc(c.title)}</h2></div>${specBadge(c.specialty)}</div>
  <div class="v19-detail-grid"><div><span>Date</span><strong>${fmtLong(c.date)}</strong></div><div><span>Lieu</span><strong>${esc(c.place||'—')}</strong></div><div><span>Départ</span><strong>${esc(c.departure||'—')}</strong></div><div><span>Retour</span><strong>${esc(c.returnTime||'—')}</strong></div><div class="wide"><span>Point de rendez-vous</span><strong>${esc(c.meetingPoint||'—')}</strong></div><div class="wide"><span>Professeur référent</span><strong>${esc(c.teacher||'Non renseigné')}</strong><a class="v19-ed" href="https://www.ecoledirecte.com/" target="_blank" rel="noopener"><img src="assets/logo-ecoledirecte.svg"><span>Ouvrir ÉcoleDirecte</span>↗</a></div><div class="wide important"><span>Informations importantes</span><strong>${esc(c.extraInfo||'Aucune information particulière.')}</strong></div></div>
  <div class="v19-students"><h3>Élèves convoqués</h3><div>${names.map(n=>`<span>${esc(n)}</span>`).join('')}</div></div>
  <div class="v19-modal-actions"><button class="v19-btn yellow" onclick="app.exportConvocation('${c.id}')">Exporter la convocation</button></div>`,true);
}
function editConv(id){
 if(!isManager())return;const c=id?(state.data.convocations||[]).find(x=>x.id===id):null;
 const licensed=(state.data.licenses||[]).slice().sort((a,b)=>(a.fullName||'').localeCompare(b.fullName||'','fr'));
 const checked=new Set(c?.studentIds||[]);
 const m=modal(id?'Modifier une convocation':'Ajouter une convocation',`<form id="v19-conv-form" class="v19-form">
  <label><span>Activité</span><select name="activity">${options(ACTIVITIES,c?.activity||'Football')}</select></label>
  <label class="full"><span>Titre</span><input name="title" required value="${esc(c?.title||'')}"></label>
  <label><span>Catégorie</span><select name="ageCategory">${options(AGE_CATEGORIES,c?.ageCategory||'Benjamin')}</select></label>
  <label><span>Spécialité</span><select name="specialty">${options(SPECIALTIES,c?.specialty||'Association Sportive')}</select></label>
  <label><span>Date</span><input type="date" name="date" required value="${esc(c?.date||new Date().toISOString().slice(0,10))}"></label>
  <label><span>Lieu</span><input name="place" value="${esc(c?.place||'')}"></label>
  <label><span>Heure de départ</span><input type="time" name="departure" value="${esc(c?.departure||'')}"></label>
  <label><span>Heure de retour</span><input type="time" name="returnTime" value="${esc(c?.returnTime||'')}"></label>
  <label class="full"><span>Point de rendez-vous</span><input name="meetingPoint" value="${esc(c?.meetingPoint||'')}"></label>
  <label class="full"><span>Professeur référent</span><select name="teacher" required><option value="">Choisir un professeur</option>${options(TEACHERS,c?.teacher||'',null)}</select></label>
  <label class="full"><span>Informations importantes</span><textarea name="extraInfo" rows="4" placeholder="Repas, tenue, consignes, changement d’horaire…">${esc(c?.extraInfo||'')}</textarea></label>
  <div class="full"><span class="v19-label">Élèves convoqués</span><div class="v19-student-picker">${licensed.map(l=>`<label><input type="checkbox" name="studentIds" value="${esc(l.studentId)}" ${checked.has(l.studentId)?'checked':''}><span><strong>${esc(l.fullName)}</strong><small>${esc(l.className)} · ${esc(l.category)} · ${esc(l.sectionOption)}</small></span></label>`).join('')}</div></div>
  <div class="full v19-modal-actions"><button class="v19-btn" type="submit">Enregistrer</button></div>
 </form>`,true);
 m.querySelector('#v19-conv-form').onsubmit=ev=>{ev.preventDefault();const fd=new FormData(ev.currentTarget),o={id:c?.id||uid('c'),activity:fd.get('activity'),title:String(fd.get('title')||'').trim(),ageCategory:fd.get('ageCategory'),specialty:fd.get('specialty'),date:fd.get('date'),place:String(fd.get('place')||'').trim(),departure:fd.get('departure'),returnTime:fd.get('returnTime'),meetingPoint:String(fd.get('meetingPoint')||'').trim(),teacher:fd.get('teacher'),extraInfo:String(fd.get('extraInfo')||'').trim(),studentIds:fd.getAll('studentIds')};if(!o.teacher)return alert('Choisissez le professeur référent.');c?Object.assign(c,o):state.data.convocations.push(o);(state.data.events||[]).forEach(e=>{if(e.convocationId===o.id)e.convocationId=null});const match=(state.data.events||[]).find(e=>e.date===o.date&&e.specialty===o.specialty&&e.title===o.title);if(match){match.convocationId=o.id;match.registrationOpen=false}save();closeModal();render()};
}
function deleteConv(id){if(!isManager()||!confirm('Supprimer cette convocation ?'))return;state.data.convocations=state.data.convocations.filter(c=>c.id!==id);(state.data.events||[]).forEach(e=>{if(e.convocationId===id)e.convocationId=null});save();render()}

function editLicense(id){
 if(!isManager())return;const l=id?(state.data.licenses||[]).find(x=>x.id===id):null;
 const m=modal(id?'Modifier une licence':'Ajouter une licence',`<form id="v19-license-form" class="v19-form">
  <label class="full"><span>Nom & prénom</span><input name="fullName" required value="${esc(l?.fullName||'')}"></label>
  <label><span>Classe</span><select name="className">${options(CLASSES,l?.className||CLASSES[0])}</select></label>
  <label><span>Catégorie</span><select name="category">${options(LICENSE_CATEGORIES,LICENSE_CATEGORIES.includes(l?.category)?l.category:LICENSE_CATEGORIES[0])}</select></label>
  <label><span>Cotisation</span><select name="contribution">${options(PAYMENTS,l?.contribution||PAYMENTS[0])}</select></label>
  <label><span>Statut du paiement</span><select name="paymentStatus">${options(['En attente','Payé'],l?.paymentStatus||'En attente')}</select></label>
  <label><span>Montant</span><input type="number" name="amount" value="${esc(String(l?.amount??20))}"></label>
  <label><span>Charte signée</span><select name="charterSigned">${options(['Oui','Non'],l?.charterSigned||'Non')}</select></label>
  <label class="full"><span>Spécialité</span><select name="sectionOption">${options(SPECIALTIES,l?.sectionOption||'Association Sportive')}</select></label>
  <div class="full v19-modal-actions"><button class="v19-btn" type="submit">Enregistrer</button></div></form>`,true);
 m.querySelector('#v19-license-form').onsubmit=ev=>{ev.preventDefault();const fd=new FormData(ev.currentTarget),fullName=String(fd.get('fullName')||'').trim(),studentId=l?.studentId||uid('s'),o={id:l?.id||uid('l'),studentId,fullName,className:fd.get('className'),category:fd.get('category'),contribution:fd.get('contribution'),paymentStatus:fd.get('paymentStatus'),amount:Number(fd.get('amount')||0),charterSigned:fd.get('charterSigned'),sectionOption:fd.get('sectionOption')};l?Object.assign(l,o):state.data.licenses.push(o);let s=(state.data.students||[]).find(x=>x.id===studentId);s?Object.assign(s,{fullName,className:o.className,specialty:o.sectionOption}):state.data.students.push({id:studentId,fullName,className:o.className,specialty:o.sectionOption});save();closeModal();render()};
}
function toggleLicensePayment(id){const l=(state.data.licenses||[]).find(x=>x.id===id);if(!l)return;l.paymentStatus=l.paymentStatus==='Payé'?'En attente':'Payé';save();render()}
function licenseFilter(k,v){state.filters.licenses={...(state.filters.licenses||{}),[k]:v};render()}
function clearLicenseFilters(){state.filters.licenses={};render()}

function editReport(id){
 if(!isManager())return;const r=id?(state.data.reports||[]).find(x=>x.id===id):null;
 const checked=new Set(String(r?.teacher||'').split(' · ').filter(Boolean));
 const m=modal(id?'Modifier un bilan':'Ajouter un bilan',`<form id="v19-report-form" class="v19-form">
  <label><span>Date</span><input type="date" name="date" required value="${esc(r?.date||new Date().toISOString().slice(0,10))}"></label>
  <label><span>Activité</span><select name="activity">${options(ACTIVITIES,r?.activity||'Multisports')}</select></label>
  <div class="full"><span class="v19-label">Enseignant(s) référent(s)</span><div class="v19-teacher-picker">${TEACHERS.map(t=>`<label><input type="checkbox" value="${esc(t)}" ${checked.has(t)?'checked':''}><span>${esc(t)}</span></label>`).join('')}</div></div>
  <label><span>Niveau</span><select name="level">${options(LEVELS,r?.level||'Entraînement')}</select></label>
  <label><span>Lieu</span><input name="place" value="${esc(r?.place||'')}"></label>
  <label><span>Catégorie</span><select name="category">${options(AGE_CATEGORIES,r?.category||'Toutes catégories')}</select></label>
  <label><span>Nombre d’élèves</span><input type="number" name="participants" min="0" value="${esc(String(r?.participants??0))}"></label>
  <label class="full"><span>Commentaire</span><textarea name="comment" rows="4">${esc(r?.comment||'')}</textarea></label>
  <div class="full v19-modal-actions"><button class="v19-btn" type="submit">Enregistrer</button></div></form>`,true);
 m.querySelector('#v19-report-form').onsubmit=ev=>{ev.preventDefault();const fd=new FormData(ev.currentTarget),teachers=[...m.querySelectorAll('.v19-teacher-picker input:checked')].map(x=>x.value);if(!teachers.length)return alert('Choisissez au moins un enseignant référent.');const o={id:r?.id||uid('b'),date:fd.get('date'),activity:fd.get('activity'),teacher:teachers.join(' · '),level:fd.get('level'),place:String(fd.get('place')||'').trim(),category:fd.get('category'),participants:Number(fd.get('participants')||0),comment:String(fd.get('comment')||'').trim()};r?Object.assign(r,o):state.data.reports.push(o);save();closeModal();render()};
}
function deleteReport(id){if(!isManager()||!confirm('Supprimer ce bilan ?'))return;state.data.reports=state.data.reports.filter(r=>r.id!==id);save();render()}

function productName(id){return (state.data.products||[]).find(p=>p.id===id)?.name||'Produit'}
function order(productId){
 const p=(state.data.products||[]).find(x=>x.id===productId);if(!p)return;
 const m=modal(`Commander — ${p.name}`,`<form id="v19-order-form" class="v19-form">
  <label class="full"><span>Nom & prénom de l’élève</span><input name="studentName" required></label>
  <label class="full"><span>Classe</span><select name="className">${options(CLASSES,CLASSES[0])}</select></label>
  <label><span>Taille</span><select name="size">${options(SHOP_SIZES,'M')}</select></label>
  <label><span>Quantité</span><input type="number" name="quantity" min="1" value="1"></label>
  <label><span>Mode de paiement</span><select name="paymentMethod">${options(SHOP_PAYMENTS,SHOP_PAYMENTS[0])}</select></label>
  <label><span>Couleur souhaitée</span><input name="color" value="${esc(p.color||'')}"></label>
  <div class="full v19-modal-actions"><button class="v19-btn" type="submit">Enregistrer la commande</button></div></form>`,true);
 m.querySelector('#v19-order-form').onsubmit=ev=>{ev.preventDefault();const fd=new FormData(ev.currentTarget);state.data.orders.push({id:uid('o'),productId,studentName:String(fd.get('studentName')||'').trim(),className:fd.get('className'),size:fd.get('size'),quantity:Number(fd.get('quantity')||1),paymentMethod:fd.get('paymentMethod'),color:String(fd.get('color')||'').trim(),paid:false,distributed:false,createdAt:new Date().toISOString().slice(0,10)});save();closeModal();toast('Commande enregistrée')};
}
function toggleOrder(id,kind){const o=(state.data.orders||[]).find(x=>x.id===id);if(!o)return;o[kind]=!o[kind];save();render()}

function setTerm(t){state.term=t;render()}
function editApp(studentId){
 const l=(state.data.licenses||[]).find(x=>x.studentId===studentId),a=currentApp(studentId);
 const m=modal(`Appréciation — ${l?.fullName||''}`,`<form id="v19-app-form"><div class="v19-app-editor"><div><strong>${esc(l?.fullName||'')}</strong><span>${esc(l?.className||'')}</span></div><textarea id="v19-app-text" rows="10" placeholder="Rédiger l’appréciation…">${esc(a?.text||'')}</textarea><div class="v19-modal-actions"><button type="button" class="v19-btn secondary" onclick="app.saveAppDraft('${studentId}')">Enregistrer le brouillon</button><button type="button" class="v19-btn" onclick="app.validateApp('${studentId}')">Vérifier & valider</button></div></div></form>`,true);
 setTimeout(()=>m.querySelector('#v19-app-text')?.focus(),50);
}
function upsertApp(studentId,text,status){
 let a=currentApp(studentId);if(a){a.text=text;a.status=status}else{state.data.appreciations.push({id:uid('a'),studentId,term:state.term,text,status})}save()
}
function saveAppDraft(studentId){const text=String(document.querySelector('#v19-app-text')?.value||'').trim();upsertApp(studentId,text,'draft');closeModal();render()}
async function validateApp(studentId){
 const text=String(document.querySelector('#v19-app-text')?.value||'').trim();if(!text)return alert('Saisissez une appréciation.');
 const url=cfg.languageToolUrl||'https://api.languagetool.org/v2/check';
 try{
  const body=new URLSearchParams({text,language:'fr-FR'});const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});if(!r.ok)throw new Error('service');const j=await r.json();
  const fixes=(j.matches||[]).filter(m=>m.replacements?.[0]?.value).slice(0,10);
  if(fixes.length){
   let corrected=text;[...fixes].sort((a,b)=>b.offset-a.offset).forEach(m=>{corrected=corrected.slice(0,m.offset)+m.replacements[0].value+corrected.slice(m.offset+m.length)});
   if(corrected!==text&&confirm(`Une correction est proposée :\n\n${corrected}\n\nUtiliser cette version ?`)){upsertApp(studentId,corrected,'validated')}else upsertApp(studentId,text,'validated');
  }else upsertApp(studentId,text,'validated');
  closeModal();render();
 }catch{alert('La vérification orthographe/grammaire est momentanément indisponible. La validation est bloquée pour éviter d’enregistrer sans contrôle.')}
}
async function copyApp(studentId){
 const text=currentApp(studentId)?.text||'';if(!text)return;
 try{await navigator.clipboard.writeText(text)}catch{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}
 toast('Appréciation copiée');
}
async function copyReviewApp(studentId,term){
 if(!isManager())return;const appreciation=currentApp(studentId,term),text=String(appreciation?.text||'').trim();if(!text)return;
 try{await navigator.clipboard.writeText(text)}catch{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}
 toast(`Appréciation de ${studentName(studentId)||'l’élève'} copiée`);
}
function tidyName(value){return String(value||'').trim().replace(/\s+/g,' ')}
async function openEventRegistration(eventId){
 const event=registrationEvent(eventId),convocation=eventConvocation(event);if(!event)return alert('Événement introuvable.');if(convocation||!event.registrationOpen||event.date<todayKey())return alert('Les inscriptions libres ne sont pas disponibles pour cet événement.');
 if(isManager()&&typeof window.__BS_PERSIST_EVENT==='function'){try{await window.__BS_PERSIST_EVENT(event)}catch(error){console.warn('Synchronisation événement',error);return alert('Cet événement n’est pas encore enregistré dans la base centrale. Réessayez dans un instant.')}}
 const m=modal('Inscription',`<div class="v2115-registration-intro"><div class="v19-kicker">${esc(event.specialty)}</div><h3>${esc(event.title)}</h3><p>${esc(fmtLong(event.date))} · ${esc(event.startTime||'Horaire à préciser')}${event.endTime?' → '+esc(event.endTime):''} · ${esc(event.place||'Lieu à préciser')}</p></div><form id="v2115-registration-form" class="v19-form">
  <label><span>Nom</span><input name="lastName" required minlength="2" maxlength="80" autocomplete="family-name"></label>
  <label><span>Prénom</span><input name="firstName" required minlength="2" maxlength="80" autocomplete="given-name"></label>
  <label class="full"><span>Classe</span><select name="className" required><option value="">Choisir une classe</option>${options(CLASSES,'',null)}</select></label>
  <div class="full v2115-privacy">Les informations saisies sont utilisées uniquement pour organiser cette activité et sont accessibles aux enseignants AS et aux administrateurs.</div>
  <div class="full v2115-form-status" data-registration-status aria-live="polite"></div>
  <div class="full v19-modal-actions"><button class="v19-btn yellow" type="submit">Valider mon inscription</button></div>
 </form>`);
 const form=m.querySelector('#v2115-registration-form'),status=m.querySelector('[data-registration-status]'),button=form.querySelector('button[type="submit"]');
 form.onsubmit=async ev=>{ev.preventDefault();const fd=new FormData(form),lastName=tidyName(fd.get('lastName')).toLocaleUpperCase('fr-FR'),firstName=tidyName(fd.get('firstName')),className=String(fd.get('className')||'');if(!CLASSES.includes(className)){status.textContent='Choisissez une classe dans la liste.';status.className='full v2115-form-status error';return}const client=window.__BS_SUPABASE_CLIENT;if(!client){status.textContent='Le service d’inscription est momentanément indisponible.';status.className='full v2115-form-status error';return}button.disabled=true;button.textContent='Inscription en cours…';status.textContent='';status.className='full v2115-form-status';const payload={id:`r${globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2,12)}`,event_id:String(event.id),last_name:lastName,first_name:firstName,class_name:className};const {error}=await client.from('v20_event_registrations').insert(payload);if(error){button.disabled=false;button.textContent='Valider mon inscription';status.className='full v2115-form-status error';status.textContent=error.code==='23505'?'Cet élève est déjà inscrit à cet événement.':error.code==='42501'?'Les inscriptions ne sont plus ouvertes pour cet événement.':'L’inscription n’a pas pu être enregistrée. Réessayez.';return}closeModal();modal('Inscription enregistrée',`<div class="v2115-registration-success"><span>✓</span><h3>${esc(firstName)} ${esc(lastName)}</h3><p>L’inscription à <strong>${esc(event.title)}</strong> est bien enregistrée.</p><button class="v19-btn" onclick="app.closeModal()">Fermer</button></div>`)};
}
async function refreshEventRegistrations(quiet=false){
 if(!isManager())return;const client=window.__BS_SUPABASE_CLIENT;if(!client){if(!quiet)alert('Le service d’inscription est indisponible.');return}
 const {data,error}=await client.from('v20_event_registrations').select('*').order('created_at',{ascending:false});if(error){console.warn('Inscriptions',error.message);if(!quiet)alert('Impossible d’actualiser les inscriptions.');return}
 state.data.eventRegistrations=(data||[]).map(r=>({id:r.id,eventId:r.event_id,lastName:r.last_name,firstName:r.first_name,className:r.class_name,createdAt:r.created_at}));if(state.route==='registrations')render();if(!quiet)toast('Liste des inscriptions actualisée');
}
async function refreshAppreciationReview(quiet=false){
 if(!isManager())return;const client=window.__BS_SUPABASE_CLIENT;if(!client){if(!quiet)alert('Le service des appréciations est indisponible.');return}
 const [licenses,students,appreciations]=await Promise.all([client.from('v20_licenses').select('*'),client.from('v20_students').select('*'),client.from('v20_appreciations').select('*')]);const failed=[licenses,students,appreciations].find(result=>result.error);if(failed){console.warn('Appréciations',failed.error.message);if(!quiet)alert('Impossible d’actualiser les appréciations.');return}
 const camel=row=>Object.fromEntries(Object.entries(row||{}).map(([key,value])=>[key.replace(/_([a-z])/g,(_,letter)=>letter.toUpperCase()),value]));state.data.licenses=(licenses.data||[]).map(camel);state.data.students=(students.data||[]).map(camel);state.data.appreciations=(appreciations.data||[]).map(camel);if(state.route==='appreciationReview')render();if(!quiet)toast('Appréciations actualisées');
}

function hydrateFromServer(data,role){
 if(data&&typeof data==='object')state.data=data;
 if(ROLE_LABELS[role])state.role=role;
 render();
}

function manageSpecialtyNotes(){
 if(!isAdmin())return;
 const m=modal('Post-it spécialités',`<div class="v19-note-manager">
  <label><span>Spécialité</span><select id="v19-note-sp">${options(EDU_SPECIALTIES,EDU_SPECIALTIES[0])}</select></label>
  <label><span>Message</span><textarea id="v19-note-msg" rows="6"></textarea></label>
  <label><span>Fin d’affichage</span><input id="v19-note-exp" type="date"></label>
  <label class="v19-switch"><input id="v19-note-active" type="checkbox"><span>Afficher le post-it</span></label>
  <div class="v19-modal-actions"><button class="v19-btn" onclick="app.saveSpecialtyNote()">Enregistrer</button></div></div>`,true);
 const sel=m.querySelector('#v19-note-sp');const sync=()=>{const n=state.data.specialtyNotes?.[sel.value]||{};m.querySelector('#v19-note-msg').value=n.message||'';m.querySelector('#v19-note-exp').value=n.expiresAt||'';m.querySelector('#v19-note-active').checked=!!n.active};sel.onchange=sync;sync();
}
function saveSpecialtyNote(){
 const sp=document.querySelector('#v19-note-sp')?.value;if(!sp)return;state.data.specialtyNotes[sp]={message:String(document.querySelector('#v19-note-msg')?.value||'').trim(),expiresAt:document.querySelector('#v19-note-exp')?.value||'',active:!!document.querySelector('#v19-note-active')?.checked};save();closeModal();toast('Post-it enregistré');
}
function manageTerms(){
 if(!isAdmin())return;
 const m=modal('Dates des trimestres',`<form id="v19-terms-form" class="v19-form">${[1,2,3].map(t=>{const s=state.data.termSettings?.[t]||{};return `<div class="full v19-term-editor"><h3>Trimestre ${t}</h3><div><label><span>Date limite de saisie</span><input type="date" name="d${t}" value="${esc(s.deadline||'')}"></label><label><span>Fin du trimestre</span><input type="date" name="e${t}" value="${esc(s.end||'')}"></label></div></div>`}).join('')}<div class="full v19-modal-actions"><button class="v19-btn" type="submit">Enregistrer</button></div></form>`,true);
 m.querySelector('#v19-terms-form').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.currentTarget);[1,2,3].forEach(t=>state.data.termSettings[t]={deadline:fd.get(`d${t}`)||'',end:fd.get(`e${t}`)||''});save();closeModal();render()};
}

function openLicenseImport(){
 if(!isAdmin())return;
 const m=modal('Importer des licenciés',`<div class="v19-import"><label><span>Spécialité attribuée à tout le fichier</span><select id="v19-import-sp">${options(SPECIALTIES,'Section Football')}</select></label><div class="v19-drop"><strong>Choisir un fichier Excel ou CSV</strong><small>.xlsx · .xls · .csv</small><input id="v19-import-file" type="file" accept=".xlsx,.xls,.csv,text/csv"></div><div id="v19-import-preview"></div></div>`,true);
 m.querySelector('#v19-import-file').onchange=e=>e.target.files[0]&&previewImport(e.target.files[0],m);
}
function exactClass(raw){const n=norm(raw);return CLASSES.find(c=>norm(c)===n)||''}
function exactCat(raw){const n=norm(raw);return LICENSE_CATEGORIES.find(c=>norm(c)===n)||''}
async function previewImport(file,m){
 if(!window.XLSX)return alert('Le module Excel n’est pas chargé.');
 const box=m.querySelector('#v19-import-preview');box.innerHTML='<p>Lecture du fichier…</p>';
 try{
  const ab=await file.arrayBuffer(),wb=XLSX.read(ab,{type:'array'}),ws=wb.Sheets[wb.SheetNames[0]],raw=XLSX.utils.sheet_to_json(ws,{defval:'',raw:false});
  const get=(r,aliases)=>{for(const k of Object.keys(r)){if(aliases.some(a=>norm(k)===norm(a))&&String(r[k]).trim())return String(r[k]).trim()}return''};
  const rows=raw.map((r,i)=>{let full=get(r,['Nom & prénom','Nom et prénom','Nom prénom','Élève','Eleve']);if(!full)full=[get(r,['Nom']),get(r,['Prénom','Prenom'])].filter(Boolean).join(' ');const rc=get(r,['Classe']),rg=get(r,['Catégorie','Categorie']),cl=exactClass(rc),ca=exactCat(rg),errors=[];if(!full)errors.push('Nom manquant');if(!cl)errors.push(`Classe inconnue : ${rc||'vide'}`);if(!ca)errors.push(`Catégorie inconnue : ${rg||'vide'}`);return{line:i+2,fullName:full,className:cl,category:ca,errors,valid:!errors.length}});
  window.__v19ImportRows=rows;const valid=rows.filter(x=>x.valid).length;
  box.innerHTML=`<div class="v19-import-summary">${valid} ligne(s) prête(s) · ${rows.length-valid} erreur(s)</div><div class="v19-table-wrap"><table class="v19-table"><thead><tr><th>Ligne</th><th>Nom</th><th>Classe</th><th>Catégorie</th><th>État</th></tr></thead><tbody>${rows.slice(0,100).map(r=>`<tr><td>${r.line}</td><td>${esc(r.fullName||'—')}</td><td>${esc(r.className||'—')}</td><td>${esc(r.category||'—')}</td><td>${r.valid?'Prêt':esc(r.errors.join(' · '))}</td></tr>`).join('')}</tbody></table></div><div class="v19-modal-actions"><button class="v19-btn" ${valid?'':'disabled'} onclick="app.commitImport()">Importer ${valid} élève(s)</button></div>`;
 }catch(e){box.innerHTML='<div class="v19-empty">Impossible de lire ce fichier.</div>'}
}
function commitImport(){
 const rows=(window.__v19ImportRows||[]).filter(x=>x.valid),sp=document.querySelector('#v19-import-sp')?.value||'Association Sportive';let added=0,updated=0;
 rows.forEach(r=>{let l=(state.data.licenses||[]).find(x=>norm(x.fullName)===norm(r.fullName)&&norm(x.className)===norm(r.className));if(l){Object.assign(l,{category:r.category,sectionOption:sp});const s=state.data.students.find(x=>x.id===l.studentId);if(s)Object.assign(s,{fullName:r.fullName,className:r.className,specialty:sp});updated++;return}const sid=uid('s');state.data.students.push({id:sid,fullName:r.fullName,className:r.className,specialty:sp});state.data.licenses.push({id:uid('l'),studentId:sid,fullName:r.fullName,className:r.className,category:r.category,contribution:'',paymentStatus:'En attente',amount:20,charterSigned:'Non',sectionOption:sp});added++});
 save();closeModal();render();alert(`${added} élève(s) ajouté(s) · ${updated} mis à jour.`);
}
async function downloadLicenseTemplate(){
 if(!window.ExcelJS)return alert('Le module Excel est encore en chargement.');
 const wb=new ExcelJS.Workbook(),ws=wb.addWorksheet('Import');
 ws.mergeCells('A1:C1');ws.getCell('A1').value='IMPORT LICENCIÉS — AS BON SAUVEUR';ws.getCell('A1').font={name:'Aptos Display',size:20,bold:true,color:{argb:'FF0757C9'}};ws.getCell('A1').alignment={horizontal:'center'};ws.getRow(1).height=32;
 ['Nom & prénom','Classe','Catégorie'].forEach((h,i)=>{const c=ws.getCell(3,i+1);c.value=h;c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0757C9'}};c.font={name:'Aptos',size:11,bold:true,color:{argb:'FFFFFFFF'}};c.alignment={horizontal:'center'}});
 ws.getCell('A4').value='NOM Prénom';ws.getCell('B4').value=CLASSES[0];ws.getCell('C4').value=LICENSE_CATEGORIES[0];ws.getColumn(1).width=32;ws.getColumn(2).width=32;ws.getColumn(3).width=22;for(let r=4;r<=200;r++)ws.getCell(r,3).dataValidation={type:'list',formulae:[`"${LICENSE_CATEGORIES.join(',')}"`]};
 const help=wb.addWorksheet('Aide');help.getCell('A1').value='CATÉGORIES AUTORISÉES';LICENSE_CATEGORIES.forEach((x,i)=>help.getCell(i+2,1).value=x);help.getCell('C1').value='CLASSES AUTORISÉES';CLASSES.forEach((x,i)=>help.getCell(i+2,3).value=x);help.getColumn(1).width=24;help.getColumn(3).width=34;
 const buf=await wb.xlsx.writeBuffer();downloadBlob(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),'Modele_Import_Licencies_AS.xlsx');
}
function openDoc(id){const d=(state.data.documents||[]).find(x=>x.id===id);if(!d)return;if(/^https?:\/\//.test(d.url||''))window.open(d.url,'_blank','noopener');else toast('Document de démonstration : aucun fichier distant associé.')}

function downloadBlob(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
async function exportExcel(kind){
 if(!window.ExcelJS)return alert('Le module Excel est encore en chargement.');
 const wb=new ExcelJS.Workbook(),ws=wb.addWorksheet('Données');
 const defs={
  licenses:{title:'LICENCES',headers:['Nom & prénom','Classe','Catégorie','Spécialité','Cotisation','Statut','Montant','Charte'],rows:(state.data.licenses||[]).map(l=>[l.fullName,l.className,l.category,l.sectionOption,l.contribution,l.paymentStatus,Number(l.amount||0),l.charterSigned])},
  orders:{title:'COMMANDES',headers:['Élève','Classe','Produit','Taille','Qté','Couleur','Paiement','Payé','Distribué','Date'],rows:(state.data.orders||[]).map(o=>[o.studentName,o.className,productName(o.productId),o.size,o.quantity||1,o.color||'',o.paymentMethod,o.paid?'Payé':'En attente',o.distributed?'Distribué':'À distribuer',o.createdAt])},
  reports:{title:'BILANS AS',headers:['Date','Activité','Enseignant(s)','Niveau','Lieu','Catégorie','Nombre d’élèves','Commentaire'],rows:(state.data.reports||[]).map(r=>[r.date,r.activity,r.teacher,r.level,r.place,r.category,Number(r.participants||0),r.comment])},
  convocations:{title:'CONVOCATIONS',headers:['Date','Titre','Activité','Spécialité','Catégorie','Lieu','Départ','Retour','Rendez-vous','Professeur','Informations','Élèves'],rows:(state.data.convocations||[]).map(c=>[c.date,c.title,c.activity,c.specialty,c.ageCategory,c.place,c.departure,c.returnTime,c.meetingPoint,c.teacher,c.extraInfo,(c.studentIds||[]).map(studentName).join(' · ')])},
  appreciations:{title:'APPRÉCIATIONS',headers:['Élève','Classe','Spécialité','Trimestre','Appréciation','Statut'],rows:(state.data.licenses||[]).filter(l=>!roleSpecialty()||l.sectionOption===roleSpecialty()).map(l=>{const a=currentApp(l.studentId);return[l.fullName,l.className,l.sectionOption,state.term,a?.text||'',a?.status||'À faire']})}
 };
 const d=defs[kind];if(!d)return;
 ws.mergeCells(1,1,1,d.headers.length);const t=ws.getCell(1,1);t.value=d.title;t.font={name:'Aptos Display',size:24,bold:true,color:{argb:'FFFFFFFF'}};t.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0757C9'}};t.alignment={horizontal:'left',vertical:'middle'};ws.getRow(1).height=38;
 ws.mergeCells(2,1,2,d.headers.length);const s=ws.getCell(2,1);s.value='ASSOCIATION SPORTIVE DU BON SAUVEUR · SAINT-LÔ';s.font={name:'Aptos',size:10,bold:true,color:{argb:'FF13213A'}};ws.getRow(2).height=22;
 d.headers.forEach((h,i)=>{const c=ws.getCell(4,i+1);c.value=h;c.font={name:'Aptos',size:11,bold:true,color:{argb:'FF13213A'}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFD21A'}};c.alignment={horizontal:'center',vertical:'middle',wrapText:true};c.border={bottom:{style:'thin',color:{argb:'FF0757C9'}}}});
 d.rows.forEach((row,ri)=>row.forEach((v,ci)=>{const c=ws.getCell(5+ri,1+ci);c.value=v;c.font={name:'Aptos',size:10,color:{argb:'FF13213A'}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:ri%2?'FFF7F9FC':'FFFFFFFF'}};c.alignment={vertical:'middle',wrapText:true};c.border={bottom:{style:'hair',color:{argb:'FFDCE5F0'}}}}));
 ws.columns.forEach((col,i)=>{const head=d.headers[i]||'';col.width=Math.min(38,Math.max(14,head.length+6))});ws.views=[{state:'frozen',ySplit:4}];ws.autoFilter={from:{row:4,column:1},to:{row:4,column:d.headers.length}};
 const buf=await wb.xlsx.writeBuffer();downloadBlob(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),`${d.title.replace(/\s+/g,'_')}_Bon_Sauveur.xlsx`);
}
async function exportRegistrationsExcel(){
 if(!isManager())return;if(!window.ExcelJS)return alert('Le module Excel est encore en chargement.');const rows=registrationRows();if(!rows.length)return alert('Aucune inscription à exporter pour cette sélection.');
 const wb=new ExcelJS.Workbook(),ws=wb.addWorksheet('Inscriptions');wb.creator='Association Sportive du Bon Sauveur';wb.company='Bon Sauveur Saint-Lô';wb.created=new Date();wb.modified=new Date();
 const headers=['Date','Événement','Spécialité','Nom','Prénom','Classe','Inscrit le'];ws.mergeCells('A1:G1');const title=ws.getCell('A1');title.value='INSCRIPTIONS LIBRES';title.font={name:'Aptos Display',size:24,bold:true,color:{argb:'FFFFFFFF'}};title.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0757C9'}};title.alignment={vertical:'middle'};ws.getRow(1).height=38;
 ws.mergeCells('A2:G2');const subtitle=ws.getCell('A2');subtitle.value='ASSOCIATION SPORTIVE DU BON SAUVEUR · SAINT-LÔ';subtitle.font={name:'Aptos',size:10,bold:true,color:{argb:'FF13213A'}};ws.getRow(2).height=22;
 const filters=state.filters.registrations||{},event=registrationEvent(filters.eventId);ws.mergeCells('A3:G3');ws.getCell('A3').value=`Sélection : ${filters.specialty||'Toutes les spécialités'} · ${event?`${fmtShort(event.date)} — ${event.title}`:'Tous les événements'} · ${rows.length} inscription${rows.length>1?'s':''}`;ws.getCell('A3').font={name:'Aptos',size:10,italic:true,color:{argb:'FF6B7890'}};ws.getRow(3).height=20;
 headers.forEach((h,i)=>{const c=ws.getCell(5,i+1);c.value=h;c.font={name:'Aptos',size:11,bold:true,color:{argb:'FF13213A'}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFD21A'}};c.alignment={horizontal:'center',vertical:'middle',wrapText:true};c.border={bottom:{style:'medium',color:{argb:'FF0757C9'}}}});ws.getRow(5).height=28;
 rows.forEach(({registration:r,event:e},index)=>{const values=[new Date(`${e.date}T12:00:00`),e.title,e.specialty,r.lastName,r.firstName,r.className,r.createdAt?new Date(r.createdAt):''];values.forEach((value,column)=>{const c=ws.getCell(6+index,1+column);c.value=value;c.font={name:'Aptos',size:10.5,bold:column===3,color:{argb:'FF13213A'}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:index%2?'FFF4F7FB':'FFFFFFFF'}};c.alignment={vertical:'middle',wrapText:true};c.border={bottom:{style:'hair',color:{argb:'FFDCE5F0'}}}});ws.getRow(6+index).height=25});
 ws.getColumn(1).numFmt='dd/mm/yyyy';ws.getColumn(7).numFmt='dd/mm/yyyy hh:mm';[15,34,31,22,22,30,21].forEach((width,index)=>ws.getColumn(index+1).width=width);ws.views=[{state:'frozen',ySplit:5}];ws.autoFilter={from:{row:5,column:1},to:{row:5,column:7}};ws.pageSetup={orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0,paperSize:9};ws.headerFooter.oddFooter='&LAssociation Sportive du Bon Sauveur&CPage &P / &N&RExport du &D';
 const buf=await wb.xlsx.writeBuffer(),date=new Date().toISOString().slice(0,10);downloadBlob(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),`Inscriptions_AS_Bon_Sauveur_${date}.xlsx`);
}

window.app={
 go,theme,profile,setRole,closeModal,search,
 editEvent,deleteEvent,openConv,editConv,deleteConv,
 editLicense,toggleLicensePayment,licenseFilter,clearLicenseFilters,
 editReport,deleteReport,order,toggleOrder,
 setTerm,editApp,saveAppDraft,validateApp,copyApp,copyReviewApp,
 openEventRegistration,refreshEventRegistrations,refreshAppreciationReview,setRegistrationFilter,clearRegistrationFilters,setAppreciationReviewFilter,
 manageSpecialtyNotes,saveSpecialtyNote,manageTerms,
 openLicenseImport,commitImport,downloadLicenseTemplate,openDoc,exportExcel,exportRegistrationsExcel,
 readData:()=>state.data, role:()=>state.role, roleSpecialty, studentName,hydrateFromServer
};
window.ASV2115={version:'v21.15.1-20260910',features:['event-registrations','appreciation-review','direct-event-sync']};
render();

if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();
