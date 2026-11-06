
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
    set,
    onDisconnect,
    serverTimestamp
} from
    "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

import {
    getStorage,
    ref as storageRef,
    uploadBytes,
    getDownloadURL
} from
    "https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js";

/* ============================================================
   FIREBASE CONFIGURATION
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
const storage = getStorage(app);

/* ============================================================
   CONFIGURATION
============================================================ */

const CONFIG = {
    MESSAGE_LIFETIME: 24 * 60 * 60 * 1000,
    MAX_MESSAGE_LENGTH: 300,
    MAX_MESSAGES: 100,
    MAX_IMAGE_SIZE: 5 * 1024 * 1024,
    ALLOWED_IMAGE_TYPES: [
        "image/png",
        "image/jpeg",
        "image/gif",
        "image/webp"
    ]
};

/* ============================================================
   HTML ELEMENTS
============================================================ */

const elements = {
    button: document.getElementById("chatButton"),
    panel: document.getElementById("chatPanel"),
    close: document.getElementById("chatCloseButton"),
    form: document.getElementById("chatForm"),
    name: document.getElementById("chatNameInput"),
    input: document.getElementById("chatMessageInput"),
    send: document.getElementById("chatSendButton"),
    messages: document.getElementById("chatMessages"),
    status: document.getElementById("chatStatus"),
    unread: document.getElementById("chatUnreadBadge")
};

const requiredElements = [
    elements.button,
    elements.panel,
    elements.close,
    elements.form,
    elements.name,
    elements.input,
    elements.send,
    elements.messages,
    elements.status
];

