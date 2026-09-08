(()=>{
'use strict';
const V=window.ASV7, app=window.app;
if(!V||!app) return;

const C={blue:[7,87,201],yellow:[255,213,28],purple:[130,72,212],ink:[27,39,64],muted:[107,120,144],line:[220,229,241],pale:[248,250,253],paleYellow:[255,249,220],white:[255,255,255]};
const safe=v=>String(v??'').trim();
const clean=v=>safe(v)||'—';
const accent=s=>s==='Section Football'?C.blue:(s==='Option Escalade'||s==='Sport-études Gymnastique')?C.purple:C.yellow;

function font(doc,size=10,style='normal',color=C.ink){doc.setFont('helvetica',style);doc.setFontSize(size);doc.setTextColor(...color)}
function tx(doc,t,x,y,size=10,style='normal',color=C.ink,opt={}){font(doc,size,style,color);doc.text(Array.isArray(t)?t:safe(t),x,y,opt)}
function fit(doc,t,maxW,start=13,min=7,style='bold'){let s=start;while(s>min){font(doc,s,style);if(doc.getTextWidth(safe(t))<=maxW)break;s-=.5}return s}
function wrap(doc,t,w,size=10,style='normal',max=3){font(doc,size,style);return doc.splitTextToSize(safe(t),w).slice(0,max)}
function line(doc,x1,y1,x2,y2,color=C.line,w=.45){doc.setDrawColor(...color);doc.setLineWidth(w);doc.line(x1,y1,x2,y2)}
function box(doc,x,y,w,h,fill=C.white,stroke=C.line,r=3){doc.setFillColor(...fill);doc.setDrawColor(...stroke);doc.setLineWidth(.45);doc.roundedRect(x,y,w,h,r,r,'FD')}
function label(doc,label,value,x,y,w,labelColor=C.blue,valueSize=9.4,maxLines=2){tx(doc,label.toUpperCase(),x,y,5.8,'bold',labelColor);const lines=wrap(doc,clean(value),w,valueSize,'bold',maxLines);tx(doc,lines,x,y+6.5,valueSize,'bold',C.ink)}
function dateParts(date){const d=new Date(date+'T12:00:00');return{day:String(d.getDate()).padStart(2,'0'),mon:d.toLocaleDateString('fr-FR',{month:'short'}).replace('.','').toUpperCase(),weekday:d.toLocaleDateString('fr-FR',{weekday:'long'}),month:d.toLocaleDateString('fr-FR',{month:'long'}),year:d.getFullYear()}}
function monthRange(events){if(!events.length)return'RENDEZ-VOUS À VENIR';const a=dateParts(events[0].date),b=dateParts(events[events.length-1].date);return a.month===b.month&&a.year===b.year?`RENDEZ-VOUS À VENIR - ${a.month.toUpperCase()} ${a.year}`:`RENDEZ-VOUS À VENIR - ${a.month.toUpperCase()} ${a.year} / ${b.month.toUpperCase()} ${b.year}`}

async function logoData(){try{return await V.logoData()}catch{return null}}
async function loadProgrammeBg(){const parts=(window.AS_TPL_PARTS&&window.AS_TPL_PARTS.programme)||[];if(!parts.length)return null;return 'data:image/jpeg;base64,'+parts.join('')}

function drawProgrammeFallback(doc,W,H,logo){doc.setFillColor(...C.white);doc.rect(0,0,W,H,'F');if(logo)try{doc.addImage(logo,'PNG',W-48,10,34,34)}catch{}tx(doc,'PROGRAMME',15,42,34,'bold',[30,30,30]);tx(doc,'ASSOCIATION SPORTIVE BON SAUVEUR',16,52,8.4,'bold',[30,30,30]);}

function eventCard(doc,e,x,y,w,h,hasConv){const a=accent(e.specialty),p=dateParts(e.date);box(doc,x,y,w,h,C.white,C.line,3.5);doc.setFillColor(...a);doc.roundedRect(x,y,3,h,1.5,1.5,'F');
  const dateW=28;tx(doc,p.day,x+8,y+18,20,'bold',a===C.yellow?C.ink:a);tx(doc,p.mon,x+8,y+26,7.5,'bold',C.blue);line(doc,x+dateW,y+7,x+dateW,y+h-7,C.line,.45);
  const cx=x+dateW+7;const maxTitle=w-dateW-14;const titleSize=fit(doc,e.title,maxTitle,12.5,8.2,'bold');tx(doc,wrap(doc,e.title,maxTitle,titleSize,'bold',2),cx,y+13,titleSize,'bold',C.ink);
  const spec=safe(e.specialty||'Association Sportive');tx(doc,spec.toUpperCase(),cx,y+32,6.1,'bold',a===C.yellow?C.ink:a);
  if(hasConv){doc.setFillColor(...C.yellow);doc.roundedRect(x+w-36,y+7,31,8,4,4,'F');tx(doc,'CONVOCATION',x+w-20.5,y+12.5,5.6,'bold',C.blue,{align:'center'})}
  const base=y+h-24;label(doc,'Catégorie',e.ageCategory||'Toutes catégories',cx,base,maxTitle*.42,C.blue,7.5,1);label(doc,'Horaires',`${clean(e.startTime)} - ${clean(e.endTime)}`,cx+maxTitle*.46,base,maxTitle*.50,C.blue,7.5,1);label(doc,'Lieu',e.place||'—',cx,base+13,maxTitle,C.blue,7.2,2);
}

app.exportCalendarPDF=async()=>{
  const {jsPDF}=window.jspdf||{};if(!jsPDF)return alert('Export PDF indisponible.');
  const d=V.read(),sp=V.edu();const events=(d.events||[]).filter(e=>!sp||e.specialty===sp).sort((a,b)=>(a.date+(a.startTime||'')).localeCompare(b.date+(b.startTime||'')));if(!events.length)return alert('Aucun événement à exporter.');
  const logo=await logoData(),bg=await loadProgrammeBg(),per=5,pages=Math.ceil(events.length/per),doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a3',compress:true});
  for(let p=0;p<pages;p++){
    if(p)doc.addPage('a3','portrait');const ch=events.slice(p*per,p*per+per);const W=297,H=420;
    if(bg){try{doc.addImage(bg,'JPEG',0,0,W,H,undefined,'FAST')}catch{drawProgrammeFallback(doc,W,H,logo)}}else drawProgrammeFallback(doc,W,H,logo);
    // On ne redessine pas le décor: seulement les données dans la zone blanche.
    tx(doc,monthRange(ch),17,92,12,'bold',C.blue);
    line(doc,17,97,280,97,C.line,.6);
    const conv=e=>(d.convocations||[]).some(c=>c.id===e.convocationId||(c.date===e.date&&c.specialty===e.specialty&&(!e.title||c.title===e.title)));
    if(ch.length===1){eventCard(doc,ch[0],17,111,263,135,conv(ch[0]))}
    else if(ch.length===2){eventCard(doc,ch[0],17,111,127,132,conv(ch[0]));eventCard(doc,ch[1],153,111,127,132,conv(ch[1]))}
    else if(ch.length===3){eventCard(doc,ch[0],17,111,127,105,conv(ch[0]));eventCard(doc,ch[1],153,111,127,105,conv(ch[1]));eventCard(doc,ch[2],17,226,263,100,conv(ch[2]))}
    else{
      const cw=127,chh=101,g=9;ch.slice(0,4).forEach((e,i)=>eventCard(doc,e,17+(i%2)*(cw+g),111+Math.floor(i/2)*(chh+10),cw,chh,conv(e)));
      if(ch[4])eventCard(doc,ch[4],17,333,263,58,conv(ch[4]));
    }
    tx(doc,`${p+1}/${pages}`,279,404,6.3,'bold',C.muted,{align:'right'});
  }
  doc.save(sp?`Programme_${V.clean(sp)}.pdf`:'Programme_AS_Bon_Sauveur.pdf');
};

function drawConvocationDecor(doc,W,H,logo){
  // Reprise stricte du décor transmis : aucun élément décoratif ajouté dans la zone de contenu.
  doc.setFillColor(...C.white);doc.rect(0,0,W,H,'F');
  doc.setDrawColor(43,73,166);doc.setLineWidth(16);doc.ellipse(W*.49,-10,W*.35,35,'S');
  doc.setDrawColor(...C.white);doc.setLineWidth(9);doc.ellipse(W*.49,-10,W*.29,29,'S');
  doc.setDrawColor(...C.yellow);doc.setLineWidth(14);doc.ellipse(W*.55,-11,W*.25,25,'S');
  doc.setDrawColor(...C.white);doc.setLineWidth(7);doc.ellipse(W*.55,-11,W*.20,20,'S');
  tx(doc,'CONVOCATION',14,31,34,'bold',[30,30,30]);tx(doc,'ASSOCIATION SPORTIVE BON SAUVEUR',15,40,8.4,'bold',[30,30,30]);
  if(logo)try{doc.addImage(logo,'PNG',W-48,8,35,35)}catch{}
  doc.setFillColor(43,73,166);doc.rect(0,H-8,W*.28,8,'F');doc.rect(W*.86,H-8,W*.14,8,'F');
  doc.setFillColor(...C.yellow);doc.triangle(W*.30,H,W*.35,H-8,W*.42,H,'F');doc.triangle(W*.60,H,W*.64,H-8,W*.72,H,'F');
  doc.setFillColor(43,73,166);doc.triangle(W*.46,H,W*.49,H-8,W*.56,H,'F');
}

function smallInfo(doc,labelText,value,x,y,w,h){box(doc,x,y,w,h,C.white,C.line,3);label(doc,labelText,value,x+6,y+8,w-12,C.blue,9.2,2)}

app.exportConvocation=async id=>{
  const {jsPDF}=window.jspdf||{};if(!jsPDF)return alert('Export PDF indisponible.');const d=V.read(),c=(d.convocations||[]).find(x=>x.id===id);if(!c)return alert('Convocation introuvable.');
  const names=(c.studentIds||[]).map(x=>V.studentName(d,x)).filter(Boolean),logo=await logoData(),doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a3',compress:true}),W=420,H=297;
  drawConvocationDecor(doc,W,H,logo);
  const p=dateParts(c.date),a=accent(c.specialty);
  // Données uniquement, dans la zone blanche du décor fourni.
  tx(doc,(c.specialty||'Association Sportive').toUpperCase(),20,67,7.2,'bold',a===C.yellow?C.ink:a);
  const title=safe(c.title||c.activity||'Convocation');const ts=fit(doc,title,290,22,13,'bold');tx(doc,wrap(doc,title,290,ts,'bold',2),20,83,ts,'bold',C.blue);
  tx(doc,safe(c.ageCategory||'Toutes catégories'),353,76,7.4,'bold',C.blue,{align:'center'});

  // Date : claire, compacte, sans surdimensionnement.
  tx(doc,p.weekday.toUpperCase(),20,117,7.5,'bold',C.blue);tx(doc,p.day,20,141,24,'bold',C.blue);tx(doc,p.month.toUpperCase(),20,152,8,'bold',C.blue);tx(doc,String(p.year),20,160,6.8,'bold',C.muted);
  line(doc,53,102,53,239,C.line,.6);

  smallInfo(doc,'Lieu',c.place||'—',63,104,70,34);smallInfo(doc,'Départ',c.departure||'—',139,104,55,34);smallInfo(doc,'Retour',c.returnTime||'—',200,104,55,34);smallInfo(doc,'Point de rendez-vous',c.meetingPoint||'—',261,104,139,34);
  smallInfo(doc,'Professeur référent',c.teacher||'À renseigner',63,146,120,34);
  box(doc,190,146,210,34,C.paleYellow,[255,229,123],3);label(doc,'Informations importantes',c.extraInfo||'Aucune information particulière.',197,154,196,C.blue,8.8,2);

  box(doc,63,190,337,53,C.white,C.line,3);tx(doc,'ÉLÈVES CONVOQUÉS',70,202,7,'bold',C.blue);
  let x=70,y=215;const maxX=392;for(const n of names){const ww=Math.max(29,Math.min(58,12+n.length*1.6));if(x+ww>maxX){x=70;y+=11}if(y>237)break;doc.setFillColor(239,246,255);doc.roundedRect(x,y-5.8,ww,8.2,4,4,'F');tx(doc,n,x+ww/2,y,6.8,'bold',C.ink,{align:'center'});x+=ww+5}
  tx(doc,'BON SAUVEUR - SAINT-LÔ',210,267,6.4,'bold',C.blue,{align:'center'});tx(doc,'1/1',402,267,6,'bold',C.muted,{align:'right'});
  doc.save(`Convocation_${V.clean(c.title||c.activity||'AS')}_${c.date||''}.pdf`);
};

window.ASV17={version:'v17-20260908-data-only'};
})();