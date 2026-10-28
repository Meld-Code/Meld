
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

/* ============================================================
   FIREBASE
   ============================================================ */

const firebaseConfig = {
    apiKey: "AIzaSyCkJJcpdLfWH8XZBuT8tgOkOKuj6ZtEzcY",
    authDomain: "safebucketbypass.firebaseapp.com",
    databaseURL: "https://safebucketbypass-default-rtdb.firebaseio.com",
    projectId: "safebucketbypass",
    storageBucket: "safebucketbypass.firebasestorage.app",
    messagingSenderId: "659506734507",
    appId: "1:659506734507:web:1e4268f7746380b41bdeee"
};

const app = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);

const auth = getAuth(app);
const database = getDatabase(app);

/* ============================================================
   CHAT ELEMENTS
   ============================================================ */

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
const MAX_MESSAGES = 100;

const requiredElements = [
    chatButton,
    chatPanel,
    chatCloseButton,
    chatForm,
    chatNameInput,
    chatMessageInput,
    chatSendButton,
    chatMessages,
    chatStatus
];

if (requiredElements.some(element => !element)) {
    console.error(
        "Meld Chat: Required HTML elements are missing. Check your chat HTML IDs."
    );
} else {
    initializeChat();
}

/* ============================================================
   CHAT APPLICATION
   ============================================================ */

