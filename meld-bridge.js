/* =====================================================================
   MELD BRIDGE  —  let the Meld Cheat Panel control a page you own.
   Add to ANY page (or game) you host that gets opened inside Meld:

     <script src="https://YOUR-MELD-SITE/meld-bridge.js"></script>

   Browsers do not let one website script reach into a different website's
   iframe, so the panel can only drive cross-origin pages that cooperate.
   This file makes a page cooperate: it listens for messages from its parent
   (Meld) and turns them into real key/mouse events inside the page and any
   iframes below it. It also passes the commands down to nested iframes.
   ===================================================================== */
(() => {
  "use strict";
  if (window.__meldBridge) return;
  window.__meldBridge = true;

  function makeKey(type, info, repeat) {
    const e = new KeyboardEvent(type, { key: info.key, code: info.code, bubbles: true, cancelable: true, composed: true, repeat: Boolean(repeat), view: window });
    try {
      Object.defineProperty(e, "keyCode", { get: () => info.keyCode });
      Object.defineProperty(e, "which", { get: () => info.keyCode });
    } catch (_) { /* ignore */ }
    return e;
  }
  function key(ev, info, repeat) {
    let target = document.activeElement;
    if (!target || target === document.documentElement) target = document.body;
    const canvas = target === document.body ? document.querySelector("canvas") : null;
    if (canvas) canvas.dispatchEvent(makeKey(ev, info, repeat));
    target.dispatchEvent(makeKey(ev, info, repeat));
    if (target !== document.body) document.dispatchEvent(makeKey(ev, info, repeat));
    if (ev === "keydown" && info.key.length === 1) target.dispatchEvent(makeKey("keypress", info, repeat));
  }
  function click(x, y, depth = 0) {
    const el = document.elementFromPoint(x, y);
    if (!el) return;
    if (el.tagName === "IFRAME" || el.tagName === "FRAME") {
      const r = el.getBoundingClientRect();
      try { el.contentWindow.postMessage({ meldctl: true, type: "click", x: x - r.left, y: y - r.top }, "*"); } catch (_) { /* ignore */ }
      return;
    }
    const base = { bubbles: true, cancelable: true, composed: true, view: window, clientX: x, clientY: y, button: 0, buttons: 1, pointerId: 1, pointerType: "mouse", isPrimary: true };
    const fire = (C, t, extra) => el.dispatchEvent(new (window[C] || MouseEvent)(t, Object.assign({}, base, extra || {})));
    fire("PointerEvent", "pointermove"); fire("MouseEvent", "mousemove");
    fire("PointerEvent", "pointerdown"); fire("MouseEvent", "mousedown");
    if (el.focus) try { el.focus({ preventScroll: true }); } catch (_) { /* ignore */ }
    fire("PointerEvent", "pointerup", { buttons: 0 }); fire("MouseEvent", "mouseup", { buttons: 0 }); fire("MouseEvent", "click", { buttons: 0 });
  }
  function relay(data) {
    document.querySelectorAll("iframe,frame").forEach(f => { try { f.contentWindow.postMessage(data, "*"); } catch (_) { /* ignore */ } });
  }

  window.addEventListener("message", event => {
    const d = event.data;
    if (!d || d.meldctl !== true) return;
    if (d.type === "ping") { try { event.source.postMessage({ meldctl: "pong" }, "*"); } catch (_) { /* ignore */ } relay(d); return; }
    if (d.type === "key") { try { key(d.ev, d.info, d.repeat); } catch (_) { /* ignore */ } relay(d); return; }
    if (d.type === "click") { try { click(Number(d.x) || 0, Number(d.y) || 0); } catch (_) { /* ignore */ } }
  });
})();
