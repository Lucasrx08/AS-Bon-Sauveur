(() => {
'use strict';

const isMobile=()=>window.matchMedia?.('(max-width: 760px)')?.matches??(window.innerWidth<=760);
let queued=false;

function resetRootX(){
  if(!isMobile())return;
  queued=false;
  const scroller=document.scrollingElement||document.documentElement;
  const y=scroller?.scrollTop??window.scrollY??0;
  try{
    if(scroller&&scroller.scrollLeft!==0)scroller.scrollLeft=0;
    if(document.documentElement.scrollLeft!==0)document.documentElement.scrollLeft=0;
    if(document.body&&document.body.scrollLeft!==0)document.body.scrollLeft=0;
    const app=document.getElementById('app');
    if(app&&app.scrollLeft!==0)app.scrollLeft=0;
    if(window.scrollX!==0)window.scrollTo(0,y);
  }catch{}
}
function scheduleReset(){
  if(!isMobile()||queued)return;
  queued=true;
  requestAnimationFrame(()=>requestAnimationFrame(resetRootX));
}

function patchNavigation(){
  const app=window.app;
  if(!app||app.__bsMobileLockPatched)return;
  app.__bsMobileLockPatched=true;
  if(typeof app.go==='function'){
    const originalGo=app.go.bind(app);
    app.go=(...args)=>{
      const result=originalGo(...args);
      scheduleReset();
      return result;
    };
  }
  if(typeof app.hydrateFromServer==='function'){
    const originalHydrate=app.hydrateFromServer.bind(app);
    app.hydrateFromServer=(...args)=>{
      const result=originalHydrate(...args);
      scheduleReset();
      return result;
    };
  }
}

function onRootScroll(){
  if(!isMobile())return;
  const scroller=document.scrollingElement||document.documentElement;
  if((window.scrollX||0)!==0||(scroller?.scrollLeft||0)!==0)scheduleReset();
}

window.addEventListener('pageshow',scheduleReset);
window.addEventListener('focus',scheduleReset);
window.addEventListener('resize',scheduleReset,{passive:true});
window.addEventListener('orientationchange',scheduleReset,{passive:true});
window.addEventListener('scroll',onRootScroll,{passive:true});
window.addEventListener('bs-app-rendered',()=>{patchNavigation();scheduleReset()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleReset()});
document.addEventListener('focusin',()=>scheduleReset(),true);

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{patchNavigation();scheduleReset()},{once:true});
else{patchNavigation();scheduleReset()}
setTimeout(()=>{patchNavigation();scheduleReset()},250);
setTimeout(scheduleReset,900);

window.ASV31_MOBILE_LOCK={version:'31.2.0',rootHorizontalScrollLocked:true,internalTableScroll:true};
})();
