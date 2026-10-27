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

if (
  !chatButton ||
  !chatPanel ||
  !chatCloseButton ||
  !chatForm ||
  !chatNameInput ||
  !chatMessageInput ||
  !chatSendButton ||
  !chatMessages ||
  !chatStatus
) {
  console.error("Meld chat could not start because chat elements are missing.");
} else {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const database = getDatabase(app);
  const auth = getAuth(app);

  const messagesRef = query(
    ref(database, "chatMessages"),
    orderByChild("createdAt"),
    limitToLast(100)
  );

  let currentUser = null;
  let unreadCount = 0;
  let chatIsOpen = false;
  let firstMessageLoad = true;

  chatNameInput.value = localStorage.getItem("meldChatName") || "";

  function openChat() {
    chatIsOpen = true;
    chatPanel.hidden = false;
    unreadCount = 0;
    updateUnreadBadge();
    chatMessageInput.focus();
  }

  function closeChat() {
    chatIsOpen = false;
    chatPanel.hidden = true;
  }

  function updateUnreadBadge() {
    if (!chatUnreadBadge) return;

    if (unreadCount <= 0) {
      chatUnreadBadge.hidden = true;
      chatUnreadBadge.textContent = "0";
      return;
    }

    chatUnreadBadge.hidden = false;
    chatUnreadBadge.textContent = unreadCount > 99
      ? "99+"
      : String(unreadCount);
  }

  function formatTime(timestamp) {
    if (!timestamp) {
      return "Sending...";
    }

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
      messages.push({
        id: messageSnapshot.key,
        ...messageSnapshot.val()
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
      const messageElement = document.createElement("article");
      messageElement.className = "chatMessage";

      if (currentUser && message.userId === currentUser.uid) {
        messageElement.classList.add("chatMessageOwn");
      }

      const topElement = document.createElement("div");
      topElement.className = "chatMessageTop";

      const nameElement = document.createElement("span");
      nameElement.className = "chatMessageName";
      nameElement.textContent = message.name || "Member";

      const timeElement = document.createElement("time");
      timeElement.className = "chatMessageTime";
      timeElement.textContent = formatTime(message.createdAt);

      const textElement = document.createElement("p");
      textElement.className = "chatMessageText";
      textElement.textContent = message.text || "";

      topElement.append(nameElement, timeElement);
      messageElement.append(topElement, textElement);
      chatMessages.appendChild(messageElement);
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  chatButton.addEventListener("click", () => {
    if (chatIsOpen) {
      closeChat();
    } else {
      openChat();
    }
  });

  chatCloseButton.addEventListener("click", closeChat);

  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!currentUser) {
      chatStatus.textContent = "Please wait for authentication";
      return;
    }

    const name = chatNameInput.value.trim().slice(0, 24);
    const text = chatMessageInput.value.trim().slice(0, 300);

    if (!name || !text) {
      return;
    }

    chatNameInput.value = name;
    localStorage.setItem("meldChatName", name);

    chatSendButton.disabled = true;

    try {
      await push(ref(database, "chatMessages"), {
        name,
        text,
        userId: currentUser.uid,
        createdAt: serverTimestamp()
      });

      chatMessageInput.value = "";
      chatMessageInput.focus();
    } catch (error) {
      console.error("Could not send chat message:", error);
      chatStatus.textContent = "Message failed to send";
    } finally {
      chatSendButton.disabled = false;
    }
  });

  onAuthStateChanged(auth, (user) => {
    currentUser = user;

    if (user) {
      chatStatus.textContent = "Connected";
    } else {
      chatStatus.textContent = "Sign in to chat";
    }
  });

  onValue(
    messagesRef,
    (snapshot) => {
      const previousMessages = chatMessages.querySelectorAll(".chatMessage").length;
      const nextMessages = snapshot.size;

      if (!firstMessageLoad && nextMessages > previousMessages && !chatIsOpen) {
        unreadCount += nextMessages - previousMessages;
        updateUnreadBadge();
      }

      firstMessageLoad = false;
      renderMessages(snapshot);
      chatStatus.textContent = currentUser ? "Connected" : "Sign in to chat";
    },
    (error) => {
      console.error("Could not load chat messages:", error);
      chatStatus.textContent = "Chat unavailable";
    }
  );
}
