(() => {
'use strict';
const STORE='bs-app-data-v4';
const previousExport=window.app?.exportExcel;

const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,' ').replace(/[^a-z0-9]+/g,' ').trim();
const data=()=>window.app?.readData?.()||JSON.parse(localStorage.getItem(STORE)||'{}');

function fixPlaceholder(){
 document.querySelectorAll('#v20-pin-create input[name="displayName"],input[name="loginName"]').forEach(i=>{
  if(/romain\s+murcia/i.test(i.placeholder||''))i.placeholder='Ex. Lucas Rigaux';
 });
}
function pageCleanup(){
 const title=(document.querySelector('.v19-page-head h1')?.textContent||'').trim();
 const container=document.querySelector('.v19-container');
 if(/gestion des commandes/i.test(title)){
  container?.classList.add('v2110-orders-page');
  document.querySelectorAll('.v19-head-actions [data-v21-products]').forEach(b=>{b.hidden=true;b.style.display='none'});
  document.querySelectorAll('.v19-head-actions button').forEach(b=>{if(/^gérer les produits$/i.test((b.textContent||'').trim())){b.hidden=true;b.style.display='none'}});
 }
 if(/^convocations$/i.test(title)){
  container?.classList.add('v2110-conv-page');
  document.querySelectorAll('.v19-head-actions button').forEach(b=>{if(/exporter excel/i.test(b.textContent||'')){b.hidden=true;b.style.display='none'}});
 }
}
function licenseFor(studentId){return (data().licenses||[]).find(l=>String(l.studentId)===String(studentId))}
function enhanceConvocationForm(){
 const form=document.querySelector('#v19-conv-form');if(!form||form.dataset.v2110==='1')return;
 form.dataset.v2110='1';
 const cat=form.querySelector('[name="ageCategory"]'),sp=form.querySelector('[name="specialty"]'),picker=form.querySelector('.v19-student-picker');if(!cat||!sp||!picker)return;
 const status=document.createElement('div');status.className='v2110-picker-status';picker.before(status);
 const sync=()=>{
  let visible=0;
  picker.querySelectorAll('label').forEach(label=>{
   const cb=label.querySelector('input[name="studentIds"]'),lic=licenseFor(cb?.value);if(!cb||!lic)return;
   const catOk=cat.value==='Toutes catégories'||norm(lic.category)===norm(cat.value);
   const spOk=sp.value==='Association Sportive'||norm(lic.sectionOption)===norm(sp.value);
   const ok=catOk&&spOk;label.hidden=!ok;label.style.display=ok?'':'none';
   if(!ok)cb.checked=false;else visible++;
  });
  const suffix=sp.value==='Association Sportive'?' — tous les pôles restent éligibles à l’AS.':'';
  status.textContent=`${visible} élève(s) proposé(s) pour ${cat.value} · ${sp.value}${suffix}`;
 };
 cat.addEventListener('change',sync);sp.addEventListener('change',sync);sync();
}
function apply(){fixPlaceholder();pageCleanup();enhanceConvocationForm()}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})}
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});apply();

