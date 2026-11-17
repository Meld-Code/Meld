/* =====================================================================
   OWNER TOOLS — Economy tab (added to the Live Announcements panel)
   Only the owner account sees this.  Every write is also enforced by the
   Firebase rules, so nobody else can use these even from the console.

   • Publish catalog   — copies prices / pass rewards from catalog.js to Firebase
                         (the rules pay out and charge from that copy)
   • Codes             — make / list / announce / delete redeem codes
   • Grant / take      — Meldbux, items, Pro Pass, XP for any player
   • Custom items      — add a new pfp / border / banner / style without editing files
   • Player lookup     — uid, level, balance, items
   • Maintenance banner— a message shown on top of the homepage for everyone
   ===================================================================== */
import {
  auth, db, ref, get, set, update, remove, push, onValue, runTransaction, increment, onAuthStateChanged, CFG, OWNER_UID, levelFromXp
} from "./meld-core.js";
import { allItems, itemById, loadCatalog, passConfig, fmt } from "./meld-economy.js";

const panel = document.getElementById("meldAnnouncementPanel");
if (!panel) { console.warn("[owner-tools] announcement panel not found"); }

let isOwner = false;
const q = id => panel.querySelector("#" + id);
const status = (id, msg) => { const e = q(id); if (e) e.textContent = msg; };
const clone = v => JSON.parse(JSON.stringify(v));

