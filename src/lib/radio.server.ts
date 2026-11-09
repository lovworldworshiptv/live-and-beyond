/** Server-only parsers for radio station metadata endpoints. */

export type ParsedNowPlaying = {
  title: string | null;
  artist: string | null;
  listeners: number | null;
};

function splitTrack(raw: string | null | undefined): { title: string | null; artist: string | null } {
  if (!raw) return { title: null, artist: null };
  const value = raw.trim();
  if (!value) return { title: null, artist: null };
  const parts = value.split(" - ");
  if (parts.length >= 2) {
    return { artist: parts[0].trim(), title: parts.slice(1).join(" - ").trim() };
  }
  return { artist: null, title: value };
}

export function parseNowPlaying(
  provider: "icecast" | "shoutcast",
  body: string,
  streamUrl?: string,
): ParsedNowPlaying {
  let json: unknown = null;
  try {
    json = JSON.parse(body);
  } catch {
    json = null;
  }

  if (provider === "icecast" && json && typeof json === "object") {
    const stats = (json as { icestats?: { source?: unknown } }).icestats;
    const sources = Array.isArray(stats?.source) ? stats.source : [stats?.source];
    const mount = (url: string) => { try { return new URL(url).pathname; } catch { return null; } };
    const source = streamUrl ? sources.find((item) => {
      const s = item as Record<string, unknown> | undefined;
      return typeof s?.listenurl === "string" && mount(s.listenurl) === mount(streamUrl);
    }) : sources[0];
    const s = (source ?? {}) as Record<string, unknown>;
    const raw = (s["title"] ?? s["yp_currently_playing"] ?? null) as string | null;
    const split = splitTrack(raw);
    return {
      title: split.title,
      artist: (s["artist"] as string | undefined) ?? split.artist,
      listeners: typeof s["listeners"] === "number" ? (s["listeners"] as number) : null,
    };
  }

  if (provider === "shoutcast" && json && typeof json === "object") {
    const s = json as Record<string, unknown>;
    const split = splitTrack((s["songtitle"] ?? s["title"] ?? null) as string | null);
    return {
      title: split.title,
      artist: split.artist,
      listeners: typeof s["currentlisteners"] === "number" ? (s["currentlisteners"] as number) : null,
    };
  }

  // Plain-text fallback (e.g. Shoutcast 7.html or a bare title endpoint)
  const plain = body.replace(/<[^>]*>/g, "").split(",").pop() ?? "";
  const split = splitTrack(plain);
  return { title: split.title, artist: split.artist, listeners: null };
}

/** Only probe the stream's own public origin; never guess another station's feed. */
export function automaticMetadataUrl(streamUrl: string | null): string | null {
  if (!streamUrl) return null;
  try {
    const url = new URL(streamUrl);
    if (url.protocol !== "https:" || /\.(m3u8|mpd)(\?|$)/i.test(streamUrl)) return null;
    if (url.username || url.password || !url.hostname.includes(".") || /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(url.hostname)) return null;
    return new URL("/status-json.xsl", url.origin).href;
  } catch { return null; }
}
