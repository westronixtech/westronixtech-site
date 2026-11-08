import { supabase } from "./supabase-client.js";

const ACCOUNT_LABEL = "Account";
const ACCOUNT_PATH = "signin.html";
const CART_KEY = "wt_cart";
let activeUserId = null;
let authGeneration = 0;


function normalizeLanguage(value) {
  return String(value || "").toLowerCase() === "en" ? "en" : "fr";
}

function applyHeaderLanguage(value) {
  const language = normalizeLanguage(value);
  document.documentElement.lang = language;
  document.body.classList.remove("language-en", "language-fr", "lang-en", "lang-fr");
  document.body.classList.add(`language-${language}`, `lang-${language}`);
  try {
    localStorage.setItem("wt_language", language);
  } catch (error) {
    console.warn("WESTRONIX header: language preference could not be saved.", error);
  }
  document.querySelectorAll('header select#language, header select#languageSelect, header select.language-select, header select.lang').forEach((select) => {
    if (select.value !== language) select.value = language;
  });
}

function installHeaderLanguage(header) {
  const selector = header.querySelector(
    'select#language, select#languageSelect, select.language-select, select.lang, select[aria-label*="Language"], select[aria-label*="Langue"]'
  );
  let initialLanguage = "fr";
  try {
    const saved = localStorage.getItem("wt_language");
    initialLanguage = saved === "en" || saved === "fr"
      ? saved
      : normalizeLanguage(document.documentElement.lang);
  } catch (error) {
    initialLanguage = normalizeLanguage(document.documentElement.lang);
  }
  applyHeaderLanguage(initialLanguage);
  if (selector && !selector.dataset.wtLanguageBound) {
    selector.dataset.wtLanguageBound = "true";
    selector.addEventListener("change", () => applyHeaderLanguage(selector.value));
  }
}

function headerElements(header) {
  const language = header.querySelector(
    'select#language, select#languageSelect, select.language-select, select.lang, select[aria-label*="Language"], select[aria-label*="Langue"]'
  );
  const account = [...header.querySelectorAll("a[href]")].find((link) => {
    try {
      return !link.closest("nav") && new URL(link.getAttribute("href"), location.href).pathname.endsWith("/signin.html");
    } catch { return false; }
  });
  const cart = [...header.querySelectorAll("a[href], button[onclick]")].find((item) => {
    const href = item.getAttribute("href");
    if (href) {
      try {
        if (new URL(href, location.href).pathname.endsWith("/cart.html")) return true;
      } catch { /* Check the existing button handler below. */ }
    }
    return item.tagName === "BUTTON" && /cart\.html/i.test(item.getAttribute("onclick") || "");
  });
  return { language, account, cart };
}

function accountWrapper(link) {
  return link.closest(".wt-account-menu") || link;
}

function createLink(href, className, text) {
  const link = document.createElement("a");
  link.href = href;
  link.className = className;
  link.textContent = text;
  return link;
}

function setupRightNavigation(header) {
  if (header.querySelector(".wt-market-nav")) return header.querySelector(".wt-market-nav");
  const { language, account, cart } = headerElements(header);
  const host = language?.parentElement ||
    account?.parentElement ||
    cart?.parentElement ||
    header.querySelector(".tools, .header-tools, .header-actions, .toprow, .header-inner, .inner");
  if (!host) return null;

  const nav = document.createElement("div");
  nav.className = "wt-market-nav";
  nav.setAttribute("aria-label", "Customer navigation");

  if (language) {
    const languageWrap = document.createElement("label");
    languageWrap.className = "wt-language-item";
    languageWrap.setAttribute("aria-label", "Select website language");
    languageWrap.append(language);
    language.classList.add("wt-language-select");
    [...language.options].forEach((option) => {
      const code = option.value.toLowerCase();
      option.textContent = code === "fr" ? "🇫🇷 FR ▾" : "🇺🇸 EN ▾";
    });
    nav.append(languageWrap);
  }

  let accountItem = account ? accountWrapper(account) : null;
  if (!accountItem) {
    const newAccount = createLink(ACCOUNT_PATH, "wt-account-trigger", ACCOUNT_LABEL);
    accountItem = newAccount;
  }
  nav.append(accountItem);

  const orders = createLink("account.html#orders", "wt-orders-link", "");
  orders.innerHTML = '<span>Orders</span><span>&amp; Returns</span>';
  orders.setAttribute("aria-label", "Orders and Returns");
  nav.append(orders);

  let cartItem = cart;
  if (!cartItem) cartItem = createLink("cart.html", "wt-cart-link", "");
  cartItem.classList.remove("cart-button", "cart-link");
  cartItem.classList.add("wt-cart-link");
  cartItem.setAttribute("aria-label", "Shopping cart");
  nav.append(cartItem);

  host.append(nav);
  return nav;
}

