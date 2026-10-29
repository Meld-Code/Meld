import { initializeApp, getApps, getApp } from
  "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import { getAuth, onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
  getDatabase,
  ref,
  onValue,
  set,
  remove
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

/* ============================================================
   MELD ANNOUNCEMENTS
   ============================================================ */

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

/* ============================================================
   STYLE
   Designed to match the Safe Bucket green game hub theme
   ============================================================ */

const style = document.createElement("style");

style.textContent = `
  #meldAnnouncementPopup,
  #meldAnnouncementButton,
  #meldAnnouncementPanel {
    font-family:
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  /* ============================================================
     LIVE ANNOUNCEMENT POPUP
     ============================================================ */

  #meldAnnouncementPopup {
    position: fixed;
    top: 22px;
    left: 50%;
    z-index: 2147483647;

    width: min(480px, calc(100vw - 30px));
    padding: 19px 20px;

    overflow-wrap: anywhere;
    text-align: center;

    border: 1px solid #52604c;
    border-radius: 15px;

    background:
      radial-gradient(
        ellipse at 50% 0%,
        #76b90018,
        transparent 62%
      ),
      linear-gradient(145deg, #202620, #111611);

    color: var(--text, #f2f5f0);

    box-shadow:
      0 25px 75px #000c,
      0 0 0 3px #76b9000b,
      inset 0 1px 0 #ffffff12;

    font-size: 13px;
    line-height: 1.6;

    opacity: 0;
    display: none;
    pointer-events: none;

    transform: translate(-50%, -15px);

    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);

    transition:
      opacity .45s ease,
      transform .45s ease;
  }

  #meldAnnouncementPopup::before {
    content: "";
    position: absolute;
    inset: 7px;

    border: 1px solid #a3e63512;
    border-radius: 10px;

    pointer-events: none;
  }

  #meldAnnouncementPopup .meldAnnTitle {
    position: relative;
    z-index: 1;

    margin-bottom: 8px;

    color: var(--accent-light, #a3e635);

    font-size: 10px;
    font-weight: 850;
    letter-spacing: 1.8px;
    text-transform: uppercase;
  }

  #meldAnnouncementPopup #meldAnnouncementMessage {
    position: relative;
    z-index: 1;
  }

  /* ============================================================
     ANNOUNCEMENT BUTTON
     ============================================================ */

  #meldAnnouncementButton {
    position: fixed;
    right: 18px;
    bottom: 124px;
    z-index: 9999;

    min-height: 42px;
    padding: 0 15px;

    border: 1px solid #45533d;
    border-radius: 11px;

    background: rgba(25, 31, 24, .94);
    color: var(--text, #f2f5f0);

    font-size: 11px;
    font-weight: 800;
    letter-spacing: .2px;

    cursor: pointer;

    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);

    box-shadow:
      0 10px 30px #0008,
      inset 0 1px 0 #ffffff0b;

    transition:
      transform .2s ease,
      color .2s ease,
      background .2s ease,
      border-color .2s ease,
      box-shadow .2s ease;
  }

  #meldAnnouncementButton:hover {
    transform: translateY(-2px);

    border-color: var(--accent, #76b900);
    background: #28351b;
    color: var(--accent-light, #a3e635);

    box-shadow:
      0 12px 30px #0009,
      0 0 0 3px #76b90020;
  }

  #meldAnnouncementButton:active {
    transform: scale(.97);
  }

  #meldAnnouncementButton:focus-visible,
  #meldAnnouncementPanel button:focus-visible,
  #meldAnnouncementPanel input:focus-visible,
  #meldAnnouncementPanel textarea:focus-visible {
    outline: 2px solid var(--accent-light, #a3e635);
    outline-offset: 3px;
  }

  /* ============================================================
     ANNOUNCEMENT PANEL
     ============================================================ */

  #meldAnnouncementPanel {
    position: fixed;
    right: 18px;
    bottom: 178px;
    z-index: 10000;

    width: min(365px, calc(100vw - 30px));
    max-height: calc(100vh - 210px);

    overflow-y: auto;
    padding: 22px;

    border: 1px solid #52604c;
    border-radius: 16px;

    background:
      radial-gradient(
        ellipse at 50% 0%,
        #76b90014,
        transparent 62%
      ),
      linear-gradient(145deg, #202620, #111611);

    color: var(--text, #f2f5f0);

    box-shadow:
      0 30px 90px #000d,
      inset 0 1px 0 #ffffff12;

    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);

    animation: meldAnnouncementPanelIn .22s ease;
  }

  #meldAnnouncementPanel[hidden] {
    display: none !important;
  }

  @keyframes meldAnnouncementPanelIn {
    from {
      opacity: 0;
      transform: translateY(10px) scale(.97);
    }

    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  #meldAnnouncementPanel::before {
    content: "";
    position: absolute;
    inset: 8px;

    border: 1px solid #a3e6350d;
    border-radius: 10px;

    pointer-events: none;
  }

  #meldAnnouncementPanel > * {
    position: relative;
    z-index: 1;
  }

  #meldAnnouncementPanel h2 {
    margin: 0 0 8px;

    color: var(--text, #f2f5f0);

    font-size: 20px;
    font-weight: 800;
    letter-spacing: -.5px;
  }

  #meldAnnouncementPanel p {
    margin: 0 0 18px;

    color: var(--muted, #9ca69b);

    font-size: 11px;
    line-height: 1.7;
  }

  #meldAnnouncementPanel label {
    display: block;
    margin-bottom: 7px;

    color: var(--accent-light, #a3e635);

    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.2px;
    text-transform: uppercase;
  }

  #meldAnnouncementPanel input,
  #meldAnnouncementPanel textarea {
    display: block;
    width: 100%;
    box-sizing: border-box;

    margin: 0 0 12px;
    padding: 11px 12px;

    border: 1px solid var(--line, #303730);
    border-radius: 9px;
    outline: none;

    background: #111611;
    color: var(--text, #f2f5f0);

    font: inherit;
    font-size: 12px;

    transition:
      border-color .2s ease,
      background .2s ease,
      box-shadow .2s ease;
  }

  #meldAnnouncementPanel input::placeholder,
  #meldAnnouncementPanel textarea::placeholder {
    color: #71806e;
  }

  #meldAnnouncementPanel input:focus,
  #meldAnnouncementPanel textarea:focus {
    border-color: var(--accent, #76b900);
    background: #151d15;
    box-shadow: 0 0 0 3px #76b90020;
  }

  #meldAnnouncementPanel textarea {
    min-height: 105px;
    resize: vertical;
    line-height: 1.5;
  }

  #meldAnnouncementPanel button {
    min-height: 39px;
    padding: 9px 13px;

    border: 1px solid var(--line, #303730);
    border-radius: 9px;

    background: var(--panel2, #222622);
    color: var(--text, #f2f5f0);

    font: inherit;
    font-size: 11px;
    font-weight: 800;

    cursor: pointer;

    transition:
      transform .2s ease,
      background .2s ease,
      border-color .2s ease,
      color .2s ease,
      box-shadow .2s ease;
  }

  #meldAnnouncementPanel button:hover {
    transform: translateY(-1px);

    border-color: #668d2d;
    background: #28351b;
    color: var(--accent-light, #a3e635);
  }

  #meldAnnouncementPanel button:active {
    transform: scale(.97);
  }

  #meldAnnouncementPanel #meldAnnSend {
    border-color: var(--accent, #76b900);
    background: var(--accent, #76b900);
    color: #10150a;
  }

  #meldAnnouncementPanel #meldAnnSend:hover {
    border-color: var(--accent-light, #a3e635);
    background: var(--accent-light, #a3e635);
    color: #10150a;

    box-shadow: 0 8px 20px #76b90044;
  }

  #meldAnnouncementPanel .meldSecondary {
    background: var(--panel2, #222622);
    color: var(--muted, #9ca69b);
  }

  #meldAnnouncementPanel .meldSecondary:hover {
    color: var(--text, #f2f5f0);
  }

  #meldAnnouncementPanel .meldStatus {
    min-height: 18px;
    margin-top: 9px;

    overflow-wrap: anywhere;

    color: var(--muted, #9ca69b);

    font-size: 10px;
    line-height: 1.5;
  }

  #meldAnnouncementPanel .meldDivider {
    height: 1px;
    margin: 20px 0;

    border: 0;
    background: var(--line, #303730);
  }

  #meldAnnouncementPanel #meldAnnOwnerControls {
    padding-top: 1px;
  }

  #meldAnnouncementPanel #meldAnnOwnerControls h2 {
    color: var(--accent-light, #a3e635);
    font-size: 15px;
    letter-spacing: .2px;
  }

  /* ============================================================
     MOBILE
     ============================================================ */

  @media (max-width: 700px) {
    #meldAnnouncementPopup {
      top: 14px;
      width: calc(100vw - 24px);
      padding: 16px;
    }

    #meldAnnouncementButton {
      right: 10px;
      bottom: 112px;

      min-height: 38px;
      padding: 0 11px;

      border-radius: 10px;
      font-size: 10px;
    }

    #meldAnnouncementPanel {
      right: 10px;
      bottom: 162px;

      width: calc(100vw - 20px);
      max-height: calc(100dvh - 190px);

      padding: 18px;
      border-radius: 14px;
    }
  }

  @media (max-width: 380px) {
    #meldAnnouncementButton {
      right: 8px;
      bottom: 106px;

      padding: 0 9px;
      font-size: 9px;
    }

    #meldAnnouncementPanel {
      right: 8px;
      width: calc(100vw - 16px);
      padding: 16px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    #meldAnnouncementPopup,
    #meldAnnouncementPanel,
    #meldAnnouncementButton,
    #meldAnnouncementPanel button {
      animation: none !important;
      transition: none !important;
    }
  }
`;

