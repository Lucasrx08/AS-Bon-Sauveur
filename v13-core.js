(()=>{
'use strict';
const app=window.app;if(!app)return;
function isAppPage(){return document.querySelector('.page-title h1')?.textContent?.trim()==='Appréciations'}
function currentText(row){return row.querySelector('.appreciation-text')?.value?.trim()||''}
function syncRow(row){
 const ta=row.querySelector('.appreciation-text');if(!ta)return;
 const cells=row.querySelectorAll('td');if(cells.length<2)return;
 let box=cells[1].querySelector('.v13-current-app');
 if(!box){box=document.createElement('div');box.className='v13-current-app';box.innerHTML='<span class="v13-current-label">Appréciation actuelle</span><p class="v13-current-text"></p>';cells[1].appendChild(box)}
 const text=currentText(row),p=box.querySelector('.v13-current-text');p.textContent=text||'Aucune appréciation rédigée';box.classList.toggle('empty',!text);
 if(!ta.dataset.v13Live){ta.dataset.v13Live='1';ta.addEventListener('input',()=>syncRow(row))}
 const copy=row.querySelector('.v12-copy-app');if(copy){copy.disabled=!text;copy.title=text?'Copier l’appréciation':'Aucune appréciation à copier'}
}
function dedupe(){if(!isAppPage())return;const buttons=[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='Exporter Excel');buttons.slice(1).forEach(b=>b.remove())}
function refresh(){if(!isAppPage())return;dedupe();document.querySelectorAll('.appreciation-table tbody tr').forEach(syncRow)}
let pending=false;const root=document.getElementById('app');if(root&&window.MutationObserver)new MutationObserver(()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;refresh()})}).observe(root,{childList:true,subtree:true});
['go','setTerm','saveApp','validateApp'].forEach(k=>{const fn=app[k];if(typeof fn!=='function'||fn.__v13)return;const w=function(...args){const r=fn.apply(this,args);requestAnimationFrame(refresh);return r};w.__v13=true;app[k]=w});
refresh();window.ASV13={refresh,version:'v13-20260908-1'};
})();