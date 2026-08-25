import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({ channelId: z.string().uuid() });

export type NowPlaying = {
  title: string | null;
  artist: string | null;
  artwork: string | null;
  listeners: number | null;
};

/** Public: resolve the current track for a radio station (Icecast/Shoutcast/manual). */
export const getRadioNowPlaying = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }): Promise<NowPlaying> => {
    const { createClient } = await import("@supabase/supabase-js");
    const { parseNowPlaying } = await import("@/lib/radio.server");

    const supabase = createClient(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_PUBLISHABLE_KEY"]!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );

    const { data: row } = await supabase
      .from("radio_settings")
      .select("metadata_provider, metadata_url, now_playing_title, now_playing_artist, now_playing_artwork_url")
      .eq("channel_id", data.channelId)
      .maybeSingle();

    const empty: NowPlaying = { title: null, artist: null, artwork: null, listeners: null };
    if (!row) return empty;

    const manual: NowPlaying = {
      title: row.now_playing_title ?? null,
      artist: row.now_playing_artist ?? null,
      artwork: row.now_playing_artwork_url ?? null,
      listeners: null,
    };

    if (row.metadata_provider === "manual" || row.metadata_provider === "none") return manual;
    if (!row.metadata_url) return manual;

    try {
      const res = await fetch(row.metadata_url, { headers: { accept: "application/json, text/plain" } });
      if (!res.ok) return manual;
      const text = await res.text();
      const parsed = parseNowPlaying(row.metadata_provider as "icecast" | "shoutcast", text);
      return {
        title: parsed.title ?? manual.title,
        artist: parsed.artist ?? manual.artist,
        artwork: manual.artwork,
        listeners: parsed.listeners,
      };
    } catch {
      return manual;
    }
  });
