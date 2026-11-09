export type VideoSource = { type: "youtube" | "embed" | "media" | "invalid"; url: string; id?: string; start?: number };

/** Provider page URLs are not media files; keep signed direct URLs untouched. */
export function resolveVideoSource(value?: string | null): VideoSource {
  if (!value?.trim()) return { type: "invalid", url: "" };
  let url: URL;
  try { url = new URL(value.trim()); } catch { return { type: "invalid", url: "" }; }
  if (!/^https?:$/.test(url.protocol)) return { type: "invalid", url: "" };
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (["youtube.com", "m.youtube.com", "youtube-nocookie.com", "youtu.be"].includes(host)) {
    const parts = url.pathname.split("/").filter(Boolean);
    const id = host === "youtu.be" ? parts[0] : url.searchParams.get("v") || (["embed", "shorts", "live", "v"].includes(parts[0]) ? parts[1] : "");
    if (!id || !/^[\w-]{11}$/.test(id)) return { type: "invalid", url: "" };
    const time = url.searchParams.get("start") || url.searchParams.get("t") || "0";
    const match = time.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
    const start = /^\d+$/.test(time) ? Number(time) : match ? Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0) : 0;
    return { type: "youtube", id, start, url: `https://www.youtube.com/embed/${id}` };
  }
  if (host === "drive.google.com") {
    const id = url.pathname.match(/^\/file\/d\/([\w-]+)/)?.[1] || url.searchParams.get("id");
    if (id && /^[\w-]+$/.test(id)) return { type: "embed", url: `https://drive.google.com/file/d/${id}/preview` };
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.match(/(?:^\/|\/video\/)(\d+)/)?.[1];
    if (id) {
      const embed = new URL(`https://player.vimeo.com/video/${id}`);
      const hash = url.searchParams.get("h") || url.pathname.match(/^\/\d+\/([a-f\d]+)/)?.[1];
      if (hash) embed.searchParams.set("h", hash);
      return { type: "embed", url: embed.href };
    }
  }
  if (host === "dropbox.com") { url.searchParams.delete("dl"); url.searchParams.set("raw", "1"); return { type: "media", url: url.href }; }
  return { type: "media", url: value.trim() };
}

export function isHlsSource(src: string) {
  return /\.m3u8(?:[?#]|$)/i.test(src) || /[?&](?:format|type)=(?:hls|m3u8)(?:&|$)/i.test(src);
}