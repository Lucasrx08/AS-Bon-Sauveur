(()=>{'use strict';
// Bound the entire operation, including a possible authentication wait before fetch.
async function request(query,timeout=15000){
 const controller=new AbortController();let timer;
 const pending=query?.abortSignal?query.abortSignal(controller.signal):query;
 try{return await Promise.race([Promise.resolve(pending),new Promise((_,reject)=>{timer=setTimeout(()=>{const e=new Error('Le serveur ne répond pas. L’enregistrement n’est pas confirmé : actualisez les données avant de réessayer.');e.code='REQUEST_TIMEOUT';reject(e);controller.abort()},timeout)})])}finally{clearTimeout(timer)}
}
window.__BS_REQUEST=request;
})();
