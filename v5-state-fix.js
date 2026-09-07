(() => {
'use strict';
let categoryFilter='';
const originalFilter=window.app?.licenseFilter?.bind(window.app);
const originalClear=window.app?.clearLicenseFilters?.bind(window.app);
if(originalFilter){
  window.app.licenseFilter=function(key,value){
    if(key==='category')categoryFilter=value||'';
    originalFilter(key,value);
    requestAnimationFrame(syncCategoryFilter);
  };
}
if(originalClear){
  window.app.clearLicenseFilters=function(){ categoryFilter=''; originalClear(); requestAnimationFrame(syncCategoryFilter); };
}
function syncCategoryFilter(){
  document.querySelectorAll('.filter-field').forEach(field=>{
    if(field.querySelector('span')?.textContent?.trim().toUpperCase()!=='CATÉGORIE')return;
    const select=field.querySelector('select');
    if(select&&[...select.options].some(o=>o.value===categoryFilter))select.value=categoryFilter;
  });
}
const root=document.getElementById('app');
if(root)new MutationObserver(()=>requestAnimationFrame(syncCategoryFilter)).observe(root,{childList:true,subtree:true});
})();
