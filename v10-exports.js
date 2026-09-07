(()=>{
'use strict';
const V=window.ASV7,app=window.app;if(!V||!app)return;
const C={navy:[16,33,63],blue:[7,87,201],yellow:[255,210,26],ink:[19,33,58],muted:[102,117,141],light:[244,247,251],line:[220,229,240],white:[255,255,255],football:[37,130,233],escalade:[112,87,217],gym:[152,89,206],as:[213,174,0]};
const ac=s=>s==='Section Football'?C.football:s==='Option Escalade'?C.escalade:s==='Sport-études Gymnastique'?C.gym:C.as;
function safe(t=''){return String(t??'')}
function fit(doc,t,w,size=10,max=2){doc.setFontSize(size);return doc.splitTextToSize(safe(t),w).slice(0,max)}
function text(doc,t,x,y,size=10,style='normal',color=C.ink,opts={}){doc.setFont('helvetica',style);doc.setFontSize(size);doc.setTextColor(...color);doc.text(Array.isArray(t)?t:safe(t),x,y,opts)}
function box(doc,x,y,w,h,fill=C.white,stroke=C.line,r=4){doc.setFillColor(...fill);doc.setDrawColor(...stroke);doc.roundedRect(x,y,w,h,r,r,'FD')}
function pill(doc,t,x,y,w,color){doc.setFillColor(...color);doc.roundedRect(x,y,w,6,3,3,'F');text(doc,t,x+w/2,y+4.1,6.5,'bold',C.white,{align:'center'})}
async function logo(){try{return await V.logoData()}catch{return null}}
function header(doc,logoData,title,sub,right=''){
 doc.setFillColor(...C.navy);doc.rect(0,0,297,39,'F');doc.setFillColor(...C.yellow);doc.rect(0,39,297,3,'F');
 if(logoData)try{doc.addImage(logoData,'PNG',11,6,27,27)}catch{}
 text(doc,'ASSOCIATION SPORTIVE DU BON SAUVEUR',45,11,8,'bold',[190,204,226]);
 text(doc,title,45,26,24,'bold',C.white);text(doc,sub,45,34,9,'bold',C.yellow);
 if(right)text(doc,right,285,24,8,'bold',C.yellow,{align:'right'});
}
function footer(doc,page,total){doc.setDrawColor(...C.line);doc.line(12,201,285,201);text(doc,'BON SAUVEUR · SAINT-LÔ',12,206,6.5,'bold',C.muted);text(doc,`${page}/${total}`,285,206,6.5,'bold',C.muted,{align:'right'})}
function dateRange(events){if(!events.length)return'';const f=V.fmtShort(events[0].date),l=V.fmtShort(events[events.length-1].date);return f===l?f:`${f} → ${l}`}
function calendarCard(doc,e,x,y,w,h,hasConv){
 const a=ac(e.specialty),d=new Date(e.date+'T12:00:00'),day=String(d.getDate()).padStart(2,'0'),mon=d.toLocaleDateString('fr-FR',{month:'short'}).replace('.','').toUpperCase();
 box(doc,x,y,w,h,C.white,C.line,5);doc.setFillColor(...a);doc.roundedRect(x,y,5,h,2.5,2.5,'F');
 doc.setFillColor(...C.navy);doc.roundedRect(x+10,y+8,27,27,6,6,'F');text(doc,day,x+23.5,y+22,19,'bold',C.white,{align:'center'});text(doc,mon,x+23.5,y+29.5,6.3,'bold',C.yellow,{align:'center'});
 const lines=fit(doc,e.title,w-51,11.5,2);text(doc,lines,x+43,y+14,11.5,'bold',C.ink);const titleBottom=y+14+(lines.length-1)*5;
 const spec=safe(e.specialty||'');const pw=Math.min(52,Math.max(23,spec.length*2.25));doc.setFillColor(238,244,252);doc.roundedRect(x+43,titleBottom+5,pw,7,3.5,3.5,'F');text(doc,spec,x+46,titleBottom+10,6.6,'bold',a);
 text(doc,`${e.startTime||'—'}${e.endTime?'  →  '+e.endTime:''}`,x+10,y+h-13,8.2,'bold',C.ink);text(doc,safe(e.place||'—'),x+10,y+h-6,6.8,'normal',C.muted);text(doc,safe(e.ageCategory||'Toutes catégories'),x+w-8,y+h-6,6.5,'bold',C.muted,{align:'right'});
 if(hasConv)pill(doc,'CONVOCATION',x+w-36,y+7,30,C.blue);
}
app.exportCalendarPDF=async()=>{
 const {jsPDF}=window.jspdf||{};if(!jsPDF)return alert('Export PDF indisponible.');const d=V.read(),sp=V.edu();let events=(d.events||[]).filter(e=>!sp||e.specialty===sp).sort((a,b)=>(a.date+(a.startTime||'')).localeCompare(b.date+(b.startTime||'')));if(!events.length)return alert('Aucun événement à exporter.');
 const lg=await logo(),pages=Math.ceil(events.length/6),doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4',compress:true});
 for(let p=0;p<pages;p++){if(p)doc.addPage('a4','landscape');const ch=events.slice(p*6,p*6+6);doc.setFillColor(250,252,255);doc.rect(0,0,297,210,'F');header(doc,lg,'CALENDRIER AS',sp||'Association Sportive',dateRange(ch));text(doc,'LES PROCHAINS RENDEZ-VOUS',12,50,7,'bold',C.blue);
  ch.forEach((e,i)=>{const col=i%2,row=Math.floor(i/2),x=12+col*139,y=56+row*46,w=132,h=40,has=(d.convocations||[]).some(c=>c.id===e.convocationId||(c.date===e.date&&c.specialty===e.specialty&&c.title===e.title));calendarCard(doc,e,x,y,w,h,has)});footer(doc,p+1,pages)}
 doc.save(sp?`Calendrier_${V.clean(sp)}.pdf`:'Calendrier_AS_Bon_Sauveur.pdf');
};
function infoCard(doc,label,value,x,y,w,h=25,accent=null){box(doc,x,y,w,h,C.light,C.line,4);if(accent){doc.setFillColor(...accent);doc.roundedRect(x,y,4,h,2,2,'F')}text(doc,label.toUpperCase(),x+7,y+8,6.2,'bold',C.muted);const l=fit(doc,value,w-14,10,2);text(doc,l,x+7,y+17,10,'bold',C.ink)}
function studentsBlock(doc,names,x,y,w,h){box(doc,x,y,w,h,C.white,C.line,5);text(doc,'ÉLÈVES CONVOQUÉS',x+8,y+10,7,'bold',C.blue);text(doc,String(names.length),x+w-8,y+10,7,'bold',C.muted,{align:'right'});const cols=4,cw=(w-16)/cols;names.slice(0,16).forEach((n,i)=>{const c=i%cols,r=Math.floor(i/cols),xx=x+8+c*cw,yy=y+17+r*7.2;doc.setFillColor(...C.light);doc.roundedRect(xx,yy,cw-4,6,3,3,'F');text(doc,safe(n),xx+3,yy+4.2,6.4,'bold',C.ink)})}
app.exportConvocation=async id=>{
 const {jsPDF}=window.jspdf||{};if(!jsPDF)return alert('Export PDF indisponible.');const d=V.read(),c=(d.convocations||[]).find(x=>x.id===id);if(!c)return alert('Convocation introuvable.');const names=(c.studentIds||[]).map(x=>V.studentName(d,x)).filter(Boolean),lg=await logo(),a=ac(c.specialty),rest=names.slice(16),pages=1+Math.ceil(rest.length/32),doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4',compress:true});
 doc.setFillColor(250,252,255);doc.rect(0,0,297,210,'F');header(doc,lg,'CONVOCATION',c.specialty||'Association Sportive',V.fmtShort(c.date));
 box(doc,12,49,273,32,C.navy,C.navy,6);doc.setFillColor(...a);doc.roundedRect(12,49,6,32,3,3,'F');text(doc,(c.activity||'ACTIVITÉ').toUpperCase(),25,59,6.5,'bold',C.yellow);const tt=fit(doc,c.title||c.activity,195,18,2);text(doc,tt,25,72,18,'bold',C.white);pill(doc,c.ageCategory||'Toutes catégories',237,59,39,a);
 infoCard(doc,'Date',V.fmtLong(c.date),12,88,73,27);infoCard(doc,'Lieu',c.place||'—',90,88,54,27);infoCard(doc,'Départ',c.departure||'—',149,88,39,27);infoCard(doc,'Retour',c.returnTime||'—',193,88,39,27);infoCard(doc,'Professeur référent',c.teacher||'À renseigner',237,88,48,27);
 infoCard(doc,'Point de rendez-vous',c.meetingPoint||'—',12,121,91,25);infoCard(doc,'Informations importantes',c.extraInfo||'Aucune information particulière.',108,121,177,25,C.yellow);
 studentsBlock(doc,names,12,153,273,40);footer(doc,1,pages);
 for(let p=1;p<pages;p++){doc.addPage('a4','landscape');doc.setFillColor(250,252,255);doc.rect(0,0,297,210,'F');header(doc,lg,'CONVOCATION',c.title||c.activity||'',V.fmtShort(c.date));const chunk=rest.slice((p-1)*32,p*32);box(doc,12,52,273,139,C.white,C.line,6);text(doc,'ÉLÈVES CONVOQUÉS — SUITE',20,65,8,'bold',C.blue);const cols=4,cw=62;chunk.forEach((n,i)=>{const col=i%cols,row=Math.floor(i/cols),x=20+col*66,y=76+row*13;doc.setFillColor(...C.light);doc.roundedRect(x,y,cw,9,4,4,'F');text(doc,safe(n),x+4,y+6,7.4,'bold',C.ink)});footer(doc,p+1,pages)}
 doc.save(`Convocation_${V.clean(c.title||c.activity||'AS')}.pdf`);
};
})();
