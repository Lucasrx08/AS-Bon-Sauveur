(() => {
'use strict';
if(!window.app)return;

const COLORS={blue:'#0757C9',navy:'#13213A',yellow:'#FFD21A',ink:'#202733',muted:'#69758A',line:'#D9E2EE',football:'#3E8FEA',escalade:'#7357D9',gym:'#9558CC',as:'#C9A20B',white:'#FFFFFF',soft:'#F6F8FB'};
const SPEC={'Association Sportive':COLORS.as,'Section Football':COLORS.football,'Option Escalade':COLORS.escalade,'Sport-études Gymnastique':COLORS.gym};
const fontTitle='Arial Black, Arial, sans-serif';
const fontBody='Arial, Helvetica, sans-serif';

async function template(kind){
 const path=kind==='conv'?'assets/convocation-template.png.b64':'assets/programme-template.png.b64';
 const r=await fetch(path+'?v=19',{cache:'no-store'});if(!r.ok)throw new Error('Fond graphique indisponible');
 const b64=(await r.text()).replace(/\s+/g,'');if(!b64.startsWith('iVBOR'))throw new Error('Fond graphique invalide');
 return loadImage('data:image/png;base64,'+b64);
}
function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src})}
function roundRect(ctx,x,y,w,h,r,fill=null,stroke=null,lw=2){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke()}}
function text(ctx,t,x,y,size,weight=700,color=COLORS.ink,align='left',family=fontBody){ctx.fillStyle=color;ctx.font=`${weight} ${size}px ${family}`;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillText(String(t??''),x,y)}
function measureLines(ctx,str,maxW,size,weight=700,family=fontBody){ctx.font=`${weight} ${size}px ${family}`;const words=String(str??'').split(/\s+/).filter(Boolean),lines=[];let line='';words.forEach(word=>{const test=line?line+' '+word:word;if(ctx.measureText(test).width<=maxW||!line)line=test;else{lines.push(line);line=word}});if(line)lines.push(line);return lines}
function fitLines(ctx,str,maxW,start,min,weight=700,family=fontBody,maxLines=2){for(let s=start;s>=min;s--){const lines=measureLines(ctx,str,maxW,s,weight,family);if(lines.length<=maxLines)return{size:s,lines}}const lines=measureLines(ctx,str,maxW,min,weight,family);return{size:min,lines:lines.slice(0,maxLines)}}
function drawBlockText(ctx,str,x,y,maxW,start=42,min=24,maxLines=2,weight=800,color=COLORS.ink,family=fontBody,lineGap=1.12){const f=fitLines(ctx,str,maxW,start,min,weight,family,maxLines);ctx.fillStyle=color;ctx.font=`${weight} ${f.size}px ${family}`;ctx.textAlign='left';ctx.textBaseline='alphabetic';f.lines.forEach((ln,i)=>ctx.fillText(ln,x,y+i*f.size*lineGap));return y+(f.lines.length-1)*f.size*lineGap}
function info(ctx,label,value,x,y,w,{accent=COLORS.blue,valueSize=30,maxLines=2}={}){text(ctx,label.toUpperCase(),x,y,16,900,accent);drawBlockText(ctx,value||'—',x,y+35,w,valueSize,20,maxLines,800,COLORS.ink,fontBody,1.15)}
function chip(ctx,label,x,y,{bg='#EDF4FD',fg=COLORS.blue,maxW=330}={}){ctx.font=`800 20px ${fontBody}`;const w=Math.min(maxW,ctx.measureText(label).width+34);roundRect(ctx,x,y,w,42,21,bg,null);text(ctx,label,x+17,y+28,20,800,fg);return w}
function dayParts(date){const d=new Date(date+'T12:00:00');return{weekday:d.toLocaleDateString('fr-FR',{weekday:'long'}).toUpperCase(),day:String(d.getDate()).padStart(2,'0'),month:d.toLocaleDateString('fr-FR',{month:'long'}).toUpperCase(),year:d.getFullYear()}}
function specColor(sp){return SPEC[sp]||COLORS.blue}
function createCanvas(bg){const c=document.createElement('canvas');c.width=bg.naturalWidth||bg.width;c.height=bg.naturalHeight||bg.height;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(bg,0,0,c.width,c.height);return{canvas:c,ctx}}
function studentNames(c){return(c.studentIds||[]).map(id=>window.app.studentName(id)).filter(Boolean)}
function clean(s='export'){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'')}