document.head.appendChild(style);

/* ============================================================
   FLOATING ANNOUNCEMENT
   ============================================================ */

const popup = document.createElement("div");
popup.id = "meldAnnouncementPopup";

const popupTitle = document.createElement("div");
popupTitle.className = "meldAnnTitle";
popupTitle.textContent = "MELD ANNOUNCEMENT";

const popupMessage = document.createElement("div");
popupMessage.id = "meldAnnouncementMessage";

popup.append(popupTitle, popupMessage);
document.body.appendChild(popup);

function displayAnnouncement(data) {
  if (
    !data ||
    typeof data.message !== "string" ||
    typeof data.sentAt !== "number" ||
    typeof data.expiresAt !== "number"
  ) {
    return;
  }

  const signature = `${data.sentAt}:${data.message}`;

  if (signature === announcementSignature) {
    return;
  }

  announcementSignature = signature;

  clearTimeout(hideTimer);
  clearTimeout(removeTimer);

  const remaining = data.expiresAt - Date.now();

  if (remaining <= 0 || remaining > 120000) {
    popup.style.opacity = "0";
    popup.style.display = "none";
    return;
  }

  popupMessage.textContent = data.message;
  popup.style.display = "block";
  popup.style.opacity = "0";
  popup.style.transform = "translate(-50%, -15px)";

  requestAnimationFrame(() => {
    popup.style.opacity = "1";
    popup.style.transform = "translate(-50%, 0)";
  });

  hideTimer = setTimeout(() => {
    popup.style.opacity = "0";
    popup.style.transform = "translate(-50%, -15px)";

    removeTimer = setTimeout(() => {
      popup.style.display = "none";
    }, 450);
  }, remaining);
}