function build() {
  const tabs = panel.querySelector(".meldTabs");
  const tab = document.createElement("button");
  tab.type = "button"; tab.id = "meldTabEconomy"; tab.dataset.pane = "economy"; tab.textContent = "Economy"; tab.hidden = true;
  tabs.appendChild(tab);

  const pane = document.createElement("div");
  pane.className = "meldPane"; pane.dataset.paneId = "economy"; pane.id = "meldEconomyPane"; pane.hidden = true;
  pane.innerHTML = `
    <h2>Catalog</h2>
    <p>After editing prices or rewards in catalog.js, publish them so the server rules use the same numbers.</p>
    <button id="ecoPublish" type="button">Publish catalog to Firebase</button>
    <div class="meldStatus" id="ecoPublishStatus" aria-live="polite"></div>

    <hr class="meldDivider">
    <h2>Redeem codes</h2>
    <p>Give out free Meldbux / items. Leave the code blank for a random one.</p>
    <input id="ecoCode" placeholder="CODE (blank = random)" maxlength="32" autocomplete="off" spellcheck="false">
    <div class="meldRow">
      <div><label for="ecoCodeBux">Meldbux</label><input id="ecoCodeBux" type="number" min="0" value="0"></div>
      <div><label for="ecoCodeXp">XP (max 1500)</label><input id="ecoCodeXp" type="number" min="0" max="1500" value="0"></div>
      <div><label for="ecoCodeMax">Max uses (0 = ∞)</label><input id="ecoCodeMax" type="number" min="0" value="0"></div>
    </div>
    <label for="ecoCodeItems">Items (ctrl/⌘-click for several)</label>
    <select id="ecoCodeItems" multiple size="6"></select>
    <div class="meldRow">
      <div><label for="ecoCodeHours">Expires in (hours, 0 = never)</label><input id="ecoCodeHours" type="number" min="0" value="0"></div>
      <div><label><input id="ecoCodePro" type="checkbox" style="width:auto"> Includes Pro Pass</label></div>
    </div>
    <button id="ecoCodeCreate" type="button">Create code</button>
    <div class="meldStatus" id="ecoCodeStatus" aria-live="polite"></div>
    <div class="meldList" id="ecoCodeList"></div>

    <hr class="meldDivider">
    <h2>Give / take</h2>
    <input id="ecoUser" placeholder="Username or UID" autocomplete="off" spellcheck="false">
    <select id="ecoGrantAction">
      <option value="bux">Meldbux (+ or − amount)</option>
      <option value="item">Give item</option>
      <option value="unitem">Remove item</option>
      <option value="pro">Give Pro Pass</option>
      <option value="xp">Give XP (also season XP)</option>
    </select>
    <input id="ecoGrantAmount" type="number" placeholder="Amount (Meldbux / XP)" value="100">
    <select id="ecoGrantItem"></select>
    <button id="ecoGrant" type="button">Apply</button>
    <button id="ecoLookup" class="meldSecondary" type="button">Look up player</button>
    <div class="meldStatus" id="ecoGrantStatus" aria-live="polite"></div>

    <hr class="meldDivider">
    <h2>Add a custom item</h2>
    <p>Appears in the store right away (no file edits). Use an image URL (https) or colors.</p>
    <div class="meldRow">
      <div><label for="ciType">Type</label><select id="ciType"><option value="pfp">Profile picture</option><option value="border">Border</option><option value="banner">Banner</option><option value="style">Meld Style</option></select></div>
      <div><label for="ciRarity">Rarity</label><select id="ciRarity"><option>common</option><option>rare</option><option>epic</option><option>legendary</option><option>mythic</option></select></div>
    </div>
    <input id="ciName" placeholder="Name" maxlength="30" autocomplete="off">
    <div class="meldRow">
      <div><label for="ciPrice">Meldbux price (0 = not sold)</label><input id="ciPrice" type="number" min="0" value="500"></div>
      <div><label><input id="ciHidden" type="checkbox" style="width:auto"> Code/event only</label></div>
    </div>
    <input id="ciImg" placeholder="Image URL https://… (pfp / banner / style background)" autocomplete="off">
    <div class="meldRow">
      <div><label for="ciC1">Color 1</label><input id="ciC1" type="color" value="#86c52b"></div>
      <div><label for="ciC2">Color 2</label><input id="ciC2" type="color" value="#4e7d0e"></div>
      <div><label for="ciC3">Color 3</label><input id="ciC3" type="color" value="#101210"></div>
    </div>
    <input id="ciIcon" placeholder="pfp icon (Font Awesome, e.g. fa-ghost)" autocomplete="off">
    <button id="ciAdd" type="button">Add item</button>
    <div class="meldStatus" id="ciStatus" aria-live="polite"></div>

    <hr class="meldDivider">
    <h2>Maintenance banner</h2>
    <input id="ecoMaintMsg" maxlength="200" placeholder="Message shown at the top of the homepage" autocomplete="off">
    <button id="ecoMaintOn" type="button">Show banner</button>
    <button id="ecoMaintOff" class="meldSecondary" type="button">Hide banner</button>
    <div class="meldStatus" id="ecoMaintStatus" aria-live="polite"></div>

    <hr class="meldDivider">
    <h2>Announcement history</h2>
    <div class="meldHist" id="ecoHist"></div>
  `;
  const ownerPane = panel.querySelector("#meldAnnOwnerControls");
  ownerPane.parentNode.insertBefore(pane, ownerPane.nextSibling);

  tab.addEventListener("click", () => {
    panel.querySelectorAll(".meldTabs button").forEach(b => b.classList.toggle("active", b === tab));
    panel.querySelectorAll(".meldPane").forEach(p => { p.hidden = p !== pane; });
  });
  return pane;
}

/* ---------------------------------------------------------------- helpers */
async function resolveUid(value) {
  value = String(value || "").trim();
  if (!value) throw new Error("Enter a username or UID.");
  if (/^[A-Za-z0-9]{20,40}$/.test(value)) return value;
  const snap = await get(ref(db, `usernames/${value.toLowerCase()}`));
  if (!snap.exists()) throw new Error("No account with that username.");
  return snap.val();
}
const randomCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return [...bytes].map(b => chars[b % chars.length]).join("");
};
const safeColor = c => /^#[0-9a-f]{6}$/i.test(c) ? c : "#86c52b";

function fillItemSelects() {
  const items = allItems().slice().sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
  const opt = item => { const o = document.createElement("option"); o.value = item.id; o.textContent = `${item.type} · ${item.name}`; return o; };
  const multi = q("ecoCodeItems"), single = q("ecoGrantItem");
  if (!multi || !single) return;
  multi.replaceChildren(...items.map(opt));
  single.replaceChildren(...items.map(opt));
}

