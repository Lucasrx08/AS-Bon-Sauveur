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
localStorage.setItem(ROLE_KEY,allowed.includes(verified)?verified:'public');
})();
