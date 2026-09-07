(() => {
'use strict';

const VERSION='v6-20260907-1';
const STORE='bs-app-data-v4';
const ROLE_KEY='bs-demo-role-v4';
const MIGRATION_KEY='bs-v6-migrated';
const BLUE='0757C9', NAVY='13213A', YELLOW='FFD21A', LIGHT='F5F8FC', MUTED='65738A';
const LICENSE_CATEGORIES=['Benjamin','Benjamine','Minime fille','Minime garçon','Lycéen','Lycéenne'];
const ROLE_SPECIALTY={educator_escalade:'Option Escalade',educator_football:'Section Football',educator_gymnastique:'Sport-études Gymnastique'};
const SPEC_COLOR={'Association Sportive':'FFD21A','Section Football':'3F95F4','Option Escalade':'6974DE','Sport-études Gymnastique':'9C63D5'};

function esc(v=''){return String(v??'').replace(/[&<>\"]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[s]));}
function readData(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')||{}}catch{return{}}}
function writeData(d){localStorage.setItem(STORE,JSON.stringify(d));}
function role(){return localStorage.getItem(ROLE_KEY)||'public';}
function educatorSpecialty(){return ROLE_SPECIALTY[role()]||null;}
function isEducator(){return !!educatorSpecialty();}
function canManage(){return role()==='teacher_as'||role()==='admin';}
function fmtDate(d){if(!d)return'';return new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(d+'T12:00:00'));}
function cleanFile(s){return String(s||'export').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'');}

function migrate(){
  if(localStorage.getItem(MIGRATION_KEY)===VERSION)return;
  const d=readData();
  d.licenses=(d.licenses||[]).map(l=>{let category=l.category;if(category==='Section foot Benjamin')category='Benjamin';if(category==='Section foot Minime garçon')category='Minime garçon';if(category==='Lycée')category='Lycéen';return {...l,category};});
  writeData(d);localStorage.setItem(MIGRATION_KEY,VERSION);
}
migrate();

function hideDeprecatedLicenseOptions(){
  document.querySelectorAll('select[name="category"], .filter-field select').forEach(select=>{
    const label=select.closest('.filter-field,.field')?.querySelector('span')?.textContent?.trim().toLowerCase()||'';
    if(!label.includes('catégorie'))return;
    [...select.options].forEach(o=>{if(o.value==='Section foot Benjamin'||o.value==='Section foot Minime garçon'){o.hidden=true;o.disabled=true;if(o.selected)select.value=select.closest('.filter-field')?'':LICENSE_CATEGORIES[0];}});
  });
}

function currentRoute(){
  const active=document.querySelector('.bottom-nav .nav-item.active span:last-child')?.textContent?.trim();
  if(active==='Accueil')return'home';if(active==='Calendrier')return'calendar';if(active==='Appréciations')return'appreciations';
  const title=document.querySelector('.page-title h1')?.textContent?.trim();if(title==='Appréciations')return'appreciations';if(title==='À venir')return'calendar';return'home';
}
function patchEducatorNav(){
  if(!isEducator())return;const nav=document.querySelector('.bottom-nav');if(!nav||nav.dataset.v6==='1')return;
  const cur=currentRoute(),items=[['home','⌂','Accueil'],['calendar','▣','Calendrier'],['appreciations','✎','Appréciations']];
  nav.innerHTML=items.map(([r,i,l])=>`<button class="nav-item ${cur===r?'active':''}" onclick="app.go('${r}')"><span class="nav-ico">${i}</span><span>${l}</span></button>`).join('');nav.dataset.v6='1';nav.classList.add('nav-3');
}
function cardSpecialty(card){return card.querySelector('.badge')?.textContent?.trim()||'';}
function filterEducatorDates(){
  const sp=educatorSpecialty();if(!sp)return;const title=document.querySelector('.page-title h1')?.textContent?.trim();
  if(title==='À venir'){
    document.querySelector('.container')?.classList.add('v6-calendar-page');
    document.querySelectorAll('.container > .grid .week-card').forEach(card=>{if(cardSpecialty(card)!==sp)card.remove();});
    const p=document.querySelector('.page-title p');if(p)p.textContent=`Uniquement les rendez-vous liés à ${sp}.`;
    const grid=document.querySelector('.container > .grid');if(grid&&!grid.querySelector('.week-card')&&!grid.querySelector('.empty'))grid.innerHTML='<div class="empty">Aucun rendez-vous à venir pour cet espace.</div>';
  }
  const homeWeek=document.querySelector('.week-list');if(homeWeek){homeWeek.querySelectorAll('.week-card').forEach(card=>{if(cardSpecialty(card)!==sp)card.remove();});if(!homeWeek.querySelector('.week-card')&&!homeWeek.querySelector('.empty'))homeWeek.innerHTML='<div class="empty">Aucune date prévue cette semaine pour cet espace.</div>';}
}
function patchCalendarUI(){
  if(document.querySelector('.page-title h1')?.textContent?.trim()!=='À venir')return;
  const container=document.querySelector('.container');container?.classList.add('v6-calendar-page');const bar=document.querySelector('.page-title .top-actions-inline');
  if(bar){
    [...bar.querySelectorAll('button')].forEach(b=>{const t=b.textContent.trim();if(t==='PDF'||t==='Excel')b.remove();if(t==='PDF affichage'){b.textContent=canManage()?'Télécharger le calendrier':'Télécharger le calendrier PDF';b.classList.add('v6-download');}});
    if(!bar.querySelector('.v6-download')){const b=document.createElement('button');b.className='btn yellow v6-download';b.textContent=canManage()?'Télécharger le calendrier':'Télécharger le calendrier PDF';b.onclick=()=>window.app.exportCalendarPDF();bar.appendChild(b);}
  }
  document.querySelectorAll('.container > .grid .week-card').forEach((card,i)=>{card.classList.add('v6-event-card');if(!card.querySelector('.v6-card-index')){const chip=document.createElement('span');chip.className='v6-card-index';chip.textContent=String(i+1).padStart(2,'0');card.appendChild(chip);}});
}

async function imageData(url){try{const r=await fetch(url);const b=await r.blob();return await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=rej;fr.readAsDataURL(b);});}catch{return null}}
function hexRgb(hex){hex=hex.replace('#','');return [parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16)];}
function clip(doc,text,width,max=2){return doc.splitTextToSize(String(text||''),width).slice(0,max);}
function relevantEvents(){const d=readData();let events=(d.events||[]).slice();const sp=educatorSpecialty();if(sp)events=events.filter(e=>e.specialty===sp);return events.sort((a,b)=>(a.date+(a.startTime||'')).localeCompare(b.date+(b.startTime||'')));}

async function exportCalendarPDF(){
  if(!window.jspdf?.jsPDF){alert('Le module PDF est encore en chargement.');return;}const events=relevantEvents();if(!events.length){alert('Aucun événement à exporter.');return;}
  const d=readData(),{jsPDF}=window.jspdf,doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'}),W=297,H=210;
  const blue=hexRgb(BLUE),navy=hexRgb(NAVY),yellow=hexRgb(YELLOW),light=hexRgb(LIGHT),muted=hexRgb(MUTED),logo=await imageData('assets/logo-as.png');const titleSpecialty=educatorSpecialty();
  for(let start=0,page=0;start<events.length;start+=6,page++){
    if(page)doc.addPage();doc.setFillColor(...light);doc.rect(0,0,W,H,'F');doc.setFillColor(...navy);doc.rect(0,0,W,47,'F');doc.setFillColor(...yellow);doc.triangle(208,0,297,0,297,47,'F');doc.setFillColor(...blue);doc.triangle(245,0,297,47,245,47,'F');
    if(logo)try{doc.addImage(logo,'PNG',12,6,34,34);}catch{}
    doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text('ASSOCIATION SPORTIVE DU BON SAUVEUR',53,11);doc.setFontSize(27);doc.text(titleSpecialty?`CALENDRIER ${titleSpecialty.toUpperCase()}`:'CALENDRIER AS',53,25);doc.setFont('helvetica','normal');doc.setFontSize(10.5);doc.text('LES RENDEZ-VOUS À NE PAS MANQUER',53,34);
    doc.setTextColor(...navy);doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.text('SAINT-LÔ',259,13);doc.setFontSize(16);doc.text(`${fmtDate(events[start].date)} →`,228,28);doc.text(fmtDate(events[Math.min(start+5,events.length-1)].date),228,36);
    events.slice(start,start+6).forEach((e,j)=>{
      const col=j%3,row=Math.floor(j/3),x=12+col*92,y=58+row*61,w=84,h=50,accent=hexRgb(SPEC_COLOR[e.specialty]||YELLOW);
      doc.setFillColor(255,255,255);doc.setDrawColor(220,228,239);doc.roundedRect(x,y,w,h,5,5,'FD');doc.setFillColor(...accent);doc.roundedRect(x,y,w,7,5,5,'F');doc.rect(x,y+4,w,3,'F');doc.setFillColor(...navy);doc.circle(x+14,y+20,9,'F');
      const dt=new Date(e.date+'T12:00:00');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(12);doc.text(String(dt.getDate()).padStart(2,'0'),x+9.5,y+19.5);doc.setFontSize(5.8);doc.text(dt.toLocaleDateString('fr-FR',{month:'short'}).replace('.','').toUpperCase(),x+9,y+24);
      doc.setTextColor(...navy);doc.setFont('helvetica','bold');doc.setFontSize(10.4);doc.text(clip(doc,e.title,54,2),x+27,y+17);doc.setFont('helvetica','normal');doc.setTextColor(...muted);doc.setFontSize(7.6);doc.text(clip(doc,e.ageCategory||'Toutes catégories',54,1),x+27,y+30);doc.setFont('helvetica','bold');doc.setTextColor(...accent.map(v=>Math.max(0,v-35)));doc.setFontSize(7.5);doc.text(clip(doc,e.specialty||'',54,1),x+27,y+36);doc.setFont('helvetica','normal');doc.setTextColor(...navy);doc.setFontSize(7.4);doc.text(clip(doc,`${e.startTime||''}${e.endTime?' → '+e.endTime:''}`,30,1),x+8,y+44);doc.setTextColor(...muted);doc.text(clip(doc,e.place||'',46,1),x+35,y+44);
      const conv=(d.convocations||[]).some(c=>c.id===e.convocationId||(c.date===e.date&&c.specialty===e.specialty&&c.title===e.title));if(conv){doc.setFillColor(...blue);doc.roundedRect(x+w-29,y+8,24,6,2,2,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(5.7);doc.text('CONVOCATION',x+w-26.5,y+12.1);}
    });
    doc.setFillColor(...yellow);doc.rect(0,H-19,W,19,'F');doc.setTextColor(...navy);doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text('TOUTES LES INFOS. UN SEUL ENDROIT.',12,H-10);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text('Retrouvez les horaires, lieux et convocations directement dans l’application AS.',12,H-5);doc.setFont('helvetica','bold');doc.setFontSize(8);doc.text(`BON SAUVEUR · SAINT-LÔ · PAGE ${page+1}`,226,H-7);
  }
  doc.save(titleSpecialty?`Calendrier_${cleanFile(titleSpecialty)}.pdf`:'Calendrier_AS_Bon_Sauveur.pdf');
}

function licenseFilters(){const out={};document.querySelectorAll('.filter-field').forEach(f=>{const k=f.querySelector('span')?.textContent?.trim().toLowerCase(),v=f.querySelector('select')?.value||'';if(k)out[k]=v;});return out;}
function filteredLicenses(d){const f=licenseFilters();return (d.licenses||[]).filter(l=>(!f['catégorie']||l.category===f['catégorie'])&&(!f['spécialité']||l.sectionOption===f['spécialité'])&&(!f['classe']||l.className===f['classe'])&&(!f['paiement']||l.paymentStatus===f['paiement'])&&(!f['mode']||l.contribution===f['mode']));}
function productName(d,id){return (d.products||[]).find(p=>p.id===id)?.name||'Produit';}
function exportRows(kind){
  const d=readData(),sp=educatorSpecialty();
  if(kind==='licenses')return {title:'LICENCES',subtitle:'Base centrale des élèves licenciés',rows:filteredLicenses(d).map(l=>({'Nom & prénom':l.fullName,'Classe':l.className,'Catégorie':l.category,'Spécialité':l.sectionOption,'Cotisation':l.contribution,'Statut paiement':l.paymentStatus,'Montant (€)':Number(l.amount||0),'Charte signée':l.charterSigned}))};
  if(kind==='reports')return {title:'BILANS AS',subtitle:'Suivi des séances, compétitions et réunions',rows:(d.reports||[]).map(r=>({'Date':r.date,'Activité':r.activity,'Enseignant(s) référent(s)':r.teacher||'','Niveau':r.level||'','Lieu':r.place||'','Catégorie':r.category||'',"Nombre d'élèves":Number(r.participants||0),'Commentaire':r.comment||''}))};
  if(kind==='orders')return {title:'COMMANDES BOUTIQUE',subtitle:'Suivi des paiements et de la distribution',rows:(d.orders||[]).map(o=>({'Élève':o.studentName,'Classe':o.className,'Produit':productName(d,o.productId),'Couleur':o.color||'','Taille':o.size,'Quantité':Number(o.quantity||1),'Paiement':o.paymentMethod,'Payé':o.paid?'Oui':'Non','Distribué':o.distributed?'Oui':'Non','Date':o.createdAt}))};
  if(kind==='convocations'){const rows=[];(d.convocations||[]).filter(c=>!sp||c.specialty===sp).forEach(c=>(c.studentIds||[]).forEach(id=>{const s=(d.students||[]).find(x=>x.id===id)||(d.licenses||[]).find(x=>x.studentId===id)||{};rows.push({'Activité':c.activity||'','Titre':c.title,'Catégorie':c.ageCategory||'','Spécialité':c.specialty,'Date':c.date,'Lieu':c.place,'Départ':c.departure,'Retour':c.returnTime,'Point de rendez-vous':c.meetingPoint||'','Élève':s.fullName||''});}));return {title:'CONVOCATIONS',subtitle:'Élèves convoqués et informations pratiques',rows};}
  if(kind==='appreciations'){const allowed=new Set((d.licenses||[]).filter(l=>!sp||l.sectionOption===sp).map(l=>l.studentId));return {title:'APPRÉCIATIONS',subtitle:sp||'Suivi annuel des appréciations',rows:(d.appreciations||[]).filter(a=>!sp||allowed.has(a.studentId)).map(a=>{const s=(d.students||[]).find(x=>x.id===a.studentId)||(d.licenses||[]).find(x=>x.studentId===a.studentId)||{};return {'Élève':s.fullName||'','Classe':s.className||'','Trimestre':a.term,'Appréciation':a.text||'','Statut':a.status==='validated'?'Validé':'À faire'};})};}
  if(kind==='calendar')return {title:'CALENDRIER',subtitle:sp||'Association Sportive du Bon Sauveur',rows:relevantEvents().map(e=>({'Date':e.date,'Titre':e.title,'Catégorie':e.ageCategory,'Spécialité':e.specialty,'Départ':e.startTime,'Retour':e.endTime,'Lieu':e.place}))};
  return {title:'EXPORT AS',subtitle:'Association Sportive du Bon Sauveur',rows:[]};
}
async function logoBase64(){return await imageData('assets/logo-as.png');}
function downloadBlob(buf,name){const blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function argb(hex){return 'FF'+hex.replace('#','').toUpperCase();}
function styleTable(ws,startRow,endRow,colCount){
  const header=ws.getRow(startRow);header.height=25;for(let c=1;c<=colCount;c++){const cell=header.getCell(c);cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:argb(BLUE)}};cell.font={name:'Aptos Display',size:11,bold:true,color:{argb:'FFFFFFFF'}};cell.alignment={vertical:'middle',horizontal:'center',wrapText:true};cell.border={bottom:{style:'medium',color:{argb:argb(YELLOW)}}};}
  for(let r=startRow+1;r<=endRow;r++){const row=ws.getRow(r);row.height=23;for(let c=1;c<=colCount;c++){const cell=row.getCell(c);cell.font={name:'Aptos',size:10,color:{argb:argb(NAVY)}};cell.alignment={vertical:'middle',wrapText:true};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:r%2===0?'FFF7FAFF':'FFFFFFFF'}};cell.border={bottom:{style:'hair',color:{argb:'FFDCE4EF'}}};}}
}
async function professionalExcel(kind){
  if(!window.ExcelJS){if(window.app.__v6OldExportExcel)return window.app.__v6OldExportExcel(kind);alert('Le module Excel est encore en chargement.');return;}
  const info=exportRows(kind),rows=info.rows||[],wb=new ExcelJS.Workbook();wb.creator='Association Sportive du Bon Sauveur';wb.created=new Date();
  const ws=wb.addWorksheet(info.title.slice(0,31),{views:[{state:'frozen',ySplit:6}]});ws.properties.defaultRowHeight=20;ws.pageSetup={orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0,paperSize:9,margins:{left:0.25,right:0.25,top:0.35,bottom:0.35,header:0.15,footer:0.15}};
  const headers=rows.length?Object.keys(rows[0]):['Information'];const colCount=Math.max(headers.length,6),last=ws.getColumn(colCount).letter;
  ws.mergeCells(`C1:${last}1`);ws.getCell('C1').value=info.title;ws.getCell('C1').font={name:'Aptos Display',size:24,bold:true,color:{argb:argb(BLUE)}};ws.getCell('C1').alignment={vertical:'middle'};
  ws.mergeCells(`C2:${last}2`);ws.getCell('C2').value=info.subtitle;ws.getCell('C2').font={name:'Aptos',size:12,color:{argb:argb(MUTED)}};
  ws.mergeCells(`C3:${last}3`);ws.getCell('C3').value=`Association Sportive du Bon Sauveur · Saint-Lô · Export du ${new Date().toLocaleDateString('fr-FR')}`;ws.getCell('C3').font={name:'Aptos',size:9,italic:true,color:{argb:'FF8592A6'}};
  ws.mergeCells(`A4:${last}4`);ws.getCell('A4').fill={type:'pattern',pattern:'solid',fgColor:{argb:argb(YELLOW)}};ws.getRow(4).height=6;
  const logo=await logoBase64();if(logo){try{const imageId=wb.addImage({base64:logo,extension:'png'});ws.addImage(imageId,{tl:{col:0.1,row:0.15},ext:{width:76,height:76}});}catch(e){console.warn('Logo Excel',e);}}
  const start=6;headers.forEach((h,i)=>ws.getCell(start,i+1).value=h);if(rows.length)rows.forEach((obj,ri)=>headers.forEach((h,ci)=>ws.getCell(start+1+ri,ci+1).value=obj[h]??''));else ws.getCell(start+1,1).value='Aucune donnée';
  const end=start+Math.max(rows.length,1);styleTable(ws,start,end,headers.length);ws.autoFilter={from:{row:start,column:1},to:{row:end,column:headers.length}};headers.forEach((h,i)=>{const values=[h,...rows.map(r=>String(r[h]??''))];const max=Math.min(42,Math.max(12,...values.map(v=>Math.min(42,v.length+2))));ws.getColumn(i+1).width=max;});
  if(kind==='licenses'){
    const filtered=filteredLicenses(readData()),summary=wb.addWorksheet('Synthèse comptable');summary.views=[{state:'frozen',ySplit:6}];summary.mergeCells('C1:F1');summary.getCell('C1').value='SYNTHÈSE COMPTABLE';summary.getCell('C1').font={name:'Aptos Display',size:22,bold:true,color:{argb:argb(BLUE)}};summary.mergeCells('C2:F2');summary.getCell('C2').value='Cotisations des licences';summary.getCell('C2').font={name:'Aptos',size:12,color:{argb:argb(MUTED)}};summary.mergeCells('A4:F4');summary.getCell('A4').fill={type:'pattern',pattern:'solid',fgColor:{argb:argb(YELLOW)}};summary.getRow(4).height=6;if(logo){try{const imageId=wb.addImage({base64:logo,extension:'png'});summary.addImage(imageId,{tl:{col:0.1,row:0.15},ext:{width:76,height:76}});}catch{}}
    const methods=['Chèque','Espèces','Ticket Spot 50','Cart’@too','Virement'];const sumRows=methods.map(m=>({Mode:m,Total:filtered.filter(l=>l.paymentStatus==='Payé'&&l.contribution===m).reduce((s,l)=>s+Number(l.amount||0),0)}));const total=sumRows.reduce((s,x)=>s+x.Total,0),rest=filtered.filter(l=>l.paymentStatus!=='Payé').reduce((s,l)=>s+Number(l.amount||0),0);summary.getCell('A6').value='Mode de paiement';summary.getCell('B6').value='Total encaissé (€)';sumRows.forEach((x,i)=>{summary.getCell(7+i,1).value=x.Mode;summary.getCell(7+i,2).value=x.Total;});summary.getCell(12,1).value='TOTAL ENCAISSÉ';summary.getCell(12,2).value=total;summary.getCell(13,1).value='RESTANT À ENCAISSER';summary.getCell(13,2).value=rest;styleTable(summary,6,13,2);summary.getColumn(1).width=28;summary.getColumn(2).width=22;summary.getCell('A12').font={name:'Aptos',size:11,bold:true,color:{argb:argb(NAVY)}};summary.getCell('B12').font={name:'Aptos',size:12,bold:true,color:{argb:argb(BLUE)}};
  }
  const buf=await wb.xlsx.writeBuffer();downloadBlob(buf,`${cleanFile(info.title)}_AS.xlsx`);
}

function patchAll(){hideDeprecatedLicenseOptions();patchEducatorNav();filterEducatorDates();patchCalendarUI();}
if(window.app){window.app.__v6OldExportExcel=window.app.exportExcel?.bind(window.app);window.app.exportExcel=professionalExcel;window.app.exportCalendarPDF=exportCalendarPDF;}
const root=document.getElementById('app');if(root)new MutationObserver(()=>requestAnimationFrame(patchAll)).observe(root,{childList:true,subtree:true});patchAll();
})();
