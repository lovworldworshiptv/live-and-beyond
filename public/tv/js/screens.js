/* Screens. Each returns { el, focus } and may define onShow / destroy. */
(function () {
  "use strict";
  var h = U.h, icon = U.icon, Catalog = Api.Catalog, Personal = Api.Personal, Auth = Api.Auth;

  function data() { return Catalog.data; }
  function byNewest(a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); }
  function videoChannels() {
    return data().channels.filter(function (c) { return !c.isRadio; }).sort(function (a, b) {
      return (b.isLive ? 1 : 0) - (a.isLive ? 1 : 0) || a.position - b.position;
    });
  }
  function continueWatching() {
    var all = Personal.allProgress();
    return data().titles.filter(function (t) { var p = all[t.slug]; return p && p.pct >= 1 && p.pct <= 97; })
      .sort(function (a, b) { return all[b.slug].at - all[a.slug].at; });
  }
  function categories(titles) {
    var seen = {}, out = [];
    titles.forEach(function (t) { if (t.category && !seen[t.category]) { seen[t.category] = 1; out.push(t.category); } });
    return out;
  }
  function empty(msg, sub) { return h("div.empty", null, [h("h2", { text: msg }), sub ? h("p", { text: sub }) : null]); }

  // ---------------- Billboard: shows the focused title / channel (Netflix TV) ----------------

  function billboard() {
    var art = h("div.bb-art"), art2 = h("div.bb-art"), front = 0;
    var kicker = h("div.bb-kicker"), title = h("h1.bb-title"), meta = h("div.bb-meta"), syn = h("p.bb-synopsis"), actions = h("div.bb-actions");
    var el = h("div.billboard", null, [art, art2, h("div.bb-fade"), h("div.bb-info", null, [kicker, title, meta, syn, actions])]);
    var shownKey = null;
    function setArt(srcs) {
      U.firstImage(srcs).then(function (src) {
        var next = front === 0 ? art2 : art, prev = front === 0 ? art : art2;
        next.style.backgroundImage = src ? "url(\"" + src + "\")" : "url(\"assets/auth-cinema.jpg\")";
        next.classList.add("on"); prev.classList.remove("on"); front = 1 - front;
      });
    }
    el.show = function (item, withActions) {
      var key = item.type + ":" + (item.data.slug || item.data.id) + (withActions ? ":a" : "");
      if (key === shownKey) return;
      shownKey = key;
      var d = item.data;
      el.classList.remove("swap"); el.offsetWidth; el.classList.add("swap");
      meta.innerHTML = ""; actions.style.display = withActions ? "" : "none";
      if (item.type === "title") {
        kicker.textContent = d.kind === "Film" ? "FILM" : d.kind.toUpperCase();
        title.textContent = U.titleCase(d.title);
        title.className = "bb-title" + (d.title.length > 22 ? " long" : "");
        U.append(meta, [d.category, d.year, d.duration].filter(Boolean).map(function (m) { return h("span", { text: m }); }));
        if (d.rating) meta.appendChild(h("span.rating", { text: d.rating }));
        var p = Personal.progress(d.slug);
        if (p && p.pct >= 1 && p.pct <= 97) meta.appendChild(h("span.bb-progress", null, [UI.progressBar(p.pct), h("em", { text: U.clock(p.dur - p.pos) + " left" })]));
        syn.textContent = d.synopsis;
        setArt([d.backdrop, d.poster]);
      } else {
        kicker.innerHTML = ""; U.append(kicker, [h("span.live-badge", null, [h("i.live-dot"), item.type === "radio" ? "ON AIR" : "LIVE"])]);
        title.textContent = d.name; title.className = "bb-title";
        U.append(meta, [U.titleCase(d.category), d.language, d.country].filter(Boolean).map(function (m) { return h("span", { text: m }); }));
        var now = item.type === "channel" ? Catalog.nowOn(d) : [d.nowTitle, d.nowArtist].filter(Boolean).join(" — ");
        syn.textContent = now ? "Now playing: " + now : (d.description || d.tagline || "");
        setArt([d.banner, d.nowArtwork, U.channelArt(d.category, item.type === "radio" || d.isRadio)]);
      }
    };
    el.actions = actions;
    return el;
  }

  /**
   * Browse layout (Home, Movies, Series, Podcasts): billboard on top, rows below sliding up as you
   * move down. The billboard's buttons belong to [hero]; on a card it describes that card instead.
   */
  function browse(hero, rows, go) {
    var bb = billboard();
    var list = h("div.vscroll.rows", { data: { mode: "row", lead: "0" } }, h("div.vtrack", null, rows.filter(Boolean)));
    var el = h("div.screen.browse", null, [bb, list]);
    if (hero) {
      var heroItem = hero.__item;
      var t = heroItem.data, isTitle = heroItem.type === "title";
      var playBtn = UI.button(isTitle ? (Personal.progress(t.slug) ? "Resume" : "Play") : "Watch live", "play", function () { go.play(heroItem); }, "primary autofocus");
      var infoBtn = isTitle ? UI.button("More info", "info", function () { go.open(heroItem); }) : null;
      var listBtn = isTitle ? UI.button(Personal.inList(t.slug) ? "In My List" : "My List", Personal.inList(t.slug) ? "check" : "add", function () {
        var added = Personal.toggleList(t.slug);
        listBtn.innerHTML = ""; U.append(listBtn, [icon(added ? "check" : "add"), h("span", { text: added ? "In My List" : "My List" })]);
        UI.toast(added ? "Added to My List" : "Removed from My List");
      }) : null;
      U.append(bb.actions, [playBtn, infoBtn, listBtn]);
      bb.show(heroItem, true);
    }
    var pending = U.debounce(function (item) { bb.show(item, false); }, 180);
    var onFocus = function (e) {
      var target = e.detail;
      if (!el.contains(target)) return;
      if (bb.actions.contains(target)) { if (hero) bb.show(hero.__item, true); el.classList.remove("in-rows"); return; }
      if (target.__item) { el.classList.add("in-rows"); pending(target.__item); }
    };
    document.addEventListener("tvfocus", onFocus);
    return {
      el: el,
      focus: function () { return el.querySelector(".focusable.autofocus") || el.querySelector(".card"); },
      destroy: function () { document.removeEventListener("tvfocus", onFocus); }
    };
  }

  function cardsFor(titles, go, badgeFn) { return titles.map(function (t) { return UI.titleCard(t, go.openTitle, { badge: badgeFn ? badgeFn(t) : null }); }); }

  // ---------------- Home ----------------

  function home(go) {
    var d = data(), films = d.titles.filter(function (t) { return !t.isAudio; });
    var featured = d.titles.filter(function (t) { return t.featured && !t.isAudio; });
    var heroT = featured[0] || films.slice().sort(byNewest)[0];
    var hero = heroT ? UI.titleCard(heroT, go.openTitle) : null;
    var newest = films.slice().sort(byNewest).slice(0, 12);
    var topYear = newest.length ? newest[0].createdAt : null;
    var rows = [
      UI.row("Live Right Now", videoChannels().filter(function (c) { return c.isLive; }).slice(0, 15).map(function (c) { return UI.channelCard(c, go.openChannel); }), { cls: "live-channel-row" }),
      UI.row("Continue watching for " + (Auth.displayName() || "you"), cardsFor(continueWatching(), go)),
      UI.row("New on Lettflix", cardsFor(newest, go, function (t) { return t.createdAt === topYear ? "Recently added" : null; })),
      UI.row("Featured On-Demand", cardsFor(Catalog.featured(), go)),
      UI.row("Podcasts", cardsFor(d.titles.filter(function (t) { return t.isAudio; }), go)),
      UI.row("Radio", d.radio.map(function (r) { return UI.radioCard(r, go.openRadio); }))
    ].concat(categories(films).map(function (cat) {
      return UI.row(cat, cardsFor(films.filter(function (t) { return t.category === cat; }), go));
    }));
    if (!hero && !rows.filter(Boolean).length) return { el: h("div.screen", null, empty("Nothing to watch yet", "New channels and titles appear here as soon as they are published.")) };
    return browse(hero, rows, go);
  }

  // ---------------- Movies / Series / Podcasts ----------------

  function hub(kind, go) {
    var match = kind === "movies" ? function (t) { return t.kind === "Film" || t.kind === "Documentary" || t.kind === "Concert" || t.kind === "Event"; }
      : kind === "series" ? function (t) { return t.kind === "Series"; } : function (t) { return t.isAudio; };
    var titles = data().titles.filter(match);
    if (!titles.length) {
      return { el: h("div.screen", null, empty("No " + (kind === "movies" ? "movies" : kind) + " yet", "Check back soon — new titles appear here as soon as they are published.")) };
    }
    var heroT = titles.filter(function (t) { return t.featured; })[0] || titles.slice().sort(byNewest)[0];
    var cw = continueWatching().filter(match);
    var rows = [
      UI.row("Continue watching", cardsFor(cw, go)),
      UI.row("New on Lettflix", cardsFor(titles.slice().sort(byNewest).slice(0, 12), go)),
      UI.row(kind === "podcasts" ? "Featured podcasts" : "Featured", cardsFor(titles.filter(function (t) { return t.featured; }), go))
    ].concat(categories(titles).map(function (cat) { return UI.row(cat, cardsFor(titles.filter(function (t) { return t.category === cat; }), go)); }));
    return browse(UI.titleCard(heroT, go.openTitle), rows, go);
  }

  // ---------------- Grid screens ----------------

  function gridScreen(heading, sub, chips, cards, emptyMsg) {
    var grid = h("div.grid", null, cards.length ? cards : empty(emptyMsg[0], emptyMsg[1]));
    var head = h("header.page-head.vanchor", null, [h("h1", { text: heading }), sub ? h("p", { text: sub }) : null, chips]);
    var list = h("div.vscroll.page", { data: { mode: "keep" } }, h("div.vtrack", null, [head, grid]));
    var el = h("div.screen.grid-screen", null, list);
    return { el: el, grid: grid, focus: function () { return el.querySelector(".chip.active") || el.querySelector(".card") || el.querySelector(".focusable"); } };
  }

  function channels(go) {
    var all = videoChannels(), cats = ["All"];
    all.forEach(function (c) { var t = U.titleCase(c.category); if (t && cats.indexOf(t) < 0) cats.push(t); });
    var active = "All", s;
    var chipRow = h("div.hrow.chips", { data: { pad: "0" } }, h("div.htrack", null, cats.map(function (cat) {
      return UI.sel(h("div.chip" + (cat === active ? ".active" : ""), { text: cat }), function () {
        active = cat;
        var chips = chipRow.querySelectorAll(".chip");
        for (var i = 0; i < chips.length; i++) chips[i].classList.toggle("active", chips[i].textContent === cat);
        fill();
      });
    })));
    var live = all.filter(function (c) { return c.isLive; }).length;
    s = gridScreen("The Channel Universe", (live ? live + " live · " : "") + all.length + " channels", chipRow, [], ["No channels yet", ""]);
    function fill() {
      s.grid.innerHTML = "";
      var list = all.filter(function (c) { return active === "All" || U.titleCase(c.category) === active; });
      U.append(s.grid, list.length ? list.map(function (c) { return UI.channelCard(c, go.openChannel); }) : empty("No channels in " + active, ""));
    }
    fill();
    return s;
  }

  function radio(go) {
    var st = data().radio;
    return gridScreen("Radio", "Live stations, always on.", null, st.map(function (r) { return UI.radioCard(r, go.openRadio); }),
      ["No radio stations yet", "Stations appear here as soon as they go on air."]);
  }

  function myList(go) {
    var slugs = Personal.myList();
    var titles = slugs.map(Catalog.title).filter(Boolean);
    return gridScreen("My List", titles.length ? titles.length + (titles.length === 1 ? " title" : " titles") : "", null,
      titles.map(function (t) { return UI.titleCard(t, go.openTitle); }),
      ["Your list is empty", "Add movies, series and podcasts with “My List” to watch them later."]);
  }

  // ---------------- Search ----------------

  function search(go) {
    var q = "";
    var query = h("div.search-query");
    var results = h("div.grid.search-results");
    var resultsWrap = h("div.vscroll.search-scroll", { data: { mode: "keep" } }, h("div.vtrack", null, results));
    function paint() {
      query.innerHTML = "";
      U.append(query, [icon("search"), q ? h("span", { text: q }) : h("span.ph", { text: "Search titles, channels, genres" })]);
      results.innerHTML = "";
      var n = q.trim().toLowerCase();
      var d = data();
      var titles = d.titles.filter(function (t) { return !n || (t.title + " " + t.category + " " + t.kind + " " + t.cast.join(" ")).toLowerCase().indexOf(n) >= 0; });
      var chans = d.channels.filter(function (c) { return n && (c.name + " " + c.category + " " + c.tagline).toLowerCase().indexOf(n) >= 0; });
      if (!n) titles = titles.slice().sort(byNewest).slice(0, 12);
      var cards = chans.map(function (c) { return UI.channelCard(c, go.openChannel); }).concat(titles.map(function (t) { return UI.titleCard(t, go.openTitle); }));
      results.appendChild(h("h2.results-head", { text: n ? (cards.length ? "Results for “" + q.trim() + "”" : "") : "Popular on Lettflix" }));
      U.append(results, cards.length ? cards : empty("No results for “" + q.trim() + "”", "Try a different title, channel or genre."));
    }
    var kb = UI.keyboard({ onChange: function (v) { q = v; paint(); }, compact: true });
    paint();
    var el = h("div.screen.search", null, [h("div.search-left", null, [query, kb]), resultsWrap]);
    return { el: el, focus: function () { return kb.firstKey(); } };
  }

  // ---------------- Title details ----------------

  function title(slug, go) {
    var t = Catalog.title(slug);
    if (!t) return { el: h("div.screen", null, empty("This title is no longer available", "")) };
    var art = h("div.detail-art");
    U.bg(art, [t.backdrop, t.poster, "assets/auth-cinema.jpg"]);
    var p = Personal.progress(slug), resumable = p && p.pct >= 1 && p.pct <= 97;
    var playable = !!t.stream;
    var listBtn;
    var buttons = [
      playable ? UI.button(resumable ? "Resume" : "Play", "play", function () { go.play({ type: "title", data: t }); }, "primary autofocus") : null,
      playable && resumable ? UI.button("Start over", "replay", function () { Player.playTitle(slug, false, go.refresh); }) : null,
      listBtn = UI.button(Personal.inList(slug) ? "In My List" : "My List", Personal.inList(slug) ? "check" : "add", function () {
        var added = Personal.toggleList(slug);
        listBtn.innerHTML = ""; U.append(listBtn, [icon(added ? "check" : "add"), h("span", { text: added ? "In My List" : "My List" })]);
        UI.toast(added ? "Added to My List" : "Removed from My List");
      }, playable ? null : "autofocus")
    ];
    // Web parity: a quiet return path to the title's channel — its live TV and live radio.
    var home = Catalog.channelById(t.channelId), homeRadio = home && Catalog.radioStation(home.slug);
    var liveTv = home && !home.isRadio && (home.stream || home.playout);
    var liveRadio = homeRadio && homeRadio.stream;
    var backToLive = home && (liveTv || liveRadio) ? h("div.back-to-live", null, [
      h("span", null, ["Back to live on ", h("b", { text: home.name })]),
      liveTv ? UI.button("Live TV", "live", function () { Player.playChannel(home.slug); }) : null,
      liveRadio ? UI.button("Live Radio", "radio", function () { Player.playRadio(home.slug); }) : null
    ]) : null;
    var meta = [t.kind, t.category, t.year, t.duration, t.seasons ? t.seasons + (t.seasons === 1 ? " season" : " seasons") : null].filter(Boolean)
      .map(function (m) { return h("span", { text: m }); });
    meta.push(h("span.rating", { text: t.rating }));
    var more = Catalog.data.titles.filter(function (x) { return x.slug !== slug && (x.category === t.category || x.kind === t.kind); }).slice(0, 12);
    var el = h("div.screen.detail", null, [
      art, h("div.detail-fade"),
      h("div.vscroll.detail-scroll", { data: { mode: "keep" } }, h("div.vtrack", null, [
        h("div.detail-info.vanchor", null, [
          h("div.bb-kicker", { text: t.kind.toUpperCase() }),
          h("h1.bb-title" + (t.title.length > 22 ? ".long" : ""), { text: U.titleCase(t.title) }),
          h("div.bb-meta", null, meta),
          resumable ? h("div.detail-progress", null, [UI.progressBar(p.pct), h("span", { text: U.clock(p.dur - p.pos) + " left" })]) : null,
          h("p.detail-synopsis", { text: t.synopsis }),
          t.cast.length ? h("p.detail-cast", null, [h("b", { text: "Featuring: " }), t.cast.join(", ")]) : null,
          playable ? null : h("p.detail-note", { text: "This title isn't available to play yet." }),
          h("div.bb-actions", null, buttons),
          backToLive
        ]),
        UI.row("More like this", more.map(function (x) { return UI.titleCard(x, go.openTitle); }))
      ]))
    ]);
    return { el: el, focus: function () { return el.querySelector(".autofocus") || el.querySelector(".focusable"); } };
  }

  // ---------------- Combined channel broadcasts and published library ----------------

  function channel(slug, go) {
    var c = Catalog.channel(slug);
    if (!c) return { el: h("div.screen", null, empty("This channel is no longer available", "")) };
    var station = Catalog.radioStation(slug), titles = Catalog.library(c), active = "All";
    var grid = h("div.grid"), actions = h("div.bb-actions"), mode = c.filterMode;
    if (!c.isRadio) actions.appendChild(UI.button("Watch Live TV", "live", function () { Player.playChannel(slug); }, "primary autofocus"));
    if (station && station.stream) actions.appendChild(UI.button("Listen To Radio", "radio", function () { Player.playRadio(slug); }, c.isRadio ? "primary autofocus" : ""));
    // Web parity: Follow with the public follower count, and per-channel notifications for followers.
    var Follows = Api.Follows, followers = null, busy = false;
    function setLabel(btn, iconName, label) { btn.innerHTML = ""; U.append(btn, [icon(iconName), h("span", { text: label })]); }
    function paintFollow() {
      var on = Follows.following(c.id);
      setLabel(followBtn, on ? "check" : "add", (on ? "Following" : "Follow") + (followers != null ? " · " + Api.formatFollowers(followers) : ""));
      var notifyOn = on && Follows.notify(c.id);
      setLabel(notifyBtn, notifyOn ? "bellOn" : "bell", notifyOn ? "Notifying" : "Notify Me");
    }
    var followBtn = UI.button("Follow", "add", function () {
      if (!Auth.signedIn()) { UI.toast("Sign in to follow channels"); return; }
      if (busy) return;
      busy = true;
      Follows.ready().then(function () { return Follows.toggle(c.id); }).then(function (on) {
        followers = followers == null ? null : Math.max(0, followers + (on ? 1 : -1));
        paintFollow();
        UI.toast(on ? "Following " + c.name : "Unfollowed " + c.name);
      }, function () { UI.toast("Couldn't update. Check your connection."); }).then(function () { busy = false; });
    });
    var notifyBtn = UI.button("Notify Me", "bell", function () {
      if (!Auth.signedIn()) { UI.toast("Sign in to get notifications"); return; }
      if (!Follows.following(c.id)) { UI.toast("Follow this channel first"); return; }
      if (busy) return;
      busy = true;
      var next = !Follows.notify(c.id);
      Follows.setNotify(c.id, next).then(function () {
        paintFollow();
        UI.toast(next ? "Notifications on for " + c.name : "Notifications off");
      }, function () { UI.toast("Couldn't update notifications. Try again."); }).then(function () { busy = false; });
    });
    var followOn = Catalog.featureOn("follow");
    if (followOn) actions.appendChild(followBtn);
    if (followOn) actions.appendChild(notifyBtn);
    if (followOn) Follows.count(c.id).then(function (n) { followers = n; paintFollow(); }, function () {});
    if (followOn && Auth.signedIn()) Follows.ready().then(paintFollow, function () {});
    var chips = h("div.hrow.chips", { data: { pad: "0" } }, h("div.htrack", null, Catalog.filterOptions(titles, mode).map(function (value) {
      return UI.sel(h("div.chip" + (value === "All" ? ".active" : ""), { text: U.titleCase(value) }), function () {
        active = value;
        var nodes = chips.querySelectorAll(".chip");
        for (var i = 0; i < nodes.length; i++) nodes[i].classList.toggle("active", nodes[i].textContent === U.titleCase(value));
        fill();
      });
    })));
    function fill() { grid.innerHTML = ""; var filtered = titles.filter(function (t) { return Catalog.matchesFilter(t, mode, active); }); U.append(grid, filtered.length ? cardsFor(filtered, go) : empty("No content yet", "")); }
    fill();
    var banner = UI.channelArtwork(h("div.channel-header-art"), [c.banner, c.logo, U.channelArt(c.category, c.isRadio)]);
    var content = h("div.vtrack", null, [h("header.page-head.vanchor", null, [banner, h("h1", { text: c.name }), actions]), programSchedule(c), h("h2", { text: "Channel Library" }), chips, grid]);
    var el = h("div.screen.grid-screen.channel-detail", null, h("div.vscroll.page", { data: { mode: "keep" } }, content));
    return { el: el, focus: function () { return el.querySelector(".autofocus") || el.querySelector(".focusable"); } };
  }

  /** Web parity: the channel's upcoming published programmes, with the one on air marked LIVE. */
  function programSchedule(c) {
    var slots = Catalog.scheduleFor(c.id), now = Date.now();
    function hm(d) { return (d.getHours() < 10 ? "0" : "") + d.getHours() + ":" + (d.getMinutes() < 10 ? "0" : "") + d.getMinutes(); }
    var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var rows = slots.map(function (s) {
      var start = new Date(s.starts_at), end = new Date(s.ends_at);
      var live = start.getTime() <= now && end.getTime() > now;
      var day = start.toDateString() === new Date().toDateString() ? "Today" : DAYS[start.getDay()] + " " + start.getDate() + " " + MONTHS[start.getMonth()];
      return UI.sel(h("div.sched-row" + (live ? ".live" : ""), null, [
        h("div.sched-time", null, [h("b", { text: hm(start) }), h("span", { text: day })]),
        h("div.sched-info", null, [
          h("div.sched-title", null, [h("span", { text: s.program_title }), live ? h("em.sched-live", { text: "LIVE" }) : null]),
          h("div.sched-meta", { text: (s.category || "Programme") + " · until " + hm(end) })
        ])
      ]), function () { if (live && !c.isRadio) Player.playChannel(c.slug); });
    });
    return h("section.sched", null, [
      h("h2", { text: "Program Schedule" }),
      h("div.sched-list", null, rows.length ? rows : [h("div.sched-empty", { text: "No upcoming programmes scheduled yet." })])
    ]);
  }

  // ---------------- Account ----------------

  function account(go) {
    var name = Auth.displayName() || "You", email = Auth.email();
    var el = h("div.screen.account", null, h("div.account-card", null, [
      h("div.account-avatar", null, Auth.avatar() ? h("img", { src: Auth.avatar(), alt: "", onerror: function () { this.parentNode.textContent = name.charAt(0).toUpperCase(); } }) : name.charAt(0).toUpperCase()),
      h("div.account-kicker", { text: "YOUR PROFILE" }),
      h("h1", { text: U.greeting() + ", " + name }),
      email ? h("p.muted", { text: email }) : null,
      h("div.account-stats", null, [
        h("div", null, [h("b", { text: String(Personal.myList().length) }), "My List"]),
        h("div", null, [h("b", { text: String(continueWatching().length) }), "In progress"])
      ]),
      h("div.bb-actions.center", null, [
        UI.button("My List", "bookmark", function () { go.root("mylist"); }, "autofocus"),
        UI.button("Sign out", "logout", function () {
          UI.dialog("Sign out of Lettflix?", "You'll need to sign in again to watch on this TV.", [
            { label: "Sign out", icon: "logout", primary: true, run: function () { Auth.signOut(); } }, { label: "Cancel" }
          ]);
        })
      ]),
      h("p.muted.small", { text: "Manage your profile, password and plan at lettflix.com/account" }),
      h("p.muted.small", { text: "Lettflix for TV " + LETT_CONFIG.VERSION })
    ]));
    return { el: el, focus: function () { return el.querySelector(".autofocus"); } };
  }

  // ---------------- Signed out: welcome + sign in ----------------

  function welcome(go) {
    var qrBox = h("div.qr"), status = h("p.qr-status", { text: "Preparing your sign-in code…" }), linkLine = h("p.qr-link");
    var stop = false, timer = null;
    function startKc() {
      if (stop) return;
      qrBox.innerHTML = ""; qrBox.classList.remove("ready"); linkLine.textContent = ""; status.textContent = "Preparing your sign-in code…";
      Api.KingsChat.start().then(function (j) {
        if (stop) return;
        // The short link (lettflix.com/k/CODE) makes a far simpler QR code than the long KingsChat URL.
        var link = j.short_url || j.auth_url;
        var qr = qrcode(0, "M"); qr.addData(link); qr.make();
        qrBox.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
        qrBox.classList.add("ready");
        linkLine.textContent = j.short_url ? "Or visit " + j.short_url.replace(/^https?:\/\/(www\.)?/, "") : "";
        status.textContent = "Waiting for you to sign in on your phone…";
        var started = Date.now();
        (function poll() {
          if (stop) return;
          Api.KingsChat.poll(j.poll_secret).then(function (r) {
            if (stop) return;
            if (r.status === "ready" && r.session) {
              status.textContent = "Signed in — welcome!";
              return Auth.adoptTokens(r.session.access_token, r.session.refresh_token).catch(function (e) { status.textContent = e.message; });
            }
            if (r.status === "failed" || Date.now() - started > 9 * 60 * 1000) return startKc();   // expired: new code
            timer = setTimeout(poll, 2000);
          }, function () { timer = setTimeout(poll, 4000); });
        })();
      }, function () {
        if (stop) return;
        qrBox.classList.add("ready", "off");
        qrBox.innerHTML = "<img src=\"assets/kingschat.svg\" alt=\"\">";
        status.textContent = "KingsChat sign-in isn't available right now. Use email instead.";
        timer = setTimeout(startKc, 30000);
      });
    }
    // Sign in on this screen: go to KingsChat here; the website brings the TV back to /tv/.
    var kcBusy = false;
    function signInHere() {
      if (kcBusy) return;
      kcBusy = true;
      status.textContent = "Opening KingsChat…";
      Api.KingsChat.start(true).then(function (j) {
        Api.KingsChat.setPending(j.poll_secret);
        stop = true; clearTimeout(timer);
        window.location.href = j.auth_url;
      }, function (e) {
        kcBusy = false;
        UI.toast(e.message || "KingsChat sign-in isn't available right now.");
        status.textContent = "Waiting for you to sign in on your phone…";
      });
    }
    // Back from KingsChat: collect the session for the attempt started on this screen.
    function finishHere(secret) {
      UI.toast("Finishing KingsChat sign-in…");
      var tries = 0;
      (function check() {
        Api.KingsChat.poll(secret).then(function (r) {
          if (r.status === "ready" && r.session) {
            Api.KingsChat.clearPending();
            return Auth.adoptTokens(r.session.access_token, r.session.refresh_token).catch(function (e) { UI.toast(e.message); });
          }
          if (r.status === "pending" && ++tries < 5) return setTimeout(check, 1500);
          Api.KingsChat.clearPending();
          if (r.status !== "pending") UI.toast(r.error || "KingsChat sign-in didn't finish. Please try again.");
        }, function () { if (++tries < 5) setTimeout(check, 3000); });
      })();
    }
    var kcBtn = UI.button("Sign in with KingsChat", null, signInHere, "primary autofocus kc");
    kcBtn.insertBefore(h("img.kc-logo", { src: "assets/kingschat.svg", alt: "" }), kcBtn.firstChild);
    var el = h("div.screen.welcome", null, [
      h("div.auth-scenery", null, [h("div.auth-camera"), h("div.auth-shade"), h("div.auth-projector"), h("div.auth-grain")]),
      h("header.welcome-head", null, h("img.welcome-logo", { src: "assets/lettflix_horizontal.png", alt: "Lettflix" })),
      h("div.welcome-body", null, [
        h("div.welcome-copy", null, [
          h("div.kicker", { text: "LIVE TV · RADIO · PODCASTS · ON-DEMAND" }),
          h("h1", { text: "Welcome to Lettflix" }),
          h("p", { text: "Sign in. Tune in. Make it yours." }),
          h("div.bb-actions", null, [
            kcBtn,
            UI.button("Sign in with email", "mail", function () { go.push("signin"); }),
            UI.button("Exit", "exit", function () { go.exit(); })
          ])
        ]),
        h("div.qr-panel", null, [
          h("div.qr-head", null, [h("img", { src: "assets/kingschat.svg", alt: "" }), h("span", { text: "Sign in with KingsChat" })]),
          qrBox,
          linkLine,
          h("ol.qr-steps", null, [h("li", { text: "Scan the code with your phone camera." }), h("li", { text: "Sign in to KingsChat on your phone." }), h("li", { text: "This TV signs in automatically." })]),
          status
        ])
      ])
    ]);
    startKc();
    var pendingKc = Api.KingsChat.pending();
    if (pendingKc) finishHere(pendingKc);
    return {
      el: el, focus: function () { return el.querySelector(".autofocus"); },
      destroy: function () { stop = true; clearTimeout(timer); }
    };
  }

  function signin(go) {
    var err = h("p.form-error");
    var email = UI.field("Email address", { email: true, placeholder: "name@example.com", onDone: function () { Nav.focus(password); } });
    var password = UI.field("Password", { password: true, placeholder: "Password", doneLabel: "Sign in", onDone: function () { submit(); } });
    var busy = false;
    var submitBtn = UI.button("Sign In", null, submit, "primary wide");
    function submit() {
      if (busy) return;
      var e = email.value().trim(), p = password.value();
      err.textContent = "";
      if (!e || e.indexOf("@") < 0) { err.textContent = "Enter a valid email address"; return; }
      if (p.length < 8) { err.textContent = "Enter your password"; return; }
      busy = true; submitBtn.classList.add("busy"); submitBtn.querySelector("span").textContent = "Signing in…";
      Auth.signInPassword(e, p).catch(function (x) {
        busy = false; submitBtn.classList.remove("busy"); submitBtn.querySelector("span").textContent = "Sign In";
        err.textContent = x.message || "Authentication failed";
      });
    }
    email.classList.add("autofocus");
    var el = h("div.screen.welcome.signin", null, [
      h("div.auth-scenery", null, [h("div.auth-camera"), h("div.auth-shade"), h("div.auth-grain")]),
      h("div.signin-form", null, [
        h("img.signin-icon", { src: "assets/lettflix_icon.png", alt: "" }),
        h("h1", { text: "Welcome to Lettflix" }),
        h("p.muted", { text: "Sign in with your Lettflix email and password." }),
        email, password, err, submitBtn,
        h("p.muted.small", { text: "New to Lettflix? Create your account at lettflix.com" })
      ])
    ]);
    return { el: el, focus: function () { return email; } };
  }

  /** Web FeatureGate: a section an admin has switched off. */
  function unavailable(go) {
    var el = h("div.screen", null, h("div.empty", null, [
      h("h2", { text: "Temporarily unavailable" }),
      h("p", { text: "This part of Lettflix is switched off right now. Please check back later." }),
      h("div.bb-actions.center", null, [UI.button("Back to home", "home", function () { go.root("home"); }, "primary autofocus")])
    ]));
    return { el: el, focus: function () { return el.querySelector(".autofocus"); } };
  }

  window.Screens = {
    home: home, movies: function (go) { return hub("movies", go); }, series: function (go) { return hub("series", go); },
    podcasts: function (go) { return hub("podcasts", go); }, channels: channels, radio: radio, mylist: myList,
    search: search, title: title, channel: channel, account: account, welcome: welcome, signin: signin, unavailable: unavailable
  };
})();
