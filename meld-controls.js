/* =====================================================================
   MELD CONTROLS (cheat panel)  —  key holding + auto clicker
   Works on the ACTIVE browser tab (not just the first one).

   How it reaches the page:
   1. Same-origin pages (Games, Profile, anything under your own domain) and any
      same-origin iframes inside them are driven directly.
   2. Cross-origin pages cannot be touched by ANY website script (browser security).
      If you control the page, add   <script src="https://YOUR-MELD-SITE/meld-bridge.js"></script>
      to it (e.g. your meld-code.github.io games) and the panel talks to it
      through postMessage — including iframes nested inside it.
   3. Proxied sites run on the proxy's origin, so they behave like (2); the
      panel will tell you when it can't reach the page.
   ===================================================================== */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const panel = $("controlPanel"), toggle = $("controlPanelToggle"), closeBtn = $("controlPanelClose");
  if (!panel || !toggle) return;

  const statusText = $("controlStatusText"), statusDot = $("controlStatusDot");
  const intervalInput = $("autoClickInterval"), intervalLabel = $("controlIntervalLabel");
  const startBtn = $("autoClickStart"), countLabel = $("controlClickCount");
  const oneBtn = $("singleClickButton"), resetBtn = $("resetClickCount"), releaseBtn = $("releaseAllKeys");
  const pickBtn = $("pickClickSpot"), spotLabel = $("controlSpotLabel");
  const customKey = $("customKeyInput"), customAdd = $("customKeyAdd");
  const viewport = $("browserViewport");

  /* ---------- key table ---------- */
  const NAMED = {
    " ": ["Space", 32], Shift: ["ShiftLeft", 16], Control: ["ControlLeft", 17], Alt: ["AltLeft", 18], Enter: ["Enter", 13], Escape: ["Escape", 27],
    Tab: ["Tab", 9], Backspace: ["Backspace", 8], ArrowUp: ["ArrowUp", 38], ArrowDown: ["ArrowDown", 40], ArrowLeft: ["ArrowLeft", 37], ArrowRight: ["ArrowRight", 39]
  };
  function keyInfo(key) {
    if (NAMED[key]) return { key, code: NAMED[key][0], keyCode: NAMED[key][1] };
    const k = String(key);
    if (/^[a-z]$/i.test(k)) return { key: k.toLowerCase(), code: "Key" + k.toUpperCase(), keyCode: k.toUpperCase().charCodeAt(0) };
    if (/^[0-9]$/.test(k)) return { key: k, code: "Digit" + k, keyCode: 48 + Number(k) };
    return { key: k, code: "", keyCode: k.length === 1 ? k.toUpperCase().charCodeAt(0) : 0 };
  }

  /* ---------- finding the page ---------- */
  function activeFrame() {
    try { const tab = window.currentBrowserTab && window.currentBrowserTab(); if (tab && tab.frame) return tab.frame; } catch (_) { /* ignore */ }
    return $("browserFrame");
  }
  const sameOrigin = frame => { try { void frame.contentWindow.document; return true; } catch (_) { return false; } };

  /* every reachable window inside `win` (itself + nested same-origin iframes); also lists blocked frames */
  function walk(win, out, depth = 0) {
    out.wins.push(win);
    if (depth > 6) return;
    let frames = [];
    try { frames = [...win.document.querySelectorAll("iframe,frame")]; } catch (_) { return; }
    frames.forEach(f => {
      if (sameOrigin(f)) walk(f.contentWindow, out, depth + 1);
      else out.blocked.push(f);
    });
  }
  function reach() {
    const frame = activeFrame();
    const out = { frame, wins: [], blocked: [] };
    if (!frame || !frame.contentWindow) return out;
    if (sameOrigin(frame)) walk(frame.contentWindow, out);
    else out.blocked.push(frame);
    return out;
  }
  const bridged = new WeakSet();            // cross-origin windows that answered our ping
  function postAll(blocked, message) {
    blocked.forEach(f => { try { f.contentWindow.postMessage(Object.assign({ meldctl: true }, message), "*"); } catch (_) { /* ignore */ } });
  }
  window.addEventListener("message", event => {
    if (event.data && event.data.meldctl === "pong") { bridged.add(event.source); setStatus("Connected to the page (bridge)", true); }
  });
  function ping() { postAll(reach().blocked, { type: "ping" }); }

  /* ---------- state + status ---------- */
  const held = new Set();
  let repeatTimer = null, clickTimer = null, running = false, clicks = 0, spot = null;
  function setStatus(msg, active) { if (statusText) statusText.textContent = msg; if (statusDot) statusDot.classList.toggle("active", Boolean(active)); }
  function describeReach(r) {
    if (r.wins.length) return true;
    const anyBridge = r.blocked.some(f => { try { return bridged.has(f.contentWindow); } catch (_) { return false; } });
    if (anyBridge) return true;
    setStatus("Can't reach this page (different site). It needs meld-bridge.js — see Notes.");
    return false;
  }

  /* ---------- keyboard ---------- */
  function makeKey(win, type, info, repeat) {
    const e = new win.KeyboardEvent(type, { key: info.key, code: info.code, bubbles: true, cancelable: true, composed: true, repeat: Boolean(repeat), view: win });
    try {
      Object.defineProperty(e, "keyCode", { get: () => info.keyCode });
      Object.defineProperty(e, "which", { get: () => info.keyCode });
      Object.defineProperty(e, "charCode", { get: () => (type === "keypress" ? info.key.charCodeAt(0) : 0) });
    } catch (_) { /* ignore */ }
    return e;
  }
  function deliverKey(win, type, info, repeat) {
    try {
      const doc = win.document;
      let target = doc.activeElement;
      while (target && target.tagName === "IFRAME" && sameOrigin(target)) { target = target.contentDocument.activeElement; }
      if (!target || target === doc.documentElement) target = doc.body;
      if (target === doc.body) { const canvas = doc.querySelector("canvas"); if (canvas) canvas.dispatchEvent(makeKey(win, type, info, repeat)); }
      target.dispatchEvent(makeKey(win, type, info, repeat));
      if (target !== doc.body) doc.dispatchEvent(makeKey(win, type, info, repeat));
      return true;
    } catch (_) { return false; }
  }
  function sendKey(key, type, repeat) {
    const r = reach();
    if (!describeReach(r)) return false;
    const info = keyInfo(key);
    r.wins.forEach(w => {
      deliverKey(w, type, info, repeat);
      if (type === "keydown" && info.key.length === 1 && info.keyCode >= 48) deliverKey(w, "keypress", info, repeat);
    });
    postAll(r.blocked, { type: "key", ev: type, info, repeat: Boolean(repeat) });
    return true;
  }

  function syncKeyButtons() {
    panel.querySelectorAll("[data-key]").forEach(b => b.classList.toggle("held", held.has(b.dataset.key)));
  }
  function startRepeat() {
    if (repeatTimer) return;
    /* a held key on a real keyboard keeps firing keydown; many games rely on that */
    repeatTimer = setInterval(() => { held.forEach(k => sendKey(k, "keydown", true)); }, 40);
  }
  function holdKey(key) {
    if (held.has(key)) return;
    if (!sendKey(key, "keydown", false)) return;
    held.add(key); startRepeat(); syncKeyButtons();
    setStatus("Holding: " + [...held].map(k => k === " " ? "SPACE" : k.toUpperCase()).join(" + "), true);
  }
  function releaseKey(key) {
    if (!held.has(key)) return;
    held.delete(key); sendKey(key, "keyup", false);
    if (!held.size && repeatTimer) { clearInterval(repeatTimer); repeatTimer = null; }
    syncKeyButtons();
    setStatus(held.size ? "Holding: " + [...held].join(" + ") : "Keys released");
  }
  function releaseAll() { [...held].forEach(releaseKey); syncKeyButtons(); setStatus("Keys released"); }

  panel.querySelectorAll("[data-key]").forEach(button => {
    button.addEventListener("click", event => { event.preventDefault(); held.has(button.dataset.key) ? releaseKey(button.dataset.key) : holdKey(button.dataset.key); });
  });
  releaseBtn && releaseBtn.addEventListener("click", releaseAll);
  const addCustom = () => {
    const raw = (customKey.value || "").trim(); if (!raw) return;
    const key = raw.length === 1 ? raw : ({ space: " ", shift: "Shift", ctrl: "Control", control: "Control", alt: "Alt", enter: "Enter", up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight", esc: "Escape", tab: "Tab" })[raw.toLowerCase()];
    if (!key) { setStatus("Type one key (like e) or: space, shift, ctrl, up, down, left, right"); return; }
    customKey.value = ""; held.has(key) ? releaseKey(key) : holdKey(key);
  };
  customAdd && customAdd.addEventListener("click", addCustom);
  customKey && customKey.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } e.stopPropagation(); });

  /* ---------- clicking ---------- */
  function clickIn(win, x, y, depthLeft = 6) {
    try {
      const doc = win.document;
      const el = doc.elementFromPoint(x, y);
      if (!el) return false;
      if ((el.tagName === "IFRAME" || el.tagName === "FRAME")) {
        const rect = el.getBoundingClientRect();
        if (sameOrigin(el) && depthLeft > 0) return clickIn(el.contentWindow, x - rect.left, y - rect.top, depthLeft - 1);
        try { el.contentWindow.postMessage({ meldctl: true, type: "click", x: x - rect.left, y: y - rect.top }, "*"); return true; } catch (_) { return false; }
      }
      const base = { bubbles: true, cancelable: true, composed: true, view: win, clientX: x, clientY: y, button: 0, buttons: 1, pointerId: 1, pointerType: "mouse", isPrimary: true };
      const fire = (Ctor, type, extra) => el.dispatchEvent(new (win[Ctor] || win.MouseEvent)(type, Object.assign({}, base, extra || {})));
      fire("PointerEvent", "pointerover"); fire("MouseEvent", "mouseover");
      fire("PointerEvent", "pointermove"); fire("MouseEvent", "mousemove");
      fire("PointerEvent", "pointerdown"); fire("MouseEvent", "mousedown");
      if (el.focus) try { el.focus({ preventScroll: true }); } catch (_) { /* ignore */ }
      fire("PointerEvent", "pointerup", { buttons: 0 }); fire("MouseEvent", "mouseup", { buttons: 0 });
      fire("MouseEvent", "click", { buttons: 0 });
      if (typeof el.click === "function" && /^(BUTTON|A|INPUT|SUMMARY|LABEL)$/.test(el.tagName)) { /* native activation for real controls */ }
      return true;
    } catch (_) { return false; }
  }
  function currentPoint(frame) {
    const rect = frame.getBoundingClientRect();
    return spot ? { x: spot.x * rect.width, y: spot.y * rect.height } : { x: rect.width / 2, y: rect.height / 2 };
  }
  function sendClick() {
    const r = reach();
    if (!describeReach(r)) { stopClicker(); return false; }
    const p = currentPoint(r.frame);
    let ok = false;
    if (r.wins.length) ok = clickIn(r.wins[0], p.x, p.y);
    if (!ok && r.blocked.length) { postAll(r.blocked, { type: "click", x: p.x, y: p.y }); ok = true; }
    if (ok) { clicks++; countLabel && (countLabel.textContent = String(clicks)); setStatus("Clicking" + (spot ? " at your spot" : " at page center"), true); }
    else setStatus("Nothing to click there — pick a different spot");
    return ok;
  }
  function stopClicker() {
    if (clickTimer) clearInterval(clickTimer);
    clickTimer = null; running = false;
    if (startBtn) { startBtn.textContent = "Start"; startBtn.classList.remove("running"); }
  }
  function startClicker() {
    const interval = Number(intervalInput.value);
    if (!Number.isFinite(interval) || interval < 20 || interval > 10000) { setStatus("Choose 20–10000 milliseconds"); intervalInput.value = "500"; return; }
    stopClicker();
    intervalLabel && (intervalLabel.textContent = interval + " ms");
    running = true; startBtn.textContent = "Stop"; startBtn.classList.add("running");
    clickTimer = setInterval(() => { if (!sendClick()) stopClicker(); }, interval);
  }
  startBtn && startBtn.addEventListener("click", () => { running ? (stopClicker(), setStatus("Auto clicker stopped")) : startClicker(); });
  oneBtn && oneBtn.addEventListener("click", sendClick);
  resetBtn && resetBtn.addEventListener("click", () => { clicks = 0; countLabel.textContent = "0"; setStatus("Counter reset"); });
  intervalInput && intervalInput.addEventListener("input", () => {
    const v = Number(intervalInput.value); intervalLabel && (intervalLabel.textContent = v > 0 ? v + " ms" : "—");
    if (running) { startClicker(); }       // apply the new speed immediately
  });
  intervalInput && intervalInput.addEventListener("keydown", e => e.stopPropagation());

  /* ---------- pick the click spot ---------- */
  const marker = document.createElement("div"); marker.id = "controlPickMarker"; marker.hidden = true; viewport && viewport.appendChild(marker);
  function showMarker() {
    const frame = activeFrame(); if (!spot || !frame || !viewport) { marker.hidden = true; return; }
    const f = frame.getBoundingClientRect(), v = viewport.getBoundingClientRect();
    marker.style.left = (f.left - v.left + spot.x * f.width) + "px"; marker.style.top = (f.top - v.top + spot.y * f.height) + "px"; marker.hidden = false;
  }
  pickBtn && pickBtn.addEventListener("click", () => {
    if (!viewport) return;
    const overlay = document.createElement("div"); overlay.id = "controlPickOverlay";
    overlay.innerHTML = "<span>Click where the auto clicker should click (Esc to cancel)</span>";
    viewport.appendChild(overlay);
    const finish = () => { overlay.remove(); document.removeEventListener("keydown", onKey, true); };
    const onKey = e => { if (e.key === "Escape") { e.stopPropagation(); finish(); } };
    document.addEventListener("keydown", onKey, true);
    overlay.addEventListener("click", e => {
      const frame = activeFrame(), rect = frame.getBoundingClientRect();
      spot = { x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)), y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)) };
      spotLabel && (spotLabel.textContent = Math.round(spot.x * 100) + "%, " + Math.round(spot.y * 100) + "%");
      finish(); showMarker(); setStatus("Click spot saved", true);
    });
  });
  window.addEventListener("resize", showMarker);

  /* ---------- panel open/close + lifecycle ---------- */
  function setOpen(open) {
    panel.classList.toggle("visible", open);
    toggle.setAttribute("aria-expanded", String(open));
    if (open) { ping(); showMarker(); } else { marker.hidden = true; stopClicker(); releaseAll(); }
  }
  toggle.addEventListener("click", () => setOpen(!panel.classList.contains("visible")));
  closeBtn && closeBtn.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", event => {
    const tag = event.target && event.target.tagName;
    if (event.key === "Control" && !event.repeat && tag !== "INPUT" && tag !== "TEXTAREA") { event.preventDefault(); setOpen(!panel.classList.contains("visible")); }
    if (event.key === "Escape" && panel.classList.contains("visible")) { event.stopPropagation(); setOpen(false); }
    if (event.key === "F8" && panel.classList.contains("visible")) { event.preventDefault(); running ? stopClicker() : startClicker(); }
  }, true);
  window.addEventListener("blur", () => { /* keep holding when focus moves into the game iframe */ });
  window.addEventListener("pagehide", () => { stopClicker(); releaseAll(); });

  /* a new page loaded in the tab: keep running, but re-check reachability */
  const hookFrame = frame => { if (frame && !frame.dataset.meldCtl) { frame.dataset.meldCtl = "1"; frame.addEventListener("load", () => { setTimeout(() => { ping(); showMarker(); }, 400); if (held.size) setStatus("Page changed — keys may need re-holding"); }); } };
  setInterval(() => hookFrame(activeFrame()), 1500);
  hookFrame(activeFrame());
  setStatus("Controls ready");
})();
