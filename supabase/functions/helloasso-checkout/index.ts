import {createClient} from 'npm:@supabase/supabase-js@2.116.0';
import {clientIp,hashKey,json,readJson,rejectOrigin} from '../_shared/http.ts';
import {helloAssoApi,helloAssoConfig,helloAssoToken,safeHelloAssoRedirect} from '../_shared/helloasso.ts';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const WEBSITE='https://lucasrx08.github.io/AS-Bon-Sauveur/';
const now=()=>new Date().toISOString();

Deno.serve(async request=>{
  const originResponse=rejectOrigin(request);if(originResponse)return originResponse;
  if(request.method!=='POST')return json(request,{error:'Méthode refusée.'},405);
  try{
    const body=await readJson(request,2048),orderId=String(body.orderId||'');
    if(!UUID.test(orderId))return json(request,{error:'Commande invalide.'},400);
    const url=Deno.env.get('SUPABASE_URL')||'',secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
    if(!url||!secret)throw new Error('SERVER_CONFIG');
    const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
    // A public order UUID is an unguessable, short-lived checkout authorization.
    const {data:order,error:orderError}=await admin.from('v20_orders')
      .select('id,reference,product_id,quantity,payment_method,paid,amount_cents,helloasso_checkout_id,helloasso_checkout_created_at,helloasso_redirect_url')
      .eq('id',orderId).maybeSingle();
    if(orderError)throw orderError;
    if(!order||order.payment_method!=='HelloAsso')return json(request,{error:'Commande non disponible pour le paiement.'},404);
    if(order.paid)return json(request,{status:'paid',reference:order.reference},200);
    const cents=Number(order.amount_cents);
    if(!Number.isSafeInteger(cents)||cents<1||cents>100000000)return json(request,{error:'Montant de commande invalide.'},409);
    const recent=order.helloasso_checkout_created_at&&Date.now()-Date.parse(order.helloasso_checkout_created_at)<15*60*1000;
    if(recent&&order.helloasso_redirect_url)return json(request,{redirectUrl:safeHelloAssoRedirect(order.helloasso_redirect_url),reference:order.reference},200);
    const ipHash=await hashKey(secret,'ha-checkout:'+clientIp(request));
    const {data:limit,error:limitError}=await admin.rpc('v22_consume_rate_limit',{p_bucket:'helloasso-checkout',p_key_hash:ipHash,p_limit:12,p_window_seconds:3600,p_block_seconds:3600});
    if(limitError)throw limitError;
    if(!limit?.allowed)return json(request,{error:'Trop de tentatives de paiement. Réessayez plus tard.'},429);
    const {data:product,error:productError}=await admin.from('v20_products').select('name').eq('id',order.product_id).maybeSingle();
    if(productError)throw productError;
    const config=helloAssoConfig(),token=await helloAssoToken(config);
    const result=await helloAssoApi(config,token,'/organizations/'+encodeURIComponent(config.organizationSlug)+'/checkout-intents',{
      totalAmount:cents,initialAmount:cents,
      itemName:((product?.name||'Boutique AS')+' × '+order.quantity+' — '+order.reference).slice(0,250),
      containsDonation:false,
      backUrl:WEBSITE+'?ha=back',
      errorUrl:WEBSITE+'?ha=error',
      returnUrl:WEBSITE+'?ha=return',
      metadata:{orderId:order.id,reference:order.reference}
    });
    const checkoutId=Number(result.id),redirectUrl=safeHelloAssoRedirect(result.redirectUrl);
    if(!Number.isSafeInteger(checkoutId)||checkoutId<=0)throw new Error('HELLOASSO_INVALID_CHECKOUT');
    const {data:saved,error:saveError}=await admin.from('v20_orders').update({
      helloasso_checkout_id:checkoutId,helloasso_checkout_created_at:now(),helloasso_redirect_url:redirectUrl
    }).eq('id',orderId).eq('paid',false).select('id').maybeSingle();
    if(saveError||!saved)throw new Error('CHECKOUT_SAVE_FAILED');
    return json(request,{redirectUrl,reference:order.reference},200);
  }catch(error){
    console.error('helloasso-checkout',error instanceof Error?error.message:'error');
    return json(request,{error:'Le paiement HelloAsso est temporairement indisponible. Votre commande est conservée.'},503);
  }
});