function ensureMenu(link) {
  if (link.closest(".wt-account-menu")) return link.closest(".wt-account-menu");

  const wrapper = document.createElement("span");
  wrapper.className = "wt-account-menu";
  link.parentNode.insertBefore(wrapper, link);
  wrapper.append(link);

  link.classList.add("wt-account-trigger");
  link.dataset.wtOriginalHtml = link.innerHTML;
  link.dataset.wtOriginalHref = link.getAttribute("href") || ACCOUNT_PATH;

  const menu = document.createElement("div");
  menu.className = "wt-account-dropdown";
  menu.hidden = true;
  menu.setAttribute("role", "menu");

  const entries = [
    ["My Account", "account.html"],
    ["My Orders", "account.html#orders"],
    ["Profile", "account.html#profile"]
  ];
  for (const [label, href] of entries) {
    const item = createLink(href, "", label);
    item.setAttribute("role", "menuitem");
    menu.append(item);
  }

  const divider = document.createElement("div");
  divider.className = "wt-account-divider";
  divider.setAttribute("aria-hidden", "true");
  menu.append(divider);

  const signOut = document.createElement("button");
  signOut.type = "button";
  signOut.textContent = "Sign Out";
  signOut.setAttribute("role", "menuitem");
  signOut.addEventListener("click", async () => {
    signOut.disabled = true;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      closeMenus();
    } catch (error) {
      console.error("WESTRONIX header: sign out failed.", error);
      signOut.disabled = false;
    }
  });
  menu.append(signOut);
  wrapper.append(menu);

  link.addEventListener("click", (event) => {
    if (!link.dataset.wtAuthenticated) return;
    event.preventDefault();
    const shouldOpen = menu.hidden;
    closeMenus();
    menu.hidden = !shouldOpen;
    link.setAttribute("aria-expanded", String(shouldOpen));
  });

  link.setAttribute("aria-haspopup", "true");
  link.setAttribute("aria-expanded", "false");
  return wrapper;
}

function closeMenus() {
  document.querySelectorAll(".wt-account-dropdown").forEach((menu) => { menu.hidden = true; });
  document.querySelectorAll(".wt-account-trigger[aria-expanded]").forEach((link) => {
    link.setAttribute("aria-expanded", "false");
  });
}

