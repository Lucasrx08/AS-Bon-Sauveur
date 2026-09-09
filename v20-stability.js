(() => {
'use strict';
const ROLE_KEY='bs-demo-role-v4';
const VERIFIED='bs-v20-verified-role';
const LAST='bs-v20-last-verified-role';
const allowed=new Set(['public','educator_escalade','educator_football','educator_gymnastique','teacher_as','admin']);

const sessionRole=sessionStorage.getItem(VERIFIED);
const remembered=localStorage.getItem(LAST)||localStorage.getItem(ROLE_KEY);
if(!allowed.has(sessionRole)&&allowed.has(remembered)){
  sessionStorage.setItem(VERIFIED,remembered);
  localStorage.setItem(ROLE_KEY,remembered);
  localStorage.setItem(LAST,remembered);
}

if(!window.__BS_STORAGE_STABILITY_PATCHED){
  window.__BS_STORAGE_STABILITY_PATCHED=true;
  const nativeSet=Storage.prototype.setItem;
  Storage.prototype.setItem=function(k,v){
    nativeSet.call(this,k,v);
    try{
      if(this===sessionStorage&&k===VERIFIED&&allowed.has(String(v))){
        nativeSet.call(localStorage,LAST,String(v));
      }
      if(this===localStorage&&k===ROLE_KEY&&String(v)==='public'&&!sessionStorage.getItem(VERIFIED)){
        nativeSet.call(localStorage,LAST,'public');
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
      return callback(event,session);
    });
    shared=client;
    window.__BS_SUPABASE_CLIENT=client;
    return client;
  };
}
})();