function drawConvFirst(bg,c,names){
 const {canvas,ctx}=createCanvas(bg),W=canvas.width,sc=W/2048,sx=v=>v*sc,sy=v=>v*sc,accent=specColor(c.specialty);
 text(ctx,c.specialty||'Association Sportive',sx(115),sy(350),22,900,accent,'left',fontBody);
 drawBlockText(ctx,c.title||c.activity||'Convocation',sx(115),sy(425),sx(1260),66,38,2,900,COLORS.blue,fontTitle,1.02);
 let cx=sx(115),cy=sy(475);cx+=chip(ctx,c.specialty||'Association Sportive',cx,cy,{bg:'#EAF3FF',fg:accent,maxW:sx(390)})+sx(18);chip(ctx,c.ageCategory||'Toutes catégories',cx,cy,{bg:'#FFF2A6',fg:'#6F5D0A',maxW:sx(280)});
 const dp=dayParts(c.date);
 text(ctx,dp.weekday,sx(115),sy(620),22,900,COLORS.blue);text(ctx,dp.day,sx(112),sy(820),120,900,COLORS.blue,'left',fontTitle);ctx.fillStyle=COLORS.yellow;ctx.fillRect(sx(110),sy(845),sx(210),sy(12));text(ctx,dp.month,sx(115),sy(915),30,900,COLORS.blue,'left',fontTitle);text(ctx,dp.year,sx(115),sy(960),20,900,COLORS.muted);
 const x1=470,x2=810,x3=1115,x4=1430,y1=620;
 info(ctx,'Lieu',c.place,sx(x1),sy(y1),sx(280),{valueSize:31});info(ctx,'Départ',c.departure,sx(x2),sy(y1),sx(230),{valueSize:33});info(ctx,'Retour',c.returnTime,sx(x3),sy(y1),sx(230),{valueSize:33});info(ctx,'Point de rendez-vous',c.meetingPoint,sx(x4),sy(y1),sx(460),{valueSize:30,maxLines:2});
 ctx.strokeStyle=COLORS.line;ctx.lineWidth=sx(2);ctx.beginPath();ctx.moveTo(sx(455),sy(740));ctx.lineTo(sx(1930),sy(740));ctx.stroke();
 info(ctx,'Professeur référent',c.teacher||'À renseigner',sx(470),sy(810),sx(430),{valueSize:29,maxLines:2});info(ctx,'Informations importantes',c.extraInfo||'Aucune information particulière.',sx(1050),sy(810),sx(870),{accent:'#B58C00',valueSize:27,maxLines:3});
 text(ctx,'ÉLÈVES CONVOQUÉS',sx(470),sy(1080),22,900,COLORS.blue);ctx.strokeStyle='#BFD3EF';ctx.lineWidth=sx(4);ctx.beginPath();ctx.moveTo(sx(470),sy(1095));ctx.lineTo(sx(820),sy(1095));ctx.stroke();
 const shown=names.slice(0,18),cols=3,cw=430,startX=470,startY=1135;shown.forEach((n,i)=>{const col=i%cols,row=Math.floor(i/cols),x=startX+col*cw,y=startY+row*70;roundRect(ctx,sx(x),sy(y),sx(380),sy(54),sy(27),'#F0F5FB',null);drawBlockText(ctx,n,sx(x+20),sy(y+36),sx(340),22,17,1,800,COLORS.ink,fontBody)});if(names.length>shown.length)text(ctx,`+ ${names.length-shown.length} élève(s) en page suivante`,sx(470),sy(1370),17,800,COLORS.muted);text(ctx,'BON SAUVEUR – SAINT-LÔ',W/2,sy(1390),16,900,COLORS.blue,'center',fontBody);return canvas;
}
function drawConvContinuation(bg,c,names,page,total){const {canvas,ctx}=createCanvas(bg),W=canvas.width,sc=W/2048,sx=v=>v*sc,sy=v=>v*sc;text(ctx,c.specialty||'Association Sportive',sx(115),sy(350),22,900,specColor(c.specialty));drawBlockText(ctx,`${c.title||'Convocation'} — ÉLÈVES CONVOQUÉS`,sx(115),sy(430),sx(1500),54,34,2,900,COLORS.blue,fontTitle);text(ctx,`Page ${page}/${total}`,sx(1900),sy(380),18,800,COLORS.muted,'right');const cols=4,cw=450,startX=110,startY=560;names.forEach((n,i)=>{const col=i%cols,row=Math.floor(i/cols),x=startX+col*cw,y=startY+row*95;roundRect(ctx,sx(x),sy(y),sx(400),sy(70),sy(20),'#F4F7FB','#DCE5F0',sx(2));drawBlockText(ctx,n,sx(x+22),sy(y+44),sx(360),24,17,1,800,COLORS.ink)});return canvas}

