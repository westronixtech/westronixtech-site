// Footer contact details for standalone pages that do not load the marketplace header module.
(function () {
  if (document.getElementById("wt-site-contact-styles")) return;
  const style = document.createElement("style");
  style.id = "wt-site-contact-styles";
  style.textContent = `
    .wt-site-contact-footer{margin-top:10px;padding-top:10px;border-top:1px solid #ffffff2b;display:flex;gap:8px 20px;align-items:center;flex-wrap:wrap;font-size:13px;line-height:1.6}
    .wt-site-contact-footer a{color:#fff;font-weight:800;text-decoration:none}
    .wt-site-contact-footer a:hover{text-decoration:underline}
    @media(max-width:560px){.wt-site-contact-footer{gap:7px 14px}}
  `;
  document.head.append(style);
  const footer = document.querySelector("footer");
  if (!footer || footer.querySelector(".wt-site-contact-footer")) return;
  const email = [...footer.querySelectorAll('a[href^="mailto:"]')].find(link => /westronix\.tech@gmail\.com/i.test(link.href));
  let emailRow = email?.closest("p, div") || null;
  if (!emailRow) {
    const inner = footer.querySelector(".inner, .foot, .container") || footer;
    emailRow = document.createElement("p");
    emailRow.innerHTML = 'Email: <a href="mailto:westronix.tech@gmail.com">westronix.tech@gmail.com</a>';
    inner.append(emailRow);
  } else {
    emailRow.innerHTML = 'Email: <a href="mailto:westronix.tech@gmail.com">westronix.tech@gmail.com</a>';
  }
  [...footer.querySelectorAll("p")].forEach(row => {
    if (row !== emailRow && (/402\\s*885\\s*4995|\\+228\\s*92\\s*95\\s*33\\s*33|Message Westronix Tech on WhatsApp/i.test(row.textContent))) row.remove();
  });
  const contact = document.createElement("div");
  contact.className = "wt-site-contact-footer";
  contact.innerHTML = '<span>USA: <a href="tel:+14028854995">402 885 4995</a></span><span>Togo: <a href="tel:+22892953333">+228 92 95 33 33</a></span><a href="https://wa.me/message/HFDGJCOEFS46I1" target="_blank" rel="noopener noreferrer">Message Westronix Tech on WhatsApp</a>';
  emailRow.insertAdjacentElement("afterend", contact);
})();
