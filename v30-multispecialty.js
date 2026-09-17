(() => {
'use strict';

const SPECIALTIES=['Association Sportive','Section Football','Option Escalade','Sport-études Gymnastique'];
const AGE_CATEGORIES=['Benjamin','Benjamine','Minime fille','Minime garçon','Lycéen','Lycéenne','Toutes catégories'];
const ROLE_SPECIALTY={
  educator_escalade:'Option Escalade',
  educator_football:'Section Football',
  educator_gymnastique:'Sport-études Gymnastique'
};

const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const uid=(p='e')=>p+(globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2,12));

function eventSpecialties(event){
  if(!event)return ['Association Sportive'];
  const raw=Array.isArray(event.specialties)?event.specialties:[];
  const list=[...new Set(raw.filter(x=>SPECIALTIES.includes(x)))];
  const fallback=SPECIALTIES.includes(event.specialty)?event.specialty:'Association Sportive';
  if(!list.length)list.push(fallback);
  return list;
}

function normalizeEvent(event){
  if(!event||typeof event!=='object')return event;
  const specialties=eventSpecialties(event);
  if(!Object.prototype.hasOwnProperty.call(event,'__bsPrimarySpecialty')){
    Object.defineProperty(event,'__bsPrimarySpecialty',{
      value:SPECIALTIES.includes(event.specialty)?event.specialty:specialties[0],
      writable:true,
      configurable:true,
      enumerable:false
    });
  }
  if(!specialties.includes(event.__bsPrimarySpecialty))event.__bsPrimarySpecialty=specialties[0];
  event.specialties=specialties;
  return event;
}

function normalizeData(data){
  (data?.events||[]).forEach(normalizeEvent);
  return data;
}

function primarySpecialty(event){
  normalizeEvent(event);
  return event?.__bsPrimarySpecialty||event?.specialty||'Association Sportive';
}

function roleSpecialty(role){return ROLE_SPECIALTY[role]||''}

function applyCalendarContext(specialty=''){
  const data=window.app?.readData?.();
  (data?.events||[]).forEach(event=>{
    normalizeEvent(event);
    const primary=primarySpecialty(event);
    event.specialty=specialty&&event.specialties.includes(specialty)?specialty:primary;
  });
}

function restorePrimarySpecialties(){applyCalendarContext('')}

function linkedConvocation(event){
  const data=window.app?.readData?.()||{};
  const specialties=eventSpecialties(event);
  return (data.convocations||[]).find(c=>
    String(c.id)===String(event?.convocationId||'') ||
    (c.date===event?.date&&c.title===event?.title&&specialties.includes(c.specialty))
  )||null;
}

function options(items,current){
  return items.map(x=>`<option value="${esc(x)}" ${x===current?'selected':''}>${esc(x)}</option>`).join('');
}

function injectCss(){
  if(document.getElementById('v30-multi-css'))return;
  const style=document.createElement('style');
  style.id='v30-multi-css';
  style.textContent=`
  .v30-specialty-field{grid-column:1/-1}
  .v30-specialty-field>.v30-label{display:block;font-size:12px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);margin-bottom:8px}
  .v30-specialty-picker{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
  .v30-specialty-option{display:flex!important;align-items:center;gap:10px;padding:13px 14px;border:1px solid var(--line);border-radius:15px;background:var(--card);cursor:pointer;min-height:50px}
  .v30-specialty-option input{width:19px!important;height:19px!important;flex:0 0 auto;accent-color:#0757C9}
  .v30-specialty-option span{font-weight:800;line-height:1.2}
  .v30-specialty-help{display:block;margin-top:8px;color:var(--muted);font-size:12px;line-height:1.4}
  .v30-specialty-option:has(input:checked){border-color:#4b8fe8;background:color-mix(in srgb,#0757C9 7%,var(--card));box-shadow:0 0 0 1px color-mix(in srgb,#0757C9 25%,transparent)}
  @media(max-width:640px){.v30-specialty-picker{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
}

function modal(title,html){
  document.getElementById('v19-modal')?.remove();
  document.getElementById('v22-modal')?.remove();
  const w=document.createElement('div');
  w.className='v19-modal-backdrop';w.id='v19-modal';
  w.innerHTML=`<div class="v19-modal wide" role="dialog" aria-modal="true"><div class="v19-modal-head"><h2>${esc(title)}</h2><button class="v19-icon-btn" type="button" aria-label="Fermer" data-close>×</button></div><div class="v19-modal-body">${html}</div></div>`;
  document.body.appendChild(w);
  const close=()=>w.remove();
  w.querySelector('[data-close]').onclick=close;
  w.addEventListener('click',e=>{if(e.target===w)close()});
  setTimeout(()=>w.querySelector('input,select,button')?.focus(),30);
  return w;
}

async function editEventMulti(id){
  const app=window.app;if(!app)return;
  const role=app.role?.()||'public';
  if(!['teacher_as','admin'].includes(role))return;

  restorePrimarySpecialties();
  const data=app.readData?.()||{};
  const event=id?(data.events||[]).find(x=>String(x.id)===String(id)):null;
  if(event)normalizeEvent(event);
  const selected=new Set(eventSpecialties(event));
  const linked=event?linkedConvocation(event):null;
  const currentPrimary=event?primarySpecialty(event):'Association Sportive';

  const specialtyPicker=SPECIALTIES.map(sp=>`<label class="v30-specialty-option"><input type="checkbox" name="specialties" value="${esc(sp)}" ${selected.has(sp)?'checked':''}><span>${esc(sp)}</span></label>`).join('');
  const m=modal(id?'Modifier un événement':'Ajouter un événement',`<form id="v30-event-form" class="v19-form">
    <label><span>Titre</span><input name="title" required value="${esc(event?.title||'')}"></label>
    <label><span>Catégorie</span><select name="ageCategory">${options(AGE_CATEGORIES,event?.ageCategory||'Toutes catégories')}</select></label>
    <div class="v30-specialty-field"><span class="v30-label">Spécialités concernées</span><div class="v30-specialty-picker">${specialtyPicker}</div><small class="v30-specialty-help">Vous pouvez sélectionner plusieurs espaces. L’événement sera enregistré une seule fois et apparaîtra dans chacun des calendriers concernés.</small></div>
    <label><span>Date</span><input type="date" name="date" required value="${esc(event?.date||new Date().toISOString().slice(0,10))}"></label>
    <label><span>Heure de départ</span><input type="time" name="startTime" value="${esc(event?.startTime||'12:30')}"></label>
    <label><span>Heure de retour</span><input type="time" name="endTime" value="${esc(event?.endTime||'14:30')}"></label>
    <label class="full"><span>Lieu</span><input name="place" value="${esc(event?.place||'')}"></label>
    <label class="full v2115-registration-choice"><input type="checkbox" name="registrationOpen" ${event?.registrationOpen&&!linked?'checked':''} ${linked?'disabled':''}><span><strong>Ouvrir l’inscription libre</strong><small>${linked?'Une convocation est déjà liée à cet événement.':'Affiche le bouton Inscription tant qu’aucune convocation n’est disponible.'}</small></span></label>
    <div class="full v2115-form-status" data-event-status aria-live="polite"></div>
    <div class="full v19-modal-actions"><button class="v19-btn" type="submit">Enregistrer</button></div>
  </form>`);

  const form=m.querySelector('#v30-event-form');
  const status=m.querySelector('[data-event-status]');
  const button=form.querySelector('button[type="submit"]');
  form.onsubmit=async ev=>{
    ev.preventDefault();
    const fd=new FormData(form);
    const specialties=[...new Set(fd.getAll('specialties').filter(x=>SPECIALTIES.includes(x)))];
    if(!specialties.length){status.textContent='Sélectionnez au moins une spécialité.';status.className='full v2115-form-status error';return}
    const primary=specialties.includes(currentPrimary)?currentPrimary:specialties[0];
    const obj={
      id:event?.id||uid('e'),
      title:String(fd.get('title')||'').trim(),
      ageCategory:fd.get('ageCategory'),
      specialty:primary,
      specialties,
      date:fd.get('date'),
      startTime:fd.get('startTime'),
      endTime:fd.get('endTime'),
      place:String(fd.get('place')||'').trim(),
      convocationId:event?.convocationId||null,
      registrationOpen:!linked&&fd.get('registrationOpen')==='on'
    };
    button.disabled=true;button.textContent='Enregistrement…';status.textContent='';status.className='full v2115-form-status';
    try{
      if(typeof window.__BS_PERSIST_EVENT!=='function')throw new Error('SERVICE_UNAVAILABLE');
      await window.__BS_PERSIST_EVENT(obj);
      if(event){Object.assign(event,obj);event.__bsPrimarySpecialty=primary;normalizeEvent(event)}
      else{normalizeEvent(obj);data.events=(data.events||[]);data.events.push(obj)}
      m.remove();
      applyCalendarContext(roleSpecialty(role));
      app.go?.('calendar');
      const msg=specialties.length>1?`Événement enregistré dans ${specialties.length} calendriers`:'Événement enregistré';
      if(typeof window.__BS_SAVED==='function')window.__BS_SAVED(msg,'Une seule fiche événement est synchronisée pour toutes les spécialités sélectionnées.');
    }catch(error){
      console.warn('V30 événement multi-spécialités',error);
      button.disabled=false;button.textContent='Enregistrer';
      status.textContent='L’événement n’a pas pu être enregistré dans la base centrale. Réessayez.';
      status.className='full v2115-form-status error';
    }
  };
}

function patchApp(){
  if(!window.app)return setTimeout(patchApp,60);
  if(window.app.__v30MultiSpecialty)return;
  injectCss();
  normalizeData(window.app.readData?.());

  const originalGo=window.app.go?.bind(window.app);
  const originalOpenPublicSpecialty=window.app.openPublicSpecialty?.bind(window.app);
  const originalHydrate=window.app.hydrateFromServer?.bind(window.app);

  window.app.editEvent=editEventMulti;

  if(originalGo){
    window.app.go=function(route){
      const sp=roleSpecialty(window.app.role?.());
      applyCalendarContext(sp);
      return originalGo(route);
    };
  }

  if(originalOpenPublicSpecialty){
    window.app.openPublicSpecialty=function(sp){
      normalizeData(window.app.readData?.());
      applyCalendarContext(SPECIALTIES.includes(sp)?sp:'');
      return originalOpenPublicSpecialty(sp);
    };
  }

  if(originalHydrate){
    window.app.hydrateFromServer=function(data,role){
      normalizeData(data);
      const sp=roleSpecialty(role);
      (data?.events||[]).forEach(event=>{
        const primary=primarySpecialty(event);
        event.specialty=sp&&event.specialties.includes(sp)?sp:primary;
      });
      return originalHydrate(data,role);
    };
  }

  window.app.__v30MultiSpecialty=true;
  window.app.eventSpecialties=eventSpecialties;

  const currentRole=window.app.role?.()||'public';
  const sp=roleSpecialty(currentRole);
  if(sp){applyCalendarContext(sp);originalGo?.('home')}
}

window.addEventListener('bs-app-rendered',()=>{
  const role=window.app?.role?.()||'public';
  const sp=roleSpecialty(role);
  if(sp)applyCalendarContext(sp);
});

patchApp();
window.ASV30_MULTI={version:'30.0.0',feature:'multi-specialty-events'};
})();
