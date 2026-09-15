(() => {
'use strict';

/**
 * V23 privacy preflight
 * Keeps public application data in localStorage, but moves nominative/staff data
 * to sessionStorage so it disappears when the browser session is closed.
 */
const DATA_KEY='bs-app-data-v4';
const SESSION_KEY='bs-v23-private-session';
const LEGACY_SESSION_KEY='bs-v22-private-session';
const PRIVATE_KEYS=new Set(['orders','students','appreciations','licenses','reports','eventRegistrations']);
const nativeGet=Storage.prototype.getItem;
const nativeSet=Storage.prototype.setItem;
const nativeRemove=Storage.prototype.removeItem;

const parse=(value,fallback={})=>{try{const parsed=JSON.parse(value||'null');return parsed&&typeof parsed==='object'?parsed:fallback}catch{return fallback}};
const clone=value=>parse(JSON.stringify(value??{}),{});

function splitData(input){
  const source=input&&typeof input==='object'?clone(input):{};
  const publicData={...source};
  const privateData={};

  for(const key of PRIVATE_KEYS){
    privateData[key]=Array.isArray(source[key])?source[key]:[];
    publicData[key]=[];
  }

  const links={};
  publicData.convocations=(Array.isArray(source.convocations)?source.convocations:[]).map(convocation=>{
    const row={...convocation};
    if(Array.isArray(row.studentIds)&&row.studentIds.length)links[String(row.id||'')]=row.studentIds.slice();
    delete row.studentIds;
    return row;
  });
  privateData.convocationStudentIds=links;
  return {publicData,privateData};
}

function mergeData(publicData,privateData){
  const merged={...(publicData||{})};
  for(const key of PRIVATE_KEYS)merged[key]=Array.isArray(privateData?.[key])?privateData[key]:[];
  const links=privateData?.convocationStudentIds||{};
  merged.convocations=(Array.isArray(publicData?.convocations)?publicData.convocations:[]).map(row=>({
    ...row,
    ...(Array.isArray(links[String(row.id||'')])?{studentIds:links[String(row.id||'')]}:{})
  }));
  return merged;
}

Storage.prototype.getItem=function(key){
  if(this===localStorage&&key===DATA_KEY){
    const pub=parse(nativeGet.call(localStorage,DATA_KEY),{});
    const priv=parse(nativeGet.call(sessionStorage,SESSION_KEY),parse(nativeGet.call(sessionStorage,LEGACY_SESSION_KEY),{}));
    return JSON.stringify(mergeData(pub,priv));
  }
  return nativeGet.call(this,key);
};

Storage.prototype.setItem=function(key,value){
  if(this===localStorage&&key===DATA_KEY){
    const full=parse(String(value||''),{});
    const {publicData,privateData}=splitData(full);
    nativeSet.call(localStorage,DATA_KEY,JSON.stringify(publicData));
    nativeSet.call(sessionStorage,SESSION_KEY,JSON.stringify(privateData));
    window.dispatchEvent(new CustomEvent('bs-v23-data-split'));
    return;
  }
  return nativeSet.call(this,key,value);
};

Storage.prototype.removeItem=function(key){
  if(this===localStorage&&key===DATA_KEY){
    nativeRemove.call(localStorage,DATA_KEY);
    nativeRemove.call(sessionStorage,SESSION_KEY);
    return;
  }
  return nativeRemove.call(this,key);
};

// Migrate any pre-V23 snapshot immediately.
const legacyPrivate=parse(nativeGet.call(sessionStorage,LEGACY_SESSION_KEY),{});
const existing=parse(nativeGet.call(localStorage,DATA_KEY),null);
if(existing){
  const mergedExisting=mergeData(existing,legacyPrivate);
  const {publicData,privateData}=splitData(mergedExisting);
  nativeSet.call(localStorage,DATA_KEY,JSON.stringify(publicData));
  nativeSet.call(sessionStorage,SESSION_KEY,JSON.stringify(privateData));
}

nativeRemove.call(sessionStorage,LEGACY_SESSION_KEY);
nativeRemove.call(localStorage,'bs-v20-sent-orders');

window.ASV23Privacy={
  version:'23.0.0',
  dataKey:DATA_KEY,
  privateStorage:'sessionStorage',
  clearPrivateSession(){nativeRemove.call(sessionStorage,SESSION_KEY);nativeRemove.call(sessionStorage,LEGACY_SESSION_KEY)}
};
})();