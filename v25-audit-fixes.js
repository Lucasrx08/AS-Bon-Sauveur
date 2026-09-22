(() => {
'use strict';

const VERSION='v25.0-20260915';
const STORE='bs-app-data-v4';
const ROLE_KEY='bs-demo-role-v4';
const VERIFIED='bs-v20-verified-role';
const ACTIVITY_KEY='bs-v25-last-activity';
const SESSION_TIMEOUT=30*60*1000;
const SESSION_WARNING=2*60*1000;
let sessionTimer=null,warningTimer=null,lastWrite=0,expiring=false;

const app=()=>window.app||null;
const sb=()=>window.__BS_SUPABASE_CLIENT||null;
const toast=(message,delay=3200)=>{
 const el=document.createElement('div');el.className='v19-toast';el.textContent=message;document.body.appendChild(el);setTimeout(()=>el.remove(),delay);
};
const manager=()=>{
 const role=app()?.role?.()||'public';
 return ['teacher_as','admin'].includes(role)&&sessionStorage.getItem(VERIFIED)===role;
};
const protectedSession=()=>{
 const role=app()?.role?.()||'public';
 return role!=='public'&&sessionStorage.getItem(VERIFIED)===role;
};
function persist(data){localStorage.setItem(STORE,JSON.stringify(data))}
async function verifyMissing(table,id){
 const client=sb();if(!client)throw new Error('Connexion à la base indisponible.');
 const {data,error}=await client.from(table).select('id').eq('id',String(id)).limit(1);
 if(error)throw error;
 if(data?.length)throw new Error('La suppression n’a pas été confirmée par le serveur.');
}
async function serverDelete(table,id){
 const client=sb();if(!client)throw new Error('Connexion à la base indisponible.');
 const {error}=await client.from(table).delete().eq('id',String(id));
 if(error)throw error;
 await verifyMissing(table,id);
}
async function deleteEvent(id){
 if(!manager())return toast('Accès gestion requis.');
 const data=app()?.readData?.();if(!data)return;
 const event=(data.events||[]).find(row=>String(row.id)===String(id));if(!event)return toast('Événement introuvable.');
 const count=(data.eventRegistrations||[]).filter(row=>String(row.eventId)===String(id)).length;
 if(!confirm(count?`Supprimer cet événement et ses ${count} inscription${count>1?'s':''} ?`:'Supprimer cet événement ?'))return;
 toast('Suppression en cours…');
 try{
  await serverDelete('v20_events',id);
  data.events=(data.events||[]).filter(row=>String(row.id)!==String(id));
  data.eventRegistrations=(data.eventRegistrations||[]).filter(row=>String(row.eventId)!==String(id));
  persist(data);app()?.go?.('calendar');toast('Événement supprimé définitivement.');
 }catch(error){console.error('V25 delete event',error);toast('Suppression impossible : '+(error?.message||'erreur serveur'),4800)}
}
async function deleteConvocation(id){
 if(!manager())return toast('Accès gestion requis.');
 const data=app()?.readData?.();if(!data)return;
 const conv=(data.convocations||[]).find(row=>String(row.id)===String(id));if(!conv)return toast('Convocation introuvable.');
 if(!confirm('Supprimer cette convocation ?'))return;
 toast('Suppression en cours…');
 try{
  await serverDelete('v20_convocations',id);
  const client=sb();
  if(client){
   const {error}=await client.from('v20_events').update({convocation_id:null}).eq('convocation_id',String(id));
   if(error)console.warn('V25 unlink convocation',error);
  }
  data.convocations=(data.convocations||[]).filter(row=>String(row.id)!==String(id));
  (data.events||[]).forEach(row=>{if(String(row.convocationId||'')===String(id))row.convocationId=null});
  persist(data);app()?.go?.('convocations');toast('Convocation supprimée définitivement.');
 }catch(error){console.error('V25 delete convocation',error);toast('Suppression impossible : '+(error?.message||'erreur serveur'),4800)}
}
async function deleteReport(id){
 if(!manager())return toast('Accès gestion requis.');
 const data=app()?.readData?.();if(!data)return;
 if(!(data.reports||[]).some(row=>String(row.id)===String(id)))return toast('Bilan introuvable.');
 if(!confirm('Supprimer ce bilan ?'))return;
 toast('Suppression en cours…');
 try{
  await serverDelete('v20_reports',id);
  data.reports=(data.reports||[]).filter(row=>String(row.id)!==String(id));
  persist(data);app()?.go?.('reports');toast('Bilan supprimé définitivement.');
 }catch(error){console.error('V25 delete report',error);toast('Suppression impossible : '+(error?.message||'erreur serveur'),4800)}
}

function clearSessionTimers(){
 clearTimeout(sessionTimer);clearTimeout(warningTimer);sessionTimer=null;warningTimer=null;
}
async function expireSession(){
 if(expiring||!protectedSession())return;
 expiring=true;clearSessionTimers();
 try{
  localStorage.removeItem(ACTIVITY_KEY);
  if(typeof window.__BS_SIGN_OUT==='function')await window.__BS_SIGN_OUT();
  else{
   const client=sb();if(client)await Promise.race([client.auth.signOut(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('timeout')),5000))]);
   const data=app()?.readData?.()||{};data.students=[];data.licenses=[];data.appreciations=[];data.reports=[];data.eventRegistrations=[];data.convocations=(data.convocations||[]).map(({studentIds,...convocation})=>convocation);persist(data);
   sessionStorage.removeItem(VERIFIED);localStorage.setItem(ROLE_KEY,'public');app()?.hydrateFromServer?.(data,'public');
  }
 }catch(error){console.warn('V25 session signout',error)}
 finally{expiring=false;toast('Session fermée après 30 minutes d’inactivité.',4800)}
}
function scheduleSession(){
 clearSessionTimers();
 if(!protectedSession())return;
 let last=Number(localStorage.getItem(ACTIVITY_KEY)||0);
 if(!last){last=Date.now();localStorage.setItem(ACTIVITY_KEY,String(last))}
 const remaining=Math.max(0,SESSION_TIMEOUT-(Date.now()-last));
 if(remaining===0)return void expireSession();
 if(remaining>SESSION_WARNING)warningTimer=setTimeout(()=>{if(protectedSession())toast('Session sécurisée : déconnexion automatique dans 2 minutes sans activité.',7000)},remaining-SESSION_WARNING);
 sessionTimer=setTimeout(expireSession,remaining);
}
function markActivity(){
 if(!protectedSession())return;
 const now=Date.now();if(now-lastWrite<15000)return;
 lastWrite=now;localStorage.setItem(ACTIVITY_KEY,String(now));scheduleSession();
}
['pointerdown','keydown','touchstart'].forEach(type=>document.addEventListener(type,markActivity,{passive:true,capture:true}));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)markActivity()});
window.addEventListener('storage',event=>{if(event.key===ACTIVITY_KEY)scheduleSession()});
setInterval(scheduleSession,60000);
setTimeout(scheduleSession,800);

function install(){
 const target=app();if(!target)return setTimeout(install,80);
 target.deleteEvent=deleteEvent;
 target.deleteConv=deleteConvocation;
 target.deleteReport=deleteReport;
 window.ASV25={version:VERSION,features:['server-first-deletes','delete-verification','30-minute-inactivity-timeout','shared-session-activity']};
 document.documentElement.dataset.appVersion='25';
}
install();
})();
