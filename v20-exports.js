(() => {
'use strict';
if(!window.app)return;
const C={blue:'#2D4FAA',navy:'#2E2E2E',yellow:'#FFD61A',paper:'#FBFAF7',ink:'#2E2E2E',muted:'#667085',line:'#D9E2EE',white:'#FFFFFF'};
const SPEC={'Association Sportive':'#2D4FAA','Section Football':'#2D79D8','Option Escalade':'#7057D8','Sport-études Gymnastique':'#8B5CC7'};
const titleFont='Anton, Impact, Arial Narrow, sans-serif';
const bodyFont='Montserrat, Arial, sans-serif';
const VERSION='v21.8.1-20260909';

async function ensureDeps(){
 try{await document.fonts?.ready;await Promise.all([document.fonts?.load('48px Anton'),document.fonts?.load('36px Montserrat')])}catch{}
 if(!window.jspdf){await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';s.onload=res;s.onerror=rej;document.head.appendChild(s)})}
}
function loadImage(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src})}
let logoPromise=null;function logo(){return logoPromise||(logoPromise=loadImage('assets/logo-as.png?v=20.1'))}
function rr(ctx,x,y,w,h,r,fill,stroke=null,lw=2){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke()}}
function txt(ctx,t,x,y,size,weight=700,color=C.ink,align='left',family=bodyFont){ctx.fillStyle=color;ctx.font=`${weight} ${size}px ${family}`;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillText(String(t??''),x,y)}
function wrap(ctx,str,maxW,size,weight=700,family=bodyFont){ctx.font=`${weight} ${size}px ${family}`;const w=String(str??'').split(/\s+/).filter(Boolean),out=[];let l='';for(const a of w){const n=l?l+' '+a:a;if(!l||ctx.measureText(n).width<=maxW)l=n;else{out.push(l);l=a}}if(l)out.push(l);return out}
function block(ctx,str,x,y,maxW,start=40,min=20,maxLines=2,weight=700,color=C.ink,family=bodyFont,gap=1.12){let size=start,ls=[];for(;size>=min;size--){ls=wrap(ctx,str,maxW,size,weight,family);if(ls.length<=maxLines)break}ls=ls.slice(0,maxLines);ctx.fillStyle=color;ctx.font=`${weight} ${size}px ${family}`;ctx.textAlign='left';ls.forEach((l,i)=>ctx.fillText(l,x,y+i*size*gap));return y+(ls.length-1)*size*gap}
function info(ctx,label,value,x,y,w,{accent=C.blue,valueSize=30,maxLines=2}={}){txt(ctx,label.toUpperCase(),x,y,16,900,accent);block(ctx,value||'—',x,y+36,w,valueSize,19,maxLines,700,C.ink)}
function chip(ctx,label,x,y,bg='#EEF4FF',fg=C.blue,maxW=400){ctx.font=`700 20px ${bodyFont}`;const w=Math.min(maxW,ctx.measureText(label).width+36);rr(ctx,x,y,w,44,22,bg);txt(ctx,label,x+18,y+29,20,700,fg);return w}
function color(sp){return SPEC[sp]||C.blue}
function parts(date){const d=new Date(date+'T12:00:00');return{weekday:d.toLocaleDateString('fr-FR',{weekday:'long'}).toUpperCase(),day:String(d.getDate()).padStart(2,'0'),month:d.toLocaleDateString('fr-FR',{month:'long'}).toUpperCase(),year:String(d.getFullYear())}}
function clean(s='export'){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'')}
function names(c){return(c.studentIds||[]).map(id=>window.app.studentName(id)).filter(Boolean)}
function newCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{alpha:false});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.fillStyle=C.paper;ctx.fillRect(0,0,w,h);return{c,ctx}}

