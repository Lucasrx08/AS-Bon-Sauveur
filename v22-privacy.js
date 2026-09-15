(()=>{
'use strict';
const TIMEOUT=30*60*1000;
const VERIFIED='bs-v20-verified-role';
let timer=null,lastTouch=0,lastFocused=null;
const role=()=>sessionStorage.getItem(VERIFIED)||'public';
async function logoutInactive(){
 if(role()==='public')return;
 try{await window.__BS_SUPABASE_CLIENT?.auth?.signOut?.()}catch{}
 try{sessionStorage.removeItem(VERIFIED);sessionStorage.removeItem('bs-v22-session-data');sessionStorage.removeItem('bs-v22-session-role')}catch{}
 location.reload()
}
function schedule(){
 if(role()==='public'){if(timer)clearTimeout(timer);timer=null;return}
 if(timer)clearTimeout(timer);timer=setTimeout(logoutInactive,TIMEOUT)
}
function activity(){
 const now=Date.now();if(now-lastTouch<10000)return;lastTouch=now;schedule()
}
function addFooter(){
 if(document.querySelector('[data-v22-footer]'))return;
 const footer=document.createElement('footer');footer.dataset.v22Footer='1';footer.className='v22-footer';
 footer.innerHTML='<span>L. RIGAUX · AS Bon Sauveur</span><span><a href="confidentialite.html">Confidentialité et droits</a> · Version 22.0.0</span>';
 (document.querySelector('#app')||document.body).appendChild(footer)
}
function enhance(root=document){
 root.querySelectorAll('img:not([alt])').forEach(image=>{image.alt=image.closest('.v19-brand')?'Logo de l’Association Sportive du Bon Sauveur':'Illustration'});
 root.querySelectorAll('a[target="_blank"]').forEach(link=>link.setAttribute('rel','noopener noreferrer'));
 root.querySelectorAll('.v19-search:not([aria-label])').forEach(input=>input.setAttribute('aria-label','Rechercher'));
 root.querySelectorAll('.v19-bottom-nav').forEach(nav=>nav.setAttribute('aria-label','Navigation principale'));
 root.querySelectorAll('.v19-bottom-nav button').forEach(button=>button.setAttribute('aria-current',button.classList.contains('active')?'page':'false'));
 root.querySelectorAll('.v19-toast').forEach(item=>{item.setAttribute('role','status');item.setAttribute('aria-live','polite')});
 addFooter()
}
function focusGuard(event){
 const modal=document.querySelector('.v19-modal-backdrop:last-of-type .v19-modal');if(!modal)return;
 if(event.key==='Escape'){modal.closest('.v19-modal-backdrop')?.querySelector('[data-close],.v19-icon-btn')?.click();lastFocused?.focus?.();return}
 if(event.key!=='Tab')return;
 const focusable=[...modal.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]')].filter(item=>item.offsetParent!==null);
 if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];
 if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
 else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
}
document.addEventListener('focusin',event=>{if(!event.target.closest?.('.v19-modal'))lastFocused=event.target});
document.addEventListener('keydown',focusGuard);
['pointerdown','keydown','scroll','touchstart'].forEach(name=>addEventListener(name,activity,{passive:true}));
new MutationObserver(()=>enhance()).observe(document.body,{childList:true,subtree:true});
enhance();schedule();
window.ASV22_PRIVACY={version:'22.0.0',inactivityMinutes:30};
})();