function installStyles() {
  if (document.getElementById("wt-market-nav-styles")) return;
  const style = document.createElement("style");
  style.id = "wt-market-nav-styles";
  style.textContent = `
    header .lang-en,header .lang-fr,header .en,header .fr{display:none!important}
    html[lang="en"] header .lang-en,html[lang="en"] header .en{display:revert!important}
    html[lang="fr"] header .lang-fr,html[lang="fr"] header .fr{display:revert!important}
    .wt-market-nav{display:flex;align-items:center;justify-content:flex-end;gap:clamp(12px,1.7vw,24px);min-height:48px;color:#fff;white-space:nowrap;font-family:inherit;font-size:12px;font-weight:700}
    .wt-language-item{display:inline-flex;align-items:center}
    .wt-language-select{appearance:none;-webkit-appearance:none;max-width:104px;border:1px solid #ffffff38!important;border-radius:6px!important;background:#ffffff10!important;color:#fff!important;padding:8px 7px!important;font:inherit!important;font-size:12px!important;font-weight:800!important;cursor:pointer}
    .wt-language-select option{background:#fff;color:#142033}
    .wt-account-menu{position:relative;display:inline-flex;align-items:center;z-index:1000}
    .wt-account-trigger{display:flex!important;flex-direction:column;align-items:flex-start;justify-content:center;gap:2px;min-height:42px;color:#fff!important;text-decoration:none!important;line-height:1.15;white-space:nowrap;cursor:pointer}
    .wt-account-greeting{font-size:11px;font-weight:500;color:#d5dfeb}
    .wt-account-greeting strong{font-size:12px;font-weight:900;color:#fff;letter-spacing:.35px}
    .wt-account-label{font-size:12px;font-weight:800;color:#fff}
    .wt-orders-link{display:flex;flex-direction:column;justify-content:center;gap:2px;min-height:42px;color:#fff!important;text-decoration:none!important;line-height:1.15;font-size:12px;font-weight:800}
    .wt-cart-link{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:5px;min-height:40px;padding:5px 0;border-radius:0;background:transparent;color:#fff!important;text-decoration:none!important;font-size:13px;font-weight:900}
    .wt-cart-icon{display:block;width:31px;height:27px;overflow:visible;flex:none}
    .wt-cart-icon path,.wt-cart-icon circle{fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
    .wt-cart-count{position:absolute;top:-1px;left:10px;min-width:13px;color:#ff8a00;font-size:14px;font-weight:900;line-height:1;text-align:center;text-shadow:0 1px 2px #071526}
    .wt-cart-label{color:#fff;font-size:13px;font-weight:900}
    .wt-market-nav a:hover{color:#9bc8ff!important}
    .wt-account-dropdown{position:absolute;top:calc(100% + 8px);right:0;min-width:174px;padding:7px;background:#fff;color:#142033;border:1px solid #dce4ee;border-radius:9px;box-shadow:0 12px 30px rgba(7,21,38,.2);z-index:10000;text-align:left}
    .wt-account-dropdown[hidden]{display:none}
    .wt-account-dropdown a,.wt-account-dropdown button{display:block;width:100%;padding:10px 12px;border:0;border-radius:6px;background:transparent;color:#142033;text-align:left;text-decoration:none;font:inherit;font-size:13px;font-weight:600;line-height:1.35;cursor:pointer;white-space:nowrap}
    .wt-account-dropdown a:hover,.wt-account-dropdown button:hover{background:#eef5ff;color:#075fc9}
    .wt-account-dropdown button:disabled{opacity:.6;cursor:wait}
    .wt-account-divider{height:1px;background:#e5eaf1;margin:5px 4px}
    @media(max-width:760px){.wt-market-nav{gap:8px;flex-wrap:nowrap;font-size:11px}.wt-account-greeting{font-size:10px}.wt-account-label,.wt-orders-link{font-size:11px}.wt-cart-link{padding:6px 7px;font-size:11px}.wt-language-select{max-width:86px;padding:7px 4px!important;font-size:11px!important}.wt-account-dropdown{right:0;left:auto;max-width:min(82vw,230px)}}
  `;
  document.head.append(style);
}

function customerName(user) {
  const metadata = user?.user_metadata || {};
  const firstName = String(metadata.first_name || "").trim();
  const fullName = String(metadata.full_name || "").trim();
  const legacyDisplayName = String(metadata.display_name || "").trim();
  const chosen = firstName || fullName || legacyDisplayName;
  return chosen ? chosen.split(/\s+/)[0].toUpperCase() : "";
}

function renderAccountState(user, name = "") {
  const signedIn = Boolean(user);
  for (const header of document.querySelectorAll("header")) {
    const nav = setupRightNavigation(header);
    if (!nav) continue;
    const accountLink = nav.querySelector(".wt-account-trigger") ||
      [...nav.querySelectorAll("a")].find((a) => a.href.includes("signin.html"));
    if (accountLink) {
      const wrapper = ensureMenu(accountLink);
      const trigger = wrapper.querySelector(".wt-account-trigger");
      trigger.dataset.wtAuthenticated = signedIn ? "true" : "";
      trigger.href = signedIn ? "account.html" : (trigger.dataset.wtOriginalHref || ACCOUNT_PATH);
      if (signedIn && name) {
        trigger.replaceChildren();
        const greeting = document.createElement("span");
        greeting.className = "wt-account-greeting";
        greeting.append(document.createTextNode("Hello, "));
        const strong = document.createElement("strong");
        strong.textContent = name;
        greeting.append(strong);
        const label = document.createElement("span");
        label.className = "wt-account-label";
        label.textContent = "My Account ▾";
        trigger.append(greeting, label);
        trigger.setAttribute("aria-label", `Hello, ${name}. Open My Account menu`);
      } else if (signedIn) {
        trigger.textContent = ACCOUNT_LABEL;
        trigger.setAttribute("aria-label", ACCOUNT_LABEL);
      } else {
        trigger.innerHTML = trigger.dataset.wtOriginalHtml || ACCOUNT_LABEL;
        trigger.setAttribute("aria-label", ACCOUNT_LABEL);
      }
    }
    const orders = nav.querySelector(".wt-orders-link");
    if (orders) orders.href = signedIn ? "account.html#orders" : ACCOUNT_PATH;
    updateCartCount(nav);
  }
  if (!signedIn) closeMenus();
}

