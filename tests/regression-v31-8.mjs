import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

const source=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const wait=()=>new Promise(resolve=>setTimeout(resolve,30));
function setup(role='admin'){
  const dom=new JSDOM('<div id="app"></div>',{url:'https://example.test/',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;
  w.localStorage.setItem('bs-demo-role-v4',role);w.sessionStorage.setItem('bs-v20-verified-role',role);
  w.scrollTo=({top=0,left=0})=>{w.scrollY=top;w.scrollX=left};w.alert=()=>{};w.confirm=()=>true;
  w.__BS_SAVED=()=>{};w.eval(source('v19-app.js'));
  return {dom,w,app:w.app,run:file=>w.eval(source(file))};
}
const event={id:'event-test',title:'Escalade découverte',date:'2099-01-14',startTime:'13:00',endTime:'16:00',specialty:'Association Sportive',specialties:['Association Sportive','Option Escalade'],place:'Salle de test',registrationMode:'open',registrationOpen:true,registrationCapacity:2,registrationCount:1};

// Public participation, pending publication and quota display.
{
  const {dom,w,app}=setup('public');const data=app.readData();data.events=[{...event}];app.go('calendar');
  assert.match(w.document.querySelector('.v19-event-card').textContent,/1 place restante sur 2/);
  assert.equal(w.document.querySelector('.v2115-registration-chip').disabled,false);
  data.events[0].registrationCount=2;app.refreshView();
  assert.equal(w.document.querySelector('.v2115-registration-chip').disabled,true);
  assert.match(w.document.querySelector('.v19-event-card').textContent,/Complet/);
  Object.assign(data.events[0],{registrationMode:'convocation',registrationOpen:false,registrationCapacity:null});app.refreshView();
  app.openEventConvocation(event.id);assert.match(w.document.querySelector('.v19-toast').textContent,/pas encore publiée/);
  data.convocations=[{id:'conv-test',title:event.title,date:event.date,specialty:'Option Escalade',status:'draft',publicVisible:true}];
  app.go('convocations');assert.equal(w.document.querySelectorAll('.v19-conv-card').length,0);
  data.convocations[0].status='published';app.go('calendar');app.openEventConvocation(event.id);
  assert.match(w.document.querySelector('#v19-modal').textContent,/Escalade découverte/);
  app.closeModal();app.go('convocations');assert.equal(w.document.querySelectorAll('.v19-conv-card').length,1);
  dom.window.close();
}

// Optional limits, multi-specialty event and explicit pending convocation.
{
  const {dom,w,app,run}=setup();let saved;
  w.__BS_PERSIST_EVENT=async row=>{saved=row;return {...row,registrationCount:0}};run('v30-multispecialty.js');
  app.editEvent();const form=w.document.querySelector('#v30-event-form');form.elements.title.value='Événement fictif';
  form.elements.registrationMode.value='open';form.elements.registrationMode.dispatchEvent(new w.Event('change'));
  form.elements.registrationCapacity.value='12';await form.onsubmit({preventDefault(){}});
  assert.equal(saved.registrationMode,'open');assert.equal(saved.registrationCapacity,12);
  app.editEvent(saved.id);const second=w.document.querySelector('#v30-event-form');second.elements.registrationCapacity.value='';await second.onsubmit({preventDefault(){}});
  assert.equal(saved.registrationCapacity,null);
  app.editEvent(saved.id);const third=w.document.querySelector('#v30-event-form');third.elements.registrationMode.value='convocation';third.elements.registrationMode.dispatchEvent(new w.Event('change'));await third.onsubmit({preventDefault(){}});
  assert.equal(saved.registrationMode,'convocation');assert.equal(saved.registrationOpen,false);
  assert.match(w.document.querySelector('.v19-event-card').textContent,/Convocation/);
  dom.window.close();
}

// Payment/charter updates retain filters, column sort and both scroll positions.
{
  const {dom,w,app,run}=setup();const data=app.readData();
  data.licenses=[
    {id:'l1',fullName:'ZZ TEST',className:'6e AVIGNON',sectionOption:'Association Sportive',charterSigned:'Non',paymentStatus:'En attente'},
    {id:'l2',fullName:'AA TEST',className:'6e AVIGNON',sectionOption:'Association Sportive',charterSigned:'Non',paymentStatus:'En attente'},
    {id:'l3',fullName:'AUTRE TEST',className:'5e Adrienne BOLLAND',sectionOption:'Section Football',charterSigned:'Non',paymentStatus:'En attente'}
  ];
  let fail=false,calls=0;
  w.__BS_SUPABASE_CLIENT={from(){return{update(payload){return{eq(column,id){return{select(){return{async single(){calls++;return fail?{error:{message:'refus de test'}}:{data:{id,...payload}}}}}}}}}}}};
  run('v25-1-functional.js');run('v31-6-table-sort.js');app.go('licenses');app.licenseFilter('className','6e AVIGNON');await wait();
  const sort=[...w.document.querySelectorAll('.v31-sort-button')].find(b=>b.textContent.includes('Nom & prénom'));sort.click();await wait();
  w.scrollY=430;w.document.querySelector('.v19-table-wrap').scrollLeft=185;
  await Promise.all([app.toggleLicensePayment('l1'),app.toggleLicensePayment('l1')]);await wait();
  assert.equal(calls,1,'Un double clic ne lance pas deux écritures concurrentes.');
  assert.equal(w.scrollY,430);assert.equal(w.document.querySelector('.v19-table-wrap').scrollLeft,185);
  assert.equal(w.document.querySelector('select[onchange*="className"]').value,'6e AVIGNON');
  assert.equal(w.document.querySelectorAll('tbody tr').length,2);assert.match(w.document.querySelector('tbody tr').textContent,/AA TEST/);
  await app.toggleLicenseCharter('l1');await wait();assert.equal(data.licenses[0].charterSigned,'Oui');assert.equal(w.scrollY,430);
  app.hydrateFromServer({...data,licenses:data.licenses.map(l=>({...l}))},'admin');await wait();assert.equal(w.scrollY,430);assert.equal(w.document.querySelector('select[onchange*="className"]').value,'6e AVIGNON');
  fail=true;await app.toggleLicensePayment('l1');assert.equal(app.readData().licenses[0].paymentStatus,'Payé','Une erreur serveur ne modifie pas le statut local.');
  dom.window.close();
}

// Editing from the order manager returns to the same manager and position.
{
  const {dom,w,app,run}=setup();const data=app.readData();data.products=[{id:'product-test',name:'Sweat fictif',price:20,active:true}];
  data.orders=[{id:'order-test',studentName:'ÉLÈVE TEST',className:'6e AVIGNON',productId:'product-test',quantity:1,size:'M',paid:false,createdAt:'2099-01-01'}];
  let fail=false;w.__BS_SUPABASE_CLIENT={from(){return{async upsert(){return fail?{error:{message:'refus de test'}}:{error:null}}}}};run('v21-admin.js');app.go('admin');app.v21Orders();
  w.document.querySelector('#v21-admin-modal .v19-modal-body').scrollTop=220;w.document.querySelector('[data-edit="order-test"]').click();
  let form=w.document.querySelector('#v21-order-form');form.elements.paid.checked=true;await form.onsubmit({preventDefault(){},currentTarget:form});
  assert.equal(app.route(),'admin');assert.match(w.document.querySelector('#v21-admin-modal h2').textContent,/Gérer les commandes/);
  assert.equal(w.document.querySelector('#v21-admin-modal .v19-modal-body').scrollTop,220);assert.match(w.document.querySelector('[data-order-manager]').textContent,/Payé/);
  w.document.querySelector('[data-edit="order-test"]').click();form=w.document.querySelector('#v21-order-form');form.elements.paid.checked=false;fail=true;await form.onsubmit({preventDefault(){},currentTarget:form});
  assert.equal(data.orders[0].paid,true);assert.ok(w.document.querySelector('#v21-order-form'),'En cas d’erreur, le formulaire reste ouvert.');
  dom.window.close();
}

// Server full response blocks the form; transport retries reuse the request ID.
{
  const {dom,w,app,run}=setup('public');app.readData().events=[{...event}];w.APP_CONFIG={supabaseUrl:'https://example.test',supabaseAnonKey:'fixture'};
  const remote={id:event.id,date:event.date,public_visible:true,registration_open:true,registration_mode:'open',registration_capacity:2,registration_count:1};
  w.__BS_SUPABASE_CLIENT={from(){return{select(){return{eq(){return{async maybeSingle(){return{data:{...remote}}}}}}}}}};
  const requests=[];let responseCode='NETWORK';w.fetch=async(_url,options)=>{requests.push(JSON.parse(options.body));if(responseCode==='NETWORK')throw new Error('Connexion de test interrompue');return{ok:false,status:409,json:async()=>({code:'EVENT_FULL',error:'Cet événement est complet.'})}};
  run('v22-runtime.js');await app.openEventRegistration(event.id);const form=w.document.querySelector('#v22-registration-form');form.elements.lastName.value='TEST';form.elements.firstName.value='Fictif';form.elements.className.value='6e AVIGNON';
  await form.onsubmit({preventDefault(){}});await form.onsubmit({preventDefault(){}});assert.equal(requests[0].requestId,requests[1].requestId);
  responseCode='EVENT_FULL';remote.registration_count=2;await form.onsubmit({preventDefault(){}});await wait();
  assert.equal(form.querySelector('[type=submit]').disabled,true);assert.match(form.textContent,/Complet/);
  w.document.getElementById('v22-modal').remove();await app.openEventRegistration(event.id);assert.equal(w.document.getElementById('v22-modal'),null,'Le formulaire ne s’ouvre pas quand le quota est atteint.');
  dom.window.close();
}
console.log('V31.8 : calendrier, convocations, limites, licences, commandes et refus serveur OK (données fictives).');
