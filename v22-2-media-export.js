(() => {
'use strict';

const MAX_EVENTS=5;
const TV_BG='assets/programme-tv-v22.png';
const ROLE_SPECIALTY={
  educator_escalade:'Option Escalade',
  educator_football:'Section Football',
  educator_gymnastique:'Sport-études Gymnastique'
};
const COLORS={
  'Association Sportive':'#B79A12',
  'Section Football':'#0B63CE',
  'Option Escalade':'#7651C8',
  'Sport-études Gymnastique':'#9558CC'
};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clean=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'');
const time=v=>{const m=String(v||'').match(/^(\d{1,2}):(\d{2})/);return m?`${m[1].padStart(2,'0')}:${m[2]}`:String(v||'')};
const dateParts=value=>{
  const d=new Date(String(value||'').slice(0,10)+'T12:00:00');
  if(Number.isNaN(d.getTime()))return{day:'--',monthShort:'---',month:'',year:''};
  return{
    day:String(d.getDate()).padStart(2,'0'),
    monthShort:new Intl.DateTimeFormat('fr-FR',{month:'short'}).format(d).replace('.','').toUpperCase(),
    month:new Intl.DateTimeFormat('fr-FR',{month:'long'}).format(d),
    year:String(d.getFullYear())
  };
};
const roleSpecialty=()=>window.app?.roleSpecialty?.()||ROLE_SPECIALTY[window.app?.role?.()]||null;
const events=()=>{
  const sp=roleSpecialty();
  return (window.app?.readData?.().events||[])
    .filter(e=>!sp||e.specialty===sp)
    .slice()
    .sort((a,b)=>`${a.date||''}${a.startTime||''}`.localeCompare(`${b.date||''}${b.startTime||''}`));
};
const periodLabel=rows=>{
  if(!rows.length)return'Programme';
  const sorted=rows.slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  const a=dateParts(sorted[0].date),b=dateParts(sorted.at(-1).date);
  return sorted.length===1?`${a.day}_${a.monthShort}_${a.year}`:`${a.day}_${a.monthShort}-${b.day}_${b.monthShort}_${b.year}`;
};

function normalizeTimes(data){
  if(!data||typeof data!=='object')return data;
  const fields=['startTime','endTime','departure','returnTime'];
  for(const key of ['events','convocations']){
    for(const row of Array.isArray(data[key])?data[key]:[]){
      for(const field of fields)if(row&&row[field])row[field]=time(row[field]);
    }
  }
  return data;
}

function sanitizeDisplayedTimes(root=document){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  for(const node of nodes){
    if(!node.nodeValue||!/:\d{2}:\d{2}/.test(node.nodeValue))continue;
    node.nodeValue=node.nodeValue.replace(/\b(\d{1,2}:\d{2}):\d{2}\b/g,'$1');
  }
  root.querySelectorAll?.('input[type="time"]').forEach(input=>{
    if(/^\d{1,2}:\d{2}:\d{2}$/.test(input.value))input.value=time(input.value);
  });
}

function downloadBlob(blob,name){
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1200);
}

function rounded(ctx,x,y,w,h,r){
  const rr=Math.min(r,w/2,h/2);
  ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();
}
function fillRounded(ctx,x,y,w,h,r,fill,stroke=null,lineWidth=1){rounded(ctx,x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.stroke()}}
function fitText(ctx,text,maxWidth,start,min=18){let size=start;for(;size>min;size-=1){ctx.font=`${size}px "AS BroshK", "AS Anton", Impact, sans-serif`;if(ctx.measureText(text).width<=maxWidth)break}return size}
function wrapLines(ctx,text,maxWidth,maxLines=2){
  const words=String(text||'').split(/\s+/).filter(Boolean),lines=[];let line='';
  for(const word of words){const trial=line?line+' '+word:word;if(ctx.measureText(trial).width<=maxWidth||!line){line=trial}else{lines.push(line);line=word;if(lines.length===maxLines-1)break}}
  if(line&&lines.length<maxLines)lines.push(line);
  const consumed=lines.join(' ').split(/\s+/).length;
  if(consumed<words.length&&lines.length){let last=lines.at(-1);while(last.length>1&&ctx.measureText(last+'…').width>maxWidth)last=last.slice(0,-1);lines[lines.length-1]=last.replace(/[\s,.;:-]+$/,'')+'…'}
  return lines;
}
function drawPill(ctx,text,x,y,bg,fg){
  ctx.font='700 21px Montserrat, Arial, sans-serif';const w=Math.ceil(ctx.measureText(text).width)+34;
  fillRounded(ctx,x,y,w,40,20,bg,null);ctx.fillStyle=fg;ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(text,x+17,y+20);return w;
}

