(() => {
'use strict';
const V=window.ASV7;if(!V||!window.app)return;
const VERSION='v8-20260907-1';
const ED_LOGO='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0753a5"/><stop offset="1" stop-color="#02a9df"/></linearGradient></defs><rect width="100" height="100" rx="18" fill="#fff"/><path fill="url(#g)" d="M6 53C12 25 34 12 60 12c20 0 34 7 40 20 8 18-3 39-25 50-21 11-49 12-67 2 17 4 38 1 55-8 18-9 27-23 22-35-5-12-20-18-37-16-19 2-34 12-42 28Z"/><path fill="url(#g)" d="M36 27c8-3 22-3 31-1 5 1 7 4 6 8l-2 8H49l-2 8h17c5 0 8 3 7 7-1 4-4 6-9 6H44l-2 9c-1 4 1 6 6 6h18l-3 9H40c-10 0-15-5-13-14l9-46Z"/></svg>');

function closeV8Modal(){document.getElementById('v8-modal')?.remove();}
function modal(title,body,wide=true){
  closeV8Modal();
  const w=document.createElement('div');
  w.id='v8-modal'; w.className='modal-backdrop';
  w.innerHTML=`<div class="modal ${wide?'wide':''} v8-modal"><div class="modal-head"><h2>${V.esc(title)}</h2><button class="icon-btn" type="button" onclick="app.closeV8Modal()">×</button></div>${body}</div>`;
  document.body.appendChild(w);
  w.addEventListener('click',e=>e.target===w&&closeV8Modal());
  return w;
}

function studentRows(d,checked){
  return (d.licenses||[]).slice().sort((a,b)=>(a.fullName||'').localeCompare(b.fullName||'','fr')).map(l=>`
    <label class="v8-student-row" data-search="${V.esc(V.norm(`${l.fullName} ${l.className} ${l.category} ${l.sectionOption||''}`))}">
      <input type="checkbox" name="studentIds" value="${V.esc(l.studentId)}" ${checked.has(l.studentId)?'checked':''}>
      <span class="v8-student-copy">
        <strong>${V.esc(l.fullName)}</strong>
        <small>${V.esc(l.className)} · ${V.esc(l.category)}${l.sectionOption?` · ${V.esc(l.sectionOption)}`:''}</small>
      </span>
    </label>`).join('');
}

function filterStudents(input){
  const q=V.norm(input.value);
  const wrap=input.closest('.v8-student-picker');
  let shown=0;
  wrap?.querySelectorAll('.v8-student-row').forEach(row=>{
    const ok=!q||(row.dataset.search||'').includes(q);
    row.hidden=!ok;if(ok)shown++;
  });
  const c=wrap?.querySelector('.v8-student-count'); if(c)c.textContent=`${shown} élève${shown>1?'s':''} affiché${shown>1?'s':''}`;
}

function editConv(id){
  if(!V.isManager())return;
  const d=V.read(),c=id?(d.convocations||[]).find(x=>x.id===id):null,checked=new Set(c?.studentIds||[]);
  const body=`<form id="v8-conv-form" class="form-grid">
    <label class="field"><span>Activité</span><select name="activity">${V.options(V.ACTIVITIES,c?.activity||V.ACTIVITIES[0],null)}</select></label>
    <label class="field"><span>Titre</span><input name="title" required value="${V.esc(c?.title||'')}"></label>
    <label class="field"><span>Catégorie</span><select name="ageCategory">${V.options(V.AGE_CATEGORIES,c?.ageCategory||V.AGE_CATEGORIES[0],null)}</select></label>
    <label class="field"><span>Spécialité</span><select name="specialty">${V.options(V.SPECIALTIES,c?.specialty||V.SPECIALTIES[0],null)}</select></label>
    <label class="field"><span>Date</span><input type="date" name="date" required value="${V.esc(c?.date||V.today())}"></label>
    <label class="field"><span>Lieu</span><input name="place" value="${V.esc(c?.place||'')}"></label>
    <label class="field"><span>Heure de départ</span><input type="time" name="departure" value="${V.esc(c?.departure||'')}"></label>
    <label class="field"><span>Heure de retour</span><input type="time" name="returnTime" value="${V.esc(c?.returnTime||'')}"></label>
    <label class="field full"><span>Point de rendez-vous</span><input name="meetingPoint" value="${V.esc(c?.meetingPoint||'')}"></label>
    <label class="field full"><span>Professeur référent</span><select name="teacher" required>${V.options(V.TEACHERS,c?.teacher||'','Choisir un professeur')}</select></label>
    <label class="field full"><span>Informations importantes</span><textarea name="extraInfo" placeholder="Repas, tenue, consignes, changement d’horaire…">${V.esc(c?.extraInfo||'')}</textarea></label>
    <div class="field full v8-picker-field">
      <span>Élèves convoqués</span>
      <div class="v8-student-picker">
        <div class="v8-student-toolbar">
          <label class="v8-search"><span>⌕</span><input type="search" placeholder="Rechercher un élève, une classe…" oninput="app.v8FilterStudents(this)"></label>
          <small class="v8-student-count">${(d.licenses||[]).length} élèves affichés</small>
        </div>
        <div class="v8-student-list">${studentRows(d,checked)}</div>
      </div>
    </div>
    <div class="field full modal-actions v8-sticky-actions"><button class="btn" type="submit">Enregistrer</button></div>
  </form>`;
  const m=modal(id?'Modifier une convocation':'Ajouter une convocation',body,true);
  m.querySelector('#v8-conv-form').addEventListener('submit',e=>{
    e.preventDefault();
    const fd=new FormData(e.currentTarget);
    if(!fd.get('teacher'))return alert('Choisissez le professeur référent.');
    const o={
      id:c?.id||V.uid('c'),activity:fd.get('activity'),title:String(fd.get('title')||'').trim(),
      ageCategory:fd.get('ageCategory'),specialty:fd.get('specialty'),date:fd.get('date'),
      place:String(fd.get('place')||'').trim(),departure:fd.get('departure'),returnTime:fd.get('returnTime'),
      meetingPoint:String(fd.get('meetingPoint')||'').trim(),teacher:fd.get('teacher'),
      extraInfo:String(fd.get('extraInfo')||'').trim(),studentIds:fd.getAll('studentIds')
    };
    d.convocations=d.convocations||[]; c?Object.assign(c,o):d.convocations.push(o);
    (d.events||[]).forEach(ev=>{if(ev.convocationId===o.id)ev.convocationId=null;});
    const ev=(d.events||[]).find(x=>x.date===o.date&&x.specialty===o.specialty&&x.title===o.title); if(ev)ev.convocationId=o.id;
    V.write(d); location.reload();
  });
}

function openConv(id){
  const d=V.read(),c=(d.convocations||[]).find(x=>x.id===id);if(!c)return;
  const names=(c.studentIds||[]).map(x=>V.studentName(d,x)).filter(Boolean);
  modal(c.title||'Convocation',`
    <div class="v8-conv-head"><div><span class="v8-eyebrow">${V.esc(c.activity||'Activité')}</span><h3>${V.esc(c.title||'')}</h3></div><span class="v8-specialty">${V.esc(c.specialty||'')}</span></div>
    <div class="convocation-detail v8-conv-detail">
      <div class="detail-block"><span>Date</span><strong>${V.esc(V.fmtLong(c.date))}</strong></div>
      <div class="detail-block"><span>Lieu</span><strong>${V.esc(c.place||'—')}</strong></div>
      <div class="detail-block"><span>Départ</span><strong>${V.esc(c.departure||'—')}</strong></div>
      <div class="detail-block"><span>Retour</span><strong>${V.esc(c.returnTime||'—')}</strong></div>
      <div class="detail-block full"><span>Point de rendez-vous</span><strong>${V.esc(c.meetingPoint||'—')}</strong></div>
      <div class="detail-block full"><span>Professeur référent</span><strong>${V.esc(c.teacher||'Non renseigné')}</strong>
        <button class="v8-ed-btn" type="button" onclick="window.open('${V.ECOLE_DIRECTE}','_blank','noopener')">
          <img src="${ED_LOGO}" alt="ÉcoleDirecte"><span>Ouvrir ÉcoleDirecte</span><b>↗</b>
        </button>
      </div>
      <div class="detail-block full v8-important"><span>Informations importantes</span><strong>${V.esc(c.extraInfo||'Aucune information particulière.')}</strong></div>
    </div>
    <div class="convocation-students"><strong>Élèves convoqués</strong><div class="student-chip-list">${names.map(n=>`<span class="student-chip">${V.esc(n)}</span>`).join('')||'<span class="muted">Aucun élève.</span>'}</div></div>
    <div class="v8-modal-actions"><button class="btn yellow" type="button" onclick="app.exportConvocation('${V.esc(c.id)}')">Exporter la convocation</button></div>
  `,true);
}

function patchConvCards(){
  if((document.querySelector('.page-title h1')?.textContent||'').trim()!=='Convocations')return;
  const d=V.read();
  document.querySelectorAll('.convocation-card').forEach(card=>{
    let b=card.querySelector('.v8-export-conv');
    if(b)return;
    const title=card.querySelector('.event-title')?.textContent||'';
    const c=(d.convocations||[]).find(x=>title.includes(x.title))||(d.convocations||[]).find(x=>card.textContent.includes(x.title));
    if(!c)return;
    b=document.createElement('button'); b.type='button'; b.className='btn yellow tiny v8-export-conv'; b.textContent='Exporter la convocation';
    b.onclick=e=>{e.preventDefault();e.stopPropagation();app.exportConvocation(c.id);};
    card.querySelector('.v7-export-conv')?.remove();
    card.appendChild(b);
  });
}

function patchEDExisting(){
  document.querySelectorAll('.v7-ed-btn').forEach(btn=>{
    if(btn.classList.contains('v8-patched'))return;
    btn.classList.add('v8-patched','v8-ed-btn');
    btn.innerHTML=`<img src="${ED_LOGO}" alt="ÉcoleDirecte"><span>Ouvrir ÉcoleDirecte</span><b>↗</b>`;
  });
}

function patchAll(){patchConvCards();patchEDExisting();}
app.closeV8Modal=closeV8Modal;
app.v8FilterStudents=filterStudents;
app.editConv=editConv;
app.openConv=openConv;
const root=document.getElementById('app');if(root)new MutationObserver(()=>requestAnimationFrame(patchAll)).observe(root,{childList:true,subtree:true});
patchAll();
window.ASV8={VERSION,ED_LOGO};
})();
