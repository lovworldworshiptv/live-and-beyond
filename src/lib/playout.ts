import { supabase } from "@/integrations/supabase/client";

export type MediaAsset = {
  id: string;
  channel_id: string;
  title: string;
  description: string | null;
  media_type: "video" | "audio";
  source_url: string | null;
  poster_url: string | null;
  duration_seconds: number;
  status: "uploading" | "processing" | "ready" | "errored";
  title_id: string | null;
  created_at: string;
};

export type Playlist = {
  id: string;
  channel_id: string;
  name: string;
  description: string | null;
  service: "tv" | "radio";
  loop_enabled: boolean;
  shuffle: boolean;
  created_at: string;
};

export type PlaylistItem = {
  id: string;
  playlist_id: string;
  media_asset_id: string;
  position: number;
};

export type PlayoutSchedule = {
  id: string;
  channel_id: string;
  playlist_id: string | null;
  name: string;
  service: "tv" | "radio";
  starts_at: string;
  duration_minutes: number;
  recurrence: "none" | "daily" | "weekly";
  days_of_week: number[];
  priority: number;
  is_active: boolean;
};

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function fetchMediaAssets(channelId: string) {
  const { data } = await supabase
    .from("media_assets")
    .select("*")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as MediaAsset[];
}

export async function fetchPlaylists(channelId: string) {
  const { data } = await supabase
    .from("playlists")
    .select("*")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: true });
  return (data ?? []) as unknown as Playlist[];
}

export async function fetchPlaylistItems(playlistId: string) {
  const { data } = await supabase
    .from("playlist_items")
    .select("*")
    .eq("playlist_id", playlistId)
    .order("position", { ascending: true });
  return (data ?? []) as unknown as PlaylistItem[];
}

export async function fetchPlayoutSchedules(channelId: string) {
  const { data } = await supabase
    .from("playout_schedules")
    .select("*")
    .eq("channel_id", channelId)
    .order("starts_at", { ascending: true });
  return (data ?? []) as unknown as PlayoutSchedule[];
}

/** Duration of a playlist in seconds. */
export function playlistDuration(items: PlaylistItem[], assets: Map<string, MediaAsset>) {
  return items.reduce((t, i) => t + (assets.get(i.media_asset_id)?.duration_seconds ?? 0), 0);
}

/**
 * Resolve the occurrence of a schedule that contains `at`, honouring daily /
 * weekly recurrence. Returns the occurrence start, or null when not on air.
 */
export function occurrenceFor(schedule: PlayoutSchedule, at: Date): Date | null {
  const base = new Date(schedule.starts_at);
  const durationMs = schedule.duration_minutes * 60_000;

  if (schedule.recurrence === "none") {
    const end = base.getTime() + durationMs;
    return at.getTime() >= base.getTime() && at.getTime() < end ? base : null;
  }

  // Candidate occurrences: today and yesterday (blocks may cross midnight).
  for (const offset of [0, -1]) {
    const day = new Date(at);
    day.setDate(day.getDate() + offset);
    const start = new Date(day);
    start.setHours(base.getHours(), base.getMinutes(), base.getSeconds(), 0);
    if (start.getTime() < base.getTime()) continue;
    if (
      schedule.recurrence === "weekly" &&
      schedule.days_of_week.length > 0 &&
      !schedule.days_of_week.includes(start.getDay())
    ) {
      continue;
    }
    if (at.getTime() >= start.getTime() && at.getTime() < start.getTime() + durationMs) return start;
  }
  return null;
}

export type NowPlaying = {
  schedule: PlayoutSchedule;
  asset: MediaAsset;
  /** Seconds into the asset at the moment of resolution. */
  offsetSeconds: number;
  endsAt: Date;
};

/**
 * Software playout engine: given the channel's schedules, playlists and media,
 * work out exactly which asset should be on screen right now and at what offset.
 */
export async function resolveNowPlaying(
  channelId: string,
  service: "tv" | "radio" = "tv",
  at: Date = new Date(),
): Promise<NowPlaying | null> {
  const [schedules, assets] = await Promise.all([
    fetchPlayoutSchedules(channelId),
    fetchMediaAssets(channelId),
  ]);
  const assetMap = new Map(assets.map((a) => [a.id, a]));

  const candidates = schedules
    .filter((s) => s.is_active && s.service === service && s.playlist_id)
    .map((s) => ({ s, start: occurrenceFor(s, at) }))
    .filter((c): c is { s: PlayoutSchedule; start: Date } => c.start !== null)
    .sort((a, b) => b.s.priority - a.s.priority || b.start.getTime() - a.start.getTime());

  const chosen = candidates[0];
  if (!chosen) return null;

  const items = await fetchPlaylistItems(chosen.s.playlist_id!);
  const playable = items.filter((i) => {
    const a = assetMap.get(i.media_asset_id);
    return a && a.status === "ready" && a.source_url && a.duration_seconds > 0;
  });
  if (!playable.length) return null;

  const total = playlistDuration(playable, assetMap);
  if (total <= 0) return null;
  let elapsed = Math.floor((at.getTime() - chosen.start.getTime()) / 1000) % total;


  for (const item of playable) {
    const asset = assetMap.get(item.media_asset_id)!;
    if (elapsed < asset.duration_seconds) {
      return {
        schedule: chosen.s,
        asset,
        offsetSeconds: elapsed,
        endsAt: new Date(at.getTime() + (asset.duration_seconds - elapsed) * 1000),
      };
    }
    elapsed -= asset.duration_seconds;
  }
  return null;
}

