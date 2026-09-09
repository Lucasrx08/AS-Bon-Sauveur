(() => {
'use strict';
const ROLE_KEY='bs-demo-role-v4';
const VERIFIED='bs-v20-verified-role';
const allowed=['public','educator_escalade','educator_football','educator_gymnastique','teacher_as','admin'];
const verified=sessionStorage.getItem(VERIFIED);
localStorage.setItem(ROLE_KEY,allowed.includes(verified)?verified:'public');
})();
