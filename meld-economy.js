/* =====================================================================
   MELD ECONOMY + COSMETICS
   • Meldbux wallet, buying items, redeeming codes, Season Pass claims
   • Drawing avatars (pfp + border), banners and Meld Styles
   • Applies the player's equipped Meld Style on every page that loads this

   Security model (no server): every money-changing write is validated by the
   Firebase RULES in database.rules.json, which read prices/rewards from the
   published catalog.  The code below only builds the writes the rules accept.
   ===================================================================== */
import {
  auth, db, ref, get, set, update, onValue, increment, onAuthStateChanged, CFG, escapeHtml
} from "./meld-core.js";

/* ---------------------------------------------------------------- catalog */
let remoteItems = {};        // catalog/items from Firebase (prices the rules enforce + owner-added items)
let remotePass = null;       // catalog/pass from Firebase
const catalogListeners = new Set();

export const RARITY = id => (CFG().RARITIES || {})[id] || { name: id || "Common", color: "#a0ada8" };

export function allItems() {
  const map = new Map();
  (CFG().CATALOG || []).forEach(item => map.set(item.id, item));
  Object.entries(remoteItems || {}).forEach(([id, item]) => {
    if (item && typeof item === "object") map.set(id, Object.assign({}, map.get(id) || {}, item, { id }));
  });
  return [...map.values()];
}
export const itemById = id => allItems().find(item => item.id === id) || null;
export const itemsOfType = type => allItems().filter(item => item.type === type);
export const isFreeItem = item => Boolean(item && (item.free || (!item.hidden && Number(item.price) === 0 && item.id.endsWith("_default"))));

export function passConfig() {
  const base = CFG().PASS || { tiers: 0, xpPerTier: 150, rewards: {}, pro: { meldbux: 0 } };
  if (!remotePass) return base;
  const rewards = {};
  Object.entries(remotePass.tiers || {}).forEach(([n, tier]) => { if (tier) rewards[n] = tier; });
  return Object.assign({}, base, {
    season: remotePass.season || base.season,
    name: remotePass.name || base.name,
    xpPerTier: Number(remotePass.xpPerTier) || base.xpPerTier,
    tiers: Number(remotePass.count) || base.tiers,
    pro: Object.assign({}, base.pro, remotePass.pro || {}),
    rewards: Object.keys(rewards).length ? rewards : base.rewards
  });
}

export function loadCatalog() {
  return Promise.all([
    get(ref(db, "catalog/items")).then(s => { remoteItems = s.val() || {}; }).catch(() => {}),
    get(ref(db, "catalog/pass")).then(s => { remotePass = s.val() || null; }).catch(() => {})
  ]).then(() => { catalogListeners.forEach(fn => fn()); });
}
export const onCatalog = fn => { catalogListeners.add(fn); return () => catalogListeners.delete(fn); };

/* ---------------------------------------------------------------- wallet */
export function normalizeWallet(raw) {
  raw = raw || {};
  return {
    meldbux: Math.max(0, Math.floor(Number(raw.meldbux) || 0)),
    inventory: raw.inventory || {},
    proPass: raw.proPass === true,
    claimed: raw.claimed || {},
    redeemed: raw.redeemed || {},
    exists: raw.meldbux !== undefined
  };
}

export function watchWallet(uid, callback) {
  return onValue(ref(db, `wallets/${uid}`), snapshot => callback(normalizeWallet(snapshot.val())),
    error => { console.warn("[Meld] wallet unavailable:", error); callback(normalizeWallet(null)); });
}

export async function ensureWallet(uid) {
  try {
    const snap = await get(ref(db, `wallets/${uid}/meldbux`));
    if (!snap.exists()) await set(ref(db, `wallets/${uid}/meldbux`), 0);
  } catch (error) { console.warn("[Meld] could not create wallet:", error); }
}

export const owns = (wallet, item) =>
  Boolean(item && (isFreeItem(item) || (wallet && wallet.inventory && wallet.inventory[item.id])));

const explain = error => {
  const text = String(error && error.message || error);
  if (/permission/i.test(text)) return "The server refused that (not enough Meldbux, already owned, or your balance changed). Refresh and try again.";
  return text;
};

