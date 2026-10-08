(() => {
'use strict';

const VERSION='v31.8.2-20261008';
const MAX_PROGRAM_EVENTS=5;
const MAX_TV_EVENTS=3;
const ASSETS={
 programme:'assets/programme-v21-14-hd.png',
 tv:'assets/programme-tv-v24-hd.png',
 convocation:'assets/convocation-v21-14-hd.png',
 anton:'assets/fonts/Anton-Regular.ttf',
 broshk:'assets/fonts/BroshK.ttf',
 sansRegular:'assets/fonts/DejaVuSans-Latin-Regular.ttf',
 sansBold:'assets/fonts/DejaVuSans-Latin-Bold.ttf'
};
const C={
 blue:[45,79,170],dark:[46,46,46],yellow:[255,214,26],paper:[251,250,247],
 ink:[38,46,62],muted:[101,112,133],line:[216,226,239],soft:[246,248,252],white:[255,255,255]
};
const SPECIALTIES={
 'Association Sportive':{accent:[45,79,170],pale:[235,241,255],short:'ASSOCIATION SPORTIVE'},
 'Section Football':{accent:[35,111,196],pale:[232,243,255],short:'SECTION FOOTBALL'},
 'Option Escalade':{accent:[104,78,185],pale:[242,237,255],short:'OPTION ESCALADE'},
 'Sport-études Gymnastique':{accent:[132,83,175],pale:[247,237,255],short:'SPORT-ÉTUDES GYMNASTIQUE'}
};
const assetCache=new Map();
let pdfLoader=null;

const read=()=>window.app?.readData?.()||{};
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
const clean=s=>String(s||'AS').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'');
const displayText=s=>String(s||'').replace(/[’‘]/g,"'").replace(/[–—]/g,' - ');
const spec=s=>SPECIALTIES[s]||SPECIALTIES['Association Sportive'];
const mm=pt=>pt*0.352778;

function toast(message){
 const el=document.createElement('div');el.className='v19-toast v2112-toast';el.textContent=message;document.body.appendChild(el);setTimeout(()=>el.remove(),2600);
}
function today(){const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function parseDate(value){const d=new Date(String(value||'').slice(0,10)+'T12:00:00');return Number.isNaN(d.getTime())?new Date():d}
function dateParts(value){
 const d=parseDate(value);return{
  weekday:d.toLocaleDateString('fr-FR',{weekday:'long'}).toUpperCase(),
  day:String(d.getDate()).padStart(2,'0'),
  month:d.toLocaleDateString('fr-FR',{month:'long'}).toUpperCase(),
  monthShort:d.toLocaleDateString('fr-FR',{month:'short'}).replace('.','').toUpperCase(),
  year:String(d.getFullYear())
 };
}
function longDate(value){return parseDate(value).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
function shortDate(value){return parseDate(value).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}).replace('.','')}
function shortTime(value){const match=String(value||'').match(/^(\d{1,2}):(\d{2})/);return match?`${match[1].padStart(2,'0')}:${match[2]}`:String(value||'')}
function eventSpecialties(event){const fromApp=window.app?.eventSpecialties?.(event);if(Array.isArray(fromApp)&&fromApp.length)return fromApp;const raw=Array.isArray(event?.specialties)?event.specialties:[];return[...new Set([...raw,event?.specialty].filter(Boolean))]}
function eventTimeLabel(event,separator=' - '){const fromApp=window.app?.eventTimeLabel?.(event,separator);if(fromApp)return fromApp;const start=shortTime(event?.startTime),end=shortTime(event?.endTime);if((!start&&!end)||(start==='00:00'&&end==='00:00'))return'Horaire à confirmer';return start&&end?`${start}${separator}${end}`:start||end||'Horaire à confirmer'}
function hasLinkedConvocation(event){if(typeof window.app?.eventRegistrationState==='function')return window.app.eventRegistrationState(event).mode==='convocation';if(event?.registrationMode==='convocation'||event?.convocationId)return true;const specialties=eventSpecialties(event);return(read().convocations||[]).some(c=>(c.status||'published')==='published'&&c.publicVisible!==false&&(c.date===event?.date&&c.title===event?.title&&specialties.includes(c.specialty)))}
function orderedEvents(){
 const activeSpecialty=window.app?.calendarSpecialty?.()||window.app?.roleSpecialty?.();
 return (read().events||[]).filter(e=>String(e.date||'')>=today()).filter(e=>!activeSpecialty||eventSpecialties(e).includes(activeSpecialty)).slice().sort((a,b)=>`${a.date||''}${a.startTime||''}`.localeCompare(`${b.date||''}${b.startTime||''}`));
}
function periodLabel(events){
 if(!events.length)return'À VENIR';
 const a=parseDate(events[0].date),b=parseDate(events[events.length-1].date);
 if(a.getMonth()===b.getMonth()&&a.getFullYear()===b.getFullYear())return a.toLocaleDateString('fr-FR',{month:'long',year:'numeric'}).toUpperCase();
 return `DU ${shortDate(events[0].date).toUpperCase()} AU ${shortDate(events[events.length-1].date).toUpperCase()}`;
}
function arrayBufferToBase64(buffer){
 const bytes=new Uint8Array(buffer);let binary='';
 for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
 return btoa(binary);
}
async function asset(path,mime){
 if(assetCache.has(path))return assetCache.get(path);
 const promise=(async()=>{const response=await fetch(path,{cache:'force-cache'});if(!response.ok)throw new Error(`Ressource introuvable : ${path}`);return `data:${mime};base64,${arrayBufferToBase64(await response.arrayBuffer())}`})();
 assetCache.set(path,promise);try{return await promise}catch(error){assetCache.delete(path);throw error}
}
async function ensurePdf(){
 if(window.jspdf?.jsPDF)return window.jspdf;
 if(pdfLoader)return pdfLoader;
 pdfLoader=new Promise((resolve,reject)=>{
  document.querySelector('script[data-v2112-jspdf]')?.remove();
  const script=document.createElement('script');script.dataset.v2112Jspdf='1';script.src='assets/vendor/jspdf.umd.min.js?v='+(window.__BS_RELEASE?.version||'31.8.2');script.integrity='sha384-en/ztfPSRkGfME4KIm05joYXynqzUgbsG5nMrj/xEFAHXkeZfO3yMK8QQ+mP7p1/';script.crossOrigin='anonymous';script.referrerPolicy='no-referrer';
  const fail=()=>{clearTimeout(timer);script.remove();reject(new Error('Le module PDF ne peut pas être chargé. Vérifiez votre connexion puis réessayez.'))};
  const timer=setTimeout(fail,20000);script.onload=()=>{clearTimeout(timer);if(window.jspdf?.jsPDF)resolve(window.jspdf);else fail()};script.onerror=fail;document.head.appendChild(script);
 }).catch(error=>{pdfLoader=null;throw error});
 return pdfLoader;
}
async function installFonts(doc,{eventSans=false}={}){
 const result={anton:false,broshk:false};
 const add=async(path,fileName,family,key,style='normal')=>{
  try{const data=await asset(path,'font/ttf');doc.addFileToVFS(fileName,data.split(',')[1]);doc.addFont(fileName,family,style,'Identity-H');result[key]=true}catch(error){console.warn(`Police ${family} indisponible`,error)}
 };
 const pending=[add(ASSETS.anton,'Anton-Regular.ttf','Anton','anton'),add(ASSETS.broshk,'BroshK.ttf','BroshK','broshk')];
 if(eventSans)pending.push(add(ASSETS.sansRegular,'DejaVuSans-Latin-Regular.ttf','AS Sans','sansRegular'),add(ASSETS.sansBold,'DejaVuSans-Latin-Bold.ttf','AS Sans','sansBold','bold'));
 await Promise.all(pending);
 doc.__asFonts=result;return result;
}
function font(doc,kind='body',style='normal'){
 const available=doc.__asFonts||{};
 if(kind==='eventSans'&&available[style==='bold'?'sansBold':'sansRegular']){doc.setFont('AS Sans',style==='bold'?'bold':'normal');return}
 if(kind==='broshk'&&available.broshk){doc.setFont('BroshK','normal');return}
 if((kind==='anton'||kind==='broshk')&&available.anton){doc.setFont('Anton','normal');return}
 doc.setFont('helvetica',style==='bold'?'bold':'normal');
}
function color(doc,value,stroke=false){(stroke?doc.setDrawColor:doc.setTextColor).apply(doc,value)}
function fill(doc,value){doc.setFillColor(...value)}
function card(doc,x,y,w,h,{bg=C.white,border=C.line,r=4,line=0.45}={}){
 fill(doc,bg);doc.setDrawColor(...border);doc.setLineWidth(line);doc.roundedRect(x,y,w,h,r,r,'FD');
}
function pill(doc,text,x,y,{bg=C.soft,fg=C.blue,maxW=80,height=9,fontSize=8.2}={}){
 const value=String(text||'').toUpperCase();font(doc,'anton');doc.setFontSize(fontSize);let shown=value;
 while(shown.length>3&&doc.getTextWidth(shown)+7>maxW)shown=shown.slice(0,-2).trim()+'…';
 const w=Math.min(maxW,Math.max(22,doc.getTextWidth(shown)+7));fill(doc,bg);doc.roundedRect(x,y,w,height,height/2,height/2,'F');color(doc,fg);doc.text(shown,x+w/2,y+height*.68,{align:'center'});return w;
}
function fitOne(doc,text,maxW,{start=16,min=7,kind='body',style='bold'}={}){
 let value=String(text||'—'),size=start;font(doc,kind,style);
 for(;size>min;size-=0.5){doc.setFontSize(size);if(doc.getTextWidth(value)<=maxW)return{value,size}}
 doc.setFontSize(min);while(value.length>3&&doc.getTextWidth(value+'...')>maxW)value=value.slice(0,-1);return{value:value.trim()+'...',size:min};
}
function fitLines(doc,text,maxW,{start=18,min=8,maxLines=2,kind='body',style='bold'}={}){
 const raw=String(text||'—');let size=start,lines=[];font(doc,kind,style);
 for(;size>=min;size-=0.5){doc.setFontSize(size);lines=doc.splitTextToSize(raw,maxW);if(lines.length<=maxLines)return{lines,size}}
 doc.setFontSize(min);lines=doc.splitTextToSize(raw,maxW).slice(0,maxLines);
 if(doc.splitTextToSize(raw,maxW).length>maxLines){let last=String(lines[maxLines-1]||'');while(last.length>2&&doc.getTextWidth(last+'...')>maxW)last=last.slice(0,-1);lines[maxLines-1]=last.trim()+'...'}
 return{lines,size:min};
}
function label(doc,text,x,y,accent=C.blue,size=7.4){font(doc,'anton');doc.setFontSize(size);color(doc,accent);doc.text(String(text||'').toUpperCase(),x,y)}
function value(doc,text,x,y,maxW,{size=10,min=7.2,kind='body',style='bold',align='left'}={}){
 const out=fitOne(doc,text,maxW,{start:size,min,kind,style});color(doc,C.ink);doc.text(out.value,align==='center'?x+maxW/2:x,y,{align});
}
function infoBox(doc,labelText,valueText,x,y,w,h,accent,{valueSize=11,minValueSize=8.4,maxLines=2,labelSize=7.5}={}){
 card(doc,x,y,w,h,{bg:C.soft,border:C.line,r:3,line:0.35});label(doc,labelText,x+4,y+5.5,accent,labelSize);
 const out=fitLines(doc,valueText||'—',w-8,{start:valueSize,min:minValueSize,maxLines,kind:'body',style:'bold'});color(doc,C.ink);font(doc,'body','bold');doc.setFontSize(out.size);const gap=mm(out.size)*1.05;out.lines.forEach((line,i)=>doc.text(line,x+4,y+11.8+i*gap));
}
function participationBadge(event){
 if(hasLinkedConvocation(event))return{text:'CONVOCATION',bg:[7,87,201],fg:C.white};
 if(event?.registrationMode==='open'||event?.registrationOpen)return{text:'INSCRIPTION LIBRE',bg:C.yellow,fg:C.ink};
 return null;
}
function drawParticipation(doc,badge,right,y,{height=8,fontSize=10,maxW=42}={}){
 if(!badge)return 0;
 font(doc,'anton');doc.setFontSize(fontSize);
 const width=Math.min(maxW,Math.max(29,doc.getTextWidth(badge.text)+8));
 pill(doc,badge.text,right-width,y,{bg:badge.bg,fg:badge.fg,maxW:width,height,fontSize});
 return width;
}
function drawEventDate(doc,event,x,y,w,h,theme,{tv=false}={}){
 card(doc,x,y,w,h,{bg:theme.pale,border:theme.pale,r:3.4,line:0});
 const dp=dateParts(event.date),weekday=fitOne(doc,dp.weekday,w-4,{start:tv?8.8:9,min:7.2,kind:'anton'});
 font(doc,'anton');doc.setFontSize(weekday.size);color(doc,theme.accent);doc.text(weekday.value,x+w/2,y+5.5,{align:'center'});
 const month=fitOne(doc,tv?`${dp.month} ${dp.year}`:dp.month,w-3,{start:tv?15.5:17,min:11.5,kind:'anton'});
 const monthBaseline=y+h-4,monthTop=monthBaseline-mm(month.size)*(/[À-ÖØ-Þ]/.test(month.value)?1.11:.88);
 const dayBandTop=y+8,dayBandBottom=monthTop-3;
 const daySize=Math.min(tv?68:86,Math.max(24,(dayBandBottom-dayBandTop)/(.88*.352778)));
 font(doc,'anton');doc.setFontSize(daySize);color(doc,theme.accent);
 doc.text(dp.day,x+w/2,dayBandTop+((dayBandBottom-dayBandTop)+mm(daySize)*.88)/2,{align:'center'});
 fill(doc,C.yellow);doc.roundedRect(x+5,monthTop-1.8,w-10,.85,.4,.4,'F');
 font(doc,'anton');doc.setFontSize(month.size);color(doc,theme.accent);doc.text(month.value,x+w/2,monthBaseline,{align:'center'});
}
function eventTitleLayout(doc,text,w,h,{maxFont=22,minFont=12,maxLines=2}={}){
 const raw=displayText(text||'Rendez-vous').trim();let size=maxFont,lines=[];
 const ascender=/[À-ÆÈ-ÖØ-Þà-æè-öø-ÿ]/.test(raw)?.94:.74,descender=/[gjpqyÇç]/.test(raw)?.22:0,lineFactor=1.18;
 font(doc,'eventSans','bold');
 for(;size>=minFont;size-=.5){
  doc.setFontSize(size);lines=doc.splitTextToSize(raw,w);
  if(lines.length<=maxLines&&mm(size)*(ascender+descender+lineFactor*(lines.length-1))<=h)break;
 }
 if(size<minFont){const fitted=fitLines(doc,raw,w,{start:minFont,min:minFont,maxLines,kind:'eventSans',style:'bold'});lines=fitted.lines;size=minFont}
 const cap=mm(size)*ascender,gap=mm(size)*lineFactor;
 return{lines,size,cap,gap,height:cap+mm(size)*descender+(lines.length-1)*gap};
}
// Both programme formats share the same hierarchy and aligned information columns.
function drawEventDetails(doc,event,x,top,w,h,{tv=false,compact=false}={}){
 const metaH=tv?(compact?9.5:13.5):(compact?11.5:13),gap=tv?(compact?1.5:2.2):2.4;
 const title=eventTitleLayout(doc,event.title,w,h-metaH-gap,{maxFont:tv?(compact?24:28):(compact?18.5:22),minFont:12});
 const titleTop=top+Math.max(0,(h-title.height-gap-metaH)/2);
 font(doc,'eventSans','bold');doc.setFontSize(title.size);color(doc,C.ink);
 title.lines.forEach((line,i)=>doc.text(line,x,titleTop+title.cap+i*title.gap));
 const lineY=titleTop+title.height+gap;
 doc.setDrawColor(...C.line);doc.setLineWidth(.3);doc.line(x,lineY,x+w,lineY);
 const columnGap=tv?8:5,hourW=(w-columnGap)*.38,placeX=x+hourW+columnGap;
 const labelSize=tv?(compact?8:8.5):7.4,valueSize=tv?(compact?12:14.5):(compact?11:12.5);
 const labelY=lineY+(tv?(compact?3.1:3.7):3.5),valueY=lineY+(tv?(compact?8:9.3):9);
 [{x,w:hourW,label:'HORAIRES',text:eventTimeLabel(event)},{x:placeX,w:w-hourW-columnGap,label:'LIEU',text:event.place||'À préciser'}].forEach(c=>{
  font(doc,'eventSans','bold');doc.setFontSize(labelSize);color(doc,C.muted);doc.text(c.label,c.x,labelY);
  value(doc,displayText(c.text),c.x,valueY,c.w,{size:valueSize,min:tv?10:9,kind:'eventSans',style:'normal'});
 });
}
function drawProgramEvent(doc,event,slot){
 const {y,h}=slot,x=11.5,w=187,theme=spec(event.specialty),compact=h<=44;
 card(doc,x,y,w,h,{bg:C.white,border:C.line,r:4.2,line:0.55});fill(doc,theme.accent);doc.roundedRect(x,y,3.2,h,1.5,1.5,'F');
 drawEventDate(doc,event,x+5.5,y+3.5,29.5,h-7,theme);
 const tx=x+39,tw=w-44,tagY=y+3.5,tagH=7.5;
 const badgeWidth=drawParticipation(doc,participationBadge(event),x+w-4,tagY,{height:tagH,fontSize:9.7,maxW:40});
 const tagRight=x+w-4-(badgeWidth?badgeWidth+2.5:0);
 const specialtyWidth=pill(doc,theme.short,tx,tagY,{bg:theme.pale,fg:theme.accent,maxW:Math.min(53,tagRight-tx-30),height:tagH,fontSize:8.6});
 const categoryX=tx+specialtyWidth+2;
 if(tagRight-categoryX>=22)pill(doc,event.ageCategory||'Toutes catégories',categoryX,tagY,{bg:C.soft,fg:C.ink,maxW:tagRight-categoryX,height:tagH,fontSize:8.6});
 const top=tagY+tagH+2;
 drawEventDetails(doc,event,tx,top,tw,y+h-3-top,{compact});
}
function programSlots(count){
 if(count===1)return[{y:77,h:118}];
 if(count===2)return[{y:65,h:88},{y:161,h:88}];
 if(count===3)return[{y:57,h:62},{y:128,h:62},{y:199,h:62}];
 if(count===4)return[{y:55,h:50},{y:110,h:50},{y:165,h:50},{y:220,h:50}];
 return[{y:54,h:40},{y:98,h:40},{y:142,h:40},{y:186,h:40},{y:230,h:40}];
}
async function buildProgramPdf(selectedEvents){
 const dep=await ensurePdf(),{jsPDF}=dep||{};if(!jsPDF)throw new Error('Module PDF indisponible.');
 const events=(selectedEvents||[]).slice(0,MAX_PROGRAM_EVENTS);if(!events.length)throw new Error('Sélectionnez au moins un événement.');
 const [background]=await Promise.all([asset(ASSETS.programme,'image/png')]);
 const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true,putOnlyUsedFonts:true});await installFonts(doc,{eventSans:true});doc.addImage(background,'PNG',0,0,210,297,undefined,'FAST');
 programSlots(events.length).forEach((slot,i)=>drawProgramEvent(doc,events[i],slot));
 doc.setProperties({title:`Programme AS - ${periodLabel(events)}`,subject:'Calendrier de l’Association Sportive du Bon Sauveur',author:'Association Sportive du Bon Sauveur',creator:`Application AS Bon Sauveur ${VERSION}`});return doc;
}
function tvSlots(count){
 if(count===1)return[{y:63,h:82}];
 if(count===2)return[{y:57,h:48},{y:112,h:48}];
 return[{y:54,h:34},{y:93,h:34},{y:132,h:34}];
}
function drawTvEvent(doc,event,slot){
 const {y,h}=slot,x=13,w=294,theme=spec(event.specialty),compact=h<40;
 card(doc,x,y,w,h,{bg:C.white,border:C.line,r:4.2,line:0.5});fill(doc,theme.accent);doc.roundedRect(x,y,3.5,h,1.7,1.7,'F');
 const dateX=x+6,dateW=35,bodyX=dateX+dateW+5,bodyW=x+w-bodyX-5,tagY=y+3,tagH=compact?6:7.2;
 drawEventDate(doc,event,dateX,y+3,dateW,h-6,theme,{tv:true});
 const badgeWidth=drawParticipation(doc,participationBadge(event),bodyX+bodyW,tagY,{height:tagH,fontSize:10.5,maxW:47});
 const tagRight=bodyX+bodyW-(badgeWidth?badgeWidth+3:0);
 let tagX=bodyX;tagX+=pill(doc,theme.short,tagX,tagY,{bg:theme.pale,fg:theme.accent,maxW:80,height:tagH,fontSize:9.5})+2.5;
 if(event.ageCategory&&tagRight-tagX>=22)pill(doc,event.ageCategory,tagX,tagY,{bg:C.soft,fg:C.ink,maxW:Math.min(65,tagRight-tagX),height:tagH,fontSize:9.5});
 const top=tagY+tagH+(compact?1:1.6);
 drawEventDetails(doc,event,bodyX,top,bodyW,y+h-2.7-top,{tv:true,compact});
}
async function buildTvPdf(selectedEvents){
 const dep=await ensurePdf(),{jsPDF}=dep||{};if(!jsPDF)throw new Error('Module PDF indisponible.');
 const events=(selectedEvents||[]).slice(0,MAX_TV_EVENTS);if(!events.length)throw new Error('Sélectionnez au moins un événement.');
 const background=await asset(ASSETS.tv,'image/png'),doc=new jsPDF({orientation:'landscape',unit:'mm',format:[320,180],compress:true,putOnlyUsedFonts:true});await installFonts(doc,{eventSans:true});doc.addImage(background,'PNG',0,0,320,180,undefined,'FAST');
 tvSlots(events.length).forEach((slot,index)=>drawTvEvent(doc,events[index],slot));
 doc.setProperties({title:`Programme TV AS - ${periodLabel(events)}`,subject:'Programme TV 16:9 de l’Association Sportive du Bon Sauveur',author:'Association Sportive du Bon Sauveur',creator:`Application AS Bon Sauveur ${VERSION}`});return doc;
}
function studentRows(convocation){
 if(window.app?.role?.()==='public')return[];
 const data=read(),students=new Map((data.students||[]).map(s=>[String(s.id),s])),licenses=new Map((data.licenses||[]).map(l=>[String(l.studentId),l]));
 return (convocation.studentIds||[]).map(id=>{const s=students.get(String(id))||{},l=licenses.get(String(id))||{};return{name:s.fullName||l.fullName||window.app?.studentName?.(id)||'',className:s.className||l.className||''}}).filter(x=>x.name).sort((a,b)=>a.name.localeCompare(b.name,'fr'));
}
function drawBackground(doc,data){doc.addImage(data,'PNG',0,0,297,210,undefined,'FAST')}
function drawConvocationHeading(doc,c,totalPages){
 const theme=spec(c.specialty);let x=13;x+=pill(doc,theme.short,x,42,{bg:theme.pale,fg:theme.accent,maxW:82,height:9,fontSize:8.5})+3;pill(doc,c.ageCategory||'Toutes catégories',x,42,{bg:[255,247,204],fg:[111,91,0],maxW:64,height:9,fontSize:8.5});
 const title=fitOne(doc,displayText(c.title||c.activity||'Convocation').toUpperCase(),270,{start:30,min:18,kind:'broshk'});font(doc,'broshk');doc.setFontSize(title.size);color(doc,C.dark);doc.text(title.value,13,60);
 if(totalPages>1){font(doc,'anton');doc.setFontSize(9);color(doc,C.muted);doc.text(`1 / ${totalPages}`,284,60,{align:'right'})}
}
function drawDateCard(doc,c){
 const theme=spec(c.specialty),dp=dateParts(c.date),x=13,y=68,w=45,h=39;card(doc,x,y,w,h,{bg:theme.pale,border:theme.pale,r:4,line:0});font(doc,'anton');color(doc,theme.accent);doc.setFontSize(9);doc.text(dp.weekday,x+4.5,y+7);doc.setFontSize(36);doc.text(dp.day,x+4.5,y+25);fill(doc,C.yellow);doc.rect(x+4.5,y+28.5,20,1.8,'F');font(doc,'anton');color(doc,theme.accent);doc.setFontSize(11);doc.text(`${dp.monthShort} ${dp.year}`,x+4.5,y+36);
}
function drawStudentGrid(doc,rows,{x=13,y=150,w=271,cols=3,rowsPerPage=4,cellH=10,gap=1.7,accent=C.blue,pale=[235,241,255],nameSize=12}={}){
 const colGap=2.2,colW=(w-colGap*(cols-1))/cols;rows.slice(0,cols*rowsPerPage).forEach((student,index)=>{
  const col=index%cols,row=Math.floor(index/cols),cx=x+col*(colW+colGap),cy=y+row*(cellH+gap);fill(doc,C.soft);doc.setDrawColor(...C.line);doc.setLineWidth(.28);doc.roundedRect(cx,cy,colW,cellH,2,2,'FD');fill(doc,accent);doc.roundedRect(cx,cy,1.5,cellH,.7,.7,'F');
  const classW=student.className?22:0,nameW=colW-6-classW;value(doc,student.name,cx+3,cy+cellH*.66,nameW,{size:nameSize,min:8.8});
  if(student.className){fill(doc,pale);doc.roundedRect(cx+colW-classW-2,cy+2,classW,cellH-4,(cellH-4)/2,(cellH-4)/2,'F');const classText=fitOne(doc,student.className.toUpperCase(),classW-3,{start:8.5,min:6.8,kind:'anton'});font(doc,'anton');doc.setFontSize(classText.size);color(doc,accent);doc.text(classText.value,cx+colW-classW/2-2,cy+cellH*.64,{align:'center'})}
 });
}
function drawConvocationFirst(doc,c,students,totalPages){
 const theme=spec(c.specialty);drawConvocationHeading(doc,c,totalPages);drawDateCard(doc,c);
 infoBox(doc,'Lieu',c.place||'À préciser',63,68,111,18,theme.accent,{valueSize:12,minValueSize:9,maxLines:1});infoBox(doc,'Départ',c.departure||'À préciser',179,68,49,18,theme.accent,{valueSize:14,minValueSize:10,maxLines:1});infoBox(doc,'Retour',c.returnTime||'À préciser',233,68,51,18,theme.accent,{valueSize:14,minValueSize:10,maxLines:1});infoBox(doc,'Point de rendez-vous',c.meetingPoint||'À préciser',63,90,221,17,theme.accent,{valueSize:11.5,minValueSize:9,maxLines:1});
 infoBox(doc,'Professeur référent',c.teacher||(window.app?.role?.()==='public'?'Référent via ÉcoleDirecte':'À renseigner'),13,112,75,22,theme.accent,{valueSize:11.5,minValueSize:8.4,maxLines:2});infoBox(doc,'Informations importantes',c.extraInfo||'Aucune information particulière.',93,112,191,22,[151,121,0],{valueSize:10.5,minValueSize:8.4,maxLines:2});
 label(doc,'Élèves convoqués',13,144,theme.accent,13.5);font(doc,'anton');doc.setFontSize(10.5);color(doc,C.muted);doc.text(students.length?`${students.length} ÉLÈVE${students.length>1?'S':''}`:'',284,144,{align:'right'});
 if(students.length)drawStudentGrid(doc,students.slice(0,12),{accent:theme.accent,pale:theme.pale});
 else{font(doc,'body','bold');doc.setFontSize(11);color(doc,C.muted);doc.text(window.app?.role?.()==='public'?"Liste transmise via ÉcoleDirecte.":'Aucun élève sélectionné.',13,158)}
}
function drawContinuation(doc,c,students,page,totalPages){
 const theme=spec(c.specialty);let x=13;x+=pill(doc,theme.short,x,42,{bg:theme.pale,fg:theme.accent,maxW:82,height:9,fontSize:8.5})+3;pill(doc,c.ageCategory||'Toutes catégories',x,42,{bg:[255,247,204],fg:[111,91,0],maxW:64,height:9,fontSize:8.5});
 font(doc,'broshk');doc.setFontSize(28);color(doc,C.dark);doc.text('LISTE DES ÉLÈVES',13,61);font(doc,'body','bold');doc.setFontSize(10.5);color(doc,C.muted);const event=fitOne(doc,c.title||c.activity||'Convocation',205,{start:10.5,min:8});doc.text(event.value,13,69);font(doc,'anton');doc.setFontSize(9);doc.text(`${page} / ${totalPages}`,284,62,{align:'right'});
 drawStudentGrid(doc,students,{x:13,y:76,w:271,cols:3,rowsPerPage:10,cellH:10,gap:1.5,accent:theme.accent,pale:theme.pale,nameSize:11.8});
}
async function buildConvocationPdf(c){
 const dep=await ensurePdf(),{jsPDF}=dep||{};if(!jsPDF)throw new Error('Module PDF indisponible.');
 const background=await asset(ASSETS.convocation,'image/png'),students=studentRows(c),first=students.slice(0,12),rest=students.slice(12),continuations=[];for(let i=0;i<rest.length;i+=30)continuations.push(rest.slice(i,i+30));
 const totalPages=1+continuations.length,doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4',compress:true,putOnlyUsedFonts:true});await installFonts(doc);drawBackground(doc,background);drawConvocationFirst(doc,c,first.length?students:[],totalPages);
 continuations.forEach((chunk,index)=>{doc.addPage('a4','landscape');drawBackground(doc,background);drawContinuation(doc,c,chunk,index+2,totalPages)});
 doc.setProperties({title:`Convocation - ${c.title||c.activity||'AS'}`,subject:`${c.ageCategory||'Toutes catégories'} - ${longDate(c.date)}`,author:'Association Sportive du Bon Sauveur',creator:`Application AS Bon Sauveur ${VERSION}`});return doc;
}
function selectedPreview(container,events){
 if(!container)return;container.innerHTML=events.length?events.map(e=>{const p=dateParts(e.date);return `<div class="v2112-mini-event"><b>${esc(p.day)} ${esc(p.monthShort)}</b><span>${esc(e.title||'Rendez-vous')}</span></div>`}).join(''):'<div class="v2112-mini-empty">CHOISISSEZ VOS DATES</div>';
}
function installTvButton(root=document){
 const pdf=[...root.querySelectorAll?.('button[onclick]')||[]].find(button=>/app\.exportCalendarPDF\(\)/.test(button.getAttribute('onclick')||''));
 if(!pdf)return false;
 const existing=pdf.parentElement?.querySelector('[data-v241-tv-export]');
 if(existing){existing.style.setProperty('display','inline-flex','important');return true}
 const button=document.createElement('button');button.type='button';button.className='v19-btn secondary';button.dataset.v241TvExport='1';button.textContent='Export TV';button.onclick=openTvPicker;button.style.setProperty('display','inline-flex','important');pdf.insertAdjacentElement('afterend',button);return true;
}
function closePicker(){document.getElementById('v2112-calendar-modal')?.remove()}
function openCalendarPicker(){
 const events=orderedEvents();if(!events.length)return alert('Aucun événement à exporter.');
 closePicker();const upcoming=events.filter(e=>(e.date||'')>=today()),defaults=(upcoming.length?upcoming:events).slice(0,MAX_PROGRAM_EVENTS),selected=new Set(defaults.map(e=>String(e.id)));
 const wrapper=document.createElement('div');wrapper.id='v2112-calendar-modal';wrapper.className='v19-modal-backdrop v2112-export-backdrop';wrapper.innerHTML=`<div class="v19-modal wide v2112-export-modal" role="dialog" aria-modal="true" aria-labelledby="v2112-export-title"><div class="v19-modal-head"><div><div class="v19-kicker">EXPORT PDF</div><h2 id="v2112-export-title">Créer le programme</h2></div><button class="v19-icon-btn" type="button" aria-label="Fermer" data-close>×</button></div><form class="v19-modal-body" id="v2112-calendar-form"><div class="v2112-picker-layout"><section><div class="v2112-picker-intro"><div><strong>Choisissez jusqu’à 5 dates</strong><p>Les informations sont reprises automatiquement depuis le calendrier.</p></div><span class="v2112-count" data-count>0 / 5</span></div><div class="v2112-event-list">${events.map(e=>{const p=dateParts(e.date);return `<label class="v2112-event-choice"><input type="checkbox" name="eventIds" value="${esc(e.id)}" ${selected.has(String(e.id))?'checked':''}><span class="v2112-choice-date"><b>${esc(p.day)}</b><small>${esc(p.monthShort)}</small></span><span class="v2112-choice-main"><strong>${esc(e.title||'Rendez-vous')}</strong><small>${esc(eventTimeLabel(e))} · ${esc(e.place||'À préciser')}</small><em>${esc(e.ageCategory||'Toutes catégories')} · ${esc(e.specialty||'Association Sportive')}</em></span></label>`}).join('')}</div><div class="v2112-limit" data-limit aria-live="polite"></div></section><aside class="v2112-preview"><div class="v2112-preview-sheet"><div class="v2112-preview-content" data-preview></div></div><span>Aperçu de la composition</span></aside></div><div class="v19-modal-actions v2112-actions"><button class="v19-btn secondary" type="button" data-cancel>Annuler</button><button class="v19-btn yellow" type="submit" data-export>Télécharger le PDF</button></div></form></div>`;
 document.body.appendChild(wrapper);const inputs=[...wrapper.querySelectorAll('input[name="eventIds"]')],count=wrapper.querySelector('[data-count]'),limit=wrapper.querySelector('[data-limit]'),button=wrapper.querySelector('[data-export]'),preview=wrapper.querySelector('[data-preview]');
 const sync=changed=>{const checked=inputs.filter(i=>i.checked);if(checked.length>MAX_PROGRAM_EVENTS&&changed){changed.checked=false;limit.textContent=`Vous pouvez sélectionner ${MAX_PROGRAM_EVENTS} dates maximum.`;limit.classList.add('error')}else{limit.textContent='';limit.classList.remove('error')}const ids=new Set(inputs.filter(i=>i.checked).map(i=>i.value));count.textContent=`${ids.size} / ${MAX_PROGRAM_EVENTS}`;button.disabled=!ids.size;inputs.forEach(i=>i.closest('label')?.classList.toggle('selected',i.checked));selectedPreview(preview,events.filter(e=>ids.has(String(e.id))).slice(0,MAX_PROGRAM_EVENTS))};
 inputs.forEach(i=>i.addEventListener('change',()=>sync(i)));wrapper.querySelector('[data-close]').onclick=closePicker;wrapper.querySelector('[data-cancel]').onclick=closePicker;wrapper.addEventListener('click',e=>{if(e.target===wrapper)closePicker()});wrapper.addEventListener('keydown',e=>{if(e.key==='Escape')closePicker()});wrapper.querySelector('form').onsubmit=async e=>{e.preventDefault();const ids=inputs.filter(i=>i.checked).map(i=>i.value),chosen=events.filter(ev=>ids.includes(String(ev.id))).slice(0,MAX_PROGRAM_EVENTS);if(!chosen.length)return;button.disabled=true;button.textContent='Création du PDF…';try{const doc=await buildProgramPdf(chosen);doc.save(`Programme_AS_${clean(periodLabel(chosen))}.pdf`);closePicker();toast('Programme PDF téléchargé.')}catch(error){console.error(error);button.disabled=false;button.textContent='Télécharger le PDF';limit.textContent='La création du PDF a échoué. Réessayez.';limit.classList.add('error')}};sync();setTimeout(()=>inputs[0]?.focus(),30);
}
function closeTvPicker(){document.getElementById('v241-tv-calendar-modal')?.remove()}
function openTvPicker(){
 const events=orderedEvents();if(!events.length)return alert('Aucun événement à exporter.');
 closeTvPicker();const upcoming=events.filter(e=>(e.date||'')>=today()),defaults=(upcoming.length?upcoming:events).slice(0,MAX_TV_EVENTS),selected=new Set(defaults.map(e=>String(e.id)));
 const wrapper=document.createElement('div');wrapper.id='v241-tv-calendar-modal';wrapper.className='v19-modal-backdrop v2112-export-backdrop';wrapper.innerHTML=`<div class="v19-modal wide v2112-export-modal" role="dialog" aria-modal="true" aria-labelledby="v241-tv-export-title"><div class="v19-modal-head"><div><div class="v19-kicker">EXPORT TV</div><h2 id="v241-tv-export-title">Créer le programme TV</h2></div><button class="v19-icon-btn" type="button" aria-label="Fermer" data-close>×</button></div><form class="v19-modal-body" id="v241-tv-calendar-form"><div class="v2112-picker-layout"><section><div class="v2112-picker-intro"><div><strong>Choisissez jusqu’à 3 dates</strong><p>Le PDF 16:9 reprend automatiquement les informations du calendrier.</p></div><span class="v2112-count" data-count>0 / 3</span></div><div class="v2112-event-list">${events.map(e=>{const p=dateParts(e.date);return `<label class="v2112-event-choice"><input type="checkbox" name="eventIds" value="${esc(e.id)}" ${selected.has(String(e.id))?'checked':''}><span class="v2112-choice-date"><b>${esc(p.day)}</b><small>${esc(p.monthShort)}</small></span><span class="v2112-choice-main"><strong>${esc(e.title||'Rendez-vous')}</strong><small>${esc(eventTimeLabel(e))} · ${esc(e.place||'À préciser')}</small><em>${esc(e.ageCategory||'Toutes catégories')} · ${esc(e.specialty||'Association Sportive')}</em></span></label>`}).join('')}</div><div class="v2112-limit" data-limit aria-live="polite"></div></section><aside class="v2112-preview"><div class="v2112-tv-preview-sheet"><div class="v2112-tv-preview-content" data-preview></div></div><span>Aperçu TV 16:9</span></aside></div><div class="v19-modal-actions v2112-actions"><button class="v19-btn secondary" type="button" data-cancel>Annuler</button><button class="v19-btn v2112-tv-button" type="submit" data-export>Télécharger le PDF TV</button></div></form></div>`;
 document.body.appendChild(wrapper);const inputs=[...wrapper.querySelectorAll('input[name="eventIds"]')],count=wrapper.querySelector('[data-count]'),limit=wrapper.querySelector('[data-limit]'),button=wrapper.querySelector('[data-export]'),preview=wrapper.querySelector('[data-preview]');
 const sync=changed=>{const checked=inputs.filter(i=>i.checked);if(checked.length>MAX_TV_EVENTS&&changed){changed.checked=false;limit.textContent=`Vous pouvez sélectionner ${MAX_TV_EVENTS} dates maximum.`;limit.classList.add('error')}else{limit.textContent='';limit.classList.remove('error')}const ids=new Set(inputs.filter(i=>i.checked).map(i=>i.value));count.textContent=`${ids.size} / ${MAX_TV_EVENTS}`;button.disabled=!ids.size;inputs.forEach(i=>i.closest('label')?.classList.toggle('selected',i.checked));selectedPreview(preview,events.filter(e=>ids.has(String(e.id))).slice(0,MAX_TV_EVENTS))};
 inputs.forEach(i=>i.addEventListener('change',()=>sync(i)));wrapper.querySelector('[data-close]').onclick=closeTvPicker;wrapper.querySelector('[data-cancel]').onclick=closeTvPicker;wrapper.addEventListener('click',e=>{if(e.target===wrapper)closeTvPicker()});wrapper.addEventListener('keydown',e=>{if(e.key==='Escape')closeTvPicker()});wrapper.querySelector('form').onsubmit=async e=>{e.preventDefault();const ids=inputs.filter(i=>i.checked).map(i=>i.value),chosen=events.filter(ev=>ids.includes(String(ev.id))).slice(0,MAX_TV_EVENTS);if(!chosen.length)return;button.disabled=true;button.textContent='Création du PDF TV…';try{const doc=await buildTvPdf(chosen);doc.save(`Programme_TV_AS_${clean(periodLabel(chosen))}.pdf`);closeTvPicker();toast('Programme TV téléchargé.')}catch(error){console.error(error);button.disabled=false;button.textContent='Télécharger le PDF TV';limit.textContent='La création du PDF TV a échoué. Réessayez.';limit.classList.add('error')}};sync();setTimeout(()=>inputs[0]?.focus(),30);
}
async function exportCalendar(selection){
 if(!Array.isArray(selection))return openCalendarPicker();
 const ids=new Set(selection.map(String)),events=orderedEvents().filter(e=>ids.has(String(e.id))).slice(0,MAX_PROGRAM_EVENTS);const doc=await buildProgramPdf(events);doc.save(`Programme_AS_${clean(periodLabel(events))}.pdf`);
}
async function exportCalendarTv(selection){
 if(!Array.isArray(selection))return openTvPicker();
 const ids=new Set(selection.map(String)),events=orderedEvents().filter(e=>ids.has(String(e.id))).slice(0,MAX_TV_EVENTS),doc=await buildTvPdf(events);doc.save(`Programme_TV_AS_${clean(periodLabel(events))}.pdf`);
}
async function exportConvocation(id){
 const c=(read().convocations||[]).find(row=>String(row.id)===String(id));if(!c)return alert('Convocation introuvable.');toast('Création de la convocation…');
 try{const doc=await buildConvocationPdf(c),name=`Convocation_${clean(c.activity||c.title||'AS')}_${clean(c.ageCategory||'Categorie')}_${clean(c.date||'')}.pdf`;doc.save(name);toast('Convocation PDF téléchargée.')}catch(error){console.error(error);alert('Impossible de générer la convocation PDF. Réessayez.')}
}

const pdfApi={version:VERSION,buildProgramPdf,buildTvPdf,buildConvocationPdf,openCalendarPicker,openTvPicker,installTvButton,orderedEvents,eventTimeLabel};
window.addEventListener('bs-app-rendered',()=>installTvButton());
function mountPdfModule(){
 if(!window.app)return false;
 window.app.exportCalendarPDF=exportCalendar;
 window.app.exportCalendarTV=exportCalendarTv;
 window.app.exportConvocation=exportConvocation;
 window.ASV2112_PDF=pdfApi;
 window.ASV2113_PDF=pdfApi;
 window.ASV2114_PDF=pdfApi;
 installTvButton();
 return true;
}
function mountWhenReady(){
 if(!mountPdfModule())return;
 window.removeEventListener('bs-app-rendered',mountWhenReady);
}
if(!mountPdfModule()){
 window.addEventListener('bs-app-rendered',mountWhenReady);
 document.addEventListener('DOMContentLoaded',mountWhenReady,{once:true});
}
})();