/* ---------------------------------------------------------------- catalog */
async function publishCatalog() {
  if (!isOwner) return;
  try {
    status("ecoPublishStatus", "Publishing…");
    const updates = {};
    (CFG().CATALOG || []).forEach(item => {
      const copy = clone(item);
      Object.keys(copy).forEach(k => copy[k] === undefined && delete copy[k]);
      updates[`catalog/items/${item.id}`] = copy;
    });
    const pass = CFG().PASS || {};
    updates["catalog/pass"] = clone({ season: pass.season, name: pass.name, xpPerTier: pass.xpPerTier, count: pass.tiers, pro: { meldbux: pass.pro ? pass.pro.meldbux : 0, usd: pass.pro ? pass.pro.usd : "" }, tiers: pass.rewards });
    await update(ref(db), updates);
    await loadCatalog();
    fillItemSelects();
    status("ecoPublishStatus", `Published ${(CFG().CATALOG || []).length} items and ${pass.tiers} pass tiers.`);
  } catch (error) { console.error(error); status("ecoPublishStatus", "Failed: " + error.message); }
}

/* ---------------------------------------------------------------- codes */
async function createCode() {
  if (!isOwner) return;
  try {
    let code = q("ecoCode").value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "") || randomCode();
    if (code.length < 3) throw new Error("Codes need at least 3 characters.");
    const existing = await get(ref(db, `redeemCodes/${code}`));
    if (existing.exists()) throw new Error("That code already exists.");

    const items = {};
    [...q("ecoCodeItems").selectedOptions].forEach(o => { items[o.value] = true; });
    const meldbux = Math.max(0, Math.floor(Number(q("ecoCodeBux").value) || 0));
    const xp = Math.min(1500, Math.max(0, Math.floor(Number(q("ecoCodeXp").value) || 0)));
    const maxUses = Math.max(0, Math.floor(Number(q("ecoCodeMax").value) || 0));
    const hours = Math.max(0, Number(q("ecoCodeHours").value) || 0);
    const pro = q("ecoCodePro").checked;
    if (!meldbux && !xp && !pro && !Object.keys(items).length) throw new Error("Give the code something: Meldbux, XP, items or Pro Pass.");

    const data = { createdAt: Date.now(), uses: 0 };
    if (meldbux) data.meldbux = meldbux;
    if (xp) data.xp = xp;
    if (maxUses) data.maxUses = maxUses;
    if (hours) data.expiresAt = Date.now() + hours * 3600000;
    if (pro) data.proPass = true;
    if (Object.keys(items).length) data.items = items;
    await set(ref(db, `redeemCodes/${code}`), data);
    status("ecoCodeStatus", `Created ${code}`);
    q("ecoCode").value = "";
    loadCodes();
  } catch (error) { console.error(error); status("ecoCodeStatus", "Failed: " + error.message); }
}

function describeCode(c) {
  const parts = [];
  if (c.meldbux) parts.push(fmt(c.meldbux) + " Meldbux");
  if (c.xp) parts.push(c.xp + " XP");
  if (c.proPass) parts.push("Pro Pass");
  Object.keys(c.items || {}).forEach(id => { const it = itemById(id); parts.push(it ? it.name : id); });
  return parts.join(" · ") || "—";
}

async function loadCodes() {
  const list = q("ecoCodeList");
  if (!list || !isOwner) return;
  try {
    const snap = await get(ref(db, "redeemCodes"));
    const codes = snap.val() || {};
    list.replaceChildren();
    const ids = Object.keys(codes).sort((a, b) => (codes[b].createdAt || 0) - (codes[a].createdAt || 0));
    if (!ids.length) { const s = document.createElement("span"); s.className = "meldStatus"; s.textContent = "No codes yet."; list.appendChild(s); return; }
    ids.forEach(id => {
      const c = codes[id];
      const row = document.createElement("div"); row.className = "meldItem";
      const b = document.createElement("b"); b.textContent = id;
      const when = document.createElement("span");
      const expired = c.expiresAt && Date.now() > c.expiresAt;
      when.textContent = `${describeCode(c)} · used ${c.uses || 0}${c.maxUses ? "/" + c.maxUses : ""}${expired ? " · EXPIRED" : ""}`;
      const actions = document.createElement("div"); actions.className = "meldItemActions";
      const mk = (label, fn) => { const x = document.createElement("button"); x.type = "button"; x.className = "meldSecondary"; x.textContent = label; x.addEventListener("click", fn); return x; };
      actions.append(
        mk("Copy", () => navigator.clipboard && navigator.clipboard.writeText(id)),
        mk("Announce", async () => {
          const sentAt = Date.now();
          await set(ref(db, "announcements/current"), { message: `🎁 Code drop! Redeem ${id} in Store → Meldbux.`, sentAt, expiresAt: sentAt + 300000, style: "success", title: "Free stuff" });
          status("ecoCodeStatus", `Announced ${id} for 5 minutes.`);
        }),
        mk("Delete", async () => { await remove(ref(db, `redeemCodes/${id}`)); loadCodes(); })
      );
      row.append(b, when, actions);
      list.appendChild(row);
    });
  } catch (error) { console.error(error); }
}