export async function buyItem(uid, wallet, item) {
  if (!uid) throw new Error("Sign in first.");
  if (owns(wallet, item)) throw new Error("You already own that.");
  const price = Math.floor(Number(item.price) || 0);
  if (item.hidden || price <= 0) throw new Error("That item can't be bought. Look for a code!");
  if (wallet.meldbux < price) throw new Error(`You need ${price - wallet.meldbux} more Meldbux.`);
  try {
    await update(ref(db), {
      [`wallets/${uid}/meldbux`]: wallet.meldbux - price,
      [`wallets/${uid}/lastBuy`]: item.id,
      [`wallets/${uid}/inventory/${item.id}`]: true
    });
  } catch (error) { throw new Error(explain(error)); }
}

export async function buyProPass(uid, wallet) {
  const price = Math.floor(Number(passConfig().pro.meldbux) || 0);
  if (wallet.proPass) throw new Error("You already have the Pro Pass.");
  if (price <= 0) throw new Error("The Pro Pass isn't on sale yet.");
  if (wallet.meldbux < price) throw new Error(`You need ${price - wallet.meldbux} more Meldbux.`);
  try {
    await update(ref(db), {
      [`wallets/${uid}/meldbux`]: wallet.meldbux - price,
      [`wallets/${uid}/lastBuy`]: "PROPASS",
      [`wallets/${uid}/proPass`]: true
    });
  } catch (error) { throw new Error(explain(error)); }
}

export const normalizeCode = raw => String(raw || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 32);

export async function redeemCode(uid, wallet, raw) {
  const code = normalizeCode(raw);
  if (code.length < 3) throw new Error("Type a code first.");
  if (wallet.redeemed[code]) throw new Error("You already used that code.");

  let snap;
  try { snap = await get(ref(db, `redeemCodes/${code}`)); }
  catch (error) { throw new Error("Couldn't check that code. Try again."); }
  if (!snap.exists()) throw new Error("That code doesn't exist.");

  const c = snap.val() || {};
  if (c.expiresAt && Date.now() > Number(c.expiresAt)) throw new Error("That code has expired.");
  if (c.maxUses && Number(c.uses || 0) >= Number(c.maxUses)) throw new Error("That code has been fully claimed.");

  const patch = {
    [`wallets/${uid}/claim`]: { kind: "code", id: code },
    [`wallets/${uid}/redeemed/${code}`]: true,
    [`redeemCodes/${code}/uses`]: Number(c.uses || 0) + 1
  };
  const gained = [];
  const meldbux = Math.floor(Number(c.meldbux) || 0);
  if (meldbux > 0) { patch[`wallets/${uid}/meldbux`] = wallet.meldbux + meldbux; gained.push(`${meldbux} Meldbux`); }

  Object.keys(c.items || {}).forEach(id => {
    if (c.items[id] !== true) return;
    const item = itemById(id);
    if (item && owns(wallet, item)) return;
    patch[`wallets/${uid}/inventory/${id}`] = true;
    gained.push(item ? item.name : id);
  });
  if (c.proPass === true && !wallet.proPass) { patch[`wallets/${uid}/proPass`] = true; gained.push("Pro Pass"); }
  const xp = Math.min(1500, Math.floor(Number(c.xp) || 0));
  if (xp > 0) { patch[`users/${uid}/xp`] = increment(xp); patch[`users/${uid}/seasonXp`] = increment(xp); gained.push(`${xp} XP`); }

  if (!gained.length) throw new Error("You already have everything in that code.");
  try { await update(ref(db), patch); }
  catch (error) { throw new Error(explain(error)); }
  return gained;
}

/* ---------------------------------------------------------------- season pass */
export function passState(profile, wallet) {
  const pass = passConfig();
  const seasonXp = Math.max(0, Math.floor(Number(profile && profile.seasonXp) || 0));
  const per = Math.max(1, Number(pass.xpPerTier) || 150);
  const tier = Math.min(Number(pass.tiers) || 0, Math.floor(seasonXp / per));
  return {
    pass, seasonXp, per, tier,
    intoTier: tier >= pass.tiers ? per : seasonXp - tier * per,
    percent: tier >= pass.tiers ? 100 : ((seasonXp - tier * per) / per) * 100,
    pro: Boolean(wallet && wallet.proPass)
  };
}

export const tierClaimed = (wallet, n, track) => Boolean(wallet.claimed && wallet.claimed[`pass_${n}_${track}`]);

