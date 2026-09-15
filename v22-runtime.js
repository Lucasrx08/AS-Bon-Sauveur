(() => {
'use strict';

const cfg=window.APP_CONFIG||{};
const CLASSES=[
'6e AVIGNON','6e Georges BIZET','6e Paul CEZANNE','6e Alphonse DAUDET',
'5e Jacqueline AURIOL','5e Adrienne BOLLAND','5e Bessie COLEMAN','5e Elise DEROCHE',
'4e ESTANGUET','4e FLESSEL','4e Cyril MORE','4e DELAUNAY',
'3e Antonio GAUDI','3e BARCELONE','3e CASTILLE','3e DALI','3e ESPINOZA',
'Seconde Pro ECP','Seconde Pro Maslow','Seconde Pro Henderson','Seconde GT',
'Première Pro ECP','Première Pro Curie','Première Pro Pasteur','Première ST2S',
'Terminale ST2S','Terminale ASSP'
];
const SIZES=['7/8 ans','9/11 ans','12/13 ans','XS','S','M','L','XL','XXL','XXXL','XXXXL'];
const PAYMENTS=['Espèces','Virement','Chèque'];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const tidy=s=>String(s||'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().replace(/\s+/g,' ');
const uuid=()=>globalThis.crypto?.randomUUID?.()||'00000000-0000-4000-8000-'+Math.random().toString(16).slice(2).padEnd(12,'0').slice(0,12);
const toast=msg=>{const el=document.createElement('div');el.className='v19-toast';el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),3200)};
const api=(name)=>String(cfg.supabaseUrl||'').replace(/\/$/,'')+'/functions/v1/'+name;
const headers=()=>({'Content-Type':'application/json','apikey':cfg.supabaseAnonKey||''});

function modal(title,body){
  document.getElementById('v22-modal')?.remove();
  document.getElementById('v19-modal')?.remove();
  const w=document.createElement('div');
  w.id='v22-modal';w.className='v19-modal-backdrop';
  w.innerHTML='<div class="v19-modal" role="dialog" aria-modal="true"><div class="v19-modal-head"><h2>'+esc(title)+'</h2><button type="button" class="v19-icon-btn" data-close aria-label="Fermer">×</button></div><div class="v19-modal-body">'+body+'</div></div>';
  document.body.appendChild(w);
  const close=()=>w.remove();
  w.querySelector('[data-close]').onclick=close;
  w.onclick=e=>{if(e.target===w)close()};
  setTimeout(()=>w.querySelector('input,select,button')?.focus(),20);
  return w;
}
const opts=(items,selected='')=>items.map(x=>'<option value="'+esc(x)+'" '+(x===selected?'selected':'')+'>'+esc(x)+'</option>').join('');

async function postPublic(name,payload,timeout=12000){
  if(!cfg.supabaseUrl||!cfg.supabaseAnonKey)throw new Error('Service indisponible.');
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeout);
  try{
    const response=await fetch(api(name),{method:'POST',headers:headers(),body:JSON.stringify(payload),signal:controller.signal,cache:'no-store',credentials:'omit'});
    let body={};try{body=await response.json()}catch{}
    if(!response.ok)throw new Error(body?.error||'La demande n’a pas pu être enregistrée.');
    return body;
  }catch(error){
    if(error?.name==='AbortError')throw new Error('Le serveur met trop de temps à répondre. Réessayez.');
    throw error;
  }finally{clearTimeout(timer)}
}

function currentData(){return window.app?.readData?.()||{}}
function productById(id){return (currentData().products||[]).find(p=>String(p.id)===String(id))}
function eventById(id){return (currentData().events||[]).find(e=>String(e.id)===String(id))}
function linkedConvocation(event){
  if(!event)return null;
  return (currentData().convocations||[]).find(c=>String(c.id)===String(event.convocationId)||(c.date===event.date&&c.specialty===event.specialty&&c.title===event.title))||null;
}
function fmtDate(value){
  if(!value)return '';
  try{return new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(value+'T12:00:00'))}catch{return value}
}