/* ---------------------------------------------------------------- grant */
async function grant() {
  if (!isOwner) { status("ecoGrantStatus", "Owner access required."); return; }
  try {
    const uid = await resolveUid(q("ecoUser").value);
    const action = q("ecoGrantAction").value;
    const amount = Math.floor(Number(q("ecoGrantAmount").value) || 0);
    const itemId = q("ecoGrantItem").value;

    if (action === "bux") {
      if (!amount) throw new Error("Enter an amount.");
      await runTransaction(ref(db, `wallets/${uid}/meldbux`), v => Math.max(0, (Number(v) || 0) + amount));
      status("ecoGrantStatus", `${amount > 0 ? "Gave" : "Took"} ${fmt(Math.abs(amount))} Meldbux.`);
    } else if (action === "item") {
      if (!(await get(ref(db, `wallets/${uid}/meldbux`))).exists()) await set(ref(db, `wallets/${uid}/meldbux`), 0);
      await set(ref(db, `wallets/${uid}/inventory/${itemId}`), true);
      status("ecoGrantStatus", "Item given.");
    } else if (action === "unitem") {
      await remove(ref(db, `wallets/${uid}/inventory/${itemId}`));
      status("ecoGrantStatus", "Item removed.");
    } else if (action === "pro") {
      if (!(await get(ref(db, `wallets/${uid}/meldbux`))).exists()) await set(ref(db, `wallets/${uid}/meldbux`), 0);
      await set(ref(db, `wallets/${uid}/proPass`), true);
      status("ecoGrantStatus", "Pro Pass granted.");
    } else if (action === "xp") {
      if (!amount) throw new Error("Enter an amount.");
      await update(ref(db, `users/${uid}`), { xp: increment(amount), seasonXp: increment(amount) });
      status("ecoGrantStatus", `Gave ${fmt(amount)} XP.`);
    }
  } catch (error) { console.error(error); status("ecoGrantStatus", "Failed: " + error.message); }
}

async function lookup() {
  try {
    const uid = await resolveUid(q("ecoUser").value);
    const [user, wallet] = await Promise.all([get(ref(db, `users/${uid}`)), get(ref(db, `wallets/${uid}`))]);
    const u = user.val() || {}, w = wallet.val() || {};
    status("ecoGrantStatus", `${u.username || "?"} · UID ${uid} · Lv ${levelFromXp(u.xp)} (${fmt(u.xp)} XP) · ${fmt(w.meldbux)} Meldbux · ${Object.keys(w.inventory || {}).length} items${w.proPass ? " · Pro Pass" : ""}`);
  } catch (error) { status("ecoGrantStatus", "Failed: " + error.message); }
}

