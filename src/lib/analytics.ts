import { supabase } from "@/integrations/supabase/client";

export type PlaybackService = "tv" | "radio" | "vod" | "podcast";
export type PlaybackEventKind = "start" | "heartbeat" | "end";

let sessionId: string | null = null;
function getSessionId() {
  if (typeof window === "undefined") return null;
  if (sessionId) return sessionId;
  const stored = sessionStorage.getItem("lettflix.playbackSession");
  sessionId = stored ?? crypto.randomUUID();
  sessionStorage.setItem("lettflix.playbackSession", sessionId);
  return sessionId;
}

/** Fire-and-forget playback signal used by creator analytics. */
export async function recordPlaybackEvent(input: {
  channelId?: string | null;
  titleId?: string | null;
  service: PlaybackService;
  event?: PlaybackEventKind;
  seconds?: number;
}) {
  try {
    const { data: auth } = await supabase.auth.getUser();
    await supabase.from("playback_events").insert({
      channel_id: input.channelId ?? null,
      title_id: input.titleId ?? null,
      service: input.service,
      event: input.event ?? "start",
      seconds: Math.max(0, Math.round(input.seconds ?? 0)),
      session_id: getSessionId(),
      user_id: auth.user?.id ?? null,
    } as never);
  } catch {
    /* analytics must never break playback */
  }
}

export type AnalyticsSummary = {
  watchHours: number;
  uniqueViewers: number;
  plays: number;
  byDay: { day: string; hours: number; plays: number }[];
  byService: { service: string; hours: number }[];
};

export async function fetchChannelAnalytics(channelId: string, days = 14): Promise<AnalyticsSummary> {
  const since = new Date(Date.now() - days * 86_400_000);
  const { data } = await supabase
    .from("playback_events")
    .select("service, event, seconds, session_id, created_at")
    .eq("channel_id", channelId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true })
    .limit(10_000);

  const rows = (data ?? []) as Array<{
    service: string; event: string; seconds: number; session_id: string | null; created_at: string;
  }>;

  const dayBuckets = new Map<string, { hours: number; plays: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    dayBuckets.set(d, { hours: 0, plays: 0 });
  }

  const sessions = new Set<string>();
  const serviceSeconds = new Map<string, number>();
  let totalSeconds = 0;
  let plays = 0;

  for (const r of rows) {
    const day = r.created_at.slice(0, 10);
    const bucket = dayBuckets.get(day) ?? { hours: 0, plays: 0 };
    if (r.event === "start") { plays += 1; bucket.plays += 1; }
    if (r.event !== "start") {
      totalSeconds += r.seconds ?? 0;
      bucket.hours += (r.seconds ?? 0) / 3600;
      serviceSeconds.set(r.service, (serviceSeconds.get(r.service) ?? 0) + (r.seconds ?? 0));
    }
    dayBuckets.set(day, bucket);
    if (r.session_id) sessions.add(r.session_id);
  }

  return {
    watchHours: totalSeconds / 3600,
    uniqueViewers: sessions.size,
    plays,
    byDay: [...dayBuckets.entries()].map(([day, v]) => ({
      day: day.slice(5),
      hours: Number(v.hours.toFixed(2)),
      plays: v.plays,
    })),
    byService: [...serviceSeconds.entries()].map(([service, s]) => ({
      service,
      hours: Number((s / 3600).toFixed(2)),
    })),
  };
}
