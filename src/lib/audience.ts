import { supabase } from "@/integrations/supabase/client";
import { recordAudienceEvent } from "./audience.functions";

export type AudienceKind = "visit" | "click" | "stream" | "share_open";

function sessionId() {
  if (typeof window === "undefined") return null;
  let id = sessionStorage.getItem("lettflix.playbackSession");
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem("lettflix.playbackSession", id); }
  return id;
}

function platform() {
  if (typeof navigator === "undefined") return "web";
  const ua = navigator.userAgent;
  if (/LettflixApp/i.test(ua)) return "android-app";
  if (/Android/i.test(ua)) return "android-web";
  if (/iPhone|iPad/i.test(ua)) return "ios-web";
  return "web";
}

/** Fire-and-forget audience signal; never breaks the page. */
export function trackAudience(input: {
  kind: AudienceKind;
  targetType: "channel" | "creator" | "title";
  channelId?: string | null;
  creatorId?: string | null;
  titleId?: string | null;
  service?: "tv" | "radio" | "vod" | "podcast" | null;
}) {
  void recordAudienceEvent({ data: { ...input, sessionId: sessionId(), platform: platform() } }).catch(() => {});
}

export type AudienceRow = {
  kind: string; service: string | null; country: string | null; city: string | null;
  channel_id: string | null; session_id: string | null; created_at: string;
};

export type AudienceSummary = {
  visits: number; uniqueVisitors: number; liveClicks: number; liveStreams: number;
  vodViews: number; shareOpens: number;
  locations: { place: string; count: number }[];
  countries: { country: string; count: number }[];
};

/** Pure aggregation, shared by Studio and Admin. */
export function summarizeAudience(rows: AudienceRow[]): AudienceSummary {
  const visitors = new Set<string>();
  const places = new Map<string, number>();
  const countries = new Map<string, number>();
  let visits = 0, liveClicks = 0, liveStreams = 0, vodViews = 0, shareOpens = 0;
  for (const r of rows) {
    if (r.kind === "visit") { visits++; if (r.session_id) visitors.add(r.session_id); }
    if (r.kind === "share_open") shareOpens++;
    if (r.kind === "click" && (r.service === "tv" || r.service === "radio")) liveClicks++;
    if (r.kind === "stream" && (r.service === "tv" || r.service === "radio")) liveStreams++;
    if (r.kind === "stream" && (r.service === "vod" || r.service === "podcast")) vodViews++;
    const c = r.country ?? "Unknown";
    countries.set(c, (countries.get(c) ?? 0) + 1);
    const place = r.city ? `${r.city}, ${c}` : c;
    places.set(place, (places.get(place) ?? 0) + 1);
  }
  const sort = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  return {
    visits, uniqueVisitors: visitors.size, liveClicks, liveStreams, vodViews, shareOpens,
    locations: sort(places).map(([place, count]) => ({ place, count })),
    countries: sort(countries).map(([country, count]) => ({ country, count })),
  };
}

export async function fetchAudience(filter: { channelId?: string; creatorId?: string }, days: number) {
  let q = supabase.from("audience_events")
    .select("kind, service, country, city, channel_id, session_id, created_at")
    .gte("created_at", new Date(Date.now() - days * 86_400_000).toISOString())
    .order("created_at", { ascending: false }).limit(10_000);
  if (filter.channelId) q = q.eq("channel_id", filter.channelId);
  if (filter.creatorId) q = q.eq("creator_id", filter.creatorId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AudienceRow[];
}

export function countryName(code: string) {
  if (code.length !== 2) return code;
  try { return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code; } catch { return code; }
}
