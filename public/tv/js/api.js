/*
 * Data layer: the same Supabase tables and rules as the website and the Android app
 * (CatalogRepository.kt / PlaybackRepository.kt / AuthRepository.kt / KingsChatLogin.kt).
 */
(function () {
  "use strict";
  var C = window.LETT_CONFIG, store = U.store;

  // ---------------- HTTP ----------------

  function timeoutFetch(url, opts, ms) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var t = setTimeout(function () { if (!done) { done = true; reject(new Error("timeout")); } }, ms || 15000);
      fetch(url, opts).then(function (r) { if (!done) { done = true; clearTimeout(t); resolve(r); } },
        function (e) { if (!done) { done = true; clearTimeout(t); reject(e); } });
    });
  }

  function rest(path, query, opts) {
    opts = opts || {};
    var token = Auth.token() || C.SUPABASE_KEY;
    var headers = { apikey: C.SUPABASE_KEY, Authorization: "Bearer " + token, Accept: "application/json" };
    if (opts.body) { headers["Content-Type"] = "application/json"; headers.Prefer = "return=minimal"; }
    return timeoutFetch(C.SUPABASE_URL + "/rest/v1/" + path + (query ? "?" + query : ""), {
      method: opts.method || "GET", headers: headers, body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (r) {
      if (r.status === 401 && Auth.token() && !opts.retried) {
        // Expired session: refresh once, then retry.
        return Auth.refresh().then(function () { opts.retried = true; return rest(path, query, opts); });
      }
      if (!r.ok) throw new Error("HTTP " + r.status);
      return (opts.body && !opts.jsonResult) || opts.empty ? null : r.json();
    });
  }

  // ---------------- Auth ----------------

  var SESSION_KEY = "lf.session";
  var session = store.get(SESSION_KEY, null);
  var listeners = [];

  function authFetch(path, body, bearer) {
    var headers = { apikey: C.SUPABASE_KEY, "Content-Type": "application/json" };
    if (bearer) headers.Authorization = "Bearer " + bearer;
    return timeoutFetch(C.SUPABASE_URL + "/auth/v1/" + path, {
      method: body ? "POST" : "GET", headers: headers, body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) {
          var msg = j.error_description || j.msg || j.message || j.error || ("HTTP " + r.status);
          throw new Error(msg);
        }
        return j;
      });
    });
  }

  function adopt(j) {
    session = {
      access_token: j.access_token, refresh_token: j.refresh_token,
      expires_at: j.expires_at ? j.expires_at * 1000 : Date.now() + (j.expires_in || 3600) * 1000,
      user: j.user || (session && session.user) || null, name: session ? session.name : null
    };
    store.set(SESSION_KEY, session);
    return session;
  }

  var refreshing = null;
  var Auth = {
    signedIn: function () { return !!(session && session.access_token); },
    token: function () { return session ? session.access_token : null; },
    user: function () { return session ? session.user : null; },
    userId: function () { return session && session.user ? session.user.id : null; },
    email: function () { return session && session.user ? session.user.email : null; },
    avatar: function () { var value = session && session.avatar; return value === "preset:male" ? "assets/avatar-male.jpg" : value === "preset:female" ? "assets/avatar-female.jpg" : value || null; },
    displayName: function () {
      if (!session) return null;
      var u = session.user || {}, meta = u.user_metadata || {};
      return session.name || meta.display_name || meta.full_name || meta.name || (u.email ? u.email.split("@")[0] : "You");
    },
    onChange: function (fn) { listeners.push(fn); },
    emit: function () { listeners.forEach(function (fn) { try { fn(Auth.signedIn()); } catch (e) { console.error(e); } }); },

    signInPassword: function (email, password) {
      return authFetch("token?grant_type=password", { email: email, password: password }).then(function (j) {
        adopt(j); return Auth.loadProfile();
      }).then(function () { Auth.emit(); }, function (e) {
        var m = String(e.message || "");
        if (/invalid login/i.test(m)) throw new Error("Invalid login credentials");
        if (/not confirmed/i.test(m)) throw new Error("Please verify your email address first.");
        if (/timeout|failed to fetch|network/i.test(m)) throw new Error("You appear to be offline. Check your connection and try again.");
        throw e;
      });
    },
    /** A session handed over by the KingsChat flow (access + refresh tokens). */
    adoptTokens: function (access, refresh) {
      session = { access_token: access, refresh_token: refresh, expires_at: Date.now() + 3000 * 1000, user: null };
      return authFetch("user", null, access).then(function (u) {
        session.user = u; store.set(SESSION_KEY, session); return Auth.loadProfile();
      }).then(function () { Auth.emit(); });
    },
    refresh: function () {
      if (!session || !session.refresh_token) return Promise.reject(new Error("signed out"));
      if (refreshing) return refreshing;
      refreshing = authFetch("token?grant_type=refresh_token", { refresh_token: session.refresh_token })
        .then(function (j) { adopt(j); refreshing = null; }, function (e) {
          refreshing = null;
          // A rejected refresh token means the session is gone (signed out elsewhere).
          if (/invalid|not found|revoked/i.test(String(e.message))) { Auth.clear(); Auth.emit(); }
          throw e;
        });
      return refreshing;
    },
    /** Refreshes ahead of expiry; called at start-up and every few minutes. */
    keepFresh: function () {
      if (session && session.expires_at - Date.now() < 10 * 60 * 1000) return Auth.refresh().catch(function () {});
      return Promise.resolve();
    },
    loadProfile: function () {
      var id = Auth.userId();
      if (!id) return Promise.resolve();
      return rest("profiles", "id=eq." + encodeURIComponent(id) + "&select=display_name,avatar_url").then(function (rows) {
        if (rows && rows[0]) { session.name = rows[0].display_name || null; session.avatar = rows[0].avatar_url || null; store.set(SESSION_KEY, session); }
      }).catch(function () {});
    },
    signOut: function () {
      var t = Auth.token();
      Auth.clear();
      if (t) authFetch("logout", {}, t).catch(function () {});
      Auth.emit();
    },
    clear: function () { session = null; store.del(SESSION_KEY); }
  };

  // ---------------- KingsChat (sign in on your phone) ----------------

  /** Starts a login attempt; the TV shows auth_url as a QR code and polls for the session. */
  var KC_PENDING = "lf.kcPending";
  var KingsChat = {
    /**
     * [direct] = sign in on this screen: the TV goes to KingsChat and the website sends it back to
     * /tv/ afterwards (return_path "/tv/"). Otherwise it's the phone QR flow (device "tv").
     */
    start: function (direct) {
      var body = direct ? { return_path: "/tv/" } : { return_path: "/", device: "tv" };
      return timeoutFetch(C.API_ORIGIN + "/api/public/kingschat/login", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
      }).then(function (r) { return r.json(); }).then(function (j) {
        if (!j.auth_url || !j.poll_secret) throw new Error(j.error || "KingsChat sign-in is unavailable right now.");
        return j;
      });
    },
    poll: function (secret) {
      return timeoutFetch(C.API_ORIGIN + "/api/public/kingschat/poll", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ poll_secret: secret })
      }).then(function (r) { return r.json(); });
    },
    /** Remembers an on-screen attempt across the trip to KingsChat (attempts last 10 minutes). */
    setPending: function (secret) { U.store.set(KC_PENDING, { secret: secret, at: Date.now() }); },
    pending: function () {
      var p = U.store.get(KC_PENDING, null);
      if (p && p.secret && Date.now() - p.at < 10 * 60 * 1000) return p.secret;
      if (p) U.store.del(KC_PENDING);
      return null;
    },
    clearPending: function () { U.store.del(KC_PENDING); }
  };

  // ---------------- Catalogue ----------------

  var KIND_LABEL = { movie: "Film", film: "Film", series: "Series", podcast: "Podcast", documentary: "Documentary", concert: "Concert", event: "Event", music: "Music", video: "Video" };
  var CATALOG_KEY = "lf.catalog.v2", STALE_MS = 5 * 60 * 1000;
  var RADIO_COLUMNS = "channel_id,stream_url,format,bitrate_kbps,artwork_url,now_playing_title,now_playing_artist,now_playing_artwork_url,station_message,is_enabled," +
    "cms_channels!inner(id,slug,name,tagline,logo_url,banner_url,category,country,language,is_published,deleted_at,display_order)";

  /** Non-empty URL; site-relative CMS paths (/__l5e/assets-v1/…) resolve against lettflix.com. */
  function nz(s) {
    if (!s || !String(s).trim()) return null;
    s = String(s).trim();
    return s.charAt(0) === "/" && s.charAt(1) !== "/" ? C.WEB_ORIGIN + s : s;
  }

  function mapChannel(r, i) {
    var np = r.now_playing || {};
    return {
      slug: r.slug, id: r.id, name: r.name, tagline: r.tagline || "", description: r.description || "",
      category: r.category || "", language: r.language || "English", country: r.country || "",
      viewers: r.viewers || "—", popularity: r.popularity || 0, trending: !!r.is_trending,
      isRadio: r.kind === "radio", isLive: !!r.is_live, logo: nz(r.logo_url), banner: nz(r.banner_url),
      stream: nz(r.stream_url), tvSource: r.tv_source || null, playout: !!r.playout_enabled,
      fallbackPlaylist: r.fallback_playlist_id || null, nowTitle: np.title || null, nowDescription: np.description || null,
      createdAt: r.created_at || "", position: i, filterMode: r.library_filter_mode === "genres" ? "genres" : "categories",
      videoLibrary: r.video_library || [], podcastLibrary: r.podcast_library || [], featured: r.featured_content || []
    };
  }
  function mapTitle(r, i) {
    var kind = KIND_LABEL[String(r.kind || "movie").toLowerCase()] || "Film";
    return {
      slug: r.slug, id: r.id, rawKind: String(r.kind || "movie").toLowerCase(), title: r.title, synopsis: r.synopsis || "", kind: kind,
      category: U.titleCase(r.genre || ""), year: r.year || null, rating: r.rating || "TV-PG",
      duration: r.duration_label || (r.duration_minutes ? U.minutesLabel(r.duration_minutes) : ""),
      seasons: r.seasons || null, episodes: r.episodes || null, featured: !!r.is_featured, cast: r.cast_list || [],
      poster: nz(r.poster_url), backdrop: nz(r.backdrop_url), stream: nz(r.stream_url), position: i,
      createdAt: r.created_at || "", channelId: r.channel_id || null, isAudio: kind === "Podcast"
    };
  }
  function mapRadio(rows) {
    return (rows || []).filter(function (r) { var c = r.cms_channels; return c && c.is_published && !c.deleted_at; }).map(function (r) {
      var c = r.cms_channels;
      return {
        channelId: r.channel_id, slug: c.slug, name: c.name, tagline: c.tagline || "", logo: nz(c.logo_url), banner: nz(c.banner_url), artwork: nz(r.artwork_url),
        category: c.category || "", stream: nz(r.stream_url), nowTitle: r.now_playing_title || null,
        nowArtist: r.now_playing_artist || null, nowArtwork: nz(r.now_playing_artwork_url), message: r.station_message || null,
        order: c.display_order || 0
      };
    }).sort(function (a, b) { return a.order - b.order; });
  }

  var cache = store.get(CATALOG_KEY, null);
  var Catalog = {
    data: cache ? cache.data : { channels: [], titles: [], radio: [], schedule: [], rankings: [] },
    syncedAt: cache ? cache.at : 0,
    hasData: function () { return Catalog.data.channels.length + Catalog.data.titles.length > 0; },
    refresh: function () {
      var since = new Date(Date.now() - 12 * 3600 * 1000).toISOString();
      var soft = function (p) { return p.catch(function () { return null; }); };
      return Promise.all([
        rest("cms_channels", "select=*&is_published=eq.true&deleted_at=is.null&order=display_order.asc,created_at.desc"),
        rest("cms_titles", "select=*&is_published=eq.true&deleted_at=is.null&order=display_order.asc,created_at.desc"),
        soft(rest("radio_settings", "select=" + encodeURIComponent(RADIO_COLUMNS) + "&is_enabled=eq.true")),
        soft(rest("rpc/featured_on_demand_rankings", "", { method: "POST", jsonResult: true })),
        soft(rest("cms_schedule", "select=id,channel_id,program_title,category,starts_at,ends_at&is_published=eq.true&deleted_at=is.null&ends_at=gte." + encodeURIComponent(since) + "&order=starts_at.asc")),
        soft(rest("cms_settings", "select=value&key=eq.features"))
      ]).then(function (res) {
        Catalog.data = {
          channels: res[0].map(mapChannel), titles: res[1].map(mapTitle),
          radio: res[2] ? mapRadio(res[2]) : [], rankings: res[3] || [], schedule: res[4] || [],
          features: (res[5] && res[5][0] && res[5][0].value) || {}
        };
        Catalog.syncedAt = Date.now();
        store.set(CATALOG_KEY, { at: Catalog.syncedAt, data: Catalog.data });
        return Catalog.data;
      });
    },
    refreshIfStale: function () { return Date.now() - Catalog.syncedAt > STALE_MS ? Catalog.refresh() : Promise.resolve(Catalog.data); },
    title: function (slug) { return Catalog.data.titles.filter(function (t) { return t.slug === slug; })[0] || null; },
    channel: function (slug) { return Catalog.data.channels.filter(function (c) { return c.slug === slug; })[0] || null; },
    radioStation: function (slug) { return Catalog.data.radio.filter(function (r) { return r.slug === slug; })[0] || null; },
    library: function (channel) {
      var links = channel.videoLibrary.concat(channel.podcastLibrary, channel.featured);
      return Catalog.data.titles.filter(function (t) { return t.channelId === channel.id || links.indexOf(t.slug) >= 0; });
    },
    filterOptions: function (titles, mode) {
      var seen = {}, values = [];
      titles.forEach(function (t) { var value = mode === "genres" ? t.category.trim() : t.rawKind; if (value && !seen[value]) { seen[value] = true; values.push(value); } });
      return ["All"].concat(values.sort(function (a, b) { return a.localeCompare(b); }));
    },
    matchesFilter: function (title, mode, value) { return value === "All" || (mode === "genres" ? title.category.trim() : title.rawKind) === value; },
    featured: function () {
      var seen = {};
      return (Catalog.data.rankings || []).map(function (r) { var t = Catalog.title(r.slug); if (!t || r.plays <= 0 || seen[r.slug] || ["movie", "series", "podcast"].indexOf(t.rawKind) < 0) return null; seen[r.slug] = true; return t; }).filter(Boolean).slice(0, 12);
    },
    /** What a channel is airing now: its schedule, else the CMS now_playing title. */
    nowOn: function (ch) {
      var now = Date.now();
      var row = Catalog.data.schedule.filter(function (s) {
        return s.channel_id === ch.id && Date.parse(s.starts_at) <= now && Date.parse(s.ends_at) > now;
      })[0];
      return row ? row.program_title : (ch.nowTitle || null);
    },
    /** A channel's upcoming published programmes (web Program Schedule): not yet ended, first 12. */
    scheduleFor: function (channelId) {
      var now = Date.now();
      return Catalog.data.schedule.filter(function (s) { return s.channel_id === channelId && Date.parse(s.ends_at) > now; }).slice(0, 12);
    },
    /**
     * CMS fingerprint (row count + latest updated_at per table). Cheap enough to poll every minute,
     * so admin/CMS edits reach the TV without waiting for the 5-minute catalogue refresh.
     */
    fingerprint: function () {
      var tables = ["cms_channels", "cms_titles", "cms_schedule", "cms_settings", "radio_settings"];
      return Promise.all(tables.map(function (t) {
        var token = Auth.token() || C.SUPABASE_KEY;
        return timeoutFetch(C.SUPABASE_URL + "/rest/v1/" + t + "?select=updated_at&order=updated_at.desc&limit=1", {
          headers: { apikey: C.SUPABASE_KEY, Authorization: "Bearer " + token, Accept: "application/json", Prefer: "count=exact" }
        }).then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          var range = r.headers.get("content-range") || "";
          return r.json().then(function (rows) { return t + ":" + range.split("/")[1] + ":" + (rows[0] && rows[0].updated_at); });
        });
      })).then(function (parts) { return parts.join("|"); });
    },
    /** Admin feature switches (web Admin › Features); missing keys mean on. */
    featureOn: function (key) { return ((Catalog.data && Catalog.data.features) || {})[key] !== false; },
    channelById: function (id) {
      return id ? Catalog.data.channels.filter(function (c) { return c.id === id; })[0] || null : null;
    }
  };

  // ---------------- On this device: progress, My List ----------------

  function personalKey(name) { return "lf." + name + "." + (Auth.userId() || "guest"); }
  var Personal = {
    progress: function (slug) { return store.get(personalKey("progress"), {})[slug] || null; },
    allProgress: function () { return store.get(personalKey("progress"), {}); },
    saveProgress: function (slug, posSec, durSec) {
      if (!durSec || !isFinite(durSec)) return;
      var all = store.get(personalKey("progress"), {});
      all[slug] = { pos: posSec, dur: durSec, pct: Math.min(100, posSec / durSec * 100), at: Date.now() };
      store.set(personalKey("progress"), all);
    },
    myList: function () { return store.get(personalKey("mylist"), []); },
    inList: function (slug) { return Personal.myList().indexOf(slug) >= 0; },
    toggleList: function (slug) {
      var l = Personal.myList(), i = l.indexOf(slug);
      if (i >= 0) l.splice(i, 1); else l.unshift(slug);
      store.set(personalKey("mylist"), l);
      return i < 0;
    }
  };

  // ---------------- Playback (web channel rules + automated playout) ----------------

  function occurrenceStart(s, now) {
    var base = Date.parse(s.starts_at);
    if (isNaN(base)) return null;
    var dur = (s.duration_minutes || 0) * 60000, at = now.getTime();
    if ((s.recurrence || "none") === "none") return at >= base && at < base + dur ? base : null;
    var b = new Date(base);
    for (var off = 0; off >= -1; off--) {
      var st = new Date(now.getFullYear(), now.getMonth(), now.getDate() + off, b.getHours(), b.getMinutes(), b.getSeconds());
      if (st.getTime() < base) continue;
      var days = s.days_of_week || [];
      if (s.recurrence === "weekly" && days.length && days.indexOf(st.getDay()) < 0) continue;
      if (at >= st.getTime() && at < st.getTime() + dur) return st.getTime();
    }
    return null;
  }

  function nowPlayingIn(playlistId, assets, epochMs) {
    return rest("playlist_items", "select=media_asset_id,position&playlist_id=eq." + playlistId + "&order=position.asc").then(function (items) {
      var playable = items.map(function (it) { return assets[it.media_asset_id]; }).filter(function (a) {
        return a && a.status === "ready" && a.source_url && a.duration_seconds > 0;
      });
      var total = playable.reduce(function (s, a) { return s + a.duration_seconds; }, 0);
      if (total <= 0) return null;
      var now = Date.now(), elapsed = Math.floor((now - epochMs) / 1000) % total;
      if (elapsed < 0) elapsed += total;
      for (var i = 0; i < playable.length; i++) {
        var a = playable[i];
        if (elapsed < a.duration_seconds) return { asset: a, offset: elapsed, endsAt: now + (a.duration_seconds - elapsed) * 1000 };
        elapsed -= a.duration_seconds;
      }
      return null;
    });
  }

  function resolvePlayout(channelId, fallbackPlaylist, service) {
    return Promise.all([
      rest("playout_schedules", "select=*&channel_id=eq." + channelId),
      rest("media_assets", "select=id,title,source_url,poster_url,duration_seconds,status&channel_id=eq." + channelId)
    ]).then(function (res) {
      var assets = {}; res[1].forEach(function (a) { assets[a.id] = a; });
      var now = new Date();
      var chosen = res[0].filter(function (s) { return s.is_active !== false && (s.service || "tv") === service && s.playlist_id; })
        .map(function (s) { return { s: s, start: occurrenceStart(s, now) }; })
        .filter(function (x) { return x.start !== null; })
        .sort(function (a, b) { return (b.s.priority || 0) - (a.s.priority || 0) || b.start - a.start; })[0];
      var first = chosen ? nowPlayingIn(chosen.s.playlist_id, assets, chosen.start) : Promise.resolve(null);
      return first.then(function (np) {
        if (np || !fallbackPlaylist) return np;
        var midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        return nowPlayingIn(fallbackPlaylist, assets, midnight);
      });
    });
  }

  var Playback = {
    sessionId: U.uuid(),
    resolveTitle: function (slug, resume) {
      var t = Catalog.title(slug);
      if (!t) return Promise.reject(new Error("This title is no longer available."));
      if (!t.stream) return Promise.reject(new Error("This isn't available to play yet."));
      var p = resume === false ? null : Personal.progress(slug);
      return Promise.resolve({
        kind: "title", id: slug, url: t.stream, title: t.title, artwork: t.backdrop || t.poster, isAudio: t.isAudio, isLive: false,
        subtitle: [t.kind, t.year, t.duration].filter(Boolean).join(" · "),
        start: p && p.pct >= 1 && p.pct <= 97 ? p.pos : 0, titleId: t.id, channelId: t.channelId
      });
    },
    resolveChannel: function (slug) {
      var c = Catalog.channel(slug);
      if (!c) return Promise.reject(new Error("This channel is no longer available."));
      var base = {
        kind: "channel", id: slug, url: "", title: c.name, subtitle: Catalog.nowOn(c) || c.tagline || "Live broadcast",
        artwork: c.banner || c.logo, isAudio: c.isRadio, isLive: true, channelId: c.id, start: 0
      };
      var source = c.tvSource || (c.playout ? "playout" : "external");
      var attempt = Promise.resolve(null);
      if (source === "playout") {
        attempt = resolvePlayout(c.id, c.fallbackPlaylist, c.isRadio ? "radio" : "tv").then(function (np) {
          return np ? Object.assign({}, base, { url: nz(np.asset.source_url), subtitle: np.asset.title, start: np.offset, endsAt: np.endsAt, isLive: false, playout: true }) : null;
        });
      } else if (source === "ingest") {
        attempt = rest("live_sessions", "select=playback_hls_url&channel_id=eq." + c.id + "&status=eq.live&order=started_at.desc&limit=1")
          .then(function (rows) { var u = rows[0] && nz(rows[0].playback_hls_url); return u ? Object.assign({}, base, { url: u }) : null; });
      }
      return attempt.catch(function () { return null; }).then(function (src) {
        if (src) return src;
        if (!c.stream) throw new Error("This channel isn't broadcasting right now.");
        return Object.assign({}, base, { url: c.stream });
      });
    },
    resolveRadio: function (slug) {
      var r = Catalog.radioStation(slug);
      if (r && r.stream) {
        return Promise.resolve({
          kind: "radio", id: slug, url: r.stream, title: r.name, isAudio: true, isLive: true, channelId: r.channelId, start: 0,
          subtitle: [r.nowTitle, r.nowArtist].filter(Boolean).join(" — ") || r.tagline || "Live radio",
          artwork: r.artwork || r.logo || r.banner
        });
      }
      return Playback.resolveChannel(slug).then(function (s) { return Object.assign(s, { kind: "radio", isAudio: true }); });
    },
    /** Fire-and-forget analytics for creator Studio (playback_events). */
    record: function (src, event, seconds) {
      var service = src.kind === "title" ? (src.isAudio ? "podcast" : "vod") : src.kind === "radio" || src.isAudio ? "radio" : "tv";
      rest("playback_events", "", {
        method: "POST", body: {
          channel_id: src.channelId || null, title_id: src.titleId || null, service: service, event: event,
          seconds: seconds || 0, session_id: Playback.sessionId, user_id: Auth.userId(), platform: "vidaa"
        }
      }).catch(function () {});
    }
  };

  // ---------------- Follows (account-scoped, same table and RPC as the web) ----------------

  var followMap = null;
  var Follows = {
    /** channel id -> notify flag for the signed-in account. */
    load: function () {
      var uid = Auth.userId();
      if (!uid) { followMap = {}; return Promise.resolve(followMap); }
      return rest("channel_follows", "select=channel_id,notify&user_id=eq." + encodeURIComponent(uid)).then(function (rows) {
        followMap = {};
        (rows || []).forEach(function (r) { followMap[r.channel_id] = r.notify !== false; });
        return followMap;
      });
    },
    ready: function () { return followMap ? Promise.resolve(followMap) : Follows.load(); },
    following: function (id) { return !!(followMap && id in followMap); },
    notify: function (id) { return !!(followMap && followMap[id]); },
    count: function (id) {
      return rest("rpc/channel_follower_count", "", { method: "POST", body: { _channel_id: id }, jsonResult: true }).then(function (n) { return Number(n) || 0; });
    },
    toggle: function (id) {
      var uid = Auth.userId();
      if (!uid) return Promise.reject(new Error("signin"));
      var q = "user_id=eq." + encodeURIComponent(uid) + "&channel_id=eq." + encodeURIComponent(id);
      if (Follows.following(id)) {
        return rest("channel_follows", q, { method: "DELETE", empty: true }).then(function () { delete followMap[id]; return false; });
      }
      return rest("channel_follows", "", { method: "POST", body: { user_id: uid, channel_id: id, notify: true } }).then(function () { followMap[id] = true; return true; });
    },
    setNotify: function (id, on) {
      var uid = Auth.userId();
      var q = "user_id=eq." + encodeURIComponent(uid) + "&channel_id=eq." + encodeURIComponent(id);
      return rest("channel_follows", q, { method: "PATCH", body: { notify: on } }).then(function () { followMap[id] = on; return on; });
    },
    reset: function () { followMap = null; }
  };
  Auth.onChange(function () { Follows.reset(); });

  /** Compact follower count, as on the web: 999, 1.2K, 3.4M. */
  function formatFollowers(n) {
    if (n < 1000) return String(n);
    if (n < 1000000) return (n / 1000).toFixed(n < 10000 ? 1 : 0).replace(/\.0$/, "") + "K";
    return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }

  /** Admin announcements (web NotificationPopup): the latest unread one, shown once per app session. */
  var seenAnnouncements = {};
  var Announcements = {
    next: function () {
      if (!Auth.signedIn()) return Promise.resolve(null);
      return rest("notifications", "select=id,title,body,link,image_url&kind=eq.announcement&read_at=is.null&order=created_at.desc&limit=1").then(function (rows) {
        var row = rows && rows[0];
        if (!row || seenAnnouncements[row.id]) return null;
        seenAnnouncements[row.id] = true;
        return row;
      });
    },
    markRead: function (id) {
      return rest("notifications", "id=eq." + encodeURIComponent(id), { method: "PATCH", body: { read_at: new Date().toISOString() } });
    }
  };

  window.Api = { rest: rest, Auth: Auth, KingsChat: KingsChat, Catalog: Catalog, Personal: Personal, Playback: Playback, Follows: Follows, Announcements: Announcements, formatFollowers: formatFollowers };
})();
