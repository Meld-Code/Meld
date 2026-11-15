/* =====================================================================
   MELD BROWSER
   • meld://Games, meld://Proxy, meld://Movies … (see ROUTES in config.js)
   • real tabs, back / forward / refresh / home, bookmarks
   • websites that refuse to be framed are sent through the Meld proxy
   • loading bar + friendly error screen with Retry / Open-in-new-tab
   Loaded as a classic script BEFORE script.js.
   ===================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------
     PURE ROUTING LOGIC  (also exposed as window.MeldBrowserCore so it
     can be unit-tested without a DOM)
     ------------------------------------------------------------------ */
  const NEWTAB = "meld://newtab";

  function cfg() { return (window.MELD_CONFIG) || {}; }

  function routeTable() {
    const table = {};
    const routes = cfg().ROUTES || {};
    Object.keys(routes).forEach(key => { table[key.toLowerCase()] = routes[key]; });
    return table;
  }

  function absolute(url, base) {
    try { return new URL(url, base || (typeof location !== "undefined" ? location.href : "http://localhost/")).href; }
    catch (_) { return url; }
  }

  function hostOf(url) {
    try { return new URL(url).hostname; } catch (_) { return ""; }
  }

  function sameOrigin(url, base) {
    try { return new URL(url, base).origin === new URL(base).origin; } catch (_) { return false; }
  }

  function isDirectHost(host) {
    return (cfg().DIRECT_HOSTS || []).some(item => host === item || host.endsWith("." + item));
  }

  function proxify(url) {
    return (cfg().PROXY_BASE || "") + encodeURIComponent(url);
  }

  /* Turns anything the user types into { display, target, proxied, internal, title }. */
  function resolve(input, options) {
    options = options || {};
    const proxyOn = options.proxyOn !== false;
    const base = options.base || (typeof location !== "undefined" ? location.href : "http://localhost/");
    let text = String(input == null ? "" : input).trim();

    if (!text || /^meld:\/\/(newtab|browser|new)\/?$/i.test(text)) {
      return { display: NEWTAB, target: "", proxied: false, internal: "newtab", title: "New Tab" };
    }

    const meld = /^meld:\/\/([^/?#\s]+)([/?#].*)?$/i.exec(text);
    if (meld) {
      const route = routeTable()[meld[1].toLowerCase()];
      const rest = meld[2] || "";
      if (!route) {
        return {
          display: "meld://" + meld[1], target: "", proxied: false, internal: "notfound",
          title: "Page not found", missing: meld[1]
        };
      }
      const label = route.label || meld[1];
      const display = "meld://" + label + rest;
      const external = /^https?:\/\//i.test(route.url);
      const wantsProxy = external && proxyOn && route.proxy === true;
      const url = external ? route.url + (rest.startsWith("#") ? rest : "") : absolute(route.url, base) + rest;
      return {
        display,
        target: wantsProxy ? proxify(url) : url,
        proxied: wantsProxy,
        internal: "",
        title: label,
        realUrl: url
      };
    }

    if (/^about:blank$/i.test(text)) {
      return { display: "about:blank", target: "about:blank", proxied: false, internal: "", title: "Blank" };
    }

    let url = "";
    if (/^https?:\/\//i.test(text)) url = text;
    else if (/^(localhost|([\w-]+\.)+[a-z]{2,})(:\d+)?([/?#].*)?$/i.test(text) && !/\s/.test(text)) url = "https://" + text;

    if (!url) {
      const search = (cfg().SEARCH_URL || "https://html.duckduckgo.com/html/?q=") + encodeURIComponent(text);
      return {
        display: search,
        target: proxyOn ? proxify(search) : search,
        proxied: proxyOn,
        internal: "",
        title: "Search: " + text.slice(0, 24),
        realUrl: search
      };
    }

    const host = hostOf(url);
    const direct = !proxyOn || isDirectHost(host) || sameOrigin(url, base);
    return {
      display: url,
      target: direct ? url : proxify(url),
      proxied: !direct,
      internal: "",
      title: host || "Page",
      realUrl: url
    };
  }

  window.MeldBrowserCore = { resolve, proxify, NEWTAB };

  /* ------------------------------------------------------------------
     BROWSER UI  (only runs on pages that contain #browser)
     ------------------------------------------------------------------ */
  const root = document.getElementById("browser");
  if (!root) return;

  const $ = id => document.getElementById(id);
  const viewport = $("browserViewport");
  const tabRow = $("browserTabRow");
  const address = $("browserAddress");
  const newTabButton = $("newBrowserTab");
  const backButton = $("backButton");
  const forwardButton = $("forwardButton");
  const refreshButton = $("refreshButton");
  const homeButton = $("homeButton");
  const closeButton = $("closeBrowser");
  const bookmarkButton = $("bookmarkCurrentPage");
  const bookmarksPanel = $("browserBookmarks");
  const bookmarkList = $("browserBookmarkList");
  const showBookmarks = $("showBookmarks");
  const closeBookmarks = $("closeBookmarks");
  const lockIcon = root.querySelector(".browserLockIcon");
  const proxyToggle = $("proxyToggle");
  const externalButton = $("openExternalTab");
  const firstFrame = $("browserFrame");

  const BOOKMARKS_KEY = "meldBrowserBookmarksV1";
  const PROXY_KEY = "meldBrowserProxyOn";
  const MAX_TABS = 12;
  const LOAD_TIMEOUT_MS = 25000;
  const PROXY_INIT_TIMEOUT_MS = 7000;

  function store(key, fallback) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch (_) { return fallback; }
  }
  function storeSet(key, value) {
    try { localStorage.setItem(key, String(value)); } catch (_) { /* private mode */ }
  }

  let tabs = [];
  let activeId = null;
  let sequence = 0;
  let proxyOn = store(PROXY_KEY, "true") !== "false";
  let bookmarks = [];
  try { bookmarks = JSON.parse(store(BOOKMARKS_KEY, "[]")) || []; } catch (_) { bookmarks = []; }

  /* ---------- overlays inside the viewport ---------- */
  const bar = document.createElement("div");
  bar.className = "browserLoadingBar";
  bar.innerHTML = "<span></span>";
  root.querySelector(".browserChrome").appendChild(bar);

  const status = document.createElement("div");
  status.className = "browserStatus";
  status.hidden = true;
  status.innerHTML =
    '<div class="browserStatusCard"><div class="browserSpinner"></div>' +
    '<strong class="browserStatusTitle"></strong><p class="browserStatusText"></p>' +
    '<div class="browserStatusActions"></div></div>';
  viewport.appendChild(status);

  function showStatus(title, text, actions, spinner) {
    status.hidden = false;
    status.querySelector(".browserSpinner").style.display = spinner ? "block" : "none";
    status.querySelector(".browserStatusTitle").textContent = title;
    status.querySelector(".browserStatusText").textContent = text || "";
    const box = status.querySelector(".browserStatusActions");
    box.replaceChildren();
    (actions || []).forEach(action => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = action.label;
      if (action.primary) button.className = "primary";
      button.addEventListener("click", action.run);
      box.appendChild(button);
    });
  }
  function hideStatus() { status.hidden = true; }

  function setBar(state) {
    bar.dataset.state = state;           // "", "loading", "done"
    if (state === "done") setTimeout(() => { if (bar.dataset.state === "done") bar.dataset.state = ""; }, 450);
  }

  /* ---------- internal pages ---------- */
  function newTabDocument() {
    const route = cfg().ROUTES || {};
    const tiles = [
      ["Games", "fa-gamepad", "meld://Games"],
      ["Movies", "fa-film", "meld://Movies"],
      ["Roblox", "fa-cube", "meld://Roblox"],
      ["Minecraft", "fa-gem", "meld://Minecraft"],
      ["YouTube", "fa-play", "meld://YouTube"],
      ["AI", "fa-robot", "meld://AI"],
      ["Proxy", "fa-globe", "meld://Proxy"],
      ["Leaderboard", "fa-trophy", "meld://Leaderboard"]
    ].filter(tile => route[tile[0].toLowerCase()]);
    const tileHtml = tiles.map(t =>
      `<button class="tile" data-go="${t[2]}"><i class="fa-solid ${t[1]}"></i><span>${t[0]}</span><small>${t[2]}</small></button>`
    ).join("");
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:28px;background:radial-gradient(ellipse at 50% -20%,#2b3a22,#101510 60%);color:#eef5ec;font:15px system-ui,Segoe UI,Arial,sans-serif}
main{width:min(820px,100%);text-align:center}.logo{font-size:12px;letter-spacing:.3em;color:#a6ff68;font-weight:800}
h1{font-size:clamp(34px,7vw,60px);margin:12px 0 6px;letter-spacing:-1.5px}p.sub{color:#9aa99b;margin:0 0 26px}
form{display:flex;gap:8px;background:#1b241d;border:1px solid #344333;border-radius:16px;padding:8px;box-shadow:0 18px 50px #0007}
form:focus-within{border-color:#76b900;box-shadow:0 0 0 3px #76b90030,0 18px 50px #0007}
input{flex:1;min-width:0;background:transparent;border:0;outline:0;color:#fff;padding:11px 12px;font-size:15px}
form button{border:0;border-radius:11px;background:#a6ff68;color:#14200f;padding:0 22px;font-weight:800;cursor:pointer}
.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-top:30px}
.tile{display:flex;flex-direction:column;align-items:center;gap:4px;padding:18px 10px;border:1px solid #344333;border-radius:14px;background:#182019cc;color:#dce8d8;cursor:pointer;font:inherit;transition:.18s}
.tile i{font-size:22px;color:#a6ff68;margin-bottom:4px}.tile span{font-weight:700}.tile small{color:#7f917f;font-size:11px}
.tile:hover{transform:translateY(-3px);border-color:#76b900;background:#223020}
.tip{margin-top:26px;color:#7f917f;font-size:12px}kbd{background:#223020;border:1px solid #344333;border-radius:5px;padding:1px 6px}
</style></head><body><main><div class="logo">CIPHANON STUDIOS</div><h1>Meld Browser</h1><p class="sub">Search the web or jump straight to a Meld page.</p>
<form id="f"><input id="q" placeholder="Search, type a website, or try meld://Games" autofocus autocomplete="off" spellcheck="false"><button>Go</button></form>
<div class="tiles">${tileHtml}</div>
<div class="tip">Tip: type <kbd>meld://Games</kbd> or <kbd>meld://Proxy</kbd> in the address bar.</div>
<script>
function go(v){parent.postMessage({type:'meld-browser-navigate',value:v},'*')}
document.getElementById('f').addEventListener('submit',function(e){e.preventDefault();go(document.getElementById('q').value)});
document.querySelectorAll('[data-go]').forEach(function(b){b.addEventListener('click',function(){go(b.dataset.go)})});
<\/script></main></body></html>`;
  }

  function notFoundDocument(name) {
    const safe = String(name || "").replace(/[<>&"']/g, "");
    const names = Object.values(cfg().ROUTES || {}).map(r => "meld://" + r.label).join("  ·  ");
    return `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#101510;color:#eef5ec;font:15px system-ui,Arial,sans-serif;padding:24px;text-align:center}
h1{font-size:44px;margin:0 0 8px}p{color:#9aa99b;max-width:520px;line-height:1.6}code{color:#a6ff68}</style></head>
<body><div><h1>🧭 Page not found</h1><p><code>meld://${safe}</code> doesn't exist.</p><p>Try one of: ${names}</p></div></body></html>`;
  }

  /* ---------- tab helpers ---------- */
  function activeTab() { return tabs.find(tab => tab.id === activeId) || null; }

  function faviconFor(tab) {
    const host = hostOf(tab.realUrl || "");
    if (tab.display.startsWith("meld://") || !host) return "Icons/Meld.png";
    return "https://www.google.com/s2/favicons?sz=32&domain=" + encodeURIComponent(host);
  }

  function updateChrome() {
    const tab = activeTab();
    if (!tab) return;

    if (document.activeElement !== address) address.value = tab.display;

    if (lockIcon) {
      const insecure = /^http:\/\//i.test(tab.display);
      lockIcon.className = "fa-solid " + (insecure ? "fa-lock-open" : "fa-lock") + " browserLockIcon";
    }

    if (backButton) backButton.disabled = tab.index <= 0;
    if (forwardButton) forwardButton.disabled = tab.index >= tab.history.length - 1;

    const saved = bookmarks.some(item => item.url === tab.display);
    if (bookmarkButton) {
      bookmarkButton.classList.toggle("saved", saved);
      const icon = bookmarkButton.querySelector("i");
      if (icon) icon.className = (saved ? "fa-solid" : "fa-regular") + " fa-star";
    }

    if (proxyToggle) {
      proxyToggle.classList.toggle("on", proxyOn);
      proxyToggle.title = proxyOn ? "Proxy: ON (click to turn off)" : "Proxy: OFF (click to turn on)";
      proxyToggle.setAttribute("aria-pressed", String(proxyOn));
    }
    if (externalButton) externalButton.disabled = !tab.realUrl && !tab.target;
  }

  function renderTabs() {
    tabRow.querySelectorAll(".browserTab").forEach(el => el.remove());
    tabs.forEach(tab => {
      const item = document.createElement("div");
      item.className = "browserTab" + (tab.id === activeId ? " active" : "");
      item.setAttribute("role", "tab");
      item.title = tab.display;

      const icon = document.createElement("img");
      icon.className = "browserTabIcon";
      icon.alt = "";
      icon.src = faviconFor(tab);
      icon.onerror = () => { icon.onerror = null; icon.src = "Icons/Meld.png"; };

      const title = document.createElement("span");
      title.className = "browserTabTitle";
      title.textContent = tab.title || "New Tab";

      const close = document.createElement("button");
      close.type = "button";
      close.className = "browserTabClose";
      close.textContent = "×";
      close.setAttribute("aria-label", "Close tab");
      close.addEventListener("click", event => { event.stopPropagation(); closeTab(tab.id); });

      item.append(icon, title, close);
      item.addEventListener("click", () => activateTab(tab.id));
      item.addEventListener("auxclick", event => { if (event.button === 1) closeTab(tab.id); });
      tabRow.insertBefore(item, newTabButton);
    });
  }

  function activateTab(id) {
    activeId = id;
    tabs.forEach(tab => {
      const on = tab.id === id;
      tab.frame.style.display = on ? "block" : "none";
      tab.frame.classList.toggle("active", on);
    });
    hideStatus();
    const tab = activeTab();
    setBar(tab && tab.loading ? "loading" : "");
    if (tab && tab.error) showError(tab);
    renderTabs();
    updateChrome();
  }

  /* ---------- proxy warm-up ---------- */
  let proxyPromise = null;
  function warmProxy() {
    if (proxyPromise) return proxyPromise;
    proxyPromise = new Promise(resolve => {
      const initUrl = cfg().PROXY_INIT;
      if (!initUrl) { resolve(); return; }
      const frame = document.createElement("iframe");
      frame.setAttribute("aria-hidden", "true");
      frame.tabIndex = -1;
      frame.style.cssText = "position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;border:0;";
      let done = false;
      const finish = () => { if (done) return; done = true; resolve(); };
      frame.addEventListener("load", finish);
      setTimeout(finish, PROXY_INIT_TIMEOUT_MS);
      frame.src = initUrl;
      document.body.appendChild(frame);
    });
    return proxyPromise;
  }

  /* ---------- navigation ---------- */
  function showError(tab) {
    const real = tab.realUrl || tab.target;
    showStatus(
      "This page didn't load",
      tab.proxied
        ? "The Meld proxy didn't answer in time. The site may be slow, or the proxy may be down."
        : "The site may be blocking Meld, or your connection dropped.",
      [
        { label: "Try again", primary: true, run: () => reload(tab) },
        tab.proxied ? { label: "Turn proxy off", run: () => { setProxy(false); reload(tab, true); } } : null,
        real ? { label: "Open in a new tab", run: () => window.open(real, "_blank", "noopener") } : null
      ].filter(Boolean),
      false
    );
  }

  function load(tab) {
    clearTimeout(tab.timer);
    tab.error = false;
    tab.loading = true;
    tab.loaded = false;
    if (tab.id === activeId) { hideStatus(); setBar("loading"); }

    const spec = tab.spec;

    if (spec.internal) {
      tab.frame.removeAttribute("src");
      tab.frame.srcdoc = spec.internal === "newtab" ? newTabDocument() : notFoundDocument(spec.missing);
      return;
    }

    const go = () => {
      tab.frame.removeAttribute("srcdoc");
      tab.frame.src = spec.target;
      tab.timer = setTimeout(() => {
        if (tab.loaded) return;
        tab.loading = false;
        tab.error = true;
        if (tab.id === activeId) { setBar(""); showError(tab); }
      }, LOAD_TIMEOUT_MS);
    };

    if (spec.proxied) {
      if (tab.id === activeId) {
        showStatus("Starting proxy…", "Getting " + (spec.title || "the page") + " ready", [], true);
      }
      warmProxy().then(go);
    } else {
      go();
    }
  }

  function onFrameLoad(tab) {
    if (tab.frame.getAttribute("src") === "about:blank" && !tab.spec.internal && tab.spec.target !== "about:blank") return;
    clearTimeout(tab.timer);
    tab.loaded = true;
    tab.loading = false;
    tab.error = false;
    if (tab.id === activeId) { hideStatus(); setBar("done"); }

    /* Same-origin pages (Games, Profile …) can tell us their real title. */
    try {
      const title = tab.frame.contentDocument && tab.frame.contentDocument.title;
      if (title && !tab.spec.internal) { tab.title = title.slice(0, 40); renderTabs(); }
    } catch (_) { /* cross-origin: keep hostname */ }
  }

  function navigate(tab, input, options) {
    options = options || {};
    const spec = resolve(input, { proxyOn });
    tab.spec = spec;
    tab.display = spec.display;
    tab.target = spec.target;
    tab.realUrl = spec.realUrl || "";
    tab.proxied = spec.proxied;
    tab.title = spec.title || "Page";

    if (!options.fromHistory) {
      if (tab.history[tab.index] !== spec.display) {
        tab.history = tab.history.slice(0, tab.index + 1);
        tab.history.push(spec.display);
        tab.index = tab.history.length - 1;
      }
    }

    load(tab);
    renderTabs();
    updateChrome();

  }

  function reload(tab, forceFresh) {
    if (!tab) return;
    if (tab.spec.internal || forceFresh) { navigate(tab, tab.display, { fromHistory: true }); return; }
    load(tab);
  }

  function setProxy(value) {
    proxyOn = Boolean(value);
    storeSet(PROXY_KEY, proxyOn);
    updateChrome();
  }

  /* ---------- tab management ---------- */
  function createTab(input, shouldOpen) {
    if (tabs.length >= MAX_TABS) { activateTab(tabs[tabs.length - 1].id); return activeTab(); }

    let frame;
    if (tabs.length === 0 && firstFrame) {
      frame = firstFrame;
    } else {
      frame = document.createElement("iframe");
      frame.title = "Meld Browser tab";
      viewport.insertBefore(frame, status);
    }
    frame.classList.add("browserTabFrame");
    frame.setAttribute("allow", "fullscreen; autoplay; gamepad; clipboard-write");
    frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    frame.style.display = "none";

    const tab = {
      id: "meld-tab-" + (++sequence), frame,
      history: [], index: -1, spec: { internal: "newtab" }, display: NEWTAB, target: "", realUrl: "",
      title: "New Tab", loading: false, loaded: false, error: false, proxied: false, timer: 0
    };
    frame.addEventListener("load", () => onFrameLoad(tab));
    tabs.push(tab);
    activateTab(tab.id);
    navigate(tab, input || NEWTAB);
    if (shouldOpen !== false) root.classList.add("open");
    return tab;
  }

  function closeTab(id) {
    const index = tabs.findIndex(tab => tab.id === id);
    if (index < 0) return;
    const tab = tabs[index];
    clearTimeout(tab.timer);
    if (tab.frame === firstFrame) {
      /* Keep the original <iframe id="browserFrame"> alive for the cheat panel. */
      tab.frame.removeAttribute("src");
      tab.frame.srcdoc = "";
      tab.frame.style.display = "none";
    } else {
      tab.frame.remove();
    }
    tabs.splice(index, 1);

    if (!tabs.length) {
      closeWindow();
      createTab(NEWTAB, false);
      return;
    }
    if (activeId === id) activateTab(tabs[Math.max(0, index - 1)].id);
    else renderTabs();
  }

  /* ---------- public API (used by script.js and the rest of the site) ---------- */
  function openBrowser(input, options) {
    if (input === undefined || input === null || input === "") return;
    options = options || {};
    let tab = activeTab();
    if (!tab || options.newTab) tab = createTab(input, false);
    else navigate(tab, input);
    root.classList.add("open");
    if (bookmarksPanel) bookmarksPanel.hidden = true;
    return tab;
  }

  function closeWindow() {
    root.classList.remove("open");
    if (bookmarksPanel) bookmarksPanel.hidden = true;
  }

  window.HOME_URL = NEWTAB;
  window.openBrowser = openBrowser;
  window.closeBrowserWindow = closeWindow;
  window.createBrowserTab = createTab;
  window.currentBrowserTab = activeTab;
  window.reloadActiveBrowserTab = () => reload(activeTab());

  /* ---------- wiring ---------- */
  newTabButton && newTabButton.addEventListener("click", () => createTab(NEWTAB));
  closeButton && closeButton.addEventListener("click", closeWindow);
  homeButton && homeButton.addEventListener("click", () => { const tab = activeTab(); if (tab) navigate(tab, NEWTAB); else openBrowser(NEWTAB); });
  refreshButton && refreshButton.addEventListener("click", () => reload(activeTab()));

  function step(direction) {
    const tab = activeTab();
    if (!tab) return;
    const next = tab.index + direction;
    if (next < 0 || next >= tab.history.length) return;
    tab.index = next;
    navigate(tab, tab.history[next], { fromHistory: true });
  }
  backButton && backButton.addEventListener("click", () => step(-1));
  forwardButton && forwardButton.addEventListener("click", () => step(1));

  address.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const tab = activeTab();
    if (tab) navigate(tab, address.value); else openBrowser(address.value);
    address.blur();
  });
  address.addEventListener("focus", () => address.select());
  address.addEventListener("blur", updateChrome);

  proxyToggle && proxyToggle.addEventListener("click", () => {
    setProxy(!proxyOn);
    const tab = activeTab();
    if (tab && !tab.spec.internal && /^https?:/i.test(tab.display)) navigate(tab, tab.display, { fromHistory: true });
  });

  externalButton && externalButton.addEventListener("click", () => {
    const tab = activeTab();
    const url = tab && (tab.realUrl || tab.target);
    if (url) window.open(url, "_blank", "noopener");
  });

  /* bookmarks */
  function saveBookmarks() { storeSet(BOOKMARKS_KEY, JSON.stringify(bookmarks)); }

  function renderBookmarks() {
    if (!bookmarkList) return;
    bookmarkList.replaceChildren();
    if (!bookmarks.length) {
      const empty = document.createElement("p");
      empty.className = "browserBookmarkEmpty";
      empty.textContent = "No bookmarks yet. Tap the star to save a page.";
      bookmarkList.appendChild(empty);
      return;
    }
    bookmarks.forEach((bookmark, index) => {
      const row = document.createElement("div");
      row.className = "browserBookmarkItem";
      const open = document.createElement("button");
      open.type = "button";
      open.className = "browserBookmarkOpen";
      open.textContent = bookmark.title || bookmark.url;
      open.title = bookmark.url;
      open.addEventListener("click", () => { openBrowser(bookmark.url); bookmarksPanel.hidden = true; });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "browserBookmarkRemove";
      remove.textContent = "×";
      remove.title = "Remove bookmark";
      remove.addEventListener("click", () => { bookmarks.splice(index, 1); saveBookmarks(); renderBookmarks(); updateChrome(); });
      row.append(open, remove);
      bookmarkList.appendChild(row);
    });
  }

  bookmarkButton && bookmarkButton.addEventListener("click", () => {
    const tab = activeTab();
    if (!tab || tab.spec.internal) return;
    const index = bookmarks.findIndex(item => item.url === tab.display);
    if (index >= 0) bookmarks.splice(index, 1);
    else bookmarks.push({ url: tab.display, title: tab.title || tab.display });
    saveBookmarks();
    renderBookmarks();
    updateChrome();
  });
  showBookmarks && showBookmarks.addEventListener("click", () => { renderBookmarks(); bookmarksPanel.hidden = !bookmarksPanel.hidden; });
  closeBookmarks && closeBookmarks.addEventListener("click", () => { bookmarksPanel.hidden = true; });

  /* messages from Meld's own internal pages (new-tab page) */
  window.addEventListener("message", event => {
    const data = event.data;
    if (!data || data.type !== "meld-browser-navigate") return;
    const tab = tabs.find(item => item.frame.contentWindow === event.source);
    if (!tab || !tab.spec.internal) return;       // only Meld's own pages may drive the browser
    navigate(tab, data.value);
  });

  createTab(NEWTAB, false);
})();