async function loadImage(src){return await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src+(src.includes('?')?'&':'?')+'v=22.2';})}
async function buildTvCanvas(rows){
  try{await Promise.all([document.fonts?.load?.('44px "AS BroshK"'),document.fonts?.load?.('28px "AS Anton"')].filter(Boolean))}catch{}
  const bg=await loadImage(TV_BG),canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1152;
  const ctx=canvas.getContext('2d');ctx.drawImage(bg,0,0,canvas.width,canvas.height);
  ctx.fillStyle='#343434';ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.font='400 118px "AS Anton", Impact, sans-serif';ctx.fillText('PROGRAMME',22,154);ctx.font='400 38px "AS Anton", Impact, sans-serif';ctx.fillText('ASSOCIATION SPORTIVE BON SAUVEUR',24,199);
  const top=340,bottom=1015,x=82,w=1884,gap=18,n=Math.max(1,rows.length),available=bottom-top;
  const h=Math.min(148,Math.floor((available-gap*(n-1))/n));
  const total=h*n+gap*(n-1),startY=top+Math.max(0,Math.floor((available-total)/2));
  rows.forEach((event,i)=>{
    const y=startY+i*(h+gap),accent=COLORS[event.specialty]||'#2D4FAA',dp=dateParts(event.date);
    ctx.shadowColor='rgba(25,38,64,.08)';ctx.shadowBlur=16;ctx.shadowOffsetY=5;
    fillRounded(ctx,x,y,w,h,26,'rgba(255,255,255,.97)','#D9E2EE',2);ctx.shadowColor='transparent';
    fillRounded(ctx,x,y,12,h,6,accent);
    const dateX=x+34,dateW=148;
    fillRounded(ctx,dateX,y+16,dateW,h-32,22,'#F4F7FB','#DCE6F3',1.5);
    ctx.fillStyle=accent;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`400 ${Math.max(40,Math.min(62,h*.43))}px "AS Anton", Impact, sans-serif`;ctx.fillText(dp.day,dateX+dateW/2,y+h*.47);
    ctx.font='400 20px "AS Anton", Impact, sans-serif';ctx.fillText(dp.monthShort,dateX+dateW/2,y+h*.75);

    const bodyX=dateX+dateW+34,bodyW=w-(bodyX-x)-40;
    ctx.textAlign='left';ctx.textBaseline='alphabetic';
    const title=String(event.title||'Rendez-vous');const titleSize=fitText(ctx,title,bodyW,Math.min(44,Math.max(30,h*.34)),25);ctx.font=`${titleSize}px "AS BroshK", "AS Anton", Impact, sans-serif`;ctx.fillStyle='#13213A';
    const titleLines=wrapLines(ctx,title,bodyW, h<120?1:2);const lineHeight=titleSize*1.02;titleLines.forEach((line,j)=>ctx.fillText(line,bodyX,y+44+j*lineHeight));
    const metaY=y+h-31;ctx.font='700 22px Montserrat, Arial, sans-serif';ctx.fillStyle='#62728B';
    const hours=`${time(event.startTime)||'—'}${event.endTime?' → '+time(event.endTime):''}`;const place=event.place||'Lieu à préciser';ctx.fillText(`${hours} · ${place}`,bodyX,metaY);
    const speciality=event.specialty||'Association Sportive',category=event.ageCategory||'Toutes catégories';ctx.font='700 18px Montserrat, Arial, sans-serif';
    const specW=Math.ceil(ctx.measureText(speciality).width)+30,catW=Math.ceil(ctx.measureText(category).width)+30;
    const pillsX=x+w-32-specW-catW-12;drawPill(ctx,category,pillsX,metaY-31,'#F3F6FA','#586982');drawPill(ctx,speciality,pillsX+catW+12,metaY-31,accent+'18',accent);
  });
  return canvas;
}

