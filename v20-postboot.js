(() => {
'use strict';
const cfg=window.APP_CONFIG||{};
if(!(cfg.supabaseUrl&&cfg.supabaseAnonKey))return;
if(sessionStorage.getItem('bs-v20-verified-role'))return;
const key='bs-v20-public-refresh';
if(sessionStorage.getItem(key))return;
sessionStorage.setItem(key,'1');
setTimeout(()=>location.reload(),1400);
})();
