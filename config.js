
/* =====================================================================
   MELD CONFIG  —  the one file you edit to change site-wide settings.
   Loaded as a normal <script> BEFORE everything else, so every page and
   module can read  window.MELD_CONFIG.
   ===================================================================== */
window.MELD_CONFIG = {
  VERSION: "1.1.0",

  /* Your Firebase Auth UID (the owner/admin account). */
  OWNER_UID: "OH6Jo3MnREgxfEGyVRxivcsuF582",

  /* ---------------------------------------------------------------
     DISCORD  — shown in the Discord panel. You can also change this
     live from the Owner Tools panel (it is stored in Firebase at
     siteConfig/discordInvite and overrides this value).
     --------------------------------------------------------------- */
  DISCORD_INVITE: "https://discord.gg/your-invite",
  DISCORD_NAME: "Meld Community",

  /* ---------------------------------------------------------------
     BROWSER / PROXY
     External websites cannot be shown in an iframe directly (most sites
     forbid it), so Meld's browser sends them through the Scramjet proxy
     you were already using in Loadingtest.html.
     --------------------------------------------------------------- */
  PROXY_BASE: "https://amethyst.zone/scram/service/",
  PROXY_INIT: "https://amethyst.zone/browse",
  SEARCH_URL: "https://html.duckduckgo.com/html/?q=",

  /* meld://Name  ->  where it goes.
     proxy:false  = open directly in the iframe (your own pages / pages built for embedding)
     proxy:true   = always send through the proxy                                      */
  ROUTES: {
    games:       { label: "Games",       url: "Ppage.html" },
    proxy:       { label: "Proxy",       url: "Loadingtest.html" },
    movies:      { label: "Movies",      url: "https://vuflix.co/", proxy: true },
    roblox:      { label: "Roblox",      url: "https://angst.clawschools.org/embed.html#https://nowgg.fun/apps/a/19900/b.html", proxy: false },
    minecraft:   { label: "Minecraft",   url: "https://meld-code.github.io/MC/", proxy: false },
    youtube:     { label: "YouTube",     url: "https://meld-code.github.io/YT", proxy: false },
    ai:          { label: "AI",          url: "https://chat.morphic.sh/", proxy: true },
    anime:       { label: "Anime",       url: "ComingSoon.html" },
    home:        { label: "Home",        url: "ComingSoon.html" },
    leaderboard: { label: "Leaderboard", url: "leaderboard.html" },
    profile:     { label: "Profile",     url: "profile.html" },
    discord:     { label: "Discord",     url: "discord.html" }
  },

  /* Hosts that are allowed to load directly (no proxy) when typed in. */
  DIRECT_HOSTS: ["meld-code.github.io", "localhost", "127.0.0.1"],

  /* ---------------------------------------------------------------
     STORE
     Paste a Stripe "Payment Link" (or any checkout link) into each
     `link`. Leave it "" and the Buy button shows "Coming soon".
     Prices here are just labels — set the real price in Stripe.
     After someone pays, perks are granted from Owner Tools (or by a
     webhook if you add one later — see UPGRADE-NOTES.md).
     --------------------------------------------------------------- */
  STORE: {
    oneTime: [
      { id: "adfree",     name: "Ad-Free Pass",        price: "$1.99", icon: "fa-ban",
        desc: "Remove Meld ads forever. One payment, never again.", link: "" },
      { id: "namechange", name: "Name Change Token",   price: "$1.99", icon: "fa-pen-to-square",
        desc: "Change your username one more time (your first change is free).", link: "" },
      { id: "vip",        name: "Lifetime VIP",        price: "$9.99", icon: "fa-crown", badge: "BEST VALUE",
        desc: "VIP rank forever, ads removed, plus a free Name Change Token.", link: "" }
    ],
    memberships: [
      { id: "supporter",  name: "Supporter",           price: "$2.99 / month", icon: "fa-heart",
        perks: ["Supporter rank badge", "No ads while subscribed", "Supporter chat flair"], link: "" },
      { id: "plus",       name: "Meld Plus",           price: "$5.99 / month", icon: "fa-bolt", badge: "POPULAR",
        perks: ["Everything in Supporter", "VIP rank badge", "1 free Name Change Token every month", "Early access to new features"], link: "" }
    ]
  },

  /* ---------------------------------------------------------------
     RANKS
     special  = handed out by you (Owner Tools).
     earned   = unlocked automatically by level (levels come from playtime + games launched).
     --------------------------------------------------------------- */
  RANKS: [
    { id: "owner",     name: "Owner",       color: "#ffb020", icon: "fa-crown",         kind: "special", desc: "Created and runs Meld." },
    { id: "admin",     name: "Admin",       color: "#ff5d6c", icon: "fa-shield-halved", kind: "special", desc: "Keeps Meld running smoothly." },
    { id: "moderator", name: "Moderator",   color: "#4ea1ff", icon: "fa-gavel",         kind: "special", desc: "Keeps chat friendly." },
    { id: "partner",   name: "Partner",     color: "#b98bff", icon: "fa-handshake",     kind: "special", desc: "A trusted Meld partner." },
    { id: "founder",   name: "Founder",     color: "#ff8a3d", icon: "fa-flag",          kind: "special", desc: "Was here at the very start." },
    { id: "vip",       name: "VIP",         color: "#ffd166", icon: "fa-gem",           kind: "special", desc: "Lifetime VIP or Meld Plus member." },
    { id: "supporter", name: "Supporter",   color: "#ff7ad9", icon: "fa-heart",         kind: "special", desc: "Supports Meld with a membership." },
    { id: "beta",      name: "Beta Tester", color: "#55e6c1", icon: "fa-flask",         kind: "special", desc: "Helped test Meld before launch." },

    { id: "member",    name: "Member",      color: "#a0ada0", icon: "fa-user",          kind: "earned",  level: 1,  desc: "Everyone starts here." },
    { id: "regular",   name: "Regular",     color: "#8fd14f", icon: "fa-seedling",      kind: "earned",  level: 5,  desc: "Reach level 5." },
    { id: "gamer",     name: "Gamer",       color: "#5fd0ff", icon: "fa-gamepad",       kind: "earned",  level: 10, desc: "Reach level 10." },
    { id: "veteran",   name: "Veteran",     color: "#c7a6ff", icon: "fa-medal",         kind: "earned",  level: 20, desc: "Reach level 20." },
    { id: "elite",     name: "Elite",       color: "#ffa94d", icon: "fa-fire",          kind: "earned",  level: 35, desc: "Reach level 35." },
    { id: "legend",    name: "Legend",      color: "#ff6bcb", icon: "fa-star",          kind: "earned",  level: 50, desc: "Reach level 50." }
  ],

  /* XP rules (shown in Info > Ranks). */
  XP_PER_ACTIVE_MINUTE: 2,
  XP_PER_GAME_LAUNCH: 5,

  /* ---------------------------------------------------------------
     PARTNERS  — add objects here and they appear in the Partners panel.
     { name, desc, url, image (optional path), tag (optional) }
     --------------------------------------------------------------- */
  PARTNERS: [
    { name: "CiphAnon Studios", desc: "The studio behind Meld. Games, tools and experiments built for students.",
      url: "", image: "Images/CiphAnonStudios.png", tag: "FOUNDING STUDIO" }
  ],

  /* Shown in Info > Updates (newest first). */
  CHANGELOG: [
    { version: "1.1.0", date: "2026-11-14", title: "Profiles, Leaderboards & Store",
      items: [
        "Playtime tracking now works and feeds a real level + XP system",
        "Profiles: multiple ranks, bio, favorite games, friends and a free name change",
        "Leaderboards with 3 boards and a top-3 podium",
        "Chat: grouped messages, replies, reactions, edit, emoji picker, mentions",
        "Browser rebuilt with meld:// addresses, tabs, history and a proxy",
        "Scheduled announcements — Admin Abuse Friday can run itself",
        "Bigger Meld ads, the new Store and the Discord panel"
      ] },
    { version: "1.0.0", date: "2026-10-01", title: "Meld launches",
      items: ["Quick-link blocks with physics", "Games library", "Built-in browser and chat"] }
  ]
};

