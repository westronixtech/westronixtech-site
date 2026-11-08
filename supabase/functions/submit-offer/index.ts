import {createClient} from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"https://westronixtech.com","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const reply=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...cors,"Content-Type":"application/json"}});
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return reply({success:false},405);
 try{
  const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");if(!token)return reply({success:false,message:"Sign in required"},401);
  const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!,secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authClient=createClient(url,anon,{global:{headers:{Authorization:`Bearer ${token}`}}});
  const {data:u,error:ue}=await authClient.auth.getUser();if(ue||!u.user)return reply({success:false,message:"Sign in required"},401);
  const admin=createClient(url,secret),body=await req.json(),sku=String(body.sku||"").trim();
  if(!/^[A-Z0-9-]{3,80}$/.test(sku))return reply({success:false},400);
  const ir=await fetch(Deno.env.get("SITE_INVENTORY_URL")||"https://westronixtech.com/inventory.json",{cache:"no-store"});
  if(!ir.ok)throw Error("Inventory fetch failed");const catalog=await ir.json(),p=(catalog.products||[]).find((x:any)=>x.sku===sku);
  if(!p||p.allowOffers!==true)return reply({success:false,message:"Offers disabled"},404);
  const price=Number(p.salePrice)>0&&Number(p.salePrice)<Number(p.price)?Number(p.salePrice):Number(p.price);
  if(!Number.isFinite(price)||price<=0)return reply({success:false},409);
  const {data:r,error:re}=await admin.from("offer_product_rules").select("enabled,max_offers").eq("sku",sku).maybeSingle();if(re)throw re;
  if(!r?.enabled)return reply({success:false,message:"Offers disabled"},404);
  const {count,error:ce}=await admin.from("offers").select("id",{count:"exact",head:true}).eq("customer_id",u.user.id).eq("sku",sku);if(ce)throw ce;
  const remaining=Math.max(Number(r.max_offers)-(count||0),0);
  if(body.action==="status")return reply({success:true,offersEnabled:true,remaining,maxOffers:r.max_offers,currentPriceUSD:price});
  if(body.action!=="submit")return reply({success:false},400);
  const raw=Number(body.offerAmount),currency=body.currency==="FCFA"?"FCFA":"USD",offerUSD=currency==="FCFA"?raw/600:raw;
  if(!Number.isFinite(raw)||raw<=0||offerUSD>=price)return reply({success:false,message:body.language==="en"?"Please enter a valid offer.":"Veuillez saisir une offre valide."},400);
  if(remaining<=0)return reply({success:false,message:"OFFER_LIMIT_REACHED"},409);
  const name=String(body.customerName||u.user.user_metadata?.display_name||"").trim().slice(0,80),email=String(u.user.email||"").trim();
  if(!name||!email)return reply({success:false,message:"Name and verified account email are required"},400);
  const idem=String(body.idempotencyKey||"");if(!/^[0-9a-f-]{36}$/i.test(idem))return reply({success:false},400);
  const msg=String(body.message||"").slice(0,250),lang=body.language==="en"?"en":"fr",shown=currency==="FCFA"?Math.round(offerUSD*600/100)*100:offerUSD;
  const {data:s,error:se}=await admin.rpc("submit_offer_atomic",{p_customer_id:u.user.id,p_sku:sku,p_product_name:String(p.name||"").slice(0,240),p_asking_price_usd:price,p_offer_amount_usd:offerUSD,p_displayed_amount:shown,p_displayed_currency:currency,p_customer_name:name,p_customer_email:email,p_customer_phone:String(body.customerPhone||"").slice(0,30),p_message:msg,p_language:lang,p_idempotency_key:idem});
  if(se){const m=String(se.message||"");if(m.includes("OFFER_TOO_LOW"))return reply({success:false,message:lang==="en"?"Your offer is too low. Please submit a higher offer.":"Votre offre est trop basse. Veuillez proposer un montant plus élevé."},400);if(m.includes("OFFER_LIMIT_REACHED"))return reply({success:false,message:lang==="en"?"No offers left.":"Aucune offre restante."},409);if(m.includes("INVALID_AMOUNT"))return reply({success:false,message:lang==="en"?"Please enter a valid offer.":"Veuillez saisir une offre valide."},400);throw se;}
  return reply({success:true,remaining:s.remaining,offerAmountUSD:Number(s.offer_amount_usd),offerId:s.offer_id});
 }catch(e){console.error(e);return reply({success:false,message:"We could not submit your offer. Please try again."},500)}
});
