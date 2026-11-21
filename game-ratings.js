/* =====================================================================
   GAME RATINGS (Games page <-> Firebase)
   • One 👍 or 👎 per account per game. It is saved and can't be changed.
   • Everyone's votes are added together, so the score updates live for everybody.
   • Needs the "gameRatings" block in database.rules.json (already in this update).

   window.MeldRatings
     stats(gameName) -> { likes, dislikes, total, percent, myVote, label, tone, score }
     vote(gameName, 1|-1) -> Promise (rejects with a friendly Error)
     signedIn() -> boolean
   Event: "meld:ratings" fires whenever any rating changes.
   ===================================================================== */
import { auth, db, ref, get, update, onValue, onAuthStateChanged } from "./meld-core.js";

const slug = name => String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60);

let uid = null;
let all = {};
let loaded = false;

const emit = () => window.dispatchEvent(new CustomEvent("meld:ratings", { detail: { loaded } }));

/* Steam-style wording, but only once there are enough votes to mean something */
function describe(likes, dislikes) {
  const total = likes + dislikes;
  const percent = total ? Math.round((likes / total) * 100) : 0;
  let label = "No ratings yet", tone = "none";
  if (total >= 1 && total < 3) { label = "Be one of the first to rate"; tone = "new"; }
  else if (total >= 3) {
    if (percent >= 95 && total >= 10) { label = "Overwhelmingly Positive"; tone = "great"; }
    else if (percent >= 80) { label = "Very Positive"; tone = "great"; }
    else if (percent >= 70) { label = "Mostly Positive"; tone = "good"; }
    else if (percent >= 40) { label = "Mixed"; tone = "mixed"; }
    else if (percent >= 20) { label = "Mostly Negative"; tone = "bad"; }
    else { label = "Overwhelmingly Negative"; tone = "bad"; }
  }
  return { total, percent, label, tone };
}

/* Wilson lower bound: ranks 50 votes at 90% above 2 votes at 100% */
function wilson(likes, total) {
  if (!total) return 0;
  const z = 1.96, p = likes / total;
  return (p + (z * z) / (2 * total) - z * Math.sqrt((p * (1 - p) + (z * z) / (4 * total)) / total)) / (1 + (z * z) / total);
}

function stats(name) {
  const row = all[slug(name)] || {};
  const likes = Math.max(0, Number(row.likes) || 0);
  const dislikes = Math.max(0, Number(row.dislikes) || 0);
  const mine = uid && row.voters ? Number(row.voters[uid]) || 0 : 0;
  return { likes, dislikes, myVote: mine, score: wilson(likes, likes + dislikes), ...describe(likes, dislikes) };
}

async function vote(name, value) {
  if (!uid) throw new Error("Sign in to rate games.");
  if (value !== 1 && value !== -1) throw new Error("Invalid vote.");
  const id = slug(name);
  if (!id) throw new Error("Unknown game.");

  for (let attempt = 0; attempt < 4; attempt++) {
    /* fresh numbers every try: the server only accepts "exactly one more than right now" */
    const row = (await get(ref(db, `gameRatings/${id}`))).val() || {};
    if (row.voters && row.voters[uid]) throw new Error("You already rated this game.");
    const field = value === 1 ? "likes" : "dislikes";
    try {
      await update(ref(db), {
        [`gameRatings/${id}/voters/${uid}`]: value,
        [`gameRatings/${id}/${field}`]: (Number(row[field]) || 0) + 1
      });
      return;
    } catch (error) {
      const denied = /permission/i.test(String(error && error.message));
      if (!denied) throw new Error("Couldn't save your vote. Try again.");
      if (attempt === 3) throw new Error("Couldn't save your vote (rules not published yet, or too many votes at once).");
    }
  }
}

onValue(ref(db, "gameRatings"), snap => {
  all = snap.val() || {};
  loaded = true;
  emit();
}, error => { console.warn("[Meld] ratings unavailable:", error); loaded = true; emit(); });

onAuthStateChanged(auth, user => { uid = user ? user.uid : null; emit(); });

window.MeldRatings = { stats, vote, signedIn: () => Boolean(uid), ready: () => loaded };
emit();
