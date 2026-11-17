/* =====================================================================
   FAVORITES SYNC (Games page <-> your Meld account)
   The Games page keeps hearts in this browser only. This links them to
   users/<uid>/favoriteGames so they show on your profile and follow you
   to other devices. Signed-out players keep working exactly as before.
   ===================================================================== */
import { auth, db, ref, get, set, onAuthStateChanged } from "./meld-core.js";

let uid = null;
let applying = false;

async function pull() {
  if (!uid) return;
  try {
    const remote = (await get(ref(db, `users/${uid}/favoriteGames`))).val();
    const remoteList = Array.isArray(remote) ? remote.filter(n => typeof n === "string") : [];
    const local = (window.__meldGetFavorites?.() || []);
    const flag = `meldFavSynced:${uid}`;
    const syncedBefore = localStorage.getItem(flag) === "1";

    /* First time on this device: merge so no heart is lost. Afterwards the account is the source of truth
       (so removing a favorite on your profile sticks). */
    const merged = syncedBefore ? remoteList : [...new Set([...remoteList, ...local])];

    applying = true;
    window.__meldSetFavorites?.(merged);
    applying = false;

    if (merged.length !== remoteList.length) await set(ref(db, `users/${uid}/favoriteGames`), merged);
    localStorage.setItem(flag, "1");
  } catch (error) {
    applying = false;
    console.warn("[Meld] Couldn't sync favorites:", error);
  }
}

window.addEventListener("meld:favorites", async event => {
  if (!uid || applying) return;
  try { await set(ref(db, `users/${uid}/favoriteGames`), event.detail || []); }
  catch (error) { console.warn("[Meld] Couldn't save favorites:", error); }
});

onAuthStateChanged(auth, user => { uid = user ? user.uid : null; pull(); });
