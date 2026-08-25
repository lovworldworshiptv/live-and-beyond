import { supabase } from "@/integrations/supabase/client";

export type RadioFormat = "hls" | "mp3" | "aac" | "ogg";
export type MetadataProvider = "none" | "icecast" | "shoutcast" | "manual";

export type RadioSettings = {
  id: string;
  channel_id: string;
  is_enabled: boolean;
  stream_url: string | null;
  format: RadioFormat;
  bitrate_kbps: number;
  metadata_provider: MetadataProvider;
  metadata_url: string | null;
  now_playing_title: string | null;
  now_playing_artist: string | null;
  now_playing_artwork_url: string | null;
  now_playing_updated_at: string | null;
  station_message: string | null;
};

export type RadioStation = {
  channelId: string;
  slug: string;
  name: string;
  tagline: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  category: string | null;
  country: string | null;
  language: string | null;
  streamUrl: string | null;
  format: RadioFormat;
  bitrate: number;
  nowPlayingTitle: string | null;
  nowPlayingArtist: string | null;
  nowPlayingArtwork: string | null;
  stationMessage: string | null;
};

export const RADIO_FORMATS: { value: RadioFormat; label: string }[] = [
  { value: "hls", label: "HLS (.m3u8)" },
  { value: "mp3", label: "MP3 / Icecast" },
  { value: "aac", label: "AAC" },
  { value: "ogg", label: "Ogg Vorbis" },
];

export const METADATA_PROVIDERS: { value: MetadataProvider; label: string }[] = [
  { value: "none", label: "No metadata" },
  { value: "icecast", label: "Icecast status-json" },
  { value: "shoutcast", label: "Shoutcast stats" },
  { value: "manual", label: "Manual (set below)" },
];

export async function fetchRadioSettings(channelId: string): Promise<RadioSettings | null> {
  const { data } = await supabase
    .from("radio_settings")
    .select("*")
    .eq("channel_id", channelId)
    .maybeSingle();
  return (data as unknown as RadioSettings) ?? null;
}

export async function saveRadioSettings(channelId: string, patch: Partial<RadioSettings>) {
  const { error } = await supabase
    .from("radio_settings")
    .upsert({ channel_id: channelId, ...patch } as never, { onConflict: "channel_id" });
  if (error) throw error;
}

/** All public radio stations (published channels with radio enabled). */
export async function fetchRadioStations(): Promise<RadioStation[]> {
  const { data } = await supabase
    .from("radio_settings")
    .select(
      "channel_id, stream_url, format, bitrate_kbps, now_playing_title, now_playing_artist, now_playing_artwork_url, station_message, is_enabled, cms_channels!inner(id, slug, name, tagline, logo_url, banner_url, category, country, language, is_published, deleted_at, display_order)",
    )
    .eq("is_enabled", true);

  const rows = (data ?? []) as unknown as Array<
    RadioSettings & {
      cms_channels: {
        id: string; slug: string; name: string; tagline: string | null;
        logo_url: string | null; banner_url: string | null; category: string | null;
        country: string | null; language: string | null;
        is_published: boolean; deleted_at: string | null; display_order: number;
      };
    }
  >;

  return rows
    .filter((r) => r.cms_channels && r.cms_channels.is_published && !r.cms_channels.deleted_at)
    .sort((a, b) => (a.cms_channels.display_order ?? 0) - (b.cms_channels.display_order ?? 0))
    .map((r) => ({
      channelId: r.channel_id,
      slug: r.cms_channels.slug,
      name: r.cms_channels.name,
      tagline: r.cms_channels.tagline,
      logoUrl: r.cms_channels.logo_url,
      bannerUrl: r.cms_channels.banner_url,
      category: r.cms_channels.category,
      country: r.cms_channels.country,
      language: r.cms_channels.language,
      streamUrl: r.stream_url,
      format: (r.format ?? "mp3") as RadioFormat,
      bitrate: r.bitrate_kbps ?? 128,
      nowPlayingTitle: r.now_playing_title,
      nowPlayingArtist: r.now_playing_artist,
      nowPlayingArtwork: r.now_playing_artwork_url,
      stationMessage: r.station_message,
    }));
}
