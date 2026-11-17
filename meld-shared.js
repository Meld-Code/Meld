/* =====================================================================
   MELD SHARED HELPERS  (pure functions — no Firebase, no DOM)
   Used by profile, leaderboard, chat, tracker and announcements.
   ===================================================================== */

const CFG = () => globalThis.MELD_CONFIG || {};

export const RANKS = () => CFG().RANKS || [];
export const rankById = id => RANKS().find(rank => rank.id === id) || null;

/* ---------- XP and levels ----------
   Total XP needed to REACH level L is  25 * L * (L - 1)
   L1 = 0, L2 = 50, L5 = 500, L10 = 2,250, L20 = 9,500, L50 = 61,250        */

export function xpForLevel(level) {
  level = Math.max(1, Math.floor(level));
  return 25 * level * (level - 1);
}

export function levelFromXp(xp) {
  xp = Math.max(0, Number(xp) || 0);
  return Math.max(1, Math.floor((1 + Math.sqrt(1 + (4 * xp) / 25)) / 2));
}

export function levelProgress(xp) {
  xp = Math.max(0, Number(xp) || 0);
  const level = levelFromXp(xp);
  const floor = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return {
    level,
    xp,
    floor,
    next,
    into: xp - floor,
    needed: next - floor,
    percent: Math.min(100, Math.max(0, ((xp - floor) / (next - floor)) * 100))
  };
}

/* ---------- Formatting ---------- */

