/* =====================================================================
   MELD STORE  (v1.2)
   Tabs:  Season Pass · Avatars · Borders · Banners · Styles · Meldbux · Perks
     window.MeldStore.open()            open the store
     window.MeldStore.open("pass")      open on a tab: pass | pfp | border | banner | style | meldbux | perks
     window.MELD_ENTITLEMENTS           live perks (adFree, vip, nameChangeCredits …)
   Events:  "meld:entitlements" (perks changed)  ·  "meld:wallet" (Meldbux / inventory changed)

   Real-money buys: paste Stripe Payment Links into config.js → STORE and catalog.js → PASS.pro.link.
   We add  client_reference_id=<uid>  so you can see who paid, then grant it from
   Owner Tools → Economy (Meldbux / items / Pro Pass).
   ===================================================================== */
import {
  auth, db, ref, onValue, onAuthStateChanged, CFG, entitlementsActive
} from "./meld-core.js";
import {
  RARITY, itemsOfType, itemById, owns, normalizeWallet, watchWallet, ensureWallet, buyItem, buyProPass,
  redeemCode, passState, claimTier, tierClaimed, equip, itemPreview, onCatalog, fmt
} from "./meld-economy.js";

const CSS = `
#meldStoreOverlay{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(3,6,3,.76);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
#meldStoreOverlay.open{display:flex;animation:msFade .2s ease}
@keyframes msFade{from{opacity:0}to{opacity:1}}
.msPanel{position:relative;display:flex;flex-direction:column;width:min(1020px,100%);height:min(780px,94vh);overflow:hidden;border:1px solid color-mix(in srgb,var(--accent,#76b900) 40%,#222);border-radius:22px;background:radial-gradient(ellipse at 50% -10%,color-mix(in srgb,var(--accent,#76b900) 14%,transparent),transparent 55%),linear-gradient(145deg,#1f251f,#111611);color:#f2f5f0;box-shadow:0 40px 120px #000}
.msHead{display:flex;align-items:center;gap:14px;padding:18px 24px 14px;flex-wrap:wrap}
.msHead .msLogo{display:grid;place-items:center;width:44px;height:44px;border-radius:13px;background:linear-gradient(145deg,var(--accent-light,#a3e635),var(--accent-dark,#4e7d0e));color:#10150a;font-size:19px}
.msHead h2{margin:0;font-size:21px;letter-spacing:-.5px}.msHead p{margin:2px 0 0;color:#9ca69b;font-size:12px}
.msBal{margin-left:auto;display:flex;align-items:center;gap:8px;padding:9px 15px;border:1px solid #ffd16655;border-radius:999px;background:#ffd16614;color:#ffd166;font-weight:900;font-size:15px;font-variant-numeric:tabular-nums}
.msBal small{font-size:10px;letter-spacing:1.2px;color:#caa85a;font-weight:800}
.msClose{width:38px;height:38px;border:1px solid #303730;border-radius:10px;background:#222622;color:#cfd8cb;cursor:pointer;font-size:15px}
.msClose:hover{border-color:var(--accent,#76b900);color:var(--accent-light,#a3e635)}
.msTabs{display:flex;gap:6px;padding:0 24px 12px;overflow-x:auto;scrollbar-width:none;border-bottom:1px solid #303730}
.msTabs::-webkit-scrollbar{display:none}
.msTab{flex:0 0 auto;display:inline-flex;align-items:center;gap:7px;padding:9px 14px;border:1px solid #303730;border-radius:10px;background:#1b201b;color:#b4c0b1;font-weight:800;font-size:12px;cursor:pointer;transition:.18s}
.msTab:hover{border-color:var(--accent,#76b900);color:#fff}
.msTab.active{background:var(--accent,#76b900);border-color:var(--accent,#76b900);color:#10150a}
.msBody{flex:1;overflow-y:auto;padding:20px 24px 26px;scrollbar-width:thin;scrollbar-color:#52604c transparent}
.msToast{position:absolute;left:50%;bottom:18px;transform:translate(-50%,20px);opacity:0;pointer-events:none;padding:11px 18px;border-radius:12px;background:#0d120d;border:1px solid var(--accent,#76b900);color:#e8f5d4;font-size:13px;font-weight:700;box-shadow:0 14px 40px #000a;transition:.25s;max-width:90%;text-align:center}
.msToast.show{opacity:1;transform:translate(-50%,0)}.msToast.err{border-color:#ff747d;color:#ffd0d3}
.msSection{margin:6px 0 12px;display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}.msSection h3{margin:0;font-size:12px;letter-spacing:1.6px;text-transform:uppercase;color:var(--accent-light,#a3e635)}.msSection span{color:#7d8b7b;font-size:11px}
.msFilter{margin-left:auto;display:flex;gap:6px}.msFilter button{padding:5px 11px;border:1px solid #303730;border-radius:999px;background:transparent;color:#9ca69b;font-size:11px;font-weight:800;cursor:pointer}.msFilter button.on{border-color:var(--accent,#76b900);color:var(--accent-light,#a3e635);background:#76b9001a}
.msGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(196px,1fr));gap:12px;margin-bottom:22px}
.msGrid.wide{grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
.msCard{--rc:#a0ada8;position:relative;display:flex;flex-direction:column;gap:8px;padding:14px;border:1px solid #303730;border-radius:16px;background:linear-gradient(160deg,#242b23,#161b15);transition:.2s}
.msCard.item{border-color:color-mix(in srgb,var(--rc) 35%,#303730)}
.msCard.item::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:radial-gradient(ellipse at 50% 0%,color-mix(in srgb,var(--rc) 16%,transparent),transparent 62%)}
.msCard:hover{transform:translateY(-3px);box-shadow:0 16px 36px #0008}
.msCard.featured{border-color:var(--accent,#76b900);box-shadow:0 0 0 1px #76b90040,0 14px 40px #76b90014}
.msBadge{position:absolute;top:-9px;right:14px;padding:3px 9px;border-radius:999px;background:var(--accent-light,#a3e635);color:#10150a;font-size:9px;font-weight:900;letter-spacing:1px;z-index:2}
.msRar{align-self:flex-start;padding:2px 8px;border-radius:999px;border:1px solid color-mix(in srgb,var(--rc) 55%,transparent);color:var(--rc);background:color-mix(in srgb,var(--rc) 12%,transparent);font-size:9px;font-weight:900;letter-spacing:1.1px;text-transform:uppercase;position:relative}
.msCard h4{margin:0;font-size:14px;position:relative}
.msPrice{display:flex;align-items:center;gap:6px;font-size:16px;font-weight:900;color:#ffd166;position:relative}.msPrice small{font-size:10px;color:#8a9788;font-weight:700}
.msPrice.free{color:#9ae65a}.msPrice.excl{color:#c58aff;font-size:12px}
.msCard p{margin:0;color:#9ca69b;font-size:12px;line-height:1.55;position:relative}
.msCard ul{margin:2px 0 4px;padding:0;list-style:none;display:grid;gap:5px;position:relative}.msCard li{color:#cfd8cb;font-size:12px;display:flex;gap:7px;align-items:flex-start}.msCard li::before{content:"✓";color:var(--accent-light,#a3e635);font-weight:900}
.msBuy,.msBtn{margin-top:auto;min-height:38px;border:1px solid var(--accent,#76b900);border-radius:11px;background:var(--accent,#76b900);color:#10150a;font:inherit;font-weight:800;font-size:12px;cursor:pointer;transition:.18s;text-decoration:none;display:grid;place-items:center;padding:0 12px;position:relative}
.msBuy:hover,.msBtn:hover{background:var(--accent-light,#a3e635);box-shadow:0 8px 22px #76b90044}
.msBtn.alt{background:#222822;border-color:#3a443a;color:#dfe8dc}.msBtn.alt:hover{border-color:var(--accent,#76b900);color:#fff;box-shadow:none}
.msBtn.gold{background:#ffd166;border-color:#ffd166}.msBtn.gold:hover{background:#ffe08f}
.msBuy[aria-disabled="true"],.msBtn:disabled{background:#222622;border-color:#303730;color:#7d8b7b;cursor:not-allowed;box-shadow:none}
.msOwned{margin-top:auto;min-height:38px;display:grid;place-items:center;border:1px solid #76b90055;border-radius:11px;background:#76b90014;color:var(--accent-light,#a3e635);font-weight:800;font-size:12px;position:relative}
.msRow{display:flex;gap:8px;margin-top:auto;position:relative}.msRow>*{flex:1}
.msPerks{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px;padding:12px 14px;border:1px dashed #45533d;border-radius:12px;background:#0e130e99;font-size:12px;color:#b4c0b1}
.msPerks b{color:var(--accent-light,#a3e635)}.msPerks .chip{display:inline-flex;gap:6px;align-items:center;padding:4px 10px;border-radius:999px;background:#76b90018;border:1px solid #76b90040;color:#cfe9a0;font-weight:700;font-size:11px}
.msNote{margin:4px 0 0;padding:12px 14px;border-radius:12px;background:#121712;border:1px solid #303730;color:#8a9788;font-size:11px;line-height:1.7}
.itemPreview{position:relative;display:grid;place-items:center;height:96px;border-radius:12px;background:#0e130e;border:1px solid #ffffff10;overflow:hidden}
.itemPreview .pvAvatar{width:60px;height:60px;border-radius:50%;background:radial-gradient(circle at 28% 18%,#c1fa62,#4e7d0e 82%);color:#101609;display:grid;place-items:center;font-weight:900;font-size:22px}
.itemPreview .pvBanner{position:absolute;inset:0}.itemPreview .pvStyle{position:absolute;inset:0;display:grid;place-items:center}
.itemPreview .pvStyle span{width:34px;height:34px;border-radius:50%;box-shadow:0 8px 22px #0008}.itemPreview .pvStyle em{position:absolute;left:14px;right:14px;bottom:12px;height:6px;border-radius:99px}
.passHero{display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center;padding:18px;border:1px solid #45533d;border-radius:16px;background:linear-gradient(135deg,#1f2a1b,#131a12);margin-bottom:16px}
.passHero h3{margin:0 0 4px;font-size:20px}.passHero p{margin:0;color:#9ca69b;font-size:12px}
.passBar{height:10px;border-radius:99px;background:#0b0f0b;border:1px solid #303730;overflow:hidden;margin-top:12px}.passBar span{display:block;height:100%;background:linear-gradient(90deg,var(--accent,#76b900),var(--accent-light,#a3e635));border-radius:inherit;transition:width .4s}
.passTrack{overflow-x:auto;padding-bottom:10px;scrollbar-width:thin}
.passRows{display:grid;grid-auto-flow:column;grid-auto-columns:124px;gap:10px;align-items:stretch;min-width:max-content}
.passCol{display:grid;grid-template-rows:auto 1fr 1fr;gap:8px}
.passTier{text-align:center;font-size:11px;font-weight:900;letter-spacing:1px;color:#9ca69b;padding:4px 0}.passTier.reached{color:var(--accent-light,#a3e635)}
.passCell{position:relative;display:flex;flex-direction:column;align-items:center;gap:5px;padding:9px 8px;border:1px solid #303730;border-radius:13px;background:#171d16;text-align:center;font-size:11px;min-height:112px}
.passCell.pro{border-color:#ffd16644;background:linear-gradient(160deg,#2a2410,#171409)}
.passCell.locked{opacity:.55}.passCell.done{border-color:#76b90066}
.passCell .lbl{font-size:9px;font-weight:900;letter-spacing:1.2px;color:#8a9788}.passCell.pro .lbl{color:#ffd166}
.passCell .amt{color:#ffd166;font-weight:900;font-size:13px}.passCell .pvMini{width:34px;height:34px;border-radius:9px;display:grid;place-items:center;overflow:hidden;font-size:15px;color:#fff;border:1px solid #ffffff22}
.passCell button{margin-top:auto;width:100%;padding:5px 0;border-radius:8px;border:1px solid var(--accent,#76b900);background:var(--accent,#76b900);color:#10150a;font-weight:800;font-size:10px;cursor:pointer}
.passCell button:disabled{background:#222622;border-color:#303730;color:#7d8b7b;cursor:default}
.redeemBox{display:flex;gap:8px;max-width:520px}.redeemBox input{flex:1;min-width:0;padding:12px 14px;border:1px solid #3a443a;border-radius:11px;background:#0e130e;color:#fff;font:inherit;font-weight:800;letter-spacing:1.5px;text-transform:uppercase}
.redeemBox input:focus{outline:2px solid var(--accent,#76b900)}.redeemBox .msBtn{margin:0;min-width:110px}
@media(max-width:620px){.msHead{padding:14px 16px 10px}.msTabs{padding:0 16px 10px}.msBody{padding:16px}.passHero{grid-template-columns:1fr}}
`;

