(()=>{
'use strict';
const cfg=window.APP_CONFIG||{};
const sb=window.__BS_SUPABASE_CLIENT;
const STORE='bs-app-data-v4';
const ROLE_KEY='bs-demo-role-v4';
const VERIFIED='bs-v20-verified-role';
const ROLES=['public','teacher_as','admin','educator_football','educator_gymnastique','educator_escalade'];
const MANAGERS=['teacher_as','admin'];
const CLASSES=['6e AVIGNON','6e Georges BIZET','6e Paul CEZANNE','6e Alphonse DAUDET','5e Jacqueline AURIOL','5e Adrienne BOLLAND','5e Bessie COLEMAN','5e Elise DEROCHE','4e ESTANGUET','4e FLESSEL','4e Cyril MORE','4e DELAUNAY','3e Antonio GAUDI','3e BARCELONE','3e CASTILLE','3e DALI','3e ESPINOZA','Seconde Pro ECP','Seconde Pro Maslow','Seconde Pro Henderson','Seconde GT','Première Pro ECP','Première Pro Curie','Première Pro Pasteur','Première ST2S','Terminale ST2S','Terminale ASSP'];
const SIZES=['7/8 ans','9/11 ans','12/13 ans','XS','S','M','L','XL','XXL','XXXL','XXXXL'];
const PAYMENTS=['Espèces','Virement','Chèque'];
let hydrating=true,currentRole='public',currentUser=null,currentTerm=1,snapshot={},queue=Promise.resolve();

const clone=value=>JSON.parse(JSON.stringify(value||{}));
const esc=value=>String(value??'').replace(/[&<>"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
const tidy=value=>String(value||'').trim().replace(/\s+/g,' ');
const toast=message=>{const el=document.createElement('div');el.className='v19-toast';el.setAttribute('role','status');el.textContent=message;document.body.appendChild(el);setTimeout(()=>el.remove(),3400)};
const emptyData=()=>({events:[],documents:[],products:[],students:[],appreciations:[],licenses:[],convocations:[],reports:[],orders:[],eventRegistrations:[],specialtyNotes:{},termSettings:{}});
const camel=row=>Object.fromEntries(Object.entries(row||{}).map(([key,value])=>[key.replace(/_([a-z])/g,(_,letter)=>letter.toUpperCase()),value]));
function uuid(){
 if(globalThis.crypto?.randomUUID)return globalThis.crypto.randomUUID();
 const bytes=new Uint8Array(16);globalThis.crypto?.getRandomValues?.(bytes);
 bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
 return [...bytes].map((value,index)=>([4,6,8,10].includes(index)?'-':'')+value.toString(16).padStart(2,'0')).join('')
}
function modal(title,body){
 document.getElementById('v22-modal')?.remove();
 const wrap=document.createElement('div');wrap.id='v22-modal';wrap.className='v19-modal-backdrop';
 wrap.innerHTML='<div class="v19-modal" role="dialog" aria-modal="true" aria-labelledby="v22-modal-title"><div class="v19-modal-head"><h2 id="v22-modal-title">'+esc(title)+'</h2><button type="button" class="v19-icon-btn" aria-label="Fermer" data-close>×</button></div><div class="v19-modal-body">'+body+'</div></div>';
 document.body.appendChild(wrap);
 const close=()=>wrap.remove();wrap.querySelector('[data-close]').onclick=close;wrap.onclick=event=>{if(event.target===wrap)close()};
 wrap.addEventListener('keydown',event=>{if(event.key==='Escape')close()});
 setTimeout(()=>wrap.querySelector('input,select,button,textarea')?.focus(),20);return wrap
}
async function rows(table){
 const out=await sb.from(table).select('*');
 if(out.error)throw new Error(out.error.message||('Lecture impossible : '+table));
 return Array.isArray(out.data)?out.data:[]
}
function notesFrom(rowsValue){const out={};rowsValue.map(camel).forEach(row=>{out[row.specialty]={message:row.message||'',expiresAt:row.expiresAt||'',active:!!row.active}});return out}
function termsFrom(rowsValue){const out={};rowsValue.map(camel).forEach(row=>{out[row.term]={deadline:row.deadline||'',end:row.termEnd||''}});return out}
async function publicData(){
 const [events,documents,products,convocations,notes]=await Promise.all([rows('v20_events'),rows('v20_documents'),rows('v20_products'),rows('v20_convocations'),rows('v20_specialty_notes')]);
 return {...emptyData(),events:events.map(camel),documents:documents.map(camel),products:products.map(camel),convocations:convocations.map(camel).map(({studentIds,...item})=>item),specialtyNotes:notesFrom(notes)}
}
async function privateData(role){
 const data=await publicData();
 const jobs={students:rows('v20_students'),licenses:rows('v20_licenses'),appreciations:rows('v20_appreciations'),terms:rows('v20_term_settings'),links:rows('v20_convocation_students')};
 if(MANAGERS.includes(role)){jobs.reports=rows('v20_reports');jobs.orders=rows('v20_orders');jobs.registrations=rows('v20_event_registrations')}
 const result=await Promise.all(Object.values(jobs));const values=Object.fromEntries(Object.keys(jobs).map((key,index)=>[key,result[index]]));
 data.students=values.students.map(camel);data.licenses=values.licenses.map(camel);data.appreciations=values.appreciations.map(camel);data.termSettings=termsFrom(values.terms);
 const links=values.links.map(camel);data.convocations=data.convocations.map(item=>({...item,studentIds:links.filter(link=>String(link.convocationId)===String(item.id)).map(link=>link.studentId)}));
 if(values.reports)data.reports=values.reports.map(camel);
 if(values.orders)data.orders=values.orders.map(camel);
 if(values.registrations)data.eventRegistrations=values.registrations.map(camel);
 return data
}
async function hydrate(){
 if(!sb)throw new Error('Configuration Supabase absente.');
 hydrating=true;
 const session=(await sb.auth.getSession())?.data?.session||null;
 let role='public',data;
 if(session?.user){
  const profileOut=await sb.from('profiles').select('id,display_name,role').eq('id',session.user.id).single();
  if(profileOut.error||!profileOut.data){await sb.auth.signOut();throw new Error('Profil utilisateur inaccessible. Reconnectez-vous.')}
  const profile=profileOut.data,tokenRole=String(session.user?.app_metadata?.role||'public');
  role=ROLES.includes(String(profile.role))?String(profile.role):'public';
  if(role!==tokenRole){await sb.auth.signOut();sessionStorage.removeItem(VERIFIED);localStorage.setItem(ROLE_KEY,'public');throw new Error('Vos droits ont été actualisés. Reconnectez-vous.')}
  currentUser={id:session.user.id,name:profile.display_name||'Utilisateur'};data=await privateData(role)
 }else{data=await publicData()}
 currentRole=role;sessionStorage.setItem(VERIFIED,role);localStorage.setItem(ROLE_KEY,role);
 localStorage.setItem(STORE,JSON.stringify(data));snapshot=clone(data);
 window.app?.hydrateFromServer?.(data,role);hydrating=false;document.documentElement.classList.remove('v22-loading');
 return data
}
function same(left,right){return JSON.stringify(left)===JSON.stringify(right)}
function byId(items){return new Map((items||[]).map(item=>[String(item.id),item]))}
function allowedKeys(){
 if(MANAGERS.includes(currentRole))return ['events','documents','products','students','licenses','convocations','reports','orders','appreciations'];
 if(currentRole.startsWith('educator_'))return ['appreciations'];
 return []
}
function rowFor(key,item){
 const value=item||{};
 const pick=(...names)=>Object.fromEntries(names.map(name=>[name,value[name.replace(/_([a-z])/g,(_,letter)=>letter.toUpperCase())]]));
 let out={};
 if(key==='events')out=pick('id','title','age_category','specialty','date','start_time','end_time','place','convocation_id','public_visible','registration_open');
 if(key==='documents')out=pick('id','title','specialty','date','description','url','featured','public_visible');
 if(key==='products')out=pick('id','name','description','price','deadline','active','image','color');
 if(key==='students')out=pick('id','full_name','class_name','specialty','active');
 if(key==='licenses')out=pick('id','student_id','full_name','class_name','category','contribution','payment_status','amount','charter_signed','section_option');
 if(key==='convocations')out=pick('id','title','activity','age_category','specialty','date','departure','return_time','place','meeting_point','teacher','extra_info','status','public_visible');
 if(key==='reports')out=pick('id','date','activity','teacher','level','place','category','participants','comment');
 if(key==='orders')out=pick('id','product_id','student_name','class_name','size','quantity','payment_method','paid','distributed','color','created_at');
 if(key==='appreciations'){out=pick('id','student_id','educator_id','term','text','status');if(!out.educator_id)out.educator_id=currentUser?.id||null}
 Object.keys(out).forEach(name=>{if(out[name]===undefined)delete out[name];else if(out[name]==='')out[name]=null});
 return out
}
const tableFor={events:'v20_events',documents:'v20_documents',products:'v20_products',students:'v20_students',licenses:'v20_licenses',convocations:'v20_convocations',reports:'v20_reports',orders:'v20_orders',appreciations:'v20_appreciations'};
async function syncLinks(convocation){
 const id=String(convocation.id),del=await sb.from('v20_convocation_students').delete().eq('convocation_id',id);
 if(del.error)throw new Error(del.error.message);
 const links=(convocation.studentIds||[]).map(studentId=>({convocation_id:id,student_id:String(studentId)}));
 if(links.length){const added=await sb.from('v20_convocation_students').insert(links);if(added.error)throw new Error(added.error.message)}
}
async function syncObjects(before,after){
 for(const key of allowedKeys()){
  const previous=byId(before[key]),next=byId(after[key]),table=tableFor[key];
  for(const [id,item] of next){
   const old=previous.get(id);
   if(!old||!same(rowFor(key,old),rowFor(key,item))||(key==='convocations'&&!same(old.studentIds||[],item.studentIds||[]))){
    const out=await sb.from(table).upsert(rowFor(key,item));if(out.error)throw new Error(out.error.message);
    if(key==='convocations')await syncLinks(item)
   }
  }
  for(const id of previous.keys())if(!next.has(id)){const out=await sb.from(table).delete().eq('id',id);if(out.error)throw new Error(out.error.message)}
 }
 if(MANAGERS.includes(currentRole)){
  const oldNotes=before.specialtyNotes||{},newNotes=after.specialtyNotes||{};
  for(const [specialty,note] of Object.entries(newNotes))if(!same(oldNotes[specialty],note)){
   const out=await sb.from('v20_specialty_notes').upsert({specialty,message:note?.message||null,expires_at:note?.expiresAt||null,active:!!note?.active,public_visible:true});if(out.error)throw new Error(out.error.message)
  }
 }
 if(currentRole==='admin'){
  const oldTerms=before.termSettings||{},newTerms=after.termSettings||{};
  for(const [term,value] of Object.entries(newTerms))if(!same(oldTerms[term],value)){
   const out=await sb.from('v20_term_settings').upsert({term:Number(term),deadline:value?.deadline||null,term_end:value?.end||null});if(out.error)throw new Error(out.error.message)
  }
 }
}
window.__BS_ON_DATA_WRITE=data=>{
 if(hydrating||currentRole==='public')return;
 const next=clone(data),previous=clone(snapshot);
 queue=queue.then(()=>syncObjects(previous,next)).then(()=>{snapshot=clone(next)}).catch(async error=>{console.warn('Écriture V22',error);toast('Enregistrement impossible. Les données vont être rechargées.');try{await hydrate()}catch{}})
};
async function edge(name,payload){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{
  const response=await fetch(cfg.supabaseUrl+'/functions/v1/'+name,{method:'POST',headers:{'Content-Type':'application/json','apikey':cfg.supabaseAnonKey},body:JSON.stringify(payload),signal:controller.signal});
  let data={};try{data=await response.json()}catch{}
  if(!response.ok)throw new Error(data?.error||'Le service est momentanément indisponible.');
  return data
 }catch(error){if(error?.name==='AbortError')throw new Error('Le serveur met trop de temps à répondre. Réessayez.');throw error}
 finally{clearTimeout(timer)}
}
function options(values,current=''){return values.map(value=>'<option value="'+esc(value)+'" '+(value===current?'selected':'')+'>'+esc(value)+'</option>').join('')}
function installPublicOrder(){
 window.app.order=productId=>{
  const data=window.app.readData(),product=(data.products||[]).find(item=>String(item.id)===String(productId)&&item.active!==false);
  if(!product)return toast('Ce produit n’est plus disponible.');
  const requestId=uuid();
  const wrap=modal('Commander — '+product.name,'<form id="v22-order-form" class="v19-form"><label class="full"><span>Nom et prénom de l’élève</span><input name="studentName" required minlength="2" maxlength="100" autocomplete="name"></label><label class="full"><span>Classe</span><select name="className" required>'+options(CLASSES,CLASSES[0])+'</select></label><label><span>Taille</span><select name="size">'+options(SIZES,'M')+'</select></label><label><span>Quantité</span><input type="number" name="quantity" min="1" max="10" value="1" required></label><label><span>Mode de paiement prévu</span><select name="paymentMethod">'+options(PAYMENTS,PAYMENTS[0])+'</select></label><label><span>Couleur souhaitée</span><input name="color" maxlength="80" value="'+esc(product.color||'')+'"></label><p class="full v22-form-info">La commande est enregistrée immédiatement. Son statut restera <strong>Paiement à vérifier</strong> jusqu’au contrôle manuel par l’équipe. <a href="confidentialite.html" target="_blank" rel="noopener noreferrer">Données personnelles</a></p><div class="full v2115-form-status" data-status aria-live="polite"></div><div class="full v19-modal-actions"><button class="v19-btn yellow" type="submit">Enregistrer la commande</button></div></form>');
  const form=wrap.querySelector('form'),button=form.querySelector('[type=submit]'),status=wrap.querySelector('[data-status]');
  form.onsubmit=async event=>{
   event.preventDefault();const fd=new FormData(form),payload={requestId,productId:String(product.id),studentName:tidy(fd.get('studentName')),className:String(fd.get('className')||''),size:String(fd.get('size')||''),quantity:Number(fd.get('quantity')||1),paymentMethod:String(fd.get('paymentMethod')||''),color:tidy(fd.get('color'))};
   button.disabled=true;button.textContent='Enregistrement…';status.textContent='';
   try{const result=await edge('public-order',payload);wrap.remove();modal('Commande enregistrée','<div class="v2115-registration-success"><span>✓</span><h3>'+esc(result.reference||'Commande AS')+'</h3><p>La commande est bien enregistrée.</p><p><strong>Paiement à vérifier</strong> : l’équipe mettra le statut à jour après réception réelle du règlement.</p><button class="v19-btn" type="button" data-close-success>Fermer</button></div>').querySelector('[data-close-success]').onclick=()=>document.getElementById('v22-modal')?.remove()}
   catch(error){status.textContent=error?.message||'Enregistrement impossible.';status.className='full v2115-form-status error';button.disabled=false;button.textContent='Enregistrer la commande'}
  }
 }
}
function installPublicRegistration(){
 window.app.openEventRegistration=eventId=>{
  const data=window.app.readData(),event=(data.events||[]).find(item=>String(item.id)===String(eventId));
  if(!event||!event.registrationOpen)return toast('Les inscriptions ne sont pas ouvertes.');
  const requestId=uuid();
  const wrap=modal('Inscription — '+event.title,'<form id="v22-registration-form" class="v19-form"><label><span>Nom</span><input name="lastName" required minlength="2" maxlength="80" autocomplete="family-name"></label><label><span>Prénom</span><input name="firstName" required minlength="2" maxlength="80" autocomplete="given-name"></label><label class="full"><span>Classe</span><select name="className" required><option value="">Choisir une classe</option>'+options(CLASSES)+'</select></label><p class="full v22-form-info">L’inscription est enregistrée immédiatement pour organiser l’activité. <a href="confidentialite.html" target="_blank" rel="noopener noreferrer">Données personnelles</a></p><div class="full v2115-form-status" data-status aria-live="polite"></div><div class="full v19-modal-actions"><button class="v19-btn yellow" type="submit">Valider mon inscription</button></div></form>');
  const form=wrap.querySelector('form'),button=form.querySelector('[type=submit]'),status=wrap.querySelector('[data-status]');
  form.onsubmit=async submitEvent=>{
   submitEvent.preventDefault();const fd=new FormData(form),payload={requestId,eventId:String(event.id),lastName:tidy(fd.get('lastName')).toLocaleUpperCase('fr-FR'),firstName:tidy(fd.get('firstName')),className:String(fd.get('className')||'')};
   button.disabled=true;button.textContent='Inscription…';status.textContent='';
   try{await edge('public-registration',payload);wrap.remove();modal('Inscription enregistrée','<div class="v2115-registration-success"><span>✓</span><h3>'+esc(payload.firstName)+' '+esc(payload.lastName)+'</h3><p>L’inscription à <strong>'+esc(event.title)+'</strong> est bien enregistrée.</p><button class="v19-btn" type="button" data-close-success>Fermer</button></div>').querySelector('[data-close-success]').onclick=()=>document.getElementById('v22-modal')?.remove()}
   catch(error){status.textContent=error?.message||'Inscription impossible.';status.className='full v2115-form-status error';button.disabled=false;button.textContent='Valider mon inscription'}
  }
 }
}
function installOverrides(){
 if(!window.app)return;
 installPublicOrder();installPublicRegistration();
 const originalToggle=window.app.toggleOrder;
 window.app.toggleOrder=(id,kind)=>{
  if(kind==='paid'&&!confirm('Confirmez-vous avoir réellement reçu et vérifié le paiement ?'))return;
  if(kind==='distributed'&&!confirm('Confirmez-vous la remise de cet article ?'))return;
  return originalToggle?.(id,kind)
 };
 const originalTerm=window.app.setTerm;window.app.setTerm=term=>{currentTerm=Number(term)||1;return originalTerm?.(term)};
 window.app.validateApp=studentId=>{
  const text=tidy(document.querySelector('#v19-app-text')?.value||'');if(!text)return alert('Saisissez une appréciation.');
  const data=window.app.readData(),items=data.appreciations||(data.appreciations=[]),existing=items.find(item=>String(item.studentId)===String(studentId)&&Number(item.term||1)===currentTerm);
  if(existing)Object.assign(existing,{text,status:'validated',educatorId:existing.educatorId||currentUser?.id||null});
  else items.push({id:'a'+uuid(),studentId:String(studentId),term:currentTerm,text,status:'validated',educatorId:currentUser?.id||null});
  localStorage.setItem(STORE,JSON.stringify(data));window.app.closeModal?.();window.app.go?.('appreciations');toast('Appréciation validée')
 };
 window.app.openDoc=id=>{
  const item=(window.app.readData().documents||[]).find(document=>String(document.id)===String(id)),url=String(item?.url||'');
  if(!/^https?:\/\//i.test(url))return toast('Aucun document disponible.');
  const opened=window.open(url,'_blank','noopener,noreferrer');if(opened)opened.opener=null
 };
 window.__BS_PERSIST_EVENT=async event=>{
  const out=await sb.from('v20_events').upsert(rowFor('events',{...event,publicVisible:true}));
  if(out.error)throw new Error(out.error.message);return true
 };
}
window.__BS_V22_READY=hydrate().then(()=>{installOverrides();return true}).catch(error=>{hydrating=false;document.documentElement.classList.remove('v22-loading');console.error('Initialisation V22',error);toast(error?.message||'Chargement partiel.');installOverrides();return false});
})();
