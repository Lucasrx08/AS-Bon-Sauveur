import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const require=createRequire(import.meta.url),{jsPDF}=require('../assets/vendor/jspdf.umd.min.js');
const root=new URL('../',import.meta.url),out=new URL('tmp/pdfs/v3181/',root);mkdirSync(out,{recursive:true});
const events=[
 {title:"AS ANNULÉE - Cross de l'établissement",date:'2026-10-14',place:'',ageCategory:'Toutes catégories',registrationMode:'none',startTime:'00:00',endTime:'00:00'},
 {title:'TRISPORT - Match contre Granville',date:'2026-11-04',place:'Granville',ageCategory:'Minime garçon',registrationMode:'convocation',startTime:'12:00',endTime:'17:30'},
 {title:'TRISPORT - Match contre Coutances',date:'2026-11-04',place:'Gymnase du Bon Sauveur',ageCategory:'Benjamin',registrationMode:'convocation',startTime:'12:00',endTime:'15:30'},
 {title:"COURSE D'ORIENTATION - Entraînement",date:'2026-11-04',place:'Gymnase du Bon Sauveur',ageCategory:'Toutes catégories',registrationMode:'open',startTime:'12:30',endTime:'14:30'},
 {title:'CROSS - Départemental',date:'2026-11-18',place:'SAINT-SAUVEUR LE VICOMTE',ageCategory:'Toutes catégories',registrationMode:'convocation',startTime:'00:00',endTime:'00:00'}
].map((e,i)=>({...e,id:'public-fixture-'+i,specialty:'Association Sportive',registrationOpen:e.registrationMode==='open'}));
const docs=[];
const closeColor=(actual,expected)=>[1,3,5].every(offset=>Math.abs(parseInt(actual.slice(offset,offset+2),16)-parseInt(expected.slice(offset,offset+2),16))<=1);
function CheckedPDF(options){
 const doc=new jsPDF(options),originalText=doc.text.bind(doc);doc.__texts=[];
 doc.text=(text,x,y,options)=>{
  for(const line of Array.isArray(text)?text:[text]){
   const width=doc.getTextWidth(String(line)),align=options?.align||'left';
   const left=align==='center'?x-width/2:align==='right'?x-width:x;
   assert.ok(left>=0&&left+width<=doc.internal.pageSize.getWidth()+.1,'Le texte reste dans la page.');
   doc.__texts.push({text:String(line),size:doc.getFontSize(),font:doc.getFont().fontName,color:doc.getTextColor(),fill:doc.getFillColor()});
  }
  return originalText(text,x,y,options);
 };
 docs.push(doc);return doc;
}
const context=vm.createContext({window:{jspdf:{jsPDF:CheckedPDF},app:{readData:()=>({events,convocations:[]}),role:()=> 'public'},addEventListener(){}},document:{querySelectorAll:()=>[],addEventListener(){}},console,Map,Set,Date,Intl,Uint8Array,setTimeout,clearTimeout,btoa:s=>Buffer.from(s,'binary').toString('base64'),fetch:async path=>{const bytes=readFileSync(new URL(path,root));return{ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)}}});
vm.runInContext(readFileSync(new URL('v21-12-pdf.js',root),'utf8'),context);const api=context.window.ASV2112_PDF;
for(let n=1;n<=5;n++){
 const doc=await api.buildProgramPdf(events.slice(0,n));assert.equal(doc.getNumberOfPages(),1);
 assert.ok(doc.__texts.some(t=>t.text==='OCTOBRE'&&t.size>=16));
 if(n===5){
  assert.equal(doc.__texts.filter(t=>t.text==='CONVOCATION').length,3);
  assert.ok(closeColor(doc.__texts.find(t=>t.text==='INSCRIPTION LIBRE').fill,'#ffd61a'));
  assert.ok(doc.__texts.filter(t=>t.text==='CONVOCATION').every(t=>t.color==='#ffffff'&&closeColor(t.fill,'#0757c9')));
  assert.ok(doc.__texts.filter(t=>t.text.includes('TRISPORT')).every(t=>t.font==='Anton'&&t.size>=22));
 }
 writeFileSync(new URL(`programme-${n}.pdf`,out),Buffer.from(doc.output('arraybuffer')));
}
for(let n=1;n<=3;n++){
 const doc=await api.buildTvPdf(events.slice(0,n));assert.equal(doc.getNumberOfPages(),1);assert.equal(doc.internal.pageSize.getWidth(),320);assert.equal(doc.internal.pageSize.getHeight(),180);
 assert.ok(doc.__texts.some(t=>t.text==='OCTOBRE 2026'&&t.size>=14));
 if(n===3)assert.ok(doc.__texts.filter(t=>t.text.includes('TRISPORT')).every(t=>t.font==='Anton'&&t.size>=30));
 writeFileSync(new URL(`tv-${n}.pdf`,out),Buffer.from(doc.output('arraybuffer')));
}
// Long accented names, December and an open registration remain readable on TV.
const stress=[{...events[3],date:'2026-12-09',title:'ÉPREUVE DÉPARTEMENTALE - DÉCOUVERTE DES ACTIVITÉS DE PLEINE NATURE ET ORIENTATION'},{...events[2],date:'2026-09-09',title:'RENCONTRE INTERÉTABLISSEMENTS ET CHAMPIONNAT FRANÇAIS DE FOOTBALL'},{...events[4],date:'2026-02-11',title:'CROSS - ÉPREUVE RÉGIONALE'}];
const stressDoc=await api.buildTvPdf(stress);assert.ok(stressDoc.__texts.some(t=>t.text==='DÉCEMBRE 2026'&&t.size>=11.5));writeFileSync(new URL('tv-long-titles.pdf',out),Buffer.from(stressDoc.output('arraybuffer')));
console.log('V31.8.1 PDF : 1 à 5 événements A4, 1 à 3 TV, mois complets, titres Anton, accents et badges bleu/jaune OK.');
