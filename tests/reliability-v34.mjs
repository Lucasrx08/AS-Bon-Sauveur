import assert from 'node:assert/strict';import{readFileSync}from'node:fs';import{JSDOM}from'jsdom';import vm from'node:vm';
const read=n=>readFileSync(new URL('../'+n,import.meta.url),'utf8');
function setup(role='admin'){
 const dom=new JSDOM('<div id="app"></div>',{url:'https://example.invalid',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;w.scrollTo=()=>{};w.alert=()=>{};w.confirm=()=>true;w.__BS_SAVED=()=>{};w.localStorage.setItem('bs-demo-role-v4',role);w.sessionStorage.setItem('bs-v20-verified-role',role);
 for(const f of ['v34-reliability.js','v34-order-identity.js','v19-app.js'])w.eval(read(f));const request=w.__BS_REQUEST;w.__BS_REQUEST=q=>request(q,20);
 return {dom,w,app:w.app,data:w.app.readData()};
}
// Exact admin route: update existing orders, preserve metadata, return to same list/scroll.
{
 const{dom,w,app,data}=setup();data.products=[{id:'p',name:'Sweat fictif',price:26,active:true}];data.orders=[{id:'o',productId:'p',studentName:'FICTIF Jeanne',className:'6e AVIGNON',size:'M',quantity:1,paymentMethod:'Chèque',paid:true,distributed:false,productName:'Sweat historique',unitPrice:22,checkoutId:'checkout-fictif',createdAt:'2026-11-01T12:15:00Z'}];
 const server={id:'o',product_id:'p',student_name:'FICTIF Jeanne',class_name:'6e AVIGNON',size:'M',quantity:1,payment_method:'Chèque',paid:true,distributed:false,product_name:'Sweat historique',unit_price:22,checkout_id:'checkout-fictif',created_at:'2026-11-01T12:15:00Z'};let mode='success',calls=0,payload;
 class Query{
  update(p){payload=p;this.payload=p;return this}
  upsert(){assert.fail('An existing order must never be upserted')}
  eq(key,id){assert.equal(key,'id');assert.equal(id,'o');return this}
  select(){return this}
  single(){calls++;if(mode==='timeout')return new Promise(()=>{});if(mode==='zero')return Promise.resolve({data:null,error:null});if(mode==='error')return Promise.resolve({data:null,error:{message:'Refus fictif'}});Object.assign(server,this.payload);return Promise.resolve({data:{...server},error:null})}
 }
 w.__BS_SUPABASE_CLIENT={from:()=>new Query()};
 w.eval(read('v21-admin.js'));app.go('admin');app.v21Orders();w.document.querySelector('.v19-modal-body').scrollTop=240;w.document.querySelector('[data-edit]').click();let f=w.document.querySelector('#v21-order-form');assert.equal(f.elements.lastName.value,'FICTIF');assert.equal(f.elements.firstName.value,'Jeanne');f.elements.quantity.value=2;f.elements.size.value='S';await f.onsubmit({preventDefault(){},currentTarget:f});assert.equal(data.orders[0].quantity,2);assert.equal(data.orders[0].unitPrice,22);assert.equal(data.orders[0].checkoutId,'checkout-fictif');assert.equal(data.orders[0].createdAt,'2026-11-01T12:15:00Z');assert.equal(payload.created_at,undefined);assert.equal(payload.checkout_id,undefined);assert.equal(payload.reference,undefined);assert.equal(payload.paid,undefined,'Unchanged payment status must not overwrite a colleague’s update');assert.equal(payload.distributed,undefined);assert.equal(w.document.querySelector('.v19-modal-body').scrollTop,240);assert.match(w.document.querySelector('h2').textContent,/Gérer les commandes/);
 for(const failure of ['error','zero','timeout']){mode=failure;app.v21OrderForm('o');f=w.document.querySelector('#v21-order-form');f.elements.quantity.value=3;const start=calls,action=f.onsubmit({preventDefault(){},currentTarget:f});await f.onsubmit({preventDefault(){},currentTarget:f});await action;assert.equal(calls,start+1,'Double submission ignored');assert.equal(data.orders[0].quantity,2,'Unconfirmed writes never modify the local order');assert.equal(f.querySelector('[type=submit]').disabled,false);assert.match(f.querySelector('[data-order-status]').textContent,/non confirmée/)}
 // Missing client at script initialization must be recovered at click time.
 dom.window.close();
}
{
 const {dom,w,app,data}=setup('teacher_as');data.products=[{id:'p',name:'Article fictif',price:10}];data.orders=[{id:'legacy',productId:'p',studentName:'FICTIF Jean',className:'6e AVIGNON',size:'M',quantity:1,paymentMethod:'Espèces'}];w.eval(read('v21-admin.js'));w.eval(read('v21-role-guard.js'));let stored;w.__BS_SUPABASE_CLIENT={from:()=>({update:p=>({eq:(_,id)=>({select:()=>({single:async()=>{stored=p;return{data:{id,...p},error:null}}})})})})};app.go('orders');assert.match(w.document.body.textContent,/Modifier la commande/);app.v21OrderForm('legacy');w.dispatchEvent(new w.Event('focus'));assert.ok(w.document.querySelector('#v21-order-form'));let f=w.document.querySelector('form');f.elements.paid.checked=true;await f.onsubmit({preventDefault(){},currentTarget:f});assert.equal(stored.paid,true);assert.equal(app.route(),'orders');dom.window.close();
}
// Timeout aborts the request transport when its builder supports abortSignal.
{
 const{dom,w}=setup();let signal;await assert.rejects(w.__BS_REQUEST({abortSignal:s=>{signal=s;return new Promise(()=>{})}}),/ne répond pas/);assert.equal(signal.aborted,true);dom.window.close();
}
// The auth callback must release the authentication lock before loading protected data.
{
 const src=read('v20-bridge.js'),body=src.slice(src.indexOf('async function authenticateSession(){'),src.indexOf('async function hydrateUser('));let cb,inside=false,hydrated=0;const context={hasSupabase:true,VERIFIED:'v',ROLE_KEY:'r',sessionStorage:{removeItem(){},setItem(){}},localStorage:{setItem(){}},setTimeout,console,toast(){},passwordSetupFlow:()=>false,passwordModal(){},applySignedOut:async()=>{},hydrateUser:async()=>{assert.equal(inside,false);hydrated++},sb:{auth:{onAuthStateChange:f=>{cb=f},getSession:async()=>({data:{session:null}})}}};vm.createContext(context);vm.runInContext(body,context);await context.authenticateSession();inside=true;const pending=cb('TOKEN_REFRESHED',{user:{id:'fictif'}});assert.equal(pending,undefined);inside=false;await new Promise(r=>setTimeout(r,10));assert.equal(hydrated,1);
}
// Role/page matrix, in memory. No form submission and no production network calls.
for(const role of ['public','admin','teacher_as','educator_gymnastique','educator_football','educator_escalade']){
 const {dom,w,app}=setup(role);for(const f of ['v21-admin.js','v25-1-functional.js','v30-multispecialty.js','v32-shop.js','v34-order-import.js'])w.eval(read(f));for(const route of ['home','calendar','convocations','shop','documents','reports','licenses','appreciations','admin','more']){assert.doesNotThrow(()=>app.go(route),role+' / '+route);assert.ok(w.document.querySelector('#app').textContent.trim())}dom.window.close();
}
console.log('V34.1.1 : édition administrateur/EPS, dates/prix/checkout conservés, refus/absence de réponse, délai/annulation, double clic, reprise client, verrou auth et 60 parcours par rôle OK.');
// Orders are private cache data and must be cleared on sign-out.
{
 const bridge=read('v20-bridge.js');const f=bridge.slice(bridge.indexOf('function clearPrivateCache(){'),bridge.indexOf('\n\nfunction modal('));let stored;
 const context={safeJson:JSON.parse,STORE:'cache',localStorage:{getItem:()=>JSON.stringify({orders:[{studentName:'FICTIF'}],students:[],convocations:[]}),setItem:(_,v)=>stored=JSON.parse(v)}};vm.createContext(context);vm.runInContext(f,context);context.clearPrivateCache();assert.equal(stored.orders.length,0);
}
// A late response from a signed-out session must not restore the private cache.
{
 const bridge=read('v20-bridge.js'),body=bridge.slice(bridge.indexOf('async function hydrateAll('),bridge.indexOf('window.__BS_COMPLETE_SIGN_IN'));let writes=0;
 const context={authEpoch:1,hydrating:false,currentRole:'admin',STORE:'cache',safeJson:JSON.parse,emptyData:()=>({}),camel:x=>x,selectAll:async()=>({data:[],error:null}),window:{app:{hydrateFromServer:()=>assert.fail('Stale session must not hydrate UI')}},localStorage:{getItem:()=>'{"orders":[]}',setItem:()=>writes++}};vm.createContext(context);vm.runInContext(body,context);const pending=context.hydrateAll();context.authEpoch=2;await pending;assert.equal(writes,0);
}
console.log('Confidentialité : commandes effacées du cache à la déconnexion ; réponses tardives de l’ancienne session ignorées.');
// Documents and products must not report success when the server confirms no row.
{
 const {dom,w,app,data}=setup();data.documents=[{id:'d',title:'Document fictif',date:'2026-11-19',specialty:'Association Sportive'}];data.products=[{id:'p',name:'Produit fictif',price:20,active:true}];w.eval(read('v21-admin.js'));let confirm=false;w.__BS_SUPABASE_CLIENT={from:()=>({upsert:r=>({select:()=>({single:async()=>({data:confirm?{id:r.id}:null,error:null})})})})};
 app.v21DocumentForm('d');let f=w.document.querySelector('form');f.elements.title.value='Correction fictive';await f.onsubmit({preventDefault(){},currentTarget:f});assert.equal(data.documents[0].title,'Document fictif');assert.equal(f.querySelector('[type=submit]').disabled,false);
 app.v21ProductForm('p');f=w.document.querySelector('form');f.elements.price.value='24';await f.onsubmit({preventDefault(){},currentTarget:f});assert.equal(data.products[0].price,20);assert.equal(f.querySelector('[type=submit]').disabled,false);confirm=true;await f.onsubmit({preventDefault(){},currentTarget:f});assert.equal(data.products[0].price,24);dom.window.close();
}
console.log('Documents/produits : absence de confirmation refusée, formulaire réactivé, modification locale après confirmation uniquement.');
