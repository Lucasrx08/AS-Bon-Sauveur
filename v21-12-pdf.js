(() => {
'use strict';

if(!window.app)return;

const VERSION='v21.12-20260909';
const ASSETS={
 programme:'assets/programme-v21-12.png',
 convocation:'assets/convocation-v21-12.png',
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
function pill(doc,text,x,y,{bg=C.soft,fg=C.blue,maxW=80,height=8}={}){
 const value=String(text||'').toUpperCase();font(doc,'anton');doc.setFontSize(7.2);let shown=value;
 while(shown.length>3&&doc.getTextWidth(shown)+7>maxW)shown=shown.slice(0,-2).trim()+'…';
 const w=Math.min(maxW,Math.max(20,doc.getTextWidth(shown)+7));fill(doc,bg);doc.roundedRect(x,y,w,height,height/2,height/2,'F');color(doc,fg);doc.text(shown,x+w/2,y+5.35,{align:'center'});return w;
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
function label(doc,text,x,y,accent=C.blue){font(doc,'anton');doc.setFontSize(6.3);color(doc,accent);doc.text(String(text||'').toUpperCase(),x,y)}
function value(doc,text,x,y,maxW,{size=9,min=6.5,kind='body',style='bold',align='left'}={}){
 const out=fitOne(doc,text,maxW,{start:size,min,kind,style});color(doc,C.ink);doc.text(out.value,align==='center'?x+maxW/2:x,y,{align});
}
function infoBox(doc,labelText,valueText,x,y,w,h,accent,{valueSize=9,maxLines=2}={}){
 card(doc,x,y,w,h,{bg:C.soft,border:C.line,r:3,line:0.35});label(doc,labelText,x+4,y+6,accent);
 const out=fitLines(doc,valueText||'—',w-8,{start:valueSize,min:6.2,maxLines,kind:'body',style:'bold'});color(doc,C.ink);font(doc,'body','bold');doc.setFontSize(out.size);const gap=mm(out.size)*1.04;out.lines.forEach((line,i)=>doc.text(line,x+4,y+12+i*gap));
}
function drawProgramEvent(doc,event,slot){
 const {y,h}=slot,x=11.5,w=187,theme=spec(event.specialty);card(doc,x,y,w,h,{bg:C.white,border:C.line,r:5,line:0.55});fill(doc,theme.accent);doc.roundedRect(x,y,3.2,h,1.5,1.5,'F');
 const dx=x+6,dy=y+7,dw=32,dh=h-14;card(doc,dx,dy,dw,dh,{bg:theme.pale,border:theme.pale,r:4,line:0});
 const dp=dateParts(event.date);font(doc,'anton');color(doc,theme.accent);doc.setFontSize(h>72?35:29);doc.text(dp.day,dx+dw/2,dy+dh*.54,{align:'center'});doc.setFontSize(h>72?9:7.5);doc.text(dp.monthShort,dx+dw/2,dy+dh*.74,{align:'center'});doc.setFontSize(5.4);doc.text(dp.weekday,dx+dw/2,dy+dh*.91,{align:'center'});
 const tx=x+42,tw=w-48,hasConv=(read().convocations||[]).some(c=>c.id===event.convocationId||(c.date===event.date&&c.specialty===event.specialty&&c.title===event.title));
 const pw=pill(doc,theme.short,tx,y+7,{bg:theme.pale,fg:theme.accent,maxW:hasConv?67:78,height:7.5}),categoryX=tx+pw+3,categoryRight=hasConv?x+w-39:x+w-6;
 if(event.ageCategory&&categoryRight-categoryX>=20)pill(doc,event.ageCategory,categoryX,y+7,{bg:[255,247,204],fg:[111,91,0],maxW:categoryRight-categoryX,height:7.5});
 const title=fitLines(doc,displayText(event.title||'Rendez-vous').toUpperCase(),tw,{start:h>72?24:20,min:10,maxLines:2,kind:'broshk'});font(doc,'broshk');doc.setFontSize(title.size);color(doc,C.dark);const gap=mm(title.size)*.96;title.lines.forEach((line,i)=>doc.text(line,tx,y+24+i*gap));
 const lineY=y+h-21;doc.setDrawColor(...C.line);doc.setLineWidth(.35);doc.line(tx,lineY,tx+tw,lineY);
 const cols=[{x:tx,w:40,l:'CATÉGORIE',v:event.ageCategory||'Toutes catégories'},{x:tx+44,w:35,l:'HORAIRES',v:`${event.startTime||'—'}${event.endTime?' - '+event.endTime:''}`},{x:tx+83,w:tw-83,l:'LIEU',v:event.place||'À préciser'}];
 cols.forEach(c=>{label(doc,c.l,c.x,lineY+6,theme.accent);value(doc,c.v,c.x,lineY+13,c.w,{size:7.6,min:5.8})});
 if(hasConv){fill(doc,C.yellow);doc.roundedRect(x+w-36,y+7,30,7.5,3.75,3.75,'F');font(doc,'anton');doc.setFontSize(6.2);color(doc,[78,65,0]);doc.text('CONVOCATION',x+w-21,y+12.25,{align:'center'})}
}
function programSlots(count){
 if(count===1)return[{y:77,h:118}];
 if(count===2)return[{y:65,h:88},{y:161,h:88}];
 return[{y:57,h:62},{y:128,h:62},{y:199,h:62}];
}
async function buildProgramPdf(selectedEvents){
 const dep=await ensurePdf(),{jsPDF}=dep||{};if(!jsPDF)throw new Error('Module PDF indisponible.');
 const events=(selectedEvents||[]).slice(0,3);if(!events.length)throw new Error('Sélectionnez au moins un événement.');
 const [background]=await Promise.all([asset(ASSETS.programme,'image/png')]);
 const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true,putOnlyUsedFonts:true});await installFonts(doc);doc.addImage(background,'PNG',0,0,210,297,undefined,'FAST');
 font(doc,'anton');doc.setFontSize(13);color(doc,C.blue);doc.text(periodLabel(events),14,49);
 fill(doc,C.yellow);doc.rect(14,52,34,1.8,'F');programSlots(events.length).forEach((slot,i)=>drawProgramEvent(doc,events[i],slot));
 doc.setProperties({title:`Programme AS - ${periodLabel(events)}`,subject:'Calendrier de l’Association Sportive du Bon Sauveur',author:'Association Sportive du Bon Sauveur',creator:`Application AS Bon Sauveur ${VERSION}`});return doc;
}
function studentRows(convocation){
 if(window.app?.role?.()==='public')return[];
 const data=read(),students=new Map((data.students||[]).map(s=>[String(s.id),s])),licenses=new Map((data.licenses||[]).map(l=>[String(l.studentId),l]));
 return (convocation.studentIds||[]).map(id=>{const s=students.get(String(id))||{},l=licenses.get(String(id))||{};return{name:s.fullName||l.fullName||window.app?.studentName?.(id)||'',className:s.className||l.className||''}}).filter(x=>x.name).sort((a,b)=>a.name.localeCompare(b.name,'fr'));
}
function drawBackground(doc,data){doc.addImage(data,'PNG',0,0,297,210,undefined,'FAST')}
function drawConvocationHeading(doc,c,totalPages){
 const theme=spec(c.specialty);let x=13;x+=pill(doc,theme.short,x,43,{bg:theme.pale,fg:theme.accent,maxW:78,height:8})+3;pill(doc,c.ageCategory||'Toutes catégories',x,43,{bg:[255,247,204],fg:[111,91,0],maxW:60,height:8});
 const title=fitLines(doc,displayText(c.title||c.activity||'Convocation').toUpperCase(),270,{start:25,min:14,maxLines:2,kind:'broshk'});font(doc,'broshk');doc.setFontSize(title.size);color(doc,C.dark);const gap=mm(title.size)*.96;title.lines.forEach((line,i)=>doc.text(line,13,61+i*gap));
 if(totalPages>1){font(doc,'anton');doc.setFontSize(7);color(doc,C.muted);doc.text(`1 / ${totalPages}`,284,66,{align:'right'})}
}
function drawDateCard(doc,c){
 const theme=spec(c.specialty),dp=dateParts(c.date),x=13,y=78,w=51,h=50;card(doc,x,y,w,h,{bg:theme.pale,border:theme.pale,r:5,line:0});font(doc,'anton');color(doc,theme.accent);doc.setFontSize(7);doc.text(dp.weekday,x+5,y+8);doc.setFontSize(31);doc.text(dp.day,x+5,y+29);fill(doc,C.yellow);doc.rect(x+5,y+33,22,1.8,'F');doc.setFontSize(9);doc.text(`${dp.monthShort} ${dp.year}`,x+5,y+43);
}
function drawStudentGrid(doc,rows,{x=13,y=177,w=271,cols=3,rowsPerPage=4,cellH=4.7,gap=1.2}={}){
 const colGap=2.2,colW=(w-colGap*(cols-1))/cols;rows.slice(0,cols*rowsPerPage).forEach((student,index)=>{
  const col=index%cols,row=Math.floor(index/cols),cx=x+col*(colW+colGap),cy=y+row*(cellH+gap);fill(doc,C.soft);doc.setDrawColor(...C.line);doc.setLineWidth(.25);doc.roundedRect(cx,cy,colW,cellH,1.5,1.5,'FD');
  const display=student.className?`${student.name} · ${student.className}`:student.name;value(doc,display,cx+2,cy+3.25,colW-4,{size:6.3,min:4.8});
 });
}
function drawConvocationFirst(doc,c,students,totalPages){
 const theme=spec(c.specialty);drawConvocationHeading(doc,c,totalPages);drawDateCard(doc,c);
 infoBox(doc,'Lieu',c.place||'À préciser',70,78,112,23,theme.accent,{valueSize:10,maxLines:2});infoBox(doc,'Départ',c.departure||'À préciser',187,78,45,23,theme.accent,{valueSize:11,maxLines:1});infoBox(doc,'Retour',c.returnTime||'À préciser',237,78,47,23,theme.accent,{valueSize:11,maxLines:1});infoBox(doc,'Point de rendez-vous',c.meetingPoint||'À préciser',70,105,214,23,theme.accent,{valueSize:10,maxLines:2});
 infoBox(doc,'Professeur référent',c.teacher||'À renseigner',13,134,73,30,theme.accent,{valueSize:9,maxLines:2});infoBox(doc,'Informations importantes',c.extraInfo||'Aucune information particulière.',91,134,193,30,[151,121,0],{valueSize:8.6,maxLines:3});
 label(doc,'Élèves convoqués',13,172,theme.accent);font(doc,'anton');doc.setFontSize(6.3);color(doc,C.muted);doc.text(students.length?`${students.length} ÉLÈVE${students.length>1?'S':''}`:'',284,172,{align:'right'});
 if(students.length)drawStudentGrid(doc,students.slice(0,12));
 else{font(doc,'body','bold');doc.setFontSize(7.5);color(doc,C.muted);doc.text(window.app?.role?.()==='public'?"Liste nominative disponible dans l’espace sécurisé.":'Aucun élève sélectionné.',13,184)}
}
function drawContinuation(doc,c,students,page,totalPages){
 const theme=spec(c.specialty);let x=13;x+=pill(doc,theme.short,x,43,{bg:theme.pale,fg:theme.accent,maxW:78,height:8})+3;pill(doc,c.ageCategory||'Toutes catégories',x,43,{bg:[255,247,204],fg:[111,91,0],maxW:60,height:8});
 font(doc,'broshk');doc.setFontSize(22);color(doc,C.dark);doc.text('LISTE DES ÉLÈVES',13,62);font(doc,'body','bold');doc.setFontSize(8);color(doc,C.muted);const event=fitOne(doc,c.title||c.activity||'Convocation',180,{start:8,min:6.5});doc.text(event.value,13,68);font(doc,'anton');doc.setFontSize(7);doc.text(`${page} / ${totalPages}`,284,64,{align:'right'});
 drawStudentGrid(doc,students,{x:13,y:74,w:271,cols:3,rowsPerPage:15,cellH:6.6,gap:1.35});
}
async function buildConvocationPdf(c){
 const dep=await ensurePdf(),{jsPDF}=dep||{};if(!jsPDF)throw new Error('Module PDF indisponible.');
 const background=await asset(ASSETS.convocation,'image/png'),students=studentRows(c),first=students.slice(0,12),rest=students.slice(12),continuations=[];for(let i=0;i<rest.length;i+=45)continuations.push(rest.slice(i,i+45));
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
 closePicker();const upcoming=events.filter(e=>(e.date||'')>=today()),defaults=(upcoming.length?upcoming:events).slice(0,3),selected=new Set(defaults.map(e=>String(e.id)));
 const wrapper=document.createElement('div');wrapper.id='v2112-calendar-modal';wrapper.className='v19-modal-backdrop v2112-export-backdrop';wrapper.innerHTML=`<div class="v19-modal wide v2112-export-modal" role="dialog" aria-modal="true" aria-labelledby="v2112-export-title"><div class="v19-modal-head"><div><div class="v19-kicker">EXPORT PDF</div><h2 id="v2112-export-title">Créer le programme</h2></div><button class="v19-icon-btn" type="button" aria-label="Fermer" data-close>×</button></div><form class="v19-modal-body" id="v2112-calendar-form"><div class="v2112-picker-layout"><section><div class="v2112-picker-intro"><div><strong>Choisissez jusqu’à 3 dates</strong><p>Les informations sont reprises automatiquement depuis le calendrier.</p></div><span class="v2112-count" data-count>0 / 3</span></div><div class="v2112-event-list">${events.map(e=>{const p=dateParts(e.date);return `<label class="v2112-event-choice"><input type="checkbox" name="eventIds" value="${esc(e.id)}" ${selected.has(String(e.id))?'checked':''}><span class="v2112-choice-date"><b>${esc(p.day)}</b><small>${esc(p.monthShort)}</small></span><span class="v2112-choice-main"><strong>${esc(e.title||'Rendez-vous')}</strong><small>${esc(e.startTime||'—')}${e.endTime?' - '+esc(e.endTime):''} · ${esc(e.place||'À préciser')}</small><em>${esc(e.ageCategory||'Toutes catégories')} · ${esc(e.specialty||'Association Sportive')}</em></span></label>`}).join('')}</div><div class="v2112-limit" data-limit aria-live="polite"></div></section><aside class="v2112-preview"><div class="v2112-preview-sheet"><div class="v2112-preview-content" data-preview></div></div><span>Aperçu de la composition</span></aside></div><div class="v19-modal-actions v2112-actions"><button class="v19-btn secondary" type="button" data-cancel>Annuler</button><button class="v19-btn yellow" type="submit" data-export>Télécharger le PDF</button></div></form></div>`;
 document.body.appendChild(wrapper);const inputs=[...wrapper.querySelectorAll('input[name="eventIds"]')],count=wrapper.querySelector('[data-count]'),limit=wrapper.querySelector('[data-limit]'),button=wrapper.querySelector('[data-export]'),preview=wrapper.querySelector('[data-preview]');
 const sync=changed=>{const checked=inputs.filter(i=>i.checked);if(checked.length>3&&changed){changed.checked=false;limit.textContent='Vous pouvez sélectionner 3 dates maximum.';limit.classList.add('error')}else{limit.textContent='';limit.classList.remove('error')}const ids=new Set(inputs.filter(i=>i.checked).map(i=>i.value));count.textContent=`${ids.size} / 3`;button.disabled=!ids.size;inputs.forEach(i=>i.closest('label')?.classList.toggle('selected',i.checked));selectedPreview(preview,events.filter(e=>ids.has(String(e.id))).slice(0,3))};
 inputs.forEach(i=>i.addEventListener('change',()=>sync(i)));wrapper.querySelector('[data-close]').onclick=closePicker;wrapper.querySelector('[data-cancel]').onclick=closePicker;wrapper.addEventListener('click',e=>{if(e.target===wrapper)closePicker()});wrapper.addEventListener('keydown',e=>{if(e.key==='Escape')closePicker()});wrapper.querySelector('form').onsubmit=async e=>{e.preventDefault();const ids=inputs.filter(i=>i.checked).map(i=>i.value),chosen=events.filter(ev=>ids.includes(String(ev.id))).slice(0,3);if(!chosen.length)return;button.disabled=true;button.textContent='Création du PDF…';try{const doc=await buildProgramPdf(chosen);doc.save(`Programme_AS_${clean(periodLabel(chosen))}.pdf`);closePicker();toast('Programme PDF téléchargé.')}catch(error){console.error(error);button.disabled=false;button.textContent='Télécharger le PDF';limit.textContent='La création du PDF a échoué. Réessayez.';limit.classList.add('error')}};sync();setTimeout(()=>inputs[0]?.focus(),30);
}
async function exportCalendar(selection){
 if(!Array.isArray(selection))return openCalendarPicker();
 const ids=new Set(selection.map(String)),events=orderedEvents().filter(e=>ids.has(String(e.id))).slice(0,3);const doc=await buildProgramPdf(events);doc.save(`Programme_AS_${clean(periodLabel(events))}.pdf`);
}
async function exportConvocation(id){
 const c=(read().convocations||[]).find(row=>String(row.id)===String(id));if(!c)return alert('Convocation introuvable.');toast('Création de la convocation…');
 try{const doc=await buildConvocationPdf(c),name=`Convocation_${clean(c.activity||c.title||'AS')}_${clean(c.ageCategory||'Categorie')}_${clean(c.date||'')}.pdf`;doc.save(name);toast('Convocation PDF téléchargée.')}catch(error){console.error(error);alert('Impossible de générer la convocation PDF. Réessayez.')}
}

window.app.exportCalendarPDF=exportCalendar;
window.app.exportConvocation=exportConvocation;
window.ASV2112_PDF={version:VERSION,buildProgramPdf,buildConvocationPdf,openCalendarPicker};
})();
