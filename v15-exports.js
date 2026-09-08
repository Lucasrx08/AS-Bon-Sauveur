(()=>{
'use strict';
const V=window.ASV7,app=window.app;if(!V||!app)return;
const P={blue:[43,73,166],royal:[21,82,185],yellow:[255,214,28],ink:[36,36,36],muted:[93,105,128],line:[220,226,236],white:[255,255,255],paper:[255,255,253],purple:[108,63,182],pale:[247,249,252],paleBlue:[239,246,255],paleYellow:[255,250,222]};
const safe=v=>String(v??'');
const accent=s=>s==='Section Football'?P.royal:(s==='Option Escalade'||s==='Sport-études Gymnastique')?P.purple:P.yellow;
function font(doc,size=10,style='normal',color=P.ink){doc.setFont('helvetica',style);doc.setFontSize(size);doc.setTextColor(...color)}
function tx(doc,t,x,y,size=10,style='normal',color=P.ink,opts={}){font(doc,size,style,color);doc.text(Array.isArray(t)?t:safe(t),x,y,opts)}
function wrap(doc,t,w,size=10,max=2,style='normal'){font(doc,size,style);return doc.splitTextToSize(safe(t),w).slice(0,max)}
function round(doc,x,y,w,h,fill=P.white,stroke=P.line,r=5){doc.setFillColor(...fill);doc.setDrawColor(...stroke);doc.setLineWidth(.6);doc.roundedRect(x,y,w,h,r,r,'FD')}
function brush(doc,x,y,w,color,thick=2){doc.setDrawColor(...color);doc.setLineCap('round');const ys=[0,2,-1.5,3.2,-2.5];ys.forEach((dy,i)=>{doc.setLineWidth(Math.max(.6,thick-i*.28));doc.line(x+(i%2?3:0),y+dy,x+w-i*3,y+dy+(i%2?.7:-.5))});doc.setLineCap('butt')}
async function logoData(){try{return await V.logoData()}catch{return null}}
function template(doc,W,H,title,logo){
 doc.setFillColor(...P.paper);doc.rect(0,0,W,H,'F');
 // Arcs inspirés exactement des deux gabarits Canva transmis
 const cx=W*.50;
 [[P.blue,20,W*.36,47],[P.white,11,W*.30,42],[P.yellow,18,W*.26,37],[P.white,10,W*.21,31],[P.blue,17,W*.17,27]].forEach(([c,lw,rx,ry],i)=>{doc.setDrawColor(...c);doc.setLineWidth(lw);doc.ellipse(cx+(i%2?W*.03:-W*.025),-18+i*1.5,rx,ry,'S')});
 [[P.blue,20,W*.37,49],[P.white,11,W*.31,43],[P.yellow,18,W*.27,38],[P.white,10,W*.22,32],[P.blue,17,W*.18,27]].forEach(([c,lw,rx,ry],i)=>{doc.setDrawColor(...c);doc.setLineWidth(lw);doc.ellipse(cx+(i%2?-W*.03:W*.025),H+19-i*1.4,rx,ry,'S')});
 if(logo)try{doc.addImage(logo,'PNG',W-52,8,39,39)}catch{}
 font(doc,42,'bold',P.ink);if(doc.setCharSpace)doc.setCharSpace(-1.5);doc.text(title.toUpperCase(),14,38);if(doc.setCharSpace)doc.setCharSpace(0);
 tx(doc,'ASSOCIATION SPORTIVE BON SAUVEUR',15,48,9.3,'bold',P.ink);
 doc.setDrawColor(...P.yellow);doc.setLineWidth(2.1);doc.line(15,53,111,53);
}
function monthLabel(events){if(!events.length)return'';const a=new Date(events[0].date+'T12:00:00');const b=new Date(events[events.length-1].date+'T12:00:00');const ma=a.toLocaleDateString('fr-FR',{month:'long',year:'numeric'}).toUpperCase();const mb=b.toLocaleDateString('fr-FR',{month:'long',year:'numeric'}).toUpperCase();return ma===mb?ma:`${ma} - ${mb}`}
function pill(doc,label,x,y,w,color,light=false){doc.setFillColor(...(light?P.paleBlue:color));doc.roundedRect(x,y,w,8,4,4,'F');tx(doc,label,x+w/2,y+5.4,6.3,'bold',light?color:P.white,{align:'center'})}
function clock(doc,x,y,c){doc.setDrawColor(...c);doc.setLineWidth(1.3);doc.circle(x,y,3,'S');doc.line(x,y,x,y-1.6);doc.line(x,y,x+1.5,y+.7)}
function pin(doc,x,y,c){doc.setDrawColor(...c);doc.setLineWidth(1.2);doc.circle(x,y-1,2.1,'S');doc.line(x-1.2,y+.5,x,y+3);doc.line(x+1.2,y+.5,x,y+3);doc.circle(x,y-1,.45,'F')}
function people(doc,x,y,c){doc.setFillColor(...c);doc.circle(x-1.7,y-1,1,'F');doc.circle(x+1.7,y-1,1,'F');doc.roundedRect(x-3.3,y+.2,3,2.2,.9,.9,'F');doc.roundedRect(x+.3,y+.2,3,2.2,.9,.9,'F')}
function eventCard(doc,e,x,y,w,h,conv){
 const a=accent(e.specialty),d=new Date(e.date+'T12:00:00'),day=String(d.getDate()).padStart(2,'0'),mon=d.toLocaleDateString('fr-FR',{month:'short'}).replace('.','').toUpperCase();
 round(doc,x,y,w,h,P.white,P.line,5.5);
 // date type coup de pinceau, comme le gabarit
 doc.setFillColor(...a);doc.roundedRect(x+6,y+7,30,31,3.5,3.5,'F');brush(doc,x+31,y+9,11,a,2.2);
 tx(doc,day,x+21,y+22,18,'bold',a===P.yellow?P.ink:P.white,{align:'center'});tx(doc,mon,x+21,y+31,6.7,'bold',a===P.yellow?P.ink:P.white,{align:'center'});
 const cx=x+44;tx(doc,wrap(doc,e.title,w-54,12.2,2,'bold'),cx,y+16,12.2,'bold',P.ink);
 const spec=e.specialty||'Association Sportive',pw=Math.min(55,Math.max(28,spec.length*1.75));pill(doc,spec,cx,y+31,pw,a,true);
 const iy=y+h-20;clock(doc,cx+2,iy,a);tx(doc,`${e.startTime||'—'} - ${e.endTime||'—'}`,cx+9,iy+2.4,7.4,'bold',P.ink);
 pin(doc,cx+2,iy+9,a);tx(doc,wrap(doc,e.place||'—',w*.32,6.8,1),cx+9,iy+11.4,6.8,'normal',P.ink);
 people(doc,x+w-43,iy+9,a);tx(doc,wrap(doc,e.ageCategory||'Toutes catégories',34,6.5,1),x+w-37,iy+11.4,6.5,'bold',P.ink);
 if(conv){doc.setFillColor(...P.purple);doc.roundedRect(x+w-40,y+7,34,9,1.5,1.5,'F');tx(doc,'CONVOCATION',x+w-23,y+13.2,6.6,'bold',P.white,{align:'center'})}
}
app.exportCalendarPDF=async()=>{
 const {jsPDF}=window.jspdf||{};if(!jsPDF)return alert('Export PDF indisponible.');const d=V.read(),sp=V.edu();const events=(d.events||[]).filter(e=>!sp||e.specialty===sp).sort((a,b)=>(a.date+(a.startTime||'')).localeCompare(b.date+(b.startTime||'')));if(!events.length)return alert('Aucun événement à exporter.');
 const logo=await logoData(),per=5,pages=Math.ceil(events.length/per),doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a3',compress:true});
 for(let p=0;p<pages;p++){
  if(p)doc.addPage('a3','portrait');const ch=events.slice(p*per,p*per+per);template(doc,297,420,'PROGRAMME',logo);
  tx(doc,'CALENDRIER AS',15,69,16,'bold',P.blue);tx(doc,monthLabel(ch),15,79,9.5,'bold',P.muted);brush(doc,15,83,78,P.yellow,2.4);
  const conv=e=>(d.convocations||[]).some(c=>c.id===e.convocationId||(c.date===e.date&&c.specialty===e.specialty&&(!e.title||c.title===e.title)));
  if(ch.length===1){eventCard(doc,ch[0],15,102,267,160,conv(ch[0]))}
  else if(ch.length===2){eventCard(doc,ch[0],15,102,267,105,conv(ch[0]));eventCard(doc,ch[1],15,216,267,105,conv(ch[1]))}
  else{
   const w=130,h=92,g=7;ch.slice(0,4).forEach((e,i)=>eventCard(doc,e,15+(i%2)*(w+g),102+Math.floor(i/2)*(h+8),w,h,conv(e)));
   if(ch[4])eventCard(doc,ch[4],15,302,267,72,conv(ch[4]));
  }
  tx(doc,'Bon Sauveur - Saint-Lô',148.5,397,8,'bold',P.blue,{align:'center'});tx(doc,`${p+1}/${pages}`,280,397,7,'bold',P.muted,{align:'right'});
 }
 doc.save(sp?`Programme_${V.clean(sp)}.pdf`:'Programme_AS_Bon_Sauveur.pdf');
};
function infoBox(doc,label,value,x,y,w,iconType,c=P.blue){round(doc,x,y,w,30,P.pale,P.line,4.5);if(iconType==='clock')clock(doc,x+9,y+10,c);else if(iconType==='people')people(doc,x+9,y+10,c);else pin(doc,x+9,y+10,c);tx(doc,label.toUpperCase(),x+16,y+8,5.8,'bold',c);tx(doc,wrap(doc,value,w-20,10,2,'bold'),x+16,y+18,10,'bold',P.ink)}
function studentBox(doc,names,x,y,w,h){round(doc,x,y,w,h,P.pale,P.line,5);people(doc,x+10,y+11,P.blue);tx(doc,'ÉLÈVES CONVOQUÉS',x+18,y+9,6.2,'bold',P.blue);let cx=x+18,cy=y+17;names.slice(0,18).forEach(n=>{const ww=Math.max(35,Math.min(65,13+n.length*1.9));if(cx+ww>x+w-6){cx=x+18;cy+=10}doc.setFillColor(...P.paleBlue);doc.roundedRect(cx,cy,ww,8,4,4,'F');tx(doc,n,cx+ww/2,cy+5.5,7,'bold',P.ink,{align:'center'});cx+=ww+5})}
app.exportConvocation=async id=>{
 const {jsPDF}=window.jspdf||{};if(!jsPDF)return alert('Export PDF indisponible.');const d=V.read(),c=(d.convocations||[]).find(x=>x.id===id);if(!c)return alert('Convocation introuvable.');const names=(c.studentIds||[]).map(x=>V.studentName(d,x)).filter(Boolean),logo=await logoData(),a=accent(c.specialty),doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a3',compress:true});
 template(doc,420,297,'CONVOCATION',logo);
 tx(doc,wrap(doc,c.title||c.activity,268,27,2,'bold'),14,82,27,'bold',P.blue);brush(doc,14,91,118,P.yellow,2.8);
 pill(doc,c.activity||'Activité',14,99,52,P.blue,true);pill(doc,c.specialty||'Association Sportive',71,99,68,a,a===P.yellow);pill(doc,c.ageCategory||'Toutes catégories',144,99,52,P.blue,true);
 const dt=new Date(c.date+'T12:00:00'),day=String(dt.getDate()).padStart(2,'0'),wd=dt.toLocaleDateString('fr-FR',{weekday:'long'}),month=dt.toLocaleDateString('fr-FR',{month:'long',year:'numeric'});
 doc.setFillColor(...P.blue);doc.roundedRect(14,116,120,61,2,2,'F');tx(doc,day,31,153,38,'bold',P.yellow);tx(doc,wd.charAt(0).toUpperCase()+wd.slice(1),57,137,16,'bold',P.white);tx(doc,`${day} ${month}`,57,152,13,'bold',P.white);doc.setDrawColor(...P.yellow);doc.setLineWidth(2);doc.line(57,159,119,159);
 // grande respiration graphique à droite de la date
 doc.setDrawColor(...a);doc.setLineWidth(3);doc.line(141,120,397,120);brush(doc,310,130,75,P.yellow,2.5);tx(doc,(c.specialty||'Association Sportive').toUpperCase(),145,136,8,'bold',a);tx(doc,wrap(doc,c.title||c.activity,232,20,2,'bold'),145,154,20,'bold',P.ink);
 infoBox(doc,'Lieu',c.place||'—',14,187,92,'pin',a);infoBox(doc,'Départ',c.departure||'—',111,187,78,'clock',a);infoBox(doc,'Retour',c.returnTime||'—',194,187,78,'clock',a);infoBox(doc,'Point de rendez-vous',c.meetingPoint||'—',277,187,128,'people',a);
 infoBox(doc,'Professeur référent',c.teacher||'À renseigner',14,224,105,'people',a);
 round(doc,124,224,144,30,P.paleYellow,[255,228,122],4.5);tx(doc,'INFORMATIONS IMPORTANTES',133,233,6,'bold',P.blue);brush(doc,132,236,55,P.yellow,1.8);tx(doc,wrap(doc,c.extraInfo||'Aucune information particulière.',126,10,2,'bold'),133,246,10,'bold',P.ink);
 studentBox(doc,names,273,224,132,30);
 tx(doc,'Bon Sauveur - Saint-Lô',210,274,8,'bold',P.blue,{align:'center'});tx(doc,'1/1',401,274,7,'bold',P.muted,{align:'right'});
 doc.save(`Convocation_${V.clean(c.title||c.activity||'AS')}_${c.date||''}.pdf`);
};
window.ASV15={version:'v15-20260908-templates'};
})();