(()=>{
'use strict';
const collator=new Intl.Collator('fr',{sensitivity:'base',numeric:true,ignorePunctuation:true});
const normalize=s=>String(s??'').replace(/\s+/g,' ').trim();
const pageTitle=()=>normalize(document.querySelector('.v19-page-head h1')?.textContent);
function isTargetPage(){
  return ['Licences','Gestion des commandes','Inscriptions libres'].includes(pageTitle());
}
function reorderRegistrations(table){
  if(pageTitle()!=='Inscriptions libres')return;
  const heads=[...table.tHead?.rows?.[0]?.cells||[]].map(th=>normalize(th.textContent).replace(/[↕↑↓]/g,'').trim());
  if(!heads.length)return;
  const desired=['Date','Nom','Prénom','Classe','Événement','Spécialité','Inscrit le','Action'];
  const index=desired.map(label=>heads.indexOf(label));
  if(index.some(i=>i<0))return;
  const reorderRow=row=>{
    const cells=[...row.cells];
    index.forEach(i=>row.appendChild(cells[i]));
  };
  reorderRow(table.tHead.rows[0]);
  [...table.tBodies].forEach(tb=>[...tb.rows].forEach(reorderRow));
}
function valueFor(cell,label){
  const raw=normalize(cell?.textContent);
  if(['Montant'].includes(label)){
    const n=Number(raw.replace(/[^0-9,.-]/g,'').replace(',','.'));
    return Number.isFinite(n)?n:0;
  }
  if(['Date','Inscrit le'].includes(label)){
    const m=raw.match(/(\d{1,2})[\/.\s-](\d{1,2}|[A-Za-zÀ-ÿ]+)[\/.\s-](\d{2,4})/);
    if(/^\d{1,2}\s+[A-Za-zÀ-ÿ]+\s+\d{4}/.test(raw)){
      const months={janv:0,févr:1,mars:2,avr:3,mai:4,juin:5,juil:6,août:7,sept:8,oct:9,nov:10,déc:11};
      const p=raw.toLowerCase().replace('.','').split(/\s+/);
      const mo=Object.keys(months).find(k=>p[1]?.startsWith(k));
      if(mo)return new Date(Number(p[2]),months[mo],Number(p[0])).getTime();
    }
    if(m && /^\d/.test(m[2])){
      const y=Number(m[3])<100?2000+Number(m[3]):Number(m[3]);
      return new Date(y,Number(m[2])-1,Number(m[1])).getTime();
    }
  }
  return raw;
}
function sortTable(table,col,label,button){
  const tbody=table.tBodies?.[0]; if(!tbody)return;
  const current=button.dataset.dir==='asc'?'desc':'asc';
  table.querySelectorAll('.v31-sort-button').forEach(b=>{if(b!==button){b.dataset.dir='';const s=b.querySelector('span');if(s)s.textContent='↕';}});
  button.dataset.dir=current;
  const icon=button.querySelector('span');if(icon)icon.textContent=current==='asc'?'↑':'↓';
  const rows=[...tbody.rows];
  rows.sort((a,b)=>{
    const av=valueFor(a.cells[col],label),bv=valueFor(b.cells[col],label);
    let cmp;
    if(typeof av==='number'&&typeof bv==='number')cmp=av-bv;
    else cmp=collator.compare(String(av),String(bv));
    return current==='asc'?cmp:-cmp;
  });
  rows.forEach(r=>tbody.appendChild(r));
}
function enhance(){
  if(!isTargetPage())return;
  const table=document.querySelector('.v19-table-wrap table.v19-table'); if(!table)return;
  reorderRegistrations(table);
  const row=table.tHead?.rows?.[0]; if(!row)return;
  [...row.cells].forEach((th,col)=>{
    if(th.querySelector('.v31-sort-button'))return;
    const label=normalize(th.textContent).replace(/[↕↑↓]/g,'').trim();
    if(!label||label==='Action')return;
    th.textContent='';
    const b=document.createElement('button');
    b.type='button'; b.className='v19-sort-head v31-sort-button'; b.dataset.dir='';
    b.setAttribute('aria-label','Trier par '+label);
    b.innerHTML=`${label.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')} <span aria-hidden="true">↕</span>`;
    b.addEventListener('click',()=>sortTable(table,col,label,b));
    th.appendChild(b);
  });
}
let queued=false;
const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance();});};
new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',queue);
window.addEventListener('load',queue);
setTimeout(queue,250);
setTimeout(queue,1200);
})();