if (requiredElements.some(element => !element)) {
    console.error(
        "Meld Chat: Missing required HTML elements. Check your chat HTML IDs."
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
    let stopPresenceListener = null;
    let stopTypingListener = null;

    let lastMessageIds = new Set();
    let authSessionNumber = 0;
    let typingTimeout = null;
    let isSending = false;

    const messagesRef = ref(database, "chatMessages");

    const messagesQuery = query(
        messagesRef,
        orderByChild("createdAt"),
        limitToLast(CONFIG.MAX_MESSAGES)
    );

    /* ========================================================
       INITIAL SETUP
    ======================================================== */

    elements.button.type = "button";
    elements.button.setAttribute("aria-label", "Open chat");
    elements.button.setAttribute("aria-expanded", "false");

    elements.panel.hidden = true;

    elements.name.readOnly = true;
    elements.name.placeholder = "Your Meld username";

    elements.input.maxLength = CONFIG.MAX_MESSAGE_LENGTH;

    elements.send.disabled = true;
    elements.name.disabled = true;
    elements.input.disabled = true;

    /* ========================================================
       ADD IMAGE UPLOAD CONTROLS
    ======================================================== */

    const imageButton = document.createElement("button");
    imageButton.type = "button";
    imageButton.className = "chatImageButton";
    imageButton.textContent = "Image";
    imageButton.setAttribute("aria-label", "Upload an image");

    const imageInput = document.createElement("input");
    imageInput.type = "file";
    imageInput.accept = "image/png,image/jpeg,image/gif,image/webp";
    imageInput.hidden = true;

    const imagePreview = document.createElement("div");
    imagePreview.className = "chatImagePreview";
    imagePreview.hidden = true;

    const typingIndicator = document.createElement("div");
    typingIndicator.className = "chatTypingIndicator";
    typingIndicator.setAttribute("aria-live", "polite");

    const onlineIndicator = document.createElement("span");
    onlineIndicator.className = "chatOnlineIndicator";

    const toolbar = document.createElement("div");
    toolbar.className = "chatToolbar";

    toolbar.append(imageButton, imageInput);

    elements.form.insertBefore(toolbar, elements.input);
    elements.form.insertBefore(imagePreview, elements.input);
    elements.panel.appendChild(typingIndicator);

    if (elements.status.parentElement) {
        elements.status.parentElement.appendChild(onlineIndicator);
    }

    let selectedImage = null;

    imageButton.addEventListener("click", () => {
        if (!currentUser || !profile) return;
        imageInput.click();
    });

    imageInput.addEventListener("change", () => {
        const file = imageInput.files?.[0];

        if (!file) return;

        if (!CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
            setStatus("That image format is not supported");
            imageInput.value = "";
            return;
        }

        if (file.size > CONFIG.MAX_IMAGE_SIZE) {
            setStatus("Images must be smaller than 5 MB");
            imageInput.value = "";
            return;
        }

        selectedImage = file;

        imagePreview.replaceChildren();

        const image = document.createElement("img");
        image.src = URL.createObjectURL(file);
        image.alt = "Selected image preview";

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "Remove";

        removeButton.addEventListener("click", clearSelectedImage);

        imagePreview.append(image, removeButton);
        imagePreview.hidden = false;

        updateSendButtonState();
    });

    function clearSelectedImage() {
        const previewImage = imagePreview.querySelector("img");

        if (previewImage?.src.startsWith("blob:")) {
            URL.revokeObjectURL(previewImage.src);
        }

        selectedImage = null;
        imageInput.value = "";
        imagePreview.replaceChildren();
        imagePreview.hidden = true;

        updateSendButtonState();
    }

    /* ========================================================
       CHAT OPEN / CLOSE
    ======================================================== */

    function openChat() {
        chatIsOpen = true;
        elements.panel.hidden = false;

        unreadCount = 0;
        updateUnreadBadge();

        elements.button.setAttribute("aria-expanded", "true");

        if (currentUser && profile) {
            requestAnimationFrame(() => elements.input.focus());
        }
    }

    function closeChat() {
        chatIsOpen = false;
        elements.panel.hidden = true;

        elements.button.setAttribute("aria-expanded", "false");
    }

    elements.button.addEventListener("click", () => {
        chatIsOpen ? closeChat() : openChat();
    });

    elements.close.addEventListener("click", closeChat);

    /* ========================================================
       STATUS
    ======================================================== */

    function setStatus(message) {
        elements.status.textContent = message;
    }

    function updateUnreadBadge() {
        if (!elements.unread) return;

        elements.unread.hidden = unreadCount <= 0;

        elements.unread.textContent =
            unreadCount > 99 ? "99+" : String(unreadCount);

        elements.button.setAttribute(
            "aria-label",
            unreadCount > 0
                ? `Open chat, ${unreadCount} unread messages`
                : chatIsOpen
                    ? "Close chat"
                    : "Open chat"
        );
    }

    function updateSendButtonState() {
        const hasText = elements.input.value.trim().length > 0;

        elements.send.disabled =
            !currentUser ||
            !profile ||
            isSending ||
            (!hasText && !selectedImage);
    }

    /* ========================================================
       EMPTY STATES
    ======================================================== */

    function showMessage(message) {
        elements.messages.replaceChildren();

        const paragraph = document.createElement("p");
        paragraph.className = "chatEmptyMessage";
        paragraph.textContent = message;

        elements.messages.appendChild(paragraph);
    }

    function showLoginPrompt() {
        showMessage("Please sign in to read and send chat messages.");

        elements.name.value = "";
        elements.name.disabled = true;

        elements.input.disabled = true;
        elements.send.disabled = true;
        imageButton.disabled = true;

        setStatus("Sign in to chat");
    }

    /* ========================================================
       TIME FORMATTING
    ======================================================== */

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

    /* ========================================================
       IMAGE UPLOAD
    ======================================================== */

    async function uploadChatImage(file, userId) {
        const extension = file.name.split(".").pop().toLowerCase();

        const imagePath =
            `chatImages/${userId}/${Date.now()}_${crypto.randomUUID()}.${extension}`;

        const imageReference = storageRef(storage, imagePath);

        const uploadedFile = await uploadBytes(
            imageReference,
            file,
            {
                contentType: file.type
            }
        );

        return await getDownloadURL(uploadedFile.ref);
    }

    /* ========================================================
       DISPLAY MESSAGES
    ======================================================== */

    function renderMessages(snapshot) {
        elements.messages.replaceChildren();

        const messages = [];

        snapshot.forEach(messageSnapshot => {
            const message = messageSnapshot.val();

            if (!message) return;

            if (
                typeof message.createdAt !== "number" ||
                Date.now() - message.createdAt >= CONFIG.MESSAGE_LIFETIME
            ) {
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

        for (const message of messages) {
            const article = document.createElement("article");
            article.className = "chatMessage";

            const isOwnMessage =
                currentUser &&
                message.userId === currentUser.uid;

            if (isOwnMessage) {
                article.classList.add("chatMessageOwn");
            }

            /* Message header */

            const top = document.createElement("div");
            top.className = "chatMessageTop";

            const identity = document.createElement("div");
            identity.className = "chatMessageIdentity";

            const name = document.createElement("span");
            name.className = "chatMessageName";
            name.textContent = message.name || "Member";

            const rank = document.createElement("span");
            rank.className = "chatMessageRank";
            rank.textContent = message.rank || "Member";

            identity.append(name, rank);

            const time = document.createElement("time");
            time.className = "chatMessageTime";
            time.textContent = formatTime(message.createdAt);

            top.append(identity, time);
            article.appendChild(top);

            /* Text */

            if (message.text) {
                const text = document.createElement("p");
                text.className = "chatMessageText";
                text.textContent = message.text;

                article.appendChild(text);
            }

            /* Image */

            if (message.imageUrl) {
                const imageLink = document.createElement("a");
                imageLink.href = message.imageUrl;
                imageLink.target = "_blank";
                imageLink.rel = "noopener noreferrer";

                const image = document.createElement("img");
                image.className = "chatMessageImage";
                image.src = message.imageUrl;
                image.alt = "Image shared in chat";
                image.loading = "lazy";

                image.onerror = () => {
                    image.alt = "Image could not be loaded";
                };

                imageLink.appendChild(image);
                article.appendChild(imageLink);
            }

            /* Delete own messages */

            if (isOwnMessage) {
                const deleteButton = document.createElement("button");

                deleteButton.type = "button";
                deleteButton.className = "chatDeleteButton";
                deleteButton.textContent = "Delete";

                deleteButton.addEventListener("click", async () => {
                    if (!currentUser) return;

                    deleteButton.disabled = true;
                    setStatus("Deleting message...");

                    try {
                        await remove(
                            ref(database, `chatMessages/${message.id}`)
                        );

                        setStatus("Message deleted");
                    } catch (error) {
                        console.error("Message deletion failed:", error);

                        setStatus("Could not delete message");
                        deleteButton.disabled = false;
                    }
                });

                article.appendChild(deleteButton);
            }

            elements.messages.appendChild(article);
        }

        elements.messages.scrollTop = elements.messages.scrollHeight;
    }

    /* ========================================================
       REAL-TIME MESSAGES
    ======================================================== */

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
                        Date.now() - message.createdAt < CONFIG.MESSAGE_LIFETIME
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
                console.error("Message listener failed:", error);

                setStatus("Chat unavailable. Check Firebase permissions.");
            }
        );
    }

    /* ========================================================
       ONLINE PRESENCE
    ======================================================== */

    function startPresence() {
        if (!currentUser) return;

        const userPresenceRef = ref(
            database,
            `presence/${currentUser.uid}`
        );

        const presenceData = {
            username: profile.username,
            online: true,
            lastChanged: serverTimestamp()
        };

        set(userPresenceRef, presenceData)
            .then(() => {
                onDisconnect(userPresenceRef).set({
                    username: profile.username,
                    online: false,
                    lastChanged: serverTimestamp()
                });
            })
            .catch(error => {
                console.warn("Presence setup failed:", error);
            });

        stopPresenceListener = onValue(
            ref(database, "presence"),

            snapshot => {
                let onlineCount = 0;

                snapshot.forEach(userSnapshot => {
                    if (userSnapshot.val()?.online === true) {
                        onlineCount++;
                    }
                });

                onlineIndicator.textContent =
                    `${onlineCount} online`;

            },

            error => {
                console.warn("Presence listener failed:", error);
            }
        );
    }

    function stopPresence() {
        if (stopPresenceListener) {
            stopPresenceListener();
            stopPresenceListener = null;
        }

        if (currentUser) {
            remove(
                ref(database, `presence/${currentUser.uid}`)
            ).catch(() => {});
        }

        onlineIndicator.textContent = "";
    }

    /* ========================================================
       TYPING INDICATORS
    ======================================================== */

    function startTypingListener() {
        if (!currentUser) return;

        stopTypingListener = onValue(
            ref(database, "chatTyping"),

            snapshot => {
                const typingUsers = [];

                snapshot.forEach(userSnapshot => {
                    const data = userSnapshot.val();

                    if (
                        userSnapshot.key !== currentUser.uid &&
                        data?.typing === true &&
                        data.username
                    ) {
                        typingUsers.push(data.username);
                    }
                });

                if (typingUsers.length === 1) {
                    typingIndicator.textContent =
                        `${typingUsers[0]} is typing...`;
                } else if (typingUsers.length > 1) {
                    typingIndicator.textContent =
                        "Several people are typing...";
                } else {
                    typingIndicator.textContent = "";
                }
            },

            error => {
                console.warn("Typing listener failed:", error);
            }
        );
    }

    function updateTypingStatus() {
        if (!currentUser || !profile) return;

        const typingRef = ref(
            database,
            `chatTyping/${currentUser.uid}`
        );

        const hasText = elements.input.value.trim().length > 0;

        if (hasText) {
            set(typingRef, {
                username: profile.username,
                typing: true
            }).catch(() => {});

            clearTimeout(typingTimeout);

            typingTimeout = setTimeout(() => {
                remove(typingRef).catch(() => {});
            }, 2500);
        } else {
            clearTimeout(typingTimeout);
            remove(typingRef).catch(() => {});
        }
    }

    function stopTyping() {
        clearTimeout(typingTimeout);

        if (currentUser) {
            remove(
                ref(database, `chatTyping/${currentUser.uid}`)
            ).catch(() => {});
        }

        if (stopTypingListener) {
            stopTypingListener();
            stopTypingListener = null;
        }

        typingIndicator.textContent = "";
    }

    elements.input.addEventListener("input", () => {
        updateSendButtonState();
        updateTypingStatus();
    });

    /* ========================================================
       SEND MESSAGES
    ======================================================== */

    elements.form.addEventListener("submit", async event => {
        event.preventDefault();

        if (!currentUser || !profile || isSending) {
            return;
        }

        const userId = currentUser.uid;

        const text = elements.input.value
            .trim()
            .slice(0, CONFIG.MAX_MESSAGE_LENGTH);

        const imageFile = selectedImage;

        if (!text && !imageFile) {
            updateSendButtonState();
            return;
        }

        isSending = true;
        updateSendButtonState();

        setStatus(imageFile ? "Uploading image..." : "Sending...");

        try {
            let imageUrl = null;

            if (imageFile) {
                imageUrl = await uploadChatImage(imageFile, userId);
            }

            await push(messagesRef, {
                userId,
                name: profile.username,
                rank: profile.rank || "Member",
                text,
                imageUrl,
                createdAt: serverTimestamp()
            });

            elements.input.value = "";

            clearSelectedImage();
            stopTyping();

            setStatus("Connected");

            if (chatIsOpen) {
                elements.input.focus();
            }

        } catch (error) {
            console.error("Message sending failed:", error);

            setStatus(
                "Could not send message. Check your Firebase rules and Storage permissions."
            );
        } finally {
            isSending = false;
            updateSendButtonState();
        }
    });

    /* ========================================================
       AUTHENTICATION AND PROFILE
    ======================================================== */

    onAuthStateChanged(auth, async user => {
        const session = ++authSessionNumber;

        stopListening();
        stopPresence();
        stopTyping();

        currentUser = user;
        profile = null;

        elements.name.value = "";
        elements.name.disabled = true;

        elements.input.value = "";
        elements.input.disabled = true;

        elements.send.disabled = true;
        imageButton.disabled = true;

        clearSelectedImage();

        if (!user) {
            showLoginPrompt();
            return;
        }

        setStatus("Loading your Meld profile...");

        try {
            const profileSnapshot = await get(
                ref(database, `users/${user.uid}`)
            );

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

            elements.name.value = profile.username;
            elements.name.disabled = false;

            elements.input.disabled = false;
            imageButton.disabled = false;

            updateSendButtonState();

            setStatus("Connecting to chat...");

            startMessagesListener();
            startPresence();
            startTypingListener();

        } catch (error) {
            console.error("Profile loading failed:", error);

            if (session !== authSessionNumber) return;

            showLoginPrompt();
            setStatus("Could not load your profile");
        }
    });

    /* ========================================================
       DRAGGABLE CHAT WINDOW
    ======================================================== */

    const dragHandle = elements.panel.querySelector(".chatHeader");

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

            const rect = elements.panel.getBoundingClientRect();

            dragging = true;

            startX = event.clientX;
            startY = event.clientY;

            startLeft = rect.left;
            startTop = rect.top;

            elements.panel.style.left = `${rect.left}px`;
            elements.panel.style.top = `${rect.top}px`;

            elements.panel.style.right = "auto";
            elements.panel.style.bottom = "auto";

            dragHandle.style.cursor = "grabbing";

            dragHandle.setPointerCapture(event.pointerId);
        });

        dragHandle.addEventListener("pointermove", event => {
            if (!dragging) return;

            const maxLeft = Math.max(
                0,
                window.innerWidth - elements.panel.offsetWidth
            );

            const maxTop = Math.max(
                0,
                window.innerHeight - elements.panel.offsetHeight
            );

            const left = Math.min(
                maxLeft,
                Math.max(0, startLeft + event.clientX - startX)
            );

            const top = Math.min(
                maxTop,
                Math.max(0, startTop + event.clientY - startY)
            );

            elements.panel.style.left = `${left}px`;
            elements.panel.style.top = `${top}px`;
        });

        function stopDragging() {
            dragging = false;
            dragHandle.style.cursor = "grab";
        }

        dragHandle.addEventListener("pointerup", stopDragging);
        dragHandle.addEventListener("pointercancel", stopDragging);
        dragHandle.addEventListener("lostpointercapture", stopDragging);
    }

    /* ========================================================
       CLEANUP
    ======================================================== */

    window.addEventListener("beforeunload", () => {
        stopTyping();
        stopListening();

        if (currentUser) {
            remove(
                ref(database, `presence/${currentUser.uid}`)
            ).catch(() => {});
        }
    });

    console.log("Meld Chat initialized successfully.");
}
