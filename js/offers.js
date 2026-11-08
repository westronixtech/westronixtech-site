import { supabase } from "./supabase-client.js";
const RATE=600, $=id=>document.getElementById(id);
const lang=()=>((localStorage.getItem("wt_language")||document.documentElement.lang)==="en"?"en":"fr");
const tr=(en,fr)=>lang()==="en"?en:fr;
const fmt=usd=>lang()==="en"?new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(usd):new Intl.NumberFormat("fr-FR",{maximumFractionDigits:0}).format(Math.round(usd*RATE/100)*100)+" FCFA";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let modal,trigger,product,status,busy=false,amount="",message="";
function ensure(){
 if(modal)return;
 modal=document.createElement("div");modal.className="wt-offer-backdrop";modal.hidden=true;
 modal.innerHTML='<section class="wt-offer-dialog" role="dialog" aria-modal="true" aria-labelledby="wtOfferTitle" tabindex="-1"><header class="wt-offer-head"><h2 id="wtOfferTitle"></h2><button type="button" class="wt-offer-close" aria-label="Close">×</button></header><div class="wt-offer-body" id="wtOfferBody"></div></section>';
 document.body.append(modal);modal.querySelector(".wt-offer-close").onclick=close;
 modal.onclick=e=>{if(e.target===modal)close()};
 modal.onkeydown=e=>{
  if(e.key==="Escape"){e.preventDefault();close();return}
  if(e.key==="Tab"){const f=[...modal.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),textarea:not(:disabled)')];if(!f.length)return;const first=f[0],last=f[f.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}
 };
}
function show(title,html){$("wtOfferTitle").textContent=title;$("wtOfferBody").innerHTML=html}
function open(){ensure();modal.hidden=false;document.body.style.overflow="hidden";modal.querySelector(".wt-offer-close").focus()}
function close(){if(!modal||modal.hidden||busy)return;modal.hidden=true;document.body.style.overflow="";trigger?.focus()}
function form(user){
 const n=Number(status.remaining),count=lang()==="en"?n+" offer"+(n===1?"":"s")+" left":n===0?"Aucune offre restante":n+" offre"+(n===1?" restante":"s restantes");
 show(tr("MAKE AN OFFER","FAIRE UNE OFFRE"),`
 <div class="wt-offer-product">${product.photos?.[0]?`<img src="${esc(product.photos[0])}" alt="">`:""}<div><h3>${esc(product.name)}</h3><p class="wt-offer-muted">${tr("Buy it now: ","Acheter maintenant : ")}<strong>${fmt(status.currentPriceUSD)}</strong></p><p class="wt-offer-muted">${count}</p></div></div>
 <label class="wt-offer-field" for="wtOfferAmount">${tr("Your offer (USD)","Votre offre (FCFA)")}</label><input class="wt-offer-input" id="wtOfferAmount" type="number" min="0.01" step="0.01" inputmode="decimal" value="${esc(amount)}" aria-describedby="wtOfferError"><p id="wtOfferError" class="wt-offer-error" role="alert" aria-live="polite"></p>
 <label class="wt-offer-field" for="wtOfferName">${tr("Your name","Votre nom")} *</label><input class="wt-offer-input" id="wtOfferName" maxlength="80" value="${esc(user.user_metadata?.display_name||"")}">
 <p class="wt-offer-muted">${tr("Account email: ","E-mail du compte : ")}${esc(user.email||"")}</p>
 <label class="wt-offer-field" for="wtOfferPhone">${tr("Phone / WhatsApp (optional)","Téléphone / WhatsApp (facultatif)")}</label><input class="wt-offer-input" id="wtOfferPhone" maxlength="30">
 <label class="wt-offer-field" for="wtOfferMessage">${tr("Message (optional)","Message (facultatif)")}</label><textarea class="wt-offer-textarea" id="wtOfferMessage" maxlength="250">${esc(message)}</textarea><p class="wt-offer-muted">${tr("Maximum 250 characters","Maximum 250 caractères")}</p>
 <div class="wt-offer-actions"><button class="btn btn-primary" id="wtOfferContinue" ${n<=0?"disabled":""}>${tr("Continue","Continuer")}</button></div>
 <details class="wt-offer-how"><summary>${tr("How offers work","Comment fonctionnent les offres")}</summary><ol>${(lang()==="en"?["Enter an amount below the listed price.","Review and submit your offer.","WESTRONIX will accept, decline, or counter the offer.","Submitting an offer does not guarantee acceptance.","The purchase is complete only after the accepted offer is confirmed and payment is completed."]:["Proposez un montant inférieur au prix affiché.","Vérifiez et envoyez votre offre.","WESTRONIX acceptera, refusera ou proposera une contre-offre.","L’envoi d’une offre ne garantit pas son acceptation.","L’achat est finalisé uniquement après confirmation de l’offre acceptée et paiement."]).map(x=>"<li>"+x+"</li>").join("")}</ol></details>`);
 $("wtOfferAmount").focus();$("wtOfferContinue").onclick=()=>review(user);
}
function review(user){
 amount=$("wtOfferAmount").value.trim();message=$("wtOfferMessage").value;
 const raw=Number(amount),usd=lang()==="fr"?raw/RATE:raw,name=$("wtOfferName").value.trim(),phone=$("wtOfferPhone").value.trim();
 let error="";if(!amount||!Number.isFinite(raw)||raw<=0)error=tr("Please enter a valid offer.","Veuillez saisir une offre valide.");
 else if(!name)error=tr("Please enter your name.","Veuillez saisir votre nom.");
 else if(usd>=Number(status.currentPriceUSD))error=tr("Your offer must be below the listed price.","Votre offre doit être inférieure au prix affiché.");
 if(error){$("wtOfferError").textContent=error;$("wtOfferAmount").setAttribute("aria-invalid","true");$("wtOfferAmount").focus();return}
 show(tr("Review your offer","Vérifiez votre offre"),`<div class="wt-offer-review"><p><b>${tr("Product:","Produit :")}</b> ${esc(product.name)}</p><p><b>${tr("Buy It Now:","Acheter maintenant :")}</b> ${fmt(status.currentPriceUSD)}</p><p><b>${tr("Your Offer:","Votre offre :")}</b> ${fmt(usd)}</p><p><b>${tr("Message:","Message :")}</b> ${esc(message||tr("No message","Aucun message"))}</p><p><b>${tr("Name:","Nom :")}</b> ${esc(name)}</p></div><p id="wtOfferSubmitError" class="wt-offer-error" role="alert"></p><div class="wt-offer-actions"><button class="btn btn-outline" id="wtOfferEdit">${tr("Edit Offer","Modifier")}</button><button class="btn btn-primary" id="wtOfferSubmit">${tr("Submit Offer","Envoyer l’offre")}</button></div>`);
 $("wtOfferEdit").onclick=()=>form(user);$("wtOfferSubmit").onclick=()=>submit({raw,name,phone,usd});
}
async function submit(v){
 if(busy)return;busy=true;const b=$("wtOfferSubmit");b.disabled=true;b.textContent=tr("Submitting...","Envoi en cours...");
 const {data,error}=await supabase.functions.invoke("submit-offer",{body:{action:"submit",sku:product.sku,offerAmount:v.raw,currency:lang()==="fr"?"FCFA":"USD",customerName:v.name,customerPhone:v.phone,message,language:lang(),idempotencyKey:crypto.randomUUID()}});
 busy=false;
 if(error||!data?.success){
  let failure=data;
  if(error?.context&&typeof error.context.json==="function"){try{failure=await error.context.json()}catch{}}
  const serverMessage=String(failure?.message||data?.message||"");
  const lowOffer=/OFFER_TOO_LOW|offer is too low|offre est trop basse/i.test(serverMessage);
  b.disabled=false;b.textContent=tr("Submit Offer","Envoyer l’offre");
  $("wtOfferSubmitError").textContent=lowOffer
   ?tr("Your offer is below the seller’s minimum accepted amount. Please submit a higher offer.","Votre offre est inférieure au montant minimum accepté par le vendeur. Veuillez proposer un montant plus élevé.")
   :tr("We could not submit your offer. Please try again.","Nous n’avons pas pu envoyer votre offre. Veuillez réessayer.");
  return
 }
 show(tr("Offer submitted!","Offre envoyée !"),`<div class="wt-offer-success"><h3>${tr("Offer submitted!","Offre envoyée !")}</h3><p>${tr("We received your offer of ","Nous avons reçu votre offre de ")}<b>${fmt(data.offerAmountUSD)}</b>.</p><p>${tr("WESTRONIX will review your offer.","WESTRONIX examinera votre offre.")}</p><p>${lang()==="en"?data.remaining+" offers left":data.remaining===0?"Aucune offre restante":data.remaining+" offre"+(data.remaining===1?" restante":"s restantes")}</p></div><div class="wt-offer-actions"><button class="btn btn-primary" id="wtOfferDone">${tr("Close","Fermer")}</button></div>`);$("wtOfferDone").onclick=close;
}
async function start(sku,el){
 trigger=el;open();show(tr("MAKE AN OFFER","FAIRE UNE OFFRE"),tr("Loading…","Chargement…"));
 const {data:session}=await supabase.auth.getSession(),user=session?.session?.user;
 if(!user){show(tr("Sign in required","Connexion requise"),`<p>${tr("Please sign in before making an offer. Your account keeps your offer limit secure.","Veuillez vous connecter avant de faire une offre. Votre compte protège votre limite d’offres.")}</p><div class="wt-offer-actions"><a class="btn btn-primary" href="signin.html">${tr("Sign in","Se connecter")}</a></div>`);return}
 try{
  const r=await fetch("inventory.json",{cache:"no-store"});if(!r.ok)throw Error();const d=await r.json();product=(d.products||[]).find(x=>x.sku===sku);
  if(!product||product.allowOffers!==true)throw Error();
  const result=await supabase.functions.invoke("submit-offer",{body:{action:"status",sku}});
  if(result.error||!result.data?.success||!result.data.offersEnabled)throw Error();
  status=result.data;form(user);
 }catch(e){show(tr("Offers are not available for this product yet. Please contact WESTRONIX.","Les offres ne sont pas encore disponibles pour ce produit. Veuillez contacter WESTRONIX."),"<p>"+tr("Please contact WESTRONIX to discuss this product.","Veuillez contacter WESTRONIX pour discuter de ce produit.")+"</p>")}
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-wt-offer-sku]");if(b){e.preventDefault();start(b.dataset.wtOfferSku,b)}});
