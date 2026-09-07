(()=>{
'use strict';
const V=window.ASV7, app=window.app;
if(!V||!app)return;
if(window.__AS_V10_NATIVE_MO) window.MutationObserver=window.__AS_V10_NATIVE_MO;
const ROLE=()=>V.role(), isManager=()=>V.isManager(), isAdmin=()=>V.isAdmin(), edu=()=>V.edu();
const BAD_CATS=new Set(['Section foot Benjamin','Section foot Benjamine','Section foot Minime garçon','Section foot Minime fille']);
const ED=()=>window.AS_ED_LOGO_EXACT||window.ASV8?.ED_LOGO||'';
const I={
 home:'<svg class="v10-icon" viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5V21h-6v-6H9v6H3z"/></svg>',
 calendar:'<svg class="v10-icon" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>',
 convocations:'<svg class="v10-icon" viewBox="0 0 24 24"><path d="M4 14c5-1 8-4 9-9 4 2 6 5 7 9-6 2-11 2-16 0Z"/><path d="m7 15-1 5M16 8l3-2"/></svg>',
 reports:'<svg class="v10-icon" viewBox="0 0 24 24"><path d="M5 20V11M12 20V5M19 20v-8"/><path d="M3 20h18"/></svg>',
 more:'<svg class="v10-icon" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.7" fill="currentColor" stroke="none"/></svg>',
 appreciations:'<svg class="v10-icon" viewBox="0 0 24 24"><path d="M4 5h16v12H9l-5 4z"/><path d="M8 9h8M8 13h5"/><path d="m16 14 3-3"/></svg>',
 licenses:'<svg class="v10-icon" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="15" rx="3"/><circle cx="8" cy="11" r="2"/><path d="M5.5 16c.6-2 4.4-2 5 0M13 10h5M13 14h5"/></svg>',
 orders:'<svg class="v10-icon" viewBox="0 0 24 24"><path d="M6 8h12l1 13H5L6 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>',
 shop:'<svg class="v10-icon" viewBox="0 0 24 24"><path d="M6 8h12l1 13H5L6 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>',
 documents:'<svg class="v10-icon" viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 12h6M9 16h6"/></svg>',
 admin:'<svg class="v10-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A7 7 0 0 0 15 6l-.3-2.6h-4L10.4 6A7 7 0 0 0 8 7.1l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1A7 7 0 0 0 10.4 18l.3 2.6h4L15 18a7 7 0 0 0 1.5-1.1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z"/></svg>',
 note:'<svg class="v10-icon" viewBox="0 0 24 24"><path d="M5 4h14v13l-4 4H5z"/><path d="M15 21v-4h4M8 9h8M8 13h6"/></svg>',
 moon:'<svg class="v10-icon" viewBox="0 0 24 24"><path d="M20 15.5A8 8 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/></svg>',
 sun:'<svg class="v10-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
};
function pageRoute(){
 const h=document.querySelector('.page-title h1')?.textContent?.trim()||'';
 const k=document.querySelector('.page-title .kicker')?.textContent?.trim()||'';
 if(h==='À venir')return'calendar'; if(h==='Convocations')return'convocations'; if(h==='Bilans AS')return'reports';
 if(h==='Outils')return'more'; if(h==='Licences')return'licenses'; if(h==='Gestion des commandes')return'orders';
 if(h==='Documents')return'documents'; if(h==='Boutique AS')return'shop'; if(h==='Appréciations')return'appreciations';
 if(h==='Réglages'||k==='ADMINISTRATION')return'admin'; return'home';
}
function navItem(r,label,active){return `<button class="nav-item ${active===r?'active':''}" onclick="app.go('${r}')"><span class="nav-ico">${I[r]||I.more}</span><span>${label}</span></button>`}
function patchNav(){
 const n=document.querySelector('.bottom-nav'); if(!n)return;
 const a=pageRoute(),r=ROLE(); let items;
 if(r==='public')items=[['home','Accueil'],['convocations','Convocation'],['calendar','Calendrier'],['shop','Boutique'],['documents','Documents']];
 else if(edu())items=[['home','Accueil'],['calendar','Calendrier'],['appreciations','Appréciations']];
 else items=[['home','Accueil'],['calendar','Calendrier'],['convocations','Convocations'],['reports','Bilans'],['more','Plus']];
 const key=r+'|'+a+'|'+items.map(x=>x[0]).join(','); if(n.dataset.v10Nav===key)return;
 n.innerHTML=items.map(([x,l])=>navItem(x,l,a)).join(''); n.dataset.v10Nav=key;
 n.classList.toggle('nav-3',!!edu()); n.classList.toggle('nav-5-v10',!edu());
}
function patchTheme(){const b=document.querySelector('.top-actions .icon-btn[aria-label="Thème"]');if(!b||b.dataset.v10)return;b.innerHTML=document.body.classList.contains('dark')?I.sun:I.moon;b.dataset.v10='1'}
function patchMore(){
 if(pageRoute()!=='more'||!isManager())return; const g=document.querySelector('.more-grid');if(!g)return;
 const tiles=[['licenses','Licences'],['orders','Commandes'],['shop','Boutique'],['documents','Documents']]; if(isAdmin())tiles.push(['admin','Administration']);
 const key=tiles.map(x=>x[0]).join('|'); if(g.dataset.v10===key)return;
 g.innerHTML=tiles.map(([r,l])=>`<button class="card more-tile" onclick="app.go('${r}')"><span class="big-icon">${I[r]}</span><strong>${l}</strong></button>`).join('');g.dataset.v10=key;
}
function ensureActionBar(){const p=document.querySelector('.page-title');if(!p)return null;let b=p.querySelector('.top-actions-inline');if(!b){b=document.createElement('div');b.className='top-actions-inline';p.appendChild(b)}return b}
function setActions(specs){const bar=ensureActionBar();if(!bar)return;const sig=specs.map(x=>x.label).join('|');if(bar.dataset.v10Actions===sig)return;bar.innerHTML='';for(const s of specs){const b=document.createElement('button');b.type='button';b.className=s.cls||'btn';b.textContent=s.label;b.addEventListener('click',s.action);bar.appendChild(b)}bar.dataset.v10Actions=sig}
function patchActions(){
 const r=pageRoute();
 if(r==='calendar'){const a=[];if(isManager())a.push({label:'+ Événement',cls:'btn',action:()=>app.editEvent()});a.push({label:'Exporter le calendrier',cls:'btn yellow',action:()=>app.exportCalendarPDF()});setActions(a)}
 else if(r==='convocations'){const a=[];if(isManager()){a.push({label:'+ Convocation',cls:'btn',action:()=>app.editConv()});a.push({label:'Exporter Excel',cls:'btn secondary',action:()=>app.exportExcel('convocations')})}setActions(a)}
 else if(r==='licenses'){const a=[];if(isAdmin()&&app.downloadLicenseTemplate)a.push({label:'Modèle Excel',cls:'btn secondary',action:()=>app.downloadLicenseTemplate()});if(isAdmin()&&app.openLicenseImport)a.push({label:'Importer Excel / CSV',cls:'btn secondary',action:()=>app.openLicenseImport()});a.push({label:'Exporter Excel',cls:'btn secondary',action:()=>app.exportExcel('licenses')});a.push({label:'+ Licence',cls:'btn',action:()=>app.editLicense()});setActions(a)}
 else if(r==='reports')setActions([{label:'Exporter Excel',cls:'btn secondary',action:()=>app.exportExcel('reports')},{label:'+ Bilan',cls:'btn',action:()=>app.editReport()}]);
 else if(r==='orders')setActions([{label:'Exporter Excel',cls:'btn',action:()=>app.exportExcel('orders')}]);
 else if(r==='appreciations')setActions([{label:'Exporter Excel',cls:'btn secondary',action:()=>app.exportExcel('appreciations')}]);
}
function cleanCategorySelects(){
 document.querySelectorAll('select').forEach(s=>{const lab=s.closest('.field,.filter-field,.filter-field-v7')?.querySelector('span')?.textContent?.trim().toLowerCase()||'';if(!lab.includes('catégorie'))return;[...s.options].forEach(o=>{if(BAD_CATS.has(o.value)||BAD_CATS.has(o.textContent.trim()))o.remove()})});
}
function cardSpecialty(card){return card.querySelector('.badge')?.textContent?.trim()||''}
function specialtyHome(){
 const sp=edu();if(!sp||pageRoute()!=='home')return;
 const hero=document.querySelector('.hero');if(hero){hero.querySelector('.hero-kicker')&&(hero.querySelector('.hero-kicker').textContent='BON SAUVEUR · SAINT-LÔ');hero.querySelector('h1')&&(hero.querySelector('h1').textContent=sp);hero.querySelector('p')&&(hero.querySelector('p').textContent='Rendez-vous, informations et appréciations de votre espace.');hero.querySelector('.hero-logo-stack')?.remove()}
 document.querySelectorAll('.section-head h2').forEach(h=>{if(h.textContent.trim()==='Documents importants')h.closest('section')?.remove()});
 document.querySelectorAll('.week-list .week-card').forEach(c=>{if(cardSpecialty(c)!==sp)c.remove()});
 const list=document.querySelector('.week-list');if(list&&!list.querySelector('.week-card')&&!list.querySelector('.empty'))list.innerHTML='<div class="empty">Aucune date prévue pour cet espace.</div>';
 const n=V.read().specialtyNotes?.[sp],ok=n?.active&&String(n.message||'').trim()&&(!n.expiresAt||n.expiresAt>=V.today()),old=document.querySelector('.v10-specialty-note'),key=ok?`${sp}|${n.message}|${n.expiresAt||''}`:'';
 if(!ok){old?.remove()}else if(hero&&old?.dataset.noteKey!==key){old?.remove();const x=document.createElement('section');x.className='v10-specialty-note';x.dataset.noteKey=key;x.innerHTML=`<span class="v10-note-icon">${I.note}</span><div><b>À RETENIR</b><p>${V.esc(n.message)}</p>${n.expiresAt?`<small>Jusqu’au ${new Intl.DateTimeFormat('fr-FR').format(new Date(n.expiresAt+'T12:00:00'))}</small>`:''}</div>`;hero.insertAdjacentElement('afterend',x)}
}
function specialtyCalendar(){const sp=edu();if(!sp||pageRoute()!=='calendar')return;document.querySelectorAll('.grid .week-card').forEach(c=>{if(cardSpecialty(c)!==sp)c.remove()});const p=document.querySelector('.page-title p');if(p)p.textContent=`Uniquement les rendez-vous liés à ${sp}.`;const g=document.querySelector('.container>.grid');if(g&&!g.querySelector('.week-card')&&!g.querySelector('.empty'))g.innerHTML='<div class="empty">Aucun rendez-vous à venir pour cet espace.</div>'}
function findConv(card,d){const t=card.textContent||'';return(d.convocations||[]).find(c=>c.title&&t.includes(c.title))}
function patchConvCards(){
 if(pageRoute()!=='convocations')return;const d=V.read();document.querySelectorAll('.convocation-card').forEach(card=>{const c=findConv(card,d);if(!c)return;const title=card.querySelector('.event-title');if(title&&title.textContent.trim()!==c.title)title.textContent=c.title;card.querySelectorAll('.v7-export-conv,.v8-export-conv,.v9-export-conv').forEach(x=>x.remove());if(card.querySelector('.v10-card-actions'))return;const a=document.createElement('div');a.className='v10-card-actions';const ex=document.createElement('button');ex.className='btn yellow tiny';ex.textContent='Exporter la convocation';ex.onclick=e=>{e.preventDefault();e.stopPropagation();app.exportConvocation(c.id)};a.appendChild(ex);if(isManager()){const ed=document.createElement('button');ed.className='btn secondary tiny';ed.textContent='Modifier';ed.onclick=e=>{e.preventDefault();e.stopPropagation();app.editConv(c.id)};const del=document.createElement('button');del.className='btn danger tiny';del.textContent='Supprimer';del.onclick=e=>{e.preventDefault();e.stopPropagation();deleteConv(c.id)};a.append(ed,del)}card.appendChild(a)})
}
function patchCalendarManagement(){if(pageRoute()!=='calendar'||!isManager())return;const d=V.read();document.querySelectorAll('.grid .week-card').forEach(card=>{if(card.querySelector('.v10-event-actions'))return;const t=card.querySelector('.event-title')?.textContent?.trim()||'';const e=(d.events||[]).find(x=>x.title===t&&card.textContent.includes(x.place||''))||(d.events||[]).find(x=>x.title===t);if(!e)return;const a=document.createElement('div');a.className='v10-event-actions';const m=document.createElement('button');m.className='btn secondary tiny';m.textContent='Modifier';m.onclick=ev=>{ev.preventDefault();ev.stopPropagation();app.editEvent(e.id)};const del=document.createElement('button');del.className='btn danger tiny';del.textContent='Supprimer';del.onclick=ev=>{ev.preventDefault();ev.stopPropagation();deleteEvent(e.id)};a.append(m,del);card.appendChild(a)})}
function patchReports(){if(pageRoute()!=='reports'||!isManager())return;const d=V.read();document.querySelectorAll('.report-card').forEach(card=>{if(card.querySelector('.v10-report-delete'))return;const act=card.querySelector('.event-title')?.textContent?.trim();const r=(d.reports||[]).find(x=>x.activity===act&&card.textContent.includes(String(x.participants??'')))||(d.reports||[]).find(x=>x.activity===act);if(!r)return;const b=document.createElement('button');b.className='btn danger tiny v10-report-delete';b.textContent='Supprimer';b.onclick=e=>{e.stopPropagation();if(confirm('Supprimer ce bilan ?')){const x=V.read();x.reports=(x.reports||[]).filter(v=>v.id!==r.id);V.write(x);location.reload()}};card.querySelector('.row-between')?.appendChild(b)})}
function patchOrders(){if(pageRoute()!=='orders')return;document.querySelectorAll('.admin-table').forEach(t=>{const th=[...t.querySelectorAll('thead th')],i=th.findIndex(x=>/^Prêt$/i.test(x.textContent.trim()));if(i<0)return;th[i].remove();t.querySelectorAll('tbody tr').forEach(r=>r.children[i]?.remove())})}
function patchDocIcons(){document.querySelectorAll('.doc-icon').forEach(x=>{if(x.dataset.v10)return;x.innerHTML=I.documents;x.dataset.v10='1'})}
function openNotes(){
 if(!isAdmin())return;const d=V.read();d.specialtyNotes=d.specialtyNotes||{};const opts=V.EDU_SPECIALTIES.map(s=>`<option value="${V.esc(s)}">${V.esc(s)}</option>`).join('');
 const m=V.modal('Post-it spécialités',`<form id="v10-note-form" class="form-grid"><label class="field full"><span>Spécialité</span><select name="specialty">${opts}</select></label><label class="field full"><span>Message</span><textarea name="message" placeholder="Ex. Mardi : retour exceptionnel à 19h30."></textarea></label><label class="field"><span>Date de fin (facultative)</span><input type="date" name="expiresAt"></label><label class="field"><span>Affichage</span><select name="active"><option value="true">Actif</option><option value="false">Masqué</option></select></label><div class="field full modal-actions"><button class="btn" type="submit">Enregistrer</button></div></form>`,true);
 const f=m.querySelector('#v10-note-form'),s=f.elements.specialty;function load(){const n=d.specialtyNotes[s.value]||{};f.elements.message.value=n.message||'';f.elements.expiresAt.value=n.expiresAt||'';f.elements.active.value=n.active?'true':'false'}s.onchange=load;load();f.onsubmit=e=>{e.preventDefault();d.specialtyNotes[s.value]={message:f.elements.message.value.trim(),expiresAt:f.elements.expiresAt.value,active:f.elements.active.value==='true'};V.write(d);document.getElementById('v7-modal')?.remove()}
}
function patchAdmin(){
 if(pageRoute()!=='admin'||!isAdmin())return;const g=document.querySelector('.container .grid.grid-2,.container .grid');if(!g||g.querySelector('.v10-postit-card'))return;const c=document.createElement('div');c.className='card v10-postit-card';c.innerHTML=`<div class="v10-admin-icon">${I.note}</div><h2>Post-it spécialités</h2><p class="info-text">Un message différent pour Football, Escalade et Gymnastique.</p><button class="btn" type="button">Gérer les post-it</button>`;c.querySelector('button').onclick=openNotes;g.prepend(c)
}
function deleteConv(id){if(!isManager())return;if(!confirm('Supprimer cette convocation ?'))return;const d=V.read();d.convocations=(d.convocations||[]).filter(c=>c.id!==id);(d.events||[]).forEach(e=>{if(e.convocationId===id)e.convocationId=null});V.write(d);location.reload()}
function deleteEvent(id){if(!isManager())return;if(!confirm('Supprimer cet événement ?'))return;const d=V.read();d.events=(d.events||[]).filter(e=>e.id!==id);V.write(d);location.reload()}
function openConv(id){
 const d=V.read(),c=(d.convocations||[]).find(x=>x.id===id);if(!c)return;const names=(c.studentIds||[]).map(x=>V.studentName(d,x)).filter(Boolean),ed=ED();
 const m=V.modal('Convocation',`<div class="v10-conv-summary"><div><span class="v10-eyebrow">${V.esc((c.activity||'Activité').toUpperCase())}</span><h3>${V.esc(c.title||'')}</h3><div class="v10-subline"><span>${V.esc(c.ageCategory||'')}</span><span>${V.esc(c.specialty||'')}</span></div></div></div><div class="v10-quick-grid"><div class="v10-info wide"><span>Date</span><strong>${V.esc(V.fmtLong(c.date))}</strong></div><div class="v10-info"><span>Lieu</span><strong>${V.esc(c.place||'—')}</strong></div><div class="v10-info"><span>Départ</span><strong>${V.esc(c.departure||'—')}</strong></div><div class="v10-info"><span>Retour</span><strong>${V.esc(c.returnTime||'—')}</strong></div><div class="v10-info wide"><span>Point de rendez-vous</span><strong>${V.esc(c.meetingPoint||'—')}</strong></div></div><div class="v10-teacher"><div><span>Professeur référent</span><strong>${V.esc(c.teacher||'Non renseigné')}</strong></div><button type="button" onclick="window.open('${V.ECOLE_DIRECTE}','_blank','noopener')">${ed?`<img src="${ed}" alt="ÉcoleDirecte">`:''}<span>Ouvrir ÉcoleDirecte</span><b>↗</b></button></div><div class="v10-important"><span>Informations importantes</span><strong>${V.esc(c.extraInfo||'Aucune information particulière.')}</strong></div><section class="v10-students"><h4>Élèves convoqués <small>${names.length}</small></h4><div>${names.map(n=>`<span>${V.esc(n)}</span>`).join('')||'<em>Aucun élève sélectionné.</em>'}</div></section><div class="v10-modal-actions">${isManager()?`<button class="btn secondary" type="button" id="v10-edit-conv">Modifier</button>`:''}<button class="btn yellow" type="button" id="v10-export-conv">Exporter la convocation</button></div>`,true);
 const modal=m.querySelector('.v7-modal');if(modal)modal.scrollTop=0;m.querySelector('#v10-export-conv').onclick=()=>app.exportConvocation(c.id);const eb=m.querySelector('#v10-edit-conv');if(eb)eb.onclick=()=>{document.getElementById('v7-modal')?.remove();app.editConv(c.id)}
}
function wrapEditLicense(){if(app.__v10LicenseWrapped)return;const base=app.editLicense?.bind(app);if(!base)return;app.editLicense=id=>{base(id);requestAnimationFrame(cleanCategorySelects)};app.__v10LicenseWrapped=true}
function refresh(){
 patchNav();patchTheme();patchMore();patchActions();cleanCategorySelects();specialtyHome();specialtyCalendar();patchConvCards();patchCalendarManagement();patchReports();patchOrders();patchDocIcons();patchAdmin();
}
function wrapRenders(){if(app.__v10Wrapped)return;['go','setRole','theme','search','licenseFilter','clearLicenseFilters','setTerm'].forEach(k=>{const fn=app[k];if(typeof fn!=='function')return;app[k]=function(...a){const r=fn.apply(this,a);requestAnimationFrame(refresh);return r}});app.__v10Wrapped=true}
app.openConv=openConv;app.manageSpecialtyNotes=openNotes;wrapEditLicense();wrapRenders();
let scheduled=false,busy=false;const root=document.getElementById('app');if(root&&window.MutationObserver){new MutationObserver(()=>{if(busy||scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;busy=true;try{refresh()}finally{busy=false}})}).observe(root,{childList:true,subtree:true})}
refresh();window.ASV10={icons:I,refresh,version:'v10-20260907-2'};
})();
