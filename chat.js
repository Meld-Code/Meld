
import { initializeApp, getApps, getApp } from
"https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import {
getAuth,
onAuthStateChanged
} from
"https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
getDatabase,
ref,
push,
query,
orderByChild,
limitToLast,
onValue,
get,
remove,
serverTimestamp
} from
"https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

const firebaseConfig = {
apiKey: "AIzaSyCkJJcpdLfWH8XZBuT8tgOkOKuj6ZtEzcY",
authDomain: "safebucketbypass.firebaseapp.com",
databaseURL: "https://safebucketbypass-default-rtdb.firebaseio.com",
projectId: "safebucketbypass",
storageBucket: "safebucketbypass.firebasestorage.app",
messagingSenderId: "659506734507",
appId: "1:659506734507:web:1e4268f7746380b41bdeee"
};

const chatButton = document.getElementById("chatButton");
const chatPanel = document.getElementById("chatPanel");
const chatCloseButton = document.getElementById("chatCloseButton");
const chatForm = document.getElementById("chatForm");
const chatNameInput = document.getElementById("chatNameInput");
const chatMessageInput = document.getElementById("chatMessageInput");
const chatSendButton = document.getElementById("chatSendButton");
const chatMessages = document.getElementById("chatMessages");
const chatStatus = document.getElementById("chatStatus");
const chatUnreadBadge = document.getElementById("chatUnreadBadge");

const CHAT_LIFETIME = 24 * 60 * 60 * 1000;
const MAX_MESSAGE_LENGTH = 300;

if (
!chatButton || !chatPanel || !chatCloseButton ||
!chatForm || !chatNameInput || !chatMessageInput ||
!chatSendButton || !chatMessages || !chatStatus
) {
console.error("Meld chat elements are missing.");
} else {
    let chatIsOpen = false;

    function openChat() {
        chatIsOpen = true;
        chatPanel.hidden = false;

        unreadCount = 0;
        updateUnreadBadge();

        if (currentUser) {
            chatMessageInput.focus();
        }
    }

    function closeChat() {
        chatIsOpen = false;
        chatPanel.hidden = true;
    }

    chatButton.addEventListener("click", () => {
        if(chatIsOpen) {
            closeChat();
        } else {
            openChat();
        }
    });

    chatCloseButton.addEventListener("click", closeChat);
const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

const database = getDatabase(app);
const auth = getAuth(app);

const messagesQuery = query(
  ref(database, "chatMessages"),
  orderByChild("createdAt"),
  limitToLast(100)
);

let currentUser = null;
let profile = null;
let unreadCount = 0;
let chatIsOpen = false;
let firstMessageLoad = true;
let stopMessagesListener = null;
let lastMessageIds = new Set();

// The display name comes from the user's saved Meld profile.
chatNameInput.readOnly = true;
chatNameInput.placeholder = "Your Meld username";

function updateUnreadBadge() {
  if (!chatUnreadBadge) return;

  chatUnreadBadge.hidden = unreadCount <= 0;
  chatUnreadBadge.textContent =
    unreadCount > 99 ? "99+" : String(unreadCount);
}

function showLoginPrompt() {
  chatMessages.replaceChildren();

  const prompt = document.createElement("p");
  prompt.className = "chatEmptyMessage";
  prompt.textContent = "Please sign in to read and send chat messages.";

  chatMessages.appendChild(prompt);
  chatNameInput.value = "";
  chatNameInput.disabled = true;
  chatMessageInput.disabled = true;
  chatSendButton.disabled = true;
  chatStatus.textContent = "Sign in to chat";
}

function openChat() {
  chatIsOpen = true;
  chatPanel.hidden = false;
  unreadCount = 0;
  updateUnreadBadge();

  if (currentUser) chatMessageInput.focus();
}

function closeChat() {
  chatIsOpen = false;
  chatPanel.hidden = true;
}

function formatTime(timestamp) {
  if (!timestamp) return "Sending...";

  return new Date(timestamp).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function renderMessages(snapshot) {
  chatMessages.replaceChildren();

  const messages = [];

  snapshot.forEach((messageSnapshot) => {
    const message = messageSnapshot.val();

    if (
      !message ||
      typeof message.createdAt !== "number" ||
      Date.now() - message.createdAt >= CHAT_LIFETIME
    ) {
      // Attempt to clean up expired messages belonging to this user.
      if (
        currentUser &&
        message &&
        message.userId === currentUser.uid &&
        typeof message.createdAt === "number" &&
        Date.now() - message.createdAt >= CHAT_LIFETIME
      ) {
        remove(ref(database, `chatMessages/${messageSnapshot.key}`))
          .catch((error) => {
            console.warn("Could not remove expired message:", error);
          });
      }

      return;
    }

    messages.push({
      id: messageSnapshot.key,
      ...message
    });
  });

  if (!messages.length) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "chatEmptyMessage";
    emptyMessage.textContent = "No messages yet.";
    chatMessages.appendChild(emptyMessage);
    return;
  }

  messages.forEach((message) => {
    const article = document.createElement("article");
    article.className = "chatMessage";

    if (message.userId === currentUser?.uid) {
      article.classList.add("chatMessageOwn");
    }

    const top = document.createElement("div");
    top.className = "chatMessageTop";

    const name = document.createElement("span");
    name.className = "chatMessageName";
    name.textContent = message.name || "Member";

    const rank = document.createElement("span");
    rank.className = "chatMessageRank";
    rank.textContent = message.rank || "Member";

    const time = document.createElement("time");
    time.className = "chatMessageTime";
    time.textContent = formatTime(message.createdAt);

    const text = document.createElement("p");
    text.className = "chatMessageText";
    text.textContent = message.text || "";

    top.append(name, rank, time);
    article.append(top, text);

    if (message.userId === currentUser?.uid) {
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "chatDeleteButton";
      deleteButton.textContent = "Delete";

      deleteButton.addEventListener("click", async () => {
        deleteButton.disabled = true;

        try {
          await remove(ref(database, `chatMessages/${message.id}`));
        } catch (error) {
          console.error("Could not delete message:", error);
          chatStatus.textContent = "Could not delete message";
          deleteButton.disabled = false;
        }
      });

      article.appendChild(deleteButton);
    }

    chatMessages.appendChild(article);
  });

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function startMessagesListener() {
  if (stopMessagesListener || !currentUser) return;

  stopMessagesListener = onValue(
    messagesQuery,
    (snapshot) => {
      if (!currentUser) return;

      const currentIds = new Set();

      snapshot.forEach((item) => {
        const message = item.val();

        if (
          message &&
          typeof message.createdAt === "number" &&
          Date.now() - message.createdAt < CHAT_LIFETIME
        ) {
          currentIds.add(item.key);
        }
      });

      if (!firstMessageLoad && !chatIsOpen) {
        for (const id of currentIds) {
          if (!lastMessageIds.has(id)) unreadCount++;
        }

        updateUnreadBadge();
      }

      lastMessageIds = currentIds;
      firstMessageLoad = false;
      renderMessages(snapshot);
      chatStatus.textContent = "Connected";
    },
    (error) => {
      console.error("Could not load chat:", error);
      chatStatus.textContent = "Chat unavailable";
    }
  );
}

function stopListening() {
  if (stopMessagesListener) {
    stopMessagesListener();
    stopMessagesListener = null;
  }

  lastMessageIds.clear();
  firstMessageLoad = true;
  unreadCount = 0;
  updateUnreadBadge();
}

chatButton.addEventListener("click", () => {
  chatIsOpen ? closeChat() : openChat();
});

chatCloseButton.addEventListener("click", closeChat);

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser || !profile) {
    chatStatus.textContent = "Please sign in to chat";
    return;
  }

  const name = profile.username;
  const rank = profile.rank || "Member";
  const text = chatMessageInput.value.trim().slice(0, MAX_MESSAGE_LENGTH);

  if (!name || !text) return;

  chatSendButton.disabled = true;

  try {
    await push(ref(database, "chatMessages"), {
      name,
      rank,
      text,
      userId: currentUser.uid,
      createdAt: serverTimestamp()
    });

    chatMessageInput.value = "";
    chatMessageInput.focus();
  } catch (error) {
    console.error("Could not send message:", error);
    chatStatus.textContent = "Message failed to send";
  } finally {
    chatSendButton.disabled = !currentUser || !profile;
  }
});

