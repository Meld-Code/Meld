/* =====================================================================
   MELD TRACKER
   This is the file index.html / profile.html were already trying to load
   (it was missing from the project, which is why Total Playtime never
   moved). It:
     • counts ACTIVE time (tab visible + focused + you're interacting, or a
       game/site is open in the Meld browser) and saves it to your profile
     • awards XP for playing and for launching games
     • counts games launched (feeds the Games leaderboard)
   Only the TOP window counts time, so a page loaded inside Meld's browser
   (like the games page) never double-counts.
   ===================================================================== */
import {
  auth, db, ref, get, update, increment, serverTimestamp, onAuthStateChanged, CFG
} from "./meld-core.js";

/* "Top" = the window that counts time. A page loaded inside Meld's OWN browser (same-origin
   parent with the #browser shell) defers to it. If Meld is embedded anywhere else — an
   about:blank cloak, a bookmarklet iframe, another site — it still counts itself. */
function detectTop() {
  if (window.top === window.self) return true;
  try {
    return !window.parent.document.getElementById("browser");   // throws if cross-origin => count here
  } catch (_) {
    return true;
  }
}
const IS_TOP = detectTop();
const FLUSH_EVERY_MS = 60_000;
const IDLE_AFTER_MS = 3 * 60_000;
const LAUNCH_COOLDOWN_MS = 30_000;
const pendingKey = id => `meldPending:${id || "guest"}`;

let uid = null;
let lastInput = Date.now();
let pendingSeconds = 0;
let pendingXp = 0;          // fractional XP carried between ticks
let pendingLaunches = 0;
let pendingLaunchXp = 0;
let lastLaunch = new Map();
let flushing = false;
let authSeen = false;
let warned = false;
let profileOk = false;
let lastError = "";       // never create a half-empty profile for someone who hasn't finished signing up

/* ---------- persistence for unsent progress (survives refresh/crash) ---------- */
function loadPending(userId) {
  try {
    const saved = JSON.parse(localStorage.getItem(pendingKey(userId)) || "null");
    if (saved) {
      pendingSeconds += Number(saved.seconds) || 0;
      pendingXp += Number(saved.xp) || 0;
      pendingLaunches += Number(saved.launches) || 0;
      pendingLaunchXp += Number(saved.launchXp) || 0;
    }
  } catch (_) { /* ignore */ }
}

function savePending() {
  try {
    localStorage.setItem(pendingKey(uid), JSON.stringify({
      seconds: pendingSeconds, xp: pendingXp, launches: pendingLaunches, launchXp: pendingLaunchXp
    }));
  } catch (_) { /* ignore */ }
}

/* ---------- activity detection ---------- */
["pointermove", "pointerdown", "keydown", "wheel", "touchstart"].forEach(name => {
  window.addEventListener(name, () => { lastInput = Date.now(); }, { passive: true, capture: true });
});

function browserIsOpen() {
  return Boolean(document.querySelector("#browser.open"));
}

function isActive() {
  if (document.visibilityState !== "visible") return false;
  const framed = window.top !== window.self;
  if (!framed && typeof document.hasFocus === "function" && !document.hasFocus()) return false;
  if (browserIsOpen()) return true;            // playing inside an iframe: no events reach us
  return Date.now() - lastInput < IDLE_AFTER_MS;
}

/* ---------- ticking ---------- */
function tick() {
  if (!IS_TOP || !isActive()) return;
  pendingSeconds += 1;
  pendingXp += (CFG().XP_PER_ACTIVE_MINUTE ?? 2) / 60;
  window.dispatchEvent(new CustomEvent("meld:playtime", { detail: { pendingSeconds } }));
}