function drawProgramDecor(ctx,w,h,im){
 ctx.fillStyle=C.paper;ctx.fillRect(0,0,w,h);
 ctx.lineCap='butt';
 const rings=[{r:510,c:C.blue},{r:405,c:C.yellow},{r:300,c:C.blue},{r:200,c:C.yellow}];
 rings.forEach(({r,c})=>{ctx.strokeStyle=c;ctx.lineWidth=72;ctx.beginPath();ctx.arc(275,-210,r,0.10*Math.PI,0.90*Math.PI);ctx.stroke()});
 rings.forEach(({r,c})=>{ctx.strokeStyle=c;ctx.lineWidth=72;ctx.beginPath();ctx.arc(275,h+210,r,1.10*Math.PI,1.90*Math.PI);ctx.stroke()});
 txt(ctx,'PROGRAMME',54,192,145,400,'#303030','left',titleFont);
 txt(ctx,'ASSOCIATION SPORTIVE BON SAUVEUR',55,225,34,400,'#303030','left',titleFont);
 ctx.save();ctx.globalAlpha=.98;ctx.drawImage(im,w-250,52,205,205);ctx.restore();
}
function drawConvDecor(ctx,w,h,im){
 ctx.fillStyle=C.paper;ctx.fillRect(0,0,w,h);
 const segs=[[-80,0,390,C.yellow],[120,0,530,C.blue],[570,0,430,C.yellow],[1010,0,420,C.blue],[1450,0,360,C.yellow],[1810,0,360,C.blue]];
 for(const [x,y,sw,col] of segs){ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+sw,y);ctx.lineTo(x+sw-105,62);ctx.lineTo(x-105,62);ctx.closePath();ctx.fill()}
 const bottom=[[0,1390,520,C.blue],[555,1390,310,C.yellow],[865,1390,335,C.blue],[1200,1390,330,C.yellow],[1530,1390,300,C.blue],[1830,1390,300,C.yellow]];
 for(const [x,y,sw,col] of bottom){ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+sw,y);ctx.lineTo(x+sw-75,h);ctx.lineTo(x-75,h);ctx.closePath();ctx.fill()}
 txt(ctx,'CONVOCATION',48,145,118,400,'#303030','left',titleFont);
 txt(ctx,'ASSOCIATION SPORTIVE BON SAUVEUR',50,174,29,400,'#303030','left',titleFont);
 ctx.drawImage(im,w-292,26,245,245);
}

async function convCanvas(c,studentNames){
 const im=await logo(),{c:cv,ctx}=newCanvas(2048,1448);drawConvDecor(ctx,2048,1448,im);const a=color(c.specialty),dp=parts(c.date);
 let x=70,y=282;x+=chip(ctx,c.specialty||'Association Sportive',x,y,'#EEF4FF',a,420)+18;chip(ctx,c.ageCategory||'Toutes catégories',x,y,'#FFF1A5','#695A00',320);
 block(ctx,c.title||c.activity||'Convocation',70,385,1450,68,40,2,400,C.blue,titleFont,1.02);
 rr(ctx,70,470,305,300,28,'#F4F7FB');txt(ctx,dp.weekday,95,525,20,800,a);txt(ctx,dp.day,95,675,115,400,a,'left',titleFont);ctx.fillStyle=C.yellow;ctx.fillRect(95,700,180,10);txt(ctx,dp.month,95,754,27,400,a,'left',titleFont);
 info(ctx,'Lieu',c.place,440,500,320,{valueSize:31});info(ctx,'Départ',c.departure,805,500,230,{valueSize:34});info(ctx,'Retour',c.returnTime,1080,500,230,{valueSize:34});info(ctx,'Rendez-vous',c.meetingPoint,1350,500,560,{valueSize:28,maxLines:2});
 ctx.strokeStyle=C.line;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(440,650);ctx.lineTo(1920,650);ctx.stroke();
 info(ctx,'Professeur référent',c.teacher||'À renseigner',440,720,430,{valueSize:29,maxLines:2});info(ctx,'Informations importantes',c.extraInfo||'Aucune information particulière.',930,720,970,{accent:'#A48200',valueSize:26,maxLines:3});
 txt(ctx,'ÉLÈVES CONVOQUÉS',440,930,22,800,C.blue);ctx.fillStyle='#BFD1EA';ctx.fillRect(440,946,330,4);
 const shown=studentNames.slice(0,24),cols=3,cw=485,startY=985;shown.forEach((n,i)=>{const col=i%cols,row=Math.floor(i/cols),xx=440+col*cw,yy=startY+row*62;rr(ctx,xx,yy,440,48,24,'#F1F4F8');block(ctx,n,xx+18,yy+32,405,21,16,1,700,C.ink)});
 if(studentNames.length>24)txt(ctx,`+ ${studentNames.length-24} élève(s) supplémentaire(s)`,440,1372,18,700,C.muted);
 return cv
}
async function convContinuation(c,studentNames,page,total){const im=await logo(),{c:cv,ctx}=newCanvas(2048,1448);drawConvDecor(ctx,2048,1448,im);block(ctx,`${c.title||'Convocation'} — ÉLÈVES CONVOQUÉS`,70,360,1550,54,34,2,400,C.blue,titleFont);txt(ctx,`PAGE ${page}/${total}`,1900,355,17,800,C.muted,'right');const cols=4,cw=470,startY=470;studentNames.forEach((n,i)=>{const col=i%cols,row=Math.floor(i/cols),x=70+col*cw,y=startY+row*82;rr(ctx,x,y,420,60,20,'#F4F7FB','#DCE4EE',2);block(ctx,n,x+20,y+39,380,22,16,1,700,C.ink)});return cv}
async function programCanvas(events){
 const im=await logo(),{c:cv,ctx}=newCanvas(1448,2048);drawProgramDecor(ctx,1448,2048,im);
 const first=events[0],month=first?new Date(first.date+'T12:00:00').toLocaleDateString('fr-FR',{month:'long',year:'numeric'}).toUpperCase():'À VENIR';txt(ctx,month,72,350,28,400,C.blue,'left',titleFont);
 const slots=[{y:405,h:440},{y:870,h:440},{y:1335,h:440}];events.slice(0,3).forEach((e,i)=>{const q=slots[i],a=color(e.specialty),dp=parts(e.date);rr(ctx,70,q.y,1308,q.h,30,'rgba(255,255,255,.96)','#D9E2EE',3);rr(ctx,70,q.y,12,q.h,6,a);rr(ctx,112,q.y+54,182,182,30,'#F4F7FB');txt(ctx,dp.day,203,q.y+151,72,400,a,'center',titleFont);txt(ctx,dp.month.slice(0,4),203,q.y+202,20,400,a,'center',titleFont);block(ctx,e.title,335,q.y+105,885,43,28,2,400,C.ink,titleFont,1.05);chip(ctx,e.specialty||'Association Sportive',335,q.y+166,'#EEF4FB',a,365);info(ctx,'Catégorie',e.ageCategory||'Toutes catégories',335,q.y+292,330,{valueSize:24,maxLines:1});info(ctx,'Horaires',`${e.startTime||'—'}${e.endTime?' – '+e.endTime:''}`,700,q.y+292,280,{valueSize:25,maxLines:1});info(ctx,'Lieu',e.place||'—',1010,q.y+292,320,{valueSize:23,maxLines:2});const d=window.app.readData(),has=(d.convocations||[]).some(c=>c.id===e.convocationId||(c.date===e.date&&c.specialty===e.specialty&&c.title===e.title));if(has){rr(ctx,1155,q.y+25,185,42,21,C.yellow);txt(ctx,'CONVOCATION',1248,q.y+53,14,800,'#4C4000','center')}});
 return cv
}

