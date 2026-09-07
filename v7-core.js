(() => {
'use strict';
const V={
 VERSION:'v7-20260907-1',STORE:'bs-app-data-v4',ROLE_KEY:'bs-demo-role-v4',MIGRATION_KEY:'bs-v7-migrated',
 BLUE:'0757C9',NAVY:'13213A',YELLOW:'FFD21A',LIGHT:'F5F8FC',MUTED:'65738A',
 ECOLE_DIRECTE:'https://www.ecoledirecte.com/',LOGO:'assets/logo-as.png',
 TEACHERS:['Thomas GONTIER','Guillaume DHERVILLY','Lucas RIGAUX','Maxime PETIT'],
 LICENSE_CATEGORIES:['Benjamin','Benjamine','Minime fille','Minime garçon','Lycéen','Lycéenne'],
 SPECIALTIES:['Association Sportive','Section Football','Option Escalade','Sport-études Gymnastique'],
 EDU_SPECIALTIES:['Section Football','Option Escalade','Sport-études Gymnastique'],
 PAYMENTS:['Chèque','Espèces','Ticket Spot 50','Cart’@too','Virement'],
 CLASSES:['6e AVIGNON','6e Georges BIZET','6e Paul CEZANNE','6e Alphonse DAUDET','5e Jacqueline AURIOL','5e Adrienne BOLLAND','5e Bessie COLEMAN','5e Elise DEROCHE','4e ESTANGUET','4e FLESSEL','4e Cyril MORE','4e DELAUNAY','3e Antonio GAUDI','3e BARCELONE','3e CASTILLE','3e DALI','Seconde Pro ECP','Seconde Pro Maslow','Seconde Pro Henderson','Seconde GT','Première Pro ECP','Première Pro Curie','Première Pro Pasteur','Première ST2S','Terminale ST2S','Terminale ASSP'],
 AGE_CATEGORIES:['Benjamin','Benjamine','Minime fille','Minime garçon','Lycéen','Lycéenne','Toutes catégories'],
 ACTIVITIES:['Réunion d’organisation','AG UGSEL Manche','Renforcement - Relaxation','Kayak','Volley-Ball','Handball','Cross de l’établissement','Cross-Country','Trisports','Football','Futsal','Basket-ball','Badminton','Tennis de table','Escalade','Gymnastique','Athlétisme','Course d’orientation','Natation','VTT','Laser Run','Multisports','Autre'],
 ROLE_SPECIALTY:{educator_escalade:'Option Escalade',educator_football:'Section Football',educator_gymnastique:'Sport-études Gymnastique'},
 SPEC_COLOR:{'Association Sportive':'FFD21A','Section Football':'3F95F4','Option Escalade':'6974DE','Sport-études Gymnastique':'9C63D5'}
};
V.esc=(v='')=>String(v??'').replace(/[&<>"]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
V.read=()=>{try{return JSON.parse(localStorage.getItem(V.STORE)||'{}')||{}}catch{return{}}};
V.write=d=>localStorage.setItem(V.STORE,JSON.stringify(d));
V.role=()=>localStorage.getItem(V.ROLE_KEY)||'public';
V.isAdmin=()=>V.role()==='admin';
V.isManager=()=>['teacher_as','admin'].includes(V.role());
V.edu=()=>V.ROLE_SPECIALTY[V.role()]||null;
V.uid=(p='x')=>p+Math.random().toString(36).slice(2,10);
V.norm=(s='')=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,' ').replace(/[^a-z0-9]+/g,' ').trim();
V.today=()=>new Date().toISOString().slice(0,10);
V.fmtLong=d=>!d?'—':new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(d+'T12:00:00'));
V.fmtShort=d=>!d?'':new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(d+'T12:00:00'));
V.clean=s=>String(s||'export').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'');
V.studentName=(d,id)=>(d.students||[]).find(s=>s.id===id)?.fullName||(d.licenses||[]).find(l=>l.studentId===id)?.fullName||'';
V.options=(items,current='',blank='')=>(blank!==null?`<option value="">${V.esc(blank)}</option>`:'')+items.map(x=>`<option value="${V.esc(x)}" ${x===current?'selected':''}>${V.esc(x)}</option>`).join('');
V.hex=hex=>{hex=hex.replace('#','');return[parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16)]};
V.logoData=async()=>{try{const r=await fetch(V.LOGO),b=await r.blob();return await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=rej;fr.readAsDataURL(b);});}catch{return null;}};
window.ASV7=V;

