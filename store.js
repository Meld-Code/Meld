/* =====================================================================
   MELD STORE
   One-time purchases + memberships, shown as a modal on any page.
     window.MeldStore.open()            open the store
     window.MeldStore.open("memberships")
     window.MELD_ENTITLEMENTS           live perks (adFree, vip, nameChangeCredits …)
   Event "meld:entitlements" fires whenever the perks change.

   HOW PAYMENTS WORK (no server needed to start):
   - Put a Stripe Payment Link (or any checkout URL) in config.js → STORE.
   - We append  client_reference_id=<uid>  so you can see who paid.
   - After payment, grant the perk from Owner Tools (Live Announcements panel).
   Perks live at  users/<uid>/entitlements  and can ONLY be written by you
   if you apply the rules in UPGRADE-NOTES.md.
   ===================================================================== */
import {
  auth, db, ref, onValue, onAuthStateChanged, CFG, entitlementsActive, escapeHtml
} from "./meld-core.js";

const CSS = `
#meldStoreOverlay{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(3,6,3,.74);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
#meldStoreOverlay.open{display:flex;animation:msFade .2s ease}
@keyframes msFade{from{opacity:0}to{opacity:1}}
.msPanel{position:relative;display:flex;flex-direction:column;width:min(860px,100%);max-height:min(720px,94vh);overflow:hidden;border:1px solid #45533d;border-radius:20px;background:radial-gradient(ellipse at 50% -10%,#76b90020,transparent 55%),linear-gradient(145deg,#202620,#121712);color:#f2f5f0;box-shadow:0 40px 120px #000}
.msHead{display:flex;align-items:center;gap:14px;padding:22px 26px 16px;border-bottom:1px solid #303730}
.msHead .msLogo{display:grid;place-items:center;width:46px;height:46px;border-radius:13px;background:linear-gradient(145deg,#a3e635,#4e7d0e);color:#10150a;font-size:20px}
.msHead h2{margin:0;font-size:22px;letter-spacing:-.5px}.msHead p{margin:3px 0 0;color:#9ca69b;font-size:12px}
.msClose{margin-left:auto;width:38px;height:38px;border:1px solid #303730;border-radius:10px;background:#222622;color:#cfd8cb;cursor:pointer;font-size:15px}
.msClose:hover{border-color:#76b900;color:#a3e635}
.msBody{overflow-y:auto;padding:20px 26px 26px;scrollbar-width:thin;scrollbar-color:#52604c transparent}
.msPerks{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px;padding:12px 14px;border:1px dashed #45533d;border-radius:12px;background:#0e130e99;font-size:12px;color:#b4c0b1}
.msPerks b{color:#a3e635}.msPerks .chip{display:inline-flex;gap:6px;align-items:center;padding:4px 10px;border-radius:999px;background:#76b90018;border:1px solid #76b90040;color:#cfe9a0;font-weight:700;font-size:11px}
.msSection{margin:6px 0 12px;display:flex;align-items:baseline;gap:10px}.msSection h3{margin:0;font-size:12px;letter-spacing:1.6px;text-transform:uppercase;color:#a3e635}.msSection span{color:#7d8b7b;font-size:11px}
.msGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin-bottom:22px}
.msCard{position:relative;display:flex;flex-direction:column;gap:8px;padding:18px;border:1px solid #303730;border-radius:16px;background:linear-gradient(160deg,#242b23,#161b15);transition:.2s}
.msCard:hover{transform:translateY(-3px);border-color:#668d2d;box-shadow:0 16px 36px #0008}
.msCard.featured{border-color:#76b900;box-shadow:0 0 0 1px #76b90040,0 14px 40px #76b90014}
.msBadge{position:absolute;top:-9px;right:14px;padding:3px 9px;border-radius:999px;background:#a3e635;color:#10150a;font-size:9px;font-weight:900;letter-spacing:1px}
.msIcon{display:grid;place-items:center;width:42px;height:42px;border-radius:12px;background:#76b9001c;border:1px solid #76b90040;color:#a3e635;font-size:18px}
.msCard h4{margin:4px 0 0;font-size:16px}.msPrice{font-size:22px;font-weight:900;letter-spacing:-.6px;color:#f2f5f0}.msPrice small{font-size:11px;color:#8a9788;font-weight:600}
.msCard p{margin:0;color:#9ca69b;font-size:12px;line-height:1.55}
.msCard ul{margin:2px 0 4px;padding:0;list-style:none;display:grid;gap:5px}.msCard li{color:#cfd8cb;font-size:12px;display:flex;gap:7px;align-items:flex-start}.msCard li::before{content:"✓";color:#a3e635;font-weight:900}
.msBuy{margin-top:auto;min-height:40px;border:1px solid #76b900;border-radius:11px;background:#76b900;color:#10150a;font:inherit;font-weight:800;font-size:12px;cursor:pointer;transition:.18s;text-decoration:none;display:grid;place-items:center}
.msBuy:hover{background:#a3e635;box-shadow:0 8px 22px #76b90044}
.msBuy[aria-disabled="true"]{background:#222622;border-color:#303730;color:#7d8b7b;cursor:not-allowed;box-shadow:none}
.msOwned{margin-top:auto;min-height:40px;display:grid;place-items:center;border:1px solid #76b90055;border-radius:11px;background:#76b90014;color:#a3e635;font-weight:800;font-size:12px}
.msNote{margin:4px 0 0;padding:12px 14px;border-radius:12px;background:#121712;border:1px solid #303730;color:#8a9788;font-size:11px;line-height:1.7}
@media(max-width:560px){.msHead{padding:16px}.msBody{padding:16px}}
`;

