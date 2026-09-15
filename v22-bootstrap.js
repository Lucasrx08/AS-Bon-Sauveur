(()=>{
'use strict';
const STORE='bs-app-data-v4';
const ROLE='bs-demo-role-v4';
const PRIVATE='bs-v22-session-data';
const SESSION_ROLE='bs-v22-session-role';
const nativeGet=Storage.prototype.getItem;
const nativeSet=Storage.prototype.setItem;
const nativeRemove=Storage.prototype.removeItem;
function parse(value,fallback){try{const out=JSON.parse(value);return out&&typeof out==='object'?out:fallback}catch{return fallback}}
function publicProjection(source){
 const data=source&&typeof source==='object'?source:{};
 const convocations=(Array.isArray(data.convocations)?data.convocations:[]).map(item=>{const copy={...item};delete copy.studentIds;delete copy.student_ids;return copy});
 const products=(Array.isArray(data.products)?data.products:[]).filter(item=>item?.active!==false);
 return {
  events:Array.isArray(data.events)?data.events:[],
  documents:Array.isArray(data.documents)?data.documents:[],
  products,
  convocations,
  specialtyNotes:data.specialtyNotes&&typeof data.specialtyNotes==='object'?data.specialtyNotes:{},
  orders:[],students:[],appreciations:[],licenses:[],reports:[],eventRegistrations:[],termSettings:{}
 };
}
function cleanLegacy(){
 const old=parse(nativeGet.call(localStorage,STORE),{});
 nativeSet.call(localStorage,STORE,JSON.stringify(publicProjection(old)));
 nativeSet.call(localStorage,ROLE,'public');
 nativeRemove.call(sessionStorage,PRIVATE);
 nativeSet.call(sessionStorage,SESSION_ROLE,'public');
 const keys=[];
 for(let i=0;i<localStorage.length;i++)keys.push(localStorage.key(i)||'');
 keys.forEach(key=>{
  if((key.startsWith('sb-')&&key.endsWith('-auth-token'))||key==='bs-v20-sent-orders'||key==='bs-v20-fallback-role'||key==='bs-v20-password-setup')nativeRemove.call(localStorage,key)
 });
}
cleanLegacy();
Storage.prototype.getItem=function(key){
 if(this===localStorage&&key===STORE)return nativeGet.call(sessionStorage,PRIVATE)||nativeGet.call(localStorage,STORE);
 if(this===localStorage&&key===ROLE)return nativeGet.call(sessionStorage,SESSION_ROLE)||'public';
 return nativeGet.call(this,key)
};
Storage.prototype.setItem=function(key,value){
 if(this===localStorage&&key===STORE){
  const data=parse(String(value),{});
  nativeSet.call(sessionStorage,PRIVATE,JSON.stringify(data));
  nativeSet.call(localStorage,STORE,JSON.stringify(publicProjection(data)));
  queueMicrotask(()=>{try{window.__BS_ON_DATA_WRITE?.(data)}catch(error){console.warn('Synchronisation V22',error)}});
  return
 }
 if(this===localStorage&&key===ROLE){
  const allowed=['public','teacher_as','admin','educator_football','educator_gymnastique','educator_escalade'];
  const role=allowed.includes(String(value))?String(value):'public';
  nativeSet.call(sessionStorage,SESSION_ROLE,role);
  nativeSet.call(localStorage,ROLE,'public');
  return
 }
 return nativeSet.call(this,key,String(value))
};
Storage.prototype.removeItem=function(key){
 if(this===localStorage&&key===STORE){nativeRemove.call(sessionStorage,PRIVATE);nativeRemove.call(localStorage,STORE);return}
 if(this===localStorage&&key===ROLE){nativeSet.call(sessionStorage,SESSION_ROLE,'public');nativeSet.call(localStorage,ROLE,'public');return}
 return nativeRemove.call(this,key)
};
const cfg=window.APP_CONFIG||{};
if(cfg.supabaseUrl&&cfg.supabaseAnonKey&&window.supabase?.createClient){
 window.__BS_SUPABASE_CLIENT=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey)
}
document.documentElement.classList.add('v22-loading');
window.__BS_V22_STORAGE={project:publicProjection,version:'22.0.0'};
})();
