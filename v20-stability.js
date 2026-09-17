(() => {
'use strict';
const ROLE_KEY='bs-demo-role-v4';
const VERIFIED='bs-v20-verified-role';
const CACHE_KEY='bs-v21-role-cache';
const SESSION_USER='bs-v21-session-user-id';
const allowed=new Set(['public','educator_escalade','educator_football','educator_gymnastique','teacher_as','admin']);

function authRecord(){
  let present=false,userId='';
  try{
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i)||'';
      if(!/^sb-.*-auth-token$/.test(k))continue;
      const stored=localStorage.getItem(k);
      if(!stored)continue;
      present=true;
      try{
        const raw=JSON.parse(stored);
        const user=raw?.user||raw?.currentSession?.user||raw?.session?.user||raw?.data?.session?.user||raw?.[0]?.user;
        if(user?.id){userId=String(user.id);break}
      }catch{}
    }
  }catch{}
  return {present,userId};
}
function authUserId(){return authRecord().userId}
function readCache(){try{return JSON.parse(localStorage.getItem(CACHE_KEY)||'{}')||{}}catch{return {}}}
function writeCache(cache){try{localStorage.setItem(CACHE_KEY,JSON.stringify(cache))}catch{}}

const auth=authRecord();
const uid=auth.userId;
const cache=readCache();
const cachedRole=uid&&allowed.has(cache[uid])?cache[uid]:null;
const sessionUid=sessionStorage.getItem(SESSION_USER)||'';
const sessionRole=sessionStorage.getItem(VERIFIED)||'';
const previousRole=allowed.has(localStorage.getItem(ROLE_KEY))?localStorage.getItem(ROLE_KEY):'public';

// Au redémarrage d'une PWA, sessionStorage est vidé mais la session Supabase persiste.
// On ne doit donc jamais écraser prématurément un espace authentifié par "public".
if(uid&&sessionUid===uid&&allowed.has(sessionRole)){
  localStorage.setItem(ROLE_KEY,sessionRole);
}else if(uid&&cachedRole){
  sessionStorage.setItem(SESSION_USER,uid);
  sessionStorage.setItem(VERIFIED,cachedRole);
  localStorage.setItem(ROLE_KEY,cachedRole);
}else if(auth.present&&previousRole!=='public'){
  // Session stockée présente : conserver l'espace affiché le temps que Supabase la valide.
  if(uid)sessionStorage.setItem(SESSION_USER,uid);
  localStorage.setItem(ROLE_KEY,previousRole);
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
        nativeSet.call(localStorage,ROLE_KEY,String(v));
        window.dispatchEvent(new CustomEvent('bs-role-verified',{detail:{role:String(v),userId:currentUid||''}}));
      }
    }catch{}
  };
  Storage.prototype.removeItem=function(k){
    nativeRemove.call(this,k);
    try{
      if(this===sessionStorage&&k===VERIFIED){
        nativeRemove.call(sessionStorage,SESSION_USER);
        // Ne repasser en public que s'il n'existe réellement plus de session Supabase persistée.
        if(!authRecord().present)nativeSet.call(localStorage,ROLE_KEY,'public');
        window.dispatchEvent(new CustomEvent('bs-role-verified',{detail:{role:authRecord().present?(localStorage.getItem(ROLE_KEY)||'public'):'public',userId:''}}));
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
