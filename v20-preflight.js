(() => {
'use strict';
const cfg=window.APP_CONFIG||{};
const ROLE_KEY='bs-demo-role-v4';
const VERIFIED='bs-v20-verified-role';
const allowed=['public','educator_escalade','educator_football','educator_gymnastique','teacher_as','admin'];
const hasSupabase=!!(cfg.supabaseUrl&&cfg.supabaseAnonKey);

if(cfg.demoMode===true&&!hasSupabase){
  const current=localStorage.getItem(ROLE_KEY);
  if(!allowed.includes(current)) localStorage.setItem(ROLE_KEY,'public');
  return;
}

const verified=sessionStorage.getItem(VERIFIED);
const role=allowed.includes(verified)?verified:'public';
localStorage.setItem(ROLE_KEY,role);
if(role==='public'){
  try{const data=JSON.parse(localStorage.getItem('bs-app-data-v4')||'{}');data.students=[];data.licenses=[];data.appreciations=[];data.reports=[];data.eventRegistrations=[];data.convocations=(data.convocations||[]).map(({studentIds,...convocation})=>convocation);localStorage.setItem('bs-app-data-v4',JSON.stringify(data))}catch{}
}
})();
