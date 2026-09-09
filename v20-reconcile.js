(() => {
'use strict';
const cfg=window.APP_CONFIG||{};if(!(cfg.supabaseUrl&&cfg.supabaseAnonKey&&window.supabase))return;
const STORE='bs-app-data-v4';
const sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
let timer=null,busy=false;
const snake=o=>Object.fromEntries(Object.entries(o||{}).map(([k,v])=>[k.replace(/[A-Z]/g,m=>'_'+m.toLowerCase()),v]));
const read=()=>{try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return{}}};
async function reconcileTable(table,rows,transform=x=>x){
 const local=(rows||[]).map(transform);const ids=new Set(local.map(x=>x.id).filter(Boolean));
 const {data:remote,error}=await sb.from(table).select('id');if(error)return;
 const missing=(remote||[]).map(x=>x.id).filter(id=>!ids.has(id));if(missing.length)await sb.from(table).delete().in('id',missing);
 if(local.length){const payload=local.map(x=>{const y=snake(x);for(const k of Object.keys(y))if(y[k]==='')y[k]=null;return y});await sb.from(table).upsert(payload)}
}
async function run(){
 if(busy||!['admin','teacher_as'].includes(sessionStorage.getItem('bs-v20-verified-role')))return;busy=true;
 try{
  const d=read();
  await reconcileTable('v20_events',d.events,x=>({...x,publicVisible:true}));
  await reconcileTable('v20_documents',d.documents,x=>({...x,publicVisible:true}));
  await reconcileTable('v20_products',d.products);
  await reconcileTable('v20_students',d.students);
  await reconcileTable('v20_licenses',d.licenses);
  await reconcileTable('v20_convocations',d.convocations,({studentIds,...x})=>({...x,status:x.status||'published',publicVisible:true}));
  await reconcileTable('v20_reports',d.reports);
 }finally{busy=false}
}
const previous=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){previous.call(this,k,v);if(this===localStorage&&k===STORE){clearTimeout(timer);timer=setTimeout(run,1200)}};
})();