export async function claimTier(uid, wallet, profile, n, track) {
  const state = passState(profile, wallet);
  const reward = (state.pass.rewards || {})[n] && state.pass.rewards[n][track];
  if (!reward) throw new Error("No reward there.");
  if (state.tier < n) throw new Error("You haven't reached that tier yet.");
  if (track === "pro" && !wallet.proPass) throw new Error("That reward needs the Pro Pass.");
  if (tierClaimed(wallet, n, track)) throw new Error("Already claimed.");

  const patch = {
    [`wallets/${uid}/claim`]: { kind: "pass", id: String(n), n, track },
    [`wallets/${uid}/claimed/pass_${n}_${track}`]: true
  };
  if (Number(reward.meldbux) > 0) patch[`wallets/${uid}/meldbux`] = wallet.meldbux + Math.floor(Number(reward.meldbux));
  if (reward.item) {
    const item = itemById(reward.item);
    if (!(item && owns(wallet, item))) patch[`wallets/${uid}/inventory/${reward.item}`] = true;
  }
  try { await update(ref(db), patch); }
  catch (error) { throw new Error(explain(error)); }
}

/* ---------------------------------------------------------------- equip */
export async function equip(uid, slot, id) {
  await set(ref(db, `users/${uid}/equipped/${slot}`), id || "");
}

