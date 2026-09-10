(() => {
'use strict';

if(!window.app)return;

const VERSION='v21.14-20260910';
const MAX_PROGRAM_EVENTS=5;
const ASSETS={
 programme:'assets/programme-v21-14-hd.png',
 convocation:'assets/convocation-v21-14-hd.png',
 anton:'assets/fonts/Anton-Regular.ttf',
 broshk:'assets/fonts/BroshK.ttf'
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
function orderedEvents(){
 const roleSpecialty=window.app?.roleSpecialty?.();
 return (read().events||[]).filter(e=>!roleSpecialty||e.specialty===roleSpecialty).slice().sort((a,b)=>`${a.date||''}${a.startTime||''}`.localeCompare(`${b.date||''}${b.startTime||''}`));
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
 assetCache.set(path,promise);return promise;
}
async function ensurePdf(){
 if(window.jspdf?.jsPDF)return window.jspdf;
 if(pdfLoader)return pdfLoader;
 pdfLoader=new Promise((resolve,reject)=>{
  const existing=document.querySelector('script[data-v2112-jspdf]');
  if(existing){existing.addEventListener('load',()=>resolve(window.jspdf),{once:true});existing.addEventListener('error',reject,{once:true});return}
  const script=document.createElement('script');script.dataset.v2112Jspdf='1';script.src='https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';script.onload=()=>resolve(window.jspdf);script.onerror=()=>reject(new Error('Le module PDF ne peut pas être chargé.'));document.head.appendChild(script);
 });
 return pdfLoader;
}
async function installFonts(doc){
 const result={anton:false,broshk:false};
 const add=async(path,fileName,family,key)=>{
  try{const data=await asset(path,'font/ttf');doc.addFileToVFS(fileName,data.split(',')[1]);doc.addFont(fileName,family,'normal','Identity-H');result[key]=true}catch(error){console.warn(`Police ${family} indisponible`,error)}
 };
 await Promise.all([add(ASSETS.anton,'Anton-Regular.ttf','Anton','anton'),add(ASSETS.broshk,'BroshK.ttf','BroshK','broshk')]);
 doc.__asFonts=result;return result;
}
function font(doc,kind='body',style='normal'){
 const available=doc.__asFonts||{};
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
function drawProgramEvent(doc,event,slot){
 const {y,h}=slot,x=11.5,w=187,theme=spec(event.specialty),compact=h<=44;card(doc,x,y,w,h,{bg:C.white,border:C.line,r:4.2,line:0.55});fill(doc,theme.accent);doc.roundedRect(x,y,3.2,h,1.5,1.5,'F');
 const dx=x+5.5,dy=y+4,dw=30.5,dh=h-8;card(doc,dx,dy,dw,dh,{bg:theme.pale,border:theme.pale,r:3.5,line:0});
 const dp=dateParts(event.date);font(doc,'anton');color(doc,theme.accent);doc.setFontSize(compact?8.2:9);doc.text(dp.weekday,dx+dw/2,y+8,{align:'center'});doc.setFontSize(compact?30:35);doc.text(dp.day,dx+dw/2,y+(compact?23:Math.min(31,h*.58)),{align:'center'});fill(doc,C.yellow);doc.rect(dx+6,y+h-13,18.5,1.6,'F');font(doc,'anton');color(doc,theme.accent);doc.setFontSize(compact?9.8:10.8);doc.text(`${dp.monthShort}${compact?'':' '+dp.year}`,dx+dw/2,y+h-5,{align:'center'});
 const tx=x+40.5,tw=w-46.5,hasConv=(read().convocations||[]).some(c=>c.id===event.convocationId||(c.date===event.date&&c.specialty===event.specialty&&c.title===event.title));
 const tagY=y+4,pw=pill(doc,theme.short,tx,tagY,{bg:theme.pale,fg:theme.accent,maxW:hasConv?64:75,height:8,fontSize:8.2}),categoryX=tx+pw+2.5,categoryRight=hasConv?x+w-37.5:x+w-5;
 if(event.ageCategory&&categoryRight-categoryX>=22)pill(doc,event.ageCategory,categoryX,tagY,{bg:[255,247,204],fg:[111,91,0],maxW:categoryRight-categoryX,height:8,fontSize:8.2});
 const lineY=y+h-(compact?13:16),title=compact?(()=>{const one=fitOne(doc,displayText(event.title||'Rendez-vous').toUpperCase(),tw,{start:21,min:13,kind:'broshk'});return{lines:[one.value],size:one.size}})():fitLines(doc,displayText(event.title||'Rendez-vous').toUpperCase(),tw,{start:22,min:14,maxLines:2,kind:'broshk'});font(doc,'broshk');doc.setFontSize(title.size);color(doc,C.dark);const titleGap=mm(title.size)*.94;title.lines.forEach((line,i)=>doc.text(line,tx,y+(compact?19:20)+i*titleGap));
 doc.setDrawColor(...C.line);doc.setLineWidth(.35);doc.line(tx,lineY,tx+tw,lineY);
 const cols=[{x:tx,w:43,l:'CATÉGORIE',v:event.ageCategory||'Toutes catégories'},{x:tx+47,w:39,l:'HORAIRES',v:`${event.startTime||'—'}${event.endTime?' - '+event.endTime:''}`},{x:tx+90,w:tw-90,l:'LIEU',v:event.place||'À préciser'}];
 cols.forEach(c=>{label(doc,c.l,c.x,lineY+4.6,theme.accent,8.2);value(doc,c.v,c.x,lineY+10.7,c.w,{size:11.2,min:7.8})});
 if(hasConv){fill(doc,C.yellow);doc.roundedRect(x+w-34.5,tagY,29.5,8,4,4,'F');font(doc,'anton');doc.setFontSize(7.8);color(doc,[78,65,0]);doc.text('CONVOCATION',x+w-19.75,tagY+5.45,{align:'center'})}
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
 const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true,putOnlyUsedFonts:true});await installFonts(doc);doc.addImage(background,'PNG',0,0,210,297,undefined,'FAST');
 programSlots(events.length).forEach((slot,i)=>drawProgramEvent(doc,events[i],slot));
 doc.setProperties({title:`Programme AS - ${periodLabel(events)}`,subject:'Calendrier de l’Association Sportive du Bon Sauveur',author:'Association Sportive du Bon Sauveur',creator:`Application AS Bon Sauveur ${VERSION}`});return doc;
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
 infoBox(doc,'Professeur référent',c.teacher||'À renseigner',13,112,75,22,theme.accent,{valueSize:11.5,minValueSize:9,maxLines:2});infoBox(doc,'Informations importantes',c.extraInfo||'Aucune information particulière.',93,112,191,22,[151,121,0],{valueSize:10.5,minValueSize:8.4,maxLines:2});
 label(doc,'Élèves convoqués',13,144,theme.accent,13.5);font(doc,'anton');doc.setFontSize(10.5);color(doc,C.muted);doc.text(students.length?`${students.length} ÉLÈVE${students.length>1?'S':''}`:'',284,144,{align:'right'});
 if(students.length)drawStudentGrid(doc,students.slice(0,12),{accent:theme.accent,pale:theme.pale});
 else{font(doc,'body','bold');doc.setFontSize(11);color(doc,C.muted);doc.text(window.app?.role?.()==='public'?"Liste nominative disponible dans l’espace sécurisé.":'Aucun élève sélectionné.',13,158)}
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
function closePicker(){document.getElementById('v2112-calendar-modal')?.remove()}
function openCalendarPicker(){
 const events=orderedEvents();if(!events.length)return alert('Aucun événement à exporter.');
 closePicker();const upcoming=events.filter(e=>(e.date||'')>=today()),defaults=(upcoming.length?upcoming:events).slice(0,MAX_PROGRAM_EVENTS),selected=new Set(defaults.map(e=>String(e.id)));
 const wrapper=document.createElement('div');wrapper.id='v2112-calendar-modal';wrapper.className='v19-modal-backdrop v2112-export-backdrop';wrapper.innerHTML=`<div class="v19-modal wide v2112-export-modal" role="dialog" aria-modal="true" aria-labelledby="v2112-export-title"><div class="v19-modal-head"><div><div class="v19-kicker">EXPORT PDF</div><h2 id="v2112-export-title">Créer le programme</h2></div><button class="v19-icon-btn" type="button" aria-label="Fermer" data-close>×</button></div><form class="v19-modal-body" id="v2112-calendar-form"><div class="v2112-picker-layout"><section><div class="v2112-picker-intro"><div><strong>Choisissez jusqu’à 5 dates</strong><p>Les informations sont reprises automatiquement depuis le calendrier.</p></div><span class="v2112-count" data-count>0 / 5</span></div><div class="v2112-event-list">${events.map(e=>{const p=dateParts(e.date);return `<label class="v2112-event-choice"><input type="checkbox" name="eventIds" value="${esc(e.id)}" ${selected.has(String(e.id))?'checked':''}><span class="v2112-choice-date"><b>${esc(p.day)}</b><small>${esc(p.monthShort)}</small></span><span class="v2112-choice-main"><strong>${esc(e.title||'Rendez-vous')}</strong><small>${esc(e.startTime||'—')}${e.endTime?' - '+esc(e.endTime):''} · ${esc(e.place||'À préciser')}</small><em>${esc(e.ageCategory||'Toutes catégories')} · ${esc(e.specialty||'Association Sportive')}</em></span></label>`}).join('')}</div><div class="v2112-limit" data-limit aria-live="polite"></div></section><aside class="v2112-preview"><div class="v2112-preview-sheet"><div class="v2112-preview-content" data-preview></div></div><span>Aperçu de la composition</span></aside></div><div class="v19-modal-actions v2112-actions"><button class="v19-btn secondary" type="button" data-cancel>Annuler</button><button class="v19-btn yellow" type="submit" data-export>Télécharger le PDF</button></div></form></div>`;
 document.body.appendChild(wrapper);const inputs=[...wrapper.querySelectorAll('input[name="eventIds"]')],count=wrapper.querySelector('[data-count]'),limit=wrapper.querySelector('[data-limit]'),button=wrapper.querySelector('[data-export]'),preview=wrapper.querySelector('[data-preview]');
 const sync=changed=>{const checked=inputs.filter(i=>i.checked);if(checked.length>MAX_PROGRAM_EVENTS&&changed){changed.checked=false;limit.textContent=`Vous pouvez sélectionner ${MAX_PROGRAM_EVENTS} dates maximum.`;limit.classList.add('error')}else{limit.textContent='';limit.classList.remove('error')}const ids=new Set(inputs.filter(i=>i.checked).map(i=>i.value));count.textContent=`${ids.size} / ${MAX_PROGRAM_EVENTS}`;button.disabled=!ids.size;inputs.forEach(i=>i.closest('label')?.classList.toggle('selected',i.checked));selectedPreview(preview,events.filter(e=>ids.has(String(e.id))).slice(0,MAX_PROGRAM_EVENTS))};
 inputs.forEach(i=>i.addEventListener('change',()=>sync(i)));wrapper.querySelector('[data-close]').onclick=closePicker;wrapper.querySelector('[data-cancel]').onclick=closePicker;wrapper.addEventListener('click',e=>{if(e.target===wrapper)closePicker()});wrapper.addEventListener('keydown',e=>{if(e.key==='Escape')closePicker()});wrapper.querySelector('form').onsubmit=async e=>{e.preventDefault();const ids=inputs.filter(i=>i.checked).map(i=>i.value),chosen=events.filter(ev=>ids.includes(String(ev.id))).slice(0,MAX_PROGRAM_EVENTS);if(!chosen.length)return;button.disabled=true;button.textContent='Création du PDF…';try{const doc=await buildProgramPdf(chosen);doc.save(`Programme_AS_${clean(periodLabel(chosen))}.pdf`);closePicker();toast('Programme PDF téléchargé.')}catch(error){console.error(error);button.disabled=false;button.textContent='Télécharger le PDF';limit.textContent='La création du PDF a échoué. Réessayez.';limit.classList.add('error')}};sync();setTimeout(()=>inputs[0]?.focus(),30);
}
async function exportCalendar(selection){
 if(!Array.isArray(selection))return openCalendarPicker();
 const ids=new Set(selection.map(String)),events=orderedEvents().filter(e=>ids.has(String(e.id))).slice(0,MAX_PROGRAM_EVENTS);const doc=await buildProgramPdf(events);doc.save(`Programme_AS_${clean(periodLabel(events))}.pdf`);
}
async function exportConvocation(id){
 const c=(read().convocations||[]).find(row=>String(row.id)===String(id));if(!c)return alert('Convocation introuvable.');toast('Création de la convocation…');
 try{const doc=await buildConvocationPdf(c),name=`Convocation_${clean(c.activity||c.title||'AS')}_${clean(c.ageCategory||'Categorie')}_${clean(c.date||'')}.pdf`;doc.save(name);toast('Convocation PDF téléchargée.')}catch(error){console.error(error);alert('Impossible de générer la convocation PDF. Réessayez.')}
}

window.app.exportCalendarPDF=exportCalendar;
window.app.exportConvocation=exportConvocation;
const pdfApi={version:VERSION,buildProgramPdf,buildConvocationPdf,openCalendarPicker};
window.ASV2112_PDF=pdfApi;
window.ASV2113_PDF=pdfApi;
window.ASV2114_PDF=pdfApi;
})();