/* ============================================================
   ANNOUNCEMENT PANEL
   ============================================================ */

const button = document.createElement("button");
button.id = "meldAnnouncementButton";
button.type = "button";
button.textContent = "Live Announcements";
button.hidden = true;
button.setAttribute("aria-controls", "meldAnnouncementPanel");
button.setAttribute("aria-expanded", "false");

const panel = document.createElement("section");
panel.id = "meldAnnouncementPanel";
panel.hidden = true;
panel.setAttribute("aria-label", "Announcement controls");

panel.innerHTML = `
  <h2>Admin Abuse Friday</h2>
  <p>Publish a live announcement to Meld.</p>

  <label for="meldAnnMessage">Announcement</label>
  <textarea
    id="meldAnnMessage"
    maxlength="300"
    placeholder="Type your announcement..."
  ></textarea>

  <button id="meldAnnSend" type="button">Send Live</button>
  <button id="meldAnnEnd" class="meldSecondary" type="button">
    End Announcement
  </button>

  <div
    class="meldStatus"
    id="meldAnnSendStatus"
    aria-live="polite"
  ></div>

  <div id="meldAnnOwnerControls" hidden>
    <hr class="meldDivider">

    <h2>Publisher Permissions</h2>
    <p>Enter a user's Firebase Authentication UID.</p>

    <input
      id="meldAnnTargetUid"
      placeholder="Firebase UID"
      autocomplete="off"
      spellcheck="false"
    >

    <button id="meldAnnGrant" type="button">Grant Access</button>
    <button id="meldAnnRevoke" class="meldSecondary" type="button">
      Revoke Access
    </button>

    <div
      class="meldStatus"
      id="meldAnnPermissionStatus"
      aria-live="polite"
    ></div>
  </div>

  <hr class="meldDivider">

  <button id="meldAnnClose" class="meldSecondary" type="button">
    Close Panel
  </button>
`;

document.body.append(button, panel);

function setPanelOpen(isOpen) {
  panel.hidden = !isOpen;
  button.setAttribute("aria-expanded", String(isOpen));
}

button.addEventListener("click", () => {
  setPanelOpen(panel.hidden);
});

panel.querySelector("#meldAnnClose").addEventListener("click", () => {
  setPanelOpen(false);
});

