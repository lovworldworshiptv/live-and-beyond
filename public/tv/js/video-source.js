(function () {
  "use strict";
  function resolve(value) {
    if (!value || !value.trim()) return { type: "invalid", url: "" };
    var url; try { url = new URL(value.trim()); } catch (e) { return { type: "invalid", url: "" }; }
    if (!/^https?:$/.test(url.protocol)) return { type: "invalid", url: "" };
    var host = url.hostname.toLowerCase().replace(/^www\./, ""), parts = url.pathname.split("/").filter(Boolean);
    if (["youtube.com", "m.youtube.com", "youtube-nocookie.com", "youtu.be"].indexOf(host) >= 0) {
      var id = host === "youtu.be" ? parts[0] : url.searchParams.get("v") || (["embed", "shorts", "live", "v"].indexOf(parts[0]) >= 0 ? parts[1] : "");
      if (!id || !/^[\w-]{11}$/.test(id)) return { type: "invalid", url: "" };
      var time = url.searchParams.get("start") || url.searchParams.get("t") || "0", match = time.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
      var start = /^\d+$/.test(time) ? Number(time) : match ? Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0) : 0;
      return { type: "youtube", id: id, start: start, url: "https://www.youtube.com/embed/" + id };
    }
    if (host === "drive.google.com") {
      var drive = url.pathname.match(/^\/file\/d\/([\w-]+)/), file = drive && drive[1] || url.searchParams.get("id");
      if (file && /^[\w-]+$/.test(file)) return { type: "embed", url: "https://drive.google.com/file/d/" + file + "/preview" };
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      var vm = url.pathname.match(/(?:^\/|\/video\/)(\d+)/);
      if (vm) {
        var embed = new URL("https://player.vimeo.com/video/" + vm[1]), pathHash = url.pathname.match(/^\/\d+\/([a-f\d]+)/), hash = url.searchParams.get("h") || pathHash && pathHash[1];
        if (hash) embed.searchParams.set("h", hash);
        return { type: "embed", url: embed.href };
      }
    }
    if (host === "dropbox.com") { url.searchParams.delete("dl"); url.searchParams.set("raw", "1"); return { type: "media", url: url.href }; }
    return { type: "media", url: value.trim() };
  }
  window.VideoSource = { resolve: resolve, isHls: function (url) { return /\.m3u8(?:[?#]|$)/i.test(url) || /[?&](?:format|type)=(?:hls|m3u8)(?:&|$)/i.test(url); } };
})();