(() => {
'use strict';
if(!window.__BS_RELEASE)window.__BS_RELEASE={major:29,label:'V29.1',version:'29.1.0',channel:'stable'};

function applyReleaseLabel(){
  const release=window.__BS_RELEASE||{major:29,label:'V29.1'};
  document.documentElement.dataset.appVersion=String(release.major||29);
  document.querySelectorAll('.v221-privacy-footer span').forEach(el=>{if(el.textContent!==release.label)el.textContent=release.label});
}
window.__BS_APPLY_RELEASE_LABEL=applyReleaseLabel;
applyReleaseLabel();
document.addEventListener('DOMContentLoaded',applyReleaseLabel,{once:true});
window.addEventListener('bs-app-rendered',()=>requestAnimationFrame(applyReleaseLabel));
})();
