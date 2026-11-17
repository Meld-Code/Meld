

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
     you were already using in Loadingtest.html.(Shout-out to Amethyst.zone)
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
    // SPECIAL RANKS

    { id: "owner", name: "Owner", color: "#FFB547", icon: "fa-crown", kind: "special", desc: "Created and runs Meld." },
    { id: "trusted", name: "Trusted", color: "#FF647C", icon: "fa-shield-alt", kind: "special", desc: "A special rank given to reliable members of the Meld community." },
    { id: "contributor", name: "Contributor", color: "#B58AFF", icon: "fa-code-branch", kind: "special", desc: "Awarded to members who help improve Meld through suggestions, bug reports, and contributions." },
    { id: "supporter", name: "Supporter", color: "#FF985C", icon: "fa-heart", kind: "special", desc: "Awarded to members who help support, promote, and grow Meld." },

    // VIP RANKS

    { id: "vip1", name: "VIP I", color: "#B9C5D6", icon: "fa-gem", kind: "special", desc: "Given to members who have spent $1+." },
    { id: "vip2", name: "VIP II", color: "#63C7E8", icon: "fa-gem", kind: "special", desc: "Given to members who have spent $10+." },
    { id: "vip3", name: "VIP III", color: "#8B91FF", icon: "fa-gem", kind: "special", desc: "Given to members who have spent $50+." },
    { id: "vip4", name: "VIP IV", color: "#C58AFF", icon: "fa-gem", kind: "special", desc: "Given to members who have spent $100+." },
    { id: "vip5", name: "VIP V", color: "#FFD166", icon: "fa-crown", kind: "special", desc: "Given to members who have spent $250+." },

    // COMMUNITY RANKS

    { id: "socialSupporter", name: "Social Supporter", color: "#55DDB5", icon: "fa-share-alt", kind: "special", desc: "Awarded to members who follow all official social media accounts belonging to Meld's owner." },
    { id: "superSupporter", name: "Super Supporter", color: "#36CFA5", icon: "fa-heart", kind: "special", desc: "A special recognition rank for dedicated members who consistently support Meld, engage with its content, and create their own content featuring Meld." },
    { id: "tester", name: "Tester", color: "#45B9FF", icon: "fa-flask", kind: "special", desc: "A special rank given to members who help test and build Meld." },
    { id: "partner", name: "Partner", color: "#A78BFA", icon: "fa-handshake", kind: "special", desc: "Awarded to members who have partnered with Meld and operate their own unblocked website." },
    { id: "mascot", name: "Mascot", color: "#FF9F43", icon: "fa-paw", kind: "special", desc: "The official mascot account of Meld." },

    // EXTREMELY RARE RANKS

    { id: "luckyBreak", name: "Lucky Break", color: "#65D68A", icon: "fa-clover", kind: "special", desc: "1 in 10K." },
    { id: "hiddenGem", name: "Hidden Gem", color: "#42C6C9", icon: "fa-gem", kind: "special", desc: "1 in 100K." },
    { id: "rareEncounter", name: "Rare Encounter", color: "#579BFF", icon: "fa-eye", kind: "special", desc: "1 in 1M." },
    { id: "luckyLegend", name: "Lucky Legend", color: "#9B7BFF", icon: "fa-magic", kind: "special", desc: "1 in 10M." },
    { id: "freakAccident", name: "Freak Accident", color: "#C16CFF", icon: "fa-bolt", kind: "special", desc: "1 in 100M." },
    { id: "statisticalAnomaly", name: "Statistical Anomaly", color: "#E879F9", icon: "fa-chart-line", kind: "special", desc: "1 in 1B." },
    { id: "realityBreaker", name: "Reality Breaker", color: "#FF648D", icon: "fa-atom", kind: "special", desc: "1 in 10B." },
    { id: "beyondBelief", name: "Beyond Belief", color: "#FF795E", icon: "fa-infinity", kind: "special", desc: "1 in 100B." },
    { id: "howDidYouGetThis", name: "HOW DID YOU GET THIS?!", color: "#FFD166", icon: "fa-bomb", kind: "special", desc: "1 in 1T." },
    { id: "fuckingPotato", name: "Fucking Potato", color: "#D6A56D", icon: "fa-leaf", kind: "special", desc: "1 in 100T." },

    // LEVEL RANKS
    { id: "og", name: "OG", color: "#5CA9FF", icon: "fa-cookie-bite", kind: "earned", level: 1, desc: ""},
    { id: "member", name: "Member", color: "#A0ADA8", icon: "fa-user", kind: "earned", level: 1, desc: "Automatically given when you create an account." },
    { id: "rookie", name: "Rookie", color: "#8FD14F", icon: "fa-seedling", kind: "earned", level: 5, desc: "Reach level 5." },
    { id: "explorer", name: "Explorer", color: "#5FD0FF", icon: "fa-compass", kind: "earned", level: 10, desc: "Reach level 10." },
    { id: "regular", name: "Regular", color: "#A78BFA", icon: "fa-medal", kind: "earned", level: 20, desc: "Reach level 20." },
    { id: "rising", name: "Rising", color: "#FF9F43", icon: "fa-fire", kind: "earned", level: 35, desc: "Reach level 35." },
    { id: "skilled", name: "Skilled", color: "#F472B6", icon: "fa-star", kind: "earned", level: 50, desc: "Reach level 50." },
    { id: "elite", name: "Elite", color: "#EC69C5", icon: "fa-bolt", kind: "earned", level: 85, desc: "Reach level 85." },
    { id: "expert", name: "Expert", color: "#D879FF", icon: "fa-award", kind: "earned", level: 100, desc: "Reach level 100." },
    { id: "master", name: "Master", color: "#A78BFA", icon: "fa-shield-alt", kind: "earned", level: 150, desc: "Reach level 150." },
    { id: "legend", name: "Legend", color: "#FFD166", icon: "fa-crown", kind: "earned", level: 225, desc: "Reach level 225." },
    { id: "apex", name: "Apex", color: "#FF5C5C", icon: "fa-dragon", kind: "earned", level: 350, desc: "Reach level 350." }
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
      url: "", image: "Images/CiphAnonStudios.png", tag: "FOUNDING STUDIO" },
    { name: "Wavey Chps", desc: "",
      url: "", image: "", tag: "Trusted Partner" }
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


