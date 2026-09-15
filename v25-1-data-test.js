(() => {
'use strict';
async function saveLicense(row){
 const client=window.__BS_SUPABASE_CLIENT;
 if(!client)throw new Error('Connexion indisponible');
 const result=await client.from('v20_licenses').upsert(row);
 if(result.error)throw result.error;
 return true;
}
window.__V251_SAVE_LICENSE=saveLicense;
})();