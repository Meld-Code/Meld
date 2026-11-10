import { initializeApp, getApps, getApp } from
  "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
  getDatabase,
  ref,
  get,
  set,
  update,
  push,
  remove,
  onValue,
  onDisconnect,
  serverTimestamp,
  query,
  orderByChild,
  limitToLast
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js";

/* 
   FIREBASE
 */

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
const database = getDatabase(app);
const storage = getStorage(app);

const CONFIG = {
  DEFAULT_SERVER_ID: "meld-community",
  DEFAULT_CHANNEL_ID: "general",
  MAX_MESSAGES: 100,
  MAX_MESSAGE_LENGTH: 3000,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ["image/png", "image/jpeg", "image/gif", "image/webp"]
};

const $ = id => document.getElementById(id);

const elements = {
  button: $("chatButton"),
  panel: $("chatPanel"),
  close: $("chatCloseButton"),
  form: $("chatForm"),
  input: $("chatMessageInput"),
  send: $("chatSendButton"),
  messages: $("chatMessages"),
  unread: $("chatUnreadBadge"),
  currentAvatar: $("chatCurrentAvatar"),
  currentName: $("chatCurrentName"),
  currentStatus: $("chatCurrentStatus"),
  roomIcon: $("chatRoomIcon"),
  roomName: $("chatRoomName"),
  roomDescription: $("chatRoomDescription"),
  typing: $("chatTypingIndicator"),
  uploadButton: $("chatUploadButton"),
  imageInput: $("chatImageInput"),
  imagePreview: $("chatAttachmentPreview"),
  emojiButton: $("chatEmojiButton"),
  searchButton: $("chatSearchButton"),
  searchBar: $("chatSearchBar"),
  searchInput: $("chatSearchInput"),
  searchClose: $("chatSearchClose"),
  membersButton: $("chatMembersButton"),
  membersPanel: $("chatMembersPanel"),
  memberCount: $("chatMemberCount"),
  onlineMembers: $("chatOnlineMembers"),
  offlineMembers: $("chatOfflineMembers"),
  serverList: $("chatServerList"),
  homeServerButton: document.querySelector('[data-server="home"]'),
  addServerButton: $("chatAddServerButton"),
  discoverButton: $("chatDiscoverButton"),
  title: $("chatTitle"),
  channelSection: $("chatChannelSection"),
  textChannels: $("chatTextChannels"),
  addChannelButton: $("chatAddChannelButton"),
  voiceChannels: $("chatVoiceChannels"),
  addVoiceChannelButton: $("chatAddVoiceChannelButton"),
  dmList: $("chatDMList"),
  newDMButton: $("chatNewDMButton"),
  navItems: [...document.querySelectorAll(".chatNavItem[data-view]")],
  friendsView: $("chatFriendsView"),
  friendsList: $("chatFriendsList"),
  addFriendButton: $("chatAddFriendButton"),
  friendTabs: [...document.querySelectorAll("[data-friend-tab]")],
  activityView: $("chatActivityView"),
  activityList: $("chatActivityList"),
  settingsButton: $("chatUserSettings"),
  settingsModal: $("chatSettingsModal"),
  settingsClose: $("chatSettingsClose"),
  nameInput: $("chatNameInput"),
  statusSelect: $("chatStatusSelect"),
  saveSettings: $("chatSaveSettings"),
  addFriendModal: $("chatAddFriendModal"),
  addFriendClose: $("chatAddFriendClose"),
  friendUsername: $("chatFriendUsername"),
  sendFriendRequest: $("chatSendFriendRequest"),
  voicePanel: $("chatVoicePanel"),
  voiceClose: $("chatVoiceClose"),
  voiceDisconnect: $("chatVoiceDisconnect"),
  voiceMute: $("chatVoiceMute"),
  voiceDeafen: $("chatVoiceDeafen")
};

const requiredElements = [
  elements.button,
  elements.panel,
  elements.close,
  elements.form,
  elements.input,
  elements.send,
  elements.messages,
  elements.roomName,
  elements.currentName
];

if (requiredElements.some(element => !element)) {
  console.error("Meld Chat could not start: one or more required chat HTML elements are missing.");
} else {
  initializeChat();
}

