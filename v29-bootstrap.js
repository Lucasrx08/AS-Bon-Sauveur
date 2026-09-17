(() => {
'use strict';
window.__BS_RELEASE={major:29,label:'V29.1',version:'29.1.0',channel:'stable'};
document.documentElement.dataset.appVersion='29';

function applyReleaseLabel(){
  document.documentElement.dataset.appVersion='29';
  document.querySelectorAll('.v221-privacy-footer span').forEach(el=>{if(el.textContent!=='V29.1')el.textContent='V29.1'});
}
window.__BS_APPLY_RELEASE_LABEL=applyReleaseLabel;
applyReleaseLabel();
document.addEventListener('DOMContentLoaded',applyReleaseLabel,{once:true});
window.addEventListener('bs-app-rendered',()=>requestAnimationFrame(applyReleaseLabel));
})();
