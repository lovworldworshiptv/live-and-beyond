/* App shell: intro, sign-in gate, side rail, screen history and the Back key. */
(function () {
  "use strict";
  var h = U.h, Auth = Api.Auth, Catalog = Api.Catalog;
  var ROOTS = ["search", "home", "channels", "movies", "series", "podcasts", "radio", "mylist", "account"];

  var stage = document.getElementById("stage");
  var main = document.getElementById("main");
  var railEl = null;
  var stack = [];     // { name, arg, screen, lastFocus }
  // Local testing only: http://localhost:8080/?preview opens the app without signing in.
  var preview = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]preview\b/.test(location.search);
  function signedIn() { return preview || Auth.signedIn(); }

  // ---- 1920x1080 stage scaled to the TV's viewport (720p and 4K browsers alike). ----
  function fit() {
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    stage.style.transform = "scale(" + s + ")";
    stage.style.left = Math.round((window.innerWidth - 1920 * s) / 2) + "px";
    stage.style.top = Math.round((window.innerHeight - 1080 * s) / 2) + "px";
  }
  window.addEventListener("resize", fit);
  fit();

  // ---- Navigation actions handed to screens ----
  var go = {
    root: function (name) { show(name, null, true); },
    push: function (name, arg) { show(name, arg, false); },
    back: back,
    exit: confirmExit,
    openTitle: function (t) { go.push("title", t.slug); },
    openChannel: function (c) { go.push("channel", c.slug); },
    openRadio: function (r) { Player.playRadio(r.slug); },
    open: function (item) { if (item.type === "title") go.openTitle(item.data); else go.play(item); },
    play: function (item) {
      if (item.type === "title") {
        if (!item.data.stream) { go.openTitle(item.data); return; }
        Player.playTitle(item.data.slug, true, go.refresh);
      } else if (item.type === "radio") Player.playRadio(item.data.slug);
      else Player.playChannel(item.data.slug);
    },
    /** After the player closes: the title page rebuilds so "Resume" and progress are current. */
    refresh: function () {
      var top = stack[stack.length - 1];
      if (top && top.name === "title") { var f = Nav.current(); rebuild(top); if (f && !document.body.contains(f)) Nav.focus(top.screen.focus()); }
    }
  };

  function build(name, arg) {
    return name === "title" ? Screens.title(arg, go) : name === "channel" ? Screens.channel(arg, go) : Screens[name](go);
  }
  function rebuild(entry) {
    if (entry.screen.destroy) entry.screen.destroy();
    var old = entry.screen.el;
    entry.screen = build(entry.name, entry.arg);
    main.replaceChild(entry.screen.el, old);
  }

  function show(name, arg, isRoot) {
    var cur = stack[stack.length - 1];
    if (isRoot) {
      if (cur && cur.name === name && stack.length === 1) { focusScreen(cur); return; }
      stack.forEach(function (e) { if (e.screen.destroy) e.screen.destroy(); });
      stack = []; main.innerHTML = "";
      if (railEl) railEl.setActive(name);
      if (signedIn()) Catalog.refreshIfStale().catch(function () {});
    } else if (cur) {
      cur.lastFocus = Nav.current();
      cur.screen.el.style.display = "none";
    }
    var entry = { name: name, arg: arg, screen: build(name, arg), lastFocus: null };
    stack.push(entry);
    entry.screen.el.classList.add("enter");
    main.appendChild(entry.screen.el);
    focusScreen(entry);
    if (signedIn()) U.store.set("lf.screen." + (Auth.userId() || "guest"), { name: name, arg: arg });
  }
  function focusScreen(entry) {
    var f = entry.screen.focus ? entry.screen.focus() : null;
    Nav.focus(f || entry.screen.el.querySelector(".focusable") || (railEl && railEl.querySelector(".active")), { instant: true });
  }

  function back() {
    if (stack.length > 1) {
      var top = stack.pop();
      if (top.screen.destroy) top.screen.destroy();
      main.removeChild(top.screen.el);
      var prev = stack[stack.length - 1];
      prev.screen.el.style.display = "";
      if (prev.lastFocus && document.body.contains(prev.lastFocus)) Nav.focus(prev.lastFocus, { instant: true }); else focusScreen(prev);
      return;
    }
    var name = stack[0] ? stack[0].name : null;
    // In the rail: Back returns to the page. On a page other than Home: Back goes Home. On Home / welcome: exit.
    if (railEl && railEl.contains(Nav.current()) && stack[0]) { focusScreen(stack[0]); return; }
    if (signedIn() && name !== "home") { go.root("home"); return; }
    confirmExit();
  }

  function confirmExit() {
    UI.dialog("Exit Lettflix?", null, [
      { label: "Exit", icon: "exit", primary: true, run: function () { window.close(); } },
      { label: "Keep watching" }
    ]);
  }
  Nav.onBack = back;

  // ---- Signed in / out ----
  function startApp() {
    stage.classList.toggle("signed-out", !signedIn());
    stack = []; main.innerHTML = "";
    if (signedIn()) {
      if (!railEl) { railEl = UI.rail(function (id) { go.root(id); }); stage.insertBefore(railEl, main); }
      railEl.refreshUser();
      railEl.style.display = "";
      var ready = Catalog.hasData() ? Promise.resolve() : loading(Catalog.refresh());
      ready.then(function () { var saved = U.store.get("lf.screen." + (Auth.userId() || "guest"), null); if (saved && ROOTS.indexOf(saved.name) >= 0) go.root(saved.name); else if (saved && (saved.name === "title" || saved.name === "channel")) { go.root("home"); go.push(saved.name, saved.arg); } else go.root("home"); }, function () { offline(); });
    } else {
      if (railEl) railEl.style.display = "none";
      go.root("welcome");
    }
  }
  Auth.onChange(function () { startApp(); });

  function loading(p) {
    main.innerHTML = ""; main.appendChild(h("div.screen.center", null, h("div.spinner.big")));
    return p;
  }
  function offline() {
    main.innerHTML = "";
    var retry = UI.button("Try again", "replay", function () { loading(Catalog.refresh()).then(function () { go.root("home"); }, offline); }, "primary autofocus");
    main.appendChild(h("div.screen.center", null, h("div.empty", null, [
      h("h2", { text: "You're offline" }), h("p", { text: "Check this TV's internet connection, then try again." }), h("div.bb-actions.center", null, retry)
    ])));
    Nav.focus(retry);
  }
  window.addEventListener("online", function () { if (!Catalog.hasData()) startApp(); else UI.toast("You're back online."); });
  window.addEventListener("offline", function () { UI.toast("You're offline. Check your connection."); });

  // ---- Cinematic intro with the Lettflix logo and sound ----
  function intro() {
    return new Promise(function (resolve) {
      var el = h("div.intro", null, [
        h("div.intro-glow"), h("div.intro-beam"),
        h("img.intro-symbol", { src: "assets/lettflix_symbol.png", alt: "" }),
        h("img.intro-word", { src: "assets/lettflix_horizontal.png", alt: "Lettflix" })
      ]);
      document.getElementById("overlay").appendChild(el);
      try { var a = new Audio("assets/intro.wav"); a.volume = 0.8; var p = a.play(); if (p && p.catch) p.catch(function () {}); } catch (e) { /* no audio */ }
      requestAnimationFrame(function () { el.classList.add("run"); });
      var skip = function () { done(); };
      var finished = false;
      function done() {
        if (finished) return; finished = true;
        document.removeEventListener("keydown", skip, true);
        el.classList.add("out");
        setTimeout(function () { el.parentNode && el.parentNode.removeChild(el); }, 600);
        resolve();
      }
      document.addEventListener("keydown", skip, true);
      setTimeout(done, 3600);
    });
  }

  // ---- Protection: no context menu, selection or dragging (web/Android parity) ----
  document.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  document.addEventListener("dragstart", function (e) { e.preventDefault(); });
  document.addEventListener("selectstart", function (e) { e.preventDefault(); });

  document.addEventListener("visibilitychange", function () { if (!document.hidden && Auth.signedIn()) { Auth.keepFresh(); Catalog.refreshIfStale().catch(function () {}); } });

  // ---- Boot ----
  var warm = signedIn() ? Catalog.refresh().catch(function () {}) : Promise.resolve();
  // Coming back from KingsChat (on-screen sign-in): skip the intro and finish signing in.
  var resumingKc = !signedIn() && !!Api.KingsChat.pending();
  Promise.all([resumingKc ? Promise.resolve() : intro(), Auth.keepFresh()]).then(function () {
    if (signedIn() && !Catalog.hasData()) return warm;
  }).then(startApp);
  setInterval(function () { if (Auth.signedIn()) Auth.keepFresh(); }, 5 * 60 * 1000);
  // Returning with the browser Back key may restore a frozen page: reload it so it runs again.
  window.addEventListener("pageshow", function (e) { if (e.persisted) window.location.reload(); });
})();