/**
 * Loop a playlist continuously from a fixed epoch (midnight today), so every
 * viewer joining the automated channel lands at the same point in the loop.
 */
export async function resolveFallbackNowPlaying(
  channelId: string,
  playlistId: string,
  at: Date = new Date(),
): Promise<NowPlaying | null> {
  const [items, assets] = await Promise.all([fetchPlaylistItems(playlistId), fetchMediaAssets(channelId)]);
  const assetMap = new Map(assets.map((a) => [a.id, a]));
  const playable = items.filter((i) => {
    const a = assetMap.get(i.media_asset_id);
    return a && a.status === "ready" && a.source_url && a.duration_seconds > 0;
  });
  if (!playable.length) return null;
  const total = playlistDuration(playable, assetMap);
  if (total <= 0) return null;

  const epoch = new Date(at);
  epoch.setHours(0, 0, 0, 0);
  let elapsed = Math.floor((at.getTime() - epoch.getTime()) / 1000) % total;

  for (const item of playable) {
    const asset = assetMap.get(item.media_asset_id)!;
    if (elapsed < asset.duration_seconds) {
      return {
        schedule: {
          id: `fallback:${playlistId}`,
          channel_id: channelId,
          playlist_id: playlistId,
          name: "Fallback programming",
          service: "tv",
          starts_at: epoch.toISOString(),
          duration_minutes: Math.round(total / 60),
          recurrence: "daily",
          days_of_week: [],
          priority: -1,
          is_active: true,
        },
        asset,
        offsetSeconds: elapsed,
        endsAt: new Date(at.getTime() + (asset.duration_seconds - elapsed) * 1000),
      };
    }
    elapsed -= asset.duration_seconds;
  }
  return null;
}

/**
 * What the automated channel should be showing right now: the scheduled block
 * if one is on air, otherwise the channel's looping fallback playlist.
 */
export async function resolveChannelPlayout(
  channelId: string,
  fallbackPlaylistId?: string | null,
  service: "tv" | "radio" = "tv",
  at: Date = new Date(),
): Promise<NowPlaying | null> {
  const scheduled = await resolveNowPlaying(channelId, service, at);
  if (scheduled) return scheduled;
  if (fallbackPlaylistId) return resolveFallbackNowPlaying(channelId, fallbackPlaylistId, at);
  return null;
}

export function formatDuration(seconds: number) {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h ? `${h}h ${m}m` : m ? `${m}m ${s}s` : `${s}s`;
}

/**
 * Project active playout blocks onto the public programme guide (cms_schedule)
 * for the next `days` days, replacing previously generated future entries.
 */
export async function publishScheduleToGuide(channelId: string, days = 7) {
  const schedules = (await fetchPlayoutSchedules(channelId)).filter((s) => s.is_active);
  const now = new Date();
  const rows: {
    channel_id: string;
    program_title: string;
    description: string | null;
    category: string | null;
    starts_at: string;
    ends_at: string;
    is_published: boolean;
  }[] = [];

  for (let d = 0; d < days; d++) {
    const day = new Date(now);
    day.setDate(day.getDate() + d);
    for (const s of schedules) {
      const base = new Date(s.starts_at);
      let start: Date | null = null;
      if (s.recurrence === "none") {
        if (base.toDateString() === day.toDateString()) start = base;
      } else {
        const cand = new Date(day);
        cand.setHours(base.getHours(), base.getMinutes(), 0, 0);
        if (cand.getTime() < base.getTime()) continue;
        if (s.recurrence === "weekly" && s.days_of_week.length && !s.days_of_week.includes(cand.getDay())) continue;
        start = cand;
      }
      if (!start || start.getTime() + s.duration_minutes * 60_000 < now.getTime()) continue;
      rows.push({
        channel_id: channelId,
        program_title: s.name,
        description: null,
        category: s.service === "radio" ? "Radio" : null,
        starts_at: start.toISOString(),
        ends_at: new Date(start.getTime() + s.duration_minutes * 60_000).toISOString(),
        is_published: true,
      });
    }
  }

  await supabase
    .from("cms_schedule")
    .delete()
    .eq("channel_id", channelId)
    .gte("starts_at", now.toISOString());
  if (rows.length) {
    const { error } = await supabase.from("cms_schedule").insert(rows as never);
    if (error) throw error;
  }
  return rows.length;
}