function setStatus(id, message) {
  const element = panel.querySelector(`#${id}`);

  if (element) {
    element.textContent = message;
  }
}

function updatePanel() {
  button.hidden = !(currentUser && canPost);

  panel.querySelector("#meldAnnOwnerControls").hidden = !isOwner;

  if (!currentUser || !canPost) {
    setPanelOpen(false);
  }
}

panel.querySelector("#meldAnnSend").addEventListener("click", async () => {
  if (!currentUser || !canPost) {
    setStatus(
      "meldAnnSendStatus",
      "You don't have permission."
    );
    return;
  }

  const message = panel
    .querySelector("#meldAnnMessage")
    .value
    .trim();

  if (!message || message.length > 300) {
    setStatus(
      "meldAnnSendStatus",
      "Enter a message up to 300 characters."
    );
    return;
  }

  try {
    const sentAt = Date.now();

    await set(currentRef, {
      message,
      sentAt,
      expiresAt: sentAt + 120000
    });

    panel.querySelector("#meldAnnMessage").value = "";

    setStatus(
      "meldAnnSendStatus",
      "Announcement published!"
    );
  } catch (error) {
    console.error("Announcement publish failed:", error);

    setStatus(
      "meldAnnSendStatus",
      "Failed: " + error.message
    );
  }
});

panel.querySelector("#meldAnnEnd").addEventListener("click", async () => {
  if (!currentUser || !canPost) {
    setStatus(
      "meldAnnSendStatus",
      "You don't have permission."
    );
    return;
  }

  try {
    const now = Date.now();

    await set(currentRef, {
      message: "",
      sentAt: now - 120001,
      expiresAt: now - 1
    });

    clearTimeout(hideTimer);
    clearTimeout(removeTimer);

    popup.style.opacity = "0";
    popup.style.transform = "translate(-50%, -15px)";

    removeTimer = setTimeout(() => {
      popup.style.display = "none";
    }, 450);

    setStatus(
      "meldAnnSendStatus",
      "Announcement ended."
    );
  } catch (error) {
    console.error("Announcement ending failed:", error);

    setStatus(
      "meldAnnSendStatus",
      "Failed: " + error.message
    );
  }
});

async function changePermission(grant) {
  const uid = panel
    .querySelector("#meldAnnTargetUid")
    .value
    .trim();

  if (!currentUser || !isOwner) {
    setStatus(
      "meldAnnPermissionStatus",
      "Owner access required."
    );
    return;
  }

  if (
    !uid ||
    uid === OWNER_UID ||
    uid.includes("/") ||
    uid.length > 128
  ) {
    setStatus(
      "meldAnnPermissionStatus",
      "Enter a valid user's UID."
    );
    return;
  }

  try {
    const permissionRef = ref(
      db,
      `announcementPermissions/${uid}`
    );

    if (grant) {
      await set(permissionRef, {
        canPost: true
      });

      setStatus(
        "meldAnnPermissionStatus",
        "Access granted."
      );
    } else {
      await remove(permissionRef);

      setStatus(
        "meldAnnPermissionStatus",
        "Access revoked."
      );
    }
  } catch (error) {
    console.error("Permission change failed:", error);

    setStatus(
      "meldAnnPermissionStatus",
      "Failed: " + error.message
    );
  }
}

panel.querySelector("#meldAnnGrant").addEventListener("click", () => {
  changePermission(true);
});

panel.querySelector("#meldAnnRevoke").addEventListener("click", () => {
  changePermission(false);
});

/* ============================================================
   AUTHENTICATION AND PERMISSIONS
   ============================================================ */

onAuthStateChanged(auth, user => {
  if (permissionListener) {
    permissionListener();
    permissionListener = null;
  }

  currentUser = user;
  isOwner = Boolean(user && user.uid === OWNER_UID);
  canPost = isOwner;

  updatePanel();

  if (!user) {
    setStatus(
      "meldAnnSendStatus",
      "Sign in to receive announcements."
    );
    return;
  }

  const permissionRef = ref(
    db,
    `announcementPermissions/${user.uid}/canPost`
  );

  permissionListener = onValue(
    permissionRef,
    snapshot => {
      canPost = isOwner || snapshot.val() === true;
      updatePanel();
    },
    error => {
      console.error("Permission check failed:", error);

      canPost = isOwner;
      updatePanel();
    }
  );
});

/* ============================================================
   REAL-TIME ANNOUNCEMENTS
   ============================================================ */

onValue(
  currentRef,
  snapshot => {
    displayAnnouncement(snapshot.val());
  },
  error => {
    console.error("Announcement listener failed:", error);
  }
);