/* ---------------------------------------------------------------- drawing */
const safeUrl = url => (typeof url === "string" && /^https:\/\//i.test(url)) ? url : "";
const PATTERNS = {
  dots: "radial-gradient(rgba(255,255,255,.16) 1.5px,transparent 1.7px) 0 0/16px 16px",
  grid: "linear-gradient(rgba(255,255,255,.07) 1px,transparent 1px) 0 0/22px 22px,linear-gradient(90deg,rgba(255,255,255,.07) 1px,transparent 1px) 0 0/22px 22px",
  stripes: "repeating-linear-gradient(45deg,rgba(255,255,255,.07) 0 10px,transparent 10px 20px)"
};
const cssColor = value => /^#[0-9a-f]{3,8}$|^[a-z]+$|^rgba?\([\d\s.,%]+\)$/i.test(String(value || "")) ? value : "#86c52b";

export function bannerBackground(art) {
  art = art || {};
  const img = safeUrl(art.img);
  if (img) return `url("${img}") center/cover no-repeat`;
  const cols = (art.g || ["#263a20", "#4e7d0e"]).map(cssColor);
  const gradient = `linear-gradient(${Number(art.angle) || 135}deg,${cols.join(",")})`;
  return (PATTERNS[art.pattern] ? PATTERNS[art.pattern] + "," : "") + gradient;
}

export function pfpBackground(art) {
  const cols = ((art && art.g) || ["#c1fa62", "#4e7d0e"]).map(cssColor);
  return `radial-gradient(circle at 28% 18%,${cols[0]},${cols[1] || cols[0]} 85%)`;
}

let borderStyleEl = null;
let borderSignature = "";
function ensureBorderCss() {
  const items = itemsOfType("border");
  const signature = items.map(i => i.id + JSON.stringify(i.art || {})).join("|");
  if (signature === borderSignature && borderStyleEl) return;
  borderSignature = signature;
  if (!borderStyleEl) { borderStyleEl = document.createElement("style"); borderStyleEl.id = "meldBorderCss"; document.head.appendChild(borderStyleEl); }
  let css = `@property --pfpA{syntax:"<angle>";inherits:false;initial-value:0deg}
@keyframes pfpSpin{to{--pfpA:360deg}}
@keyframes pfpPulse{0%,100%{opacity:.75;filter:brightness(1)}50%{opacity:1;filter:brightness(1.35)}}
.hasPfp{position:relative;overflow:visible!important}
.hasPfp>.pfpRing{position:absolute;inset:-5px;border-radius:inherit;pointer-events:none;z-index:0}
.hasPfp>.pfpFace{position:absolute;inset:0;z-index:1;display:grid;place-items:center;overflow:hidden;border-radius:inherit;container-type:size;font-weight:900}
.hasPfp>.pfpFace>i{font-size:46cqmin;line-height:1;color:rgba(255,255,255,.95);filter:drop-shadow(0 2px 6px rgba(0,0,0,.4))}
.hasPfp>.pfpFace>img{display:block;width:100%;height:100%;object-fit:cover}
`;
  items.forEach(item => {
    const art = item.art || {};
    const cols = (art.colors || []).map(cssColor);
    if (!cols.length || cols[0] === "transparent") return;
    const sel = `.hasPfp[data-border="${item.id.replace(/[^\w-]/g, "")}"]>.pfpRing`;
    let rule;
    if (art.kind === "glow") {
      rule = `background:${cols[0]};box-shadow:0 0 12px ${cols[0]},0 0 28px ${cols[0]}88;`;
    } else if (art.anim === "spin") {
      const stops = cols.length > 1 ? cols.join(",") : `${cols[0]},#fff,${cols[0]}`;
      rule = `background:conic-gradient(from var(--pfpA),${stops},${cols[0]});animation:pfpSpin 3s linear infinite;`;
    } else if (art.kind === "conic") {
      rule = `background:conic-gradient(${cols.join(",")});`;
    } else if (art.kind === "gradient") {
      rule = `background:linear-gradient(135deg,${cols.join(",")});`;
    } else {
      rule = `background:${cols[0]};`;
    }
    if (art.anim === "pulse") rule += "animation:pfpPulse 1.8s ease-in-out infinite;";
    css += `${sel}{${rule}}\n`;
  });
  borderStyleEl.textContent = css;
}
onCatalogChange();
function onCatalogChange() { onCatalog(() => { try { ensureBorderCss(); } catch (_) { /* ignore */ } }); }

/* Fills `container` with the player's equipped picture + border (or photo / first letter). */
export function renderAvatar(container, profile, name, overrides) {
  ensureBorderCss();
  const eq = Object.assign({}, (profile && profile.equipped) || {}, overrides || {});
  const letter = String(name || (profile && profile.username) || "?").trim().charAt(0).toUpperCase() || "?";
  const pfpItem = eq.pfp ? itemById(eq.pfp) : null;
  const borderItem = eq.border ? itemById(eq.border) : null;

  container.replaceChildren();
  container.classList.add("hasPfp");
  if (borderItem && borderItem.type === "border" && !/_none$/.test(borderItem.id)) container.dataset.border = borderItem.id.replace(/[^\w-]/g, "");
  else delete container.dataset.border;

  const ring = document.createElement("span");
  ring.className = "pfpRing";
  const face = document.createElement("span");
  face.className = "pfpFace";
  container.append(ring, face);

  const photo = safeUrl(profile && profile.photoURL);
  if (pfpItem && pfpItem.type === "pfp" && !/_default$/.test(pfpItem.id)) {
    const art = pfpItem.art || {};
    const img = safeUrl(art.img);
    if (img) {
      const image = document.createElement("img");
      image.src = img; image.alt = ""; image.referrerPolicy = "no-referrer";
      image.onerror = () => { face.replaceChildren(); face.textContent = letter; };
      face.appendChild(image);
    } else {
      face.style.background = pfpBackground(art);
      const icon = document.createElement("i");
      icon.className = "fa-solid " + String(art.icon || "fa-user").replace(/[^\w-\s]/g, "");
      face.appendChild(icon);
    }
  } else if (photo) {
    const image = document.createElement("img");
    image.src = photo; image.alt = ""; image.referrerPolicy = "no-referrer";
    image.onerror = () => { face.replaceChildren(); face.textContent = letter; };
    face.appendChild(image);
  } else {
    face.textContent = letter;
  }
}

/* A little preview used by the store and the inventory. */
export function itemPreview(item, profile) {
  const box = document.createElement("div");
  box.className = "itemPreview type-" + item.type;
  const art = item.art || {};
  if (item.type === "pfp") {
    const av = document.createElement("div"); av.className = "pvAvatar";
    renderAvatar(av, { equipped: { pfp: item.id } }, item.name);
    box.appendChild(av);
  } else if (item.type === "border") {
    const av = document.createElement("div"); av.className = "pvAvatar";
    renderAvatar(av, { equipped: { pfp: (profile && profile.equipped && profile.equipped.pfp) || "", border: item.id }, photoURL: profile && profile.photoURL }, (profile && profile.username) || "M");
    box.appendChild(av);
  } else if (item.type === "banner") {
    const strip = document.createElement("div"); strip.className = "pvBanner";
    strip.style.background = bannerBackground(art);
    box.appendChild(strip);
  } else if (item.type === "style") {
    const v = art.vars || {};
    const sw = document.createElement("div"); sw.className = "pvStyle";
    sw.style.background = `radial-gradient(ellipse at 50% -20%,${cssColor(v.bg2)},transparent 70%),${cssColor(v.bg)}`;
    const dot = document.createElement("span"); dot.style.background = `linear-gradient(135deg,${cssColor(v.accentLight)},${cssColor(v.accent)})`;
    const bar = document.createElement("em"); bar.style.background = cssColor(v.accent);
    sw.append(dot, bar);
    box.appendChild(sw);
  }
  return box;
}

/* ---------------------------------------------------------------- Meld Style (site theme) */
const STYLE_CACHE = "meldStyleV1";
function hexToRgb(hex) {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})/i.exec(String(hex || ""));
  return m ? `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}` : "118,185,0";
}

