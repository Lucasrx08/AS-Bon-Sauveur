// HelloAsso API calls are server-only. Never expose these credentials to GitHub Pages.
export function helloAssoConfig(){
  const organizationSlug=Deno.env.get('HELLOASSO_ORG_SLUG')||'';
  const clientId=Deno.env.get('HELLOASSO_CLIENT_ID')||'';
  const clientSecret=Deno.env.get('HELLOASSO_CLIENT_SECRET')||'';
  if(!/^[a-z0-9-]+$/.test(organizationSlug)||!clientId||!clientSecret)throw new Error('HELLOASSO_NOT_CONFIGURED');
  return {organizationSlug,clientId,clientSecret};
}
export async function helloAssoToken(config:ReturnType<typeof helloAssoConfig>){
  const params=new URLSearchParams({grant_type:'client_credentials',client_id:config.clientId,client_secret:config.clientSecret});
  const response=await fetch('https://api.helloasso.com/oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:params});
  if(!response.ok)throw new Error('HELLOASSO_AUTH_FAILED');
  const data=await response.json();
  if(typeof data.access_token!=='string'||!data.access_token)throw new Error('HELLOASSO_AUTH_FAILED');
  return data.access_token as string;
}
export async function helloAssoApi(config:ReturnType<typeof helloAssoConfig>,token:string,path:string,body?:unknown){
  const response=await fetch('https://api.helloasso.com/v5'+path,{method:body===undefined?'GET':'POST',headers:{Authorization:'Bearer '+token,Accept:'application/json',...(body===undefined?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});
  if(!response.ok)throw new Error('HELLOASSO_API_'+response.status);
  return await response.json();
}
export function safeHelloAssoRedirect(value:unknown){
  const link=new URL(String(value||''));
  if(link.protocol!=='https:'||link.hostname!=='www.helloasso.com')throw new Error('HELLOASSO_INVALID_REDIRECT');
  return link.href;
}
