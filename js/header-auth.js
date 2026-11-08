import { supabase } from "./supabase-client.js";

const ACCOUNT_LABEL = "Account";
const ACCOUNT_PATH = "signin.html";
let activeUserId = null;
let authGeneration = 0;

const accountLinks = () => {
  const headers = [...document.querySelectorAll("header")];
  const matches = headers.flatMap((header) =>
    [...header.querySelectorAll("a[href]")].filter((link) => {
      try {
        return link.classList.contains("wt-account-trigger") || new URL(link.getAttribute("href"), location.href).pathname.endsWith("/signin.html");
      } catch {
        return false;
      }
    })
  );

  if (matches.length) return matches;

  // A few older pages have a compact header without an Account link.
  const header = headers[0];
  const nav = header?.querySelector("nav, .tools, .header-tools, .nav-right");
  if (!nav) return [];

  const link = document.createElement("a");
  link.href = ACCOUNT_PATH;
  link.className = "wt-account-trigger";
  link.textContent = ACCOUNT_LABEL;
  link.setAttribute("aria-label", ACCOUNT_LABEL);
  nav.append(link);
  return [link];
};

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
    const item = document.createElement("a");
    item.href = href;
    item.textContent = label;
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
  document.querySelectorAll(".wt-account-dropdown").forEach((menu) => {
    menu.hidden = true;
  });
  document.querySelectorAll(".wt-account-trigger[aria-expanded]").forEach((link) => {
    link.setAttribute("aria-expanded", "false");
  });
}

function installStyles() {
  if (document.getElementById("wt-account-menu-styles")) return;
  const style = document.createElement("style");
  style.id = "wt-account-menu-styles";
  style.textContent = `
    .wt-account-menu{position:relative;display:inline-flex;align-items:center;z-index:1000}
    .wt-account-trigger{white-space:nowrap;cursor:pointer}
    .wt-account-dropdown{position:absolute;top:calc(100% + 8px);right:0;min-width:174px;padding:7px;background:#fff;color:#142033;border:1px solid #dce4ee;border-radius:9px;box-shadow:0 12px 30px rgba(7,21,38,.2);z-index:10000;text-align:left}
    .wt-account-dropdown[hidden]{display:none}
    .wt-account-dropdown a,.wt-account-dropdown button{display:block;width:100%;padding:10px 12px;border:0;border-radius:6px;background:transparent;color:#142033;text-align:left;text-decoration:none;font:inherit;font-size:13px;font-weight:600;line-height:1.35;cursor:pointer;white-space:nowrap}
    .wt-account-dropdown a:hover,.wt-account-dropdown button:hover{background:#eef5ff;color:#075fc9}
    .wt-account-dropdown button:disabled{opacity:.6;cursor:wait}
    .wt-account-divider{height:1px;background:#e5eaf1;margin:5px 4px}
    @media(max-width:760px){.wt-account-menu{z-index:10001}.wt-account-dropdown{right:0;left:auto;max-width:min(82vw,230px)}}
  `;
  document.head.append(style);
}

function customerName(user) {
  const metadata = user?.user_metadata || {};
  const firstName = String(metadata.first_name || "").trim();
  const fullName = String(metadata.full_name || "").trim();
  // display_name is retained as a compatibility fallback for existing WESTRONIX signups.
  const legacyDisplayName = String(metadata.display_name || "").trim();
  return firstName || fullName || legacyDisplayName;
}

function renderAccountState(user, name = "") {
  const signedIn = Boolean(user);
  for (const link of accountLinks()) {
    ensureMenu(link);
    link.dataset.wtAuthenticated = signedIn ? "true" : "";
    link.href = signedIn ? "account.html" : (link.dataset.wtOriginalHref || ACCOUNT_PATH);
    if (signedIn && name) {
      link.textContent = `Hello, ${name} ▾`;
      link.setAttribute("aria-label", `Hello, ${name}. Open account menu`);
    } else if (signedIn) {
      link.textContent = ACCOUNT_LABEL;
      link.setAttribute("aria-label", ACCOUNT_LABEL);
    } else {
      link.innerHTML = link.dataset.wtOriginalHtml || ACCOUNT_LABEL;
      link.setAttribute("aria-label", ACCOUNT_LABEL);
    }
  }
  if (!signedIn) closeMenus();
}

async function updateFromSession(session) {
  const generation = ++authGeneration;
  const user = session?.user || null;
  activeUserId = user?.id || null;

  if (!user) {
    renderAccountState(null);
    return;
  }

  // Show available session metadata immediately; refresh it from the authenticated user.
  renderAccountState(user, customerName(user));

  try {
    const { data, error } = await supabase.auth.getUser(session.access_token);
    if (generation !== authGeneration || activeUserId !== user.id) return;
    if (error) throw error;

    const authenticatedUser = data?.user;
    if (!authenticatedUser) throw new Error("Supabase returned no authenticated user profile.");

    const name = customerName(authenticatedUser);
    if (!name) {
      console.error(
        "WESTRONIX header: signed-in customer profile has no first_name or full_name (or legacy display_name); showing Account.",
        { userId: authenticatedUser.id }
      );
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

installStyles();
const initialLinks = accountLinks();
initialLinks.forEach(ensureMenu);

document.addEventListener("click", (event) => {
  if (!event.target.closest(".wt-account-menu")) closeMenus();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenus();
});

const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
  // Defer Supabase calls until after its auth callback has released its internal lock.
  Promise.resolve().then(() => updateFromSession(session));
});

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
