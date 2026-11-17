/* =====================================================================
   MELD CATALOG  —  everything you can buy, earn or redeem.
   Loaded as a normal <script> right AFTER config.js on every page.

   • Edit prices / add items here, then open  Owner Tools → Economy →
     "Publish catalog to Firebase".  The Firebase RULES read prices from
     the published copy, so a player can never pay less than the real price.
   • You can also add one-off items live from Owner Tools without editing
     this file (they live in Firebase at catalog/items).

   ITEM SHAPE
     id        unique, letters/numbers/_ only
     type      "pfp" | "border" | "banner" | "style"
     name      display name
     rarity    common | rare | epic | legendary | mythic
     price     Meldbux cost (0 + free:true = everyone owns it)
     usd       optional "$1.99" label (needs a Stripe link in `link`)
     link      optional Stripe Payment Link for the real-money option
     free      true  -> everybody has it from the start
     hidden    true  -> NOT sold in the store, only from codes / passes / you
     art       how it looks (see the helpers in meld-economy.js)
       pfp     { g:[c1,c2], icon:"fa-ghost" }   or  { img:"https://…" }
       border  { kind:"solid|gradient|conic|glow", colors:[…], anim:"spin|pulse|" }
       banner  { g:[c1,c2,c3], angle:120, pattern:"dots|grid|stripes|"}  or { img:"https://…" }
       style   { vars:{ accent, accentLight, accentDark, bg, bg2 }, pattern:"grid|dots|" , img:"https://…"(optional bg image) }
   ===================================================================== */
