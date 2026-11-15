# Meld v1.1.0 — what changed & what you must do

## 1. Do these 3 things after uploading
1. **Firebase rules** (Realtime Database → Rules). Merge the block in section 5. Without it, saving playtime, reactions, schedules and the leaderboard will be blocked.
2. **`config.js`** — set `DISCORD_INVITE` (or set it live from *Live Announcements → Owner tools*), your Stripe/checkout links in `STORE`, and add real `PARTNERS`.
3. **Proxy check** — open the site, click *Movies* or type `wikipedia.org` in the browser. If it never loads, the proxy host in `config.js` (`PROXY_BASE` / `PROXY_INIT`) is down or changed.

## 2. What's new (file map)
| Feature | Files |
|---|---|
| Playtime that works (`tracker.js` was **missing** from the zip, so it never ran) | `tracker.js` |
| Levels/XP + multiple ranks | `meld-shared.js`, `config.js` (RANKS) |
| Profile: bio, favorites, friends, ranks, free name change | `profile.html`, `favorites-sync.js`, `games-catalog.js` |
| Leaderboard (Playtime / Level / Games) with top-3 podium | `leaderboard.html` |
| Chat: avatars, grouping, replies, reactions, edit, emoji picker, mentions, links | `chat.js`, `meld-v2.css` |
| Auto-run announcements | `announcement.js` |
| Browser with `meld://` addresses | `browser.js`, `index.html`, `script.js` |
| Bigger ads, Store, Discord/Partners/Info panels | `script.js`, `store.js`, `meld-extras.js`, `meld-v2.css` |

## 3. How things work
- **XP**: 2 XP per active minute + 5 XP per game launched. Level L needs `25·L·(L−1)` XP. Earned ranks: Regular L5, Gamer L10, Veteran L20, Elite L35, Legend L50. Owner-granted ranks (Admin, Moderator, Partner, Founder, Beta…) stack on top, plus VIP/Supporter from the store.
- **Playtime** counts only while the tab is visible + focused and you're interacting (or a game is open in the Meld browser). Idle 3 min = paused.
- **Name change**: first one free (`nameChangesUsed`), after that needs a *Name Change Token* (`entitlements/nameChangeCredits`). Chat display-name editing was removed so it can't bypass this.
- **Auto Admin Abuse**: *Live Announcements → Auto-schedule*. Saved in `announcementSchedule/`; **every visitor's browser** shows what's due, so nothing needs to be online. Weekly / daily / once, with time zone.
- **Store**: buttons open your payment link with `client_reference_id=<uid>`. After payment, apply the perk in *Owner tools → Perks & Ranks* (username or UID). A Stripe webhook + Cloud Function could automate this later.
- **Browser**: `meld://Games`, `meld://Proxy`, `meld://Movies`, `meld://Roblox`, `meld://Minecraft`, `meld://YouTube`, `meld://AI`, `meld://Leaderboard`, `meld://Profile`. Edit `ROUTES` in `config.js`. Outside sites go through the proxy (toggle with the shield button).

## 4. Honest limits
- Playtime/XP/leaderboard numbers are written by each player's browser, so a determined player could fake them. Rules below limit *what* can be written, not *how much*. Real protection needs Cloud Functions.
- Payments are **not** automatic yet (see Store above).
- I couldn't reach `amethyst.zone` from my environment, so the proxy path is tested for routing only, not for a live page load.
- `games-catalog.js` is a snapshot of `Ppage.html`'s games. Re-generate it if you add games (new ones still work; they just show without cover art on profiles).

## 5. Firebase rules
Your existing rules were merged with the new features into **`database.rules.json`** (in this zip). Paste its contents into Realtime Database → Rules → Publish.
What changed vs. yours:
- `users`: readable by signed-in users + `.indexOn` (leaderboard). Players can edit their own profile **except** `ranks` and `entitlements` (owner only) and `rank` (locked to "Member"). Playtime/XP/launch counts can only go up, with a cap per save. A username change must bump `nameChangesUsed` and spend a token after the first free change.
- `chatMessages` / `chatDirectMessages`: senders can edit their own messages; signed-in users can add/remove their own reaction.
- New: `announcementSchedule` (public read, owner/publishers write) and `siteConfig` (public read, owner write).
Everything else is exactly yours. Test with **Rules Playground** after publishing; if chat/login misbehave, re-paste your old rules to roll back.