export function formatDuration(seconds, compact = false) {
  seconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (compact) {
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatNumber(value) {
  return (Math.max(0, Math.floor(Number(value) || 0))).toLocaleString("en-US");
}

/* ---------- Ranks ----------
   A profile can hold MANY ranks:
     • profile.ranks  — object { admin: true, beta: true } handed out by the owner
       (an array of ids, or the legacy string in profile.rank, also work)
     • earned ranks   — unlocked automatically from level
     • perk ranks     — VIP / Supporter from the store entitlements
   -------------------------------------------------------------------- */

const SPECIAL_PRIORITY = ["owner", "admin", "moderator", "partner", "founder", "vip", "supporter", "beta"];

function toIdList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(item => typeof item === "string");
  if (typeof value === "object") return Object.keys(value).filter(key => value[key]);
  if (typeof value === "string") return [value];
  return [];
}

function toDayList(value) {
  if (Array.isArray(value)) return value.map(Number).filter(day => Number.isInteger(day) && day >= 0 && day <= 6);
  if (value && typeof value === "object") {
    return Object.keys(value).filter(key => value[key]).map(Number).filter(day => Number.isInteger(day) && day >= 0 && day <= 6);
  }
  return [];
}

function normalizeId(value) {
  const id = String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  return id;
}

export function entitlementsActive(profile, now = Date.now()) {
  const ent = profile?.entitlements || {};
  const membership = ent.membership;
  const membershipActive = Boolean(
    membership && membership.tier && Number(membership.expiresAt || 0) > now
  );
  return {
    adFree: Boolean(ent.adFree) || Boolean(ent.vip) || membershipActive,
    vip: Boolean(ent.vip) || (membershipActive && membership.tier === "plus"),
    supporter: membershipActive,
    membershipTier: membershipActive ? membership.tier : "",
    membershipExpiresAt: membershipActive ? Number(membership.expiresAt) : 0,
    nameChangeCredits: Math.max(0, Math.floor(Number(ent.nameChangeCredits) || 0))
  };
}

/* Returns every rank object the profile currently holds, best first. */
export function resolveRanks(profile, uid = "", now = Date.now()) {
  const owned = new Set();
  const cfg = CFG();

  if (uid && uid === cfg.OWNER_UID) owned.add("owner");

  toIdList(profile?.ranks).forEach(id => owned.add(normalizeId(id)));
  toIdList(profile?.rank).forEach(id => {
    const normalized = normalizeId(id);
    if (normalized && normalized !== "member") owned.add(normalized);
  });

  const ent = entitlementsActive(profile, now);
  if (ent.vip) owned.add("vip");
  if (ent.supporter) owned.add("supporter");

  const level = levelFromXp(profile?.xp);
  const earned = RANKS().filter(rank => rank.kind === "earned" && level >= rank.level);
  earned.forEach(rank => owned.add(rank.id));
  owned.add("member");

  const specials = SPECIAL_PRIORITY
    .filter(id => owned.has(id))
    .map(rankById)
    .filter(Boolean);

  /* Legacy rank strings that are not in the catalog still show up. */
  const known = new Set(RANKS().map(rank => rank.id));
  const custom = [...owned]
    .filter(id => !known.has(id))
    .map(id => ({ id, name: id.charAt(0).toUpperCase() + id.slice(1), color: "#9ad1ff", icon: "fa-tag", kind: "special", desc: "Special rank." }));

  const earnedOwned = earned.slice().sort((a, b) => b.level - a.level);

  return [...specials, ...custom, ...earnedOwned];
}

/* The rank shown next to the name: the one the player picked (if they really hold it), else their best. */
export function primaryRank(profile, uid = "", now = Date.now()) {
  const all = resolveRanks(profile, uid, now);
  const wanted = profile && profile.equipped && profile.equipped.mainRank;
  const chosen = wanted && all.find(rank => rank.id === wanted);
  return chosen || all[0] || rankById("member") || { id: "member", name: "Member", color: "#a0ada8", icon: "fa-user" };
}

/* ---------- Usernames ---------- */
export const validUsername = name => /^[a-zA-Z0-9_]{3,20}$/.test(String(name || ""));

/* ---------- Scheduled announcements ----------
   A schedule entry looks like:
   {
     message: "Admin Abuse Friday is LIVE!",
     kind: "once" | "daily" | "weekly",
     startAt: 1731700000000,        // once only (ms)
     days: [5],                     // weekly only (0 = Sunday … 6 = Saturday)
     time: "15:30",                 // daily / weekly, 24h clock in `tz`
     tz: "America/Chicago",
     durationSec: 300,
     enabled: true
   }
   Every visitor's browser evaluates the list, so nothing has to be online
   to "send" it — the schedule itself is the sender.                       */

const WEEKDAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function zonedParts(timestamp, timeZone) {
  let formatter;
  try {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone || undefined,
      hourCycle: "h23",
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  } catch (_) {
    formatter = new Intl.DateTimeFormat("en-US", {
      hourCycle: "h23",
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }
  const parts = {};
  formatter.formatToParts(new Date(timestamp)).forEach(part => { parts[part.type] = part.value; });
  const hour = Number(parts.hour) % 24;
  return {
    weekday: WEEKDAYS[parts.weekday] ?? 0,
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    secondsOfDay: hour * 3600 + Number(parts.minute) * 60 + Number(parts.second)
  };
}

function parseTime(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || ""));
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 3600 + minutes * 60;
}

/* Returns { id, message, endsAt, windowKey } for the first active entry, or null. */
export function activeScheduledAnnouncement(entries, now = Date.now()) {
  const list = Object.entries(entries || {});

  for (const [id, entry] of list) {
    if (!entry || entry.enabled === false) continue;
    if (typeof entry.message !== "string" || !entry.message.trim()) continue;

    const duration = Math.min(3600, Math.max(5, Number(entry.durationSec) || 60));

    if (entry.kind === "once") {
      const start = Number(entry.startAt);
      if (!Number.isFinite(start)) continue;
      const end = start + duration * 1000;
      if (now >= start && now < end) {
        return { id, message: entry.message, endsAt: end, windowKey: `${id}:${start}` };
      }
      continue;
    }

    if (entry.kind !== "daily" && entry.kind !== "weekly") continue;

    const startSeconds = parseTime(entry.time);
    if (startSeconds === null) continue;

    const days = toDayList(entry.days);
    const zone = entry.tz || undefined;
    const local = zonedParts(now, zone);

    /* Check today's window and a window that began yesterday and crosses midnight. */
    const candidates = [
      { dayOffset: 0, elapsed: local.secondsOfDay - startSeconds, weekday: local.weekday },
      { dayOffset: -1, elapsed: local.secondsOfDay + 86400 - startSeconds, weekday: (local.weekday + 6) % 7 }
    ];

    for (const candidate of candidates) {
      if (candidate.elapsed < 0 || candidate.elapsed >= duration) continue;
      if (entry.kind === "weekly" && !days.includes(candidate.weekday)) continue;

      const remaining = duration - candidate.elapsed;
      return {
        id,
        message: entry.message,
        endsAt: now + remaining * 1000,
        windowKey: `${id}:${local.dateKey}:${candidate.dayOffset}`
      };
    }
  }
  return null;
}

/* Human description for the owner's schedule list. */
export function describeSchedule(entry) {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const mins = Math.round((Number(entry.durationSec) || 60) / 60 * 10) / 10;
  const length = (Number(entry.durationSec) || 60) < 120
    ? `${Number(entry.durationSec) || 60}s`
    : `${mins} min`;

  if (entry.kind === "once") {
    return `Once · ${new Date(Number(entry.startAt)).toLocaleString()} · ${length}`;
  }
  if (entry.kind === "daily") return `Every day at ${entry.time} (${entry.tz || "local"}) · ${length}`;
  const days = toDayList(entry.days).sort().map(day => names[day]).join(", ");
  return `Every ${days || "—"} at ${entry.time} (${entry.tz || "local"}) · ${length}`;
}

/* Safe text -> HTML-free string (for places that must build markup). */
export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}
