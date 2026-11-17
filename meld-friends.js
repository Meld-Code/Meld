/* =====================================================================
   MELD FRIENDS  —  search, request, accept, decline.
   Uses the same Firebase paths as Meld Chat (friends / friendRequests /
   chatSentRequests), so everything stays in sync with the chat panel.
   ===================================================================== */
import {
  db, ref, get, set, remove, onValue, query, orderByChild, startAt, endAt, limitToFirst, serverTimestamp
} from "./meld-core.js";

/* Type 2+ letters -> up to 8 matching players (by username prefix). */
export async function searchPlayers(text, myUid) {
  const lower = String(text || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (lower.length < 2) return [];
  const snap = await get(query(ref(db, "users"), orderByChild("usernameLower"), startAt(lower), endAt(lower + "\uf8ff"), limitToFirst(8)));
  const rows = [];
  snap.forEach(child => {
    if (child.key === myUid) return;
    const value = child.val() || {};
    if (value.username) rows.push({ uid: child.key, ...value });
  });
  return rows;
}

export const watchFriends = (uid, cb) => onValue(ref(db, `friends/${uid}`), s => cb(s.val() || {}), () => cb({}));
export const watchIncoming = (uid, cb) => onValue(ref(db, `friendRequests/${uid}`), s => cb(s.val() || {}), () => cb({}));
export const watchSent = (uid, cb) => onValue(ref(db, `chatSentRequests/${uid}`), s => cb(s.val() || {}), () => cb({}));

export async function sendRequest(me, myName, targetUid, targetName, state) {
  if (targetUid === me) throw new Error("You can't add yourself.");
  if (state.friends[targetUid]) throw new Error("You're already friends.");
  if (state.sent[targetUid]) throw new Error("Request already sent.");
  if (state.incoming[targetUid]) throw new Error("They already asked you — accept it below!");
  await set(ref(db, `friendRequests/${targetUid}/${me}`), { senderId: me, senderUsername: myName, createdAt: serverTimestamp() });
  await set(ref(db, `chatSentRequests/${me}/${targetUid}`), { recipientId: targetUid, recipientUsername: targetName, createdAt: serverTimestamp() });
}

export async function acceptRequest(me, otherUid) {
  await set(ref(db, `friends/${me}/${otherUid}`), true);
  await set(ref(db, `friends/${otherUid}/${me}`), true);
  await remove(ref(db, `chatSentRequests/${otherUid}/${me}`));
  await remove(ref(db, `friendRequests/${me}/${otherUid}`));
}

export async function declineRequest(me, otherUid) {
  await remove(ref(db, `chatSentRequests/${otherUid}/${me}`));
  await remove(ref(db, `friendRequests/${me}/${otherUid}`));
}

export async function cancelRequest(me, otherUid) {
  await remove(ref(db, `chatSentRequests/${me}/${otherUid}`));
  await remove(ref(db, `friendRequests/${otherUid}/${me}`));
}