let overlay = null;
let currentUser = null;
let profile = null;
let stopProfile = null;
let focusSection = "";

window.MELD_ENTITLEMENTS = entitlementsActive(null);

function injectStyle() {
  if (document.getElementById("meldStoreStyle")) return;
  const style = document.createElement("style");
  style.id = "meldStoreStyle";
  style.textContent = CSS;
  document.head.appendChild(style);
}

function paymentUrl(item) {
  if (!item.link) return "";
  try {
    const url = new URL(item.link);
    if (currentUser) {
      url.searchParams.set("client_reference_id", currentUser.uid);
      if (currentUser.email) url.searchParams.set("prefilled_email", currentUser.email);
    }
    return url.href;
  } catch (_) {
    return "";
  }
}

function ownedState(item, ent) {
  if (item.id === "adfree" && ent.adFree) return "Active — ads are off";
  if (item.id === "vip" && profile?.entitlements?.vip) return "You have Lifetime VIP";
  if (item.id === "supporter" && ent.membershipTier === "supporter") return `Active until ${new Date(ent.membershipExpiresAt).toLocaleDateString()}`;
  if (item.id === "plus" && ent.membershipTier === "plus") return `Active until ${new Date(ent.membershipExpiresAt).toLocaleDateString()}`;
  return "";
}

function cardHtml(item, ent, isMembership) {
  const owned = ownedState(item, ent);
  const perks = isMembership
    ? `<ul>${(item.perks || []).map(perk => `<li>${escapeHtml(perk)}</li>`).join("")}</ul>`
    : `<p>${escapeHtml(item.desc || "")}</p>`;

  const [priceMain, ...priceRest] = String(item.price || "").split(" / ");
  const price = `<div class="msPrice">${escapeHtml(priceMain)}${priceRest.length ? ` <small>/ ${escapeHtml(priceRest.join(" / "))}</small>` : ""}</div>`;

  let action;
  if (owned) action = `<div class="msOwned">${escapeHtml(owned)}</div>`;
  else if (!currentUser) action = `<a class="msBuy" href="./auth.html">Sign in to buy</a>`;
  else if (!item.link) action = `<button class="msBuy" type="button" aria-disabled="true" data-soon="1">Coming soon</button>`;
  else action = `<a class="msBuy" target="_blank" rel="noopener noreferrer" href="${escapeHtml(paymentUrl(item))}">${isMembership ? "Subscribe" : "Buy now"}</a>`;

  return `<article class="msCard${item.badge ? " featured" : ""}">
    ${item.badge ? `<span class="msBadge">${escapeHtml(item.badge)}</span>` : ""}
    <div class="msIcon"><i class="fa-solid ${escapeHtml(item.icon || "fa-star")}"></i></div>
    <h4>${escapeHtml(item.name)}</h4>${price}${perks}${action}
  </article>`;
}