function closePicker(){document.getElementById('v22-tv-calendar-modal')?.remove()}
function exportTv(){
  const rows=events();if(!rows.length)return alert('Aucun événement à exporter.');
  closePicker();
  const wrapper=document.createElement('div');wrapper.id='v22-tv-calendar-modal';wrapper.className='v19-modal-backdrop v2112-export-backdrop';
  wrapper.innerHTML=`<div class="v19-modal wide v2112-export-modal" role="dialog" aria-modal="true" aria-labelledby="v22-tv-export-title"><div class="v19-modal-head"><div><div class="v19-kicker">EXPORT TV</div><h2 id="v22-tv-export-title">Créer le programme écran</h2></div><button class="v19-icon-btn" type="button" aria-label="Fermer" data-close>×</button></div><form class="v19-modal-body"><div class="v2112-picker-layout"><section><div class="v2112-picker-intro"><div><strong>Choisissez jusqu’à ${MAX_EVENTS} dates</strong><p>Le visuel sera généré en PNG 16:9 avec ton fond TV.</p></div><span class="v2112-count" data-count>0 / ${MAX_EVENTS}</span></div><div class="v2112-event-list">${rows.map(e=>{const p=dateParts(e.date);return `<label class="v2112-event-choice"><input type="checkbox" name="eventIds" value="${esc(e.id)}"><span class="v2112-choice-date"><b>${esc(p.day)}</b><small>${esc(p.monthShort)}</small></span><span class="v2112-choice-main"><strong>${esc(e.title||'Rendez-vous')}</strong><small>${esc(time(e.startTime)||'—')}${e.endTime?' - '+esc(time(e.endTime)):''} · ${esc(e.place||'À préciser')}</small><em>${esc(e.ageCategory||'Toutes catégories')} · ${esc(e.specialty||'Association Sportive')}</em></span></label>`}).join('')}</div><div class="v2112-limit" data-limit aria-live="polite"></div></section><aside class="v2112-preview"><div class="v22-tv-preview-sheet"><div class="v22-tv-preview-content" data-preview></div></div><span>Aperçu TV 16:9</span></aside></div><div class="v19-modal-actions v2112-actions"><button class="v19-btn secondary" type="button" data-cancel>Annuler</button><button class="v19-btn v22-tv-btn" type="submit" data-export>Exporter le PNG</button></div></form></div>`;
  document.body.appendChild(wrapper);
  const inputs=[...wrapper.querySelectorAll('input[name="eventIds"]')],count=wrapper.querySelector('[data-count]'),limit=wrapper.querySelector('[data-limit]'),preview=wrapper.querySelector('[data-preview]'),button=wrapper.querySelector('[data-export]');
  const sync=changed=>{
    let selected=inputs.filter(i=>i.checked);if(selected.length>MAX_EVENTS&&changed){changed.checked=false;selected=inputs.filter(i=>i.checked);limit.textContent=`Maximum ${MAX_EVENTS} dates.`;limit.classList.add('error')}else{limit.textContent=selected.length?'':'Sélectionnez au moins une date.';limit.classList.remove('error')}
    inputs.forEach(i=>i.closest('.v2112-event-choice')?.classList.toggle('selected',i.checked));count.textContent=`${selected.length} / ${MAX_EVENTS}`;button.disabled=!selected.length;
    const chosen=rows.filter(e=>selected.some(i=>i.value===String(e.id))).slice(0,MAX_EVENTS);preview.innerHTML=chosen.map(e=>{const p=dateParts(e.date);return `<div class="v2112-mini-event"><b>${esc(p.day)} ${esc(p.monthShort)}</b><span>${esc(e.title||'Rendez-vous')}</span></div>`}).join('')||'<div class="v2112-mini-empty">Sélectionnez vos dates</div>';
  };
  inputs.forEach(i=>i.addEventListener('change',()=>sync(i)));wrapper.querySelector('[data-close]').onclick=closePicker;wrapper.querySelector('[data-cancel]').onclick=closePicker;wrapper.onclick=e=>{if(e.target===wrapper)closePicker()};
  wrapper.querySelector('form').onsubmit=async e=>{e.preventDefault();const selected=inputs.filter(i=>i.checked).map(i=>i.value),chosen=rows.filter(row=>selected.includes(String(row.id))).slice(0,MAX_EVENTS);if(!chosen.length)return;button.disabled=true;button.textContent='Création du visuel…';limit.textContent='';try{const canvas=await buildTvCanvas(chosen);const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG')), 'image/png'));downloadBlob(blob,`Programme_TV_AS_${clean(periodLabel(chosen))}.png`);closePicker()}catch(error){console.error(error);button.disabled=false;button.textContent='Exporter le PNG';limit.textContent='La création du visuel TV a échoué. Réessayez.';limit.classList.add('error')}};
  sync();setTimeout(()=>inputs[0]?.focus(),30);
}

function enhanceCalendarActions(root=document){
  const pdf=[...root.querySelectorAll?.('button[onclick]')||[]].find(button=>/app\.exportCalendarPDF\(\)/.test(button.getAttribute('onclick')||''));
  if(!pdf)return;
  if(pdf.textContent.trim()!=='Export PDF')pdf.textContent='Export PDF';
  if(pdf.parentElement?.querySelector('[data-v22-tv-export]'))return;
  const tv=document.createElement('button');tv.type='button';tv.className='v19-btn v22-tv-btn';tv.dataset.v22TvExport='1';tv.textContent='Export TV';tv.onclick=exportTv;pdf.insertAdjacentElement('afterend',tv);
}

function install(){
  if(!window.app)return setTimeout(install,60);
  const originalHydrate=window.app.hydrateFromServer;
  if(originalHydrate&&!originalHydrate.__v22TimePatched){
    const wrapped=(data,role)=>originalHydrate(normalizeTimes(data),role);wrapped.__v22TimePatched=true;window.app.hydrateFromServer=wrapped;
  }
  normalizeTimes(window.app.readData?.());
  window.app.exportCalendarTV=exportTv;
  sanitizeDisplayedTimes();enhanceCalendarActions();
  new MutationObserver(records=>{for(const record of records){for(const node of record.addedNodes){if(node.nodeType===1){sanitizeDisplayedTimes(node);enhanceCalendarActions(node)}else if(node.nodeType===3&&node.parentElement)sanitizeDisplayedTimes(node.parentElement)}}enhanceCalendarActions()}).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  window.ASV22Media={version:'22.2.0',tvBackground:TV_BG,maxEvents:MAX_EVENTS,timeFormat:'HH:MM'};
}
install();
})();