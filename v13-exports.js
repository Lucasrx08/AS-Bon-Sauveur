(()=>{
'use strict';
const V=window.ASV7,app=window.app;if(!V||!app)return;
const C={blue:[19,99,214],blue2:[51,133,232],yellow:[255,211,35],ink:[24,45,89],muted:[100,121,157],line:[216,229,244],paper:[252,254,255],white:[255,255,255],purple:[126,73,211],gold:[224,176,14],paleBlue:[237,247,255],palePurple:[247,240,255],paleYellow:[255,249,219]};
const accent=s=>s==='Section Football'?C.blue2:s==='Option Escalade'?C.purple:s==='Sport-études Gymnastique'?C.purple:C.gold;
const pale=s=>s==='Section Football'?C.paleBlue:(s==='Option Escalade'||s==='Sport-études Gymnastique')?C.palePurple:C.paleYellow;
const safe=v=>String(v??'');
function font(doc,size=10,style='normal',color=C.ink){doc.setFont('helvetica',style);doc.setFontSize(size);doc.setTextColor(...color)}
function tx(doc,t,x,y,size=10,style='normal',color=C.ink,opts={}){font(doc,size,style,color);doc.text(Array.isArray(t)?t:safe(t),x,y,opts)}
function wrap(doc,t,w,size=10,max=2,style='normal'){font(doc,size,style);return doc.splitTextToSize(safe(t),w).slice(0,max)}
function line(doc,x1,y1,x2,y2,color=C.line,width=.6){doc.setDrawColor(...color);doc.setLineWidth(width);doc.line(x1,y1,x2,y2)}
function round(doc,x,y,w,h,fill=C.white,stroke=C.line,r=5){doc.setFillColor(...fill);doc.setDrawColor(...stroke);doc.roundedRect(x,y,w,h,r,r,'FD')}
function brush(doc,x,y,w,color,thick=2.8,dir=1){doc.setDrawColor(...color);doc.setLineCap('round');[[0,0],[2.2,5],[-1.7,2],[3.6,9],[-3,4]].forEach(([dy,cut],i)=>{doc.setLineWidth(Math.max(.65,thick-i*.34));doc.line(x+cut,y+dy,x+w-i*3,y+dy+dir*(i%2?1:-.7))});doc.setLineCap('butt')}
function dots(doc,x,y,color,cols=6,rows=3,step=3.8){doc.setFillColor(...color);for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)doc.circle(x+c*step,y+r*step,.34+(c%2)*.08,'F')}
function chip(doc,label,x,y,w,color,fill){doc.setFillColor(...(fill||color));doc.roundedRect(x,y,w,7.6,3.8,3.8,'F');tx(doc,label,x+w/2,y+5.2,6.2,'bold',fill?color:C.white,{align:'center'})}
async function logo(){try{return await V.logoData()}catch{return null}}
function iconClock(doc,x,y,color){doc.setDrawColor(...color);doc.setLineWidth(1.25);doc.circle(x,y,2.9,'S');doc.line(x,y,x,y-1.55);doc.line(x,y,x+1.4,y+.8)}
function iconPin(doc,x,y,color){doc.setDrawColor(...color);doc.setLineWidth(1.1);doc.circle(x,y-1,2,'S');doc.line(x-1.25,y+.3,x,y+2.7);doc.line(x+1.25,y+.3,x,y+2.7);doc.circle(x,y-1,.45,'F')}
function iconPeople(doc,x,y,color){doc.setFillColor(...color);doc.circle(x-1.5,y-1.1,1,'F');doc.circle(x+1.5,y-1.1,1,'F');doc.roundedRect(x-3,y+.2,2.8,2.2,.9,.9,'F');doc.roundedRect(x+.2,y+.2,2.8,2.2,.9,.9,'F')}
function header(doc,lg,title,sub,right=''){
 doc.setFillColor(...C.paper);doc.rect(0,0,297,210,'F');
 dots(doc,5,4,[204,228,250],8,3,3.4);dots(doc,273,4,[204,228,250],6,3,3.4);
 brush(doc,7,10,58,C.yellow,3.3,1);brush(doc,228,11,59,C.blue2,3.1,-1);brush(doc,224,23,54,C.yellow,2.1,1);
 if(lg)try{doc.addImage(lg,'PNG',10,7,29,29)}catch{}
 tx(doc,title.toUpperCase(),49,20,23,'bolditalic',C.blue);brush(doc,48,26,91,C.yellow,3.2,1);tx(doc,sub,54,30,9,'bolditalic',C.ink);
 if(right){doc.setFillColor(...C.paleBlue);doc.roundedRect(213,31,72,9,4.5,4.5,'F');tx(doc,right,249,37,7,'bold',C.blue,{align:'center'})}
}
function footer(doc,page,total){line(doc,12,194,285,194,C.line,.6);brush(doc,0,202,82,C.blue2,2.4,1);brush(doc,12,206,96,C.yellow,2.2,-1);brush(doc,220,203,77,C.blue2,2.4,-1);tx(doc,'ASSOCIATION SPORTIVE DU BON SAUVEUR',12,190,6.2,'bold',C.blue);tx(doc,'Saint-Lô',112,203,12.6,'bolditalic',C.blue);tx(doc,`${page}/${total}`,285,190,6.1,'bold',C.muted,{align:'right'})}
function dateRange(events){if(!events.length)return'';const a=V.fmtShort(events[0].date),b=V.fmtShort(events[events.length-1].date);return a===b?a:`${a} → ${b}`}
function decoMark(doc,s,x,y,w,a){doc.setDrawColor(...a);doc.setLineWidth(1.8);if(s==='Section Football'){doc.circle(x+w-7,y+5,3.3,'S');brush(doc,x+w-30,y+11,23,a,1.2,-1)}else if(s==='Option Escalade'){doc.line(x+w-14,y+1,x+w-8,y+11);doc.line(x+w-8,y+11,x+w-3,y+3)}else if(s==='Sport-études Gymnastique'){doc.circle(x+w-9,y+3,1.1,'F');doc.line(x+w-9,y+4,x+w-15,y+10);doc.line(x+w-15,y+10,x+w-5,y+12)}else{doc.circle(x+w-8,y+5,2.2,'S');doc.line(x+w-14,y+11,x+w-4,y+1)}}
function eventCard(doc,e,x,y,w,h,hasConv,wide=false){
 const a=accent(e.specialty),p=pale(e.specialty),d=new Date(e.date+'T12:00:00'),day=String(d.getDate()).padStart(2,'0'),mon=d.toLocaleDateString('fr-FR',{month:'short'}).replace('.','').toUpperCase();
 round(doc,x,y,w,h,C.white,C.line,5.8);doc.setFillColor(...a);doc.roundedRect(x,y,4,h,2,2,'F');
 doc.setFillColor(...a);doc.roundedRect(x+8,y+8,25,28,6,6,'F');tx(doc,day,x+20.5,y+21,16.5,'bold',C.white,{align:'center'});tx(doc,mon,x+20.5,y+29.5,6,'bold',C.white,{align:'center'});
 const cx=x+39,cw=w-48;decoMark(doc,e.specialty,x+w*.67,y+5,w*.28,a);
 const titleSize=wide?11.4:9.6;tx(doc,wrap(doc,e.title,cw-(wide?34:20),titleSize,2,'bold'),cx,y+14,titleSize,'bold',C.ink);
 const spec=safe(e.specialty||'Association Sportive'),chipW=Math.min(wide?49:42,Math.max(24,spec.length*1.55));chip(doc,spec,cx,y+27,chipW,a,p);
 const infoY=y+h-21;iconClock(doc,cx+2,infoY,a);tx(doc,`${e.startTime||'—'} → ${e.endTime||'—'}`,cx+8,infoY+2.5,7.1,'bold',C.ink);
 iconPin(doc,cx+2,infoY+9,a);tx(doc,wrap(doc,e.place||'—',wide?56:33,6.4,1),cx+8,infoY+11.3,6.4,'normal',C.ink);
 iconPeople(doc,x+w-(wide?48:37),infoY+9,a);tx(doc,wrap(doc,e.ageCategory||'Toutes catégories',wide?39:29,6.1,1),x+w-(wide?42:31),infoY+11.3,6.1,'bold',C.ink);
 if(hasConv)chip(doc,'CONVOCATION',x+w-31,y+7,26,C.blue2,C.paleBlue)
}
app.exportCalendarPDF=async()=>{
 const {jsPDF}=window.jspdf||{};if(!jsPDF)return alert('Export PDF indisponible.');
 const d=V.read(),sp=V.edu();const events=(d.events||[]).filter(e=>!sp||e.specialty===sp).sort((a,b)=>(a.date+(a.startTime||'')).localeCompare(b.date+(b.startTime||'')));if(!events.length)return alert('Aucun événement à exporter.');
 const lg=await logo(),per=5,pages=Math.ceil(events.length/per),doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4',compress:true});
 for(let p=0;p<pages;p++){
  if(p)doc.addPage('a4','landscape');const ch=events.slice(p*per,p*per+per);header(doc,lg,'Calendrier AS','Rendez-vous à venir',dateRange(ch));
  const top=49,g=6;
  if(ch.length<=2){const w=(273-g)/2;ch.forEach((e,i)=>eventCard(doc,e,12+i*(w+g),top,w,126,(d.convocations||[]).some(c=>c.id===e.convocationId),true))}
  else{
   const w3=(273-2*g)/3,h1=60;ch.slice(0,3).forEach((e,i)=>eventCard(doc,e,12+i*(w3+g),top,w3,h1,(d.convocations||[]).some(c=>c.id===e.convocationId),false));
   const rest=ch.slice(3),y2=top+h1+g,w2=(273-g)/2;rest.forEach((e,i)=>eventCard(doc,e,12+i*(w2+g),y2,w2,68,(d.convocations||[]).some(c=>c.id===e.convocationId),true));
  }
  footer(doc,p+1,pages)
 }
 doc.save(sp?`Calendrier_${V.clean(sp)}.pdf`:'Calendrier_AS_Bon_Sauveur.pdf')
};
function infoBox(doc,label,value,x,y,w,icon='pin',a=C.blue){round(doc,x,y,w,22,C.white,C.line,4.5);if(icon==='clock')iconClock(doc,x+7,y+8,a);else if(icon==='people')iconPeople(doc,x+7,y+8,a);else iconPin(doc,x+7,y+8,a);tx(doc,label.toUpperCase(),x+13,y+7,5.3,'bold',C.blue);tx(doc,wrap(doc,value,w-17,8.3,2,'bold'),x+13,y+14,8.3,'bold',C.ink)}
function dateHero(doc,c,x,y,a){const d=new Date(c.date+'T12:00:00'),wd=d.toLocaleDateString('fr-FR',{weekday:'long'}).toUpperCase(),day=String(d.getDate()).padStart(2,'0'),mo=d.toLocaleDateString('fr-FR',{month:'long'}).toUpperCase();doc.setFillColor(...a);doc.roundedRect(x,y,49,42,8,8,'F');tx(doc,wd,x+24.5,y+8,6.1,'bold',C.white,{align:'center'});tx(doc,day,x+24.5,y+25,24,'bolditalic',C.white,{align:'center'});tx(doc,mo,x+24.5,y+34,6.4,'bold',C.white,{align:'center'});tx(doc,String(d.getFullYear()),x+24.5,y+39,5.4,'bold',C.white,{align:'center'})}
function students(doc,names,x,y,w){round(doc,x,y,w,29,C.white,C.line,5);iconPeople(doc,x+8,y+9,C.blue);tx(doc,'ÉLÈVES CONVOQUÉS',x+15,y+8,6.4,'bold',C.blue);let cx=x+15,cy=y+14;names.slice(0,18).forEach(n=>{const ww=Math.max(29,Math.min(50,10+n.length*1.55));if(cx+ww>x+w-5){cx=x+15;cy+=8}doc.setFillColor(...C.paleBlue);doc.roundedRect(cx,cy,ww,6.8,3.4,3.4,'F');tx(doc,n,cx+ww/2,cy+4.6,6.2,'bold',C.ink,{align:'center'});cx+=ww+4})}
app.exportConvocation=async id=>{
 const {jsPDF}=window.jspdf||{};if(!jsPDF)return alert('Export PDF indisponible.');const d=V.read(),c=(d.convocations||[]).find(x=>x.id===id);if(!c)return alert('Convocation introuvable.');
 const names=(c.studentIds||[]).map(x=>V.studentName(d,x)).filter(Boolean),lg=await logo(),a=accent(c.specialty),pages=1+Math.max(0,Math.ceil((names.length-18)/32)),doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4',compress:true});
 header(doc,lg,'Convocation',c.specialty||'Association Sportive',V.fmtShort(c.date));
 dateHero(doc,c,12,53,a);
 round(doc,67,53,218,42,C.paleBlue,C.line,6);brush(doc,72,58,88,C.yellow,2.3,1);tx(doc,(c.activity||'ACTIVITÉ').toUpperCase(),73,63,6.2,'bold',C.blue);tx(doc,wrap(doc,c.title||c.activity,143,18,2,'bolditalic'),73,76,18,'bolditalic',C.blue);chip(doc,c.specialty||'Association Sportive',73,83,52,a,pale(c.specialty));chip(doc,c.ageCategory||'Toutes catégories',130,83,42,C.blue2,C.paleBlue);decoMark(doc,c.specialty,236,57,39,a);
 infoBox(doc,'Lieu',c.place||'—',12,104,62,'pin',a);infoBox(doc,'Départ',c.departure||'—',79,104,47,'clock',a);infoBox(doc,'Retour',c.returnTime||'—',131,104,47,'clock',a);infoBox(doc,'Point de rendez-vous',c.meetingPoint||'—',183,104,102,'people',a);
 infoBox(doc,'Professeur référent',c.teacher||'À renseigner',12,132,82,'people',a);round(doc,99,132,186,22,C.paleYellow,[255,224,114],4.5);brush(doc,104,137,52,C.yellow,2,1);tx(doc,'INFORMATIONS IMPORTANTES',105,140,5.6,'bold',C.blue);tx(doc,wrap(doc,c.extraInfo||'Aucune information particulière.',170,9.1,2,'bold'),105,148,9.1,'bold',C.ink);
 students(doc,names,12,161,273);footer(doc,1,pages);
 const rest=names.slice(18);for(let p=1;p<pages;p++){doc.addPage('a4','landscape');header(doc,lg,'Convocation',c.title||c.activity||'',V.fmtShort(c.date));tx(doc,'ÉLÈVES CONVOQUÉS — SUITE',18,55,11,'bolditalic',C.blue);brush(doc,17,60,90,C.yellow,2.4,1);students(doc,rest.slice((p-1)*32,p*32),18,70,261);footer(doc,p+1,pages)}
 doc.save(`Convocation_${V.clean(c.title||c.activity||'AS')}_${c.date||''}.pdf`)
};
})();