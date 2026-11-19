(()=>{'use strict';
const classes=['6e AVIGNON','6e Georges BIZET','6e Paul CEZANNE','6e Alphonse DAUDET','5e Jacqueline AURIOL','5e Adrienne BOLLAND','5e Bessie COLEMAN','5e Elise DEROCHE','4e ESTANGUET','4e FLESSEL','4e Cyril MORE','4e DELAUNAY','3e Antonio GAUDI','3e BARCELONE','3e CASTILLE','3e DALI','3e ESPINOZA','Seconde Pro ECP','Seconde Pro Maslow','Seconde Pro Henderson','Seconde GT','Première Pro ECP','Première Pro Curie','Première Pro Pasteur','Première ST2S','Terminale ST2S','Terminale ASSP','Enseignant','Personnel'];
const tidy=v=>String(v??'').normalize('NFC').trim().replace(/\s+/g,' ');
const key=v=>tidy(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const title=v=>tidy(v).toLocaleLowerCase('fr-FR').replace(/(^|[\s’'\-])(\p{L})/gu,(_,a,b)=>a+b.toLocaleUpperCase('fr-FR'));
const full=(last,first)=>tidy(last).toLocaleUpperCase('fr-FR')+' '+title(first);
function classKey(v){return key(v).replace(/^(6|5|4|3)(ieme|eme|e)/,'$1e').replace(/^(2nde|2de|2e|seconde)/,'seconde').replace(/^(1ere|1re|premiere)/,'premiere').replace(/^(tle|terminale)/,'terminale')}
function className(raw){const k=classKey(raw),exact=classes.find(c=>classKey(c)===k);if(exact)return exact;
 if(['prof','professeur','professeure','enseignantdeps','enseignanteps','enseignante','professeureps'].includes(k))return 'Enseignant';
 if(['personnels','personneletablissement','personnelducollege'].includes(k))return 'Personnel';
 const grade=k.match(/^(6e|5e|4e|3e|seconde|premiere|terminale)/)?.[0],tail=grade?k.slice(grade.length):k;
 const matches=classes.filter(c=>(!grade||classKey(c).startsWith(grade))&&tail.length>=3&&classKey(c).endsWith(tail));return matches.length===1?matches[0]:tidy(raw);
}
function split(raw){const words=tidy(raw).split(' '),upper=words.map(w=>/\p{L}/u.test(w)&&w===w.toLocaleUpperCase('fr-FR'));
 if(upper.some(Boolean)&&upper.some(x=>!x)){const last=words.filter((_,i)=>upper[i]).join(' '),first=words.filter((_,i)=>!upper[i]).join(' ');return {last,first,certain:true}}
 const n=words.length>2&&/^(le|la|de|du|des|van|von)$/i.test(words[0])?2:1;
 return {last:words.slice(0,n).join(' '),first:words.slice(n).join(' '),certain:false};
}
const bag=v=>tidy(v).split(/[\s-]+/).map(key).sort().join('|');
function identity(raw,cl,data={}){let parts=split(raw);if(!parts.certain){const candidates=[...(data.licenses||[]),...(data.students||[])].filter(x=>className(x.className)===className(cl)&&bag(x.fullName)===bag(raw)).map(x=>split(x.fullName)).filter(x=>x.certain);const unique=[...new Map(candidates.map(x=>[full(x.last,x.first),x])).values()];if(unique.length===1)parts=unique[0]}
 return {...parts,name:full(parts.last,parts.first).trim(),className:className(cl)};
}
function order(o,data){const p=identity(o.studentName,o.className,data);return {...o,studentName:p.name,className:p.className,identityNeedsReview:!p.certain,identityParts:p}}
window.ASOrderIdentity={classes,tidy,key,title,full,className,identity,order};
})();
