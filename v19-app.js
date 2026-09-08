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
'3e Antonio GAUDI','3e BARCELONE','3e CASTILLE','3e DALI',
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
 events:[
  {id:'e4',title:'Sport-études gymnastique',ageCategory:'Toutes catégories',specialty:'Sport-études Gymnastique',date:'2026-09-08',startTime:'14:30',endTime:'18:45',place:'Saint-Loise Gymnastique'},
  {id:'e1',title:'Entraînement AS multisports',ageCategory:'Toutes catégories',specialty:'Association Sportive',date:'2026-09-09',startTime:'13:30',endTime:'16:00',place:'Gymnase du Bon Sauveur'},
  {id:'e2',title:'Entraînement section football',ageCategory:'Benjamin',specialty:'Section Football',date:'2026-09-10',startTime:'15:30',endTime:'17:30',place:'Stade'},
  {id:'e3',title:'Option escalade',ageCategory:'Minime fille',specialty:'Option Escalade',date:'2026-09-10',startTime:'15:30',endTime:'18:00',place:'Salle d’escalade'},
  {id:'e5',title:'UGSEL Football — secteur',ageCategory:'Benjamin',specialty:'Section Football',date:'2026-09-23',startTime:'12:45',endTime:'17:30',place:'Saint-Lô',convocationId:'c1'}
 ],
 documents:[
  {id:'d1',title:'Règlement de l’Association Sportive',specialty:'Association Sportive',date:'2026-09-01',description:'Règles de fonctionnement et informations utiles.',url:'#',featured:true},
  {id:'d2',title:'Horaires section football',specialty:'Section Football',date:'2026-09-01',description:'Horaires hebdomadaires de la section.',url:'#',featured:true}
 ],
 products:[
  {id:'p1',name:'Sweat officiel',description:'Sweat officiel de l’Association Sportive.',price:35,deadline:'2026-10-05',active:true,image:'assets/shop-sweat-sapphire.webp',color:'Sapphire Blue'},
  {id:'p2',name:'T-shirt Association Sportive',description:'T-shirt technique.',price:15,deadline:'2026-10-05',active:true,image:'assets/shop-tshirt-skyblue.webp',color:'Sky Blue'}
 ],
 orders:[
  {id:'o1',productId:'p2',studentName:'MARTIN Léo',className:'5e Jacqueline AURIOL',size:'M',quantity:1,paymentMethod:'Chèque',paid:true,distributed:false,createdAt:'2026-09-07',color:'Sky Blue'}
 ],
 students:[
  {id:'s1',fullName:'DUPONT Emma',className:'6e AVIGNON',specialty:'Sport-études Gymnastique'},
  {id:'s2',fullName:'MARTIN Léo',className:'5e Jacqueline AURIOL',specialty:'Section Football'},
  {id:'s3',fullName:'BERNARD Inès',className:'4e Cyril MORE',specialty:'Option Escalade'},
  {id:'s4',fullName:'THOMAS Jade',className:'5e Bessie COLEMAN',specialty:'Section Football'}
 ],
 appreciations:[
  {id:'a1',studentId:'s2',term:1,text:'Très bonne implication dans les séances.',status:'validated'},
  {id:'a2',studentId:'s3',term:1,text:'Bon trimestre.',status:'draft'}
 ],
 licenses:[
  {id:'l1',studentId:'s1',fullName:'DUPONT Emma',className:'6e AVIGNON',category:'Benjamine',contribution:'Chèque',paymentStatus:'Payé',amount:20,charterSigned:'Oui',sectionOption:'Sport-études Gymnastique'},
  {id:'l2',studentId:'s2',fullName:'MARTIN Léo',className:'5e Jacqueline AURIOL',category:'Benjamin',contribution:'Espèces',paymentStatus:'Payé',amount:20,charterSigned:'Oui',sectionOption:'Section Football'},
  {id:'l3',studentId:'s3',fullName:'BERNARD Inès',className:'4e Cyril MORE',category:'Minime fille',contribution:'Ticket Spot 50',paymentStatus:'En attente',amount:20,charterSigned:'Oui',sectionOption:'Option Escalade'},
  {id:'l4',studentId:'s4',fullName:'THOMAS Jade',className:'5e Bessie COLEMAN',category:'Benjamine',contribution:'Cart’@too',paymentStatus:'Payé',amount:20,charterSigned:'Oui',sectionOption:'Section Football'}
 ],
 convocations:[
  {id:'c1',title:'UGSEL Football — secteur',activity:'Football',ageCategory:'Benjamin',specialty:'Section Football',date:'2026-09-23',departure:'12:45',returnTime:'17:30',place:'Saint-Lô',meetingPoint:'Porche du Bon Sauveur',teacher:'',extraInfo:'Prévoir le repas du midi. Tenue de sport, gourde',studentIds:['s2','s4']}
 ],
 reports:[
  {id:'b1',date:'2026-09-02',activity:'Multisports',teacher:'Lucas RIGAUX',level:'Entraînement',place:'Bon Sauveur',category:'Toutes catégories',participants:34,comment:'Belle reprise, forte participation.'}
 ],
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
  return d;
 }catch(e){console.warn(e);return clone(seed)}
}
const state = {
 route:'home',
 role:localStorage.getItem(ROLE_KEY)||'public',
 data:load(),
 dark:localStorage.getItem('bs-dark')==='1',
 term:1,
 filters:{licenses:{}},
 search:''
};
if(state.dark) document.body.classList.add('dark');

