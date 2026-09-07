(() => {
'use strict';

const PATCH_VERSION = 'v5-20260907-2';
const STORE = 'bs-app-data-v4';
const ROLE_KEY = 'bs-demo-role-v4';
const MIGRATION_KEY = 'bs-v5-migrated';

const LICENSE_CATEGORIES = [
  'Benjamin','Benjamine','Minime fille','Minime garçon',
  'Section foot Benjamin','Section foot Minime garçon','Lycéen','Lycéenne'
];
const SHOP_PAYMENTS = ['Espèces','Virement','Chèque'];
const SHOP_SIZES = ['7/8 ans','9/11 ans','12/13 ans','XS','S','M','L','XL','XXL','XXXL','XXXXL'];
const TEACHERS = ['Thomas GONTIER','Guillaume DHERVILLY','Lucas RIGAUX','Maxime PETIT'];
const SWEAT_COLORS = ['Bleu (Sapphire Blue)','Gris (Graphite Heather)','Jaune (Gold)'];
const TSHIRT_COLORS = ['Bleu (Sky Blue)'];

const FALLBACK = {
  events:[
    {id:'e1',title:'Entraînement AS multisports',ageCategory:'Toutes catégories',specialty:'Association Sportive',date:'2026-09-09',startTime:'13:30',endTime:'16:00',place:'Gymnase du Bon Sauveur'},
    {id:'e2',title:'Entraînement section football',ageCategory:'Benjamin',specialty:'Section Football',date:'2026-09-10',startTime:'15:30',endTime:'17:30',place:'Stade'},
    {id:'e3',title:'Option escalade',ageCategory:'Minime fille',specialty:'Option Escalade',date:'2026-09-10',startTime:'15:30',endTime:'18:00',place:'Salle d’escalade'},
    {id:'e4',title:'Sport-études gymnastique',ageCategory:'Toutes catégories',specialty:'Sport-études Gymnastique',date:'2026-09-08',startTime:'14:30',endTime:'18:45',place:'Saint-Loise Gymnastique'},
    {id:'e5',title:'UGSEL Football — secteur',ageCategory:'Benjamin',specialty:'Section Football',date:'2026-09-23',startTime:'12:45',endTime:'17:30',place:'Saint-Lô',convocationId:'c1'}
  ],
  documents:[
    {id:'d1',title:'Règlement de l’Association Sportive',specialty:'Association Sportive',date:'2026-09-01',description:'Règles de fonctionnement et informations utiles.',url:'#',featured:true},
    {id:'d2',title:'Horaires section football',specialty:'Section Football',date:'2026-09-01',description:'Horaires hebdomadaires de la section.',url:'#',featured:true},
    {id:'d3',title:'Horaires option escalade',specialty:'Option Escalade',date:'2026-09-01',description:'Organisation et horaires de l’option.',url:'#',featured:true}
  ],
  products:[
    {id:'p1',name:'Sweat officiel',description:'Sweat aux couleurs de l’Association Sportive.',price:35,deadline:'2026-10-05',paymentLink:'',active:true},
    {id:'p2',name:'T-shirt Association Sportive',description:'T-shirt technique.',price:15,deadline:'2026-10-05',paymentLink:'',active:true}
  ],
  orders:[], reports:[], licenses:[], convocations:[]
};

function clone(x){ return JSON.parse(JSON.stringify(x)); }
function readData(){
  let stored={};
  try { stored=JSON.parse(localStorage.getItem(STORE)||'{}')||{}; } catch(e){ console.warn('V5 storage',e); }
  return {...clone(FALLBACK),...stored};
}
function writeData(data){ localStorage.setItem(STORE,JSON.stringify(data)); }
function uid(p='x'){ return p+Math.random().toString(36).slice(2,10); }
function role(){ return localStorage.getItem(ROLE_KEY)||'public'; }
function canManage(){ return role()==='teacher_as'||role()==='admin'; }
function esc(v=''){ return String(v??'').replace(/[&<>\"]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[s])); }
function fmtDate(d){ if(!d)return ''; return new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(d+'T12:00:00')); }
function currentRouteTitle(){ return document.querySelector('.page-title h1')?.textContent?.trim()||''; }

function applyDataRules(data){
  data.products=(data.products||[]).map(p=>{
    const name=(p.name||'').toLowerCase();
    if(name.includes('sweat')) return {...p,sizes:[...SHOP_SIZES],colors:[...SWEAT_COLORS],image:'assets/shop-sweat-sapphire.webp',paymentMethods:[...SHOP_PAYMENTS]};
    if(name.includes('shirt')) return {...p,sizes:[...SHOP_SIZES],colors:[...TSHIRT_COLORS],image:'assets/shop-tshirt-skyblue.webp',paymentMethods:[...SHOP_PAYMENTS]};
    return {...p,sizes:p.sizes?.length?p.sizes:[...SHOP_SIZES],paymentMethods:[...SHOP_PAYMENTS]};
  });
  data.licenses=(data.licenses||[]).map(l=>({...l,category:l.category==='Lycée'?'Lycéen':l.category}));
  data.reports=(data.reports||[]).map(r=>({...r,teacher:r.teacher==='M. RIGAUX'?'Lucas RIGAUX':r.teacher}));
  return data;
}

let pendingOrderMeta=null;
const nativeSetItem=Storage.prototype.setItem;
Storage.prototype.setItem=function(key,value){
  if(this===localStorage&&key===STORE){
    try{
      const data=applyDataRules(JSON.parse(value));
      if(pendingOrderMeta){
        const matches=(data.orders||[]).filter(o=>o.productId===pendingOrderMeta.productId&&!o.color);
        if(matches.length) matches[matches.length-1].color=pendingOrderMeta.color;
        pendingOrderMeta=null;
      }
      value=JSON.stringify(data);
    }catch(e){ console.warn('V5 save patch',e); }
  }
  return nativeSetItem.call(this,key,value);
};

if(localStorage.getItem(MIGRATION_KEY)!==PATCH_VERSION){
  const data=applyDataRules(readData());
  writeData(data);
  localStorage.setItem(MIGRATION_KEY,PATCH_VERSION);
  location.reload();
  return;
}

function setOptions(select,items,includeAll=false){
  if(!select)return;
  const current=select.value;
  select.innerHTML=(includeAll?'<option value="">Tous</option>':'')+items.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
  if([...select.options].some(o=>o.value===current)) select.value=current;
}

function productInfoFromModal(){
  const text=document.querySelector('#modal .order-summary strong')?.textContent||'';
  if(/sweat/i.test(text)) return {kind:'sweat',colors:SWEAT_COLORS};
  if(/shirt/i.test(text)) return {kind:'tshirt',colors:TSHIRT_COLORS};
  return {kind:'other',colors:[]};
}

function patchOrderModal(productId){
  const modal=document.getElementById('modal');
  if(!modal)return;
  setOptions(modal.querySelector('select[name="size"]'),SHOP_SIZES);
  setOptions(modal.querySelector('select[name="paymentMethod"]'),SHOP_PAYMENTS);
  const info=productInfoFromModal();
  const form=modal.querySelector('form');
  if(!form)return;
  let colorValue=info.colors[0]||'';
  if(info.colors.length>1){
    const wrap=document.createElement('label');
    wrap.className='field';
    wrap.innerHTML=`<span>Couleur</span><select name="v5color">${info.colors.map(c=>`<option>${esc(c)}</option>`).join('')}</select>`;
    const quantity=form.querySelector('input[name="quantity"]')?.closest('.field');
    form.insertBefore(wrap,quantity||form.querySelector('.order-summary'));
  }else if(info.colors.length===1){
    const wrap=document.createElement('div');
    wrap.className='field single-color';
    wrap.innerHTML=`<span>Couleur</span><strong>${esc(info.colors[0])}</strong><input type="hidden" name="v5color" value="${esc(info.colors[0])}">`;
    const quantity=form.querySelector('input[name="quantity"]')?.closest('.field');
    form.insertBefore(wrap,quantity||form.querySelector('.order-summary'));
  }
  form.addEventListener('submit',()=>{
    colorValue=form.querySelector('[name="v5color"]')?.value||colorValue;
    pendingOrderMeta={productId,color:colorValue};
  },true);
}

function patchTeacherModal(){
  const modal=document.getElementById('modal');
  const input=modal?.querySelector('input[name="teacher"]');
  if(!input)return;
  const field=input.closest('.field');
  const current=(input.value||'').split(/\s*[·,/;+]\s*/).filter(Boolean);
  field.innerHTML=`<span>Enseignant(s) référent(s)</span><div class="teacher-picker">${TEACHERS.map(t=>`<label><input type="checkbox" value="${esc(t)}" ${current.includes(t)?'checked':''}><span>${esc(t)}</span></label>`).join('')}</div><input type="hidden" name="teacher" value="${esc(current.join(' · '))}">`;
  const hidden=field.querySelector('input[name="teacher"]');
  const sync=()=>{ hidden.value=[...field.querySelectorAll('input[type="checkbox"]:checked')].map(x=>x.value).join(' · '); };
  field.querySelectorAll('input[type="checkbox"]').forEach(cb=>cb.addEventListener('change',sync));
  modal.querySelector('form')?.addEventListener('submit',sync,true);
}

function patchLicenseModal(){ setOptions(document.querySelector('#modal select[name="category"]'),LICENSE_CATEGORIES); }
function patchLicenseFilters(){
  document.querySelectorAll('.filter-field').forEach(field=>{
    if(field.querySelector('span')?.textContent.trim().toUpperCase()==='CATÉGORIE') setOptions(field.querySelector('select'),LICENSE_CATEGORIES,true);
  });
}
function colorSwatch(color){ if(color.includes('Sapphire'))return '#1389bd'; if(color.includes('Graphite'))return '#60646b'; if(color.includes('Gold'))return '#f0c400'; return '#b9def1'; }

function patchShopCards(){
  document.querySelectorAll('.product').forEach(card=>{
    const name=card.querySelector('.event-title')?.textContent||'';
    const photo=card.querySelector('.product-photo img');
    if(photo){ photo.classList.add('shop-product-visual'); if(/sweat/i.test(name)) photo.src='assets/shop-sweat-sapphire.webp'; else if(/shirt/i.test(name)) photo.src='assets/shop-tshirt-skyblue.webp'; }
    if(card.querySelector('.product-colors'))return;
    const colors=/sweat/i.test(name)?SWEAT_COLORS:/shirt/i.test(name)?TSHIRT_COLORS:[];
    if(colors.length){
      const row=document.createElement('div'); row.className='product-colors';
      row.innerHTML=colors.map(c=>`<span title="${esc(c)}"><i style="background:${colorSwatch(c)}"></i>${esc(c.replace(/.*\((.*)\).*/,'$1'))}</span>`).join('');
      card.querySelector('.product-price')?.after(row);
    }
  });
}

function sortedOrders(data){ return (data.orders||[]).slice().sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')); }
function patchOrdersPage(){
  if(currentRouteTitle()!=='Gestion des commandes')return;
  const data=readData();
  const subtitle=document.querySelector('.page-title p'); if(subtitle)subtitle.textContent='Paiement et distribution.';
  const stats=document.querySelectorAll('.stats-row .stat strong'); const rows=sortedOrders(data);
  if(stats[0])stats[0].textContent=rows.length; if(stats[1])stats[1].textContent=rows.filter(o=>!o.paid).length; if(stats[2])stats[2].textContent=rows.filter(o=>!o.distributed).length;
  const table=document.querySelector('.admin-table'); if(!table)return;
  const heads=[...table.querySelectorAll('thead th')]; const readyIndex=heads.findIndex(h=>h.textContent.trim()==='Prêt');
  if(readyIndex>=0){ table.querySelectorAll('tr').forEach(tr=>tr.children[readyIndex]?.remove()); }
  const newHeads=[...table.querySelectorAll('thead th')];
  if(!newHeads.some(h=>h.textContent.trim()==='Couleur')){
    const sizeIndex=newHeads.findIndex(h=>h.textContent.trim()==='Taille'); const th=document.createElement('th'); th.textContent='Couleur';
    const ref=table.querySelector('thead tr').children[sizeIndex+1]; table.querySelector('thead tr').insertBefore(th,ref||null);
    table.querySelectorAll('tbody tr').forEach((tr,i)=>{ const td=document.createElement('td'); td.textContent=rows[i]?.color||'—'; const cell=tr.children[sizeIndex+1]; tr.insertBefore(td,cell||null); });
  }
}

function findByCard(type,card){
  const data=readData(); const title=card.querySelector('.event-title')?.textContent?.trim()||''; const list=data[type]||[];
  if(type==='events') return list.find(x=>x.title===title&&(!x.place||card.textContent.includes(x.place)))||list.find(x=>x.title===title);
  if(type==='documents') return list.find(x=>x.title===title);
  if(type==='convocations') return list.find(x=>card.textContent.includes(x.title));
}
function deleteItem(type,id,label){
  if(!canManage())return; if(!confirm(`Supprimer ${label} ? Cette action est définitive.`))return;
  const data=readData(); data[type]=(data[type]||[]).filter(x=>x.id!==id);
  if(type==='convocations') (data.events||[]).forEach(e=>{ if(e.convocationId===id)e.convocationId=null; });
  writeData(data); location.reload();
}
function addManageButton(container,text,cls,handler){ const b=document.createElement('button'); b.type='button'; b.className=`btn tiny ${cls||'secondary'}`; b.textContent=text; b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();handler();}); container.appendChild(b); }

function patchCalendarManagement(){
  if(currentRouteTitle()!=='À venir')return;
  const actionBar=document.querySelector('.page-title .top-actions-inline'); actionBar?.querySelectorAll('button').forEach(b=>{ const t=b.textContent.trim(); if(t==='PDF'||t==='Excel')b.remove(); });
  if(!canManage())return;
  document.querySelectorAll('.week-list .week-card, .container > .grid .week-card').forEach(card=>{
    if(card.querySelector('.v5-manage'))return; const ev=findByCard('events',card); if(!ev)return;
    const box=document.createElement('div'); box.className='v5-manage'; addManageButton(box,'Modifier','secondary',()=>window.app.editEvent(ev.id)); addManageButton(box,'Supprimer','danger',()=>deleteItem('events',ev.id,'cet événement')); card.appendChild(box);
  });
}
function patchDocumentsManagement(){
  if(currentRouteTitle()!=='Documents'||!canManage())return;
  document.querySelectorAll('.doc-card').forEach(card=>{
    if(card.querySelector('.v5-doc-manage'))return; const doc=findByCard('documents',card); if(!doc)return; const actions=card.querySelector('.actions')||card; const box=document.createElement('span'); box.className='v5-doc-manage';
    addManageButton(box,'Modifier','secondary',()=>window.app.editDocument(doc.id)); addManageButton(box,'Supprimer','danger',()=>deleteItem('documents',doc.id,'ce document')); actions.appendChild(box);
  });
}
function patchConvocationsManagement(){
  if(currentRouteTitle()!=='Convocations'||!canManage())return;
  document.querySelectorAll('.convocation-card').forEach(card=>{
    if(card.querySelector('.v5-manage'))return; const c=findByCard('convocations',card); if(!c)return; const box=document.createElement('div'); box.className='v5-manage';
    addManageButton(box,'Modifier','secondary',()=>window.app.editConv(c.id)); addManageButton(box,'Supprimer','danger',()=>deleteItem('convocations',c.id,'cette convocation')); card.appendChild(box);
  });
}
function patchReportsManagement(){
  if(currentRouteTitle()!=='Bilans AS'||!canManage())return;
  document.querySelectorAll('.report-card').forEach(card=>{
    if(card.querySelector('.v5-delete-report'))return; const data=readData(); const activity=card.querySelector('.event-title')?.textContent?.trim(); const report=(data.reports||[]).find(r=>r.activity===activity&&card.textContent.includes(String(r.participants??'')))||(data.reports||[]).find(r=>r.activity===activity); if(!report)return;
    const b=document.createElement('button'); b.className='btn danger tiny v5-delete-report'; b.textContent='Supprimer'; b.onclick=e=>{e.stopPropagation();deleteItem('reports',report.id,'ce bilan');}; card.querySelector('.row-between')?.appendChild(b);
  });
}
function patchAll(){ patchLicenseFilters(); patchShopCards(); patchOrdersPage(); patchCalendarManagement(); patchDocumentsManagement(); patchConvocationsManagement(); patchReportsManagement(); }

function openPatchModal(title,body,onSubmit,wide=false){
  document.getElementById('modal')?.remove(); const wrap=document.createElement('div'); wrap.className='modal-backdrop'; wrap.id='modal'; wrap.innerHTML=`<div class="modal ${wide?'wide':''}"><div class="modal-head"><h2>${esc(title)}</h2><button type="button" class="icon-btn v5-close">×</button></div>${body}</div>`; document.body.appendChild(wrap);
  wrap.querySelector('.v5-close').onclick=()=>wrap.remove(); const form=wrap.querySelector('form'); if(form)form.addEventListener('submit',e=>{e.preventDefault();onSubmit?.(new FormData(form),wrap);});
}

const originalOrder=window.app.order.bind(window.app); window.app.order=function(id){ originalOrder(id); patchOrderModal(id); };
const originalEditReport=window.app.editReport.bind(window.app); window.app.editReport=function(id){ originalEditReport(id); patchTeacherModal(); };
const originalEditLicense=window.app.editLicense.bind(window.app); window.app.editLicense=function(id){ originalEditLicense(id); patchLicenseModal(); };

window.app.editDocument=function(id){
  if(!canManage())return; const data=readData(); const doc=id?(data.documents||[]).find(x=>x.id===id):null; const specialties=['Association Sportive','Section Football','Option Escalade','Sport-études Gymnastique'];
  openPatchModal(id?'Modifier le document':'Ajouter un document',`<form class="form-grid"><label class="field full"><span>Titre</span><input name="title" required value="${esc(doc?.title||'')}"></label><label class="field"><span>Spécialité</span><select name="specialty">${specialties.map(s=>`<option ${s===doc?.specialty?'selected':''}>${esc(s)}</option>`).join('')}</select></label><label class="field"><span>Date</span><input type="date" name="date" value="${esc(doc?.date||new Date().toISOString().slice(0,10))}"></label><label class="field full"><span>Description</span><textarea name="description">${esc(doc?.description||'')}</textarea></label><label class="field full"><span>Lien du PDF</span><input type="url" name="url" placeholder="https://…" value="${doc?.url==='#'?'':esc(doc?.url||'')}"></label><label class="field full checkbox-line"><input type="checkbox" name="featured" ${doc?.featured?'checked':''}><span>Document important sur l’accueil</span></label><div class="field full modal-actions"><button class="btn" type="submit">Enregistrer</button></div></form>`,fd=>{
    const item={id:doc?.id||uid('d'),title:fd.get('title')?.trim(),specialty:fd.get('specialty'),date:fd.get('date'),description:fd.get('description')?.trim(),url:fd.get('url')?.trim()||'#',featured:fd.get('featured')==='on'}; if(doc)Object.assign(doc,item);else(data.documents||(data.documents=[])).push(item); writeData(data); location.reload();
  });
};

const originalExportExcel=window.app.exportExcel.bind(window.app);
window.app.exportExcel=function(kind){
  if(kind!=='orders')return originalExportExcel(kind); if(!window.XLSX)return alert('Le module Excel est encore en chargement.'); const data=readData(); const products=Object.fromEntries((data.products||[]).map(p=>[p.id,p.name]));
  const rows=sortedOrders(data).map(o=>({'Élève':o.studentName,'Classe':o.className,'Produit':products[o.productId]||'Produit','Couleur':o.color||'','Taille':o.size,'Quantité':o.quantity||1,'Paiement':o.paymentMethod,'Payé':o.paid?'Oui':'Non','Distribué':o.distributed?'Oui':'Non','Date':o.createdAt}));
  const wb=XLSX.utils.book_new(),ws=XLSX.utils.json_to_sheet(rows.length?rows:[{Information:'Aucune commande'}]); XLSX.utils.book_append_sheet(wb,ws,'Commandes'); XLSX.writeFile(wb,'Commandes_AS.xlsx');
};

window.app.exportCalendarPDF=async function(){
  if(!window.jspdf?.jsPDF)return alert('Le module PDF est encore en chargement.'); const data=readData(); const events=(data.events||[]).slice().sort((a,b)=>(a.date+(a.startTime||'')).localeCompare(b.date+(b.startTime||''))); if(!events.length)return alert('Aucun événement à exporter.');
  const {jsPDF}=window.jspdf; const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'}); const W=297,H=210; const colors={'Association Sportive':[255,210,26],'Section Football':[45,135,235],'Option Escalade':[90,102,214],'Sport-études Gymnastique':[139,83,205]}; const logo=await imageDataV5('assets/logo-as.png');
  const first=events[0]?.date,last=events[events.length-1]?.date,period=first&&last?`${fmtDate(first)} — ${fmtDate(last)}`:'';
  for(let pageStart=0,page=0;pageStart<events.length;pageStart+=6,page++){
    if(page)doc.addPage(); doc.setFillColor(245,247,251);doc.rect(0,0,W,H,'F'); doc.setFillColor(10,58,139);doc.rect(0,0,W,43,'F'); doc.setFillColor(255,210,26);doc.rect(0,43,W,5,'F');
    doc.setFillColor(255,255,255);doc.roundedRect(12,7,30,30,5,5,'F'); if(logo)try{doc.addImage(logo,'PNG',15,10,24,24)}catch(e){}
    doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(25);doc.text('CALENDRIER SPORTIF',50,18); doc.setFont('helvetica','normal');doc.setFontSize(11);doc.text('ASSOCIATION SPORTIVE DU BON SAUVEUR · SAINT-LÔ',50,28); doc.setFontSize(9);doc.text(period.toUpperCase(),50,35);
    doc.setFillColor(255,255,255);doc.roundedRect(226,11,57,21,4,4,'F'); doc.setTextColor(10,58,139);doc.setFont('helvetica','bold');doc.setFontSize(8);doc.text('PROGRAMME AS',232,19); doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.text('À afficher dans l’établissement',232,26);
    events.slice(pageStart,pageStart+6).forEach((e,j)=>{
      const col=j%2,row=Math.floor(j/2),x=13+col*140,y=57+row*45,accent=colors[e.specialty]||[255,210,26]; doc.setFillColor(255,255,255);doc.setDrawColor(221,228,239);doc.roundedRect(x,y,131,38,4,4,'FD'); doc.setFillColor(...accent);doc.roundedRect(x,y,7,38,4,4,'F');doc.rect(x+4,y,3,38,'F'); doc.setFillColor(242,246,252);doc.roundedRect(x+12,y+6,27,26,4,4,'F');
      const d=new Date(e.date+'T12:00:00'); doc.setTextColor(10,58,139);doc.setFont('helvetica','bold');doc.setFontSize(15);doc.text(String(d.getDate()).padStart(2,'0'),x+18,y+17); doc.setFontSize(7.5);doc.text(d.toLocaleDateString('fr-FR',{month:'short'}).replace('.','').toUpperCase(),x+17,y+24); doc.setFontSize(6.5);doc.setTextColor(105,118,143);doc.text(d.toLocaleDateString('fr-FR',{weekday:'short'}).replace('.','').toUpperCase(),x+17,y+29);
      doc.setTextColor(19,33,58);doc.setFont('helvetica','bold');doc.setFontSize(11.5);doc.text(fitV5(e.title,45),x+44,y+11); doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(88,101,126);doc.text(fitV5(`${e.ageCategory||'Toutes catégories'}`,52),x+44,y+18); doc.setFont('helvetica','bold');doc.setTextColor(...accent.map(v=>Math.max(0,v-35)));doc.text(fitV5(e.specialty||'',45),x+44,y+25); doc.setFont('helvetica','normal');doc.setTextColor(64,77,100);doc.setFontSize(7.8);doc.text(fitV5(`${e.startTime||''}${e.endTime?' → '+e.endTime:''}   •   ${e.place||''}`,58),x+44,y+32);
      const hasConv=(data.convocations||[]).some(c=>c.id===e.convocationId||(c.date===e.date&&c.specialty===e.specialty&&c.title===e.title)); if(hasConv){doc.setFillColor(10,58,139);doc.roundedRect(x+103,y+5,24,6,2,2,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(5.8);doc.text('CONVOCATION',x+106,y+9.1);}
    });
    doc.setFillColor(10,58,139);doc.rect(0,H-15,W,15,'F'); doc.setFillColor(255,210,26);doc.rect(0,H-15,85,15,'F'); doc.setTextColor(32,38,50);doc.setFont('helvetica','bold');doc.setFontSize(8);doc.text('BON SAUVEUR · SAINT-LÔ',13,H-6); doc.setTextColor(255,255,255);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text('Toutes les convocations et informations sont disponibles dans l’application AS.',96,H-6);
  }
  doc.save('Calendrier_Affichage_AS_Bon_Sauveur.pdf');
};
function fitV5(t,n){t=String(t||'');return t.length>n?t.slice(0,n-1)+'…':t;}
async function imageDataV5(url){try{const r=await fetch(url);const b=await r.blob();return await new Promise((res,rej)=>{const f=new FileReader();f.onload=()=>res(f.result);f.onerror=rej;f.readAsDataURL(b);});}catch{return null;}}

const observer=new MutationObserver(()=>requestAnimationFrame(patchAll)); observer.observe(document.getElementById('app'),{childList:true,subtree:true}); patchAll();
})();
