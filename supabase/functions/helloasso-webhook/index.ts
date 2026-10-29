import {createClient} from 'npm:@supabase/supabase-js@2.116.0';
import {helloAssoApi,helloAssoConfig,helloAssoToken} from '../_shared/helloasso.ts';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const reply=(status:number)=>new Response(null,{status,headers:{'Cache-Control':'no-store'}});
Deno.serve(async request=>{
  if(request.method!=='POST')return reply(405);
  try{
    const raw=await request.text();
    if(raw.length>65536)return reply(413);
    const notice=JSON.parse(raw);
    if(notice?.eventType!=='Payment')return reply(204);
    const orderId=String(notice.metadata?.orderId||'');
    const paymentId=Number(notice.data?.id);
    if(!UUID.test(orderId)||!Number.isSafeInteger(paymentId)||paymentId<=0)return reply(204);
    const url=Deno.env.get('SUPABASE_URL')||'',secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
    if(!url||!secret)throw new Error('SERVER_CONFIG');
    const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:order,error:findError}=await admin.from('v20_orders')
      .select('id,payment_method,paid,amount_cents,helloasso_checkout_id,helloasso_payment_id')
      .eq('id',orderId).maybeSingle();
    if(findError)throw findError;
    if(!order||order.payment_method!=='HelloAsso'||!order.helloasso_checkout_id)return reply(204);
    const config=helloAssoConfig(),token=await helloAssoToken(config);
    // Do not trust webhook content or the browser's "succeeded" return parameter.
    // Re-fetch both records from the authenticated HelloAsso API.
    const checkout=await helloAssoApi(config,token,
      '/organizations/'+encodeURIComponent(config.organizationSlug)+'/checkout-intents/'+order.helloasso_checkout_id);
    const payment=await helloAssoApi(config,token,'/payments/'+paymentId);
    const verifiedOrder=checkout.order;
    const matchingOrderId=Number(payment.orderId||payment.order?.id||0)===Number(verifiedOrder?.id);
    const appearsInOrder=Array.isArray(verifiedOrder?.payments)&&verifiedOrder.payments.some((p:{id:number})=>Number(p.id)===paymentId);
    if(String(checkout.metadata?.orderId||'')!==orderId||!verifiedOrder||verifiedOrder.organizationSlug!==config.organizationSlug||(!matchingOrderId&&!appearsInOrder))return reply(409);
    const cents=Number(order.amount_cents);
    if(!Number.isSafeInteger(cents)||Number(payment.amount)!==cents)return reply(409);
    if(verifiedOrder.amount?.total!=null&&Number(verifiedOrder.amount.total)!==cents)return reply(409);
    const state=String(payment.state||'');
    if(state==='Authorized'){
      if(order.helloasso_payment_id&&Number(order.helloasso_payment_id)!==paymentId)return reply(409);
      const {error}=await admin.from('v20_orders').update({
        paid:true,helloasso_paid_at:new Date().toISOString(),helloasso_payment_id:paymentId,helloasso_payment_state:'Authorized'
      }).eq('id',orderId).eq('helloasso_checkout_id',order.helloasso_checkout_id).eq('payment_method','HelloAsso');
      if(error)throw error;
    }else if(['Refunded','Contested'].includes(state)){
      if(Number(order.helloasso_payment_id)!==paymentId)return reply(204);
      const {error}=await admin.from('v20_orders').update({paid:false,helloasso_payment_state:state})
        .eq('id',orderId).eq('helloasso_payment_id',paymentId);
      if(error)throw error;
    }
    return reply(204);
  }catch(error){
    console.error('helloasso-webhook',error instanceof Error?error.message:'error');
    // HelloAsso retries non-2xx deliveries; never acknowledge a failed reconciliation.
    return reply(503);
  }
});