onAuthStateChanged(auth, async (user) => {
  stopListening();
  currentUser = user;
  profile = null;

  if (!user) {
    showLoginPrompt();
    return;
  }

  try {
    const profileSnapshot = await get(
      ref(database, `users/${user.uid}`)
    );

    // Prevent an old profile request from updating a newer session.
    if (auth.currentUser?.uid !== user.uid) return;

    if (!profileSnapshot.exists()) {
      showLoginPrompt();
      chatStatus.textContent = "Finish setting up your Meld profile";
      return;
    }

    profile = profileSnapshot.val();

    if (!profile.username || !profile.rank) {
      showLoginPrompt();
      chatStatus.textContent = "Your Meld profile is incomplete";
      return;
    }

    chatNameInput.value = profile.username;
    chatNameInput.disabled = false;
    chatMessageInput.disabled = false;
    chatSendButton.disabled = false;

    chatStatus.textContent = "Connected";
    startMessagesListener();
  } catch (error) {
    console.error("Could not load user profile:", error);
    showLoginPrompt();
    chatStatus.textContent = "Could not load your profile";
  }
});

// Drag the popup by its header on mouse or touch screens.
const dragHandle = chatPanel.querySelector(".chatHeader");

if (dragHandle) {
  dragHandle.style.cursor = "grab";
  dragHandle.style.touchAction = "none";

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  dragHandle.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button, input")) return;

    const rect = chatPanel.getBoundingClientRect();

    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    startLeft = rect.left;
    startTop = rect.top;

    chatPanel.style.left = `${rect.left}px`;
    chatPanel.style.top = `${rect.top}px`;
    chatPanel.style.right = "auto";
    chatPanel.style.bottom = "auto";

    dragHandle.style.cursor = "grabbing";
    dragHandle.setPointerCapture(event.pointerId);
  });

  dragHandle.addEventListener("pointermove", (event) => {
    if (!dragging) return;

    const maxLeft = Math.max(0, window.innerWidth - chatPanel.offsetWidth);
    const maxTop = Math.max(0, window.innerHeight - chatPanel.offsetHeight);

    const left = Math.min(
      maxLeft,
      Math.max(0, startLeft + event.clientX - startX)
    );

    const top = Math.min(
      maxTop,
      Math.max(0, startTop + event.clientY - startY)
    );

    chatPanel.style.left = `${left}px`;
    chatPanel.style.top = `${top}px`;
  });

  function stopDragging() {
    dragging = false;
    dragHandle.style.cursor = "grab";
  }

  dragHandle.addEventListener("pointerup", stopDragging);
  dragHandle.addEventListener("pointercancel", stopDragging);
}
}
