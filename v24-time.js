(() => {
'use strict';

/**
 * V24 — unique changement fonctionnel :
 * afficher les horaires au format HH:MM, sans secondes.
 *
 * Aucun MutationObserver, aucune boucle DOM, aucun traitement périodique.
 */
const TIME_FIELDS={
  events:['startTime','endTime'],
  convocations:['departure','returnTime']
};

function hhmm(value){
  if(value===null||value===undefined||value==='')return value;
  const text=String(value);
  const match=text.match(/^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/);
  return match?`${match[1].padStart(2,'0')}:${match[2]}`:value;
}

function normalizeTimes(data){
  if(!data||typeof data!=='object')return false;
  let changed=false;
  for(const [collection,fields] of Object.entries(TIME_FIELDS)){
    const rows=Array.isArray(data[collection])?data[collection]:[];
    for(const row of rows){
      if(!row||typeof row!=='object')continue;
      for(const field of fields){
        const next=hhmm(row[field]);
        if(next!==row[field]){
          row[field]=next;
          changed=true;
        }
      }
    }
  }
  return changed;
}

function install(){
  if(!window.app)return setTimeout(install,30);

  const original=window.app.hydrateFromServer;
  if(typeof original==='function'&&!original.__v24Time){
    const wrapped=(data,role)=>{
      normalizeTimes(data);
      return original(data,role);
    };
    wrapped.__v24Time=true;
    window.app.hydrateFromServer=wrapped;
  }

  const current=window.app.readData?.();
  if(current&&normalizeTimes(current)&&typeof original==='function'){
    original(current,window.app.role?.());
  }

  window.ASV24={
    version:'24.0.0',
    change:'HH:MM',
    observers:0
  };
  document.documentElement.dataset.appVersion='24';
}

install();
})();