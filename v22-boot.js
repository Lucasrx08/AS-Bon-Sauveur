(() => {
'use strict';
const cfg=window.APP_CONFIG||{};
const STORE='bs-app-data-v4';
const ROLE_KEY='bs-demo-role-v4';
const VERIFIED='bs-v20-verified-role';
const ROLE_CACHE='bs-v22-role-cache';
const ALLOWED=new Set(['public','educator_escalade','educator_football','educator_gymnastique','teacher_as','admin']);
const root=document.getElementById('app');
const clone=x=>JSON.parse(JSON.stringify(x||{}));
const safe=(s,f)=>{try{return JSON.parse(s)}catch{return f}};
const timeout=(p,ms)=>Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms))]);
const authFlow=new URLSearchParams((location.hash||'').replace(/^#/,''));
const queryFlow=new URLSearchParams(location.search||'');
window.__BS_PASSWORD_FLOW=['invite','recovery'].includes(authFlow.get('type')||queryFlow.get('type')||'')||queryFlow.has('code');

function tokenUser(){
 try{
  for(let i=0;i<localStorage.length;i++){
   const k=localStorage.key(i)||'';
   if(!/^sb-.*-auth-token$/.test(k))continue;
   const raw=safe(localStorage.getItem(k)||'null',null);
   const u=raw?.user||raw?.currentSession?.user||raw?.session?.user;
   if(u?.id)return u;
  }
 }catch{}
 return null;
}
function roleCache(){return safe(localStorage.getItem(ROLE_CACHE)||'{}',{})||{}}
function cachedRole(uid){const r=roleCache()[uid];return ALLOWED.has(r)?r:null}
function saveRole(uid,role){
 if(!uid||!ALLOWED.has(role))return;
 const c=roleCache();c[uid]=role;localStorage.setItem(ROLE_CACHE,JSON.stringify(c));
}
function setRole(role,uid=''){
 const r=ALLOWED.has(role)?role:'public';
 localStorage.setItem(ROLE_KEY,r);
 if(r==='public')sessionStorage.removeItem(VERIFIED);else sessionStorage.setItem(VERIFIED,r);
 if(uid&&r!=='public')saveRole(uid,r);
 document.body.dataset.bsRole=r;
 return r;
}
function emptyData(){return{events:[],documents:[],products:[],orders:[],students:[],appreciations:[],licenses:[],convocations:[],reports:[],specialtyNotes:{},termSettings:{}}}
function rowsToNotes(rows){const o={};(rows||[]).forEach(r=>o[r.specialty]={message:r.message||'',expiresAt:r.expires_at||'',active:!!r.active});return o}
function rowsToTerms(rows){const o={};(rows||[]).forEach(r=>o[r.term]={deadline:r.deadline||'',end:r.term_end||''});return o}
const camel=o=>Object.fromEntries(Object.entries(o||{}).map(([k,v])=>[k.replace(/_([a-z])/g,(_,c)=>c.toUpperCase()),v]));

const hasSupabase=!!(cfg.supabaseUrl&&cfg.supabaseAnonKey&&window.supabase?.createClient);
const sb=hasSupabase?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey):null;
window.__BS_SUPABASE_CLIENT=sb;

async function q(table,select='*'){
 if(!sb)return[];
 const {data,error}=await sb.from(table).select(select);
 if(error)throw error;
 return data||[];
}
async function hydrateForRole(role){
 const d=emptyData();
 if(!sb)return Object.assign(d,safe(localStorage.getItem(STORE)||'{}',{}));
 if(role==='public'){
  const [events,documents,products,convocations,notes]=await Promise.all([
   q('v20_events'),q('v20_documents'),q('v20_products'),q('v20_convocations'),q('v20_specialty_notes')
  ]);
  d.events=events.map(camel);d.documents=documents.map(camel);d.products=products.map(camel);d.convocations=convocations.map(camel);d.specialtyNotes=rowsToNotes(notes);
  return d;
 }
 if(/^educator_/.test(role)){
  const [events,students,licenses,convocations,links,apps,notes,terms]=await Promise.all([
   q('v20_events'),q('v20_students'),q('v20_licenses'),q('v20_convocations'),q('v20_convocation_students'),q('v20_appreciations'),q('v20_specialty_notes'),q('v20_term_settings')
  ]);
  d.events=events.map(camel);d.students=students.map(camel);d.licenses=licenses.map(camel);d.appreciations=apps.map(camel);d.specialtyNotes=rowsToNotes(notes);d.termSettings=rowsToTerms(terms);
  const ls=links.map(camel);d.convocations=convocations.map(camel).map(c=>({...c,studentIds:ls.filter(x=>x.convocationId===c.id).map(x=>x.studentId)}));
  return d;
 }
 const [events,documents,products,orders,students,apps,licenses,convocations,links,reports,notes,terms]=await Promise.all([
  q('v20_events'),q('v20_documents'),q('v20_products'),q('v20_orders'),q('v20_students'),q('v20_appreciations'),q('v20_licenses'),q('v20_convocations'),q('v20_convocation_students'),q('v20_reports'),q('v20_specialty_notes'),q('v20_term_settings')
 ]);
 d.events=events.map(camel);d.documents=documents.map(camel);d.products=products.map(camel);d.orders=orders.map(camel);d.students=students.map(camel);d.appreciations=apps.map(camel);d.licenses=licenses.map(camel);d.reports=reports.map(camel);d.specialtyNotes=rowsToNotes(notes);d.termSettings=rowsToTerms(terms);
 const ls=links.map(camel);d.convocations=convocations.map(camel).map(c=>({...c,studentIds:ls.filter(x=>x.convocationId===c.id).map(x=>x.studentId)}));
 return d;
}
function writeData(data){localStorage.setItem(STORE,JSON.stringify(data||emptyData()))}
function showBoot(){
 if(!root)return;
 root.innerHTML='<div class="v22-boot"><div class="v22-boot-card"><img src="assets/logo-as.png" alt="Association Sportive du Bon Sauveur"><div><strong>Association Sportive du Bon Sauveur</strong><span>Ouverture de votre espace…</span></div><i aria-hidden="true"></i></div></div>';
}
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error('Impossible de charger '+src));document.body.appendChild(s)})}
async function loadApp(){
 await loadScript('v19-app.js?v=20260909-v22');
 await loadScript('v20-exports.js?v=20260909-v22');
 await loadScript('v22-runtime.js?v=20260909-v22');
}
async function boot(){
 showBoot();
 const localUser=tokenUser();
 const fallbackRole=localUser?.id?cachedRole(localUser.id)||'public':'public';
 setRole(fallbackRole,localUser?.id||'');
 if(!sb){await loadApp();return}
 let settled=false;
 try{
  const work=(async()=>{
   const out=await timeout(sb.auth.getSession(),1700);
   const session=out?.data?.session||null;
   let role='public',uid='';
   if(session?.user){
    uid=session.user.id;
    try{
     const p=await timeout(sb.from('profiles').select('role').eq('id',uid).single(),1700);
     if(ALLOWED.has(p?.data?.role))role=p.data.role;else role=cachedRole(uid)||fallbackRole;
    }catch{role=cachedRole(uid)||fallbackRole}
   }
   const data=await timeout(hydrateForRole(role),2600);
   if(settled)return;
   setRole(role,uid);writeData(data);
  })();
  await Promise.race([work,new Promise(res=>setTimeout(res,3000))]);
  settled=true;
 }catch(e){console.warn('V22 boot fallback',e)}
 await loadApp();
}
window.__BS_V22={sb,hydrateForRole,setRole,saveRole,cachedRole,emptyData,clone,STORE,ROLE_KEY,VERIFIED};
boot().catch(async e=>{console.error('V22 boot',e);try{await loadApp()}catch(err){console.error(err);if(root)root.innerHTML='<div class="v22-fatal">Impossible d’ouvrir l’application. Rechargez la page.</div>'}});
})();