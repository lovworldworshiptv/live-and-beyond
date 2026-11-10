/*
 * Full-screen player. Titles resume where you left off; channels join live (automated playout joins
 * mid-programme and moves to the next programme when one ends); radio and podcasts show artwork.
 * Remote: OK play/pause · ◀ ▶ seek 10 s · ▲ ▼ show controls · Back closes · media keys work.
 */
(function () {
  "use strict";
  var h = U.h, icon = U.icon, KEY = Nav.KEY, Personal = Api.Personal, Playback = Api.Playback;

  var root = null, video = null, hls = null, src = null, hideTimer = null, tick = null;
  var ui = {};
  var seconds = 0, started = false, onClose = null, seekPreview = null, seekTimer = null;
  var loadGeneration = 0, radioTimer = null, reactiveContext = null, reactiveFrame = null, reactiveStream = null;
  var provider = null, youtube = null, youtubeState = -1, providerHost = null;
  function paused() { return youtube ? youtubeState !== 1 : video.paused; }
  function position() { return youtube ? youtube.getCurrentTime() : video.currentTime; }
  function duration() { return youtube ? youtube.getDuration() : video.duration; }
  function detachProvider() {
    if (youtube) { try { youtube.destroy(); } catch (e) {} }
    youtube = null; youtubeState = -1; provider = null;
    if (providerHost && providerHost.parentNode) providerHost.parentNode.removeChild(providerHost);
    providerHost = null;
  }
  function attachProvider(source, start) {
    provider = source; var generation = loadGeneration;
    providerHost = h("div.player-provider"); root.insertBefore(providerHost, ui.controls);
    if (source.type === "embed") {
      providerHost.appendChild(h("iframe", { src: source.url, title: "Cloud video player", allow: "autoplay; fullscreen; encrypted-media", allowfullscreen: true }));
      root.classList.remove("buffering"); root.classList.add("opaque-provider");
      return;
    }
    function ready() {
      if (generation !== loadGeneration || !providerHost) return;
      var target = h("div"); providerHost.appendChild(target);
      youtube = new window.YT.Player(target, {
        videoId: source.id, width: "100%", height: "100%",
        playerVars: { autoplay: 1, playsinline: 1, controls: 0, rel: 0, start: start || source.start || 0, origin: window.location.origin },
        events: {
          onReady: function () { if (generation === loadGeneration) youtube.playVideo(); },
          onStateChange: function (event) {
            if (generation !== loadGeneration) return;
            youtubeState = event.data; root.classList.toggle("buffering", event.data === 3);
            paintPlay(); paintTime();
            if (event.data === 1 && !started) { started = true; Playback.record(src, "start"); showControls(); }
            if (event.data === 2) { save(); showControls(true); }
            if (event.data === 0) { save(); close(); }
          },
          onError: function (event) { if (generation === loadGeneration) fail(event.data === 101 || event.data === 150 ? "This video's owner does not allow embedded playback." : "This YouTube video is unavailable."); }
        }
      });
    }
    if (window.YT && window.YT.Player) ready();
    else {
      var previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () { if (previous) previous(); ready(); };
      var script = h("script", { src: "https://www.youtube.com/iframe_api" });
      script.onerror = function () { if (generation === loadGeneration) fail("YouTube could not load. Please retry."); };
      document.head.appendChild(script);
      setTimeout(function () { if (generation === loadGeneration && !youtube) fail("YouTube could not load. Please retry."); }, 20000);
    }
  }

  function isHls(url) { return VideoSource.isHls(url); }

  function attach(url, start) {
    detachHls();
    video.crossOrigin = /^https:\/\/[^/]*radiolize\.com(?::\d+)?\//i.test(url) ? "anonymous" : null;
    var generation = loadGeneration;
    var native = video.canPlayType("application/vnd.apple.mpegurl");
    if (isHls(url) && window.Hls && Hls.isSupported() && !(native === "probably")) {
      hls = new Hls({ startPosition: start > 0 ? start : -1, capLevelToPlayerSize: true, maxBufferLength: 30, manifestLoadingMaxRetry: 6, levelLoadingMaxRetry: 6, fragLoadingMaxRetry: 6 });
      hls.on(Hls.Events.MANIFEST_PARSED, function () { if (generation === loadGeneration) startPlayback(); });
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
    video.onloadedmetadata = function () { if (generation === loadGeneration) startPlayback(); };
    if (video.readyState >= 1) startPlayback();
  }
  function startPlayback() {
    if (youtube) { youtube.playVideo(); return; }
    var generation = loadGeneration, media = video;
    var p = media.play();
    if (p && p.catch) p.catch(function (e) {
      if (generation !== loadGeneration) return;
      if (e.name === "NotAllowedError" && !media.muted) { media.muted = true; var retry = media.play(); if (retry && retry.catch) retry.catch(function () { showControls(true); }); }
      else if (e.name !== "AbortError") fail("This stream can't play right now.");
    });
  }
  function detachHls() { if (hls) { try { hls.destroy(); } catch (e) { /* ignore */ } hls = null; } }

  function build() {
    video = h("video.player-video", { playsinline: true, preload: "auto" });
    ui.art = h("div.player-art");
    ui.title = h("div.player-title");
    ui.sub = h("div.player-sub");
    ui.mic = h("div.radio-reactive-mic", null, icon("mic"));
    ui.show = h("div.radio-show-title");
    ui.song = h("div.radio-song-ticker");
    ui.radioView = h("div.radio-podcast-view", null, [ui.mic, ui.show, h("div.radio-now-label", null, [h("i.radio-now-dot"), "Now playing"]), h("div.radio-song-window", null, ui.song)]);
    ui.live = h("span.live-badge.player-live", null, [h("i.live-dot"), "LIVE"]);
    ui.fill = h("div.pbar-fill"); ui.buf = h("div.pbar-buf"); ui.knob = h("div.pbar-knob");
    ui.bar = h("div.pbar", null, [ui.buf, ui.fill, ui.knob]);
    ui.time = h("div.ptime"); ui.dur = h("div.ptime.right");
    ui.play = UI.button("Pause", "pause", togglePlay, "round autofocus");
    ui.rw = UI.button("10", "rewind", function () { seekBy(-10); }, "round");
    ui.ff = UI.button("10", "forward", function () { seekBy(10); }, "round");
    ui.restart = UI.button("Start over", "replay", function () { seekTo(0); }, "ghost");
    ui.volumeDown = UI.button("Decrease radio volume", "", function () { changeVolume(-.1); }, "round.volume-step");
    ui.volumeUp = UI.button("Increase radio volume", "", function () { changeVolume(.1); }, "round.volume-step");
    ui.volumeDown.querySelector("span").textContent = "−"; ui.volumeUp.querySelector("span").textContent = "+";
    ui.volumeValue = h("span.radio-volume-value", { text: "100%" });
    ui.volume = h("div.radio-volume-controls", null, [ui.volumeDown, ui.volumeValue, ui.volumeUp]);
    ui.spinner = h("div.spinner");
    ui.error = h("div.player-error");
    ui.flash = h("div.seek-flash");
    ui.controls = h("div.player-controls", null, [
      h("div.player-top", null, [h("div", null, [ui.title, ui.sub]), ui.live]),
      h("div.player-bottom", null, [
        h("div.pbar-row", null, [ui.time, ui.bar, ui.dur]),
        h("div.player-buttons", null, [ui.rw, ui.play, ui.ff, ui.volume, h("div.spacer"), ui.restart])
      ])
    ]);
    root = h("div.player", null, [video, ui.art, ui.radioView, ui.spinner, ui.flash, ui.error, ui.controls]);
    ["playing", "pause", "waiting", "canplay", "ended", "error", "loadedmetadata"].forEach(function (ev) { video.addEventListener(ev, onMedia); });
    video.addEventListener("volumechange", paintVolume);
  }

  function paintVolume() { ui.volumeValue.textContent = Math.round(video.muted ? 0 : video.volume * 100) + "%"; }
  function changeVolume(delta) {
    video.volume = Math.max(0, Math.min(1, (video.muted ? 0 : video.volume) + delta));
    video.muted = video.volume === 0;
    paintVolume(); showControls(true);
  }

  function onMedia(e) {
    if (e.type === "waiting") {
      root.classList.add("buffering");
      // A live stream stuck buffering for 20 s rejoins the live edge (some TV decoders never recover).
      clearTimeout(stallTimer);
      if (src && src.isLive) stallTimer = setTimeout(function () { if (root.classList.contains("buffering")) autoRecover(); }, 20000);
    }
    if (e.type === "playing" || e.type === "canplay") root.classList.remove("buffering");
    if (e.type === "playing" || e.type === "pause") { paintPlay(); root.classList.toggle("paused", video.paused); }
    if (e.type === "playing" && src && src.kind === "radio") startReactive();
    if (e.type === "playing" && src && !started) { started = true; Playback.record(src, "start"); }
    if (e.type === "playing") { autoRetries = 0; clearTimeout(stallTimer); }
    if (e.type === "error" && !hls) fail("This stream can't play right now.");
    if (e.type === "ended") {
      if (src && src.playout) return reloadChannel();           // next programme
      if (src && src.kind === "title") { save(); close(); }
    }
    if (e.type === "pause") showControls(true);
  }

  function stopReactive() {
    cancelAnimationFrame(reactiveFrame); reactiveFrame = null;
    if (reactiveContext) reactiveContext.close().catch(function () {});
    if (reactiveStream) reactiveStream.getTracks().forEach(function (track) { track.stop(); });
    reactiveContext = null; reactiveStream = null;
    if (ui.mic) ui.mic.style.transform = "scale(1)";
  }
  function startReactive() {
    if (reactiveContext || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      var capture = video.captureStream || video.mozCaptureStream;
      var Context = window.AudioContext || window.webkitAudioContext;
      if (!capture || !Context) return;
      reactiveStream = capture.call(video);
      if (!reactiveStream.getAudioTracks().length) return;
      reactiveContext = new Context();
      var analyser = reactiveContext.createAnalyser(); analyser.fftSize = 256;
      reactiveContext.createMediaStreamSource(reactiveStream).connect(analyser);
      reactiveContext.resume().catch(function () {});
      var samples = new Uint8Array(analyser.fftSize);
      (function draw() {
        if (!reactiveContext) return;
        analyser.getByteTimeDomainData(samples);
        var sum = 0; for (var i = 0; i < samples.length; i++) sum += Math.pow((samples[i] - 128) / 128, 2);
        var level = video.paused || video.muted ? 0 : Math.min(1, Math.sqrt(sum / samples.length) * 3);
        ui.mic.style.transform = "scale(" + (1 + level * .2) + ")";
        reactiveFrame = requestAnimationFrame(draw);
      })();
    } catch (e) { stopReactive(); }
  }
  function setSong(title) {
    if (ui.song.getAttribute("data-song") === title) return;
    ui.song.setAttribute("data-song", title); ui.song.innerHTML = "";
    U.append(ui.song, [h("div.radio-song-line", { text: title }), h("div.radio-song-line", { text: title, "aria-hidden": "true" })]);
  }

  function paintPlay() {
    var isPaused = paused();
    ui.play.innerHTML = ""; U.append(ui.play, [icon(isPaused ? "play" : "pause"), h("span", { text: isPaused ? "Play" : "Pause" })]);
    root.classList.toggle("paused", isPaused);
  }

  function paintTime() {
    if (!src) return;
    var d = duration(), t = seekPreview !== null ? seekPreview : position();
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
    if (!stay && !paused()) hideTimer = setTimeout(function () { root.classList.remove("controls"); }, 4000);
  }
  function togglePlay() {
    if (paused()) { if (root.classList.contains("failed") && src) load(src); else startPlayback(); } else if (youtube) youtube.pauseVideo(); else video.pause();
    showControls();
  }
  function canSeek() { return src && !src.isLive && isFinite(duration()) && duration() > 0; }
  /** Repeated presses add up (e.g. ▶▶▶ = +30 s) and jump once the presses stop. */
  function seekBy(delta) {
    if (!canSeek()) return;
    var base = seekPreview !== null ? seekPreview : position();
    seekPreview = Math.max(0, Math.min(duration() - 1, base + delta));
    ui.flash.textContent = (delta > 0 ? "+" : "−") + Math.abs(Math.round(seekPreview - position())) + "s";
    ui.flash.classList.remove("show"); ui.flash.offsetWidth; ui.flash.classList.add("show");
    showControls(); paintTime();
    clearTimeout(seekTimer);
    seekTimer = setTimeout(function () { seekTo(seekPreview); }, 650);
  }
  function seekTo(t) { if (!canSeek()) return; seekPreview = null; try { if (youtube) youtube.seekTo(t, true); else video.currentTime = t; } catch (e) { /* ignore */ } paintTime(); }

  // Seamless playback: transient failures retry quietly with backoff before any error shows.
  var autoRetries = 0, autoTimer = null, stallTimer = null;
  function autoRecover() {
    if (!src || provider || autoRetries >= 5 || navigator.onLine === false) return false;
    var wait = Math.min(15000, 1000 * Math.pow(2, autoRetries++));
    var current = src, at = src.kind === "title" ? position() : 0;
    root.classList.add("buffering"); root.classList.remove("failed");
    clearTimeout(autoTimer);
    autoTimer = setTimeout(function () {
      if (src !== current) return;
      if (current.playout) { reloadChannel(); return; }
      var again = Object.assign({}, current);
      if (current.kind === "title" && at > 0) again.start = at; // resume where it stopped
      var keep = autoRetries; load(again); autoRetries = keep;   // live joins the live edge again
    }, wait);
    return true;
  }
  window.addEventListener("online", function () {
    if (src && root && root.classList.contains("failed")) { autoRetries = 0; load(src); }
  });

  function fail(msg) {
    if (autoRecover()) return;
    root.classList.add("failed"); root.classList.remove("buffering");
    ui.error.innerHTML = "";
    U.append(ui.error, [h("h2", { text: msg }), UI.button("Retry", "replay", function () { if (src) load(src); }, "primary"), h("p", { text: "Press Back to return." })]);
  }

  function save() {
    if (src && src.kind === "title" && (!provider || youtube) && isFinite(duration()) && duration() > 0) Personal.saveProgress(src.id, position(), duration());
  }

  function reloadChannel() {
    root.classList.add("buffering");
    Playback.resolveChannel(src.id).then(function (s) { load(s); }, function (e) { fail(e.message); });
  }

  function load(s) {
    loadGeneration++; clearTimeout(radioTimer); stopReactive(); video.pause(); detachHls(); detachProvider();
    src = s; seconds = 0; started = false; seekPreview = null;
    root.className = "player buffering controls";
    root.classList.toggle("audio", !!s.isAudio);
    root.classList.toggle("radio-podcast", s.kind === "radio");
    var station = s.kind === "radio" ? Api.Catalog.radioStation(s.id) : null;
    ui.show.textContent = U.titleCase(station && station.message || s.title);
    setSong(U.titleCase(station && [station.nowTitle, station.nowArtist].filter(Boolean).join(" — ") || station && station.message || s.title));
    ui.volume.style.display = s.kind === "radio" ? "flex" : "none";
    paintVolume();
    ui.title.textContent = s.kind === "title" ? U.titleCase(s.title) : s.title; ui.sub.textContent = U.titleCase(s.subtitle || "");
    ui.art.style.backgroundImage = s.artwork ? "url(\"" + s.artwork + "\")" : "";
    ui.restart.style.display = s.kind === "title" && s.start > 0 ? "" : "none";
    if (s.kind === "radio") {
      var generation = loadGeneration;
      (function pollSong() {
        fetch(LETT_CONFIG.API_ORIGIN + "/api/public/radio-now-playing?channelId=" + encodeURIComponent(s.channelId)).then(function (r) { if (!r.ok) throw new Error("metadata unavailable"); return r.json(); }).then(function (song) {
          if (generation !== loadGeneration) return;
          var title = [song.title, song.artist].filter(Boolean).map(U.titleCase).join(" — ");
          if (title) { ui.sub.textContent = title; setSong(title); }
        }).catch(function () {}).then(function () { if (generation === loadGeneration) radioTimer = setTimeout(pollSong, 15000); });
      })();
    }
    var source = s.kind === "title" ? VideoSource.resolve(s.url) : { type: "media", url: s.url };
    if (source.type === "invalid") { fail("This title needs a valid video link."); return; }
    if (source.type === "youtube" || source.type === "embed") attachProvider(source, s.start || 0);
    else attach(source.url, s.start || 0);
    paintPlay(); paintTime(); showControls();
  }

  function onKey(k) {
    if (provider && provider.type === "embed") { if (k === KEY.BACK || k === KEY.STOP) { close(); return true; } return false; }
    if (root.classList.contains("failed")) { if (k === KEY.BACK) close(); else if (k === KEY.OK && src) load(src); return true; }
    var visible = root.classList.contains("controls");
    switch (k) {
      case KEY.BACK:
        if (visible && !paused()) { root.classList.remove("controls"); return true; }
        close(); return true;
      case KEY.PLAY: if (paused()) togglePlay(); return true;
      case KEY.PAUSE: if (!paused()) togglePlay(); return true;
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
    loadGeneration++; clearTimeout(radioTimer); clearTimeout(autoTimer); clearTimeout(stallTimer); autoRetries = 0; stopReactive();
    save();
    detachProvider();
    if (src && started) Playback.record(src, "stop", seconds % 30);
    clearInterval(tick); clearTimeout(hideTimer); clearTimeout(seekTimer);
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
    if (root && root.parentNode) close();
    if (!root) build();
    onClose = closed || null;
    document.getElementById("overlay").appendChild(root);
    document.body.classList.add("playing");
    root.className = "player buffering controls";
    ui.error.innerHTML = ""; ui.title.textContent = ""; ui.sub.textContent = "";
    Nav.push(root, { focus: ui.play, onKey: onKey });
    var generation = ++loadGeneration;
    resolver.then(function (s) { if (generation === loadGeneration) load(s); }, function (e) { if (generation === loadGeneration) fail(e.message || "This isn't available to play yet."); });
    clearInterval(tick);
    tick = setInterval(function () {
      if (!src) return;
      paintTime();
      if (!paused() && (youtube || (!provider && !video.seeking && video.readyState > 2))) {
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
