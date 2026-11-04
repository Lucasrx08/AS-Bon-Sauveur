import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {PGlite} from '@electric-sql/pglite';
import {readdirSync} from 'node:fs';
const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
const products=[{id:'p1',name:'Sweat Rose - Logo brodé',price:26,active:true,deadline:'2099-12-01',color:'Rose'},{id:'p2',name:'Tee-shirt Bleu ciel - Logo floqué',price:10,active:true,deadline:'2099-12-01',color:'Bleu ciel'}];
// The real HTTP handler with in-memory transport. No production calls.
{
 const rows=[];let handler,inserts=0;
 class Query{
  constructor(table){this.table=table;this.filters=[]}
  select(){return this} eq(k,v){this.filters.push(r=>r[k]===v);return this} in(k,vs){this.filters.push(r=>vs.includes(r[k]));return this} order(){return this}
  insert(records){this.records=records;return this}
  async execute(){
   if(this.records){inserts++;if(this.records.some(r=>rows.some(old=>old.checkout_id===r.checkout_id&&old.checkout_line===r.checkout_line)))return{data:null,error:{code:'23505'}};const created=this.records.map((r,i)=>({...r,reference:'AS-'+(rows.length+i+1),created_at:'2026-11-04'}));rows.push(...created);return{data:created,error:null}}
   return{data:(this.table==='v20_products'?products:rows).filter(r=>this.filters.every(f=>f(r))),error:null}
  }
  then(ok,ko){return this.execute().then(ok,ko)}
  async maybeSingle(){const r=await this.execute();return{...r,data:r.data?.[0]||null}}
 }
 const context={createClient:()=>({from:table=>new Query(table),rpc:async()=>({data:{allowed:true},error:null})}),Deno:{env:{get:()=> 'fixture'},serve:fn=>handler=fn},Request,Response,TextDecoder,TextEncoder,crypto:webcrypto,console,Date,Intl,setTimeout,clearTimeout};
 vm.createContext(context);
 let shared=stripTypeScriptTypes(read('supabase/functions/_shared/http.ts')).replaceAll('export ','');
 let edge=stripTypeScriptTypes(read('supabase/functions/public-order/index.ts').replace(/^import .*;\n/gm,''));
 vm.runInContext(shared+'\n'+edge,context);
 const base={requestId:'c09107aa-f330-4ef0-833c-bb40b65acabc',studentName:'ÉLÈVE FICTIF',className:'6e AVIGNON',paymentMethod:'Chèque',items:[{productId:'p1',size:'M',quantity:1},{productId:'p2',size:'S',quantity:2}]};
 const send=(body,origin='https://lucasrx08.github.io')=>handler(new Request('https://example.invalid/functions/public-order',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)}));
 let response=await send(base);assert.equal(response.status,201);let result=await response.json();assert.equal(result.references.length,2);assert.equal(result.total,46);assert.equal(rows.length,2);assert.ok(rows.every(r=>r.paid===false));
 response=await send(base);assert.equal(response.status,200);assert.equal(rows.length,2);assert.equal(inserts,1,'Retry of a lost response must reuse the whole cart.');
 response=await send({...base,studentName:'AUTRE FICTIF'});assert.equal(response.status,409);
 for(const method of ['Espèces','Virement']){response=await send({...base,requestId:webcrypto.randomUUID(),paymentMethod:method});assert.equal(response.status,201)}
 response=await send({...base,requestId:webcrypto.randomUUID(),items:[base.items[0],{...base.items[1],productId:'missing'}]});assert.equal(response.status,409);assert.equal(rows.length,6,'A failed cart must not partially insert.');
 response=await send({...base,requestId:webcrypto.randomUUID(),items:Array(21).fill(base.items[0])});assert.equal(response.status,400);
 response=await send(base,'https://untrusted.invalid');assert.equal(response.status,403);
 response=await send({...base,requestId:webcrypto.randomUUID(),items:undefined,productId:'p1',size:'M',quantity:1});assert.equal(response.status,201,'Existing clients remain supported.');
}
// Real cart UI: one identity, multiple lines, stable retry and exact payment copy.
{
 const dom=new JSDOM('<main></main>',{url:'https://example.invalid/',runScripts:'outside-only'}),w=dom.window;
 w.APP_CONFIG={supabaseUrl:'https://example.invalid',supabaseAnonKey:'fixture'};w.__BS_SHOP_PREVIEW=true;
 w.app={readData:()=>({products}),route:()=> 'shop'};w.AbortController=AbortController;
 const requests=[];let fail=true;w.fetch=async(_url,options)=>{requests.push(JSON.parse(options.body));if(fail)throw new Error('Réponse fictive perdue');return{ok:true,json:async()=>({references:['AS-FICTIVE-1','AS-FICTIVE-2']})}};
 w.eval(read('v32-shop.js'));w.app.order('p1');assert.equal(w.document.getElementById('v32-cart'),null);w.app.openCart();w.document.querySelector('[data-add]').click();
 const form=w.document.querySelector('form');form.elements.lastName.value='TEST';form.elements.firstName.value='Fictif';form.elements.className.value='6e AVIGNON';
 assert.equal(w.document.querySelectorAll('[data-line]').length,2);assert.equal(w.document.querySelectorAll('[name=lastName]').length,1);
 assert.match(w.document.querySelector('[data-payment]').textContent,/Chèque à l’ordre de l’AS du Bon Sauveur/);
 form.elements.paymentMethod.value='Espèces';form.elements.paymentMethod.onchange();assert.match(w.document.querySelector('[data-payment]').textContent,/Espèces à transmettre à un enseignant d’EPS/);
 form.elements.paymentMethod.value='Virement';form.elements.paymentMethod.onchange();assert.match(w.document.querySelector('[data-payment]').textContent,/Sélectionnez à nouveau/);
 await form.onsubmit({preventDefault(){}});assert.ok(form.isConnected);fail=false;await form.onsubmit({preventDefault(){}});
 assert.equal(requests[0].items.length,2);assert.equal(requests[0].requestId,requests[1].requestId);
 assert.equal(w.document.querySelector('a').href,w.ASV32_SHOP.helloAssoUrl);assert.match(w.document.body.textContent,/en attente de paiement/);dom.window.close();
}
// Durable historical name/price and atomic inserts in an isolated PostgreSQL.
{
 const db=new PGlite();await db.exec(`create role anon;create role authenticated;create role service_role;
 create table public.v20_products(id text primary key,name text,price numeric);
 create table public.v20_orders(id text primary key,product_id text,quantity int check(quantity between 1 and 10),paid boolean);
 insert into v20_products values('p1','Nom historique',22),('p2','Autre article',10);
 insert into v20_orders values('old','p1',1,false);`);
 const migration=readdirSync(new URL('../supabase/migrations/',import.meta.url)).find(f=>f.endsWith('_shop_checkout_history.sql'));
 await db.exec(read('supabase/migrations/'+migration));
 await db.exec("update v20_products set name='Nouveau nom',price=30 where id='p1';delete from v20_products where id='p1';update v20_orders set paid=true,product_name='Altération',unit_price=999 where id='old';");
 let row=(await db.query("select product_name,unit_price from v20_orders where id='old'")).rows[0];assert.equal(row.product_name,'Nom historique');assert.equal(Number(row.unit_price),22);
 await db.exec("insert into v20_orders(id,product_id,quantity,product_name,unit_price) values('new','p2',1,'Faux',0);");row=(await db.query("select product_name,unit_price from v20_orders where id='new'")).rows[0];assert.equal(row.product_name,'Autre article');assert.equal(Number(row.unit_price),10);
 await assert.rejects(db.exec("insert into v20_orders(id,product_id,quantity) values('cart1','p2',1),('cart2','p2',11);"));assert.equal((await db.query("select count(*)::int n from v20_orders where id like 'cart%'")).rows[0].n,0);await db.close();
}
// The live Excel export must derive both names and amounts from snapshots.
{
 const source=read('v21-9-finance.js');const body=source.slice(source.indexOf('function summary('),source.indexOf('function buildSummary('));
 const summary=new Function('products','euro','mode',body+';return summary;')(()=>new Map(),Number,String);
 const result=summary({orders:[{productId:'deleted',productName:'Sweat historique',unitPrice:26,quantity:2,paymentMethod:'Espèces',paid:true}]},'orders');assert.equal(result.total,52);assert.equal(result.paid,52);
 assert.match(source,/o\.productName\|\|p\?\.name/);assert.match(source,/o\.unitPrice\?\?p\?\.price/);
}
console.log('Boutique V32 : panier atomique, trois règlements, HelloAsso, reprises sans doublon, historique après suppression et calcul Excel OK (données fictives).');