/* ---------------------------------------------------------------- custom item */
async function addCustom() {
  if (!isOwner) return;
  try {
    const type = q("ciType").value, name = q("ciName").value.trim();
    if (!name) throw new Error("Give it a name.");
    const id = `x_${type}_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`.slice(0, 40);
    const img = q("ciImg").value.trim();
    if (img && !/^https:\/\//i.test(img)) throw new Error("Image URL must start with https://");
    const c1 = safeColor(q("ciC1").value), c2 = safeColor(q("ciC2").value), c3 = safeColor(q("ciC3").value);
    let art;
    if (type === "pfp") art = img ? { img } : { g: [c1, c2], icon: (q("ciIcon").value.trim() || "fa-star").replace(/[^\w-]/g, "") };
    else if (type === "border") art = { kind: "conic", colors: [c1, c2, c3, c1], anim: "spin" };
    else if (type === "banner") art = img ? { img } : { g: [c3, c1, c2], angle: 130, pattern: "dots" };
    else art = { vars: { accent: c1, accentLight: c2, accentDark: c3, bg: "#0b0d0b", bg2: c3 }, pattern: "grid", ...(img ? { img } : {}) };
    const price = Math.max(0, Math.floor(Number(q("ciPrice").value) || 0));
    const hidden = q("ciHidden").checked || price === 0;
    await set(ref(db, `catalog/items/${id}`), { id, type, name, rarity: q("ciRarity").value, price, art, ...(hidden ? { hidden: true } : {}) });
    await loadCatalog(); fillItemSelects();
    status("ciStatus", `Added "${name}" (${id}).`);
  } catch (error) { console.error(error); status("ciStatus", "Failed: " + error.message); }
}

/* ---------------------------------------------------------------- maintenance + history */
async function setMaintenance(on) {
  try {
    const message = q("ecoMaintMsg").value.trim();
    if (on && !message) throw new Error("Type the message first.");
    await set(ref(db, "siteConfig/maintenance"), { enabled: on, message: on ? message : "" });
    status("ecoMaintStatus", on ? "Banner is live." : "Banner hidden.");
  } catch (error) { status("ecoMaintStatus", "Failed: " + error.message); }
}

function watchMaintenance() {
  let bar = null;
  onValue(ref(db, "siteConfig/maintenance"), snap => {
    const m = snap.val();
    if (!m || !m.enabled || !m.message) { if (bar) { bar.remove(); bar = null; } return; }
    if (!bar) {
      bar = document.createElement("div");
      bar.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:2147482000;padding:9px 44px 9px 16px;text-align:center;background:#fbbf24;color:#1a1200;font:700 13px system-ui,sans-serif;box-shadow:0 8px 30px #0008";
      const x = document.createElement("button");
      x.type = "button"; x.textContent = "×"; x.setAttribute("aria-label", "Dismiss");
      x.style.cssText = "position:absolute;right:10px;top:4px;border:0;background:transparent;font-size:20px;cursor:pointer;color:#1a1200";
      x.addEventListener("click", () => bar.remove());
      bar.append(document.createElement("span"), x);
      document.body.appendChild(bar);
    }
    bar.firstChild.textContent = "🛠 " + m.message;
  }, () => {});
}

function loadHistory() {
  const box = q("ecoHist");
  if (!box || !isOwner) return;
  get(ref(db, "announcementHistory")).then(snap => {
    const rows = Object.values(snap.val() || {}).sort((a, b) => b.sentAt - a.sentAt).slice(0, 12);
    box.replaceChildren(...rows.map(r => { const d = document.createElement("div"); d.textContent = `${new Date(r.sentAt).toLocaleString()} · ${r.message}`; return d; }));
    if (!rows.length) { const d = document.createElement("div"); d.textContent = "Nothing sent yet."; box.appendChild(d); }
  }).catch(() => {});
}

/* ---------------------------------------------------------------- boot */
if (panel) {
  watchMaintenance();
  const pane = build();
  q("ecoPublish").addEventListener("click", publishCatalog);
  q("ecoCodeCreate").addEventListener("click", createCode);
  q("ecoGrant").addEventListener("click", grant);
  q("ecoLookup").addEventListener("click", lookup);
  q("ciAdd").addEventListener("click", addCustom);
  q("ecoMaintOn").addEventListener("click", () => setMaintenance(true));
  q("ecoMaintOff").addEventListener("click", () => setMaintenance(false));

  loadCatalog().then(fillItemSelects);
  onAuthStateChanged(auth, user => {
    isOwner = Boolean(user && user.uid === OWNER_UID());
    q("meldTabEconomy").hidden = !isOwner;
    if (isOwner) { loadCodes(); loadHistory(); fillItemSelects(); }
    else pane.hidden = true;
  });
}