function save(){localStorage.setItem(STORE,JSON.stringify(state.data))}
function uid(p='x'){return p+Math.random().toString(36).slice(2,10)}
function esc(v=''){return String(v??'').replace(/[&<>"]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]))}
function norm(s=''){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,' ').replace(/[^a-z0-9]+/g,' ').trim()}
function fmtLong(d){return !d?'—':new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(d+'T12:00:00'))}
function fmtShort(d){return !d?'—':new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(d+'T12:00:00'))}
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
function eventCard(e){
 const c=(state.data.convocations||[]).find(x=>x.id===e.convocationId||(x.date===e.date&&x.specialty===e.specialty&&x.title===e.title));
 const d=new Date(e.date+'T12:00:00');
 return `<article class="v19-card v19-event-card">
  <div class="v19-date"><strong>${d.getDate()}</strong><span>${d.toLocaleDateString('fr-FR',{month:'short'}).replace('.','').toUpperCase()}</span></div>
  <div class="v19-event-body"><h3>${esc(e.title)}</h3><div class="v19-meta">${esc(e.startTime||'—')}${e.endTime?' → '+esc(e.endTime):''} · ${esc(e.place||'—')}</div><div class="v19-meta">${esc(e.ageCategory||'Toutes catégories')}</div>${specBadge(e.specialty)}</div>
  <div class="v19-card-actions">${c?`<button class="v19-chip" onclick="app.openConv('${c.id}')">Voir convocation</button>`:''}${isManager()?`<button class="v19-link" onclick="app.editEvent('${e.id}')">Modifier</button><button class="v19-link danger" onclick="app.deleteEvent('${e.id}')">Supprimer</button>`:''}</div>
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
 const ev=eventsVisible().slice(0,5);
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
function currentApp(studentId,term=state.term){return (state.data.appreciations||[]).find(a=>a.studentId===studentId&&Number(a.term)===Number(term))}
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
  ['licenses','users','Licences'],['orders','shop','Commandes'],['shop','shop','Boutique'],['documents','doc','Documents']
 ];
 if(isAdmin()) tiles.push(['admin','settings','Administration']);
 return `<div class="v19-container">${pageTitle('PLUS','Outils','Les fonctions adaptées à votre espace.')}<div class="v19-tools">${tiles.map(([r,i,l])=>`<button class="v19-tool" onclick="app.go('${r}')">${icon(i)}<strong>${l}</strong></button>`).join('')}</div></div>`;
}
function adminPage(){
 if(!isAdmin()) return denied();
 return `<div class="v19-container">${pageTitle('ADMINISTRATION','Administration','Réglages de l’application.')}
 <div class="v19-admin-cards">
  <button class="v19-card v19-admin-action" onclick="app.manageSpecialtyNotes()">${icon('app')}<div><h3>Post-it spécialités</h3><p>Modifier l’information visible par Football, Escalade ou Gymnastique.</p></div></button>
  <button class="v19-card v19-admin-action" onclick="app.manageTerms()">${icon('cal')}<div><h3>Dates des trimestres</h3><p>Configurer les dates limite et fins de trimestre.</p></div></button>
  <button class="v19-card v19-admin-action" onclick="app.openLicenseImport()">${icon('users')}<div><h3>Importer des licenciés</h3><p>Ajouter plusieurs élèves depuis un fichier Excel ou CSV.</p></div></button>
 </div></div>`;
}
function denied(){return `<div class="v19-container"><div class="v19-empty">Cet espace n’est pas accessible avec ce profil.</div></div>`}
function render(){
 const pages={home:homePage,calendar:calendarPage,convocations:convocationsPage,licenses:licensesPage,orders:ordersPage,reports:reportsPage,appreciations:appreciationsPage,shop:shopPage,documents:documentsPage,more:morePage,admin:adminPage};
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
function go(r){state.route=r;state.search='';render()}
function theme(){state.dark=!state.dark;localStorage.setItem('bs-dark',state.dark?'1':'0');document.body.classList.toggle('dark',state.dark);render()}
function search(v){state.search=v;render()}

function editEvent(id){
 if(!isManager())return; const e=id?(state.data.events||[]).find(x=>x.id===id):null;
 const m=modal(id?'Modifier un événement':'Ajouter un événement',`<form id="v19-event-form" class="v19-form">
  <label><span>Titre</span><input name="title" required value="${esc(e?.title||'')}"></label>
  <label><span>Catégorie</span><select name="ageCategory">${options(AGE_CATEGORIES,e?.ageCategory||'Toutes catégories')}</select></label>
  <label><span>Spécialité</span><select name="specialty">${options(SPECIALTIES,e?.specialty||'Association Sportive')}</select></label>
  <label><span>Date</span><input type="date" name="date" required value="${esc(e?.date||new Date().toISOString().slice(0,10))}"></label>
  <label><span>Heure de départ</span><input type="time" name="startTime" value="${esc(e?.startTime||'')}"></label>
  <label><span>Heure de retour</span><input type="time" name="endTime" value="${esc(e?.endTime||'')}"></label>
  <label class="full"><span>Lieu</span><input name="place" value="${esc(e?.place||'')}"></label>
  <div class="full v19-modal-actions"><button class="v19-btn" type="submit">Enregistrer</button></div></form>`,true);
 m.querySelector('#v19-event-form').onsubmit=ev=>{ev.preventDefault();const fd=new FormData(ev.currentTarget),o={id:e?.id||uid('e'),title:String(fd.get('title')||'').trim(),ageCategory:fd.get('ageCategory'),specialty:fd.get('specialty'),date:fd.get('date'),startTime:fd.get('startTime'),endTime:fd.get('endTime'),place:String(fd.get('place')||'').trim(),convocationId:e?.convocationId||null};e?Object.assign(e,o):state.data.events.push(o);save();closeModal();render()};
}
function deleteEvent(id){if(!isManager()||!confirm('Supprimer cet événement ?'))return;state.data.events=state.data.events.filter(e=>e.id!==id);save();render()}

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
 m.querySelector('#v19-conv-form').onsubmit=ev=>{ev.preventDefault();const fd=new FormData(ev.currentTarget),o={id:c?.id||uid('c'),activity:fd.get('activity'),title:String(fd.get('title')||'').trim(),ageCategory:fd.get('ageCategory'),specialty:fd.get('specialty'),date:fd.get('date'),place:String(fd.get('place')||'').trim(),departure:fd.get('departure'),returnTime:fd.get('returnTime'),meetingPoint:String(fd.get('meetingPoint')||'').trim(),teacher:fd.get('teacher'),extraInfo:String(fd.get('extraInfo')||'').trim(),studentIds:fd.getAll('studentIds')};if(!o.teacher)return alert('Choisissez le professeur référent.');c?Object.assign(c,o):state.data.convocations.push(o);(state.data.events||[]).forEach(e=>{if(e.convocationId===o.id)e.convocationId=null});const match=(state.data.events||[]).find(e=>e.date===o.date&&e.specialty===o.specialty&&e.title===o.title);if(match)match.convocationId=o.id;save();closeModal();render()};
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
 ws.getCell('A4').value='MARTIN Léo';ws.getCell('B4').value='5e Jacqueline AURIOL';ws.getCell('C4').value='Benjamin';ws.getColumn(1).width=32;ws.getColumn(2).width=32;ws.getColumn(3).width=22;for(let r=4;r<=200;r++)ws.getCell(r,3).dataValidation={type:'list',formulae:[`"${LICENSE_CATEGORIES.join(',')}"`]};
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

window.app={
 go,theme,profile,setRole,closeModal,search,
 editEvent,deleteEvent,openConv,editConv,deleteConv,
 editLicense,toggleLicensePayment,licenseFilter,clearLicenseFilters,
 editReport,deleteReport,order,toggleOrder,
 setTerm,editApp,saveAppDraft,validateApp,copyApp,
 manageSpecialtyNotes,saveSpecialtyNote,manageTerms,
 openLicenseImport,commitImport,downloadLicenseTemplate,openDoc,exportExcel,
 readData:()=>state.data, role:()=>state.role, roleSpecialty, studentName
};
render();

if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();
