(()=>{
'use strict';
if(window.__AS_V10_NATIVE_MO)return;
window.__AS_V10_NATIVE_MO=window.MutationObserver;
class QuietObserver{constructor(cb){this.cb=cb}observe(){}disconnect(){}takeRecords(){return[]}}
window.MutationObserver=QuietObserver;
})();