window.app.exportConvocation=async id=>{try{await ensureDeps();const {jsPDF}=window.jspdf||{};if(!jsPDF)throw new Error('Module PDF indisponible');const d=window.app.readData(),c=(d.convocations||[]).find(x=>x.id===id);if(!c)return alert('Convocation introuvable.');const ns=names(c),chunks=[ns.slice(0,24)];for(let i=24;i<ns.length;i+=44)chunks.push(ns.slice(i,i+44));const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a3',compress:true});for(let i=0;i<chunks.length;i++){if(i)doc.addPage('a3','landscape');const cv=i===0?await convCanvas(c,ns):await convContinuation(c,chunks[i],i+1,chunks.length);doc.addImage(cv.toDataURL('image/png'),'PNG',0,0,420,297,'','FAST')}doc.save(`Convocation_${clean(c.title||c.activity||'AS')}.pdf`)}catch(e){console.error(e);alert('Impossible de générer la convocation PDF.')}};
window.app.exportCalendarPDF=async()=>{try{await ensureDeps();const {jsPDF}=window.jspdf||{};if(!jsPDF)throw new Error('Module PDF indisponible');const d=window.app.readData(),sp=window.app.roleSpecialty();let events=(d.events||[]).filter(e=>!sp||e.specialty===sp).slice().sort((a,b)=>(a.date+(a.startTime||'')).localeCompare(b.date+(b.startTime||''))).slice(0,3);if(!events.length)return alert('Aucun événement à exporter.');const cv=await programCanvas(events);const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a3',compress:true});doc.addImage(cv.toDataURL('image/png'),'PNG',0,0,297,420,'','FAST');doc.save(sp?`Programme_${clean(sp)}.pdf`:'Programme_AS_Bon_Sauveur.pdf')}catch(e){console.error(e);alert('Impossible de générer le calendrier PDF.')}};
window.ASV20_EXPORTS={version:VERSION};
})();