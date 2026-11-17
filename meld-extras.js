
/* =====================================================================
   MELD EXTRAS (homepage)
   • Discord panel that shows your server invite URL (+ copy / join)
   • Partners panel cards (from config.js → PARTNERS)
   • Info panel: Info / Team / Ranks / Updates content
   ===================================================================== */
import { db, ref, onValue, CFG, escapeHtml } from "./meld-core.js";

const $ = id => document.getElementById(id);

/* ------------------------------------------------------------------ Discord */
let inviteUrl = CFG().DISCORD_INVITE || "";

function isSafeInvite(url) {
  return /^https:\/\/(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/[\w-]+\/?$/i.test(url || "");
}

function renderDiscord() {
  const overlay = $("discordOverlay");
  if (!overlay) return;
  const configured = isSafeInvite(inviteUrl);
  const shown = configured ? inviteUrl : "Invite link not set yet";

  $("discordUrl").textContent = shown;
  $("discordUrl").classList.toggle("unset", !configured);
  const join = $("discordJoin");
  join.href = configured ? inviteUrl : "#";
  join.setAttribute("aria-disabled", String(!configured));
  join.classList.toggle("disabled", !configured);
  $("discordCopy").disabled = !configured;
  $("discordHint").textContent = configured
    ? "Click Join to open Discord, or copy the link and send it to a friend."
    : "The owner hasn't added the invite link yet. (Owner: open Live Announcements → Owner tools.)";
}

function openDiscord() { $("discordOverlay")?.classList.add("open"); }
function closeDiscord() { $("discordOverlay")?.classList.remove("open"); }

$("discordButton")?.addEventListener("click", event => { event.preventDefault(); openDiscord(); });
$("discordClose")?.addEventListener("click", closeDiscord);
$("discordOverlay")?.addEventListener("click", event => { if (event.target === $("discordOverlay")) closeDiscord(); });
document.addEventListener("keydown", event => { if (event.key === "Escape") closeDiscord(); });

$("discordCopy")?.addEventListener("click", async () => {
  const button = $("discordCopy");
  try {
    await navigator.clipboard.writeText(inviteUrl);
  } catch (_) {
    const range = document.createRange();
    range.selectNodeContents($("discordUrl"));
    const selection = getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    try { document.execCommand("copy"); } catch (__) { /* ignore */ }
  }
  const original = button.innerHTML;
  button.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
  setTimeout(() => { button.innerHTML = original; }, 1600);
});

onValue(ref(db, "siteConfig/discordInvite"), snapshot => {
  const value = snapshot.val();
  if (typeof value === "string" && isSafeInvite(value)) inviteUrl = value;
  renderDiscord();
}, () => renderDiscord());
renderDiscord();

/* ------------------------------------------------------------------ Partners */
function renderPartners() {
  const list = $("partnersList");
  if (!list) return;
  const partners = CFG().PARTNERS || [];

  const cards = partners.map(partner => {
    const image = partner.image
      ? `<img src="${escapeHtml(partner.image)}" alt="" loading="lazy">`
      : `<i class="fa-solid fa-handshake"></i>`;
    const tag = partner.tag ? `<span class="partnerTag">${escapeHtml(partner.tag)}</span>` : "";
    const safeUrl = /^https?:\/\//i.test(partner.url || "") ? partner.url : "";
    const open = safeUrl
      ? `<a class="partnerLink" href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">Visit <i class="fa-solid fa-arrow-up-right-from-square"></i></a>`
      : "";
    return `<article class="partnerCard">
      <div class="partnerLogo">${image}</div>
      <div class="partnerInfo">${tag}<h3>${escapeHtml(partner.name)}</h3><p>${escapeHtml(partner.desc || "")}</p>${open}</div>
    </article>`;
  });

  cards.push(`<article class="partnerCard partnerOpen">
      <div class="partnerLogo"><i class="fa-solid fa-plus"></i></div>
      <div class="partnerInfo"><span class="partnerTag">OPEN SLOT</span><h3>Become a partner</h3>
      <p>Run a site, server or community? Partner with Meld and get featured here.</p>
      <button class="partnerLink" type="button" id="partnerApply">Apply on Discord <i class="fa-brands fa-discord"></i></button></div>
    </article>`);

  list.innerHTML = cards.join("");
  $("partnerApply")?.addEventListener("click", () => {
    $("partnersOverlay")?.classList.remove("open");
    openDiscord();
  });
}
renderPartners();

/* ------------------------------------------------------------------ Info panel */
function infoCard(icon, title, text) {
  return `<article class="infoItem"><span class="infoIcon"><i class="fa-solid ${icon}"></i></span>
    <div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(text)}</span></div></article>`;
}

function renderInfo() {
  const cfg = CFG();

  const infoBox = $("infoCardsInfo");
  if (infoBox) {
    infoBox.innerHTML = [
      infoCard("fa-gamepad", "Games library", "Dozens of games that run right inside Meld. Heart your favorites to show them on your profile."),
      infoCard("fa-globe", "Built-in browser", "Open meld://Games, meld://Proxy and more. Websites load through the Meld proxy, with tabs and bookmarks."),
      infoCard("fa-comments", "Chat & friends", "Servers, DMs, reactions and replies. Add friends and see who is online."),
      infoCard("fa-trophy", "Leaderboards", "Three boards — playtime, level and games launched — with a top-3 podium."),
      infoCard("fa-user", "Profiles", "A bio, favorite games, friends, ranks and a level that grows as you play."),
      infoCard("fa-store", "Store", "Go ad-free, grab a name change, or become a member to support Meld."),
      infoCard("fa-cubes", "Moving blocks", "Turn on Moving Blocks in Settings to drag the quick-link icons around with real physics."),
      infoCard("fa-hand-pointer", "Quick links", "Click a block to open it. Hold one for 2.5 seconds without dragging to straighten it.")
    ].join("");
  }

  const team = $("infoCardsTeam");
  if (team) {
    team.innerHTML = [
      infoCard("fa-crown", "ToonyTime — Creator", "Designed, built and runs Meld."),
      infoCard("fa-star", "CiphAnon Studios", "The studio behind Meld and its upcoming projects."),
      infoCard("fa-shield-halved", "Admins & Moderators", "Volunteers who keep chat friendly. Look for their rank badges."),
      infoCard("fa-heart", "You", "Suggestions, bug reports and partners shape what comes next — tell us on Discord.")
    ].join("");
  }

  const ranks = $("infoCardsRanks");
  if (ranks) {
    const rankRows = (cfg.RANKS || []).map(rank => `
      <article class="infoItem rankInfo" style="--c:${escapeHtml(rank.color)}">
        <span class="infoIcon" style="color:${escapeHtml(rank.color)};border-color:${escapeHtml(rank.color)}55;background:${escapeHtml(rank.color)}18"><i class="fa-solid ${escapeHtml(rank.icon)}"></i></span>
        <div><strong style="color:${escapeHtml(rank.color)}">${escapeHtml(rank.name)}${rank.kind === "earned" ? ` · Lv ${rank.level}` : ""}</strong>
        <span>${escapeHtml(rank.desc)}</span></div>
      </article>`);
    ranks.innerHTML =
      `<article class="infoItem infoWide"><span class="infoIcon"><i class="fa-solid fa-bolt"></i></span><div><strong>How you level up</strong>
      <span>You earn ${cfg.XP_PER_ACTIVE_MINUTE ?? 2} XP for every minute you actively play and ${cfg.XP_PER_GAME_LAUNCH ?? 5} XP each time you launch a game. Earned ranks unlock automatically at the levels shown. You can hold several ranks at once.</span></div></article>`
      + rankRows.join("");
  }

  const updates = $("infoCardsUpdates");
  if (updates) {
    updates.innerHTML = (cfg.CHANGELOG || []).map(entry => `
      <article class="infoItem infoWide changelog">
        <span class="infoIcon"><i class="fa-solid fa-cloud-arrow-up"></i></span>
        <div><strong>v${escapeHtml(entry.version)} · ${escapeHtml(entry.title)} <em>${escapeHtml(entry.date || "")}</em></strong>
        <ul>${(entry.items || []).map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>
      </article>`).join("");
  }

  const version = $("welcomeVersion");
  if (version) version.textContent = "Meld v" + (cfg.VERSION || "1.0.0");
}
renderInfo();

