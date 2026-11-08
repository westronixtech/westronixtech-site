/* WESTRONIX shared currency system.
   Product and cart prices are stored as USD master values.
   The fixed display conversion is USD 1 = FCFA 600. */
(function(global){
  "use strict";
  const CFA_RATE = 600;
  function formatPrice(priceUSD, language){
    const amount = Number(priceUSD);
    if(!Number.isFinite(amount)) return "—";
    if(language === "fr"){
      const priceCFA = Math.round((amount * CFA_RATE) / 100) * 100;
      return new Intl.NumberFormat("fr-FR",{maximumFractionDigits:0}).format(priceCFA) + " FCFA";
    }
    return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(amount);
  }
  function normalizeCartItem(item){
    const copy = {...item};
    if(copy.priceCurrency !== "USD" && copy.currency !== "USD"){
      ["price","buyNow","buyNowPrice","salePrice"].forEach(key=>{
        if(copy[key] !== undefined && copy[key] !== null && copy[key] !== ""){
          const value = Number(copy[key]);
          if(Number.isFinite(value)) copy[key] = value / CFA_RATE;
        }
      });
    }
    copy.priceCurrency = "USD";
    return copy;
  }
  global.WT_CURRENCY = {CFA_RATE,formatPrice,normalizeCartItem};
  global.formatPrice = formatPrice;
})(window);
