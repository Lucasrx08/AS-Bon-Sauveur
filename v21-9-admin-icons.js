(() => {
'use strict';
const ICONS={
 'utilisateurs & accès':'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2"/><path d="M16 8h5M18.5 5.5v5"/></svg>',
 'documents':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h9l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/></svg>',
 'boutique & produits':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16l-1 14H5z"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/></svg>',
 'commandes':'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 9h6M9 13h6M9 17h4"/></svg>'
};
function normalize(s=''){return String(s).trim().toLowerCase()}
function apply(){
 document.querySelectorAll('.v19-admin-cards .v19-admin-action').forEach(card=>{
  if(card.querySelector(':scope > .v19-icon,:scope > .v219-admin-icon'))return;
  const title=normalize(card.querySelector('h3')?.textContent||'');
  const svg=ICONS[title];if(!svg)return;
  const icon=document.createElement('span');icon.className='v219-admin-icon';icon.innerHTML=svg;
  card.classList.add('v219-iconized');card.prepend(icon);
 });
}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})}
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
apply();
})();