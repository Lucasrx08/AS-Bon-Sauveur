(() => {
'use strict';
function install(){
 document.documentElement.dataset.appVersion='25.1';
 const style=document.createElement('style');
 style.textContent='.v19-shell{padding-bottom:170px!important}.v19-container{padding-bottom:145px!important}';
 document.head.appendChild(style);
}
install();
})();