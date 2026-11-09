/* Small helpers shared by every file. ES2017, no optional chaining: older VIDAA browsers. */
(function () {
  "use strict";

  /** h("div.card.focusable", {onclick: fn, style: {...}}, [children]) */
  function h(sel, attrs, kids) {
    var parts = sel.split(".");
    var el = document.createElement(parts[0] || "div");
    if (parts.length > 1) el.className = parts.slice(1).join(" ");
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === "style" && typeof v === "object") Object.keys(v).forEach(function (s) { el.style[s] = v[s]; });
        else if (k.indexOf("on") === 0 && typeof v === "function") el[k] = v;
        else if (k === "html") el.innerHTML = v;
        else if (k === "text") el.textContent = v;
        else if (k === "data") Object.keys(v).forEach(function (d) { el.setAttribute("data-" + d, v[d]); });
        else el.setAttribute(k, v === true ? "" : v);
      });
    }
    append(el, kids);
    return el;
  }
  function append(el, kids) {
    if (kids === null || kids === undefined || kids === false) return;
    if (!Array.isArray(kids)) kids = [kids];
    kids.forEach(function (k) {
      if (k === null || k === undefined || k === false) return;
      if (Array.isArray(k)) append(el, k);
      else el.appendChild(typeof k === "string" || typeof k === "number" ? document.createTextNode(String(k)) : k);
    });
  }

  /* Material Symbols (Apache 2.0) paths, 24x24. */
  var ICONS = {
    search: "M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
    home: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
    live: "M21 6h-7.59l3.29-3.29L16 2l-4 4-4-4-.71.71L10.59 6H3c-1.1 0-2 .89-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.11-.9-2-2-2zm0 14H3V8h18v12zM9 10v8l7-4z",
    movie: "M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z",
    series: "M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z",
    mic: "M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z",
    radio: "M3.24 6.15C2.51 6.43 2 7.17 2 8v12c0 1.1.89 2 2 2h16c1.11 0 2-.9 2-2V8c0-1.11-.89-2-2-2H8.3l8.26-3.34L15.88 1 3.24 6.15zM7 20c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm13-8h-2v-2h-2v2H4V8h16v4z",
    bookmark: "M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z",
    person: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
    play: "M8 5v14l11-7z",
    pause: "M6 19h4V5H6v14zm8-14v14h4V5h-4z",
    add: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
    check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
    info: "M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z",
    replay: "M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z",
    logout: "M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z",
    backspace: "M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z",
    mail: "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
    rewind: "M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z",
    forward: "M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z",
    exit: "M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"
  };
  function icon(name, cls) {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("class", "ic" + (cls ? " " + cls : ""));
    svg.setAttribute("aria-hidden", "true");
    var p = document.createElementNS(ns, "path");
    p.setAttribute("d", ICONS[name] || "");
    p.setAttribute("fill", "currentColor");
    svg.appendChild(p);
    return svg;
  }

  var store = {
    get: function (k, fallback) {
      try { var v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage full / blocked */ } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };

  /** "worship music" -> "Worship Music" (web titleCase / Android displayCase). */
  function titleCase(s) {
    if (!s) return "";
    return String(s).toLowerCase().replace(/(^|[\s\-\/&(])([a-z])/g, function (m, a, b) { return a + b.toUpperCase(); });
  }
  function clock(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    var hh = Math.floor(sec / 3600), mm = Math.floor((sec % 3600) / 60), ss = sec % 60;
    var two = function (n) { return (n < 10 ? "0" : "") + n; };
    return hh > 0 ? hh + ":" + two(mm) + ":" + two(ss) : mm + ":" + two(ss);
  }
  function minutesLabel(m) { return m >= 60 ? Math.floor(m / 60) + "h " + (m % 60) + "m" : m + "m"; }
  function greeting() {
    var hr = new Date().getHours();
    return hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
  }
  function debounce(fn, ms) {
    var t = null;
    return function () { var a = arguments, self = this; clearTimeout(t); t = setTimeout(function () { fn.apply(self, a); }, ms); };
  }
  function uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }
  /** Loads an image; resolves with the first source that works (null if none). */
  function firstImage(srcs) {
    srcs = srcs.filter(Boolean);
    return new Promise(function (resolve) {
      var i = 0;
      (function next() {
        if (i >= srcs.length) return resolve(null);
        var src = srcs[i++], img = new Image();
        img.onload = function () { resolve(src); };
        img.onerror = next;
        img.src = src;
      })();
    });
  }
  /** Sets a CSS background from the first working image, else the fallback class keeps the brand art. */
  var CHANNEL_EDITS = [
    ["b44b17a1-80cb-4ba4-b6fa-d3b77dd42467", "assets/joycall-tv.png", "joycall"],
    ["e37fa535-a86f-41c7-9f2a-ea7f31124a40", "assets/lxp-wide.jpg", "lxp"],
    ["7987409c-f107-4d66-8728-f9d68d1139e6", "assets/healing-streams-tv.png", "healing"],
    ["ANd9GcRIsdi08fsNCCXUi9-fssXu6MlqtdHwvtVamm7tPbXWLNFgbc5QAvxVEA-1", "assets/rhapsodytv.png", "rhapsody"]
  ];
  function channelEdit(src) { return CHANNEL_EDITS.filter(function (art) { return src && src.indexOf(art[0]) >= 0; })[0] || null; }
  function bg(el, srcs) {
    firstImage(srcs).then(function (src) {
      if (src) { el.style.backgroundImage = "url(\"" + src.replace(/"/g, "%22") + "\")"; el.classList.add("has-img"); }
    });
    return el;
  }
  var CHANNEL_ART = { academy: 1, cinema: 1, family: 1, news: 1, radio: 1, sports: 1, worship: 1 };
  /** Repo channel art for a category (web channelArt()). */
  function channelArt(category, isRadio) {
    if (isRadio) return "assets/channels/radio.jpg";
    var c = String(category || "").toLowerCase();
    var key = /sport/.test(c) ? "sports" : /news/.test(c) ? "news" : /kid|family/.test(c) ? "family" :
      /educat|academ|learn/.test(c) ? "academy" : /movie|film|cinema|entertain/.test(c) ? "cinema" : "worship";
    return CHANNEL_ART[key] ? "assets/channels/" + key + ".jpg" : null;
  }

  window.U = {
    h: h, append: append, icon: icon, store: store, titleCase: titleCase, clock: clock, minutesLabel: minutesLabel,
    greeting: greeting, debounce: debounce, uuid: uuid, channelEdit: channelEdit, bg: bg, firstImage: firstImage, channelArt: channelArt
  };
})();
