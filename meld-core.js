/* =====================================================================
   MELD CORE  —  one shared Firebase connection for every module.
   (Same project/config you already use everywhere else.)
   ===================================================================== */
import { initializeApp, getApps, getApp } from
  "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, updateProfile } from
  "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {
  getDatabase, ref, get, set, update, push, remove, onValue, onDisconnect,
  runTransaction, serverTimestamp, increment, query, orderByChild, limitToLast
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCkJJcpdLfWH8XZBuT8tgOkOKuj6ZtEzcY",
  authDomain: "safebucketbypass.firebaseapp.com",
  databaseURL: "https://safebucketbypass-default-rtdb.firebaseio.com",
  projectId: "safebucketbypass",
  storageBucket: "safebucketbypass.firebasestorage.app",
  messagingSenderId: "659506734507",
  appId: "1:659506734507:web:1e4268f7746380b41bdeee"
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

export {
  onAuthStateChanged, signOut, updateProfile,
  ref, get, set, update, push, remove, onValue, onDisconnect,
  runTransaction, serverTimestamp, increment, query, orderByChild, limitToLast
};

export const CFG = () => window.MELD_CONFIG || {};
export const OWNER_UID = () => CFG().OWNER_UID || "";
export const isOwner = user => Boolean(user && user.uid === OWNER_UID());

/* Resolve once when the first auth state is known. */
export const authReady = new Promise(resolve => {
  const stop = onAuthStateChanged(auth, user => { stop(); resolve(user); });
});

export * from "./meld-shared.js";
