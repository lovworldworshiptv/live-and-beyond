/*
 * Full-screen player. Titles resume where you left off; channels join live (automated playout joins
 * mid-programme and moves to the next programme when one ends); radio and podcasts show artwork.
 * Remote: OK play/pause · ◀ ▶ seek 10 s · ▲ ▼ show controls · Back closes · media keys work.
 */
(function () {
  "use strict";
  var h = U.h, icon = U.icon, KEY = Nav.KEY, Personal = Api.Personal, Playback = Api.Playback;

  var root = null, video = null, hls = null, src = null, hideTimer = null, tick = null, wmTimer = null;
  var ui = {};
  var seconds = 0, started = false, onClose = null, seekPreview = null, seekTimer = null;

  function isHls(url) { return /\.m3u8(\?|$)/i.test(url); }

  function attach(url, start) {
    detachHls();
    var native = video.canPlayType("application/vnd.apple.mpegurl");
    if (isHls(url) && window.Hls && Hls.isSupported() && !(native === "probably")) {
      hls = new Hls({ startPosition: start > 0 ? start : -1, capLevelToPlayerSize: true, maxBufferLength: 30 });
      hls.on(Hls.Events.ERROR, function (e, d) {
        if (!d.fatal) return;
        if (d.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
        else if (d.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
        else fail("This stream can't play right now.");
      });
      hls.loadSource(url);
      hls.attachMedia(video);
    } else {
      video.src = url;
      if (start > 0) {
        var seek = function () { video.removeEventListener("loadedmetadata", seek); try { video.currentTime = start; } catch (e) { /* live */ } };
        video.addEventListener("loadedmetadata", seek);
      }
    }
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked: OK starts it */ showControls(); });
  }
  function detachHls() { if (hls) { try { hls.destroy(); } catch (e) { /* ignore */ } hls = null; } }

  function build() {
    video = h("video.player-video", { playsinline: true, preload: "auto" });
    ui.art = h("div.player-art");
    ui.title = h("div.player-title");
    ui.sub = h("div.player-sub");
    ui.live = h("span.live-badge.player-live", null, [h("i.live-dot"), "LIVE"]);
    ui.fill = h("div.pbar-fill"); ui.buf = h("div.pbar-buf"); ui.knob = h("div.pbar-knob");
    ui.bar = h("div.pbar", null, [ui.buf, ui.fill, ui.knob]);
    ui.time = h("div.ptime"); ui.dur = h("div.ptime.right");
    ui.play = UI.button("Pause", "pause", togglePlay, "round autofocus");
    ui.rw = UI.button("10", "rewind", function () { seekBy(-10); }, "round");
    ui.ff = UI.button("10", "forward", function () { seekBy(10); }, "round");
    ui.restart = UI.button("Start over", "replay", function () { seekTo(0); }, "ghost");
    ui.spinner = h("div.spinner");
    ui.error = h("div.player-error");
    ui.flash = h("div.seek-flash");
    ui.wm = h("div.watermark");
    ui.controls = h("div.player-controls", null, [
      h("div.player-top", null, [h("div", null, [ui.title, ui.sub]), ui.live]),
      h("div.player-bottom", null, [
        h("div.pbar-row", null, [ui.time, ui.bar, ui.dur]),
        h("div.player-buttons", null, [ui.rw, ui.play, ui.ff, h("div.spacer"), ui.restart])
      ])
    ]);
    root = h("div.player", null, [video, ui.art, ui.wm, ui.spinner, ui.flash, ui.error, ui.controls]);
    ["playing", "pause", "waiting", "canplay", "ended", "error", "loadedmetadata"].forEach(function (ev) { video.addEventListener(ev, onMedia); });
  }

  function onMedia(e) {
    if (e.type === "waiting") root.classList.add("buffering");
    if (e.type === "playing" || e.type === "canplay") root.classList.remove("buffering");
    if (e.type === "playing" || e.type === "pause") paintPlay();
    if (e.type === "error" && !hls) fail("This stream can't play right now.");
    if (e.type === "ended") {
      if (src && src.playout) return reloadChannel();           // next programme
      if (src && src.kind === "title") { save(); close(); }
    }
    if (e.type === "pause") showControls(true);
  }

  function paintPlay() {
    var paused = video.paused;
    ui.play.innerHTML = ""; U.append(ui.play, [icon(paused ? "play" : "pause"), h("span", { text: paused ? "Play" : "Pause" })]);
    root.classList.toggle("paused", paused);
  }

  function paintTime() {
    if (!src) return;
    var d = video.duration, t = seekPreview !== null ? seekPreview : video.currentTime;
    var live = src.isLive || !isFinite(d);
    root.classList.toggle("is-live", live);
    if (live) { ui.time.textContent = ""; ui.dur.textContent = ""; return; }
    ui.time.textContent = U.clock(t); ui.dur.textContent = U.clock(d);
    var pct = d ? t / d * 100 : 0;
    ui.fill.style.width = pct + "%"; ui.knob.style.left = pct + "%";
    try { if (video.buffered.length) ui.buf.style.width = (video.buffered.end(video.buffered.length - 1) / d * 100) + "%"; } catch (e) { /* none */ }
  }

  function showControls(stay) {
    root.classList.add("controls");
    clearTimeout(hideTimer);
    if (!stay && !video.paused) hideTimer = setTimeout(function () { root.classList.remove("controls"); }, 4000);
  }
  function togglePlay() {
    if (video.paused) { var p = video.play(); if (p && p.catch) p.catch(function () {}); } else video.pause();
    showControls();
  }
  function canSeek() { return src && !src.isLive && isFinite(video.duration); }
  /** Repeated presses add up (e.g. ▶▶▶ = +30 s) and jump once the presses stop. */
  function seekBy(delta) {
    if (!canSeek()) return;
    var base = seekPreview !== null ? seekPreview : video.currentTime;
    seekPreview = Math.max(0, Math.min(video.duration - 1, base + delta));
    ui.flash.textContent = (delta > 0 ? "+" : "−") + Math.abs(Math.round(seekPreview - video.currentTime)) + "s";
    ui.flash.classList.remove("show"); ui.flash.offsetWidth; ui.flash.classList.add("show");
    showControls(); paintTime();
    clearTimeout(seekTimer);
    seekTimer = setTimeout(function () { seekTo(seekPreview); }, 650);
  }
  function seekTo(t) { if (!canSeek()) return; seekPreview = null; try { video.currentTime = t; } catch (e) { /* ignore */ } paintTime(); }

  function fail(msg) {
    root.classList.add("failed"); root.classList.remove("buffering");
    ui.error.innerHTML = "";
    U.append(ui.error, [h("h2", { text: msg }), h("p", { text: "Press Back to return." })]);
  }

  function save() {
    if (src && src.kind === "title" && isFinite(video.duration) && video.duration > 0) Personal.saveProgress(src.id, video.currentTime, video.duration);
  }

  function reloadChannel() {
    root.classList.add("buffering");
    Playback.resolveChannel(src.id).then(function (s) { load(s); }, function (e) { fail(e.message); });
  }

  function watermark() {
    // Moving account watermark (web: player-watermark) deters screen recording.
    var email = Api.Auth.email(), id = (Api.Auth.userId() || "").slice(0, 8);
    var masked = email ? email.replace(/^(.{2})[^@]*(@.*)$/, "$1•••$2") : "Lettflix";
    ui.wm.textContent = masked + (id ? " · " + id : "");
    var spots = [[8, 12], [62, 14], [30, 46], [70, 62], [10, 78], [48, 82]], i = 0;
    var place = function () { var s = spots[i++ % spots.length]; ui.wm.style.left = s[0] + "%"; ui.wm.style.top = s[1] + "%"; };
    place(); clearInterval(wmTimer); wmTimer = setInterval(place, 12000);
  }

  function load(s) {
    src = s; seconds = 0; started = false; seekPreview = null;
    root.className = "player buffering controls";
    root.classList.toggle("audio", !!s.isAudio);
    ui.title.textContent = s.kind === "title" ? U.titleCase(s.title) : s.title; ui.sub.textContent = s.subtitle || "";
    ui.art.style.backgroundImage = s.artwork ? "url(\"" + s.artwork + "\")" : "";
    ui.restart.style.display = s.kind === "title" && s.start > 0 ? "" : "none";
    attach(s.url, s.start || 0);
    paintPlay(); paintTime(); watermark(); showControls();
  }

  function onKey(k) {
    if (root.classList.contains("failed")) { if (k === KEY.BACK) close(); return true; }
    var visible = root.classList.contains("controls");
    switch (k) {
      case KEY.BACK:
        if (visible && !video.paused) { root.classList.remove("controls"); return true; }
        close(); return true;
      case KEY.PLAY: if (video.paused) togglePlay(); return true;
      case KEY.PAUSE: if (!video.paused) togglePlay(); return true;
      case KEY.PLAYPAUSE: togglePlay(); return true;
      case KEY.STOP: close(); return true;
      case KEY.FF: seekBy(30); return true;
      case KEY.RW: seekBy(-30); return true;
      case KEY.OK:
        if (!visible) { togglePlay(); return true; }
        showControls(); return false;                 // OK on a focused button
      case KEY.LEFT: case KEY.RIGHT:
        if (!visible || Nav.current() === ui.play) { seekBy(k === KEY.RIGHT ? 10 : -10); return true; }
        showControls(); return false;
      default:
        showControls(); return !visible;              // first ▲▼ just reveals the controls
    }
  }

  function close() {
    save();
    if (src && started) Playback.record(src, "stop", seconds % 30);
    clearInterval(tick); clearInterval(wmTimer); clearTimeout(hideTimer); clearTimeout(seekTimer);
    detachHls();
    try { video.pause(); video.removeAttribute("src"); video.load(); } catch (e) { /* ignore */ }
    document.body.classList.remove("playing");
    Nav.pop(root);
    if (root.parentNode) root.parentNode.removeChild(root);
    src = null;
    var cb = onClose; onClose = null;
    if (cb) cb();
  }

  function open(resolver, closed) {
    if (!root) build();
    onClose = closed || null;
    document.getElementById("overlay").appendChild(root);
    document.body.classList.add("playing");
    root.className = "player buffering controls";
    ui.error.innerHTML = ""; ui.title.textContent = ""; ui.sub.textContent = "";
    Nav.push(root, { focus: ui.play, onKey: onKey });
    resolver.then(load, function (e) { fail(e.message || "This isn't available to play yet."); });
    clearInterval(tick);
    tick = setInterval(function () {
      if (!src) return;
      paintTime();
      if (!video.paused && !video.seeking && video.readyState > 2) {
        if (!started) { started = true; Playback.record(src, "start"); }
        seconds++;
        if (seconds % 30 === 0) Playback.record(src, "heartbeat", 30);
        if (seconds % 5 === 0) save();
        if (src.playout && src.endsAt && Date.now() > src.endsAt + 2000 && !hls) reloadChannel();
      }
    }, 1000);
  }

  window.Player = {
    playTitle: function (slug, resume, closed) { open(Playback.resolveTitle(slug, resume), closed); },
    playChannel: function (slug, closed) { open(Playback.resolveChannel(slug), closed); },
    playRadio: function (slug, closed) { open(Playback.resolveRadio(slug), closed); },
    isOpen: function () { return !!src; }
  };
})();