function drawProgramPage(bg,events,page,total){
 const {canvas,ctx}=createCanvas(bg),W=canvas.width,sc=W/1448,sx=v=>v*sc,sy=v=>v*sc;const first=events[0];const month=first?new Date(first.date+'T12:00:00').toLocaleDateString('fr-FR',{month:'long',year:'numeric'}).toUpperCase():'PROGRAMME';text(ctx,`RENDEZ-VOUS À VENIR — ${month}`,sx(72),sy(420),28,900,COLORS.blue,'left',fontTitle);text(ctx,`PAGE ${page}/${total}`,sx(1370),sy(418),16,800,COLORS.muted,'right');
 const slots=[{x:72,y:500,w:620,h:390},{x:756,y:500,w:620,h:390},{x:72,y:925,w:620,h:390},{x:756,y:925,w:620,h:390},{x:72,y:1350,w:1304,h:390}];
 events.forEach((e,i)=>{const s=slots[i];if(!s)return;const a=specColor(e.specialty),dp=dayParts(e.date);roundRect(ctx,sx(s.x),sy(s.y),sx(s.w),sy(s.h),sy(28),'rgba(255,255,255,.92)','#DCE5F0',sx(3));ctx.fillStyle=a;roundRect(ctx,sx(s.x),sy(s.y),sx(10),sy(s.h),sy(5),a,null);roundRect(ctx,sx(s.x+35),sy(s.y+45),sx(130),sy(150),sy(28),'#F4F7FB',null);text(ctx,dp.day,sx(s.x+100),sy(s.y+125),58,900,a,'center',fontTitle);text(ctx,dp.month.slice(0,4),sx(s.x+100),sy(s.y+170),18,900,a,'center',fontTitle);drawBlockText(ctx,e.title,sx(s.x+195),sy(s.y+85),sx(s.w-245),36,25,2,900,COLORS.ink,fontBody,1.08);chip(ctx,e.specialty||'Association Sportive',sx(s.x+195),sy(s.y+145),{bg:'#EEF4FB',fg:a,maxW:sx(330)});info(ctx,'Catégorie',e.ageCategory||'Toutes catégories',sx(s.x+195),sy(s.y+245),sx(s.w-230),{valueSize:22,maxLines:1});info(ctx,'Horaires',`${e.startTime||'—'}${e.endTime?' – '+e.endTime:''}`,sx(s.x+195),sy(s.y+310),sx(250),{valueSize:23,maxLines:1});info(ctx,'Lieu',e.place||'—',sx(s.x+430),sy(s.y+310),sx(s.w-455),{valueSize:21,maxLines:2});const d=window.app.readData(),has=(d.convocations||[]).some(c=>c.id===e.convocationId||(c.date===e.date&&c.specialty===e.specialty&&c.title===e.title));if(has){roundRect(ctx,sx(s.x+s.w-165),sy(s.y+22),sx(135),sy(42),sy(21),COLORS.yellow,null);text(ctx,'CONVOCATION',sx(s.x+s.w-97),sy(s.y+49),14,900,'#4C4000','center',fontBody)}});text(ctx,'BON SAUVEUR – SAINT-LÔ',W/2,sy(1980),16,900,COLORS.blue,'center',fontBody);return canvas;
}
function canvasToPdfImage(canvas){return canvas.toDataURL('image/jpeg',0.96)}

window.app.exportConvocation=async id=>{try{const {jsPDF}=window.jspdf||{};if(!jsPDF)throw new Error('Module PDF indisponible');const d=window.app.readData(),c=(d.convocations||[]).find(x=>x.id===id);if(!c)return alert('Convocation introuvable.');const bg=await template('conv'),names=studentNames(c),chunks=[names.slice(0,18)];for(let i=18;i<names.length;i+=40)chunks.push(names.slice(i,i+40));const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a3',compress:true});chunks.forEach((chunk,i)=>{if(i)doc.addPage('a3','landscape');const canvas=i===0?drawConvFirst(bg,c,names):drawConvContinuation(bg,c,chunk,i+1,chunks.length);doc.addImage(canvasToPdfImage(canvas),'JPEG',0,0,420,297,'','FAST')});doc.save(`Convocation_${clean(c.title||c.activity||'AS')}.pdf`)}catch(e){console.error(e);alert('Impossible de générer la convocation PDF.')}};
window.app.exportCalendarPDF=async()=>{try{const {jsPDF}=window.jspdf||{};if(!jsPDF)throw new Error('Module PDF indisponible');const d=window.app.readData(),sp=window.app.roleSpecialty();let events=(d.events||[]).filter(e=>!sp||e.specialty===sp).slice().sort((a,b)=>(a.date+(a.startTime||'')).localeCompare(b.date+(b.startTime||'')));if(!events.length)return alert('Aucun événement à exporter.');const bg=await template('prog'),pages=Math.ceil(events.length/5),doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a3',compress:true});for(let p=0;p<pages;p++){if(p)doc.addPage('a3','portrait');const chunk=events.slice(p*5,p*5+5),canvas=drawProgramPage(bg,chunk,p+1,pages);doc.addImage(canvasToPdfImage(canvas),'JPEG',0,0,297,420,'','FAST')}doc.save(sp?`Programme_${clean(sp)}.pdf`:'Programme_AS_Bon_Sauveur.pdf')}catch(e){console.error(e);alert('Impossible de générer le calendrier PDF.')}};
window.ASV19_EXPORTS={version:'v19-20260908-2'};
})();