(function migrate(){
 if(localStorage.getItem(V.MIGRATION_KEY)===V.VERSION)return;
 const d=V.read();
 d.licenses=(d.licenses||[]).map(l=>{let c=l.category||'';if(c==='Section foot Benjamin')c='Benjamin';else if(c==='Section foot Benjamine')c='Benjamine';else if(c==='Section foot Minime garçon')c='Minime garçon';else if(c==='Section foot Minime fille')c='Minime fille';else if(c==='Lycée')c='Lycéen';return{...l,category:c};});
 d.convocations=(d.convocations||[]).map(c=>{let info=(c.extraInfo||'').trim(),equipment=(c.equipment||'').trim();if(equipment&&!V.norm(info).includes(V.norm(equipment)))info=[info,equipment].filter(Boolean).join(' ');const out={...c,teacher:c.teacher||'',extraInfo:info};delete out.equipment;return out;});
 d.specialtyNotes=d.specialtyNotes||{};V.EDU_SPECIALTIES.forEach(s=>d.specialtyNotes[s]=d.specialtyNotes[s]||{message:'',expiresAt:'',active:false});
 V.write(d);localStorage.setItem(V.MIGRATION_KEY,V.VERSION);
})();

function route(){
 const h=document.querySelector('.page-title h1')?.textContent?.trim()||'';
 return h==='À venir'?'calendar':h==='Convocations'?'convocations':h==='Bilans AS'?'reports':h==='Outils'?'more':h==='Licences'?'licenses':h==='Gestion des commandes'?'orders':h==='Documents'?'documents':h==='Boutique AS'?'shop':h==='Appréciations'?'appreciations':h==='Administration'?'admin':'home';
}
function nb(r,i,l,a){return`<button class="nav-item ${a===r?'active':''}" onclick="app.go('${r}')"><span class="nav-ico">${i}</span><span>${l}</span></button>`}
function patchNav(){
 const nav=document.querySelector('.bottom-nav');if(!nav)return;const a=route(),r=V.role();
 if(['teacher_as','admin'].includes(r)){nav.innerHTML=nb('home','⌂','Accueil',a)+nb('calendar','▣','Calendrier',a)+nb('convocations','✓','Convocations',a)+nb('reports','↗','Bilans',a)+nb('more','•••','Plus',a);nav.classList.remove('nav-3');nav.classList.add('nav-5-v7');}
 else if(V.edu()){nav.innerHTML=nb('home','⌂','Accueil',a)+nb('calendar','▣','Calendrier',a)+nb('appreciations','✎','Appréciations',a);nav.classList.add('nav-3');}
}
function patchMore(){
 if(route()!=='more'||!V.isManager())return;const g=document.querySelector('.more-grid');if(!g)return;
 const t=[['⚑','Licences',"app.go('licenses')"],['◫','Commandes',"app.go('orders')"],['▦','Boutique',"app.go('shop')"],['▤','Documents',"app.go('documents')"]];
 if(V.isAdmin()){t.push(['!','Infos spécialités',"app.manageSpecialtyNotes()"],['⚙','Administration',"app.go('admin')"]);}
 g.innerHTML=t.map(([i,n,a])=>`<button class="card more-tile" onclick="${a}"><span class="big-icon">${i}</span><strong>${n}</strong></button>`).join('');
}
function patchSpecialtyHome(){
 const sp=V.edu();if(!sp||route()!=='home')return;const hero=document.querySelector('.hero');
 if(hero){hero.querySelector('.hero-kicker')&&(hero.querySelector('.hero-kicker').textContent='BON SAUVEUR · SAINT-LÔ');hero.querySelector('h1')&&(hero.querySelector('h1').textContent=sp);hero.querySelector('p')&&(hero.querySelector('p').textContent='Rendez-vous, informations et suivi de votre espace.');hero.querySelector('.hero-logo-stack')?.remove();}
 document.querySelectorAll('.section-head h2').forEach(h=>{if(h.textContent.trim()==='Documents importants')h.closest('section')?.remove();});
 const duo=document.querySelector('.home-duo');if(duo&&duo.children.length===1)duo.classList.add('v7-single');
 const n=V.read().specialtyNotes?.[sp],valid=n?.active&&n.message?.trim()&&(!n.expiresAt||n.expiresAt>=V.today());document.querySelector('.v7-specialty-note')?.remove();
 if(valid&&hero){const b=document.createElement('section');b.className='v7-specialty-note';b.innerHTML=`<div class="v7-note-pin"></div><div><span class="v7-note-label">À RETENIR</span><p>${V.esc(n.message)}</p>${n.expiresAt?`<small>Information valable jusqu’au ${new Intl.DateTimeFormat('fr-FR').format(new Date(n.expiresAt+'T12:00:00'))}</small>`:''}</div>`;hero.insertAdjacentElement('afterend',b);}
}
function patchLicensePage(){
 if(route()!=='licenses')return;
 document.querySelectorAll('.filter-field').forEach(f=>{if((f.querySelector('span')?.textContent||'').trim().toLowerCase()!=='catégorie')return;const cur=f.querySelector('select')?.value||'',clean=V.LICENSE_CATEGORIES.includes(cur)?cur:'';f.className='filter-field-v7';f.innerHTML=`<span>CATÉGORIE</span><select onchange="app.licenseFilter('category',this.value)"><option value="">Tous</option>${V.LICENSE_CATEGORIES.map(c=>`<option value="${V.esc(c)}" ${c===clean?'selected':''}>${V.esc(c)}</option>`).join('')}</select>`;});
 const a=document.querySelector('.page-title .top-actions-inline');if(a&&V.isAdmin()&&!a.querySelector('.v7-import-btn')){const m=document.createElement('button');m.className='btn secondary v7-template-btn';m.textContent='Modèle Excel';m.onclick=()=>app.downloadLicenseTemplate();const i=document.createElement('button');i.className='btn v7-import-btn';i.textContent='Importer Excel / CSV';i.onclick=()=>app.openLicenseImport();const add=[...a.querySelectorAll('button')].find(b=>b.textContent.includes('+ Licence'));if(add){a.insertBefore(m,add);a.insertBefore(i,add)}else a.append(m,i);}
}
function patchCalendar(){
 if(route()!=='calendar')return;const a=document.querySelector('.page-title .top-actions-inline');if(!a)return;
 [...a.querySelectorAll('button')].forEach(b=>{const t=b.textContent.trim();if(t==='PDF'||t==='Excel')b.remove();else if(['PDF affichage','Télécharger le calendrier PDF','Télécharger le calendrier','Exporter le calendrier'].includes(t)){b.textContent='Exporter le calendrier';b.classList.add('yellow','v7-calendar-export');b.onclick=()=>app.exportCalendarPDF();}});
 if(!a.querySelector('.v7-calendar-export')){const b=document.createElement('button');b.className='btn yellow v7-calendar-export';b.textContent='Exporter le calendrier';b.onclick=()=>app.exportCalendarPDF();a.appendChild(b);}
}
function findConv(card,d){const t=card.querySelector('.event-title')?.textContent||card.textContent;return(d.convocations||[]).find(c=>t.includes(c.title))||(d.convocations||[]).find(c=>card.textContent.includes(c.title));}
function patchConvCards(){
 if(route()!=='convocations')return;const d=V.read();document.querySelectorAll('.convocation-card').forEach(card=>{if(card.querySelector('.v7-export-conv'))return;const c=findConv(card,d);if(!c)return;const b=document.createElement('button');b.type='button';b.className='btn yellow tiny v7-export-conv';b.textContent='Exporter la convocation';b.onclick=e=>{e.preventDefault();e.stopPropagation();app.exportConvocation(c.id)};card.appendChild(b);});
}
function closeModal(){document.getElementById('v7-modal')?.remove()}
function modal(title,body,wide=true){closeModal();const w=document.createElement('div');w.id='v7-modal';w.className='modal-backdrop';w.innerHTML=`<div class="modal ${wide?'wide':''} v7-modal"><div class="modal-head"><h2>${V.esc(title)}</h2><button class="icon-btn" type="button" onclick="app.closeV7Modal()">×</button></div>${body}</div>`;document.body.appendChild(w);w.addEventListener('click',e=>e.target===w&&closeModal());return w}
V.modal=modal;

