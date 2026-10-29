import { initializeApp, getApps, getApp } from
  "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import { getAuth, onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
  getDatabase, ref, get, onValue, set, remove
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

/* MELD ANNOUNCEMENTS
   Replace this with your actual owner Firebase Authentication UID.
*/
const OWNER_UID = "OH6Jo3MnREgxfEGyVRxivcsuF582";

const firebaseConfig = {
  apiKey: "AIzaSyCkJJcpdLfWH8XZBuT8tgOkOKuj6ZtEzcY",
  authDomain: "safebucketbypass.firebaseapp.com",
  databaseURL: "https://safebucketbypass-default-rtdb.firebaseio.com",
  projectId: "safebucketbypass",
  storageBucket: "safebucketbypass.firebasestorage.app",
  messagingSenderId: "659506734507",
  appId: "1:659506734507:web:1e4268f7746380b41bdeee"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const currentRef = ref(db, "announcements/current");
let currentUser = null;
let canPost = false;
let isOwner = false;
let announcementSignature = "";
let hideTimer;
let removeTimer;
let permissionListener = null;

const style = document.createElement("style");
style.textContent = `
#meldAnnouncementPopup {
  position:fixed; top:18px; left:50%;
  transform:translate(-50%,-15px);
  width:calc(100% - 28px); max-width:480px;
  padding:18px; border:1px solid #ff6a00;
  border-radius:12px; background:#171717;
  color:#fff; box-shadow:0 8px 30px #0009;
  font:15px/1.5 Arial,sans-serif;
  text-align:center; overflow-wrap:anywhere;
  z-index:2147483647; opacity:0; display:none;
  transition:opacity .5s,transform .5s;
  pointer-events:none;
}
#meldAnnouncementPopup .meldAnnTitle {
  color:#ff6a00; font-size:12px; font-weight:bold;
  letter-spacing:1.5px; margin-bottom:8px;
}
#meldAnnouncementButton {
  position:fixed; right:20px; bottom:85px;
  z-index:10000; background:#ff6a00; color:#111;
  border:0; border-radius:10px; padding:12px 15px;
  font-weight:bold; cursor:pointer;
}
#meldAnnouncementPanel {
  position:fixed; right:16px; bottom:145px;
  width:min(360px,calc(100vw - 32px));
  max-height:75vh; overflow:auto; z-index:10001;
  padding:18px; border:1px solid #ff6a00;
  border-radius:14px; background:#171717;
  color:#fff; box-shadow:0 10px 35px #000a;
  font:14px/1.5 Arial,sans-serif;
}
#meldAnnouncementPanel[hidden] {display:none}
#meldAnnouncementPanel h2 {color:#ff6a00;font-size:19px}
#meldAnnouncementPanel input,
#meldAnnouncementPanel textarea {
  display:block; width:100%; box-sizing:border-box;
  margin:8px 0 12px; padding:11px;
  background:#101010; color:#fff;
  border:1px solid #444; border-radius:8px;
  font:inherit;
}
#meldAnnouncementPanel textarea {min-height:95px;resize:vertical}
#meldAnnouncementPanel button {
  padding:10px 12px; border:0; border-radius:7px;
  background:#ff6a00; color:#111;
  font-weight:bold; cursor:pointer; margin:3px 3px 3px 0;
}
#meldAnnouncementPanel .meldSecondary {
  background:#303030;color:#fff
}
#meldAnnouncementPanel .meldStatus {
  overflow-wrap:anywhere;color:#bbb;margin-top:8px
}
#meldAnnouncementPanel .meldDivider {
  border:0;border-top:1px solid #333;margin:16px 0
}
`;
document.head.appendChild(style);

/* FLOATING ANNOUNCEMENT */
const popup = document.createElement("div");
popup.id = "meldAnnouncementPopup";

const popupTitle = document.createElement("div");
popupTitle.className = "meldAnnTitle";
popupTitle.textContent = "MELD ANNOUNCEMENT";

const popupMessage = document.createElement("div");
popup.append(popupTitle, popupMessage);
document.body.appendChild(popup);

function displayAnnouncement(data) {
  if (!data || typeof data.message !== "string" ||
      typeof data.sentAt !== "number" ||
      typeof data.expiresAt !== "number") return;

  const signature = `${data.sentAt}:${data.message}`;
  if (signature === announcementSignature) return;
  announcementSignature = signature;

  clearTimeout(hideTimer);
  clearTimeout(removeTimer);

  const remaining = data.expiresAt - Date.now();

  if (remaining <= 0 || remaining > 120000) {
    popup.style.display = "none";
    return;
  }

  popupMessage.textContent = data.message;
  popup.style.display = "block";

  requestAnimationFrame(() => {
    popup.style.opacity = "1";
    popup.style.transform = "translate(-50%,0)";
  });

  hideTimer = setTimeout(() => {
    popup.style.opacity = "0";
    popup.style.transform = "translate(-50%,-15px)";

    removeTimer = setTimeout(() => {
      popup.style.display = "none";
    }, 500);
  }, remaining);
}

/* PANEL */
const button = document.createElement("button");
button.id = "meldAnnouncementButton";
button.textContent = "Live Announcements";
button.hidden = true;

const panel = document.createElement("section");
panel.id = "meldAnnouncementPanel";
panel.hidden = true;
panel.setAttribute("aria-label", "Announcement controls");

panel.innerHTML = `
  <h2>Admin Abuse Friday</h2>
  <p>Publish a live announcement to Meld.</p>

  <label for="meldAnnMessage">Announcement</label>
  <textarea id="meldAnnMessage" maxlength="300"
    placeholder="Type your announcement..."></textarea>

  <button id="meldAnnSend">Send Live</button>
  <button id="meldAnnEnd" class="meldSecondary">End Announcement</button>

  <div class="meldStatus" id="meldAnnSendStatus" aria-live="polite"></div>

  <div id="meldAnnOwnerControls" hidden>
    <hr class="meldDivider">
    <h2>Publisher Permissions</h2>
    <p>Enter a user's Firebase Authentication UID.</p>
    <input id="meldAnnTargetUid" placeholder="Firebase UID"
      autocomplete="off">
    <button id="meldAnnGrant">Grant Access</button>
    <button id="meldAnnRevoke" class="meldSecondary">Revoke Access</button>
    <div class="meldStatus" id="meldAnnPermissionStatus"
      aria-live="polite"></div>
  </div>

  <hr class="meldDivider">
  <button id="meldAnnClose" class="meldSecondary">Close Panel</button>
`;

document.body.append(button, panel);

button.addEventListener("click", () => {
  panel.hidden = !panel.hidden;
});

panel.querySelector("#meldAnnClose").addEventListener("click", () => {
  panel.hidden = true;
});

function setStatus(id, message) {
  panel.querySelector("#" + id).textContent = message;
}

function updatePanel() {
  button.hidden = !(currentUser && canPost);
  panel.querySelector("#meldAnnOwnerControls").hidden = !isOwner;
}

panel.querySelector("#meldAnnSend").addEventListener("click", async () => {
  if (!currentUser || !canPost) {
    return setStatus("meldAnnSendStatus", "You don't have permission.");
  }

  const message = panel.querySelector("#meldAnnMessage").value.trim();

  if (!message || message.length > 300) {
    return setStatus("meldAnnSendStatus", "Enter a message up to 300 characters.");
  }

  try {
    const sentAt = Date.now();

    await set(currentRef, {
      message,
      sentAt,
      expiresAt: sentAt + 120000
    });

    panel.querySelector("#meldAnnMessage").value = "";
    setStatus("meldAnnSendStatus", "Announcement published!");
  } catch (error) {
    setStatus("meldAnnSendStatus", "Failed: " + error.message);
  }
});

panel.querySelector("#meldAnnEnd").addEventListener("click", async () => {
  if (!currentUser || !canPost) {
    return setStatus("meldAnnSendStatus", "You don't have permission.");
  }

  try {
    // End by setting an already-expired announcement.
    await set(currentRef, {
      message: "",
      sentAt: Date.now() - 120001,
      expiresAt: Date.now() - 1
    });

    setStatus("meldAnnSendStatus", "Announcement ended.");
  } catch (error) {
    setStatus("meldAnnSendStatus", "Failed: " + error.message);
  }
});

async function changePermission(grant) {
  const uid = panel.querySelector("#meldAnnTargetUid").value.trim();

  if (!currentUser || !isOwner) {
    return setStatus("meldAnnPermissionStatus", "Owner access required.");
  }

  if (!uid || uid === OWNER_UID || uid.includes("/") || uid.length > 128) {
    return setStatus("meldAnnPermissionStatus", "Enter a valid user's UID.");
  }

  try {
    const permissionRef = ref(db, `announcementPermissions/${uid}`);

    if (grant) {
      await set(permissionRef, { canPost: true });
      setStatus("meldAnnPermissionStatus", "Access granted.");
    } else {
      await remove(permissionRef);
      setStatus("meldAnnPermissionStatus", "Access revoked.");
    }
  } catch (error) {
    setStatus("meldAnnPermissionStatus", "Failed: " + error.message);
  }
}

panel.querySelector("#meldAnnGrant").addEventListener("click", () => {
  changePermission(true);
});

panel.querySelector("#meldAnnRevoke").addEventListener("click", () => {
  changePermission(false);
});

/* AUTHENTICATION AND PERMISSIONS */
onAuthStateChanged(auth, user => {
  if (permissionListener) {
    permissionListener();
    permissionListener = null;
  }

  currentUser = user;
  isOwner = !!user && user.uid === OWNER_UID;
  canPost = isOwner;
  updatePanel();

  if (!user) {
    setStatus("meldAnnSendStatus", "Sign in to receive announcements.");
    return;
  }

  const permissionRef = ref(
    db, `announcementPermissions/${user.uid}/canPost`
  );

  permissionListener = onValue(permissionRef, snapshot => {
    canPost = isOwner || snapshot.val() === true;
    updatePanel();
  }, error => {
    console.error("Permission check failed:", error);
    canPost = isOwner;
    updatePanel();
  });
});

/* REAL-TIME ANNOUNCEMENTS */
onValue(currentRef, snapshot => {
  displayAnnouncement(snapshot.val());
}, error => {
  console.error("Announcement listener failed:", error);
});
