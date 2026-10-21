import { supabase } from "./supabase-client.js";

const $ = (id) => document.getElementById(id);
const showMessage = (message, type = "info") => {
  const el = $("form-message");
  if (!el) return;
  el.textContent = message;
  el.className = "message " + type;
  el.hidden = false;
};
const setBusy = (form, busy) => {
  const button = form?.querySelector('button[type="submit"]');
  if (button) {
    button.disabled = busy;
    button.dataset.originalText ||= button.textContent;
    button.textContent = busy ? "Please wait…" : button.dataset.originalText;
  }
};
const friendlyError = (error) => {
  const msg = String(error?.message || "Something went wrong. Please try again.");
  if (/invalid login credentials/i.test(msg)) return "Email or password is incorrect. If you haven't confirmed your email yet, check your inbox.";
  if (/user already registered/i.test(msg)) return "An account may already exist for this email. Try signing in instead.";
  if (/password should be at least/i.test(msg)) return "Choose a longer password (at least 8 characters).";
  return msg;
};

const signInForm = $("signin-form");
if (signInForm) {
  signInForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setBusy(signInForm, true);
    const email = $("email").value.trim();
    const password = $("password").value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(signInForm, false);
    if (error) return showMessage(friendlyError(error), "error");
    location.href = "account.html";
  });
}

const signUpForm = $("signup-form");
if (signUpForm) {
  signUpForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = $("password").value;
    if (password.length < 8) return showMessage("Use a password with at least 8 characters.", "error");
    if (password !== $("confirm-password").value) return showMessage("The passwords do not match.", "error");
    setBusy(signUpForm, true);
    const { data, error } = await supabase.auth.signUp({
      email: $("email").value.trim(),
      password,
      options: { emailRedirectTo: new URL("signin.html", location.href).href }
    });
    setBusy(signUpForm, false);
    if (error) return showMessage(friendlyError(error), "error");
    if (data.session) {
      showMessage("Your account is ready. Opening your account…", "success");
      location.href = "account.html";
    } else {
      showMessage("Registration received. Check your email for the confirmation link before signing in.", "success");
      signUpForm.reset();
    }
  });
}

const resetForm = $("reset-form");
if (resetForm) {
  resetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setBusy(resetForm, true);
    const redirectTo = new URL("update-password.html", location.href).href;
    const { error } = await supabase.auth.resetPasswordForEmail($("email").value.trim(), { redirectTo });
    setBusy(resetForm, false);
    if (error) return showMessage(friendlyError(error), "error");
    showMessage("If an account exists for that email, a password-reset link will be sent. Check your inbox.", "success");
    resetForm.reset();
  });
}

const updateForm = $("update-password-form");
if (updateForm) {
  updateForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = $("password").value;
    if (password.length < 8) return showMessage("Use a password with at least 8 characters.", "error");
    if (password !== $("confirm-password").value) return showMessage("The passwords do not match.", "error");
    setBusy(updateForm, true);
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setBusy(updateForm, false);
      return showMessage("This reset link is missing or expired. Request a new password-reset email.", "error");
    }
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(updateForm, false);
    if (error) return showMessage(friendlyError(error), "error");
    showMessage("Password updated successfully. You can now continue to your account.", "success");
    updateForm.reset();
    setTimeout(() => { location.href = "account.html"; }, 1200);
  });
}

if ($("account-email")) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    location.replace("signin.html");
  } else {
    $("account-email").textContent = data.user.email || "Signed-in customer";
  }
  $("signout-button")?.addEventListener("click", async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) return showMessage(friendlyError(signOutError), "error");
    location.href = "signin.html";
  });
}