// Staff checkout: three methods, no family banner or HelloAsso link.
for(const role of ['admin','teacher_as']){
 const dom=new JSDOM('<main></main>',{url:'https://example.invalid/',runScripts:'outside-only'}),w=dom.window;
 w.sessionStorage.setItem('bs-v20-verified-role',role);w.app={role:()=>role,readData:()=>({products}),route:()=> 'shop'};
 w.APP_CONFIG={supabaseUrl:'https://example.invalid',supabaseAnonKey:'fixture'};w.AbortController=AbortController;
 w.fetch=async()=>({ok:true,json:async()=>({references:['TEST']})});w.eval(read('v32-shop.js'));w.app.order('p1');assert.equal(w.document.getElementById('v32-cart'),null);w.app.openCart();
 const f=w.document.querySelector('form');assert.equal(f.elements.paymentMethod.options.length,3);
 for(const method of ['Chèque','Espèces','Virement']){f.elements.paymentMethod.value=method;f.elements.paymentMethod.onchange();assert.equal(w.document.querySelector('[data-payment]').hidden,true);assert.doesNotMatch(w.document.querySelector('[data-submit]').textContent,/HelloAsso/)}
 f.elements.lastName.value='TEST';f.elements.firstName.value='Fictif';f.elements.className.value='6e AVIGNON';await f.onsubmit({preventDefault(){}});assert.equal(w.document.querySelector('a'),null);assert.doesNotMatch(w.document.body.textContent,/transmettre|HelloAsso/);dom.window.close();
}
// Authoritative status handler must confirm persistence and preserve current route/scroll.
{
 const source=read('v25-1-functional.js'),body=source.slice(source.indexOf('const orderUpdates='),source.indexOf('/* ---------- Interface'));
 const order={id:'fixture',paid:false},data={orders:[order]};let refresh=0;
 const client={from:()=>({update:p=>({eq:()=>({select:()=>({single:async()=>({data:{id:order.id,...p},error:null})})})})})};
 const fn=new Function('manager','app','sb','toast','persist','window',body+';return toggleOrder;')(()=>true,()=>({readData:()=>data,refreshView:r=>{assert.equal(r,'orders');refresh++},go:()=>assert.fail('Must not navigate')}),()=>client,()=>{},()=>{},{});
 await fn('fixture','paid');assert.equal(order.paid,true);assert.equal(refresh,1);
}
console.log('Personnel : règlements sans redirection ni bandeau ; statut confirmé sans navigation OK.');
// Supplier worksheets: quantities aggregate across payments, while payment sorting stays separate.
{
 const source=read('v21-9-finance.js'),body=source.slice(source.indexOf('function buildSupplier('),source.indexOf('async function exportAccounting('));
 const sheets=[];const wb={addWorksheet(name){const rows=[];const ws={name,rows,addRow:r=>rows.push(r),get rowCount(){return rows.length},getColumn:()=>({}),getCell:()=>({})};sheets.push(ws);return ws}};
 const headers=(ws,r,values)=>{ws.rows[r-1]=values};const titleBlock=(ws)=>{ws.rows.length=3};
 const build=new Function('products','headers','rowStyle','moneyFormat','mode','euro','titleBlock','totalStyle','supplierPrint',body+';return buildSupplier;')(()=>new Map(),headers,()=>{},()=>{},String,Number,titleBlock,()=>{},()=>{});
 build(wb,{orders:[{productName:'Sweat bleu — brodé',size:'M',quantity:2,paymentMethod:'Virement',studentName:'B',unitPrice:26},{productName:'Sweat bleu — brodé',size:'M',quantity:1,paymentMethod:'Chèque',studentName:'A',unitPrice:26}]});
 assert.equal(sheets.length,3);assert.equal(sheets[0].rows[4][5],'Chèque');assert.equal(sheets[2].rows[4][2],3);assert.equal(sheets[2].rows[4][0],'Sweat bleu — brodé');
}
// Catalogue buttons select the exact finish without opening checkout or replacing the cards.
{
 const dom=new JSDOM('<div class="v19-page-head"><h1>Boutique AS</h1></div><div class="v19-products"></div>',{url:'https://example.invalid/',runScripts:'outside-only'}),w=dom.window;
 const catalogue=[{...products[0],id:'f',name:'Sweat Bleu - Logo floqué',price:22},{...products[0],id:'b',name:'Sweat Bleu - Logo brodé',price:26}];
 w.app={readData:()=>({products:catalogue}),route:()=> 'shop'};w.eval(read('v32-shop.js'));
 assert.equal(w.document.querySelectorAll('.v19-product').length,1);const buttons=w.document.querySelectorAll('[data-v32-product]');assert.equal(buttons.length,2);
 buttons[0].click();buttons[1].click();assert.equal(w.document.getElementById('v32-cart'),null);assert.match(w.document.querySelector('[data-v32-cart]').textContent,/2/);
 w.document.querySelector('[data-v32-cart]').click();const selected=[...w.document.querySelectorAll('[data-field="productId"]')].map(x=>x.value);assert.deepEqual(selected,['f','b']);dom.window.close();
}
// Grouping is visual only: same name + class shares a header; homonyms in other classes stay apart.
{
 const source=read('v19-app.js'),body=source.slice(source.indexOf('function ordersPage(){'),source.indexOf('function reportsPage(){'));
 const orders=[1,2,3,4].map(i=>({id:'o'+i,studentName:'Test Lucas',className:'6e AVIGNON',productName:'Sweat '+i,size:'M',quantity:1,unitPrice:22,paymentMethod:'Chèque',createdAt:'2026-11-04'}));orders.push({...orders[0],id:'other',className:'5e BOLLAND'});
 const state={filters:{orders:{}},data:{orders,products:[]}};
 const render=new Function('state','isManager','denied','productName','pageTitle','esc','money','icon','fmtShort',body+';return ordersPage;')(state,()=>true,()=>'',()=>'',()=>'',String,n=>n+' €',()=>'',String);
 const dom=new JSDOM(render());assert.equal(dom.window.document.querySelectorAll('.v32-order-person').length,2);assert.match(dom.window.document.querySelector('.v32-order-person').textContent,/4 article\(s\) · 88 €/);assert.equal(dom.window.document.querySelectorAll('[onclick*="toggleOrder"]').length,10);
 state.filters.orders.product='Sweat 2';const filtered=new JSDOM(render());assert.match(filtered.window.document.body.textContent,/1 article\(s\) · 22 € · sélection filtrée/);dom.window.close();filtered.window.close();
}
