// Site-wide contact details for pages that do not load the marketplace header module.
(function () {
  const style = document.createElement("style");
  style.textContent = `
    .wt-site-contact-bar{background:#eef4fb;border-bottom:1px solid #dce5f0;color:#142033;font:600 12px/1.5 Arial,sans-serif}
    .wt-site-contact-inner{max-width:1240px;margin:0 auto;padding:9px 18px;display:flex;align-items:center;justify-content:center;gap:12px 24px;flex-wrap:wrap}
    .wt-site-contact-bar a,.wt-site-contact-footer a{color:#075fc9;font-weight:800;text-decoration:none}
    .wt-site-contact-footer{margin-top:14px;padding-top:13px;border-top:1px solid #ffffff2b;display:flex;gap:8px 20px;align-items:center;flex-wrap:wrap;font-size:13px;line-height:1.6}
    .wt-site-contact-footer a{color:#fff}
    @media(max-width:560px){.wt-site-contact-inner{gap:5px 12px;padding:9px 12px;font-size:11px}.wt-site-contact-footer{gap:7px 14px}}
  `;
  document.head.append(style);
  const markup = '<span>USA: <a href="tel:+14028854995">402 885 4995</a></span><span>Togo: <a href="tel:+22892953333">+228 92 95 33 33</a></span><a href="https://wa.me/message/HFDGJCOEFS46I1" target="_blank" rel="noopener noreferrer">Message Westronix Tech on WhatsApp</a>';
  const header = document.querySelector("header");
  if (header && !document.querySelector(".wt-site-contact-bar")) {
    const bar = document.createElement("div");
    bar.className = "wt-site-contact-bar";
    const inner = document.createElement("div");
    inner.className = "wt-site-contact-inner";
    inner.innerHTML = markup;
    bar.append(inner);
    header.insertAdjacentElement("afterend", bar);
  }
  const footer = document.querySelector("footer");
  if (footer && !footer.querySelector(".wt-site-contact-footer")) {
    const contact = document.createElement("div");
    contact.className = "wt-site-contact-footer";
    contact.innerHTML = markup;
    (footer.querySelector(".inner") || footer).append(contact);
  }
})();