function readCartCount() {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    if (!Array.isArray(cart)) return 0;
    return cart.reduce((sum, item) => {
      const quantity = Number(item?.quantity);
      return sum + (Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1);
    }, 0);
  } catch (error) {
    console.error("WESTRONIX header: could not read the shopping cart count.", error);
    return 0;
  }
}

function updateCartCount(nav) {
  const link = nav.querySelector(".wt-cart-link");
  if (!link) return;
  const count = readCartCount();
  link.innerHTML = '<svg class="wt-cart-icon" viewBox="0 0 32 28" aria-hidden="true" focusable="false"><path d="M2 3h4l3.1 15.1a2.2 2.2 0 0 0 2.2 1.8h13.1a2.2 2.2 0 0 0 2.1-1.6L29 8H7"/><circle cx="12.5" cy="24.5" r="1.6"/><circle cx="24" cy="24.5" r="1.6"/></svg><span class="wt-cart-count"></span><span class="wt-cart-label">Cart</span>';
  link.querySelector(".wt-cart-count").textContent = String(count);
  link.setAttribute("aria-label", `Shopping cart, ${count} items`);
}

function refreshAllCartCounts() {
  document.querySelectorAll(".wt-market-nav").forEach(updateCartCount);
}

function installCartCountSync() {
  if (window.__wtHeaderCartSyncInstalled) return;
  window.__wtHeaderCartSyncInstalled = true;
  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;
  Storage.prototype.setItem = function(key, value) {
    const result = originalSetItem.call(this, key, value);
    if (key === CART_KEY) window.dispatchEvent(new Event("wt:cart-updated"));
    return result;
  };
  Storage.prototype.removeItem = function(key) {
    const result = originalRemoveItem.call(this, key);
    if (key === CART_KEY) window.dispatchEvent(new Event("wt:cart-updated"));
    return result;
  };
  window.addEventListener("wt:cart-updated", refreshAllCartCounts);
  window.addEventListener("storage", (event) => {
    if (event.key === CART_KEY || event.key === null) refreshAllCartCounts();
  });
}

installStyles();
installCartCountSync();
for (const header of document.querySelectorAll("header")) {
  installHeaderLanguage(header);
  setupRightNavigation(header);
}

document.addEventListener("click", (event) => {
  if (!event.target.closest(".wt-account-menu")) closeMenus();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenus();
});

const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
  Promise.resolve().then(() => updateFromSession(session));
});

async function updateFromSession(session) {
  const generation = ++authGeneration;
  const user = session?.user || null;
  activeUserId = user?.id || null;
  if (!user) {
    renderAccountState(null);
    return;
  }
  renderAccountState(user, customerName(user));
  try {
    const { data, error } = await supabase.auth.getUser(session.access_token);
    if (generation !== authGeneration || activeUserId !== user.id) return;
    if (error) throw error;
    const authenticatedUser = data?.user;
    if (!authenticatedUser) throw new Error("Supabase returned no authenticated user profile.");
    const name = customerName(authenticatedUser);
    if (!name) {
      console.error("WESTRONIX header: signed-in customer profile has no first_name or full_name (or legacy display_name); showing Account.", { userId: authenticatedUser.id });
      renderAccountState(authenticatedUser);
      return;
    }
    renderAccountState(authenticatedUser, name);
  } catch (error) {
    if (generation !== authGeneration || activeUserId !== user.id) return;
    console.error("WESTRONIX header: could not load the authenticated customer profile; showing Account.", error);
    renderAccountState(user);
  }
}

const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
if (sessionError) {
  console.error("WESTRONIX header: could not restore the existing sign-in session.", sessionError);
  renderAccountState(null);
} else if (sessionData?.session) {
  await updateFromSession(sessionData.session);
} else {
  renderAccountState(null);
}

window.addEventListener("pagehide", () => {
  authListener?.subscription?.unsubscribe();
});