(function () {
  "use strict";
  const C = (window.MELD_CONFIG = window.MELD_CONFIG || {});

  C.MELDBUX = { NAME: "Meldbux", ICON: "fa-coins", COLOR: "#ffd166" };

  C.RARITIES = {
    common:    { name: "Common",    color: "#a0ada8", mult: 1 },
    rare:      { name: "Rare",      color: "#5ca9ff", mult: 1 },
    epic:      { name: "Epic",      color: "#c58aff", mult: 1 },
    legendary: { name: "Legendary", color: "#ffb547", mult: 1 },
    mythic:    { name: "Mythic",    color: "#ff5c8a", mult: 1 }
  };
  const PRICE = { common: 150, rare: 400, epic: 900, legendary: 2500, mythic: 7500 };

  const items = [];
  const add = (type, id, name, rarity, art, extra) =>
    items.push(Object.assign({ id, type, name, rarity, price: PRICE[rarity], art }, extra || {}));

  /* ------------------------------------------------------------- PROFILE PICTURES */
  const pfp = (id, name, rarity, g1, g2, icon, extra) => add("pfp", id, name, rarity, { g: [g1, g2], icon }, extra);
  pfp("pfp_default",  "Meld Green",    "common",    "#c1fa62", "#4e7d0e", "fa-user",         { price: 0, free: true });
  pfp("pfp_ghost",    "Ghost",         "common",    "#e6edf5", "#7b8aa0", "fa-ghost");
  pfp("pfp_gamepad",  "Player One",    "common",    "#7cf0ff", "#1c6bd1", "fa-gamepad");
  pfp("pfp_cat",      "Arcade Cat",    "common",    "#ffc27a", "#d1561c", "fa-cat");
  pfp("pfp_robot",    "Bot",           "common",    "#9ff7c4", "#157a55", "fa-robot");
  pfp("pfp_skull",    "Skully",        "rare",      "#f3f3f3", "#3b3b4a", "fa-skull");
  pfp("pfp_rocket",   "Launch",        "rare",      "#ffb199", "#c62a47", "fa-rocket");
  pfp("pfp_dragon",   "Wyrm",          "rare",      "#ff9a76", "#7a1d1d", "fa-dragon");
  pfp("pfp_bolt",     "Voltage",       "rare",      "#fff176", "#e08a00", "fa-bolt");
  pfp("pfp_alien",    "Visitor",       "epic",      "#b6ff8a", "#2e6b1c", "fa-user-astronaut");
  pfp("pfp_ninja",    "Shadow",        "epic",      "#9aa0b4", "#14151f", "fa-user-ninja");
  pfp("pfp_crown",    "Royal",         "legendary", "#ffe28a", "#b5780a", "fa-crown");
  pfp("pfp_diamond",  "Flawless",      "legendary", "#a8f0ff", "#4b6bff", "fa-gem");
  pfp("pfp_fire",     "Inferno",       "legendary", "#ffd166", "#e8341c", "fa-fire");
  pfp("pfp_void",     "The Void",      "mythic",    "#6a1fff", "#05010f", "fa-circle-notch");
  pfp("pfp_meld",     "Meld Prime",    "mythic",    "#a6ff68", "#0e2a05", "fa-cubes");
  /* code / pass / admin-abuse exclusives (hidden = not sold) */
  pfp("pfp_admin",    "Admin Abuse",   "legendary", "#ff8a8a", "#6b0f1a", "fa-user-shield", { hidden: true, price: 0 });
  pfp("pfp_tobnyi",   "Tobnyi",        "mythic",    "#ffd166", "#6b3d00", "fa-paw",         { hidden: true, price: 0 });
  pfp("pfp_s1",       "Season 1 Pilot","epic",      "#7cf0ff", "#2b2bd1", "fa-jet-fighter", { hidden: true, price: 0 });

  /* ------------------------------------------------------------- PFP BORDERS */
  const border = (id, name, rarity, kind, colors, anim, extra) =>
    add("border", id, name, rarity, { kind, colors, anim: anim || "" }, extra);
  border("bd_none",     "No Border",     "common",    "solid",    ["transparent"], "", { price: 0, free: true });
  border("bd_green",    "Meld Green",    "common",    "solid",    ["#86c52b"]);
  border("bd_white",    "Clean White",   "common",    "solid",    ["#f3f8ef"]);
  border("bd_sunset",   "Sunset",        "rare",      "gradient", ["#ff9f43", "#ff4d8d"]);
  border("bd_ocean",    "Deep Ocean",    "rare",      "gradient", ["#27d3ff", "#2b57ff"]);
  border("bd_toxic",    "Toxic",         "rare",      "glow",     ["#a6ff68"], "pulse");
  border("bd_rgb",      "RGB",           "epic",      "conic",    ["#ff3b3b", "#ffd93b", "#3bff6b", "#3bd6ff", "#a23bff", "#ff3b3b"], "spin");
  border("bd_plasma",   "Plasma",        "epic",      "conic",    ["#c58aff", "#27d3ff", "#c58aff"], "spin");
  border("bd_gold",     "Pure Gold",     "legendary", "gradient", ["#fff3a6", "#d79a12", "#fff3a6"], "spin");
  border("bd_inferno",  "Inferno",       "legendary", "glow",     ["#ff6a1a"], "pulse");
  border("bd_galaxy",   "Galaxy",        "mythic",    "conic",    ["#6a1fff", "#ff3bd6", "#27d3ff", "#6a1fff"], "spin");
  border("bd_admin",    "Admin Abuse",   "legendary", "conic",    ["#ff5c5c", "#ffd166", "#ff5c5c"], "spin", { hidden: true, price: 0 });
  border("bd_s1",       "Season 1",      "epic",      "glow",     ["#7cf0ff"], "pulse", { hidden: true, price: 0 });

  /* ------------------------------------------------------------- BANNERS */
  const banner = (id, name, rarity, g, angle, pattern, extra) =>
    add("banner", id, name, rarity, { g, angle, pattern: pattern || "" }, extra);
  banner("bn_default",  "Meld",          "common",    ["#263a20", "#4e7d0e", "#263a20"], 160, "", { price: 0, free: true });
  banner("bn_night",    "Night Shift",   "common",    ["#0f1020", "#1c2a5a", "#0f1020"], 135, "dots");
  banner("bn_ember",    "Ember",         "common",    ["#3a1408", "#c2410c", "#3a1408"], 120, "stripes");
  banner("bn_mint",     "Mint Grid",     "rare",      ["#06382f", "#14b8a6", "#06382f"], 150, "grid");
  banner("bn_rose",     "Rose Gold",     "rare",      ["#3b0f24", "#f472b6", "#3b0f24"], 110, "dots");
  banner("bn_cyber",    "Cyber",         "epic",      ["#12002e", "#7c3aed", "#06b6d4"], 125, "grid");
  banner("bn_aurora",   "Aurora",        "epic",      ["#042f2e", "#22d3ee", "#a78bfa"], 100, "");
  banner("bn_lava",     "Lava",          "legendary", ["#2a0505", "#ef4444", "#f59e0b"], 130, "stripes");
  banner("bn_cosmos",   "Cosmos",        "mythic",    ["#020010", "#4c1d95", "#db2777"], 140, "dots");
  banner("bn_admin",    "Admin Abuse",   "legendary", ["#2a0505", "#ff5c5c", "#ffd166"], 120, "stripes", { hidden: true, price: 0 });

  /* ------------------------------------------------------------- MELD STYLES (site themes + backgrounds) */
  const style = (id, name, rarity, v, pattern, extra) =>
    add("style", id, name, rarity, { vars: v, pattern: pattern || "grid" }, extra);
  style("st_default",  "Meld Classic", "common",    { accent: "#76b900", accentLight: "#a3e635", accentDark: "#496f00", bg: "#101210", bg2: "#293421" }, "grid", { price: 0, free: true });
  style("st_ocean",    "Ocean",        "rare",      { accent: "#0ea5e9", accentLight: "#7dd3fc", accentDark: "#075985", bg: "#0a1118", bg2: "#12324a" }, "grid");
  style("st_sunset",   "Sunset",       "rare",      { accent: "#f97316", accentLight: "#fdba74", accentDark: "#9a3412", bg: "#150d0a", bg2: "#4a2312" }, "dots");
  style("st_grape",    "Grape",        "rare",      { accent: "#a855f7", accentLight: "#d8b4fe", accentDark: "#6b21a8", bg: "#110a18", bg2: "#352057" }, "dots");
  style("st_rose",     "Rose",         "epic",      { accent: "#ec4899", accentLight: "#f9a8d4", accentDark: "#9d174d", bg: "#170a12", bg2: "#4d1236" }, "grid");
  style("st_mono",     "Monochrome",   "epic",      { accent: "#e5e7eb", accentLight: "#ffffff", accentDark: "#6b7280", bg: "#09090b", bg2: "#27272a" }, "grid");
  style("st_gold",     "Gold Rush",    "legendary", { accent: "#eab308", accentLight: "#fde047", accentDark: "#854d0e", bg: "#130f03", bg2: "#4a3a06" }, "dots");
  style("st_matrix",   "Matrix",       "legendary", { accent: "#22c55e", accentLight: "#86efac", accentDark: "#14532d", bg: "#020a04", bg2: "#06280f" }, "grid");
  style("st_admin",    "Admin Abuse",  "mythic",    { accent: "#ef4444", accentLight: "#fca5a5", accentDark: "#7f1d1d", bg: "#120505", bg2: "#4a1010" }, "stripes", { hidden: true, price: 0 });

  C.CATALOG = items;

  /* ===================================================================
     SEASON PASS
       Normal pass = free for everyone.  Pro pass = Meldbux or real money.
       Tier N unlocks when you have  N * xpPerTier  season XP.
       Season XP is earned together with normal XP (playtime, launches, quests).
     =================================================================== */
  const TIERS = 30;
  const XP_PER_TIER = 150;
  const FREE_ITEMS = { 5: "pfp_ghost", 10: "bd_green", 15: "bn_night", 20: "st_ocean", 25: "pfp_gamepad", 30: "bd_sunset" };
  const PRO_ITEMS  = { 1: "bd_s1", 5: "pfp_s1", 10: "bn_cyber", 15: "bd_plasma", 20: "st_grape", 25: "pfp_alien", 30: "bd_galaxy" };
  const tiers = {};
  for (let n = 1; n <= TIERS; n++) {
    tiers[n] = {
      xp: n * XP_PER_TIER,         /* season XP needed for this tier */
      free: Object.assign({ meldbux: n % 5 === 0 ? 60 : 20 }, FREE_ITEMS[n] ? { item: FREE_ITEMS[n] } : {}),
      pro:  Object.assign({ meldbux: n % 5 === 0 ? 200 : 60 }, PRO_ITEMS[n] ? { item: PRO_ITEMS[n] } : {})
    };
  }
  C.PASS = {
    season: "s1",
    name: "Season 1",
    xpPerTier: XP_PER_TIER,
    tiers: TIERS,
    pro: {
      meldbux: 6000,           /* what the Pro Pass costs in Meldbux (set any number) */
      usd: "$4.99",            /* label for the real-money option */
      link: ""                 /* paste a Stripe Payment Link; after paying, grant it from Owner Tools */
    },
    rewards: tiers
  };

  /* ===================================================================
     XP REWARDS
     =================================================================== */
  C.XP = {
    DAILY_LOGIN: 40,                 /* once a day, plus 5 per streak day (max +50) */
    STREAK_BONUS: 5, STREAK_MAX: 50,
    QUESTS: [                        /* resets every day; claim on your profile */
      { id: "play10",  name: "Warm up",       desc: "Play for 10 minutes",  metric: "seconds",  goal: 600,  xp: 60 },
      { id: "play45",  name: "Grinder",       desc: "Play for 45 minutes",  metric: "seconds",  goal: 2700, xp: 200 },
      { id: "launch3", name: "Game hopper",   desc: "Launch 3 games",       metric: "launches", goal: 3,    xp: 50 },
      { id: "launch8", name: "Arcade regular",desc: "Launch 8 games",       metric: "launches", goal: 8,    xp: 120 }
    ]
  };

  /* Real-money Meldbux packs (paste a Stripe Payment Link into each `link`).
     After someone pays, give them the Meldbux from Owner Tools → Economy. */
  C.STORE = C.STORE || {};
  C.STORE.packs = [
    { id: "pack1", name: "Pocket Change", meldbux: 500,   price: "$0.99", link: "" },
    { id: "pack2", name: "Stack",         meldbux: 1500,  price: "$2.49", link: "", badge: "POPULAR" },
    { id: "pack3", name: "Vault",         meldbux: 4000,  price: "$5.99", link: "" },
    { id: "pack4", name: "Whale",         meldbux: 10000, price: "$12.99", link: "", badge: "BEST VALUE" }
  ];

  /* Update the ranks text that other panels show */
  C.CHANGELOG = [
    { version: "1.2.0", date: "2026-11-16", title: "Meldbux, Passes & Customization",
      items: [
        "Meldbux currency, Season Pass (Normal + Pro) and daily quests",
        "Profile pictures, borders, banners and Meld styles — buy them or redeem codes",
        "Choose which rank is your main rank",
        "Better friends: search, add from any profile, requests inbox",
        "Browser shows a clear error + reload when a page fails to load",
        "Cheat panel rebuilt: auto clicker, key holding, works in the active tab",
        "Owner tools: codes, catalog, grant Meldbux, announcement styles"
      ] }
  ].concat(C.CHANGELOG || []);
  C.VERSION = "1.2.0";
})();
