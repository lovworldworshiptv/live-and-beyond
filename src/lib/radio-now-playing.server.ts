import type { NowPlaying } from "./radio.functions";

export async function resolveRadioNowPlaying(channelId: string): Promise<NowPlaying> {
    const { createClient } = await import("@supabase/supabase-js");
    const { parseNowPlaying, automaticMetadataUrl } = await import("@/lib/radio.server");

    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    const url = process.env["SUPABASE_URL"];
    if (!key || !url) throw new Error("Radio metadata unavailable");
    const supabase = createClient(
      url,
      key,
      {
        auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        global: { fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        } },
      },
    );

    const { data: row } = await supabase
      .from("radio_settings")
      .select("metadata_provider, metadata_url, stream_url, now_playing_title, now_playing_artist, now_playing_artwork_url, cms_channels!inner(is_published, deleted_at)")
      .eq("channel_id", channelId)
      .eq("is_enabled", true)
      .eq("cms_channels.is_published", true)
      .is("cms_channels.deleted_at", null)
      .maybeSingle();

    const empty: NowPlaying = { title: null, artist: null, artwork: null, listeners: null };
    if (!row) return empty;

    const manual: NowPlaying = {
      title: row.now_playing_title ?? null,
      artist: row.now_playing_artist ?? null,
      artwork: row.now_playing_artwork_url ?? null,
      listeners: null,
    };

    if (row.metadata_provider === "manual") return manual;
    const metadataUrl = row.metadata_url || automaticMetadataUrl(row.stream_url);
    if (!metadataUrl) return manual;

    try {
      const res = await fetch(metadataUrl, { headers: { accept: "application/json, text/plain" }, signal: AbortSignal.timeout(5000), redirect: "error" });
      if (!res.ok) return manual;
      const text = await res.text();
      const parsed = parseNowPlaying(row.metadata_provider === "shoutcast" ? "shoutcast" : "icecast", text, row.stream_url ?? undefined);
      return {
        title: parsed.title ?? manual.title,
        artist: parsed.artist ?? manual.artist,
        artwork: manual.artwork,
        listeners: parsed.listeners,
      };
    } catch {
      return manual;
    }
}
