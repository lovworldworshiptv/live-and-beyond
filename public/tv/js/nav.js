/*
 * Remote-control focus engine. Every interactive element carries the class "focusable".
 * Arrow keys move to the nearest focusable in that direction (spatial navigation), rows
 * (.hrow > .htrack) slide so the focused card stays in view, and vertical lists (.vscroll > .vtrack)
 * slide so the focused row sits at the top of the list, like Netflix and Prime Video on TV.
 */
(function () {
  "use strict";

  var KEY = { LEFT: "left", RIGHT: "right", UP: "up", DOWN: "down", OK: "ok", BACK: "back",
    PLAY: "play", PAUSE: "pause", PLAYPAUSE: "playpause", STOP: "stop", FF: "ff", RW: "rw" };

  /*
   * VIDAA forwards the remote as standard key events. Back arrives as Backspace (8) or Escape on most
   * models; 461 (webOS) and 10009 (Tizen) are accepted too so the same build works in other TV browsers.
   * Media keys: 415 play, 19 pause, 413 stop, 417 fast-forward, 412 rewind, 179/10252 play-pause.
   */
  var CODES = {
    37: KEY.LEFT, 38: KEY.UP, 39: KEY.RIGHT, 40: KEY.DOWN, 13: KEY.OK, 29443: KEY.OK, 65376: KEY.OK,
    8: KEY.BACK, 27: KEY.BACK, 461: KEY.BACK, 10009: KEY.BACK, 166: KEY.BACK,
    415: KEY.PLAY, 19: KEY.PAUSE, 413: KEY.STOP, 417: KEY.FF, 412: KEY.RW, 179: KEY.PLAYPAUSE, 10252: KEY.PLAYPAUSE, 32: KEY.PLAYPAUSE
  };
  var NAMES = {
    ArrowLeft: KEY.LEFT, ArrowUp: KEY.UP, ArrowRight: KEY.RIGHT, ArrowDown: KEY.DOWN, Left: KEY.LEFT, Up: KEY.UP, Right: KEY.RIGHT, Down: KEY.DOWN,
    Enter: KEY.OK, Accept: KEY.OK, Backspace: KEY.BACK, Escape: KEY.BACK, Esc: KEY.BACK, GoBack: KEY.BACK, BrowserBack: KEY.BACK, XF86Back: KEY.BACK,
    MediaPlay: KEY.PLAY, MediaPause: KEY.PAUSE, MediaPlayPause: KEY.PLAYPAUSE, MediaStop: KEY.STOP,
    MediaFastForward: KEY.FF, MediaRewind: KEY.RW, MediaTrackNext: KEY.FF, MediaTrackPrevious: KEY.RW
  };

  var current = null;
  var layers = [];          // stack of {root, onKey, onBack}

  function scope() { return layers.length ? layers[layers.length - 1].root : document.getElementById("stage"); }

  function visible(el) {
    if (!el || !el.isConnected && !document.body.contains(el)) return false;
    if (el.offsetParent === null && getComputedStyle(el).position !== "fixed") return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }
  function candidates() {
    var all = scope().querySelectorAll(".focusable:not(.disabled)");
    var out = [];
    for (var i = 0; i < all.length; i++) if (visible(all[i])) out.push(all[i]);
    return out;
  }
  function closestRow(el) { return el && el.closest ? el.closest(".hrow") : null; }

  function focus(el, opts) {
    if (!el) return;
    if (current && current !== el) {
      current.classList.remove("focused");
      if (current.onblurtv) current.onblurtv();
    }
    current = el;
    el.classList.add("focused");
    reveal(el, opts && opts.instant);
    if (el.onfocustv) el.onfocustv();
    document.dispatchEvent(new CustomEvent("tvfocus", { detail: el }));
  }

  /** Slides rows and lists so [el] is in view. */
  function reveal(el, instant) {
    var row = closestRow(el);
    if (row) {
      var track = row.querySelector(".htrack");
      var pad = parseInt(row.getAttribute("data-pad") || "0", 10);
      var left = offsetWithin(el, track).left;
      var max = Math.max(0, track.scrollWidth - row.clientWidth + 80);
      var x = Math.max(0, Math.min(left - pad, max));
      setTransform(track, "translate3d(" + (-x) + "px,0,0)", instant);
    }
    var vs = el.closest ? el.closest(".vscroll") : null;
    if (vs) {
      var vt = vs.querySelector(".vtrack");
      var anchorEl = el.closest(".vanchor") || el;
      var top = offsetWithin(anchorEl, vt).top;
      var mode = vs.getAttribute("data-mode") || "row";
      var y;
      if (mode === "row") {
        // Focused row moves to the top of the list area (first rows stay put).
        var lead = parseInt(vs.getAttribute("data-lead") || "0", 10);
        y = Math.max(0, top - lead);
      } else {
        // Keep in view with a margin.
        var cur = vt.__y || 0, viewH = vs.clientHeight, h = anchorEl.offsetHeight, m = 80;
        y = cur;
        if (top - m < cur) y = top - m;
        if (top + h + m > cur + viewH) y = top + h + m - viewH;
        y = Math.max(0, Math.min(y, Math.max(0, vt.scrollHeight - viewH)));
      }
      vt.__y = y;
      setTransform(vt, "translate3d(0," + (-y) + "px,0)", instant);
      vs.classList.toggle("scrolled", y > 0);
    }
  }
  function setTransform(el, t, instant) {
    if (instant) { el.style.transition = "none"; el.style.transform = t; el.offsetHeight; el.style.transition = ""; }
    else el.style.transform = t;
  }
  function offsetWithin(el, ancestor) {
    var left = 0, top = 0, n = el;
    while (n && n !== ancestor) { left += n.offsetLeft; top += n.offsetTop; n = n.offsetParent; }
    return { left: left, top: top };
  }

  function center(r) { return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }

  function best(dir, from, list) {
    var a = from.getBoundingClientRect(), ac = center(a), winner = null, score = Infinity;
    list.forEach(function (el) {
      if (el === from) return;
      var b = el.getBoundingClientRect(), bc = center(b), primary, secondary;
      if (dir === KEY.RIGHT) { if (bc.x <= ac.x + 1 || b.left < a.left + 1) return; primary = Math.max(0, b.left - a.right); secondary = gap(a.top, a.bottom, b.top, b.bottom); }
      else if (dir === KEY.LEFT) { if (bc.x >= ac.x - 1 || b.right > a.right - 1) return; primary = Math.max(0, a.left - b.right); secondary = gap(a.top, a.bottom, b.top, b.bottom); }
      else if (dir === KEY.DOWN) { if (bc.y <= ac.y + 1 || b.top < a.top + 1) return; primary = Math.max(0, b.top - a.bottom); secondary = Math.abs(bc.x - ac.x) * 0.5 + gap(a.left, a.right, b.left, b.right); }
      else { if (bc.y >= ac.y - 1 || b.bottom > a.bottom - 1) return; primary = Math.max(0, a.top - b.bottom); secondary = Math.abs(bc.x - ac.x) * 0.5 + gap(a.left, a.right, b.left, b.right); }
      var s = primary + secondary * 2;
      if (s < score) { score = s; winner = el; }
    });
    return winner;
  }
  function gap(a1, a2, b1, b2) { return b2 < a1 ? a1 - b2 : b1 > a2 ? b1 - a2 : 0; }

  function move(dir) {
    var list = candidates();
    if (!current || list.indexOf(current) < 0) { focus(Nav.defaultFocus() || list[0]); return; }
    // An element may route a direction itself (e.g. back to the rail).
    var route = current.getAttribute("data-" + dir);
    if (route) { var t = scope().querySelector(route); if (t && visible(t)) { focus(t); return; } }
    var row = closestRow(current);
    if (row && (dir === KEY.LEFT || dir === KEY.RIGHT)) {
      var inRow = list.filter(function (el) { return closestRow(el) === row; });
      var next = best(dir, current, inRow);
      if (next) { focus(next); return; }
      if (dir === KEY.RIGHT) return bump();
      // Leftmost card in a row: go to the side rail (Netflix behaviour).
      var rail = scope().querySelector(".rail .focusable.active") || scope().querySelector(".rail .focusable");
      if (rail && visible(rail)) { focus(rail); return; }
      return bump();
    }
    var target = best(dir, current, list);
    // Into a row: land on the card nearest the current x, among those on screen.
    if (target) {
      // Entering the side rail lands on the current page's item (Netflix / Prime Video TV).
      var railEl = target.closest ? target.closest(".rail") : null;
      if (railEl && !railEl.contains(current)) target = railEl.querySelector(".focusable.active") || target;
      var trow = closestRow(target);
      if (trow && trow !== row && trow.__last && visible(trow.__last) && dir !== KEY.LEFT && dir !== KEY.RIGHT) {
        var lr = trow.__last.getBoundingClientRect();
        if (lr.left >= 0 && lr.right <= window.innerWidth + 2) target = trow.__last;
      }
      focus(target);
    } else bump();
  }
  function bump() {
    if (!current) return;
    current.classList.remove("bump"); current.offsetWidth; current.classList.add("bump");
  }

  document.addEventListener("tvfocus", function (e) {
    var row = closestRow(e.detail);
    if (row) row.__last = e.detail;
  });

  function keyOf(e) { return NAMES[e.key] || CODES[e.keyCode] || null; }

  function onKeyDown(e) {
    var k = keyOf(e);
    if (!k) return;
    // Real text inputs keep Backspace for deleting (system keyboard), unless they are empty.
    var a = document.activeElement;
    if (k === KEY.BACK && e.keyCode === 8 && a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA") && a.value) return;
    e.preventDefault();
    var layer = layers[layers.length - 1];
    if (layer && layer.onKey && layer.onKey(k, e) === true) return;
    if (Nav.globalKey && Nav.globalKey(k, e) === true) return;
    if (k === KEY.OK) { if (current && current.onselect) current.onselect(); else if (current) current.click(); return; }
    if (k === KEY.BACK) { if (layer && layer.onBack) layer.onBack(); else if (Nav.onBack) Nav.onBack(); return; }
    if (k === KEY.LEFT || k === KEY.RIGHT || k === KEY.UP || k === KEY.DOWN) move(k);
  }

  var Nav = {
    KEY: KEY,
    focus: focus,
    current: function () { return current; },
    move: move,
    reveal: reveal,
    defaultFocus: function () { return scope().querySelector(".focusable.autofocus") || scope().querySelector(".focusable"); },
    /** Pushes a modal layer: focus stays inside it until it is popped. */
    push: function (root, opts) {
      opts = opts || {};
      // Remember where focus was so closing the layer returns there.
      layers.push({ root: root, onKey: opts.onKey, onBack: opts.onBack, restore: current });
      var f = opts.focus || root.querySelector(".focusable.autofocus") || root.querySelector(".focusable");
      if (f) focus(f, { instant: true });
    },
    pop: function (root) {
      for (var i = layers.length - 1; i >= 0; i--) {
        if (layers[i].root === root) {
          var back = layers[i].restore;
          layers.splice(i, 1);
          if (back && visible(back)) focus(back, { instant: true }); else if (current && !visible(current)) focus(Nav.defaultFocus());
          return;
        }
      }
    },
    depth: function () { return layers.length; },
    onBack: null,
    globalKey: null
  };

  document.addEventListener("keydown", onKeyDown, true);
  // Mouse / Magic-remote pointer: hovering focuses, clicking selects.
  document.addEventListener("mousemove", function (e) {
    var el = e.target.closest ? e.target.closest(".focusable") : null;
    if (el && el !== current && scope().contains(el)) focus(el, { instant: true });
  });
  document.addEventListener("click", function (e) {
    var el = e.target.closest ? e.target.closest(".focusable") : null;
    if (el && el.onselect && scope().contains(el)) { e.preventDefault(); focus(el, { instant: true }); el.onselect(); }
  });

  window.Nav = Nav;
})();