function initializeChat() {
  let currentUser = null;
  let profile = null;
  let chatIsOpen = false;
  let isSending = false;
  let selectedImage = null;
  let unreadCount = 0;
  let firstRoomSnapshot = true;
  let currentServerId = CONFIG.DEFAULT_SERVER_ID;
  let currentChannelId = CONFIG.DEFAULT_CHANNEL_ID;
  let currentRoomId = `${CONFIG.DEFAULT_SERVER_ID}__${CONFIG.DEFAULT_CHANNEL_ID}`;
  let currentRoomType = "channel";
  let currentDMUser = null;
  let friendFilter = "all";
  let authSequence = 0;
  let typingTimer = null;
  let messageCache = [];
  let joinedServers = {};
  let friendData = {};
  let incomingRequests = {};
  let sentRequests = {};
  let currentPresence = {};
  let currentMembers = {};
  let currentChannels = {};
  let channelListener = null;
  let messageListener = null;
  let typingListener = null;
  let friendsListener = null;
  let requestsListener = null;
  let sentRequestsListener = null;
  let userRoomsListener = null;
  let userServersListener = null;
  let presenceListener = null;
  let serverMembersListener = null;
  let memberRenderSequence = 0;
  let friendsRenderSequence = 0;
  let messageUnsubscribeSequence = 0;

  const roomRef = roomId => ref(database, `chatRooms/${roomId}`);
  const messagesRef = (roomId, roomType) => roomType === "dm"
    ? ref(database, `chatDirectMessages/${roomId}`)
    : ref(database, "chatMessages");
  const profileRef = uid => ref(database, `users/${uid}`);

  elements.button.type = "button";
  elements.input.maxLength = CONFIG.MAX_MESSAGE_LENGTH;
  elements.input.required = false;
  elements.panel.hidden = true;
  elements.send.disabled = true;
  elements.input.disabled = true;
  if (elements.imageInput) elements.imageInput.accept = CONFIG.ALLOWED_IMAGE_TYPES.join(",");
  if (elements.voicePanel) elements.voicePanel.hidden = true;

  /* 
     GENERAL HELPERS
  */

  function setNotice(message) {
    if (elements.roomDescription) elements.roomDescription.textContent = message;
  }

  function setEmpty(container, message) {
    if (!container) return;
    const paragraph = document.createElement("p");
    paragraph.className = "chatSidebarEmpty";
    paragraph.textContent = message;
    container.replaceChildren(paragraph);
  }

  function makeButton(className, label, iconClass = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    if (iconClass) {
      const icon = document.createElement("i");
      icon.className = iconClass;
      icon.setAttribute("aria-hidden", "true");
      button.appendChild(icon);
    }
    const text = document.createElement("span");
    text.textContent = label;
    button.appendChild(text);
    return button;
  }

  function safeKey(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 28);
  }

  function displayName(userProfile, fallback = "Member") {
    return userProfile?.displayName || userProfile?.username || fallback;
  }

  function isPermissionDenied(error) {
    const code = String(error?.code || "").toLowerCase();
    return code === "permission_denied" || code === "database/permission-denied" ||
      /permission_denied|permission denied/i.test(String(error?.message || ""));
  }

  function isSafeChatImageUrl(value) {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "https:" && parsed.hostname === "firebasestorage.googleapis.com";
    } catch (_) {
      return false;
    }
  }

  function formatTime(value) {
    const timestamp = Number(value);
    if (!Number.isFinite(timestamp) || timestamp <= 0) return "now";
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function initials(value) {
    return String(value || "?").trim().charAt(0).toUpperCase() || "?";
  }

  function updateUnreadBadge() {
    if (!elements.unread) return;
    elements.unread.hidden = unreadCount < 1;
    elements.unread.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
    elements.button.setAttribute(
      "aria-label",
      unreadCount > 0 ? `Open chat, ${unreadCount} unread messages` :
        chatIsOpen ? "Close chat" : "Open chat"
    );
  }

  function openChat() {
    chatIsOpen = true;
    elements.panel.hidden = false;
    unreadCount = 0;
    updateUnreadBadge();
    elements.button.setAttribute("aria-expanded", "true");
    if (currentUser) requestAnimationFrame(() => elements.input.focus());
  }

  function closeChat() {
    chatIsOpen = false;
    elements.panel.hidden = true;
    elements.button.setAttribute("aria-expanded", "false");
  }

  function showSignedOutMessage(message = "Sign in to use Meld Chat.") {
    elements.messages.replaceChildren();
    const wrapper = document.createElement("div");
    wrapper.className = "chatWelcome";
    const heading = document.createElement("h3");
    heading.textContent = message;
    const paragraph = document.createElement("p");
    paragraph.textContent = "Your messages, friends, and conversations are tied to your Meld account.";
    const link = document.createElement("a");
    link.href = "./auth.html";
    link.className = "chatLoginLink";
    link.textContent = "Sign in or create an account";
    wrapper.append(heading, paragraph, link);
    elements.messages.appendChild(wrapper);
    elements.input.disabled = true;
    elements.send.disabled = true;
    if (elements.uploadButton) elements.uploadButton.disabled = true;
    if (elements.currentStatus) elements.currentStatus.textContent = "Offline";
    setNotice("Sign in required");
  }

  function setComposerEnabled(enabled) {
    elements.input.disabled = !enabled;
    if (elements.uploadButton) elements.uploadButton.disabled = !enabled;
    if (elements.emojiButton) elements.emojiButton.disabled = !enabled;
    updateSendButton();
  }

  function updateSendButton() {
    if (!elements.send) return;
    const hasText = Boolean(elements.input.value.trim());
    elements.send.disabled = !currentUser || !profile || isSending || (!hasText && !selectedImage);
  }

  function stopListener(name) {
    if (name && typeof name === "function") name();
  }

  function cleanupRoomListeners() {
    messageUnsubscribeSequence++;
    stopListener(messageListener);
    stopListener(typingListener);
    messageListener = null;
    typingListener = null;
    clearTimeout(typingTimer);
    if (currentUser && currentRoomId) {
      remove(ref(database, `chatTyping/${currentRoomId}/${currentUser.uid}`)).catch(() => {});
    }
    if (elements.typing) elements.typing.textContent = "";
  }

  function cleanupUserListeners() {
    [friendsListener, requestsListener, sentRequestsListener, userRoomsListener,
      userServersListener, presenceListener, serverMembersListener, channelListener]
      .forEach(stopListener);
    friendsListener = requestsListener = sentRequestsListener = userRoomsListener = null;
    userServersListener = presenceListener = serverMembersListener = channelListener = null;
    cleanupRoomListeners();
  }

  /*
     IMAGE COMPOSER
  */

  function clearSelectedImage() {
    const preview = elements.imagePreview?.querySelector("img");
    if (preview?.src.startsWith("blob:")) URL.revokeObjectURL(preview.src);
    selectedImage = null;
    if (elements.imageInput) elements.imageInput.value = "";
    if (elements.imagePreview) {
      elements.imagePreview.replaceChildren();
      elements.imagePreview.hidden = true;
    }
    updateSendButton();
  }

  if (elements.uploadButton && elements.imageInput) {
    elements.uploadButton.addEventListener("click", () => {
      if (currentUser) elements.imageInput.click();
    });

    elements.imageInput.addEventListener("change", () => {
      const file = elements.imageInput.files?.[0];
      if (!file) return;

      if (!CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setNotice("Choose a PNG, JPG, GIF, or WebP image.");
        clearSelectedImage();
        return;
      }
      if (file.size > CONFIG.MAX_IMAGE_SIZE) {
        setNotice("Images must be 5 MB or smaller.");
        clearSelectedImage();
        return;
      }

      selectedImage = file;
      const image = document.createElement("img");
      image.src = URL.createObjectURL(file);
      image.alt = "Image attachment preview";
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "chatPreviewRemove";
      removeButton.textContent = "Remove";
      removeButton.addEventListener("click", clearSelectedImage);
      elements.imagePreview.replaceChildren(image, removeButton);
      elements.imagePreview.hidden = false;
      updateSendButton();
    });
  }

  async function uploadImage(file) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "img";
    const randomId = globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const path = `chatImages/${currentUser.uid}/${Date.now()}_${randomId}.${extension}`;
    const destination = storageRef(storage, path);
    await uploadBytes(destination, file, { contentType: file.type });
    return getDownloadURL(destination);
  }

  /* 
     ROOM METADATA AND DEFAULT COMMUNITY
  */

  async function setIfMissing(path, value) {
    const target = ref(database, path);
    let snapshot = null;
    try {
      snapshot = await get(target);
    } catch (error) {

      if (!isPermissionDenied(error)) throw error;
    }
    if (snapshot?.exists()) return snapshot.val();

    try {
      await set(target, value);
      return value;
    } catch (error) {
      if (isPermissionDenied(error)) {
        try {
          const afterWrite = await get(target);
          if (afterWrite.exists()) return afterWrite.val();
        } catch (_) {}
      }
      throw error;
    }
  }

  async function ensureRoomMetadata(id, metadata) {
    await setIfMissing(`chatRooms/${id}`, metadata);
  }

  async function ensureDefaultCommunity(user) {
    await setIfMissing(`chatServers/${CONFIG.DEFAULT_SERVER_ID}`, {
      name: "Meld Community",
      description: "The official Meld community",
      isPublic: true,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      members: { [user.uid]: true }
    });
    await set(ref(database, `chatServers/${CONFIG.DEFAULT_SERVER_ID}/members/${user.uid}`), true);
    await set(ref(database, `chatUserServers/${user.uid}/${CONFIG.DEFAULT_SERVER_ID}`), true);

    await setIfMissing(`chatChannels/${CONFIG.DEFAULT_SERVER_ID}/${CONFIG.DEFAULT_CHANNEL_ID}`, {
      name: "general",
      description: "Chat with the Meld community",
      createdBy: user.uid,
      createdAt: serverTimestamp()
    });

    const defaultRoomId = `${CONFIG.DEFAULT_SERVER_ID}__${CONFIG.DEFAULT_CHANNEL_ID}`;
    await ensureRoomMetadata(defaultRoomId, {
      type: "channel",
      name: "general",
      serverId: CONFIG.DEFAULT_SERVER_ID,
      channelId: CONFIG.DEFAULT_CHANNEL_ID,
      isPublic: true,
      createdBy: user.uid,
      createdAt: serverTimestamp()
    });
  }

  async function joinServer(serverId) {
    if (!currentUser) return;
    const snapshot = await get(ref(database, `chatServers/${serverId}`));
    if (!snapshot.exists()) throw new Error("That server could not be found.");
    const server = snapshot.val();
    if (server.isPublic !== true && server.members?.[currentUser.uid] !== true) {
      throw new Error("This server is private.");
    }
    await set(ref(database, `chatServers/${serverId}/members/${currentUser.uid}`), true);
    await set(ref(database, `chatUserServers/${currentUser.uid}/${serverId}`), true);
    return server;
  }

  /* 
     SERVER AND CHANNEL NAVIGATION
 */

  function renderServers() {
    if (!elements.serverList) return;
    elements.serverList.replaceChildren();
    const entries = Object.entries(joinedServers).filter(([serverId]) => serverId !== CONFIG.DEFAULT_SERVER_ID);
    elements.homeServerButton?.classList.toggle("active", currentServerId === CONFIG.DEFAULT_SERVER_ID);
    if (!entries.length) return;

    entries.sort(([a], [b]) => a === CONFIG.DEFAULT_SERVER_ID ? -1 : b === CONFIG.DEFAULT_SERVER_ID ? 1 :
      String(joinedServers[a]?.name || a).localeCompare(String(joinedServers[b]?.name || b)));

    for (const [serverId, server] of entries) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `chatServerIcon${serverId === currentServerId ? " active" : ""}`;
      button.title = server.name || "Server";
      button.setAttribute("aria-label", `Open ${server.name || "server"}`);
      const label = document.createElement("span");
      label.className = "chatServerInitial";
      label.textContent = initials(server.name);
      button.appendChild(label);
      button.addEventListener("click", () => selectServer(serverId));
      elements.serverList.appendChild(button);
    }
  }

  function renderChannels() {
    if (!elements.textChannels) return;
    elements.textChannels.replaceChildren();
    const channels = Object.entries(currentChannels);
    if (!channels.length) {
      setEmpty(elements.textChannels, "No text channels yet.");
      return;
    }

    channels.sort(([a], [b]) => a.localeCompare(b));
    for (const [channelId, channel] of channels) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `chatChannelItem${channelId === currentChannelId ? " active" : ""}`;
      button.dataset.channel = channelId;
      const icon = document.createElement("i");
      icon.className = "fa-solid fa-hashtag";
      const label = document.createElement("span");
      label.textContent = channel.name || channelId;
      button.append(icon, label);
      button.addEventListener("click", () => selectChannel(channelId));
      elements.textChannels.appendChild(button);
    }
  }

  function watchChannels(serverId) {
    stopListener(channelListener);
    channelListener = onValue(
      ref(database, `chatChannels/${serverId}`),
      async snapshot => {
        currentChannels = snapshot.val() || {};
        if (!Object.keys(currentChannels).length) {
          currentChannels[CONFIG.DEFAULT_CHANNEL_ID] = {
            name: "general",
            description: "General conversation"
          };
        }
        renderChannels();
        if (!currentChannels[currentChannelId]) {
          const firstChannel = Object.keys(currentChannels).sort()[0] || CONFIG.DEFAULT_CHANNEL_ID;
          await selectChannel(firstChannel);
        } else if (currentRoomId !== `${serverId}__${currentChannelId}`) {
          await selectChannel(currentChannelId);
        }
      },
      error => {
        console.error("Could not load channels:", error);
        setNotice("Could not load this server's channels. Check Firebase rules.");
      }
    );
  }

  async function selectServer(serverId) {
    if (!currentUser || !joinedServers[serverId]) return;
    currentServerId = serverId;
    currentChannelId = "";
    currentRoomType = "channel";
    currentDMUser = null;
    if (elements.title) elements.title.textContent = joinedServers[serverId].name || "Meld Chat";
    if (elements.channelSection) elements.channelSection.hidden = false;
    if (elements.roomIcon) elements.roomIcon.className = "fa-solid fa-hashtag";
    renderServers();
    setNotice(joinedServers[serverId].description || "Community server");
    showView("messages");
    watchChannels(serverId);
    watchServerMembers(serverId);
  }

  async function selectChannel(channelId) {
    if (!currentUser || !currentChannels[channelId]) return;
    currentChannelId = channelId;
    currentRoomType = "channel";
    currentDMUser = null;
    currentRoomId = `${currentServerId}__${channelId}`;
    const channel = currentChannels[channelId];
    elements.roomName.textContent = channel.name || channelId;
    if (elements.roomIcon) elements.roomIcon.className = "fa-solid fa-hashtag";
    if (elements.title) elements.title.textContent = joinedServers[currentServerId]?.name || "Meld Chat";
    if (elements.roomDescription) elements.roomDescription.textContent = channel.description || "Community channel";
    renderChannels();
    await ensureRoomMetadata(currentRoomId, {
      type: "channel",
      name: channel.name || channelId,
      serverId: currentServerId,
      channelId,
      isPublic: joinedServers[currentServerId]?.isPublic === true,
      createdBy: channel.createdBy || joinedServers[currentServerId]?.createdBy || currentUser.uid,
      createdAt: channel.createdAt || serverTimestamp()
    });
    showView("messages");
    watchRoom(currentRoomId);
  }

  async function createServer() {
    if (!currentUser) return;
    const name = window.prompt("Name your new Meld server:");
    if (!name) return;
    const cleanName = name.trim().slice(0, 32);
    const slug = safeKey(cleanName);
    if (!slug) {
      window.alert("Enter a server name with letters or numbers.");
      return;
    }
    const serverId = `server_${slug}_${Date.now().toString(36)}`;
    const roomId = `${serverId}__general`;

    try {
      await set(ref(database, `chatServers/${serverId}`), {
        name: cleanName,
        description: `Welcome to ${cleanName}`,
        isPublic: true,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        members: { [currentUser.uid]: true }
      });
      await set(ref(database, `chatUserServers/${currentUser.uid}/${serverId}`), true);
      await set(ref(database, `chatChannels/${serverId}/general`), {
        name: "general",
        description: `General chat for ${cleanName}`,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp()
      });
      await set(roomRef(roomId), {
        type: "channel",
        name: "general",
        serverId,
        channelId: "general",
        isPublic: true,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp()
      });
      const snapshot = await get(ref(database, `chatServers/${serverId}`));
      joinedServers[serverId] = snapshot.val();
      currentChannels = { general: { name: "general", description: `General chat for ${cleanName}` } };
      await selectServer(serverId);
    } catch (error) {
      console.error("Server creation failed:", error);
      setNotice("Could not create server. Check your Firebase rules.");
    }
  }

  async function discoverServers() {
    if (!currentUser) return;
    try {
      const snapshot = await get(ref(database, "chatServers"));
      const publicServers = Object.entries(snapshot.val() || {})
        .filter(([id, server]) => server?.isPublic === true && !joinedServers[id]);
      if (!publicServers.length) {
        window.alert("There are no other public servers to discover yet.");
        return;
      }
      const list = publicServers.slice(0, 30).map(([id, server], index) =>
        `${index + 1}. ${server.name || id}  (ID: ${id})`
      ).join("\n");
      const selectedId = window.prompt(`Public Meld servers:\n\n${list}\n\nPaste a server ID to join:`);
      if (!selectedId) return;
      const server = await joinServer(selectedId.trim());
      joinedServers[selectedId.trim()] = server;
      renderServers();
      await selectServer(selectedId.trim());
    } catch (error) {
      console.error("Server discovery failed:", error);
      window.alert(error.message || "Could not join that server.");
    }
  }

  async function createChannel() {
    if (!currentUser || !currentServerId) return;
    const name = window.prompt("Channel name (letters, numbers, hyphens):");
    if (!name) return;
    const channelId = safeKey(name);
    if (!channelId) {
      window.alert("Enter a valid channel name.");
      return;
    }
    if (currentChannels[channelId]) {
      window.alert("That channel already exists.");
      return;
    }
    const display = name.trim().replace(/\s+/g, " ").slice(0, 28);
    const roomId = `${currentServerId}__${channelId}`;
    try {
      await set(ref(database, `chatChannels/${currentServerId}/${channelId}`), {
        name: display,
        description: `Chat in #${display}`,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp()
      });
      await set(roomRef(roomId), {
        type: "channel",
        name: display,
        serverId: currentServerId,
        channelId,
        isPublic: joinedServers[currentServerId]?.isPublic === true,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp()
      });
      await selectChannel(channelId);
    } catch (error) {
      console.error("Channel creation failed:", error);
      setNotice("Could not create channel. Check Firebase rules.");
    }
  }

  /* 
     MESSAGES
 */

  function renderMessages() {
    const wasNearBottom = elements.messages.scrollHeight - elements.messages.scrollTop - elements.messages.clientHeight < 90;
    elements.messages.replaceChildren();

    if (!messageCache.length) {
      const welcome = document.createElement("div");
      welcome.className = "chatWelcome";
      const icon = document.createElement("div");
      icon.className = "chatWelcomeIcon";
      const iconElement = document.createElement("i");
      iconElement.className = "fa-solid fa-hashtag";
      icon.appendChild(iconElement);
      const heading = document.createElement("h3");
      heading.textContent = `Welcome to ${currentRoomType === "dm" ? "your conversation" : `#${elements.roomName.textContent}`}`;
      const paragraph = document.createElement("p");
      paragraph.textContent = "This is the beginning of this conversation.";
      welcome.append(icon, heading, paragraph);
      elements.messages.appendChild(welcome);
      return;
    }

    const filter = (elements.searchInput?.value || "").trim().toLowerCase();
    const visibleMessages = filter
      ? messageCache.filter(message => `${message.username || ""} ${message.text || ""}`.toLowerCase().includes(filter))
      : messageCache;

    if (!visibleMessages.length) {
      const empty = document.createElement("p");
      empty.className = "chatEmptyMessage";
      empty.textContent = "No messages match your search.";
      elements.messages.appendChild(empty);
      return;
    }

    for (const message of visibleMessages) {
      const article = document.createElement("article");
      article.className = `chatMessage${message.senderId === currentUser?.uid ? " chatMessageOwn" : ""}`;
      article.dataset.messageId = message.id;

      const top = document.createElement("div");
      top.className = "chatMessageTop";
      const identity = document.createElement("div");
      identity.className = "chatMessageIdentity";
      const name = document.createElement("strong");
      name.className = "chatMessageName";
      name.textContent = message.username || "Member";
      identity.appendChild(name);

      if (message.rank) {
        const rank = document.createElement("span");
        rank.className = "chatMessageRank";
        rank.textContent = message.rank;
        identity.appendChild(rank);
      }

      const time = document.createElement("time");
      time.className = "chatMessageTime";
      time.textContent = formatTime(message.createdAt);
      if (Number(message.createdAt) > 0) time.dateTime = new Date(Number(message.createdAt)).toISOString();
      top.append(identity, time);
      article.appendChild(top);

      if (message.text) {
        const paragraph = document.createElement("p");
        paragraph.className = "chatMessageText";
        paragraph.textContent = message.text;
        article.appendChild(paragraph);
      }

      if (message.imageUrl && isSafeChatImageUrl(message.imageUrl)) {
        const image = document.createElement("img");
        image.className = "chatMessageImage";
        image.src = message.imageUrl;
        image.alt = `Image shared by ${message.username || "a member"}`;
        image.loading = "lazy";
        image.addEventListener("click", () => window.open(message.imageUrl, "_blank", "noopener,noreferrer"));
        article.appendChild(image);
      }

      if (message.senderId === currentUser?.uid) {
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "chatDeleteButton";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", async () => {
          if (!window.confirm("Delete this message?")) return;
          try {
            const messagePath = currentRoomType === "dm"
              ? `chatDirectMessages/${currentRoomId}/${message.id}`
              : `chatMessages/${message.id}`;
            await remove(ref(database, messagePath));
          } catch (error) {
            console.error("Message deletion failed:", error);
            setNotice("Could not delete that message.");
          }
        });
        article.appendChild(deleteButton);
      }

      elements.messages.appendChild(article);
    }

    if (wasNearBottom || firstRoomSnapshot) {
      elements.messages.scrollTop = elements.messages.scrollHeight;
    }
  }

  function watchRoom(roomId) {
    cleanupRoomListeners();
    currentRoomId = roomId;
    firstRoomSnapshot = true;
    messageCache = [];
    const sequence = ++messageUnsubscribeSequence;
    const roomTypeAtSubscribe = currentRoomType;
    const messageQuery = query(messagesRef(roomId, roomTypeAtSubscribe), orderByChild("createdAt"),
      limitToLast(roomTypeAtSubscribe === "dm" ? CONFIG.MAX_MESSAGES : CONFIG.MAX_MESSAGES * 5));

    messageListener = onValue(messageQuery, snapshot => {
      if (sequence !== messageUnsubscribeSequence) return;
      const previousIds = new Set(messageCache.map(message => message.id));
      const nextMessages = [];
      snapshot.forEach(child => {
        const value = child.val();
        if (!value || typeof value !== "object") return;
        const senderId = value.senderId || value.userId || "";
        const belongsToRoom = roomTypeAtSubscribe === "dm"
          || value.roomId === roomId
          || (!value.roomId && roomId === `${CONFIG.DEFAULT_SERVER_ID}__${CONFIG.DEFAULT_CHANNEL_ID}`);
        if (!belongsToRoom) return;
        nextMessages.push({
          id: child.key,
          ...value,
          senderId,
          username: value.username || value.name || "Member"
        });
      });
      nextMessages.sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0));
      if (nextMessages.length > CONFIG.MAX_MESSAGES) {
        nextMessages.splice(0, nextMessages.length - CONFIG.MAX_MESSAGES);
      }

      if (!firstRoomSnapshot && !chatIsOpen) {
        const newMessages = nextMessages.filter(message => !previousIds.has(message.id) && message.senderId !== currentUser?.uid);
        unreadCount += newMessages.length;
        updateUnreadBadge();
      }

      messageCache = nextMessages;
      renderMessages();
      firstRoomSnapshot = false;
    }, error => {
      console.error("Message listener failed:", error);
      setNotice("Messages could not load. Check your Realtime Database rules.");
      elements.messages.replaceChildren();
      const paragraph = document.createElement("p");
      paragraph.className = "chatEmptyMessage";
      paragraph.textContent = "Chat is unavailable until Firebase permissions are fixed.";
      elements.messages.appendChild(paragraph);
    });

    typingListener = onValue(ref(database, `chatTyping/${roomId}`), snapshot => {
      const typers = [];
      snapshot.forEach(child => {
        const data = child.val();
        if (child.key !== currentUser?.uid && data?.typing === true && data.username) typers.push(data.username);
      });
      if (elements.typing) {
        elements.typing.textContent = typers.length === 1 ? `${typers[0]} is typing…` :
          typers.length > 1 ? "Several people are typing…" : "";
      }
    }, error => console.warn("Typing listener failed:", error));
  }

  async function sendMessage(event) {
    event.preventDefault();
    if (!currentUser || !profile || isSending) return;

    const text = elements.input.value.trim().slice(0, CONFIG.MAX_MESSAGE_LENGTH);
    const imageFile = selectedImage;
    if (!text && !imageFile) return;

    isSending = true;
    updateSendButton();
    setNotice(imageFile ? "Uploading image…" : "Sending message…");

    try {
      let imageUrl = "";
      if (imageFile) imageUrl = await uploadImage(imageFile);

      const message = {
        roomId: currentRoomId,
        senderId: currentUser.uid,
        username: displayName(profile, "Member"),
        rank: profile.rank || "Member",
        text,
        imageUrl,
        createdAt: serverTimestamp()
      };

      await push(messagesRef(currentRoomId, currentRoomType), message);
      elements.input.value = "";
      elements.input.style.height = "auto";
      clearSelectedImage();
      await remove(ref(database, `chatTyping/${currentRoomId}/${currentUser.uid}`)).catch(() => {});
      setNotice(currentRoomType === "dm" ? `Conversation with ${currentDMUser?.username || "member"}` :
        currentChannels[currentChannelId]?.description || "Messages are live");
      if (chatIsOpen) elements.input.focus();
    } catch (error) {
      console.error("Message send failed:", error);
      setNotice(error.code === "storage/unauthorized"
        ? "Image upload blocked. Check Firebase Storage rules."
        : "Message could not send. Check Firebase Database and Storage rules.");
    } finally {
      isSending = false;
      updateSendButton();
    }
  }

  elements.form.addEventListener("submit", sendMessage);
  elements.input.addEventListener("input", () => {
    updateSendButton();
    elements.input.style.height = "auto";
    elements.input.style.height = `${Math.min(elements.input.scrollHeight, 140)}px`;
    if (!currentUser || !profile) return;

    const typingRef = ref(database, `chatTyping/${currentRoomId}/${currentUser.uid}`);
    if (elements.input.value.trim()) {
      set(typingRef, { username: displayName(profile), typing: true }).catch(() => {});
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => remove(typingRef).catch(() => {}), 2200);
    } else {
      clearTimeout(typingTimer);
      remove(typingRef).catch(() => {});
    }
  });
  elements.input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      elements.form.requestSubmit();
    }
  });

  /* 
     PRESENCE AND MEMBERS
 */

  function updateCurrentUserCard() {
    if (!profile) return;
    const name = displayName(profile, "Member");
    if (elements.currentName) elements.currentName.textContent = name;
    if (elements.currentAvatar) elements.currentAvatar.textContent = initials(name);
    if (elements.currentStatus) elements.currentStatus.textContent = profile.chatStatus || "Online";
  }

  async function startPresence() {
    if (!currentUser || !profile) return;
    const ownPresenceRef = ref(database, `chatPresence/${currentUser.uid}`);
    const status = profile.chatStatus || "online";
    const presenceRecord = {
      username: displayName(profile),
      status,
      online: status !== "invisible",
      lastSeen: serverTimestamp()
    };
    try {
      await onDisconnect(ownPresenceRef).set({
        username: displayName(profile),
        status: "offline",
        online: false,
        lastSeen: serverTimestamp()
      });
      await set(ownPresenceRef, presenceRecord);
    } catch (error) {
      console.warn("Presence could not be published:", error);
    }

    stopListener(presenceListener);
    presenceListener = onValue(ref(database, "chatPresence"), snapshot => {
      currentPresence = snapshot.val() || {};
      renderMemberLists();
      renderFriends();
      const onlineCount = Object.values(currentPresence).filter(item => item?.online === true).length;
      if (elements.roomDescription && currentRoomType === "channel") {
        const channel = currentChannels[currentChannelId];
        elements.roomDescription.textContent = `${onlineCount} online${channel?.description ? ` · ${channel.description}` : ""}`;
      }
    }, error => console.warn("Presence listener failed:", error));
  }

  function watchServerMembers(serverId) {
    stopListener(serverMembersListener);
    serverMembersListener = onValue(ref(database, `chatServers/${serverId}/members`), snapshot => {
      currentMembers = snapshot.val() || {};
      renderMemberLists();
    }, error => console.warn("Server members could not load:", error));
  }

  async function renderMemberLists() {
    if (!elements.onlineMembers || !elements.offlineMembers) return;
    const sequence = ++memberRenderSequence;
    const ids = Object.keys(currentMembers || {});
    if (elements.memberCount) elements.memberCount.textContent = String(ids.length);
    if (!ids.length) {
      setEmpty(elements.onlineMembers, "No members online.");
      setEmpty(elements.offlineMembers, "No offline members.");
      return;
    }

    const rows = await Promise.all(ids.slice(0, 100).map(async uid => {
      let userProfile = uid === currentUser?.uid ? profile : null;
      if (!userProfile) {
        try {
          const snapshot = await get(profileRef(uid));
          if (snapshot.exists()) userProfile = snapshot.val();
        } catch (_) {}
      }
      const presence = currentPresence[uid] || {};
      return { uid, name: displayName(userProfile, presence.username || "Member"), online: presence.online === true };
    }));
    if (sequence !== memberRenderSequence) return;

    const online = rows.filter(row => row.online);
    const offline = rows.filter(row => !row.online);
    const renderGroup = (container, list, emptyText) => {
      container.replaceChildren();
      if (!list.length) {
        setEmpty(container, emptyText);
        return;
      }
      for (const member of list) {
        const row = document.createElement("div");
        row.className = "chatMemberRow";
        const avatar = document.createElement("span");
        avatar.className = "chatMemberAvatar";
        avatar.textContent = initials(member.name);
        const name = document.createElement("span");
        name.className = "chatMemberName";
        name.textContent = member.name;
        const dot = document.createElement("span");
        dot.className = `chatMemberDot${member.online ? " online" : ""}`;
        row.append(avatar, name, dot);
        container.appendChild(row);
      }
    };
    renderGroup(elements.onlineMembers, online, "No members online.");
    renderGroup(elements.offlineMembers, offline, "No offline members.");
  }

  /* 
     FRIENDS AND DIRECT MESSAGES
 */

  async function readUser(uid) {
    if (uid === currentUser?.uid) return profile;
    const snapshot = await get(profileRef(uid));
    return snapshot.exists() ? snapshot.val() : null;
  }

  function watchFriends() {
    stopListener(friendsListener);
    stopListener(requestsListener);
    stopListener(sentRequestsListener);

    friendsListener = onValue(ref(database, `friends/${currentUser.uid}`), snapshot => {
      friendData = snapshot.val() || {};
      renderFriends();
    }, error => console.warn("Friends could not load:", error));

    requestsListener = onValue(ref(database, `friendRequests/${currentUser.uid}`), snapshot => {
      incomingRequests = snapshot.val() || {};
      renderFriends();
    }, error => console.warn("Friend requests could not load:", error));

    sentRequestsListener = onValue(ref(database, `chatSentRequests/${currentUser.uid}`), snapshot => {
      sentRequests = snapshot.val() || {};
      renderFriends();
    }, error => console.warn("Sent requests could not load:", error));
  }

  async function renderFriends() {
    if (!elements.friendsList) return;
    const sequence = ++friendsRenderSequence;
    elements.friendsList.replaceChildren();
    const rows = [];

    if (friendFilter === "pending") {
      for (const [uid, request] of Object.entries(incomingRequests)) {
        const user = await readUser(uid).catch(() => null);
        rows.push({ kind: "incoming", uid, user, request });
      }
      for (const [uid, request] of Object.entries(sentRequests)) {
        const user = await readUser(uid).catch(() => null);
        rows.push({ kind: "sent", uid, user, request });
      }
    } else if (friendFilter === "blocked") {
      const p = document.createElement("p");
      p.className = "chatSidebarEmpty";
      p.textContent = "You have no blocked users.";
      elements.friendsList.appendChild(p);
      return;
    } else {
      for (const uid of Object.keys(friendData)) {
        const user = await readUser(uid).catch(() => null);
        const online = currentPresence[uid]?.online === true;
        if (friendFilter === "online" && !online) continue;
        rows.push({ kind: "friend", uid, user, online });
      }
    }

    if (sequence !== friendsRenderSequence) return;
    if (!rows.length) {
      const p = document.createElement("p");
      p.className = "chatSidebarEmpty";
      p.textContent = friendFilter === "pending" ? "No pending friend requests." : "No friends yet. Add someone by their Meld username.";
      elements.friendsList.appendChild(p);
      return;
    }

    for (const rowData of rows) {
      const card = document.createElement("div");
      card.className = "chatFriendCard";
      const avatar = document.createElement("span");
      avatar.className = "chatFriendAvatar";
      const name = displayName(rowData.user, rowData.request?.senderUsername || "Member");
      avatar.textContent = initials(name);
      const info = document.createElement("div");
      info.className = "chatFriendInfo";
      const strong = document.createElement("strong");
      strong.textContent = name;
      const detail = document.createElement("span");
      detail.textContent = rowData.kind === "incoming" ? "Sent you a friend request" :
        rowData.kind === "sent" ? "Request sent" : rowData.online ? "Online" : "Offline";
      info.append(strong, detail);
      card.append(avatar, info);

      if (rowData.kind === "incoming") {
        const accept = makeButton("chatSmallAction chatAcceptAction", "Accept");
        accept.addEventListener("click", () => acceptFriendRequest(rowData.uid));
        const decline = makeButton("chatSmallAction chatDeclineAction", "Ignore");
        decline.addEventListener("click", () => declineFriendRequest(rowData.uid));
        card.append(accept, decline);
      } else if (rowData.kind === "friend") {
        const message = makeButton("chatSmallAction", "Message", "fa-solid fa-message");
        message.addEventListener("click", () => openDirectMessage(rowData.uid, rowData.user));
        card.appendChild(message);
      }
      elements.friendsList.appendChild(card);
    }
  }

  async function sendFriendRequest() {
    const username = elements.friendUsername?.value.trim();
    if (!username) {
      window.alert("Enter a Meld username first.");
      return;
    }
    const lower = username.toLowerCase();
    try {
      const usernameSnapshot = await get(ref(database, `usernames/${lower}`));
      if (!usernameSnapshot.exists()) throw new Error("No Meld account has that username.");
      const recipientUid = usernameSnapshot.val();
      if (recipientUid === currentUser.uid) throw new Error("You cannot add yourself.");
      if (friendData[recipientUid]) throw new Error("You are already friends.");
      if (incomingRequests[recipientUid]) throw new Error("That user already sent you a request. Accept it in Pending.");

      await set(ref(database, `friendRequests/${recipientUid}/${currentUser.uid}`), {
        senderId: currentUser.uid,
        senderUsername: displayName(profile),
        createdAt: serverTimestamp()
      });
      await set(ref(database, `chatSentRequests/${currentUser.uid}/${recipientUid}`), {
        recipientId: recipientUid,
        recipientUsername: username,
        createdAt: serverTimestamp()
      });
      elements.friendUsername.value = "";
      closeModal(elements.addFriendModal);
      setNotice(`Friend request sent to ${username}.`);
    } catch (error) {
      window.alert(error.message || "Could not send friend request.");
    }
  }

  async function declineFriendRequest(senderUid) {
    try {
      
      await remove(ref(database, `chatSentRequests/${senderUid}/${currentUser.uid}`));
      await remove(ref(database, `friendRequests/${currentUser.uid}/${senderUid}`));
    } catch (error) {
      console.error("Could not dismiss friend request:", error);
      window.alert("Could not dismiss that request. Check your Firebase rules.");
    }
  }

  async function acceptFriendRequest(otherUid) {
    try {

      await set(ref(database, `friends/${currentUser.uid}/${otherUid}`), true);
      await set(ref(database, `friends/${otherUid}/${currentUser.uid}`), true);
      await remove(ref(database, `chatSentRequests/${otherUid}/${currentUser.uid}`));
      await remove(ref(database, `friendRequests/${currentUser.uid}/${otherUid}`));
      const otherProfile = await readUser(otherUid);
      await openDirectMessage(otherUid, otherProfile);
    } catch (error) {
      console.error("Could not accept friend request:", error);
      window.alert("Could not accept the request. Check your Firebase rules.");
    }
  }

  function getDirectRoomId(uidA, uidB) {
    return `dm_${[uidA, uidB].sort().join("_")}`;
  }

  async function openDirectMessage(otherUid, otherProfile = null) {
    if (!currentUser || !otherUid || otherUid === currentUser.uid) return;
    try {
      const friendProfile = otherProfile || await readUser(otherUid);
      if (!friendProfile) throw new Error("That user's profile could not be found.");
      const roomId = getDirectRoomId(currentUser.uid, otherUid);
      await setIfMissing(`chatRooms/${roomId}`, {
        type: "dm",
        name: "Direct Message",
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        members: {
          [currentUser.uid]: true,
          [otherUid]: true
        }
      });
      await set(ref(database, `chatUserRooms/${currentUser.uid}/${roomId}`), true);
      await set(ref(database, `chatUserRooms/${otherUid}/${roomId}`), true);
      currentRoomType = "dm";
      currentDMUser = { uid: otherUid, ...friendProfile };
      currentRoomId = roomId;
      elements.roomName.textContent = displayName(friendProfile);
      if (elements.roomIcon) elements.roomIcon.className = "fa-solid fa-user";
      if (elements.title) elements.title.textContent = "Direct Messages";
      if (elements.roomDescription) elements.roomDescription.textContent = `Conversation with ${displayName(friendProfile)}`;
      if (elements.channelSection) elements.channelSection.hidden = true;
      renderServers();
      showView("messages");
      watchRoom(roomId);
    } catch (error) {
      console.error("Could not open direct message:", error);
      window.alert(error.message || "Could not open that conversation.");
    }
  }

  function watchDirectMessages() {
    stopListener(userRoomsListener);
    userRoomsListener = onValue(ref(database, `chatUserRooms/${currentUser.uid}`), async snapshot => {
      const roomIds = Object.keys(snapshot.val() || {});
      elements.dmList?.replaceChildren();
      if (!roomIds.length) {
        setEmpty(elements.dmList, "No conversations yet.");
        return;
      }
      const items = await Promise.all(roomIds.map(async roomId => {
        try {
          const roomSnapshot = await get(roomRef(roomId));
          if (!roomSnapshot.exists()) return null;
          const room = roomSnapshot.val();
          if (room.type !== "dm") return null;
          const otherUid = Object.keys(room.members || {}).find(uid => uid !== currentUser.uid);
          if (!otherUid) return null;
          const other = await readUser(otherUid);
          return { roomId, otherUid, other, name: displayName(other, "Member") };
        } catch (_) { return null; }
      }));
      const valid = items.filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
      if (!valid.length) {
        setEmpty(elements.dmList, "No conversations yet.");
        return;
      }
      elements.dmList.replaceChildren();
      for (const item of valid) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `chatDMItem${item.roomId === currentRoomId ? " active" : ""}`;
        const avatar = document.createElement("span");
        avatar.className = "chatDMAvatar";
        avatar.textContent = initials(item.name);
        const label = document.createElement("span");
        label.textContent = item.name;
        button.append(avatar, label);
        button.addEventListener("click", () => openDirectMessage(item.otherUid, item.other));
        elements.dmList.appendChild(button);
      }
    }, error => console.warn("Direct messages could not load:", error));
  }

  /* 
     USER SETTINGS AND VIEWS
 */

  function showModal(modal) {
    if (modal) modal.hidden = false;
  }

  function closeModal(modal) {
    if (modal) modal.hidden = true;
  }

  function showView(view) {
    const isMessages = view === "messages";
    if (elements.friendsView) elements.friendsView.hidden = isMessages || view !== "friends";
    if (elements.activityView) elements.activityView.hidden = isMessages || view !== "activity";
    const showMain = isMessages;
    document.querySelector(".chatMain")?.classList.toggle("chatMainHidden", !showMain);
    if (elements.membersPanel) elements.membersPanel.hidden = !showMain;
    if (elements.channelSection) elements.channelSection.hidden = !showMain || currentRoomType === "dm";
    elements.navItems.forEach(item => item.classList.toggle("active", item.dataset.view === view));
  }

  async function saveSettings() {
    if (!currentUser || !profile) return;
    const display = elements.nameInput?.value.trim().slice(0, 24);
    if (!display) {
      window.alert("Display name cannot be empty.");
      return;
    }
    const status = elements.statusSelect?.value || "online";
    try {
      await update(profileRef(currentUser.uid), { displayName: display, chatStatus: status });
      profile.displayName = display;
      profile.chatStatus = status;
      updateCurrentUserCard();
      await set(ref(database, `chatPresence/${currentUser.uid}`), {
        username: display,
        status,
        online: status !== "invisible",
        lastSeen: serverTimestamp()
      });
      closeModal(elements.settingsModal);
      setNotice("Your chat settings have been saved.");
    } catch (error) {
      console.error("Could not save chat settings:", error);
      window.alert("Could not save settings. Check your Firebase rules.");
    }
  }

  elements.button.addEventListener("click", () => chatIsOpen ? closeChat() : openChat());
  elements.close.addEventListener("click", closeChat);
  elements.homeServerButton?.addEventListener("click", () => selectServer(CONFIG.DEFAULT_SERVER_ID));
  elements.addServerButton?.addEventListener("click", createServer);
  elements.discoverButton?.addEventListener("click", discoverServers);
  elements.addChannelButton?.addEventListener("click", createChannel);
  elements.newDMButton?.addEventListener("click", () => {
    const username = window.prompt("Enter the Meld username to message:");
    if (!username) return;
    get(ref(database, `usernames/${username.trim().toLowerCase()}`)).then(async snapshot => {
      if (!snapshot.exists()) throw new Error("No Meld account has that username.");
      const uid = snapshot.val();
      await openDirectMessage(uid);
    }).catch(error => window.alert(error.message || "Could not find that user."));
  });

  elements.navItems.forEach(item => item.addEventListener("click", () => {
    const view = item.dataset.view;
    showView(view);
    if (view === "friends") renderFriends();
    if (view === "activity") {
      setEmpty(elements.activityList, "Recent friend requests and conversations will appear here.");
    }
  }));

  elements.membersButton?.addEventListener("click", () => {
    if (elements.membersPanel) elements.membersPanel.hidden = !elements.membersPanel.hidden;
  });
  elements.searchButton?.addEventListener("click", () => {
    if (elements.searchBar) {
      elements.searchBar.hidden = !elements.searchBar.hidden;
      if (!elements.searchBar.hidden) elements.searchInput?.focus();
      else if (elements.searchInput) elements.searchInput.value = "";
      renderMessages();
    }
  });
  elements.searchClose?.addEventListener("click", () => {
    if (elements.searchBar) elements.searchBar.hidden = true;
    if (elements.searchInput) elements.searchInput.value = "";
    renderMessages();
  });
  elements.searchInput?.addEventListener("input", renderMessages);
  elements.emojiButton?.addEventListener("click", () => {
    const emoji = window.prompt("Enter an emoji to insert:", "😀");
    if (!emoji) return;
    const start = elements.input.selectionStart ?? elements.input.value.length;
    const end = elements.input.selectionEnd ?? start;
    elements.input.setRangeText(emoji, start, end, "end");
    elements.input.focus();
    elements.input.dispatchEvent(new Event("input", { bubbles: true }));
  });

  elements.settingsButton?.addEventListener("click", () => {
    if (profile) {
      if (elements.nameInput) elements.nameInput.value = profile.displayName || profile.username || "";
      if (elements.statusSelect) elements.statusSelect.value = profile.chatStatus || "online";
    }
    showModal(elements.settingsModal);
  });
  elements.settingsClose?.addEventListener("click", () => closeModal(elements.settingsModal));
  elements.saveSettings?.addEventListener("click", saveSettings);
  elements.addFriendButton?.addEventListener("click", () => showModal(elements.addFriendModal));
  elements.addFriendClose?.addEventListener("click", () => closeModal(elements.addFriendModal));
  elements.sendFriendRequest?.addEventListener("click", sendFriendRequest);
  elements.friendUsername?.addEventListener("keydown", event => {
    if (event.key === "Enter") sendFriendRequest();
  });
  elements.friendTabs.forEach(tab => tab.addEventListener("click", () => {
    friendFilter = tab.dataset.friendTab;
    elements.friendTabs.forEach(item => item.classList.toggle("active", item === tab));
    renderFriends();
  }));

  [elements.settingsModal, elements.addFriendModal].forEach(modal => {
    modal?.addEventListener("click", event => {
      if (event.target === modal) closeModal(modal);
    });
  });

  elements.addVoiceChannelButton?.addEventListener("click", () => {
    setNotice("Voice channels are shown in the interface, but live voice calling still needs a WebRTC signaling service.");
  });
  elements.voiceChannels?.addEventListener("click", event => {
    if (event.target.closest("[data-voice-channel]")) {
      setNotice("Live voice calling is not configured yet. Text chat, DMs, and friends are available.");
    }
  });
  elements.voiceClose?.addEventListener("click", () => { if (elements.voicePanel) elements.voicePanel.hidden = true; });
  elements.voiceDisconnect?.addEventListener("click", () => { if (elements.voicePanel) elements.voicePanel.hidden = true; });
  elements.voiceMute?.addEventListener("click", () => setNotice("Voice calling is not configured yet."));
  elements.voiceDeafen?.addEventListener("click", () => setNotice("Voice calling is not configured yet."));

  /* 
     USER SERVER AND FRIEND LIST LISTENERS
 */

  function watchUserServers() {
    stopListener(userServersListener);
    userServersListener = onValue(ref(database, `chatUserServers/${currentUser.uid}`), async snapshot => {
      const serverIds = new Set(Object.keys(snapshot.val() || {}));
      serverIds.add(CONFIG.DEFAULT_SERVER_ID);
      const entries = await Promise.all([...serverIds].map(async serverId => {
        try {
          const serverSnapshot = await get(ref(database, `chatServers/${serverId}`));
          return serverSnapshot.exists() ? [serverId, serverSnapshot.val()] : null;
        } catch (_) { return null; }
      }));
      joinedServers = Object.fromEntries(entries.filter(Boolean));
      renderServers();
      if (!joinedServers[currentServerId]) currentServerId = CONFIG.DEFAULT_SERVER_ID;
      if (joinedServers[currentServerId]) {
        if (!channelListener) await selectServer(currentServerId);
      }
    }, error => {
      console.error("Server list failed:", error);
      setNotice("Could not load servers. Check Firebase rules.");
    });
  }

  /* 
     AUTHENTICATION
 */

  onAuthStateChanged(auth, async user => {
    const sequence = ++authSequence;
    const previousUser = currentUser;
    cleanupUserListeners();
    if (previousUser && previousUser.uid !== user?.uid) {
      remove(ref(database, `chatPresence/${previousUser.uid}`)).catch(() => {});
    }
    currentUser = user;
    profile = null;
    joinedServers = {};
    currentMembers = {};
    currentPresence = {};
    friendData = {};
    incomingRequests = {};
    sentRequests = {};
    clearSelectedImage();
    elements.input.value = "";
    setComposerEnabled(false);

    if (!user) {
      showSignedOutMessage();
      if (elements.currentName) elements.currentName.textContent = "Guest";
      if (elements.currentAvatar) elements.currentAvatar.textContent = "?";
      return;
    }

    setNotice("Loading your Meld profile…");
    try {
      const snapshot = await get(profileRef(user.uid));
      if (sequence !== authSequence || auth.currentUser?.uid !== user.uid) return;
      if (!snapshot.exists() || !snapshot.val()?.username) {
        showSignedOutMessage("Finish setting up your Meld profile first.");
        setNotice("Your account needs a Meld username");
        return;
      }

      profile = snapshot.val();
      profile.chatStatus = profile.chatStatus || "online";
      updateCurrentUserCard();
      setComposerEnabled(true);
      setNotice("Connecting to Meld Chat…");

      await ensureDefaultCommunity(user);
      if (sequence !== authSequence) return;
      startPresence();
      watchUserServers();
      watchFriends();
      watchDirectMessages();
      setNotice("Connected to Meld Chat");
    } catch (error) {
      console.error("Chat authentication setup failed:", error);
      if (sequence !== authSequence) return;
      showSignedOutMessage("Meld Chat could not load your profile.");
      setNotice("Check your Firebase Database rules and profile data");
    }
  });

  /* 
     PAGE CLEANUP
 */

  window.addEventListener("beforeunload", () => {
    cleanupUserListeners();
    if (currentUser) {
      remove(ref(database, `chatPresence/${currentUser.uid}`)).catch(() => {});
      remove(ref(database, `chatTyping/${currentRoomId}/${currentUser.uid}`)).catch(() => {});
    }
  });

  updateUnreadBadge();
  console.log("Meld Chat initialized.");
}
