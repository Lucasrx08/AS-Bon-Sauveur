(() => {
'use strict';
const VERSION='v21.8-20260909';
const STORE='bs-app-data-v4';
const money=n=>Number(n||0);

function normalize(s=''){
 return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
}
function scrubNode(node){
 if(!(node instanceof Element))return;
 const options=[];
 if(node.matches?.('option'))options.push(node);
 node.querySelectorAll?.('option').forEach(o=>options.push(o));
 options.forEach(o=>{if(normalize(o.textContent)==='especes'||normalize(o.value)==='especes')o.remove()});
 const logins=[];
 if(node.matches?.('input[name="loginName"]'))logins.push(node);
 node.querySelectorAll?.('input[name="loginName"]').forEach(i=>logins.push(i));
 logins.forEach(i=>{if(!i.placeholder||/Romain\s+Murcia/i.test(i.placeholder))i.placeholder='Ex. Lucas Rigaux'});
}
function installUiCleanup(){
 scrubNode(document.documentElement);
 new MutationObserver(list=>{
  for(const m of list)for(const n of m.addedNodes)scrubNode(n);
 }).observe(document.body,{childList:true,subtree:true});
}
async function ensureExcel(){
 if(window.ExcelJS)return;
 await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
}
function downloadBlob(blob,name){
 const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1200);
}
function productMap(data){return new Map((data.products||[]).map(p=>[p.id,p]))}
function payMode(v){return String(v||'Non renseigné').trim()||'Non renseigné'}
function dateFr(v){
 if(!v)return '';
 const d=new Date(String(v).slice(0,10)+'T12:00:00');
 return Number.isNaN(d.getTime())?String(v):d.toLocaleDateString('fr-FR');
}
function setFont(cell,{title=false,header=false,white=false,size}={}){
 cell.font={name:title?'Anton':'BroshK',size:size||(title?22:header?11:10),bold:title||header,color:{argb:white?'FFFFFFFF':'FF13213A'}};
}
function fill(cell,argb){cell.fill={type:'pattern',pattern:'solid',fgColor:{argb}}}
function thinBottom(cell,color='FFDCE5F0'){cell.border={bottom:{style:'thin',color:{argb:color}}}}
function styleTitle(ws,title,cols){
 ws.mergeCells(1,1,1,cols);const c=ws.getCell(1,1);c.value=title;setFont(c,{title:true,white:true,size:24});fill(c,'FF0757C9');c.alignment={vertical:'middle',horizontal:'left'};ws.getRow(1).height=38;
 ws.mergeCells(2,1,2,cols);const s=ws.getCell(2,1);s.value='ASSOCIATION SPORTIVE DU BON SAUVEUR · SAINT-LÔ';setFont(s,{size:10});s.alignment={vertical:'middle'};ws.getRow(2).height=22;
}
function styleHeaderRow(ws,row,headers){
 headers.forEach((h,i)=>{const c=ws.getCell(row,i+1);c.value=h;setFont(c,{header:true});fill(c,'FFFFD21A');c.alignment={horizontal:'center',vertical:'middle',wrapText:true};thinBottom(c,'FF0757C9')});
 ws.getRow(row).height=28;
}
function styleDataRow(ws,row,values){
 values.forEach((v,i)=>{const c=ws.getCell(row,i+1);c.value=v;setFont(c);if(row%2===0)fill(c,'FFF7F9FC');c.alignment={vertical:'middle',wrapText:true};thinBottom(c)});
}
function addMoneyFormat(cell){cell.numFmt='#,##0.00 "€"'}
function autosize(ws,headers,widths={}){
 headers.forEach((h,i)=>{ws.getColumn(i+1).width=widths[i+1]||Math.min(34,Math.max(13,String(h).length+5))});
}
function buildSummaryRows(kind,data){
 const modes=new Map();let total=0,paid=0,count=0;
 if(kind==='licenses'){
  for(const l of data.licenses||[]){const amount=money(l.amount),enc=l.paymentStatus==='Payé'?amount:0,mode=payMode(l.contribution);count++;total+=amount;paid+=enc;const x=modes.get(mode)||{count:0,total:0,paid:0};x.count++;x.total+=amount;x.paid+=enc;modes.set(mode,x)}
 }else{
  const products=productMap(data);
  for(const o of data.orders||[]){const p=products.get(o.productId),amount=money(p?.price)*Math.max(1,Number(o.quantity||1)),enc=o.paid?amount:0,mode=payMode(o.paymentMethod);count++;total+=amount;paid+=enc;const x=modes.get(mode)||{count:0,total:0,paid:0};x.count++;x.total+=amount;x.paid+=enc;modes.set(mode,x)}
 }
 return{count,total,paid,pending:total-paid,modes:[...modes.entries()].sort((a,b)=>a[0].localeCompare(b[0],'fr'))};
}
function buildSummarySheet(wb,kind,data){
 const ws=wb.addWorksheet('Synthèse financière',{views:[{showGridLines:false}]});const title=kind==='licenses'?'SYNTHÈSE FINANCIÈRE — LICENCES':'SYNTHÈSE FINANCIÈRE — COMMANDES';
 styleTitle(ws,title,5);
 const s=buildSummaryRows(kind,data);
 ws.getCell('A4').value='SITUATION GÉNÉRALE';setFont(ws.getCell('A4'),{header:true,size:12});
 const indicators=[['Nombre de transactions',s.count],['Total des transactions',s.total],['Total encaissé',s.paid],['Reste à encaisser',s.pending]];
 indicators.forEach((x,i)=>{const r=5+i;ws.getCell(r,1).value=x[0];setFont(ws.getCell(r,1),{header:true});ws.getCell(r,2).value=x[1];setFont(ws.getCell(r,2),{header:true});if(i>0)addMoneyFormat(ws.getCell(r,2));if(i===2)fill(ws.getCell(r,2),'FFEAF8EF');if(i===3&&s.pending>0)fill(ws.getCell(r,2),'FFFFF0F2')});
 ws.getCell('A11').value='RÉPARTITION PAR MODE DE RÈGLEMENT';setFont(ws.getCell('A11'),{header:true,size:12});
 const headers=['Mode de règlement','Transactions','Montant total','Encaissé','Reste'];styleHeaderRow(ws,12,headers);
 s.modes.forEach(([mode,x],i)=>{const r=13+i;styleDataRow(ws,r,[mode,x.count,x.total,x.paid,x.total-x.paid]);[3,4,5].forEach(c=>addMoneyFormat(ws.getCell(r,c)))});
 const tr=13+s.modes.length;styleDataRow(ws,tr,['TOTAL GÉNÉRAL',s.count,s.total,s.paid,s.pending]);for(let c=1;c<=5;c++){setFont(ws.getCell(tr,c),{header:true});fill(ws.getCell(tr,c),'FFEAF3FF')}[3,4,5].forEach(c=>addMoneyFormat(ws.getCell(tr,c)));
 ws.getCell(tr+3,1).value=`Document généré le ${new Date().toLocaleString('fr-FR')}`;setFont(ws.getCell(tr+3,1),{size:9});ws.getCell(tr+3,1).font={...ws.getCell(tr+3,1).font,italic:true,color:{argb:'FF6B7890'}};
 ws.getColumn(1).width=34;ws.getColumn(2).width=18;ws.getColumn(3).width=19;ws.getColumn(4).width=19;ws.getColumn(5).width=19;
 ws.pageSetup={orientation:'portrait',fitToPage:true,fitToWidth:1,fitToHeight:0,margins:{left:.35,right:.35,top:.5,bottom:.5,header:.2,footer:.2}};
 return ws;
}
function buildDetailSheet(wb,kind,data){
 const ws=wb.addWorksheet('Détail',{views:[{state:'frozen',ySplit:4,showGridLines:false}]});let headers,rows,moneyCols;
 if(kind==='licenses'){
  headers=['Nom & prénom','Classe','Catégorie','Spécialité','Mode de règlement','Statut','Montant','Encaissé','Reste','Charte'];
  rows=(data.licenses||[]).map(l=>{const a=money(l.amount),p=l.paymentStatus==='Payé'?a:0;return[l.fullName,l.className,l.category,l.sectionOption,payMode(l.contribution),l.paymentStatus,a,p,a-p,l.charterSigned]});
  moneyCols=[7,8,9];
 }else{
  const products=productMap(data);
  headers=['Élève','Classe','Produit','Taille','Quantité','Prix unitaire','Total','Mode de règlement','Statut paiement','Encaissé','Reste','Distribution','Date'];
  rows=(data.orders||[]).map(o=>{const p=products.get(o.productId),unit=money(p?.price),total=unit*Math.max(1,Number(o.quantity||1)),enc=o.paid?total:0;return[o.studentName,o.className,p?.name||'Produit supprimé',o.size,Number(o.quantity||1),unit,total,payMode(o.paymentMethod),o.paid?'Payé':'En attente',enc,total-enc,o.distributed?'Distribué':'À distribuer',dateFr(o.createdAt)]});
  moneyCols=[6,7,10,11];
 }
 styleTitle(ws,kind==='licenses'?'DÉTAIL DES LICENCES':'DÉTAIL DES COMMANDES',headers.length);styleHeaderRow(ws,4,headers);
 rows.forEach((row,i)=>{const r=5+i;styleDataRow(ws,r,row);moneyCols.forEach(c=>addMoneyFormat(ws.getCell(r,c)))});
 const totalRow=5+rows.length;styleDataRow(ws,totalRow,Array(headers.length).fill(''));ws.getCell(totalRow,1).value='TOTAL GÉNÉRAL';setFont(ws.getCell(totalRow,1),{header:true});
 const sumCols=kind==='licenses'?[7,8,9]:[7,10,11];sumCols.forEach(c=>{const cell=ws.getCell(totalRow,c);cell.value=rows.length?{formula:`SUM(${ws.getCell(5,c).address}:${ws.getCell(totalRow-1,c).address})`}:0;setFont(cell,{header:true});fill(cell,'FFEAF3FF');addMoneyFormat(cell)});
 for(let c=1;c<=headers.length;c++){if(c!==1&&!sumCols.includes(c))fill(ws.getCell(totalRow,c),'FFEAF3FF')}
 autosize(ws,headers,kind==='licenses'?{1:30,2:28,4:30,5:23}:{1:28,2:28,3:27,8:23,12:18,13:15});
 ws.autoFilter={from:{row:4,column:1},to:{row:4,column:headers.length}};ws.pageSetup={orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0,margins:{left:.25,right:.25,top:.45,bottom:.45,header:.2,footer:.2}};
 return ws;
}
function genericDefinition(kind,data){
 const studentName=id=>{const s=(data.students||[]).find(x=>x.id===id);return s?.fullName||''};
 const roleSpecialty=window.app?.roleSpecialty?.();
 const currentTerm=Number(document.querySelector('.v19-term-tabs button.active')?.textContent?.match(/\d+/)?.[0]||1);
 const currentApp=id=>(data.appreciations||[]).find(a=>a.studentId===id&&Number(a.term||1)===currentTerm);
 if(kind==='reports')return{title:'BILANS AS',headers:['Date','Activité','Enseignant(s)','Niveau','Lieu','Catégorie','Nombre d’élèves','Commentaire'],rows:(data.reports||[]).map(r=>[dateFr(r.date),r.activity,r.teacher,r.level,r.place,r.category,Number(r.participants||0),r.comment])};
 if(kind==='convocations')return{title:'CONVOCATIONS',headers:['Date','Titre','Activité','Spécialité','Catégorie','Lieu','Départ','Retour','Rendez-vous','Professeur','Informations','Élèves'],rows:(data.convocations||[]).map(c=>[dateFr(c.date),c.title,c.activity,c.specialty,c.ageCategory,c.place,c.departure,c.returnTime,c.meetingPoint,c.teacher,c.extraInfo,(c.studentIds||[]).map(studentName).join(' · ')])};
 if(kind==='appreciations')return{title:'APPRÉCIATIONS',headers:['Élève','Classe','Spécialité','Trimestre','Appréciation','Statut'],rows:(data.licenses||[]).filter(l=>!roleSpecialty||l.sectionOption===roleSpecialty).map(l=>{const a=currentApp(l.studentId);return[l.fullName,l.className,l.sectionOption,currentTerm,a?.text||'',a?.status||'À faire']})};
 return null;
}
async function exportExcel(kind){
 await ensureExcel();
 const data=window.app?.readData?.()||JSON.parse(localStorage.getItem(STORE)||'{}');
 const wb=new ExcelJS.Workbook();wb.creator='Association Sportive du Bon Sauveur';wb.company='Bon Sauveur Saint-Lô';wb.created=new Date();wb.modified=new Date();wb.calcProperties.fullCalcOnLoad=true;
 if(kind==='licenses'||kind==='orders'){
  buildSummarySheet(wb,kind,data);buildDetailSheet(wb,kind,data);
 }else{
  const def=genericDefinition(kind,data);if(!def)return;
  const ws=wb.addWorksheet('Données',{views:[{state:'frozen',ySplit:4,showGridLines:false}]});styleTitle(ws,def.title,def.headers.length);styleHeaderRow(ws,4,def.headers);def.rows.forEach((row,i)=>styleDataRow(ws,5+i,row));autosize(ws,def.headers);ws.autoFilter={from:{row:4,column:1},to:{row:4,column:def.headers.length}};
 }
 const name=kind==='licenses'?'Licences_Comptabilite_AS_Bon_Sauveur.xlsx':kind==='orders'?'Commandes_Comptabilite_AS_Bon_Sauveur.xlsx':`${String(kind).replace(/[^a-z0-9]+/gi,'_')}_AS_Bon_Sauveur.xlsx`;
 const buf=await wb.xlsx.writeBuffer();downloadBlob(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),name);
}
async function downloadLicenseTemplate(){
 await ensureExcel();
 const wb=new ExcelJS.Workbook(),ws=wb.addWorksheet('Import',{views:[{showGridLines:false}]});
 styleTitle(ws,'IMPORT LICENCIÉS — AS BON SAUVEUR',3);styleHeaderRow(ws,4,['Nom & prénom','Classe','Catégorie']);
 styleDataRow(ws,5,['MARTIN Léo','5e Jacqueline AURIOL','Benjamin']);ws.getColumn(1).width=32;ws.getColumn(2).width=32;ws.getColumn(3).width=22;
 const cats=['Benjamin','Benjamine','Minime fille','Minime garçon','Lycéen','Lycéenne'];for(let r=5;r<=200;r++)ws.getCell(r,3).dataValidation={type:'list',allowBlank:true,formulae:[`"${cats.join(',')}"`]};
 const help=wb.addWorksheet('Aide',{views:[{showGridLines:false}]});help.getCell('A1').value='CATÉGORIES AUTORISÉES';setFont(help.getCell('A1'),{header:true});cats.forEach((x,i)=>{help.getCell(i+2,1).value=x;setFont(help.getCell(i+2,1))});help.getColumn(1).width=28;
 const buf=await wb.xlsx.writeBuffer();downloadBlob(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),'Modele_Import_Licencies_AS.xlsx');
}
function install(){
 if(!window.app)return setTimeout(install,80);
 window.app.exportExcel=exportExcel;
 window.app.downloadLicenseTemplate=downloadLicenseTemplate;
 installUiCleanup();
 window.ASV218={version:VERSION,exportExcel};
}
install();
})();
