import { initializeApp, getApps, getApp } from
  "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import { getAuth, onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
  getDatabase,
  ref,
  get,
  onValue,
  set,
  push,
  update,
  remove,
  runTransaction
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

import { activeScheduledAnnouncement, describeSchedule } from "./meld-shared.js";

/*
   MELD ANNOUNCEMENTS */

const OWNER_UID = (window.MELD_CONFIG && window.MELD_CONFIG.OWNER_UID) || "OH6Jo3MnREgxfEGyVRxivcsuF582";

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

/*
   STYLE
 */

const style = document.createElement("style");

style.textContent = `
  #meldAnnouncementPopup[data-style="success"]{border-color:#34d399!important;box-shadow:0 20px 60px #000a,0 0 40px #34d39933!important}
  #meldAnnouncementPopup[data-style="event"]{border-color:#c084fc!important;box-shadow:0 20px 60px #000a,0 0 50px #c084fc44!important}
  #meldAnnouncementPopup[data-style="warning"]{border-color:#fbbf24!important;box-shadow:0 20px 60px #000a,0 0 40px #fbbf2433!important}
  #meldAnnouncementPopup[data-style="danger"]{border-color:#f87171!important;box-shadow:0 20px 60px #000a,0 0 40px #f8717144!important}
  #meldAnnouncementPopup .meldAnnLink{display:inline-block;margin-top:10px;padding:8px 14px;border-radius:9px;background:#a3e635;color:#10150a;font-weight:800;font-size:12px;text-decoration:none}
  #meldAnnouncementPopup[data-style="danger"] .meldAnnLink{background:#f87171}#meldAnnouncementPopup[data-style="warning"] .meldAnnLink{background:#fbbf24}#meldAnnouncementPopup[data-style="event"] .meldAnnLink{background:#c084fc}#meldAnnouncementPopup[data-style="success"] .meldAnnLink{background:#34d399}
  #meldAnnouncementPanel .meldChips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
  #meldAnnouncementPanel .meldChips button{width:auto;padding:5px 10px;font-size:11px;border-radius:99px}
  #meldAnnouncementPanel .meldHist{display:grid;gap:6px;max-height:160px;overflow:auto;margin-top:6px}
  #meldAnnouncementPanel .meldHist div{padding:7px 10px;border:1px solid #ffffff18;border-radius:9px;font-size:11px;color:#b4c0b1}

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

  /* 
     LIVE ANNOUNCEMENT POPUP
      */

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

  /* 
     ANNOUNCEMENT BUTTON
    */

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

  /* 
     ANNOUNCEMENT PANEL
     */

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


  /* ---- tabs / schedule / owner tools ---- */
  #meldAnnouncementPanel .meldTabs{display:flex;gap:6px;margin:0 0 16px;padding:4px;border:1px solid var(--line,#303730);border-radius:11px;background:#0e130e}
  #meldAnnouncementPanel .meldTabs button{flex:1;min-height:32px;padding:6px 8px;border:0;background:transparent;color:var(--muted,#9ca69b)}
  #meldAnnouncementPanel .meldTabs button.active{background:var(--accent,#76b900);color:#10150a}
  #meldAnnouncementPanel .meldPane[hidden]{display:none}
  #meldAnnouncementPanel select{display:block;width:100%;box-sizing:border-box;margin:0 0 12px;padding:10px 12px;border:1px solid var(--line,#303730);border-radius:9px;background:#111611;color:var(--text,#f2f5f0);font:inherit;font-size:12px}
  #meldAnnouncementPanel .meldRow{display:flex;gap:8px}
  #meldAnnouncementPanel .meldRow>*{flex:1;min-width:0}
  #meldAnnouncementPanel .meldDays{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}
  #meldAnnouncementPanel .meldDays label{display:inline-flex;align-items:center;gap:5px;margin:0;padding:6px 9px;border:1px solid var(--line,#303730);border-radius:8px;color:var(--text,#f2f5f0);letter-spacing:0;text-transform:none;font-size:11px;cursor:pointer}
  #meldAnnouncementPanel .meldDays input{width:auto;margin:0}
  #meldAnnouncementPanel .meldList{display:grid;gap:8px;margin-top:6px}
  #meldAnnouncementPanel .meldItem{padding:10px 12px;border:1px solid var(--line,#303730);border-radius:10px;background:#111611;font-size:11px;line-height:1.5}
  #meldAnnouncementPanel .meldItem b{display:block;color:var(--text,#f2f5f0);margin-bottom:2px;overflow-wrap:anywhere}
  #meldAnnouncementPanel .meldItem span{color:var(--muted,#9ca69b)}
  #meldAnnouncementPanel .meldItem .meldItemActions{display:flex;gap:6px;margin-top:8px}
  #meldAnnouncementPanel .meldItem button{min-height:28px;padding:4px 10px;font-size:10px}
  #meldAnnouncementPanel .meldPreset{width:100%;margin-bottom:12px;border-style:dashed}
  #meldAnnouncementPopup .meldAnnClose{position:absolute;top:8px;right:10px;z-index:2;width:26px;height:26px;border:0;border-radius:7px;background:transparent;color:var(--muted,#9ca69b);font-size:18px;cursor:pointer}
  #meldAnnouncementPopup .meldAnnClose:hover{background:#ffffff14;color:var(--text,#f2f5f0)}
  #meldAnnouncementPopup .meldAnnTimer{position:relative;z-index:1;margin-top:10px;height:3px;border-radius:3px;background:#ffffff12;overflow:hidden}
  #meldAnnouncementPopup .meldAnnTimer span{display:block;height:100%;background:var(--accent,#76b900);transition:width 1s linear}

  /* 
     MOBILE
     */

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

/* 
   FLOATING ANNOUNCEMENT
   */

const popup = document.createElement("div");
popup.id = "meldAnnouncementPopup";

const popupTitle = document.createElement("div");
popupTitle.className = "meldAnnTitle";
popupTitle.textContent = "MELD ANNOUNCEMENT";

const popupMessage = document.createElement("div");
popupMessage.id = "meldAnnouncementMessage";

const popupClose = document.createElement("button");
popupClose.type = "button";
popupClose.className = "meldAnnClose";
popupClose.setAttribute("aria-label", "Dismiss announcement");
popupClose.textContent = "×";

const popupTimer = document.createElement("div");
popupTimer.className = "meldAnnTimer";
popupTimer.innerHTML = "<span></span>";

const popupLink = document.createElement("a");
popupLink.className = "meldAnnLink";
popupLink.target = "_blank";
popupLink.rel = "noopener noreferrer";
popupLink.hidden = true;

popup.append(popupClose, popupTitle, popupMessage, popupLink, popupTimer);
document.body.appendChild(popup);

let manualEndsAt = 0;
let scheduledKey = "";
let dismissedKey = "";
let scheduleEntries = {};

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

  if (remaining <= 0 || remaining > 3600000) {
    popup.style.opacity = "0";
    popup.style.display = "none";
    return;
  }

  manualEndsAt = data.expiresAt;
  scheduledKey = "";
  popupTimer.style.display = "none";
  popup.style.pointerEvents = "auto";
  popupMessage.textContent = data.message;
  popup.dataset.style = typeof data.style === "string" ? data.style : "info";
  popupTitle.textContent = (typeof data.title === "string" && data.title.trim()) ? data.title.trim().toUpperCase() : "MELD ANNOUNCEMENT";
  const safeLink = typeof data.link === "string" && /^https?:\/\//i.test(data.link) ? data.link : "";
  popupLink.hidden = !safeLink;
  if (safeLink) { popupLink.href = safeLink; popupLink.textContent = (typeof data.linkLabel === "string" && data.linkLabel.trim()) || "Open"; }
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

/* 
   ANNOUNCEMENT PANEL
    */

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
  <p>Send announcements now, or schedule them so they run by themselves.</p>

  <div class="meldTabs" role="tablist">
    <button type="button" class="active" data-pane="send">Send now</button>
    <button type="button" data-pane="schedule">Auto-schedule</button>
    <button type="button" data-pane="owner" id="meldTabOwner" hidden>Owner tools</button>
  </div>

  <div class="meldPane" data-pane-id="send">
    <label for="meldAnnMessage">Announcement</label>
    <textarea id="meldAnnMessage" maxlength="300" placeholder="Type your announcement..."></textarea>
    <div class="meldChips" id="meldAnnTemplates">
      <button type="button" class="meldSecondary" data-t="🔥 Admin Abuse is LIVE! Jump in and grab free stuff.|event|Admin Abuse">Admin Abuse</button>
      <button type="button" class="meldSecondary" data-t="🎁 New code drop! Redeem it in the Store → Meldbux tab.|success|Code drop">Code drop</button>
      <button type="button" class="meldSecondary" data-t="🆕 A new Meld update is out — check Info → Updates.|info|Update">Update</button>
      <button type="button" class="meldSecondary" data-t="⚠️ Meld may restart briefly for maintenance.|warning|Maintenance">Maintenance</button>
    </div>
    <div class="meldRow">
      <div><label for="meldAnnStyle">Style</label><select id="meldAnnStyle"><option value="info">Info</option><option value="success">Success</option><option value="event">Event</option><option value="warning">Warning</option><option value="danger">Urgent</option></select></div>
      <div><label for="meldAnnDur">Show for</label><select id="meldAnnDur"><option value="30">30 sec</option><option value="120" selected>2 min</option><option value="300">5 min</option><option value="900">15 min</option><option value="3600">1 hour</option></select></div>
    </div>
    <label for="meldAnnTitleIn">Title (optional)</label>
    <input id="meldAnnTitleIn" maxlength="60" placeholder="MELD ANNOUNCEMENT" autocomplete="off">
    <div class="meldRow">
      <div><label for="meldAnnLink">Button link (optional)</label><input id="meldAnnLink" maxlength="300" placeholder="https://…" autocomplete="off"></div>
      <div><label for="meldAnnLinkLabel">Button text</label><input id="meldAnnLinkLabel" maxlength="24" placeholder="Open" autocomplete="off"></div>
    </div>
    <button id="meldAnnPreview" class="meldSecondary" type="button">Preview on my screen</button>
    <button id="meldAnnSend" type="button">Send Live</button>
    <button id="meldAnnEnd" class="meldSecondary" type="button">End Announcement</button>
    <div class="meldStatus" id="meldAnnSendStatus" aria-live="polite"></div>
  </div>

  <div class="meldPane" data-pane-id="schedule" hidden>
    <button type="button" class="meldPreset meldSecondary" id="meldPresetFriday">⚡ Preset: Admin Abuse Friday</button>

    <label for="meldSchMessage">Message</label>
    <textarea id="meldSchMessage" maxlength="300" placeholder="Admin Abuse is LIVE! ..."></textarea>

    <label for="meldSchKind">Repeat</label>
    <select id="meldSchKind">
      <option value="weekly">Weekly (pick days)</option>
      <option value="daily">Every day</option>
      <option value="once">Just once</option>
    </select>

    <div id="meldSchDaysBox" class="meldDays"></div>

    <div class="meldRow">
      <div id="meldSchTimeBox"><label for="meldSchTime">Time</label><input id="meldSchTime" type="time" value="15:00"></div>
      <div id="meldSchDateBox" hidden><label for="meldSchDate">Date</label><input id="meldSchDate" type="date"></div>
      <div><label for="meldSchDuration">Show for (min)</label><input id="meldSchDuration" type="number" min="0.5" max="60" step="0.5" value="5"></div>
    </div>

    <label for="meldSchTz">Time zone</label>
    <input id="meldSchTz" autocomplete="off" spellcheck="false">

    <button id="meldSchAdd" type="button">Save schedule</button>
    <div class="meldStatus" id="meldSchStatus" aria-live="polite"></div>

    <hr class="meldDivider">
    <h2 style="font-size:15px">Scheduled</h2>
    <div class="meldList" id="meldSchList"><span class="meldStatus">Nothing scheduled yet.</span></div>
  </div>

  <div class="meldPane" data-pane-id="owner" id="meldAnnOwnerControls" hidden>
    <h2>Publisher Permissions</h2>
    <p>Enter a user's Firebase Authentication UID to let them post/schedule announcements.</p>
    <input id="meldAnnTargetUid" placeholder="Firebase UID" autocomplete="off" spellcheck="false">
    <button id="meldAnnGrant" type="button">Grant Access</button>
    <button id="meldAnnRevoke" class="meldSecondary" type="button">Revoke Access</button>
    <div class="meldStatus" id="meldAnnPermissionStatus" aria-live="polite"></div>

    <hr class="meldDivider">
    <h2>Perks &amp; Ranks</h2>
    <p>After someone pays (or earns it), apply it here. Use their username or UID.</p>
    <input id="meldPerkUser" placeholder="Username or UID" autocomplete="off" spellcheck="false">
    <select id="meldPerkAction">
      <option value="adfree">Give: Ad-Free Pass</option>
      <option value="vip">Give: Lifetime VIP (+1 name token)</option>
      <option value="token">Give: +1 Name Change Token</option>
      <option value="supporter">Give: Supporter (30 days)</option>
      <option value="plus">Give: Meld Plus (30 days)</option>
      <option value="rank:admin">Rank: add Admin</option>
      <option value="rank:moderator">Rank: add Moderator</option>
      <option value="rank:partner">Rank: add Partner</option>
      <option value="rank:founder">Rank: add Founder</option>
      <option value="rank:beta">Rank: add Beta Tester</option>
      <option value="unrank:admin">Rank: remove Admin</option>
      <option value="unrank:moderator">Rank: remove Moderator</option>
      <option value="unrank:partner">Rank: remove Partner</option>
      <option value="unrank:founder">Rank: remove Founder</option>
      <option value="unrank:beta">Rank: remove Beta Tester</option>
      <option value="revoke">Remove all perks</option>
    </select>
    <button id="meldPerkApply" type="button">Apply</button>
    <div class="meldStatus" id="meldPerkStatus" aria-live="polite"></div>

    <hr class="meldDivider">
    <h2>Discord invite</h2>
    <p>Shown in the Discord panel for everyone.</p>
    <input id="meldDiscordUrl" placeholder="https://discord.gg/yourcode" autocomplete="off" spellcheck="false">
    <button id="meldDiscordSave" type="button">Save invite link</button>
    <div class="meldStatus" id="meldDiscordStatus" aria-live="polite"></div>
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

  panel.querySelector("#meldTabOwner").hidden = !isOwner;
  if (!isOwner) {
    panel.querySelector("#meldAnnOwnerControls").hidden = true;
    if (activePane === "owner") showPane("send");
  }

  if (!currentUser || !canPost) {
    setPanelOpen(false);
  }
}

function buildAnnouncement(message) {
  const sentAt = Date.now();
  const dur = Math.min(3600, Math.max(10, Number(panel.querySelector("#meldAnnDur").value) || 120));
  const payload = { message, sentAt, expiresAt: sentAt + dur * 1000, style: panel.querySelector("#meldAnnStyle").value };
  const title = panel.querySelector("#meldAnnTitleIn").value.trim();
  const link = panel.querySelector("#meldAnnLink").value.trim();
  const label = panel.querySelector("#meldAnnLinkLabel").value.trim();
  if (title) payload.title = title.slice(0, 60);
  if (/^https?:\/\//i.test(link)) { payload.link = link.slice(0, 300); if (label) payload.linkLabel = label.slice(0, 24); }
  return payload;
}

panel.querySelector("#meldAnnTemplates").addEventListener("click", event => {
  const b = event.target.closest("button[data-t]");
  if (!b) return;
  const [text, style, title] = b.dataset.t.split("|");
  panel.querySelector("#meldAnnMessage").value = text;
  panel.querySelector("#meldAnnStyle").value = style;
  panel.querySelector("#meldAnnTitleIn").value = title;
});

panel.querySelector("#meldAnnPreview").addEventListener("click", () => {
  const message = panel.querySelector("#meldAnnMessage").value.trim();
  if (!message) { setStatus("meldAnnSendStatus", "Type a message to preview."); return; }
  const payload = buildAnnouncement(message);
  payload.expiresAt = Date.now() + 8000;
  announcementSignature = "";
  displayAnnouncement(payload);
  announcementSignature = "";
  setStatus("meldAnnSendStatus", "Previewing for 8 seconds (only you see this).");
});

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
    const payload = buildAnnouncement(message);
    await set(currentRef, payload);
    push(ref(db, "announcementHistory"), { message, sentAt: payload.sentAt, style: payload.style, by: currentUser.uid }).catch(() => {});

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

/* 
   AUTHENTICATION AND PERMISSIONS
   */

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

/* 
   REAL-TIME ANNOUNCEMENTS
   */

onValue(
  currentRef,
  snapshot => {
    displayAnnouncement(snapshot.val());
  },
  error => {
    console.error("Announcement listener failed:", error);
  }
);


/* =====================================================================
   AUTO-SCHEDULED ANNOUNCEMENTS
   The schedule lives in Firebase (announcementSchedule/…). Every visitor's
   browser checks it every second and shows whatever is due — so Admin Abuse
   Friday runs by itself, even when you're offline. Visitors only READ.
   ===================================================================== */

let activePane = "send";

function showPane(name) {
  activePane = name;
  panel.querySelectorAll(".meldTabs button").forEach(tab =>
    tab.classList.toggle("active", tab.dataset.pane === name));
  panel.querySelectorAll(".meldPane").forEach(pane => {
    pane.hidden = pane.dataset.paneId !== name;
  });
}

panel.querySelectorAll(".meldTabs button").forEach(tab =>
  tab.addEventListener("click", () => showPane(tab.dataset.pane)));

function hideScheduledPopup() {
  scheduledKey = "";
  popup.style.opacity = "0";
  popup.style.transform = "translate(-50%, -15px)";
  clearTimeout(removeTimer);
  removeTimer = setTimeout(() => { popup.style.display = "none"; }, 450);
}

let scheduledStart = 0;
let scheduledEnd = 0;

function tickSchedule() {
  const now = Date.now();
  if (now < manualEndsAt) return;                       // a manual announcement is on screen

  const active = activeScheduledAnnouncement(scheduleEntries, now);

  if (!active || active.windowKey === dismissedKey) {
    if (scheduledKey) hideScheduledPopup();
    return;
  }

  if (active.windowKey !== scheduledKey) {
    scheduledKey = active.windowKey;
    scheduledEnd = active.endsAt;
    scheduledStart = now;
    clearTimeout(hideTimer);
    clearTimeout(removeTimer);

    popupMessage.textContent = active.message;
    popupTimer.style.display = "block";
    popup.style.pointerEvents = "auto";
    popup.style.display = "block";
    popup.style.opacity = "0";
    popup.style.transform = "translate(-50%, -15px)";
    requestAnimationFrame(() => {
      popup.style.opacity = "1";
      popup.style.transform = "translate(-50%, 0)";
    });
  }

  const total = Math.max(1, scheduledEnd - scheduledStart);
  const left = Math.max(0, scheduledEnd - now);
  popupTimer.firstElementChild.style.width = (left / total * 100).toFixed(1) + "%";
}

popupClose.addEventListener("click", () => {
  if (scheduledKey) dismissedKey = scheduledKey;
  clearTimeout(hideTimer);
  popup.style.opacity = "0";
  removeTimer = setTimeout(() => { popup.style.display = "none"; }, 450);
  scheduledKey = "";
});

setInterval(tickSchedule, 1000);

onValue(
  ref(db, "announcementSchedule"),
  snapshot => {
    scheduleEntries = snapshot.val() || {};
    renderScheduleList();
    tickSchedule();
  },
  error => console.warn("Schedule listener failed (check Firebase rules):", error)
);

/* ---------- schedule form ---------- */

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const q = id => panel.querySelector("#" + id);

q("meldSchDaysBox").innerHTML = DAY_NAMES.map((name, index) =>
  `<label><input type="checkbox" value="${index}"${index === 5 ? " checked" : ""}> ${name}</label>`).join("");

try {
  q("meldSchTz").value = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
} catch (_) { q("meldSchTz").value = ""; }

function syncKind() {
  const kind = q("meldSchKind").value;
  q("meldSchDaysBox").hidden = kind !== "weekly";
  q("meldSchDateBox").hidden = kind !== "once";
}
q("meldSchKind").addEventListener("change", syncKind);
syncKind();

q("meldPresetFriday").addEventListener("click", () => {
  q("meldSchMessage").value = "🔥 ADMIN ABUSE FRIDAY IS LIVE! Expect chaos, giveaways and surprises — have fun!";
  q("meldSchKind").value = "weekly";
  q("meldSchDaysBox").querySelectorAll("input").forEach(box => { box.checked = box.value === "5"; });
  q("meldSchDuration").value = "5";
  syncKind();
  setStatus("meldSchStatus", "Preset loaded — pick the time, then Save schedule.");
});

function localTimeToTimestamp(dateValue, timeValue, zone) {
  /* Find the instant whose wall-clock reading in `zone` equals date+time. */
  const [y, m, d] = dateValue.split("-").map(Number);
  const [hh, mm] = timeValue.split(":").map(Number);
  let guess = Date.UTC(y, m - 1, d, hh, mm, 0);
  for (let i = 0; i < 3; i++) {
    const parts = {};
    new Intl.DateTimeFormat("en-US", {
      timeZone: zone || undefined, hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit"
    }).formatToParts(new Date(guess)).forEach(p => { parts[p.type] = p.value; });
    const shown = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute, +parts.second);
    guess += Date.UTC(y, m - 1, d, hh, mm, 0) - shown;
  }
  return guess;
}

q("meldSchAdd").addEventListener("click", async () => {
  if (!currentUser || !canPost) { setStatus("meldSchStatus", "You don't have permission."); return; }

  const message = q("meldSchMessage").value.trim();
  const kind = q("meldSchKind").value;
  const time = q("meldSchTime").value;
  const zone = q("meldSchTz").value.trim();
  const minutes = Number(q("meldSchDuration").value);

  if (!message || message.length > 300) { setStatus("meldSchStatus", "Enter a message up to 300 characters."); return; }
  if (!time) { setStatus("meldSchStatus", "Pick a time."); return; }
  if (!(minutes >= 0.5 && minutes <= 60)) { setStatus("meldSchStatus", "Duration must be 0.5–60 minutes."); return; }
  try { new Intl.DateTimeFormat("en-US", { timeZone: zone || undefined }); }
  catch (_) { setStatus("meldSchStatus", "Unknown time zone. Example: America/Chicago"); return; }

  const entry = {
    message, kind, time, tz: zone, enabled: true,
    durationSec: Math.round(minutes * 60),
    createdBy: currentUser.uid, createdAt: Date.now()
  };

  if (kind === "weekly") {
    entry.days = [...q("meldSchDaysBox").querySelectorAll("input:checked")].map(box => Number(box.value));
    if (!entry.days.length) { setStatus("meldSchStatus", "Pick at least one day."); return; }
  }
  if (kind === "once") {
    const date = q("meldSchDate").value;
    if (!date) { setStatus("meldSchStatus", "Pick a date."); return; }
    entry.startAt = localTimeToTimestamp(date, time, zone);
    if (entry.startAt + entry.durationSec * 1000 < Date.now()) { setStatus("meldSchStatus", "That time has already passed."); return; }
  }

  try {
    await set(push(ref(db, "announcementSchedule")), entry);
    q("meldSchMessage").value = "";
    setStatus("meldSchStatus", "Scheduled! It will run automatically — you can close this tab.");
  } catch (error) {
    console.error(error);
    setStatus("meldSchStatus", "Failed: " + error.message);
  }
});

function renderScheduleList() {
  const list = q("meldSchList");
  const entries = Object.entries(scheduleEntries);
  list.replaceChildren();

  if (!entries.length) {
    const none = document.createElement("span");
    none.className = "meldStatus";
    none.textContent = "Nothing scheduled yet.";
    list.appendChild(none);
    return;
  }

  entries.forEach(([id, entry]) => {
    const item = document.createElement("div");
    item.className = "meldItem";

    const title = document.createElement("b");
    title.textContent = (entry.enabled === false ? "⏸ " : "▶ ") + (entry.message || "");
    const when = document.createElement("span");
    when.textContent = describeSchedule(entry);

    const actions = document.createElement("div");
    actions.className = "meldItemActions";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.textContent = entry.enabled === false ? "Resume" : "Pause";
    toggle.addEventListener("click", () =>
      update(ref(db, `announcementSchedule/${id}`), { enabled: entry.enabled === false })
        .catch(error => setStatus("meldSchStatus", "Failed: " + error.message)));

    const del = document.createElement("button");
    del.type = "button";
    del.className = "meldSecondary";
    del.textContent = "Delete";
    del.addEventListener("click", () => {
      if (!window.confirm("Delete this scheduled announcement?")) return;
      remove(ref(db, `announcementSchedule/${id}`))
        .catch(error => setStatus("meldSchStatus", "Failed: " + error.message));
    });

    actions.append(toggle, del);
    item.append(title, when, actions);
    list.appendChild(item);
  });
}

/* ---------- owner: perks, ranks, discord invite ---------- */

async function resolveUid(value) {
  value = value.trim();
  if (!value) throw new Error("Enter a username or UID.");
  if (/^[A-Za-z0-9]{20,40}$/.test(value)) return value;
  const snap = await get(ref(db, `usernames/${value.toLowerCase()}`));
  if (!snap.exists()) throw new Error("No account with that username.");
  return snap.val();
}

q("meldPerkApply").addEventListener("click", async () => {
  if (!isOwner) { setStatus("meldPerkStatus", "Owner access required."); return; }
  const action = q("meldPerkAction").value;

  try {
    const uid = await resolveUid(q("meldPerkUser").value);
    const base = `users/${uid}`;
    const bump = path => runTransaction(ref(db, path), value => (Number(value) || 0) + 1);

    if (action === "adfree") {
      await set(ref(db, `${base}/entitlements/adFree`), true);
    } else if (action === "vip") {
      await set(ref(db, `${base}/entitlements/vip`), true);
      await bump(`${base}/entitlements/nameChangeCredits`);
    } else if (action === "token") {
      await bump(`${base}/entitlements/nameChangeCredits`);
    } else if (action === "supporter" || action === "plus") {
      const existing = (await get(ref(db, `${base}/entitlements/membership`))).val();
      const from = Math.max(Date.now(), Number(existing?.expiresAt) || 0);
      await set(ref(db, `${base}/entitlements/membership`), {
        tier: action, expiresAt: from + 30 * 86400000
      });
    } else if (action.startsWith("rank:")) {
      await set(ref(db, `${base}/ranks/${action.slice(5)}`), true);
    } else if (action.startsWith("unrank:")) {
      await remove(ref(db, `${base}/ranks/${action.slice(7)}`));
    } else if (action === "revoke") {
      if (!window.confirm("Remove ALL perks from this account?")) return;
      await remove(ref(db, `${base}/entitlements`));
    }
    setStatus("meldPerkStatus", "Done ✔ — it shows up on their account right away.");
  } catch (error) {
    console.error(error);
    setStatus("meldPerkStatus", "Failed: " + error.message);
  }
});

q("meldDiscordSave").addEventListener("click", async () => {
  if (!isOwner) { setStatus("meldDiscordStatus", "Owner access required."); return; }
  const url = q("meldDiscordUrl").value.trim();
  if (!/^https:\/\/(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/[\w-]+\/?$/i.test(url)) {
    setStatus("meldDiscordStatus", "Use a link like https://discord.gg/yourcode");
    return;
  }
  try {
    await set(ref(db, "siteConfig/discordInvite"), url);
    setStatus("meldDiscordStatus", "Saved — everyone sees the new link.");
  } catch (error) {
    setStatus("meldDiscordStatus", "Failed: " + error.message);
  }
});

showPane("send");