function openConv(id){
 const d=V.read(),c=(d.convocations||[]).find(x=>x.id===id);if(!c)return;const names=(c.studentIds||[]).map(x=>V.studentName(d,x)).filter(Boolean);
 modal(c.title||'Convocation',`<div class="v7-conv-head"><div><span class="v7-eyebrow">${V.esc(c.activity||'Activité')}</span><h3>${V.esc(c.title||'')}</h3></div><span class="v7-specialty">${V.esc(c.specialty||'')}</span></div><div class="convocation-detail v7-conv-detail"><div class="detail-block"><span>Date</span><strong>${V.esc(V.fmtLong(c.date))}</strong></div><div class="detail-block"><span>Lieu</span><strong>${V.esc(c.place||'—')}</strong></div><div class="detail-block"><span>Départ</span><strong>${V.esc(c.departure||'—')}</strong></div><div class="detail-block"><span>Retour</span><strong>${V.esc(c.returnTime||'—')}</strong></div><div class="detail-block full"><span>Point de rendez-vous</span><strong>${V.esc(c.meetingPoint||'—')}</strong></div><div class="detail-block full"><span>Professeur référent</span><strong>${V.esc(c.teacher||'Non renseigné')}</strong><button class="v7-ed-btn" type="button" onclick="window.open('${V.ECOLE_DIRECTE}','_blank','noopener')"><span class="v7-ed-mark">ED</span><span>Ouvrir ÉcoleDirecte</span>↗</button></div><div class="detail-block full v7-important"><span>Informations importantes</span><strong>${V.esc(c.extraInfo||'Aucune information particulière.')}</strong></div></div><div class="convocation-students"><strong>Élèves convoqués</strong><div class="student-chip-list">${names.map(n=>`<span class="student-chip">${V.esc(n)}</span>`).join('')||'<span class="muted">Aucun élève.</span>'}</div></div><div class="v7-modal-actions"><button class="btn yellow" type="button" onclick="app.exportConvocation('${V.esc(c.id)}')">Exporter la convocation</button></div>`,true);
}
function editConv(id){
 if(!V.isManager())return;const d=V.read(),c=id?(d.convocations||[]).find(x=>x.id===id):null,checked=new Set(c?.studentIds||[]),licensed=(d.licenses||[]).slice().sort((a,b)=>(a.fullName||'').localeCompare(b.fullName||'','fr'));
 const body=`<form id="v7-conv-form" class="form-grid"><label class="field"><span>Activité</span><select name="activity">${V.options(V.ACTIVITIES,c?.activity||V.ACTIVITIES[0],null)}</select></label><label class="field"><span>Titre</span><input name="title" required value="${V.esc(c?.title||'')}"></label><label class="field"><span>Catégorie</span><select name="ageCategory">${V.options(V.AGE_CATEGORIES,c?.ageCategory||V.AGE_CATEGORIES[0],null)}</select></label><label class="field"><span>Spécialité</span><select name="specialty">${V.options(V.SPECIALTIES,c?.specialty||V.SPECIALTIES[0],null)}</select></label><label class="field"><span>Date</span><input type="date" name="date" required value="${V.esc(c?.date||V.today())}"></label><label class="field"><span>Lieu</span><input name="place" value="${V.esc(c?.place||'')}"></label><label class="field"><span>Heure de départ</span><input type="time" name="departure" value="${V.esc(c?.departure||'')}"></label><label class="field"><span>Heure de retour</span><input type="time" name="returnTime" value="${V.esc(c?.returnTime||'')}"></label><label class="field full"><span>Point de rendez-vous</span><input name="meetingPoint" value="${V.esc(c?.meetingPoint||'')}"></label><label class="field full"><span>Professeur référent</span><select name="teacher" required>${V.options(V.TEACHERS,c?.teacher||'','Choisir un professeur')}</select></label><label class="field full"><span>Informations importantes</span><textarea name="extraInfo" placeholder="Repas, tenue, consignes, changement d’horaire…">${V.esc(c?.extraInfo||'')}</textarea></label><div class="field full"><span>Élèves convoqués</span><div class="student-options v7-student-options">${licensed.map(l=>`<label class="student-option"><input type="checkbox" name="studentIds" value="${V.esc(l.studentId)}" ${checked.has(l.studentId)?'checked':''}><span><strong>${V.esc(l.fullName)}</strong><small>${V.esc(l.className)} · ${V.esc(l.category)} · ${V.esc(l.sectionOption||'')}</small></span></label>`).join('')}</div></div><div class="field full modal-actions"><button class="btn" type="submit">Enregistrer</button></div></form>`;
 const m=modal(id?'Modifier une convocation':'Ajouter une convocation',body,true);m.querySelector('#v7-conv-form').addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(e.currentTarget);if(!fd.get('teacher'))return alert('Choisissez le professeur référent.');const o={id:c?.id||V.uid('c'),activity:fd.get('activity'),title:String(fd.get('title')||'').trim(),ageCategory:fd.get('ageCategory'),specialty:fd.get('specialty'),date:fd.get('date'),place:String(fd.get('place')||'').trim(),departure:fd.get('departure'),returnTime:fd.get('returnTime'),meetingPoint:String(fd.get('meetingPoint')||'').trim(),teacher:fd.get('teacher'),extraInfo:String(fd.get('extraInfo')||'').trim(),studentIds:fd.getAll('studentIds')};d.convocations=d.convocations||[];c?Object.assign(c,o):d.convocations.push(o);(d.events||[]).forEach(ev=>{if(ev.convocationId===o.id)ev.convocationId=null});const ev=(d.events||[]).find(x=>x.date===o.date&&x.specialty===o.specialty&&x.title===o.title);if(ev)ev.convocationId=o.id;V.write(d);location.reload();});
}
function editLicense(id){
 if(!V.isManager())return;const d=V.read(),l=id?(d.licenses||[]).find(x=>x.id===id):null;
 const body=`<form id="v7-license-form" class="form-grid"><label class="field full"><span>Nom & prénom</span><input name="fullName" required value="${V.esc(l?.fullName||'')}"></label><label class="field"><span>Classe</span><select name="className">${V.options(V.CLASSES,l?.className||V.CLASSES[0],null)}</select></label><label class="field"><span>Catégorie</span><select name="category">${V.options(V.LICENSE_CATEGORIES,V.LICENSE_CATEGORIES.includes(l?.category)?l.category:V.LICENSE_CATEGORIES[0],null)}</select></label><label class="field"><span>Cotisation</span><select name="contribution">${V.options(V.PAYMENTS,l?.contribution||V.PAYMENTS[0],null)}</select></label><label class="field"><span>Statut du paiement</span><select name="paymentStatus">${V.options(['En attente','Payé'],l?.paymentStatus||'En attente',null)}</select></label><label class="field"><span>Montant</span><input type="number" name="amount" value="${V.esc(String(l?.amount??20))}"></label><label class="field"><span>Charte signée</span><select name="charterSigned">${V.options(['Oui','Non'],l?.charterSigned||'Non',null)}</select></label><label class="field"><span>Spécialité</span><select name="sectionOption">${V.options(V.SPECIALTIES,l?.sectionOption||V.SPECIALTIES[0],null)}</select></label><div class="field full modal-actions"><button class="btn" type="submit">Enregistrer</button></div></form>`;
 const m=modal(id?'Modifier une licence':'Ajouter une licence',body,true);m.querySelector('#v7-license-form').addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(e.currentTarget),fullName=String(fd.get('fullName')||'').trim();if(!fullName)return;const studentId=l?.studentId||V.uid('s'),o={id:l?.id||V.uid('l'),studentId,fullName,className:fd.get('className'),category:fd.get('category'),contribution:fd.get('contribution'),paymentStatus:fd.get('paymentStatus'),amount:Number(fd.get('amount')||0),charterSigned:fd.get('charterSigned'),sectionOption:fd.get('sectionOption')};d.licenses=d.licenses||[];d.students=d.students||[];l?Object.assign(l,o):d.licenses.push(o);const s=d.students.find(x=>x.id===studentId);s?Object.assign(s,{fullName,className:o.className,specialty:o.sectionOption}):d.students.push({id:studentId,fullName,className:o.className,specialty:o.sectionOption});V.write(d);location.reload();});
}
function manageNotes(){
 if(!V.isAdmin())return;const d=V.read();d.specialtyNotes=d.specialtyNotes||{};const cards=V.EDU_SPECIALTIES.map((sp,i)=>{const n=d.specialtyNotes[sp]||{};return`<section class="v7-note-editor"><h3>${V.esc(sp)}</h3><label class="field full"><span>Message</span><textarea name="note-${i}" placeholder="Ex. Mardi : retour exceptionnel à 19h30.">${V.esc(n.message||'')}</textarea></label><div class="v7-note-editor-row"><label class="field"><span>Fin d’affichage</span><input type="date" name="exp-${i}" value="${V.esc(n.expiresAt||'')}"></label><label class="v7-switch"><input type="checkbox" name="active-${i}" ${n.active?'checked':''}><span>Afficher le post-it</span></label></div></section>`}).join('');
 const m=modal('Infos des spécialités',`<form id="v7-notes-form">${cards}<div class="modal-actions"><button class="btn" type="submit">Enregistrer</button></div></form>`,true);m.querySelector('#v7-notes-form').addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(e.currentTarget);V.EDU_SPECIALTIES.forEach((sp,i)=>d.specialtyNotes[sp]={message:String(fd.get(`note-${i}`)||'').trim(),expiresAt:fd.get(`exp-${i}`)||'',active:fd.get(`active-${i}`)==='on'});V.write(d);closeModal();});
}
function patchAll(){patchNav();patchMore();patchSpecialtyHome();patchLicensePage();patchCalendar();patchConvCards();}
if(window.app){app.closeV7Modal=closeModal;app.openConv=openConv;app.editConv=editConv;app.editLicense=editLicense;app.manageSpecialtyNotes=manageNotes;}
const root=document.getElementById('app');if(root)new MutationObserver(()=>requestAnimationFrame(patchAll)).observe(root,{childList:true,subtree:true});patchAll();
})();