async function ensureExcel(){if(window.ExcelJS)return;await new Promise((ok,ko)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';s.onload=ok;s.onerror=ko;document.head.appendChild(s)})}
function download(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1200)}
function font(cell,{title=false,header=false,size=11,white=false}={}){cell.font={name:title?'Anton':'Montserrat',size:title?24:size,bold:title||header,color:{argb:white?'FFFFFFFF':'FF13213A'}}}
function fill(cell,color){cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:color}}}
function border(cell,color='FFDCE5F0'){cell.border={top:{style:'thin',color:{argb:color}},bottom:{style:'thin',color:{argb:color}},left:{style:'thin',color:{argb:color}},right:{style:'thin',color:{argb:color}}}}
function align(cell){cell.alignment={horizontal:'center',vertical:'middle',wrapText:true}}
function titleBlock(ws,title,cols){ws.mergeCells(1,1,1,cols);const t=ws.getCell(1,1);t.value=title;font(t,{title:true,white:true});fill(t,'FF0757C9');align(t);ws.getRow(1).height=42;ws.mergeCells(2,1,2,cols);const s=ws.getCell(2,1);s.value='ASSOCIATION SPORTIVE DU BON SAUVEUR · SAINT-LÔ';font(s,{header:true,size:11});align(s);ws.getRow(2).height=24}
function headerRow(ws,row,vals){vals.forEach((v,i)=>{const c=ws.getCell(row,i+1);c.value=v;font(c,{header:true,size:12});fill(c,'FFFFD21A');border(c,'FFB8C9DF');align(c)});ws.getRow(row).height=36}
function styleRow(ws,row,cols){for(let c=1;c<=cols;c++){const cell=ws.getCell(row,c);font(cell,{size:11});border(cell);align(cell);if(row%2===0)fill(cell,'FFF7F9FC')}ws.getRow(row).height=38}
function totalRow(ws,row,cols){for(let c=1;c<=cols;c++){const cell=ws.getCell(row,c);font(cell,{header:true,size:11});fill(cell,'FFEAF3FF');border(cell,'FFB8C9DF');align(cell)}ws.getRow(row).height=36}
function dateFr(v){if(!v)return'';const d=new Date(String(v).slice(0,10)+'T12:00:00');return Number.isNaN(d.getTime())?String(v):d.toLocaleDateString('fr-FR')}
function group(rows,key){const m=new Map();rows.forEach(r=>{const k=String(r[key]||'Non renseigné'),x=m.get(k)||{count:0,participants:0};x.count++;x.participants+=Number(r.participants||0);m.set(k,x)});return[...m.entries()].sort((a,b)=>b[1].participants-a[1].participants||a[0].localeCompare(b[0],'fr'))}
function buildReportSummary(wb,rows){
 const ws=wb.addWorksheet('Synthèse',{views:[{showGridLines:false,zoomScale:100}]});titleBlock(ws,'SYNTHÈSE D’ACTIVITÉ — BILANS AS',6);
 const totalParticipants=rows.reduce((s,r)=>s+Number(r.participants||0),0),avg=rows.length?totalParticipants/rows.length:0;
 const metrics=[['Bilans enregistrés',rows.length],['Participations cumulées',totalParticipants],['Moyenne par bilan',Number(avg.toFixed(1))]];
 metrics.forEach((m,i)=>{const r=4+i;ws.mergeCells(r,1,r,3);ws.getCell(r,1).value=m[0];font(ws.getCell(r,1),{header:true,size:12});fill(ws.getCell(r,1),'FFF4F7FB');border(ws.getCell(r,1));align(ws.getCell(r,1));ws.mergeCells(r,4,r,6);ws.getCell(r,4).value=m[1];font(ws.getCell(r,4),{header:true,size:13});border(ws.getCell(r,4));align(ws.getCell(r,4));ws.getRow(r).height=32});
 const byActivity=group(rows,'activity'),byLevel=group(rows,'level');
 ws.mergeCells('A9:C9');ws.getCell('A9').value='PAR ACTIVITÉ';font(ws.getCell('A9'),{header:true,size:13});align(ws.getCell('A9'));
 ws.mergeCells('D9:F9');ws.getCell('D9').value='PAR NIVEAU';font(ws.getCell('D9'),{header:true,size:13});align(ws.getCell('D9'));
 ['Activité','Bilans','Élèves','Niveau','Bilans','Élèves'].forEach((v,i)=>{const c=ws.getCell(10,i+1);c.value=v;font(c,{header:true,size:11});fill(c,'FFFFD21A');border(c);align(c)});
 const n=Math.max(byActivity.length,byLevel.length);for(let i=0;i<n;i++){const r=11+i,a=byActivity[i],l=byLevel[i];if(a){ws.getCell(r,1).value=a[0];ws.getCell(r,2).value=a[1].count;ws.getCell(r,3).value=a[1].participants}if(l){ws.getCell(r,4).value=l[0];ws.getCell(r,5).value=l[1].count;ws.getCell(r,6).value=l[1].participants}styleRow(ws,r,6)}
 [24,12,12,24,12,12].forEach((w,i)=>ws.getColumn(i+1).width=w);ws.pageSetup={orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:1,horizontalCentered:true,margins:{left:.25,right:.25,top:.4,bottom:.4,header:.15,footer:.15}}
}
function buildReportDetail(wb,rows){
 const ws=wb.addWorksheet('Détail compact',{views:[{state:'frozen',ySplit:4,showGridLines:false,zoomScale:82,zoomScaleNormal:82}]});const cols=7;titleBlock(ws,'DÉTAIL DES BILANS AS',cols);headerRow(ws,4,['Date','Activité','Enseignant(s)','Niveau / catégorie','Lieu','Élèves','Commentaire']);
 rows.forEach((r,i)=>{const row=5+i,[date,activity,teacher,levelcat,place,participants,comment]=[dateFr(r.date),r.activity,r.teacher,`${r.level||'—'}\n${r.category||'—'}`,r.place,Number(r.participants||0),r.comment];[date,activity,teacher,levelcat,place,participants,comment].forEach((v,c)=>ws.getCell(row,c+1).value=v);styleRow(ws,row,cols);ws.getRow(row).height=48});
 const tr=5+rows.length;ws.getCell(tr,1).value='TOTAL';ws.getCell(tr,6).value=rows.reduce((s,r)=>s+Number(r.participants||0),0);totalRow(ws,tr,cols);
 [12,18,24,20,18,10,32].forEach((w,i)=>ws.getColumn(i+1).width=w);ws.autoFilter={from:{row:4,column:1},to:{row:4,column:cols}};ws.pageSetup={orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0,horizontalCentered:true,margins:{left:.2,right:.2,top:.35,bottom:.35,header:.15,footer:.15}};ws.pageSetup.printArea=`A1:${ws.getCell(tr,cols).address}`;
}
async function exportReports(){await ensureExcel();const rows=(data().reports||[]).slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));const wb=new ExcelJS.Workbook();wb.creator='Association Sportive du Bon Sauveur';wb.company='Bon Sauveur Saint-Lô';wb.created=new Date();buildReportSummary(wb,rows);buildReportDetail(wb,rows);const buf=await wb.xlsx.writeBuffer();download(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),'Bilans_AS_Bon_Sauveur.xlsx')}
function installExport(){if(!window.app)return setTimeout(installExport,80);const prev=window.app.exportExcel||previousExport;window.app.exportExcel=kind=>kind==='reports'?exportReports():kind==='convocations'?undefined:prev?.(kind)}
installExport();
})();