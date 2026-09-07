(() => {
'use strict';
const V=window.ASV7;if(!V||!window.app)return;

const COLORS={navy:'#13213A',blue:'#0757C9',yellow:'#FFD21A',light:'#F4F7FB',muted:'#66758D',line:'#DCE5F0',white:'#FFFFFF',
 football:'#2582E9',escalade:'#7655D9',gym:'#9B58D0',as:'#E5B900',green:'#18A566',orange:'#E99B18'};
const specColor=s=>s==='Section Football'?COLORS.football:s==='Option Escalade'?COLORS.escalade:s==='Sport-études Gymnastique'?COLORS.gym:COLORS.as;
const specShort=s=>s==='Section Football'?'FOOTBALL':s==='Option Escalade'?'ESCALADE':s==='Sport-études Gymnastique'?'GYMNASTIQUE':'AS';

function sx(v){return V.esc(String(v??''))}
function lines(text,max=26,maxLines=2){
  const words=String(text||'').split(/\s+/).filter(Boolean),out=[];let cur='';
  for(const w of words){const t=cur?cur+' '+w:w;if(t.length<=max)cur=t;else{if(cur)out.push(cur);cur=w;if(out.length>=maxLines-1)break}}
  if(cur&&out.length<maxLines)out.push(cur);
  if(words.join(' ').length>out.join(' ').length&&out.length)out[out.length-1]=out[out.length-1].replace(/[.…]*$/,'')+'…';
  return out.length?out:[''];
}
function tspans(text,x,y,max=28,maxLines=2,line=4.7,attrs=''){
  return `<text x="${x}" y="${y}" ${attrs}>${lines(text,max,maxLines).map((l,i)=>`<tspan x="${x}" dy="${i?line:0}">${sx(l)}</tspan>`).join('')}</text>`;
}
function icon(kind,x,y,c=COLORS.blue){
  const sw=1.35;
  if(kind==='clock')return `<g transform="translate(${x} ${y})" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"><circle cx="0" cy="0" r="4"/><path d="M0-2.5v3l2 1.4"/></g>`;
  if(kind==='pin')return `<g transform="translate(${x} ${y})" fill="none" stroke="${c}" stroke-width="${sw}"><path d="M0 4s4-4.3 4-7a4 4 0 1 0-8 0c0 2.7 4 7 4 7Z"/><circle cx="0" cy="-3" r="1.2"/></g>`;
  if(kind==='users')return `<g transform="translate(${x} ${y})" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"><circle cx="-2.3" cy="-2.2" r="1.8"/><circle cx="2.3" cy="-2.2" r="1.8"/><path d="M-5 3c.3-2.3 1.7-3.4 3.7-3.4S2 1 2.3 3M.2 3C.5.7 1.8-.4 3.8-.4S7 1 7.3 3"/></g>`;
  if(kind==='teacher')return `<g transform="translate(${x} ${y})" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"><circle cx="0" cy="-2.5" r="2.1"/><path d="M-4.2 4c.4-2.9 1.9-4.3 4.2-4.3S3.8 1.1 4.2 4"/></g>`;
  if(kind==='info')return `<g transform="translate(${x} ${y})"><circle cx="0" cy="0" r="4" fill="${c}"/><text x="0" y="2.2" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="6" font-weight="900" fill="#fff">i</text></g>`;
  if(kind==='calendar')return `<g transform="translate(${x} ${y})" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"><rect x="-4" y="-3.5" width="8" height="7.5" rx="1"/><path d="M-4-1.2h8M-2.3-5v3M2.3-5v3"/></g>`;
  return '';
}
function defs(){
  return `<defs>
    <pattern id="v8dots" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".45" fill="#DCE5F0"/></pattern>
    <linearGradient id="navyGrad" x1="0" x2="1"><stop offset="0" stop-color="#13213A"/><stop offset="1" stop-color="#0B397C"/></linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="1.2" stdDeviation="1.2" flood-color="#13213A" flood-opacity=".12"/></filter>
  </defs>`;
}
async function logoData(){return await V.logoData()}
function pageFrame(logo,title,sub,right=''){
  return `${defs()}<rect width="297" height="210" fill="#F5F8FC"/>
  <rect x="0" y="0" width="297" height="42" fill="url(#navyGrad)"/>
  <polygon points="224,0 297,0 297,42 259,42" fill="#0757C9"/>
  <polygon points="274,0 297,0 297,42 289,42" fill="#FFD21A"/>
  <circle cx="25" cy="21" r="15.5" fill="#fff" opacity=".98"/>
  ${logo?`<image href="${logo}" x="11.5" y="7.5" width="27" height="27" preserveAspectRatio="xMidYMid meet"/>`:''}
  <text x="49" y="11.5" font-family="Arial,Helvetica,sans-serif" font-size="3.4" font-weight="700" letter-spacing=".65" fill="#C7D2E4">ASSOCIATION SPORTIVE DU BON SAUVEUR</text>
  <text x="49" y="27" font-family="Arial,Helvetica,sans-serif" font-size="11.5" font-weight="900" letter-spacing="-.25" fill="#fff">${sx(title)}</text>
  <text x="49" y="35" font-family="Arial,Helvetica,sans-serif" font-size="4.2" font-weight="600" letter-spacing=".25" fill="#FFD21A">${sx(sub)}</text>
  ${right?`<text x="286" y="29" text-anchor="end" font-family="Arial,Helvetica,sans-serif" font-size="4.2" font-weight="900" fill="#13213A">${sx(right)}</text>`:''}
  <rect x="0" y="203" width="297" height="7" fill="#13213A"/><rect x="0" y="203" width="60" height="7" fill="#FFD21A"/>
  <text x="10" y="207.8" font-family="Arial,Helvetica,sans-serif" font-size="2.7" font-weight="800" fill="#13213A">BON SAUVEUR · SAINT-LÔ</text>`;
}
function pageClose(page,total){return `<text x="287" y="207.8" text-anchor="end" font-family="Arial,Helvetica,sans-serif" font-size="2.7" font-weight="700" fill="#fff">${page}/${total}</text></svg>`}

function calendarCard(e,x,y,w,h,i,hasConv){
  const accent=specColor(e.specialty),dt=new Date(e.date+'T12:00:00');
  const day=String(dt.getDate()).padStart(2,'0'),month=dt.toLocaleDateString('fr-FR',{month:'short'}).replace('.','').toUpperCase();
  return `<g filter="url(#shadow)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4.5" fill="#fff" stroke="#DCE5F0"/>
    <rect x="${x}" y="${y}" width="${w}" height="5.8" rx="4.5" fill="${accent}"/><rect x="${x}" y="${y+3}" width="${w}" height="3" fill="${accent}"/>
    <circle cx="${x+13}" cy="${y+17}" r="8.2" fill="#13213A"/>
    <text x="${x+13}" y="${y+16.5}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="7.5" font-weight="900" fill="#fff">${day}</text>
    <text x="${x+13}" y="${y+21}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="2.7" font-weight="800" fill="#FFD21A">${month}</text>
    ${tspans(e.title,x+25,y+14,26,2,4.7,'font-family="Arial,Helvetica,sans-serif" font-size="5.3" font-weight="900" fill="#13213A"')}
    <rect x="${x+25}" y="${y+26}" width="${Math.min(42,Math.max(18,(e.specialty||'').length*1.25))}" height="5.2" rx="2.6" fill="${accent}" opacity=".12"/>
    <text x="${x+27}" y="${y+29.7}" font-family="Arial,Helvetica,sans-serif" font-size="2.9" font-weight="800" fill="${accent}">${sx(e.specialty||'')}</text>
    ${icon('clock',x+10,y+38,COLORS.blue)}<text x="${x+17}" y="${y+39.3}" font-family="Arial,Helvetica,sans-serif" font-size="3.35" font-weight="700" fill="#13213A">${sx(e.startTime||'—')}${e.endTime?` → ${sx(e.endTime)}`:''}</text>
    ${icon('pin',x+10,y+48,COLORS.blue)}${tspans(e.place||'—',x+17,y+49,27,1,4,'font-family="Arial,Helvetica,sans-serif" font-size="3.15" font-weight="600" fill="#66758D"')}
    ${icon('users',x+10,y+57,COLORS.blue)}<text x="${x+17}" y="${y+58.3}" font-family="Arial,Helvetica,sans-serif" font-size="3.1" font-weight="600" fill="#66758D">${sx(e.ageCategory||'Toutes catégories')}</text>
    ${hasConv?`<rect x="${x+w-29}" y="${y+7}" width="24" height="6.5" rx="3.25" fill="#FFD21A"/><text x="${x+w-17}" y="${y+11.4}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="2.7" font-weight="900" fill="#13213A">CONVOCATION</text>`:''}
    <text x="${x+w-5}" y="${y+h-4}" text-anchor="end" font-family="Arial,Helvetica,sans-serif" font-size="10" font-weight="900" fill="${accent}" opacity=".08">${String(i+1).padStart(2,'0')}</text>
  </g>`;
}
function calendarPages(events,d,logo){
  const chunks=[];for(let i=0;i<events.length;i+=6)chunks.push(events.slice(i,i+6));
  return chunks.map((chunk,pi)=>{
    const first=chunk[0],last=chunk[chunk.length-1],period=`${V.fmtShort(first.date)} → ${V.fmtShort(last.date)}`;
    let s=`<svg xmlns="http://www.w3.org/2000/svg" width="297mm" height="210mm" viewBox="0 0 297 210">${pageFrame(logo,'CALENDRIER AS',V.edu()||'Association Sportive',period)}
      <rect x="9" y="49" width="279" height="141" rx="8" fill="#EEF3F9"/><rect x="9" y="49" width="279" height="141" rx="8" fill="url(#v8dots)" opacity=".45"/>
      <text x="17" y="61" font-family="Arial,Helvetica,sans-serif" font-size="3.2" font-weight="900" letter-spacing=".7" fill="#0757C9">DATES À VENIR</text>`;
    chunk.forEach((e,j)=>{
      const col=j%3,row=Math.floor(j/3),x=17+col*91.8,y=67+row*61,w=84,h=55;
      const has=(d.convocations||[]).some(c=>c.id===e.convocationId||(c.date===e.date&&c.specialty===e.specialty&&c.title===e.title));
      s+=calendarCard(e,x,y,w,h,j,has);
    });
    s+=pageClose(pi+1,chunks.length);return s;
  });
}

function detailCard(label,value,x,y,w,h,kind=''){
  const ic=kind?icon(kind,x+8,y+11,COLORS.blue):'';
  const tx=x+(kind?16:7);
  return `<g filter="url(#shadow)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="#fff" stroke="#DCE5F0"/>${ic}
    <text x="${tx}" y="${y+7}" font-family="Arial,Helvetica,sans-serif" font-size="2.7" font-weight="900" letter-spacing=".25" fill="#66758D">${sx(label.toUpperCase())}</text>
    ${tspans(value||'—',tx,y+15,w/2.25,2,4.4,'font-family="Arial,Helvetica,sans-serif" font-size="5.1" font-weight="900" fill="#13213A"')}
  </g>`;
}
function convocationFirstPage(c,d,logo,names,page,total){
  const accent=specColor(c.specialty),dt=new Date(c.date+'T12:00:00'),day=String(dt.getDate()).padStart(2,'0'),month=dt.toLocaleDateString('fr-FR',{month:'long'}).toUpperCase(),weekday=dt.toLocaleDateString('fr-FR',{weekday:'long'}).toUpperCase();
  let s=`<svg xmlns="http://www.w3.org/2000/svg" width="297mm" height="210mm" viewBox="0 0 297 210">${pageFrame(logo,'CONVOCATION',c.specialty||'Association Sportive',V.fmtShort(c.date).toUpperCase())}
    <rect x="10" y="49" width="277" height="31" rx="6" fill="#13213A"/>
    <rect x="10" y="49" width="5" height="31" rx="3" fill="${accent}"/>
    <text x="22" y="58" font-family="Arial,Helvetica,sans-serif" font-size="3.1" font-weight="900" letter-spacing=".7" fill="#FFD21A">${sx((c.activity||'ACTIVITÉ').toUpperCase())}</text>
    ${tspans(c.title||c.activity||'Convocation',22,69,42,1,5,'font-family="Arial,Helvetica,sans-serif" font-size="9.4" font-weight="900" fill="#fff"')}
    <text x="22" y="76" font-family="Arial,Helvetica,sans-serif" font-size="3.7" font-weight="600" fill="#C7D2E4">${sx(c.ageCategory||'')}</text>
    <text x="278" y="74" text-anchor="end" font-family="Arial,Helvetica,sans-serif" font-size="17" font-weight="900" fill="${accent}" opacity=".18">${sx(specShort(c.specialty))}</text>
    <g filter="url(#shadow)"><rect x="10" y="88" width="52" height="50" rx="5" fill="#fff" stroke="#DCE5F0"/>
      <text x="18" y="98" font-family="Arial,Helvetica,sans-serif" font-size="3.2" font-weight="900" fill="#0757C9">${weekday}</text>
      <text x="18" y="119" font-family="Arial,Helvetica,sans-serif" font-size="20" font-weight="900" fill="#13213A">${day}</text>
      <text x="18" y="130" font-family="Arial,Helvetica,sans-serif" font-size="3.6" font-weight="900" fill="#13213A">${month}</text>
      <text x="18" y="135" font-family="Arial,Helvetica,sans-serif" font-size="3" font-weight="700" fill="#66758D">${dt.getFullYear()}</text>
    </g>
    ${detailCard('Lieu',c.place,68,88,58,23,'pin')}
    ${detailCard('Départ',c.departure,132,88,44,23,'clock')}
    ${detailCard('Retour',c.returnTime,182,88,44,23,'clock')}
    ${detailCard('Professeur référent',c.teacher||'À renseigner',232,88,55,23,'teacher')}
    ${detailCard('Point de rendez-vous',c.meetingPoint,68,116,84,22,'users')}
    <g filter="url(#shadow)"><rect x="158" y="116" width="129" height="22" rx="4" fill="#FFF9DB" stroke="#F0D56A"/><rect x="158" y="116" width="4" height="22" rx="2" fill="#FFD21A"/>
      ${icon('info',169,127,COLORS.yellow)}
      <text x="178" y="123" font-family="Arial,Helvetica,sans-serif" font-size="2.7" font-weight="900" letter-spacing=".25" fill="#0757C9">INFORMATIONS IMPORTANTES</text>
      ${tspans(c.extraInfo||'Aucune information particulière.',178,131,54,2,4.2,'font-family="Arial,Helvetica,sans-serif" font-size="3.55" font-weight="700" fill="#13213A"')}
    </g>
    <g filter="url(#shadow)"><rect x="10" y="147" width="277" height="44" rx="6" fill="#fff" stroke="#DCE5F0"/><rect x="10" y="147" width="55" height="44" rx="6" fill="#FFD21A"/><rect x="59" y="147" width="6" height="44" fill="#FFD21A"/>
      ${icon('users',26,166,COLORS.navy)}
      <text x="22" y="176" font-family="Arial,Helvetica,sans-serif" font-size="4" font-weight="900" fill="#13213A">ÉLÈVES</text><text x="18" y="181" font-family="Arial,Helvetica,sans-serif" font-size="4" font-weight="900" fill="#13213A">CONVOQUÉS</text>`;
  names.slice(0,12).forEach((n,i)=>{
    const col=i%3,row=Math.floor(i/3),x=72+col*67,y=158+row*8.2;
    s+=`<circle cx="${x}" cy="${y-1}" r="2" fill="#0757C9"/><text x="${x+5}" y="${y}" font-family="Arial,Helvetica,sans-serif" font-size="3.5" font-weight="800" fill="#13213A">${sx(lines(n,22,1)[0])}</text>`;
  });
  s+=`</g>${pageClose(page,total)}`;return s;
}
function convocationStudentPage(c,logo,names,page,total){
  let s=`<svg xmlns="http://www.w3.org/2000/svg" width="297mm" height="210mm" viewBox="0 0 297 210">${pageFrame(logo,'CONVOCATION',c.title||c.activity||'',V.fmtShort(c.date).toUpperCase())}
    <text x="16" y="58" font-family="Arial,Helvetica,sans-serif" font-size="4" font-weight="900" letter-spacing=".6" fill="#0757C9">ÉLÈVES CONVOQUÉS</text>
    <rect x="12" y="65" width="273" height="126" rx="7" fill="#EEF3F9"/>`;
  names.forEach((n,i)=>{
    const col=i%3,row=Math.floor(i/3),x=18+col*89,y=76+row*13.5;
    s+=`<g filter="url(#shadow)"><rect x="${x}" y="${y}" width="82" height="10.5" rx="3" fill="#fff" stroke="#DCE5F0"/><circle cx="${x+7}" cy="${y+5.2}" r="2.1" fill="#0757C9"/><text x="${x+13}" y="${y+6.5}" font-family="Arial,Helvetica,sans-serif" font-size="3.6" font-weight="800" fill="#13213A">${sx(lines(n,24,1)[0])}</text></g>`;
  });
  return s+pageClose(page,total);
}
function convocationPages(c,d,logo){
  const names=(c.studentIds||[]).map(id=>V.studentName(d,id)).filter(Boolean),rest=names.slice(12),pages=1+Math.ceil(rest.length/24),out=[convocationFirstPage(c,d,logo,names,1,pages)];
  for(let i=0;i<rest.length;i+=24)out.push(convocationStudentPage(c,logo,rest.slice(i,i+24),out.length+1,pages));
  return out;
}
async function toPdf(svgPages,filename){
  if(!window.jspdf?.jsPDF)return alert('Le module PDF est encore en chargement.');
  const {jsPDF}=window.jspdf,doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4',compress:true});
  if(typeof doc.svg!=='function')return alert('Le moteur PDF vectoriel est encore en chargement. Réessayez dans quelques secondes.');
  for(let i=0;i<svgPages.length;i++){
    if(i)doc.addPage('a4','landscape');
    const wrap=document.createElement('div');wrap.innerHTML=svgPages[i];const svg=wrap.firstElementChild;
    await doc.svg(svg,{x:0,y:0,width:297,height:210});
  }
  doc.save(filename);
}
function relevantEvents(){
  const d=V.read(),sp=V.edu();let e=(d.events||[]).slice();if(sp)e=e.filter(x=>x.specialty===sp);return e.sort((a,b)=>(a.date+(a.startTime||'')).localeCompare(b.date+(b.startTime||'')));
}
async function calendarPDF(){
  const d=V.read(),events=relevantEvents();if(!events.length)return alert('Aucun événement à exporter.');
  const logo=await logoData();await toPdf(calendarPages(events,d,logo),V.edu()?`Calendrier_${V.clean(V.edu())}.pdf`:'Calendrier_AS_Bon_Sauveur.pdf');
}
async function convocationPDF(id){
  const d=V.read(),c=(d.convocations||[]).find(x=>x.id===id);if(!c)return alert('Convocation introuvable.');
  const logo=await logoData();await toPdf(convocationPages(c,d,logo),`Convocation_${V.clean(c.title||c.activity||c.date)}.pdf`);
}

/* Excel V8 */
const ARGB=h=>'FF'+h.replace('#','').toUpperCase();
function selectedFilters(){const out={};document.querySelectorAll('.filter-field,.filter-field-v7').forEach(f=>{const k=V.norm(f.querySelector('span')?.textContent||''),v=f.querySelector('select')?.value||'';if(k)out[k]=v});return out}
function filteredLicenses(d){const f=selectedFilters();return(d.licenses||[]).filter(l=>(!f.categorie||l.category===f.categorie)&&(!f.specialite||l.sectionOption===f.specialite)&&(!f.classe||l.className===f.classe)&&(!f.paiement||l.paymentStatus===f.paiement)&&(!f.mode||l.contribution===f.mode))}
function exportInfo(kind){
  const d=V.read(),sp=V.edu();
  if(kind==='licenses')return{title:'LICENCES',subtitle:'Élèves licenciés',rows:filteredLicenses(d).map(l=>({'Nom & prénom':l.fullName,'Classe':l.className,'Catégorie':l.category,'Spécialité':l.sectionOption,'Cotisation':l.contribution||'','Statut':l.paymentStatus,'Montant (€)':Number(l.amount||0),'Charte':l.charterSigned}))};
  if(kind==='reports')return{title:'BILANS AS',subtitle:'Suivi des séances et compétitions',rows:(d.reports||[]).map(r=>({'Date':r.date,'Activité':r.activity,'Professeur(s)':r.teacher||'','Niveau':r.level||'','Lieu':r.place||'','Catégorie':r.category||'',"Élèves":Number(r.participants||0),'Commentaire':r.comment||''}))};
  if(kind==='orders'){const p=Object.fromEntries((d.products||[]).map(x=>[x.id,x.name]));return{title:'COMMANDES',subtitle:'Boutique AS',rows:(d.orders||[]).map(o=>({'Élève':o.studentName,'Classe':o.className,'Produit':p[o.productId]||'Produit','Couleur':o.color||'','Taille':o.size,'Qté':Number(o.quantity||1),'Paiement':o.paymentMethod,'Payé':o.paid?'Oui':'Non','Distribué':o.distributed?'Oui':'Non','Date':o.createdAt}))}}
  if(kind==='convocations'){const rows=[];(d.convocations||[]).filter(c=>!sp||c.specialty===sp).forEach(c=>(c.studentIds||[]).forEach(id=>rows.push({'Activité':c.activity||'','Titre':c.title,'Catégorie':c.ageCategory||'','Spécialité':c.specialty,'Date':c.date,'Lieu':c.place,'Départ':c.departure,'Retour':c.returnTime,'Rendez-vous':c.meetingPoint||'','Professeur':c.teacher||'','Informations':c.extraInfo||'','Élève':V.studentName(d,id)})));return{title:'CONVOCATIONS',subtitle:'Élèves convoqués',rows}}
  if(kind==='appreciations'){const allowed=new Set((d.licenses||[]).filter(l=>!sp||l.sectionOption===sp).map(l=>l.studentId));return{title:'APPRÉCIATIONS',subtitle:sp||'Suivi annuel',rows:(d.appreciations||[]).filter(a=>!sp||allowed.has(a.studentId)).map(a=>{const s=(d.students||[]).find(x=>x.id===a.studentId)||(d.licenses||[]).find(x=>x.studentId===a.studentId)||{};return{'Élève':s.fullName||'','Classe':s.className||'','Trimestre':a.term,'Appréciation':a.text||'','Statut':a.status==='validated'?'Validé':'À faire'}})}}
  if(kind==='calendar')return{title:'CALENDRIER',subtitle:sp||'Association Sportive',rows:relevantEvents().map(e=>({'Date':e.date,'Titre':e.title,'Catégorie':e.ageCategory,'Spécialité':e.specialty,'Départ':e.startTime,'Retour':e.endTime,'Lieu':e.place}))};
  return{title:'EXPORT AS',subtitle:'Association Sportive du Bon Sauveur',rows:[]};
}
function fillRange(ws,row,from,to,fill){for(let c=from;c<=to;c++)ws.getRow(row).getCell(c).fill={type:'pattern',pattern:'solid',fgColor:{argb:ARGB(fill)}}}
function styleStatus(cell,value){
  const s=String(value||'');
  if(['Payé','Oui','Validé','Distribué'].includes(s)){cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFE8F7EF'}};cell.font={...cell.font,color:{argb:'FF137A4B'},bold:true}}
  if(['En attente','Non','À faire'].includes(s)){cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFF5D6'}};cell.font={...cell.font,color:{argb:'FF9A6800'},bold:true}}
}
function specialtyFill(cell,value){
  const c=specColor(String(value||''));if(!c)return;
  cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:ARGB(c.replace('#',''))}};
  cell.font={name:'Aptos',size:10,bold:true,color:{argb:'FFFFFFFF'}};
}
async function excel(kind){
  if(!window.ExcelJS)return alert('Le module Excel est encore en chargement.');
  const info=exportInfo(kind),rows=info.rows||[],wb=new ExcelJS.Workbook();wb.creator='Association Sportive du Bon Sauveur';wb.created=new Date();
  const ws=wb.addWorksheet(info.title.slice(0,31),{properties:{tabColor:{argb:ARGB(V.BLUE)}},views:[{state:'frozen',ySplit:7}]});
  const headers=rows.length?Object.keys(rows[0]):['Information'],count=Math.max(headers.length,6),last=ws.getColumn(count).letter,logo=await V.logoData();
  ws.pageSetup={orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0,paperSize:9,margins:{left:.25,right:.25,top:.3,bottom:.3,header:.15,footer:.15}};
  [1,2,3].forEach(r=>fillRange(ws,r,1,count,V.NAVY));fillRange(ws,4,1,count,V.YELLOW);
  ws.getRow(1).height=30;ws.getRow(2).height=24;ws.getRow(3).height=18;ws.getRow(4).height=7;
  ws.mergeCells(`C1:${last}1`);ws.getCell('C1').value=info.title;ws.getCell('C1').font={name:'Aptos Display',size:25,bold:true,color:{argb:'FFFFFFFF'}};ws.getCell('C1').alignment={vertical:'middle'};
  ws.mergeCells(`C2:${last}2`);ws.getCell('C2').value=info.subtitle.toUpperCase();ws.getCell('C2').font={name:'Aptos',size:10,bold:true,color:{argb:ARGB(V.YELLOW)}};ws.getCell('C2').alignment={vertical:'middle'};
  ws.mergeCells(`C3:${last}3`);ws.getCell('C3').value=`BON SAUVEUR · SAINT-LÔ     |     ${new Date().toLocaleDateString('fr-FR')}`;ws.getCell('C3').font={name:'Aptos',size:9,color:{argb:'FFD2DBE9'}};
  if(logo)try{const id=wb.addImage({base64:logo,extension:'png'});ws.addImage(id,{tl:{col:.18,row:.15},ext:{width:74,height:74}})}catch{}
  ws.mergeCells(`A5:${last}5`);ws.getCell('A5').value=`${rows.length} ligne${rows.length>1?'s':''}`;ws.getCell('A5').font={name:'Aptos',size:10,bold:true,color:{argb:ARGB(V.BLUE)}};ws.getCell('A5').alignment={horizontal:'right'};ws.getRow(5).height=18;
  const start=7;headers.forEach((h,i)=>{const c=ws.getCell(start,i+1);c.value=h.toUpperCase();c.fill={type:'pattern',pattern:'solid',fgColor:{argb:ARGB(V.BLUE)}};c.font={name:'Aptos Display',size:10,bold:true,color:{argb:'FFFFFFFF'}};c.alignment={vertical:'middle',horizontal:'center',wrapText:true};c.border={bottom:{style:'medium',color:{argb:ARGB(V.YELLOW)}}}});
  ws.getRow(start).height=27;
  if(rows.length)rows.forEach((obj,ri)=>{
    const r=start+1+ri,row=ws.getRow(r);row.height=24;
    headers.forEach((h,ci)=>{
      const cell=row.getCell(ci+1);cell.value=obj[h]??'';cell.font={name:'Aptos',size:10,color:{argb:ARGB(V.NAVY)}};cell.alignment={vertical:'middle',wrapText:true};
      cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:ri%2===0?'FFFFFFFF':'FFF5F8FC'}};cell.border={bottom:{style:'hair',color:{argb:'FFDCE5F0'}}};
      if(/statut|payé|distribué|charte/i.test(h))styleStatus(cell,cell.value);
      if(/spécialité/i.test(h))specialtyFill(cell,cell.value);
    });
  }); else {ws.getCell(start+1,1).value='Aucune donnée';ws.getCell(start+1,1).font={name:'Aptos',italic:true,color:{argb:'FF66758D'}}}
  const end=start+Math.max(rows.length,1);ws.autoFilter={from:{row:start,column:1},to:{row:end,column:headers.length}};
  headers.forEach((h,i)=>{const vals=[h,...rows.map(r=>String(r[h]??''))],max=Math.min(46,Math.max(13,...vals.map(v=>Math.min(46,v.length+2))));ws.getColumn(i+1).width=max});
  ws.headerFooter.oddFooter='&LAssociation Sportive du Bon Sauveur&C' + info.title + '&RPage &P / &N';
  if(kind==='licenses'){
    const fl=filteredLicenses(V.read()),sum=wb.addWorksheet('Synthèse',{properties:{tabColor:{argb:ARGB(V.YELLOW)}}});
    [1,2,3].forEach(r=>fillRange(sum,r,1,6,V.NAVY));fillRange(sum,4,1,6,V.YELLOW);sum.getRow(1).height=30;sum.getRow(2).height=24;sum.getRow(4).height=7;
    sum.mergeCells('C1:F1');sum.getCell('C1').value='SYNTHÈSE LICENCES';sum.getCell('C1').font={name:'Aptos Display',size:23,bold:true,color:{argb:'FFFFFFFF'}};
    sum.mergeCells('C2:F2');sum.getCell('C2').value='SUIVI DES COTISATIONS';sum.getCell('C2').font={name:'Aptos',size:10,bold:true,color:{argb:ARGB(V.YELLOW)}};
    if(logo)try{const id=wb.addImage({base64:logo,extension:'png'});sum.addImage(id,{tl:{col:.18,row:.15},ext:{width:74,height:74}})}catch{}
    const methods=V.PAYMENTS.map(m=>({Mode:m,Total:fl.filter(l=>l.paymentStatus==='Payé'&&l.contribution===m).reduce((s,l)=>s+Number(l.amount||0),0)}));
    sum.getCell('A6').value='MODE DE PAIEMENT';sum.getCell('B6').value='ENCAISSÉ (€)';for(const c of ['A6','B6']){sum.getCell(c).fill={type:'pattern',pattern:'solid',fgColor:{argb:ARGB(V.BLUE)}};sum.getCell(c).font={name:'Aptos Display',size:10,bold:true,color:{argb:'FFFFFFFF'}}}
    methods.forEach((x,i)=>{const r=7+i;sum.getCell(r,1).value=x.Mode;sum.getCell(r,2).value=x.Total;sum.getRow(r).height=24;for(let c=1;c<=2;c++){const cell=sum.getCell(r,c);cell.font={name:'Aptos',size:10,color:{argb:ARGB(V.NAVY)}};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:i%2?'FFF5F8FC':'FFFFFFFF'}}}});
    const total=methods.reduce((s,x)=>s+x.Total,0),rest=fl.filter(l=>l.paymentStatus!=='Payé').reduce((s,l)=>s+Number(l.amount||0),0);
    sum.getCell('D6').value='TOTAL ENCAISSÉ';sum.getCell('D7').value=total;sum.getCell('F6').value='À ENCAISSER';sum.getCell('F7').value=rest;
    ['D6','F6'].forEach(c=>{sum.getCell(c).font={name:'Aptos',size:9,bold:true,color:{argb:'FF66758D'}}});sum.getCell('D7').font={name:'Aptos Display',size:18,bold:true,color:{argb:ARGB(V.BLUE)}};sum.getCell('F7').font={name:'Aptos Display',size:18,bold:true,color:{argb:'FF9A6800'}};
    sum.getColumn(1).width=28;sum.getColumn(2).width=18;sum.getColumn(4).width=22;sum.getColumn(6).width=22;
  }
  const buf=await wb.xlsx.writeBuffer(),blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`${V.clean(info.title)}_AS.xlsx`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
}

app.exportCalendarPDF=calendarPDF;
app.exportConvocation=convocationPDF;
app.exportExcel=excel;
})();