function render() {
  if (!overlay) return;
  const store = CFG().STORE || { oneTime: [], memberships: [] };
  const ent = entitlementsActive(profile);

  const chips = [];
  if (ent.adFree) chips.push('<span class="chip"><i class="fa-solid fa-ban"></i> Ad-free</span>');
  if (profile?.entitlements?.vip || ent.vip) chips.push('<span class="chip"><i class="fa-solid fa-gem"></i> VIP</span>');
  if (ent.membershipTier) chips.push(`<span class="chip"><i class="fa-solid fa-heart"></i> ${escapeHtml(ent.membershipTier === "plus" ? "Meld Plus" : "Supporter")}</span>`);
  if (ent.nameChangeCredits) chips.push(`<span class="chip"><i class="fa-solid fa-pen-to-square"></i> ${ent.nameChangeCredits} name change${ent.nameChangeCredits > 1 ? "s" : ""}</span>`);

  const perksLine = !currentUser
    ? `<span><b>Sign in</b> to buy and keep your perks on your account.</span>`
    : chips.length ? `<span>Your perks:</span>${chips.join("")}` : `<span>You don't have any perks yet — grab one below.</span>`;

  overlay.querySelector(".msBody").innerHTML = `
    <div class="msPerks">${perksLine}</div>
    <div class="msSection" id="msOneTime"><h3>One-time purchases</h3><span>Pay once, keep it forever</span></div>
    <div class="msGrid">${store.oneTime.map(item => cardHtml(item, ent, false)).join("")}</div>
    <div class="msSection" id="msMemberships"><h3>Memberships</h3><span>Monthly — cancel anytime</span></div>
    <div class="msGrid">${store.memberships.map(item => cardHtml(item, ent, true)).join("")}</div>
    <p class="msNote">After you pay, your perk is switched on for your account — usually within a few minutes. If it hasn't shown up, send your receipt in the Meld Discord and we'll fix it right away.</p>`;

  const target = focusSection === "memberships" ? "#msMemberships" : "";
  if (target) overlay.querySelector(target)?.scrollIntoView({ block: "start" });
  focusSection = "";
}

function build() {
  if (overlay) return;
  injectStyle();
  overlay = document.createElement("div");
  overlay.id = "meldStoreOverlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Meld Store");
  overlay.innerHTML = `
    <div class="msPanel">
      <header class="msHead">
        <div class="msLogo"><i class="fa-solid fa-store"></i></div>
        <div><h2>Meld Store</h2><p>Support Meld and unlock perks</p></div>
        <button class="msClose" type="button" aria-label="Close store"><i class="fa-solid fa-xmark"></i></button>
      </header>
      <div class="msBody"></div>
    </div>`;
  document.body.appendChild(overlay);

  overlay.addEventListener("click", event => { if (event.target === overlay) close(); });
  overlay.querySelector(".msClose").addEventListener("click", close);
  overlay.addEventListener("click", event => {
    const soon = event.target.closest("[data-soon]");
    if (soon) event.preventDefault();
  });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && overlay.classList.contains("open")) close(); });
}

function open(section) {
  build();
  focusSection = section || "";
  render();
  overlay.classList.add("open");
}

function close() { overlay?.classList.remove("open"); }

function publishEntitlements() {
  window.MELD_ENTITLEMENTS = entitlementsActive(profile);
  window.dispatchEvent(new CustomEvent("meld:entitlements", { detail: window.MELD_ENTITLEMENTS }));
  render();
}

onAuthStateChanged(auth, user => {
  currentUser = user;
  if (stopProfile) { stopProfile(); stopProfile = null; }
  profile = null;
  publishEntitlements();
  if (!user) return;

  stopProfile = onValue(ref(db, `users/${user.uid}/entitlements`), snapshot => {
    profile = { entitlements: snapshot.val() || {} };
    publishEntitlements();
  }, error => console.warn("[Meld Store] Could not read perks:", error));
});

window.MeldStore = {
  open, close,
  hasAdFree: () => Boolean(window.MELD_ENTITLEMENTS?.adFree)
};
