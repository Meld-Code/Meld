# Meld 1.2 — setup (5 minutes)

## 1. Publish the Firebase rules  (REQUIRED)
Firebase console → Realtime Database → Rules → paste `database.rules.json` → Publish.
Without this the wallet, store, codes, pass, friend search and equipping will all say "permission denied".

## 2. Publish the catalog
Open Meld signed in as the owner → Live Announcements → **Economy** → **Publish catalog to Firebase**.
The rules charge/pay from that published copy, so do this once, and again any time you edit prices in `catalog.js`.

## 3. Real money (optional)
Paste Stripe Payment Links into `config.js → STORE`, `catalog.js → STORE.packs` and `catalog.js → PASS.pro.link`.
After someone pays, give it to them from Economy → Give / take (Meldbux, Pro Pass, items). The Stripe link carries their UID.

## 4. Codes
Economy → Redeem codes → set Meldbux / XP / items / Pro Pass, max uses, expiry → Create. "Announce" posts it live.
Players redeem in Store → Meldbux.

## Things to know
* **Security:** without a backend, rules are the only guard. Purchases, code redemption and pass claims are all validated
  by rules against the published catalog (one redeem per account per code, exact price, tier XP, Pro Pass required for Pro rewards).
  Two weaknesses remain, same as before: XP/season XP are written by the player's browser (capped at +2000 per write), so a
  determined cheater could inflate XP and therefore pass tiers; and a code's "max uses" counter can be skipped by someone who
  already knows the code. For real money you should eventually move payouts to a Cloud Function / Stripe webhook.
* **Cheat panel:** it drives the ACTIVE tab, including same-origin iframes. A page on a different domain (most games, and
  proxied sites) cannot be controlled by any website script. For pages you own, add
  `<script src="https://YOUR-SITE/meld-bridge.js"></script>` and the panel works through it (nested iframes too).
* **Proxy errors:** a cross-origin iframe never reports its own errors, so Meld detects failures by (a) proxy unreachable,
  (b) a load timeout, and (c) a "Page blank or broken? Reload" chip shown after proxied pages load.
* New files: catalog.js, meld-economy.js, meld-friends.js, meld-controls.js, meld-bridge.js, owner-tools.js.
  Rewritten: store.js, profile.html. Edited: leaderboard.html, tracker.js, browser.js, announcement.js, index.html, script.js,
  config/CSS/rules.
* Chat (chat.js) still draws its own plain avatars; borders/pfps show on profile, leaderboard and friends.
