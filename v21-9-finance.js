(() => {
'use strict';
const STORE='bs-app-data-v4';
const previousExport=window.app?.exportExcel;
const euro=n=>Number(n||0);
const mode=v=>String(v||'Non renseigné').trim()||'Non renseigné';
const moneyText=n=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(Number(n||0));
const dateFr=v=>{if(!v)return'';const d=new Date(String(v).slice(0,10)+'T12:00:00');return Number.isNaN(d.getTime())?String(v):d.toLocaleDateString('fr-FR')};

async function ensureExcel(){if(window.ExcelJS)return;await new Promise((ok,ko)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';s.onload=ok;s.onerror=ko;document.head.appendChild(s)})}
function download(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1200)}
function font(cell,{title=false,header=false,size=11,white=false}={}){cell.font={name:title?'Anton':'Montserrat',size:title?24:size,bold:title||header,color:{argb:white?'FFFFFFFF':'FF13213A'}}}
function fill(cell,color){cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:color}}}
function border(cell,color='FFDCE5F0'){cell.border={top:{style:'thin',color:{argb:color}},bottom:{style:'thin',color:{argb:color}},left:{style:'thin',color:{argb:color}},right:{style:'thin',color:{argb:color}}}}
function align(cell,{wrap=true}={}){cell.alignment={horizontal:'center',vertical:'middle',wrapText:wrap}}
function moneyFormat(cell){cell.numFmt='#,##0.00 "€"'}
function titleBlock(ws,title,cols){
 ws.mergeCells(1,1,1,cols);const t=ws.getCell(1,1);t.value=title;font(t,{title:true,white:true});fill(t,'FF0757C9');align(t,{wrap:false});ws.getRow(1).height=42;
 ws.mergeCells(2,1,2,cols);const s=ws.getCell(2,1);s.value='ASSOCIATION SPORTIVE DU BON SAUVEUR · SAINT-LÔ';font(s,{header:true,size:11});align(s,{wrap:false});ws.getRow(2).height=24;
}
function headers(ws,row,values){values.forEach((v,i)=>{const c=ws.getCell(row,i+1);c.value=v;font(c,{header:true,size:12});fill(c,'FFFFD21A');border(c,'FFB8C9DF');align(c)});ws.getRow(row).height=36}
function rowStyle(ws,row,cols){for(let c=1;c<=cols;c++){const cell=ws.getCell(row,c);font(cell,{size:11});border(cell);align(cell);if(row%2===0)fill(cell,'FFF7F9FC')}ws.getRow(row).height=34}
function totalStyle(ws,row,cols){for(let c=1;c<=cols;c++){const cell=ws.getCell(row,c);font(cell,{header:true,size:11});fill(cell,'FFEAF3FF');border(cell,'FFB8C9DF');align(cell)}ws.getRow(row).height=34}
function products(data){return new Map((data.products||[]).map(p=>[p.id,p]))}

function summary(data,kind){
 const map=new Map();let count=0,total=0,paid=0;
 if(kind==='licenses')for(const l of data.licenses||[]){const amount=euro(l.amount),enc=l.paymentStatus==='Payé'?amount:0,k=mode(l.contribution),x=map.get(k)||{count:0,total:0,paid:0};x.count++;x.total+=amount;x.paid+=enc;map.set(k,x);count++;total+=amount;paid+=enc}
 else{const pm=products(data);for(const o of data.orders||[]){const p=pm.get(o.productId),amount=euro(p?.price)*Math.max(1,Number(o.quantity||1)),enc=o.paid?amount:0,k=mode(o.paymentMethod),x=map.get(k)||{count:0,total:0,paid:0};x.count++;x.total+=amount;x.paid+=enc;map.set(k,x);count++;total+=amount;paid+=enc}}
 return{count,total,paid,pending:total-paid,modes:[...map.entries()].sort((a,b)=>a[0].localeCompare(b[0],'fr'))};
}
function buildSummary(wb,data,kind){
 const ws=wb.addWorksheet('Synthèse financière',{views:[{showGridLines:false,zoomScale:100,zoomScaleNormal:100}]});titleBlock(ws,kind==='licenses'?'SYNTHÈSE FINANCIÈRE — LICENCES':'SYNTHÈSE FINANCIÈRE — COMMANDES',5);
 const s=summary(data,kind);
 ws.mergeCells('A4:E4');const a4=ws.getCell('A4');a4.value='SITUATION GÉNÉRALE';font(a4,{header:true,size:13});align(a4);
 const metrics=[['Nombre de transactions',s.count],['Total des transactions',s.total],['Total encaissé',s.paid],['Reste à encaisser',s.pending]];
 metrics.forEach((m,i)=>{const r=5+i;ws.mergeCells(r,1,r,3);const l=ws.getCell(r,1);l.value=m[0];font(l,{header:true,size:12});fill(l,'FFF4F7FB');border(l);align(l);ws.mergeCells(r,4,r,5);const v=ws.getCell(r,4);v.value=m[1];font(v,{header:true,size:13});fill(v,i===2?'FFEAF8EF':i===3&&s.pending>0?'FFFFF0F2':'FFFFFFFF');border(v);align(v);if(i>0)moneyFormat(v);ws.getRow(r).height=32});
 ws.mergeCells('A10:E10');const s10=ws.getCell('A10');s10.value='RÉPARTITION PAR MODE DE RÈGLEMENT';font(s10,{header:true,size:13});align(s10);
 headers(ws,11,['Mode de règlement','Transactions','Montant total','Encaissé','Reste']);
 s.modes.forEach(([m,x],i)=>{const r=12+i;[m,x.count,x.total,x.paid,x.total-x.paid].forEach((v,c)=>ws.getCell(r,c+1).value=v);rowStyle(ws,r,5);[3,4,5].forEach(c=>moneyFormat(ws.getCell(r,c)))});
 const tr=12+s.modes.length;['TOTAL GÉNÉRAL',s.count,s.total,s.paid,s.pending].forEach((v,c)=>ws.getCell(tr,c+1).value=v);totalStyle(ws,tr,5);[3,4,5].forEach(c=>moneyFormat(ws.getCell(tr,c)));
 ws.getColumn(1).width=28;ws.getColumn(2).width=16;ws.getColumn(3).width=18;ws.getColumn(4).width=18;ws.getColumn(5).width=18;
 ws.pageSetup={orientation:'portrait',fitToPage:true,fitToWidth:1,fitToHeight:1,horizontalCentered:true,margins:{left:.25,right:.25,top:.4,bottom:.4,header:.15,footer:.15}};
}
function buildDetail(wb,data,kind){
 const isLic=kind==='licenses';const cols=isLic?8:9;const ws=wb.addWorksheet('Détail compact',{views:[{state:'frozen',ySplit:4,showGridLines:false,zoomScale:isLic?90:82,zoomScaleNormal:isLic?90:82}]});titleBlock(ws,isLic?'DÉTAIL DES LICENCES':'DÉTAIL DES COMMANDES',cols);
 let hs,rows,totalCol;
 if(isLic){
  hs=['Nom & prénom','Classe','Catégorie','Spécialité','Règlement','Statut','Montant','Charte'];totalCol=7;
  rows=(data.licenses||[]).map(l=>[l.fullName,l.className,l.category,l.sectionOption,mode(l.contribution),l.paymentStatus,euro(l.amount),l.charterSigned]);
 }else{
  const pm=products(data);hs=['Élève','Classe','Produit','Taille / Qté','Règlement','Paiement','Total','Distribution','Date'];totalCol=7;
  rows=(data.orders||[]).map(o=>{const p=pm.get(o.productId),unit=euro(p?.price),q=Math.max(1,Number(o.quantity||1));return[o.studentName,o.className,`${p?.name||'Produit supprimé'}\n${moneyText(unit)} / unité`,`${o.size||'—'} · x${q}`,mode(o.paymentMethod),o.paid?'Payé':'En attente',unit*q,o.distributed?'Distribué':'À distribuer',dateFr(o.createdAt)]});
 }
 headers(ws,4,hs);
 rows.forEach((vals,i)=>{const r=5+i;vals.forEach((v,c)=>ws.getCell(r,c+1).value=v);rowStyle(ws,r,cols);moneyFormat(ws.getCell(r,totalCol));if(!isLic)ws.getRow(r).height=42});
 const tr=5+rows.length;ws.getCell(tr,1).value='TOTAL GÉNÉRAL';if(rows.length)ws.getCell(tr,totalCol).value={formula:`SUM(${ws.getCell(5,totalCol).address}:${ws.getCell(tr-1,totalCol).address})`};else ws.getCell(tr,totalCol).value=0;totalStyle(ws,tr,cols);moneyFormat(ws.getCell(tr,totalCol));
 if(isLic){[22,18,13,22,17,13,12,10].forEach((w,i)=>ws.getColumn(i+1).width=w)}else{[20,17,22,13,16,13,12,15,12].forEach((w,i)=>ws.getColumn(i+1).width=w)}
 ws.autoFilter={from:{row:4,column:1},to:{row:4,column:cols}};
 ws.pageSetup={orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0,horizontalCentered:true,margins:{left:.2,right:.2,top:.35,bottom:.35,header:.15,footer:.15}};
 ws.pageSetup.printArea=`A1:${ws.getCell(tr,cols).address}`;
}
async function exportAccounting(kind){
 await ensureExcel();const data=window.app?.readData?.()||JSON.parse(localStorage.getItem(STORE)||'{}');const wb=new ExcelJS.Workbook();wb.creator='Association Sportive du Bon Sauveur';wb.company='Bon Sauveur Saint-Lô';wb.created=new Date();wb.calcProperties.fullCalcOnLoad=true;buildSummary(wb,data,kind);buildDetail(wb,data,kind);const name=kind==='licenses'?'Licences_Comptabilite_AS_Bon_Sauveur.xlsx':'Commandes_Comptabilite_AS_Bon_Sauveur.xlsx';const buf=await wb.xlsx.writeBuffer();download(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),name)
}
function install(){if(!window.app)return setTimeout(install,80);window.app.exportExcel=kind=>kind==='licenses'||kind==='orders'?exportAccounting(kind):previousExport?.(kind);window.ASV219_FINANCE={version:'21.9'}}
install();
})();