export function applySiteStyle(item) {
  const root = document.documentElement;
  const art = (item && item.art) || {};
  const v = art.vars || {};
  const get = (key, fallback) => cssColor(v[key] || fallback);
  const accent = get("accent", "#76b900"), light = get("accentLight", "#a3e635"), dark = get("accentDark", "#496f00");
  const bg = get("bg", "#101210"), bg2 = get("bg2", "#293421");
  const defaultStyle = !item || /_default$/.test(item.id);

  const set = (k, val) => root.style.setProperty(k, val);
  if (defaultStyle) {
    ["--accent", "--accent-light", "--accent-dark", "--bg", "--green", "--green-light", "--green-dark", "--green-rgb", "--meld-bg2"]
      .forEach(k => root.style.removeProperty(k));
  } else {
    set("--accent", accent); set("--accent-light", light); set("--accent-dark", dark); set("--bg", bg);
    set("--green", accent); set("--green-light", light); set("--green-dark", dark);
    set("--green-rgb", hexToRgb(accent)); set("--meld-bg2", bg2);
  }

  let tag = document.getElementById("meldStyleOverride");
  if (!tag) { tag = document.createElement("style"); tag.id = "meldStyleOverride"; document.head.appendChild(tag); }
  let layer = document.getElementById("meldThemeBg");

  if (defaultStyle) {
    tag.textContent = "";
    if (layer) layer.remove();
    return;
  }
  const bgImg = safeUrl(art.img);
  const grad = `radial-gradient(ellipse at 50% -30%,${bg2} 0,transparent 58%),${bg}`;
  tag.textContent = `html,body{background:${grad}!important}.bg{background:${grad}!important}`;
  const host = document.getElementById("pageBackground");     /* the homepage has its own background layer */
  if (layer && host && layer.parentNode !== host) { layer.remove(); layer = null; }
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "meldThemeBg";
    layer.setAttribute("aria-hidden", "true");
    layer.style.cssText = host
      ? "position:absolute;inset:0;z-index:0;pointer-events:none;"
      : "position:fixed;inset:0;z-index:-1;pointer-events:none;";
    (host || document.body).prepend(layer);
  }
  const pattern = PATTERNS[art.pattern] || "";
  layer.style.background = [bgImg ? `url("${bgImg}") center/cover no-repeat` : "", pattern].filter(Boolean).join(",") || "none";
  layer.style.opacity = bgImg ? ".55" : ".9";
}

/* Remember the style so the next page paints it instantly (no green flash). */
function applyCachedStyle() {
  try {
    const cached = JSON.parse(localStorage.getItem(STYLE_CACHE) || "null");
    if (cached && cached.art) applySiteStyle(cached);
  } catch (_) { /* ignore */ }
}
function cacheStyle(item) {
  try {
    if (!item || /_default$/.test(item.id)) localStorage.removeItem(STYLE_CACHE);
    else localStorage.setItem(STYLE_CACHE, JSON.stringify({ id: item.id, art: item.art, type: "style" }));
  } catch (_) { /* ignore */ }
}

/* ---------------------------------------------------------------- boot: follow the signed-in player */
let stopEquip = null;
function boot() {
  if (document.body) applyCachedStyle(); else document.addEventListener("DOMContentLoaded", applyCachedStyle);
  loadCatalog().then(() => {
    onAuthStateChanged(auth, user => {
      if (stopEquip) { stopEquip(); stopEquip = null; }
      if (!user) { cacheStyle(null); applySiteStyle(null); return; }
      stopEquip = onValue(ref(db, `users/${user.uid}/equipped/style`), snap => {
        const id = snap.val();
        const item = id ? itemById(id) : null;
        const owned = item && !item.hidden ? true : Boolean(item);
        const chosen = owned ? item : null;
        cacheStyle(chosen);
        applySiteStyle(chosen);
      }, () => {});
    });
  });
}
boot();

export const fmt = n => Math.max(0, Math.floor(Number(n) || 0)).toLocaleString("en-US");
export { escapeHtml };

/* for classic scripts (script.js etc.) */
window.MeldEconomy = { allItems, itemById, applySiteStyle, renderAvatar, passConfig, loadCatalog };