const TABS = [
  ["pass", "fa-ticket", "Season Pass"], ["pfp", "fa-circle-user", "Avatars"], ["border", "fa-circle-notch", "Borders"],
  ["banner", "fa-image", "Banners"], ["style", "fa-palette", "Meld Styles"], ["meldbux", "fa-coins", "Meldbux"], ["perks", "fa-gem", "Perks"]
];
const TYPE_TITLES = { pfp: "Profile pictures", border: "Avatar borders", banner: "Profile banners", style: "Meld Styles" };
const TYPE_BLURB = {
  pfp: "Show off a custom picture on your profile, chat and the leaderboard.",
  border: "Animated rings that wrap your picture everywhere it shows up.",
  banner: "Decorate the top of your profile.",
  style: "Re-colors Meld and changes the background. Applies on every page."
};

let overlay = null, currentUser = null, profile = null, wallet = normalizeWallet(null);
let stopProfile = null, stopWallet = null, tab = "pass", filter = "all", toastTimer = 0;

window.MELD_ENTITLEMENTS = entitlementsActive(null);
window.MELD_WALLET = wallet;

const $ = s => overlay && overlay.querySelector(s);
function h(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
function injectStyle() {
  if (document.getElementById("meldStoreStyle")) return;
  const style = document.createElement("style"); style.id = "meldStoreStyle"; style.textContent = CSS; document.head.appendChild(style);
}
function toast(message, isError) {
  const t = $(".msToast"); if (!t) return;
  t.textContent = message; t.classList.toggle("err", Boolean(isError)); t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
}
const coin = () => h("i", "fa-solid fa-coins");
const isFree = item => Boolean(item.free) || /_default$/.test(item.id) || /_none$/.test(item.id);
function priceEl(item) {
  const box = h("div", "msPrice");
  if (isFree(item)) { box.classList.add("free"); box.textContent = "Free"; return box; }
  if (item.hidden || !(Number(item.price) > 0)) { box.classList.add("excl"); box.append(h("i", "fa-solid fa-key"), document.createTextNode(" Code / event only")); return box; }
  box.append(coin(), document.createTextNode(fmt(item.price)));
  if (item.usd) box.append(h("small", "", "or " + item.usd));
  return box;
}
const equippedId = type => ((profile && profile.equipped) || {})[type] || "";
const isEquipped = item => equippedId(item.type) === item.id || (!equippedId(item.type) && /_(default|none)$/.test(item.id));

function paymentUrl(link) {
  if (!link) return "";
  try {
    const url = new URL(link);
    if (currentUser) { url.searchParams.set("client_reference_id", currentUser.uid); if (currentUser.email) url.searchParams.set("prefilled_email", currentUser.email); }
    return url.href;
  } catch (_) { return ""; }
}

/* ------------------------------------------------------------ cosmetics tabs */
function itemCard(item) {
  const card = h("article", "msCard item");
  card.style.setProperty("--rc", RARITY(item.rarity).color);
  card.append(itemPreview(item, profile), h("span", "msRar", RARITY(item.rarity).name), h("h4", "", item.name), priceEl(item));

  const have = owns(wallet, item);
  if (!currentUser) {
    const a = h("a", "msBuy", "Sign in"); a.href = "./auth.html"; card.append(a);
  } else if (have) {
    const on = isEquipped(item);
    const b = h("button", "msBtn" + (on ? " alt" : ""), on ? "Equipped ✓" : "Equip");
    b.type = "button"; b.disabled = on;
    b.addEventListener("click", async () => {
      b.disabled = true;
      try { await equip(currentUser.uid, item.type, /_(default|none)$/.test(item.id) ? "" : item.id); toast(`${item.name} equipped.`); }
      catch (e) { toast("Couldn't equip that.", true); }
    });
    card.append(b);
  } else if (item.hidden || !(Number(item.price) > 0)) {
    const b = h("button", "msBtn alt", "Redeem a code"); b.type = "button"; b.addEventListener("click", () => setTab("meldbux")); card.append(b);
  } else {
    const row = h("div", "msRow");
    const b = h("button", "msBtn gold", "Buy"); b.type = "button"; b.disabled = wallet.meldbux < item.price;
    if (b.disabled) b.title = `Need ${fmt(item.price - wallet.meldbux)} more Meldbux`;
    b.addEventListener("click", async () => {
      b.disabled = true;
      try { await buyItem(currentUser.uid, wallet, item); toast(`Bought ${item.name}!`); }
      catch (e) { toast(e.message, true); b.disabled = false; }
    });
    row.append(b);
    if (item.link && item.usd) { const a = h("a", "msBtn alt", item.usd); a.href = paymentUrl(item.link); a.target = "_blank"; a.rel = "noopener noreferrer"; row.append(a); }
    card.append(row);
  }
  return card;
}

function renderItems(type) {
  const frag = document.createDocumentFragment();
  const head = h("div", "msSection");
  head.append(h("h3", "", TYPE_TITLES[type]), h("span", "", TYPE_BLURB[type]));
  const f = h("div", "msFilter");
  [["all", "All"], ["owned", "Owned"], ["locked", "Not owned"]].forEach(([id, label]) => {
    const b = h("button", filter === id ? "on" : "", label); b.type = "button";
    b.addEventListener("click", () => { filter = id; render(); }); f.appendChild(b);
  });
  head.appendChild(f);
  const grid = h("div", "msGrid");
  const order = { common: 0, rare: 1, epic: 2, legendary: 3, mythic: 4 };
  itemsOfType(type)
    .filter(item => !item.hidden || owns(wallet, item))
    .filter(item => filter === "all" || (filter === "owned") === owns(wallet, item))
    .sort((a, b) => (order[a.rarity] - order[b.rarity]) || ((a.price || 0) - (b.price || 0)))
    .forEach(item => grid.appendChild(itemCard(item)));
  if (!grid.children.length) grid.appendChild(h("p", "msNote", "Nothing here yet."));
  frag.append(head, grid);
  return frag;
}

/* ------------------------------------------------------------ season pass */
function miniReward(item) {
  const box = h("div", "pvMini");
  const art = item.art || {};
  if (item.type === "pfp") { box.style.background = `radial-gradient(circle at 30% 20%,${(art.g || [])[0] || "#c1fa62"},${(art.g || [])[1] || "#4e7d0e"})`; box.appendChild(h("i", "fa-solid " + String(art.icon || "fa-user").replace(/[^\w-\s]/g, ""))); }
  else if (item.type === "border") { const c = (art.colors || ["#86c52b"])[0]; box.style.cssText = `border:3px solid ${/^#[\da-f]{3,8}$/i.test(c) ? c : "#86c52b"};border-radius:50%`; }
  else if (item.type === "banner") { box.style.background = `linear-gradient(135deg,${(art.g || ["#263a20", "#4e7d0e"]).join(",")})`; }
  else { const v = art.vars || {}; box.style.background = `linear-gradient(135deg,${v.accentLight || "#a3e635"},${v.accent || "#76b900"})`; }
  box.title = item.name;
  return box;
}

function renderPass() {
  const state = passState(profile, wallet);
  const { pass } = state;
  const frag = document.createDocumentFragment();

  const hero = h("div", "passHero");
  const left = h("div");
  const toNext = state.tier >= pass.tiers ? 0 : state.per - (state.seasonXp - state.tier * state.per);
  left.append(h("h3", "", `${pass.name || "Season Pass"} · Tier ${state.tier} / ${pass.tiers}`),
    h("p", "", currentUser ? `${fmt(state.seasonXp)} season XP${toNext ? ` · ${fmt(toNext)} XP to the next tier` : " · max tier!"}. Everything you do on Meld earns XP.` : "Sign in to earn pass rewards."));
  const bar = h("div", "passBar"); const fill = h("span"); fill.style.width = state.percent.toFixed(1) + "%"; bar.appendChild(fill); left.appendChild(bar);
  hero.appendChild(left);

  const right = h("div");
  if (state.pro) right.append(h("div", "msOwned", "★ Pro Pass active"));
  else {
    const price = Number(pass.pro.meldbux) || 0;
    const row = h("div", "msRow"); row.style.flexDirection = "column";
    const b = h("button", "msBtn gold"); b.type = "button";
    b.append(coin(), document.createTextNode(` Get Pro · ${fmt(price)}`));
    b.disabled = !currentUser || wallet.meldbux < price;
    b.addEventListener("click", async () => {
      b.disabled = true;
      try { await buyProPass(currentUser.uid, wallet); toast("Pro Pass unlocked! Claim your rewards."); }
      catch (e) { toast(e.message, true); b.disabled = false; }
    });
    row.appendChild(b);
    if (pass.pro.link && pass.pro.usd) { const a = h("a", "msBtn alt", `or pay ${pass.pro.usd}`); a.href = paymentUrl(pass.pro.link); a.target = "_blank"; a.rel = "noopener noreferrer"; row.appendChild(a); }
    right.appendChild(row);
  }
  hero.appendChild(right);
  frag.appendChild(hero);

  const track = h("div", "passTrack"); const rows = h("div", "passRows");
  for (let n = 1; n <= pass.tiers; n++) {
    const rewards = (pass.rewards || {})[n] || {};
    const col = h("div", "passCol");
    col.appendChild(h("div", "passTier" + (state.tier >= n ? " reached" : ""), "TIER " + n));
    ["free", "pro"].forEach(trackName => {
      const reward = rewards[trackName];
      const cell = h("div", "passCell " + trackName);
      if (!reward) { cell.style.opacity = ".25"; col.appendChild(cell); return; }
      const reached = state.tier >= n, done = tierClaimed(wallet, n, trackName), locked = !reached || (trackName === "pro" && !wallet.proPass);
      cell.classList.toggle("locked", locked && !done); cell.classList.toggle("done", done);
      cell.appendChild(h("span", "lbl", trackName === "pro" ? "PRO" : "FREE"));
      if (reward.meldbux) { const a = h("span", "amt"); a.append(coin(), document.createTextNode(" " + fmt(reward.meldbux))); cell.appendChild(a); }
      const item = reward.item ? itemById(reward.item) : null;
      if (item) { cell.appendChild(miniReward(item)); cell.appendChild(h("span", "", item.name)); }
      const b = h("button", "", done ? "Claimed" : reached ? (trackName === "pro" && !wallet.proPass ? "Pro only" : "Claim") : "Locked");
      b.type = "button"; b.disabled = done || locked || !currentUser;
      b.addEventListener("click", async () => {
        b.disabled = true;
        try { await claimTier(currentUser.uid, wallet, profile, n, trackName); toast("Reward claimed!"); }
        catch (e) { toast(e.message, true); b.disabled = false; }
      });
      cell.appendChild(b); col.appendChild(cell);
    });
    rows.appendChild(col);
  }
  track.appendChild(rows); frag.appendChild(track);
  frag.appendChild(h("p", "msNote", "Normal pass rewards are free for everyone. Pro pass adds a second, bigger reward on every tier — buy it with Meldbux or real money. Earn XP by playing, launching games, daily quests and your daily login bonus."));
  return frag;
}

/* ------------------------------------------------------------ Meldbux tab (codes + packs) */
function renderMeldbux() {
  const frag = document.createDocumentFragment();
  const head = h("div", "msSection"); head.append(h("h3", "", "Redeem a code"), h("span", "", "Codes are handed out in Admin Abuse events, on Discord and by the owner."));
  frag.appendChild(head);
  const box = h("div", "redeemBox"); const input = h("input"); input.placeholder = "ENTER CODE"; input.maxLength = 32; input.autocomplete = "off"; input.spellcheck = false;
  const go = h("button", "msBtn", "Redeem"); go.type = "button"; go.disabled = !currentUser;
  const run = async () => {
    if (!currentUser) return;
    go.disabled = true;
    try { const gained = await redeemCode(currentUser.uid, wallet, input.value); input.value = ""; toast("Redeemed: " + gained.join(", ")); }
    catch (e) { toast(e.message, true); }
    go.disabled = false;
  };
  go.addEventListener("click", run); input.addEventListener("keydown", e => { if (e.key === "Enter") run(); });
  box.append(input, go); frag.appendChild(box);
  if (!currentUser) frag.appendChild(h("p", "msNote", "Sign in to redeem codes."));

  const head2 = h("div", "msSection"); head2.style.marginTop = "26px"; head2.append(h("h3", "", "Get Meldbux"), h("span", "", "Real-money packs — Meldbux is added to your account after you pay."));
  frag.appendChild(head2);
  const grid = h("div", "msGrid wide");
  const packs = (CFG().STORE && CFG().STORE.packs) || [];
  packs.forEach(pack => {
    const card = h("article", "msCard" + (pack.badge ? " featured" : ""));
    if (pack.badge) card.appendChild(h("span", "msBadge", pack.badge));
    const p = h("div", "msPrice"); p.append(coin(), document.createTextNode(" " + fmt(pack.meldbux)));
    card.append(h("h4", "", pack.name), p, h("p", "", pack.price));
    if (!currentUser) { const a = h("a", "msBuy", "Sign in to buy"); a.href = "./auth.html"; card.appendChild(a); }
    else if (!pack.link) { const b = h("button", "msBuy", "Coming soon"); b.type = "button"; b.setAttribute("aria-disabled", "true"); card.appendChild(b); }
    else { const a = h("a", "msBuy", "Buy " + pack.price); a.href = paymentUrl(pack.link); a.target = "_blank"; a.rel = "noopener noreferrer"; card.appendChild(a); }
    grid.appendChild(card);
  });
  frag.appendChild(grid);
  frag.appendChild(h("p", "msNote", "After you pay, your Meldbux is added — usually within a few minutes. If it hasn't shown up, send your receipt in the Meld Discord and we'll fix it right away."));
  return frag;
}

/* ------------------------------------------------------------ perks tab (the original store) */
function ownedState(item, ent) {
  if (item.id === "adfree" && ent.adFree) return "Active — ads are off";
  if (item.id === "vip" && profile && profile.entitlements && profile.entitlements.vip) return "You have Lifetime VIP";
  if (item.id === "supporter" && ent.membershipTier === "supporter") return `Active until ${new Date(ent.membershipExpiresAt).toLocaleDateString()}`;
  if (item.id === "plus" && ent.membershipTier === "plus") return `Active until ${new Date(ent.membershipExpiresAt).toLocaleDateString()}`;
  return "";
}
function perkCard(item, ent, isMembership) {
  const owned = ownedState(item, ent);
  const card = h("article", "msCard" + (item.badge ? " featured" : ""));
  if (item.badge) card.appendChild(h("span", "msBadge", item.badge));
  const [main, ...rest] = String(item.price || "").split(" / ");
  const price = h("div", "msPrice"); price.style.color = "#f2f5f0"; price.textContent = main; if (rest.length) price.appendChild(h("small", "", "/ " + rest.join(" / ")));
  card.append(h("h4", "", item.name), price);
  if (isMembership) { const ul = h("ul"); (item.perks || []).forEach(p => ul.appendChild(h("li", "", p))); card.appendChild(ul); } else card.appendChild(h("p", "", item.desc || ""));
  if (owned) card.appendChild(h("div", "msOwned", owned));
  else if (!currentUser) { const a = h("a", "msBuy", "Sign in to buy"); a.href = "./auth.html"; card.appendChild(a); }
  else if (!item.link) { const b = h("button", "msBuy", "Coming soon"); b.type = "button"; b.setAttribute("aria-disabled", "true"); card.appendChild(b); }
  else { const a = h("a", "msBuy", isMembership ? "Subscribe" : "Buy now"); a.href = paymentUrl(item.link); a.target = "_blank"; a.rel = "noopener noreferrer"; card.appendChild(a); }
  return card;
}
function renderPerks() {
  const store = CFG().STORE || { oneTime: [], memberships: [] };
  const ent = entitlementsActive(profile);
  const frag = document.createDocumentFragment();
  const perks = h("div", "msPerks");
  const chips = [];
  if (ent.adFree) chips.push(["fa-ban", "Ad-free"]);
  if ((profile && profile.entitlements && profile.entitlements.vip) || ent.vip) chips.push(["fa-gem", "VIP"]);
  if (ent.membershipTier) chips.push(["fa-heart", ent.membershipTier === "plus" ? "Meld Plus" : "Supporter"]);
  if (ent.nameChangeCredits) chips.push(["fa-pen-to-square", `${ent.nameChangeCredits} name change${ent.nameChangeCredits > 1 ? "s" : ""}`]);
  if (!currentUser) perks.appendChild(h("span", "", "Sign in to buy and keep your perks on your account."));
  else if (chips.length) { perks.appendChild(h("span", "", "Your perks:")); chips.forEach(([i, t]) => { const c = h("span", "chip"); c.append(h("i", "fa-solid " + i), document.createTextNode(" " + t)); perks.appendChild(c); }); }
  else perks.appendChild(h("span", "", "You don't have any perks yet — grab one below."));
  frag.appendChild(perks);
  [["One-time purchases", "Pay once, keep it forever", store.oneTime, false], ["Memberships", "Monthly — cancel anytime", store.memberships, true]].forEach(([t, sub, list, m]) => {
    const head = h("div", "msSection"); head.append(h("h3", "", t), h("span", "", sub));
    const grid = h("div", "msGrid wide"); (list || []).forEach(item => grid.appendChild(perkCard(item, ent, m)));
    frag.append(head, grid);
  });
  return frag;
}

/* ------------------------------------------------------------ shell */
function render() {
  if (!overlay) return;
  if (document.activeElement && document.activeElement.closest && document.activeElement.closest(".redeemBox")) { $(".msBalNum").textContent = fmt(wallet.meldbux); return; }
  $(".msBalNum").textContent = fmt(wallet.meldbux);
  overlay.querySelectorAll(".msTab").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  const body = $(".msBody"); const keep = body.scrollTop;
  let content;
  if (tab === "pass") content = renderPass();
  else if (tab === "meldbux") content = renderMeldbux();
  else if (tab === "perks") content = renderPerks();
  else content = renderItems(tab);
  body.replaceChildren(content);
  body.scrollTop = keep;
}
function setTab(next) { tab = next; render(); const b = $(".msBody"); if (b) b.scrollTop = 0; }

function build() {
  if (overlay) return;
  injectStyle();
  overlay = document.createElement("div");
  overlay.id = "meldStoreOverlay";
  overlay.setAttribute("role", "dialog"); overlay.setAttribute("aria-modal", "true"); overlay.setAttribute("aria-label", "Meld Store");
  overlay.innerHTML = `
    <div class="msPanel">
      <header class="msHead">
        <div class="msLogo"><i class="fa-solid fa-store"></i></div>
        <div><h2>Meld Store</h2><p>Passes, cosmetics and perks</p></div>
        <div class="msBal" title="Your Meldbux"><i class="fa-solid fa-coins"></i><span class="msBalNum">0</span><small>MELDBUX</small></div>
        <button class="msClose" type="button" aria-label="Close store"><i class="fa-solid fa-xmark"></i></button>
      </header>
      <nav class="msTabs" role="tablist"></nav>
      <div class="msBody"></div>
      <div class="msToast" role="status" aria-live="polite"></div>
    </div>`;
  const nav = overlay.querySelector(".msTabs");
  TABS.forEach(([id, icon, label]) => {
    const b = h("button", "msTab"); b.type = "button"; b.dataset.tab = id; b.setAttribute("role", "tab");
    b.append(h("i", "fa-solid " + icon), document.createTextNode(label));
    b.addEventListener("click", () => setTab(id)); nav.appendChild(b);
  });
  document.body.appendChild(overlay);
  overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
  overlay.querySelector(".msClose").addEventListener("click", close);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && overlay.classList.contains("open")) close(); });
}