function initializeChat() {
    let currentUser = null;
    let profile = null;
    let chatIsOpen = false;
    let unreadCount = 0;
    let firstMessageLoad = true;
    let stopMessagesListener = null;
    let lastMessageIds = new Set();

    let authSessionNumber = 0;

    const messagesQuery = query(
        ref(database, "chatMessages"),
        orderByChild("createdAt"),
        limitToLast(MAX_MESSAGES)
    );

    chatNameInput.readOnly = true;
    chatNameInput.placeholder = "Your Meld username";
    chatMessageInput.maxLength = MAX_MESSAGE_LENGTH;

    chatSendButton.disabled = true;
    chatNameInput.disabled = true;
    chatMessageInput.disabled = true;

    /* --------------------------------------------------------
       OPEN AND CLOSE
       -------------------------------------------------------- */

    function openChat() {
        chatIsOpen = true;
        chatPanel.hidden = false;

        unreadCount = 0;
        updateUnreadBadge();

        if (currentUser && profile) {
            chatMessageInput.focus();
        }
    }

    function closeChat() {
        chatIsOpen = false;
        chatPanel.hidden = true;
    }

    chatButton.addEventListener("click", () => {
        if (chatIsOpen) {
            closeChat();
        } else {
            openChat();
        }
    });

    chatCloseButton.addEventListener("click", closeChat);

    /* --------------------------------------------------------
       STATUS AND UNREAD BADGE
       -------------------------------------------------------- */

    function setStatus(message) {
        chatStatus.textContent = message;
    }

    function updateUnreadBadge() {
        if (!chatUnreadBadge) return;

        chatUnreadBadge.hidden = unreadCount <= 0;
        chatUnreadBadge.textContent =
            unreadCount > 99 ? "99+" : String(unreadCount);
    }

    /* --------------------------------------------------------
       AUTHENTICATION MESSAGES
       -------------------------------------------------------- */

    function showMessage(message) {
        chatMessages.replaceChildren();

        const paragraph = document.createElement("p");
        paragraph.className = "chatEmptyMessage";
        paragraph.textContent = message;

        chatMessages.appendChild(paragraph);
    }

    function showLoginPrompt() {
        showMessage("Please sign in to read and send chat messages.");

        chatNameInput.value = "";
        chatNameInput.disabled = true;
        chatMessageInput.disabled = true;
        chatSendButton.disabled = true;

        setStatus("Sign in to chat");
    }

    /* --------------------------------------------------------
       TIME FORMATTING
       -------------------------------------------------------- */

    function formatTime(timestamp) {
        if (typeof timestamp !== "number") {
            return "Sending...";
        }

        return new Date(timestamp).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
    }

    /* --------------------------------------------------------
       DISPLAY MESSAGES
       -------------------------------------------------------- */

    function renderMessages(snapshot) {
        chatMessages.replaceChildren();

        const messages = [];

        snapshot.forEach(messageSnapshot => {
            const message = messageSnapshot.val();

            if (!message) return;

            if (
                typeof message.createdAt !== "number" ||
                Date.now() - message.createdAt >= CHAT_LIFETIME
            ) {
                // Only attempt automatic cleanup of your own expired messages.
                if (
                    currentUser &&
                    message.userId === currentUser.uid &&
                    typeof message.createdAt === "number" &&
                    Date.now() - message.createdAt >= CHAT_LIFETIME
                ) {
                    remove(
                        ref(database, `chatMessages/${messageSnapshot.key}`)
                    ).catch(error => {
                        console.warn("Expired message cleanup failed:", error);
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
            showMessage("No messages yet. Start the conversation!");
            return;
        }

        messages.forEach(message => {
            const article = document.createElement("article");
            article.className = "chatMessage";

            const isOwnMessage =
                Boolean(currentUser) &&
                message.userId === currentUser.uid;

            if (isOwnMessage) {
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

            top.append(name, rank, time);

            const text = document.createElement("p");
            text.className = "chatMessageText";
            text.textContent = message.text || "";

            article.append(top, text);

            // Only show the delete button for the signed-in sender.
            if (isOwnMessage) {
                const deleteButton = document.createElement("button");

                deleteButton.type = "button";
                deleteButton.className = "chatDeleteButton";
                deleteButton.textContent = "Delete";

                deleteButton.addEventListener("click", async () => {
                    deleteButton.disabled = true;
                    setStatus("Deleting message...");

                    try {
                        await remove(
                            ref(database, `chatMessages/${message.id}`)
                        );

                        setStatus("Message deleted");
                    } catch (error) {
                        console.error("Could not delete message:", error);
                        setStatus("Could not delete message");
                        deleteButton.disabled = false;
                    }
                });

                article.appendChild(deleteButton);
            }

            chatMessages.appendChild(article);
        });

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    /* --------------------------------------------------------
       REAL-TIME MESSAGE LISTENER
       -------------------------------------------------------- */

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

    function startMessagesListener() {
        if (stopMessagesListener || !currentUser || !profile) {
            return;
        }

        stopMessagesListener = onValue(
            messagesQuery,
            snapshot => {
                if (!currentUser || !profile) return;

                const currentIds = new Set();

                snapshot.forEach(item => {
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
                        if (!lastMessageIds.has(id)) {
                            unreadCount++;
                        }
                    }

                    updateUnreadBadge();
                }

                lastMessageIds = currentIds;
                firstMessageLoad = false;

                renderMessages(snapshot);
                setStatus("Connected");
            },
            error => {
                console.error("Could not load chat messages:", error);
                setStatus("Chat unavailable. Check Firebase permissions.");
            }
        );
    }

    /* --------------------------------------------------------
       SEND MESSAGE
       -------------------------------------------------------- */

    chatForm.addEventListener("submit", async event => {
        event.preventDefault();

        if (!currentUser || !profile) {
            setStatus("Please sign in to chat");
            return;
        }

        const userId = currentUser.uid;
        const name = String(profile.username || "").trim();
        const rank = String(profile.rank || "Member").trim();
        const text = chatMessageInput.value
            .trim()
            .slice(0, MAX_MESSAGE_LENGTH);

        if (!name) {
            setStatus("Your Meld username is missing");
            return;
        }

        if (!text) return;

        chatSendButton.disabled = true;
        setStatus("Sending...");

        try {
            await push(ref(database, "chatMessages"), {
                name,
                rank,
                text,
                userId,
                createdAt: serverTimestamp()
            });

            chatMessageInput.value = "";
            setStatus("Connected");

            if (chatIsOpen) {
                chatMessageInput.focus();
            }
        } catch (error) {
            console.error("Could not send chat message:", error);

            setStatus("Message failed to send. Check Firebase rules.");
        } finally {
            chatSendButton.disabled =
                !currentUser || !profile || !chatMessageInput.value.trim() && false;

            // Keep sending available even when the message input is empty.
            chatSendButton.disabled = !currentUser || !profile;
        }
    });

    /* --------------------------------------------------------
       SIGN-IN / SIGN-OUT AND PROFILE LOADING
       -------------------------------------------------------- */

    onAuthStateChanged(auth, async user => {
        const session = ++authSessionNumber;

        stopListening();

        currentUser = user;
        profile = null;

        chatNameInput.value = "";
        chatNameInput.disabled = true;
        chatMessageInput.disabled = true;
        chatSendButton.disabled = true;

        if (!user) {
            showLoginPrompt();
            return;
        }

        setStatus("Loading your Meld profile...");

        try {
            const profileSnapshot = await get(
                ref(database, `users/${user.uid}`)
            );

            // Ignore results from an older login session.
            if (
                session !== authSessionNumber ||
                auth.currentUser?.uid !== user.uid
            ) {
                return;
            }

            if (!profileSnapshot.exists()) {
                showLoginPrompt();
                setStatus("Finish setting up your Meld profile");
                return;
            }

            const savedProfile = profileSnapshot.val();

            if (
                !savedProfile ||
                typeof savedProfile.username !== "string" ||
                !savedProfile.username.trim()
            ) {
                showLoginPrompt();
                setStatus("Your Meld profile needs a username");
                return;
            }

            profile = savedProfile;

            chatNameInput.value = profile.username;
            chatNameInput.disabled = false;

            chatMessageInput.disabled = false;
            chatSendButton.disabled = false;

            setStatus("Connecting to chat...");
            startMessagesListener();
        } catch (error) {
            console.error("Could not load Meld profile:", error);

            if (session !== authSessionNumber) return;

            showLoginPrompt();
            setStatus("Could not load your profile");
        }
    });

    /* --------------------------------------------------------
       DRAGGABLE CHAT WINDOW
       -------------------------------------------------------- */

    const dragHandle = chatPanel.querySelector(".chatHeader");

    if (dragHandle) {
        dragHandle.style.cursor = "grab";
        dragHandle.style.touchAction = "none";

        let dragging = false;
        let startX = 0;
        let startY = 0;
        let startLeft = 0;
        let startTop = 0;

        dragHandle.addEventListener("pointerdown", event => {
            if (event.target.closest("button, input, textarea")) {
                return;
            }

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

        dragHandle.addEventListener("pointermove", event => {
            if (!dragging) return;

            const maxLeft = Math.max(
                0,
                window.innerWidth - chatPanel.offsetWidth
            );

            const maxTop = Math.max(
                0,
                window.innerHeight - chatPanel.offsetHeight
            );

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
        dragHandle.addEventListener("lostpointercapture", stopDragging);
    }

    console.log("Meld Chat initialized.");
}
