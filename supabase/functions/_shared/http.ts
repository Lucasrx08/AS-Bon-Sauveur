const OFFICIAL_ORIGINS=new Set(['https://lucasrx08.github.io']);
export function corsHeaders(request:Request){
 const origin=request.headers.get('origin')||'';
 if(!OFFICIAL_ORIGINS.has(origin))return null;
 return {'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Max-Age':'86400','Vary':'Origin'};
}
export function securityHeaders(request:Request){return {...(corsHeaders(request)||{}),'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};}
export function json(request:Request,value:unknown,status=200){return new Response(JSON.stringify(value),{status,headers:securityHeaders(request)});}
export function rejectOrigin(request:Request){
 if(request.method==='OPTIONS'){const headers=corsHeaders(request);return headers?new Response(null,{status:204,headers}):json(request,{error:'Origine refusée.'},403);}
 return corsHeaders(request)?null:json(request,{error:'Origine refusée.'},403);
}
export async function readJson(request:Request,maxBytes=8192):Promise<Record<string,unknown>>{
 const declared=Number(request.headers.get('content-length')||0);if(Number.isFinite(declared)&&declared>maxBytes)throw new Error('PAYLOAD_TOO_LARGE');if(!request.body)throw new Error('INVALID_JSON');
 const reader=request.body.getReader(),chunks:Uint8Array[]=[];let total=0;try{while(true){const {done,value}=await reader.read();if(done)break;if(value){total+=value.byteLength;if(total>maxBytes){await reader.cancel();throw new Error('PAYLOAD_TOO_LARGE')}chunks.push(value)}}}finally{reader.releaseLock()}
 const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}
 let parsed:unknown;try{parsed=JSON.parse(new TextDecoder().decode(bytes))}catch{throw new Error('INVALID_JSON')}if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error('INVALID_JSON');return parsed as Record<string,unknown>;
}
export function clientIp(request:Request){const raw=request.headers.get('x-forwarded-for')?.split(',')[0]||request.headers.get('cf-connecting-ip')||request.headers.get('x-real-ip')||'unknown';return raw.trim().slice(0,128);}
export async function hashKey(secret:string,value:string){const data=new TextEncoder().encode(secret+'|'+value);const digest=await crypto.subtle.digest('SHA-256',data);return Array.from(new Uint8Array(digest)).map(byte=>byte.toString(16).padStart(2,'0')).join('');}
export function normalizeLogin(value:unknown){return String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr-FR').replace(/[’']/g,' ').replace(/[^a-z0-9]+/g,' ').trim().slice(0,120);}
export const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));