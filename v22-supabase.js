(()=>{
'use strict';
const AUTH_KEY='bs-v22-auth-session';
const listeners=new Set();
let memorySession=null;
let refreshPromise=null;
function readSession(){try{const raw=sessionStorage.getItem(AUTH_KEY);const value=raw?JSON.parse(raw):null;return value&&value.access_token?value:memorySession}catch{return memorySession}}
function writeSession(session){memorySession=session||null;try{if(session)sessionStorage.setItem(AUTH_KEY,JSON.stringify(session));else sessionStorage.removeItem(AUTH_KEY)}catch{}}
function jwtExpiry(token){try{const payload=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return Number(JSON.parse(atob(payload)).exp||0)}catch{return 0}}
function apiError(payload,status){return{message:String(payload?.msg||payload?.message||payload?.error_description||payload?.error||('Erreur '+status)),code:String(payload?.code||payload?.error_code||status),details:payload?.details||null,hint:payload?.hint||null,status}}
async function parseResponse(response){const value=await response.text();if(!value)return null;try{return JSON.parse(value)}catch{return value}}
function createClient(baseUrl,apiKey){
 const root=String(baseUrl||'').replace(/\/+$/,'');
 const baseHeaders=()=>({apikey:apiKey,Accept:'application/json'});
 const emit=(event,session)=>listeners.forEach(fn=>{try{fn(event,session)}catch{}});
 async function authFetch(path,options={}){
  const headers={...baseHeaders(),'Content-Type':'application/json',...(options.headers||{})};
  const response=await fetch(root+'/auth/v1'+path,{...options,headers});
  const payload=await parseResponse(response);
  if(!response.ok)return{data:null,error:apiError(payload,response.status)};
  return{data:payload,error:null}
 }
 async function refresh(){
  if(refreshPromise)return refreshPromise;
  refreshPromise=(async()=>{
   const current=readSession();if(!current?.refresh_token)return null;
   const out=await authFetch('/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:current.refresh_token})});
   if(out.error){writeSession(null);emit('SIGNED_OUT',null);return null}
   const payload=out.data||{};
   const next={access_token:payload.access_token,refresh_token:payload.refresh_token||current.refresh_token,expires_at:payload.expires_at||Math.floor(Date.now()/1000)+Number(payload.expires_in||3600),token_type:payload.token_type||'bearer',user:payload.user||current.user||null};
   writeSession(next);emit('TOKEN_REFRESHED',next);return next
  })().finally(()=>{refreshPromise=null});
  return refreshPromise
 }
 async function ensureSession(){
  const session=readSession();if(!session)return null;
  const exp=Number(session.expires_at||jwtExpiry(session.access_token));
  if(exp&&exp<=Math.floor(Date.now()/1000)+60)return refresh();
  return session
 }
 async function getUser(token){
  const session=token?null:await ensureSession(),access=token||session?.access_token;
  if(!access)return{data:{user:null},error:null};
  const out=await authFetch('/user',{method:'GET',headers:{Authorization:'Bearer '+access}});
  if(out.error)return{data:{user:null},error:out.error};
  if(!token&&session){session.user=out.data;writeSession(session)}
  return{data:{user:out.data},error:null}
 }
 class Query{
  constructor(table){this.table=table;this.method='GET';this.bodyValue=undefined;this.params=new URLSearchParams();this.prefer=[];this.objectMode=''}
  select(columns='*'){this.params.set('select',columns);if(this.method!=='GET')this.prefer.push('return=representation');return this}
  insert(value){this.method='POST';this.bodyValue=value;return this}
  upsert(value,options={}){this.method='POST';this.bodyValue=value;this.prefer.push('resolution=merge-duplicates');if(options.onConflict)this.params.set('on_conflict',options.onConflict);return this}
  update(value){this.method='PATCH';this.bodyValue=value;return this}
  delete(){this.method='DELETE';return this}
  eq(column,value){this.params.append(column,'eq.'+String(value));return this}
  neq(column,value){this.params.append(column,'neq.'+String(value));return this}
  is(column,value){this.params.append(column,'is.'+String(value));return this}
  in(column,values){this.params.append(column,'in.('+values.map(v=>String(v)).join(',')+')');return this}
  order(column,options={}){this.params.set('order',column+'.'+(options.ascending===false?'desc':'asc'));return this}
  limit(value){this.params.set('limit',String(value));return this}
  single(){this.objectMode='single';return this}
  maybeSingle(){this.objectMode='maybe';return this}
  then(resolve,reject){return this.execute().then(resolve,reject)}
  async execute(){
   const session=await ensureSession(),url=new URL(root+'/rest/v1/'+encodeURIComponent(this.table));
   for(const [key,value] of this.params)url.searchParams.append(key,value);
   const headers={...baseHeaders()};
   if(session?.access_token)headers.Authorization='Bearer '+session.access_token;
   if(this.method!=='GET')headers['Content-Type']='application/json';
   if(this.prefer.length)headers.Prefer=[...new Set(this.prefer)].join(',');
   if(this.objectMode)headers.Accept='application/vnd.pgrst.object+json';
   let response;
   try{response=await fetch(url,{method:this.method,headers,body:this.bodyValue===undefined?undefined:JSON.stringify(this.bodyValue)})}
   catch(error){return{data:null,error:{message:error?.message||'Erreur réseau',code:'NETWORK'}}}
   const payload=await parseResponse(response);
   if(!response.ok){if(this.objectMode==='maybe'&&response.status===406)return{data:null,error:null};return{data:null,error:apiError(payload,response.status)}}
   let data=payload;if(this.objectMode&&Array.isArray(data))data=data[0]||null;
   return{data,error:null}
  }
 }
 const auth={
  _ensure:ensureSession,
  async getSession(){try{return{data:{session:await ensureSession()},error:null}}catch(error){return{data:{session:null},error}}},
  getUser,
  async setSession(tokens){
   if(!tokens?.access_token||!tokens?.refresh_token)return{data:{session:null,user:null},error:{message:'Jetons invalides',code:'INVALID_TOKENS'}};
   const provisional={access_token:tokens.access_token,refresh_token:tokens.refresh_token,expires_at:jwtExpiry(tokens.access_token),token_type:'bearer',user:null};
   writeSession(provisional);
   const userOut=await getUser(tokens.access_token);
   if(userOut.error){writeSession(null);return{data:{session:null,user:null},error:userOut.error}}
   provisional.user=userOut.data.user;writeSession(provisional);emit('SIGNED_IN',provisional);
   return{data:{session:provisional,user:provisional.user},error:null}
  },
  async signInWithPassword(credentials){
   const out=await authFetch('/token?grant_type=password',{method:'POST',body:JSON.stringify({email:String(credentials?.email||''),password:String(credentials?.password||'')})});
   if(out.error)return{data:{session:null,user:null},error:out.error};
   const payload=out.data||{},session={access_token:payload.access_token,refresh_token:payload.refresh_token,expires_at:payload.expires_at||Math.floor(Date.now()/1000)+Number(payload.expires_in||3600),token_type:payload.token_type||'bearer',user:payload.user||null};
   writeSession(session);emit('SIGNED_IN',session);return{data:{session,user:session.user},error:null}
  },
  async signOut(){
   const session=readSession();
   if(session?.access_token){try{await authFetch('/logout',{method:'POST',headers:{Authorization:'Bearer '+session.access_token},body:'{}'})}catch{}}
   writeSession(null);emit('SIGNED_OUT',null);return{error:null}
  },
  onAuthStateChange(callback){listeners.add(callback);setTimeout(()=>callback('INITIAL_SESSION',readSession()),0);return{data:{subscription:{unsubscribe:()=>listeners.delete(callback)}}}}
 };
 return{auth,from:table=>new Query(table)}
}
window.supabase={createClient};
window.ASV22_NATIVE_CLIENT={version:'22.0.0'};
})();