/* ---------- saving ---------- */
async function flush() {
  if (!uid) { savePending(); return; }          // signed out: keep it for when they sign in
  if (flushing) return;

  const seconds = Math.floor(pendingSeconds);
  const xpWhole = Math.floor(pendingXp) + Math.floor(pendingLaunchXp);
  const launches = Math.floor(pendingLaunches);
  if (seconds < 1 && xpWhole < 1 && launches < 1) return;

  flushing = true;
  if (!profileOk) {
    try {
      profileOk = (await get(ref(db, `users/${uid}/username`))).exists();
    } catch (_) { profileOk = false; }
    if (!profileOk) { flushing = false; return; }
  }
  const sent = { seconds, xp: Math.floor(pendingXp), launchXp: Math.floor(pendingLaunchXp), launches };

  try {
    const patch = { lastSeen: serverTimestamp() };
    if (seconds > 0) patch.totalTimeSeconds = increment(seconds);
    if (xpWhole > 0) patch.xp = increment(xpWhole);
    if (launches > 0) patch.gamesLaunched = increment(launches);

    await update(ref(db, `users/${uid}`), patch);

    pendingSeconds -= sent.seconds;
    pendingXp -= sent.xp;
    pendingLaunchXp -= sent.launchXp;
    pendingLaunches -= sent.launches;
    savePending();
    window.dispatchEvent(new CustomEvent("meld:playtime", { detail: { pendingSeconds, saved: true } }));
  } catch (error) {
    lastError = String(error && error.message || error);
    if (!warned) {
      warned = true;
      console.warn(
        "[Meld Tracker] Could not save playtime. Your Firebase rules must let a user " +
        "update their own users/<uid> fields totalTimeSeconds, xp, gamesLaunched, lastSeen " +
        "(see UPGRADE-NOTES.md).", error
      );
    }
    savePending();                                 // keep it; try again next minute
  } finally {
    flushing = false;
  }
}

/* ---------- game launches ---------- */
function recordLaunch(name) {
  const key = String(name || "unknown");
  const now = Date.now();
  if (now - (lastLaunch.get(key) || 0) < LAUNCH_COOLDOWN_MS) return;
  lastLaunch.set(key, now);

  pendingLaunches += 1;
  pendingLaunchXp += CFG().XP_PER_GAME_LAUNCH ?? 5;
  savePending();
}

/* Pages inside Meld's browser (e.g. the games page) forward launches to the top window. */
window.addEventListener("meld:launch", event => {
  const name = event.detail?.name;
  if (IS_TOP) {
    recordLaunch(name);
  } else {
    try { window.top.postMessage({ type: "meld-launch", name }, window.location.origin); } catch (_) { /* cross-origin */ }
  }
});

window.addEventListener("message", event => {
  if (!IS_TOP) return;
  if (event.origin !== window.location.origin) return;
  if (event.data?.type === "meld-launch") recordLaunch(event.data.name);
});

/* ---------- lifecycle ---------- */
onAuthStateChanged(auth, user => {
  const next = user ? user.uid : null;
  if (next === uid && authSeen) return;
  authSeen = true;

  if (uid && uid !== next) {                       // leaving an account: park its unsent progress
    savePending();
    pendingSeconds = pendingXp = pendingLaunches = pendingLaunchXp = 0;
  }
  if (!uid && next) {                              // guest -> signed in: guest progress is kept and credited
    try { localStorage.removeItem(pendingKey(null)); } catch (_) { /* ignore */ }
  }

  uid = next;
  profileOk = false;
  if (IS_TOP) {
    if (uid) { loadPending(uid); flush(); }
    else if (pendingSeconds + pendingLaunches === 0) { loadPending(null); }
  }
});

if (IS_TOP) {
  setInterval(tick, 1000);
  setInterval(flush, FLUSH_EVERY_MS);

  document.addEventListener("visibilitychange", () => {
    savePending();
    if (document.visibilityState === "hidden") flush();
  });
  window.addEventListener("pagehide", () => { savePending(); flush(); });
}

/* Handy for the profile page: live unsaved seconds. */
window.MeldTracker = {
  /* Run  MeldTracker.status()  in the browser console to see why time isn't counting. */
  status: () => ({
    signedIn: Boolean(uid), uid, countsTimeHere: IS_TOP, framed: window.top !== window.self,
    active: isActive(), visible: document.visibilityState, focused: document.hasFocus(),
    pendingSeconds: Math.floor(pendingSeconds), profileFound: profileOk, lastSaveError: lastError
  }),
  pendingSeconds: () => Math.floor(pendingSeconds),
  flush
};