function secureOrder(productId){
  const product=productById(productId);if(!product)return toast('Produit introuvable.');
  const w=modal('Commander — '+product.name,
    '<div class="v22-secure-note"><strong>Commande sécurisée</strong><span>Vos informations sont transmises directement au service AS et ne sont pas conservées durablement dans ce navigateur.</span></div>'+
    '<form id="v22-order-form" class="v19-form">'+
    '<label class="full"><span>Nom & prénom de l’élève</span><input name="studentName" required minlength="2" maxlength="120" autocomplete="name"></label>'+
    '<label class="full"><span>Classe</span><select name="className" required><option value="">Choisir une classe</option>'+opts(CLASSES)+'</select></label>'+
    '<label><span>Taille</span><select name="size">'+opts(SIZES,'M')+'</select></label>'+
    '<label><span>Quantité</span><input type="number" name="quantity" min="1" max="10" value="1"></label>'+
    '<label><span>Mode de paiement</span><select name="paymentMethod">'+opts(PAYMENTS,'Chèque')+'</select></label>'+
    '<label><span>Couleur / modèle</span><input name="color" maxlength="80" value="'+esc(product.color||'')+'"></label>'+
    '<div class="full v221-inline-privacy">Données utilisées uniquement pour gérer cette commande, conservées 12 mois maximum. <button type="button" onclick="app.privacy()">En savoir plus</button></div><div class="full v19-modal-actions"><button class="v19-btn yellow" type="submit">Valider la commande</button></div></form>'+
    '<div class="v22-status" aria-live="polite"></div>');
  const form=w.querySelector('#v22-order-form'),status=w.querySelector('.v22-status'),button=form.querySelector('[type=submit]');
  form.onsubmit=async e=>{
    e.preventDefault();const fd=new FormData(form);
    const payload={requestId:uuid(),productId:String(productId),studentName:tidy(fd.get('studentName')),className:String(fd.get('className')||''),size:String(fd.get('size')||''),quantity:Number(fd.get('quantity')||1),paymentMethod:String(fd.get('paymentMethod')||''),color:tidy(fd.get('color'))};
    if(!CLASSES.includes(payload.className)){status.textContent='Choisissez une classe.';status.className='v22-status error';return}
    button.disabled=true;button.textContent='Enregistrement…';status.textContent='';status.className='v22-status';
    try{
      const result=await postPublic('public-order',payload);
      w.querySelector('.v19-modal-body').innerHTML='<div class="v2115-registration-success"><span>✓</span><h3>Commande enregistrée</h3><p>Référence <strong>'+esc(result.reference||'AS')+'</strong>. Le paiement sera vérifié manuellement par l’équipe de l’AS.</p><button class="v19-btn" data-ok>Fermer</button></div>';
      w.querySelector('[data-ok]').onclick=()=>w.remove();
    }catch(error){status.textContent=error.message;status.className='v22-status error';button.disabled=false;button.textContent='Valider la commande'}
  };
}

function secureRegistration(eventId){
  const event=eventById(eventId);
  if(!event)return toast('Événement introuvable.');
  if(linkedConvocation(event)||!event.registrationOpen||String(event.date||'')<new Date().toISOString().slice(0,10))return toast('Les inscriptions ne sont pas ouvertes pour cet événement.');
  const w=modal('Inscription',
    '<div class="v2115-registration-intro"><div class="v19-kicker">'+esc(event.specialty||'AS')+'</div><h3>'+esc(event.title||'Événement')+'</h3><p>'+esc(fmtDate(event.date))+' · '+esc(event.startTime||'Horaire à préciser')+(event.endTime?' → '+esc(event.endTime):'')+' · '+esc(event.place||'Lieu à préciser')+'</p></div>'+
    '<form id="v22-registration-form" class="v19-form">'+
    '<label><span>Nom</span><input name="lastName" required minlength="2" maxlength="80" autocomplete="family-name"></label>'+
    '<label><span>Prénom</span><input name="firstName" required minlength="2" maxlength="80" autocomplete="given-name"></label>'+
    '<label class="full"><span>Classe</span><select name="className" required><option value="">Choisir une classe</option>'+opts(CLASSES)+'</select></label>'+
    '<div class="full v221-inline-privacy">Ces informations servent uniquement à organiser cette activité et sont supprimées au plus tard 90 jours après l’événement. <button type="button" onclick="app.privacy()">En savoir plus</button></div>'+
    '<div class="full v22-status" aria-live="polite"></div>'+
    '<div class="full v19-modal-actions"><button class="v19-btn yellow" type="submit">Valider mon inscription</button></div></form>');
  const form=w.querySelector('#v22-registration-form'),status=w.querySelector('.v22-status'),button=form.querySelector('[type=submit]');
  form.onsubmit=async e=>{
    e.preventDefault();const fd=new FormData(form);
    const payload={requestId:uuid(),eventId:String(eventId),lastName:tidy(fd.get('lastName')).toLocaleUpperCase('fr-FR'),firstName:tidy(fd.get('firstName')),className:String(fd.get('className')||'')};
    if(!CLASSES.includes(payload.className)){status.textContent='Choisissez une classe.';status.className='full v22-status error';return}
    button.disabled=true;button.textContent='Inscription en cours…';status.textContent='';status.className='full v22-status';
    try{
      await postPublic('public-registration',payload);
      w.querySelector('.v19-modal-body').innerHTML='<div class="v2115-registration-success"><span>✓</span><h3>'+esc(payload.firstName)+' '+esc(payload.lastName)+'</h3><p>L’inscription à <strong>'+esc(event.title)+'</strong> est bien enregistrée.</p><button class="v19-btn" data-ok>Fermer</button></div>';
      w.querySelector('[data-ok]').onclick=()=>w.remove();
    }catch(error){status.textContent=error.message;status.className='full v22-status error';button.disabled=false;button.textContent='Valider mon inscription'}
  };
}

function install(){
  if(!window.app)return setTimeout(install,60);
  window.app.order=secureOrder;
  window.app.openEventRegistration=secureRegistration;
  window.ASV22={version:'22.1.0',features:['privacy-session-storage','secure-public-orders','secure-public-registrations','rate-limits','automatic-retention']};
  document.documentElement.dataset.appVersion='22';
}
install();
})();