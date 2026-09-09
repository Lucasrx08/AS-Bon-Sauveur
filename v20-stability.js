(() => {
'use strict';
const ROLE_KEY='bs-demo-role-v4';
const VERIFIED='bs-v20-verified-role';
const CACHE_KEY='bs-v21-role-cache';
const SESSION_USER='bs-v21-session-user-id';
const allowed=new Set(['public','educator_escalade','educator_football','educator_gymnastique','teacher_as','admin']);

function authUserId(){
  try{
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i)||'';
      if(!/^sb-.*-auth-token$/.test(k))continue;
      const raw=JSON.parse(localStorage.getItem(k)||'null');
      const user=raw?.user||raw?.currentSession?.user||raw?.session?.user;
      if(user?.id)return String(user.id);
    }
  }catch{}
  return '';
}
function readCache(){try{return JSON.parse(localStorage.getItem(CACHE_KEY)||'{}')||{}}catch{return {}}}
function writeCache(cache){try{localStorage.setItem(CACHE_KEY,JSON.stringify(cache))}catch{}}

const uid=authUserId();
const cache=readCache();
const cachedRole=uid&&allowed.has(cache[uid])?cache[uid]:null;
const sessionUid=sessionStorage.getItem(SESSION_USER)||'';
const sessionRole=sessionStorage.getItem(VERIFIED)||'';

// Ne jamais réutiliser le rôle d'un autre compte dans le même navigateur.
if(uid&&sessionUid===uid&&allowed.has(sessionRole)){
  localStorage.setItem(ROLE_KEY,sessionRole);
}else if(uid&&cachedRole){
  sessionStorage.setItem(SESSION_USER,uid);
  sessionStorage.setItem(VERIFIED,cachedRole);
  localStorage.setItem(ROLE_KEY,cachedRole);
}else{
  sessionStorage.removeItem(VERIFIED);
  if(uid)sessionStorage.setItem(SESSION_USER,uid);else sessionStorage.removeItem(SESSION_USER);
  localStorage.setItem(ROLE_KEY,'public');
}

if(!window.__BS_STORAGE_STABILITY_PATCHED){
  window.__BS_STORAGE_STABILITY_PATCHED=true;
  const nativeSet=Storage.prototype.setItem;
  const nativeRemove=Storage.prototype.removeItem;
  Storage.prototype.setItem=function(k,v){
    nativeSet.call(this,k,v);
    try{
      if(this===sessionStorage&&k===VERIFIED&&allowed.has(String(v))){
        const currentUid=authUserId();
        if(currentUid){
          nativeSet.call(sessionStorage,SESSION_USER,currentUid);
          const c=readCache();c[currentUid]=String(v);writeCache(c);
        }
        window.dispatchEvent(new CustomEvent('bs-role-verified',{detail:{role:String(v),userId:currentUid||''}}));
      }
    }catch{}
  };
  Storage.prototype.removeItem=function(k){
    nativeRemove.call(this,k);
    try{
      if(this===sessionStorage&&k===VERIFIED){
        nativeRemove.call(sessionStorage,SESSION_USER);
        nativeSet.call(localStorage,ROLE_KEY,'public');
        window.dispatchEvent(new CustomEvent('bs-role-verified',{detail:{role:'public',userId:''}}));
      }
    }catch{}
  };
}

const api=window.supabase;
if(api?.createClient&&!window.__BS_SUPABASE_STABILITY_PATCHED){
  window.__BS_SUPABASE_STABILITY_PATCHED=true;
  const create=api.createClient.bind(api);
  let shared=null;
  api.createClient=(url,key,opts)=>{
    if(shared)return shared;
    const client=create(url,key,opts);
    const originalOn=client.auth.onAuthStateChange.bind(client.auth);
    client.auth.onAuthStateChange=(callback)=>originalOn((event,session)=>{
      if(event==='INITIAL_SESSION'&&!session?.user)return;
      setTimeout(()=>{
        try{Promise.resolve(callback(event,session)).catch(err=>console.error('Auth callback',err))}
        catch(err){console.error('Auth callback',err)}
      },0);
    });
    shared=client;
    window.__BS_SUPABASE_CLIENT=client;
    return client;
  };
}
})();