function open(section) {
  build();
  const map = { onetime: "perks", memberships: "perks" };
  const wanted = map[section] || section;
  if (wanted && TABS.some(t => t[0] === wanted)) tab = wanted;
  filter = "all";
  render();
  overlay.classList.add("open");
}
function close() { overlay && overlay.classList.remove("open"); }

function publishEntitlements() {
  window.MELD_ENTITLEMENTS = entitlementsActive(profile);
  window.dispatchEvent(new CustomEvent("meld:entitlements", { detail: window.MELD_ENTITLEMENTS }));
}
function publishWallet() {
  window.MELD_WALLET = wallet;
  window.dispatchEvent(new CustomEvent("meld:wallet", { detail: wallet }));
}

onCatalog(() => render());

onAuthStateChanged(auth, user => {
  currentUser = user;
  if (stopProfile) { stopProfile(); stopProfile = null; }
  if (stopWallet) { stopWallet(); stopWallet = null; }
  profile = null; wallet = normalizeWallet(null);
  publishEntitlements(); publishWallet(); render();
  if (!user) return;

  stopProfile = onValue(ref(db, `users/${user.uid}`), snapshot => {
    profile = snapshot.val() || {};
    publishEntitlements(); render();
  }, error => console.warn("[Meld Store] Could not read your profile:", error));

  ensureWallet(user.uid);
  stopWallet = watchWallet(user.uid, w => { wallet = w; publishWallet(); render(); });
});

window.MeldStore = {
  open, close,
  hasAdFree: () => Boolean(window.MELD_ENTITLEMENTS && window.MELD_ENTITLEMENTS.adFree),
  balance: () => wallet.meldbux
};
