/* Reusable TV components. */
(function () {
  "use strict";
  var h = U.h, icon = U.icon, Personal = Api.Personal, Catalog = Api.Catalog;

  /** A selectable element: OK (or click) runs [fn]. */
  function sel(el, fn) { el.classList.add("focusable"); el.onselect = fn; return el; }

  function button(label, iconName, fn, cls) {
    return sel(h("div.btn" + (cls ? "." + cls : ""), { role: "button", "aria-label": label, title: label }, [iconName ? icon(iconName) : null, h("span", { text: label })]), fn);
  }

  // ---------------- Side rail (Netflix / Prime Video TV navigation) ----------------

  var RAIL = [
    { id: "search", label: "Search", icon: "search" },
    { id: "home", label: "Home", icon: "home" },
    { id: "channels", label: "Channels", icon: "live" },
    { id: "movies", label: "Movies", icon: "movie" },
    { id: "series", label: "Series", icon: "series" },
    { id: "podcasts", label: "Podcasts", icon: "mic" },
    { id: "radio", label: "Radio", icon: "radio" },
    { id: "mylist", label: "My List", icon: "bookmark" }
  ];

  /** Built once; screens call setActive(id). */
  function rail(go) {
    var items = RAIL.map(function (r) {
      return sel(h("div.rail-item", { data: { id: r.id } }, [icon(r.icon), h("span.rail-label", { text: r.label })]),
        function () { go(r.id); });
    });
    var avatar = h("span.rail-avatar"), myName = h("span.rail-label");
    var me = sel(h("div.rail-item.rail-me", { data: { id: "account" } }, [avatar, myName]), function () { go("account"); });
    var el = h("nav.rail", null, [
      h("div.rail-logo", null, [h("img.rail-symbol", { src: "assets/lettflix_symbol.png", alt: "" }), h("img.rail-word", { src: "assets/lettflix_horizontal.png", alt: "Lettflix" })]),
      h("div.rail-items", null, items), me
    ]);
    // The rail opens (labels slide out over a dark scrim) while it has focus.
    document.addEventListener("tvfocus", function (e) { el.classList.toggle("open", el.contains(e.detail)); });
    el.setActive = function (id) {
      var all = el.querySelectorAll(".rail-item");
      for (var i = 0; i < all.length; i++) all[i].classList.toggle("active", all[i].getAttribute("data-id") === id);
    };
    // Sections an admin switched off drop out of the rail (web nav parity).
    el.applyFeatures = function () {
      var all = el.querySelectorAll(".rail-item");
      for (var i = 0; i < all.length; i++) {
        var id = all[i].getAttribute("data-id");
        var key = { channels: "channels", movies: "movies", series: "series", podcasts: "podcasts", radio: "radio" }[id];
        all[i].style.display = key && !Api.Catalog.featureOn(key) ? "none" : "";
      }
    };
    el.refreshUser = function () {
      var name = Api.Auth.displayName() || "You";
      avatar.textContent = name.charAt(0).toUpperCase(); myName.textContent = name;
      var image = Api.Auth.avatar(); if (image) { avatar.textContent = ""; avatar.appendChild(h("img", { src: image, alt: "", onerror: function () { avatar.textContent = name.charAt(0).toUpperCase(); } })); }
    };
    el.refreshUser();
    return el;
  }

  // ---------------- Cards ----------------

  function progressBar(pct) {
    return h("div.progress", null, h("div.progress-fill", { style: { width: Math.max(2, Math.min(100, pct)) + "%" } }));
  }

  /** 16:9 title card: backdrop art with the title lettered on it (Netflix TV). */
  function titleCard(t, onSelect, opts) {
    opts = opts || {};
    var art = h("div.card-art.fallback");
    U.bg(art, [t.backdrop, t.poster, "assets/lettflix_symbol.png"]);
    var p = Personal.progress(t.slug);
    var badge = opts.badge ? h("span.card-badge", { text: opts.badge }) : null;
    var el = h("div.card", null, [
      art, h("div.card-scrim"), badge,
      h("div.card-title", { text: U.titleCase(t.title) }),
      p && p.pct >= 1 && p.pct <= 97 ? progressBar(p.pct) : null
    ]);
    el.__item = { type: "title", data: t };
    return sel(el, function () { onSelect(t); });
  }

  /** Live channel card: banner art, logo, LIVE badge and what's on now. */
  function channelCard(c, onSelect) {
    var art = h("div.card-art.fallback");
    channelArtwork(art, [c.banner, c.logo, U.channelArt(c.category, c.isRadio)]);
    var now = Catalog.nowOn(c);
    var el = h("div.card.channel-card", null, [
      art, h("div.card-scrim"),
      c.isLive ? h("span.live-badge", null, [h("i.live-dot"), "LIVE"]) : null,
      c.logo ? h("img.card-logo", { src: c.logo, alt: "", onerror: function () { this.style.display = "none"; } }) : null,
      h("div.card-meta", null, [h("div.card-name", { text: c.name }), h("div.card-now", { text: now ? "Now: " + now : (c.tagline || U.titleCase(c.category)) })])
    ]);
    el.__item = { type: "channel", data: c };
    return sel(el, function () { onSelect(c); });
  }

  function channelArtwork(el, sources) {
    var edit = U.channelEdit(sources[0]);
    if (edit) { sources = [edit[1]].concat(sources); el.setAttribute("data-artwork-theme", edit[2]); }
    U.firstImage(sources).then(function (src) {
      if (!src) return;
      el.classList.remove("fallback"); el.style.backgroundImage = "none";
      U.append(el, [h("img.channel-art-fill", { src: src, alt: "" }), h("img.channel-art-full", { src: src, alt: "" })]);
    });
    return el;
  }

  function radioCard(r, onSelect) {
    var art = h("div.card-art.fallback");
    channelArtwork(art, [r.artwork, r.logo, r.banner, "assets/channels/radio.jpg"]);
    var el = h("div.card.radio-card", null, [
      art, h("div.card-scrim"), h("span.live-badge", null, [h("i.live-dot"), "ON AIR"]),
      h("div.card-meta", null, [h("div.card-name", { text: r.name }),
        h("div.card-now", { text: [r.nowTitle, r.nowArtist].filter(Boolean).join(" — ") || r.tagline || "Live radio" })])
    ]);
    el.__item = { type: "radio", data: r };
    return sel(el, function () { onSelect(r); });
  }

  /** Horizontal row with a heading; slides as focus moves (see Nav.reveal). */
  function row(title, cards, opts) {
    opts = opts || {};
    if (!cards.length) return null;
    return h("section.row.vanchor" + (opts.cls ? "." + opts.cls : ""), null, [
      h("h2.row-title", { text: title }),
      h("div.hrow", { data: { pad: "160" } }, h("div.htrack", null, cards))
    ]);
  }

  // ---------------- Toast, dialog ----------------

  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById("toast");
    el.textContent = msg; el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 3200);
  }

  function dialog(title, body, actions) {
    var layer = document.getElementById("overlay");
    var close = function () { Nav.pop(box); wrap.parentNode && wrap.parentNode.removeChild(wrap); };
    var btns = actions.map(function (a, i) {
      return button(a.label, a.icon, function () { close(); if (a.run) a.run(); }, (a.primary ? "primary" : "") + (i === 0 ? " autofocus" : ""));
    });
    var box = h("div.dialog", null, [h("h2", { text: title }), body ? h("p", { text: body }) : null, h("div.dialog-actions", null, btns)]);
    var wrap = h("div.dialog-wrap", null, box);
    layer.appendChild(wrap);
    Nav.push(box, { onBack: close });
    return close;
  }

  // ---------------- On-screen keyboard ----------------

  /**
   * TV keyboard (as in Netflix): works with any remote, no system keyboard needed.
   * onChange(value) runs on every key; onDone(value) on Done.
   */
  function keyboard(opts) {
    var value = opts.value || "", upper = false, symbols = false;
    var layout = function () {
      if (symbols) return ["1234567", "890@.-_", "!#$%&*+", "=?/'()"];
      var rows = opts.email ? ["abcdefg", "hijklmn", "opqrstu", "vwxyz@."] : ["abcdefg", "hijklmn", "opqrstu", "vwxyz12", "3456789", "0"];
      return rows.map(function (r) { return upper ? r.toUpperCase() : r; });
    };
    var grid = h("div.osk-grid");
    var root = h("div.osk" + (opts.compact ? ".compact" : ""), null, [grid]);
    function emit() { if (opts.onChange) opts.onChange(value); }
    function key(label, fn, cls) { return sel(h("div.osk-key" + (cls ? "." + cls : ""), null, typeof label === "string" ? h("span", { text: label }) : label), fn); }
    function render(keepFocus) {
      var focusedLabel = keepFocus && Nav.current() && grid.contains(Nav.current()) ? Nav.current().textContent : null;
      grid.innerHTML = "";
      layout().forEach(function (r) {
        grid.appendChild(h("div.osk-row", null, r.split("").map(function (ch) {
          return key(ch, function () { value += ch; emit(); });
        })));
      });
      var extras = [
        key("space", function () { value += " "; emit(); }, "wide"),
        key(icon("backspace"), function () { value = value.slice(0, -1); emit(); }, "wide del"),
        key(symbols ? "abc" : "#+=", function () { symbols = !symbols; render(true); }),
        opts.email || opts.password ? key(upper ? "abc" : "ABC", function () { upper = !upper; render(true); }) : key("clear", function () { value = ""; emit(); })
      ];
      if (opts.email) extras.splice(1, 0, key(".com", function () { value += ".com"; emit(); }));
      grid.appendChild(h("div.osk-row", null, extras));
      if (opts.onDone) grid.appendChild(h("div.osk-row", null, key(opts.doneLabel || "Done", function () { opts.onDone(value); }, "done")));
      if (focusedLabel !== null) {
        var keys = grid.querySelectorAll(".osk-key");
        for (var i = 0; i < keys.length; i++) if (keys[i].textContent === focusedLabel || keys[i].textContent.toLowerCase() === focusedLabel.toLowerCase()) { Nav.focus(keys[i], { instant: true }); return; }
        Nav.focus(keys[0], { instant: true });
      }
    }
    render(false);
    root.setValue = function (v) { value = v; };
    root.firstKey = function () { return grid.querySelector(".osk-key"); };
    return root;
  }

  /**
   * A text field that opens the on-screen keyboard in a panel (email / password / name).
   * The value shows masked for passwords.
   */
  function field(label, opts) {
    var value = opts.value || "";
    var shown = h("div.field-value");
    var el = sel(h("div.field", null, [h("div.field-label", { text: label }), shown]), function () {
      var panel, kb, preview = h("div.kb-preview");
      function paint(v) {
        preview.textContent = opts.password ? new Array(v.length + 1).join("•") : v;
        if (!v) preview.appendChild(h("span.ph", { text: opts.placeholder || label }));
      }
      kb = keyboard({
        value: value, email: opts.email, password: opts.password,
        onChange: function (v) { paint(v); },
        onDone: function (v) { value = v; refresh(); Nav.pop(panel); wrap.parentNode.removeChild(wrap); if (opts.onDone) opts.onDone(v); },
        doneLabel: opts.doneLabel || "Next"
      });
      paint(value);
      panel = h("div.kb-panel", null, [h("div.kb-label", { text: label }), preview, kb]);
      var wrap = h("div.dialog-wrap.kb-wrap", null, panel);
      document.getElementById("overlay").appendChild(wrap);
      Nav.push(panel, { focus: kb.firstKey(), onBack: function () { Nav.pop(panel); wrap.parentNode.removeChild(wrap); } });
    });
    function refresh() {
      shown.textContent = opts.password ? new Array(value.length + 1).join("•") : value;
      if (!value) shown.appendChild(h("span.ph", { text: opts.placeholder || "" }));
    }
    refresh();
    el.value = function () { return value; };
    return el;
  }

  window.UI = {
    sel: sel, button: button, rail: rail, titleCard: titleCard, channelCard: channelCard, radioCard: radioCard,
    row: row, toast: toast, dialog: dialog, keyboard: keyboard, field: field, progressBar: progressBar, channelArtwork: channelArtwork
  };
})();
