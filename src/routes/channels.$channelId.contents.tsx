import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Play, Volume2, VolumeX, Users, Signal, Tv, Mic, CalendarClock, Radio, Sparkles, ChevronRight, ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TitleCard } from "@/components/title-card";
import { getChannel, getTitle, type Channel } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";
import type { Title } from "@/lib/catalog";
import { mapChannelRow, mapTitleRow } from "@/lib/cms-catalog";
import { useHlsAttach } from "@/hooks/use-hls";

export const Route = createFileRoute("/channels/$channelId/contents")({
  head: () => ({
    meta: [
      { title: "Channel Contents — Lettflix" },
      { name: "description", content: "Watch live, browse on-demand and see what's coming up on this Lettflix channel." },
    ],
  }),
  notFoundComponent: ChannelNotFound,
  errorComponent: ChannelError,
  component: ChannelContentsPage,
});

function ChannelNotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-[900px] px-6 py-24 text-center">
        <h1 className="text-3xl font-bold">Channel not found</h1>
        <Link to="/channels" className="inline-flex mt-6 px-5 h-11 items-center rounded-md bg-primary text-primary-foreground font-semibold">Browse channels</Link>
      </div>
    </div>
  );
}

function ChannelError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-[900px] px-6 py-24 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-6 px-5 h-11 rounded-md bg-primary text-primary-foreground font-semibold">Try again</button>
      </div>
    </div>
  );
}

type ScheduleRow = {
  id: string;
  program_title: string;
  description: string | null;
  category: string | null;
  starts_at: string;
  ends_at: string;
};

type EventRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  starts_at: string;
  ends_at: string | null;
  cover_url: string | null;
};

function formatTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch { return iso; }
}
function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }); } catch { return iso; }
}

function ChannelContentsPage() {
  const { channelId } = Route.useParams();
  const [channel, setChannel] = useState<Channel | null>(() => getChannel(channelId) ?? null);
  const [notFoundState, setNotFoundState] = useState(false);
  const [cmsChannelUuid, setCmsChannelUuid] = useState<string | null>(null);
  const [libraryTitles, setLibraryTitles] = useState<Title[]>([]);
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>([]);
  const [eventRows, setEventRows] = useState<EventRow[]>([]);

  // Load live CMS data for this channel
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const staticCh = getChannel(channelId) ?? null;
      const { data: chRow } = await supabase
        .from("cms_channels")
        .select("*")
        .eq("slug", channelId)
        .eq("is_published", true)
        .maybeSingle();

      const merged: Channel | null = chRow ? mapChannelRow(chRow as never) : staticCh;
      if (cancelled) return;
      if (!merged) { setNotFoundState(true); return; }
      setChannel(merged);
      const uuid = (chRow as { id?: string } | null)?.id ?? null;
      setCmsChannelUuid(uuid);

      // Titles: union of video_library + podcast_library + featured_content (slugs)
      const slugSet = new Set<string>([
        ...(merged.videoLibrary ?? []),
        ...(merged.podcastLibrary ?? []),
        ...(merged.featuredContent ?? []),
      ]);
      let titles: Title[] = [];
      if (slugSet.size) {
        const { data: titleRows } = await supabase
          .from("cms_titles")
          .select("*")
          .in("slug", Array.from(slugSet))
          .eq("is_published", true);
        const cmsTitles = (titleRows ?? []).map((r) => mapTitleRow(r as never));
        const cmsSlugs = new Set(cmsTitles.map((t) => t.id));
        const fallback = Array.from(slugSet)
          .filter((s) => !cmsSlugs.has(s))
          .map((s) => getTitle(s))
          .filter(Boolean) as Title[];
        titles = [...cmsTitles, ...fallback];
      }
      if (!cancelled) setLibraryTitles(titles);

      if (uuid) {
        const nowIso = new Date().toISOString();
        const [{ data: sched }, { data: evs }] = await Promise.all([
          supabase
            .from("cms_schedule")
            .select("id, program_title, description, category, starts_at, ends_at")
            .eq("channel_id", uuid)
            .eq("is_published", true)
            .gte("ends_at", nowIso)
            .order("starts_at", { ascending: true })
            .limit(50),
          supabase
            .from("cms_events")
            .select("id, slug, name, description, category, starts_at, ends_at, cover_url")
            .eq("channel_id", uuid)
            .eq("is_published", true)
            .gte("starts_at", nowIso)
            .order("starts_at", { ascending: true })
            .limit(20),
        ]);
        if (!cancelled) {
          setScheduleRows((sched ?? []) as ScheduleRow[]);
          setEventRows((evs ?? []) as EventRow[]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [channelId]);

  const isRadio = channel?.streamKind === "radio";
  const streamSrc = channel?.streamUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  const startPlayback = () => {
    setPlaying(true);
    setMuted(false);
    requestAnimationFrame(() => {
      const m = mediaRef.current;
      if (m) {
        m.muted = false;
        m.play().catch(() => { m.muted = true; setMuted(true); m.play().catch(() => {}); });
      }
    });
  };

  useEffect(() => {
    if (channel && typeof window !== "undefined" && window.location.hash === "#watch") startPlayback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel?.id]);

  useHlsAttach(mediaRef, streamSrc, playing);


  if (notFoundState) return <ChannelNotFound />;
  if (!channel) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="mx-auto max-w-[1480px] px-6 py-24 text-center text-[color:var(--muted-foreground)]">Loading channel…</div>
      </div>
    );
  }

  // Merge static schedule (fallback) into a unified list when CMS schedule is empty
  const scheduleFallback = !scheduleRows.length ? channel.schedule.map((s, i) => ({
    id: `static-${i}`,
    program_title: s.title,
    description: null,
    category: s.kind,
    starts_at: s.time,
    ends_at: "",
  } as ScheduleRow)) : [];
  const scheduleItems = scheduleRows.length ? scheduleRows : scheduleFallback;
  void cmsChannelUuid;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Breadcrumb + back */}
      <div className="mx-auto max-w-[1480px] px-6 lg:px-10 pt-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="text-xs text-[color:var(--muted-foreground)] flex items-center gap-1.5">
          <Link to="/channels" className="hover:text-foreground">Channels</Link>
          <ChevronRight className="size-3" />
          <Link to="/channels/$channelId" params={{ channelId: channel.id }} className="hover:text-foreground">{channel.name}</Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground">Contents</span>
        </div>
        <Link to="/channels/$channelId" params={{ channelId: channel.id }} className="inline-flex items-center gap-1.5 text-xs px-3 h-8 rounded-md border border-border bg-elevated/40 hover:bg-elevated transition">
          <ArrowLeft className="size-3.5" /> Channel overview
        </Link>
      </div>

      {/* Player */}
      <section className="mx-auto max-w-[1480px] px-6 lg:px-10 pt-4 scroll-mt-24">
        <div className="flex items-end gap-4 mb-4 flex-wrap">
          <div className="size-14 rounded-xl overflow-hidden border border-border shrink-0 bg-elevated">
            <img src={channel.logoImg} alt="" className="size-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
              {isRadio ? <Mic className="size-3.5" /> : <Tv className="size-3.5" />}
              {channel.category} · {channel.country}
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">{channel.name}</h1>
          </div>
        </div>

        <div className={`relative rounded-2xl overflow-hidden border border-border bg-black ${isRadio ? "aspect-[21/9] lg:aspect-[21/6]" : "aspect-video"}`}>
          <img src={channel.banner} alt="" className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ${playing ? "opacity-0" : isRadio ? "opacity-40 blur-sm scale-110" : "opacity-60"}`} />
          {!playing && <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />}

          {playing && (
            isRadio ? (
              <>
                <img src={channel.banner} alt="" className="absolute inset-0 size-full object-cover opacity-40 blur-sm scale-110" />
                <audio ref={(el) => { mediaRef.current = el; }} autoPlay controls={false} className="hidden" />
              </>
            ) : (
              <video ref={(el) => { mediaRef.current = el; }} autoPlay playsInline controls className="absolute inset-0 size-full object-contain bg-black" />
            )
          )}

          <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none flex-wrap">
            {channel.isLive && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-[image:var(--gradient-live)] text-primary-foreground live-pulse">
                {isRadio ? "ON AIR" : "LIVE"}
              </span>
            )}
            <span className="text-[11px] px-2 py-1 rounded bg-black/60 backdrop-blur inline-flex items-center gap-1">
              <Users className="size-3" /> {channel.viewers} {isRadio ? "listening" : "watching"}
            </span>
            <span className="text-[11px] px-2 py-1 rounded bg-black/60 backdrop-blur inline-flex items-center gap-1 text-white/80">
              <Signal className="size-3" /> {isRadio ? "Audio · 320kbps" : "1080p · HDR"}
            </span>
          </div>

          {!playing && (
            <button onClick={startPlayback} className="absolute inset-0 grid place-items-center group" aria-label={isRadio ? "Listen live" : "Watch live"}>
              <div className="size-[92px] rounded-full bg-white/95 grid place-items-center transition group-hover:scale-110" style={{ boxShadow: "0 0 0 4px oklch(0.55 0.22 25 / 0.35), 0 0 30px oklch(0.55 0.22 25 / 0.55), 0 0 70px oklch(0.55 0.22 25 / 0.25)" }}>
                {isRadio ? <Mic className="size-8 text-background" /> : <Play className="size-8 text-background fill-current ml-1" />}
              </div>
            </button>
          )}

          {playing && isRadio && (
            <div className="absolute inset-0 grid place-items-center">
              <button
                onClick={() => { const m = mediaRef.current; if (!m) return; m.muted = !m.muted; setMuted(m.muted); }}
                className="size-16 rounded-full bg-white/95 grid place-items-center hover:scale-105 transition"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX className="size-6 text-background" /> : <Volume2 className="size-6 text-background" />}
              </button>
            </div>
          )}

          <div className={`absolute bottom-0 inset-x-0 p-4 lg:p-6 ${playing && !isRadio ? "pointer-events-none opacity-0" : ""}`}>
            <div className="text-xs text-white/70 uppercase tracking-wider">{isRadio ? "On Air Now" : "Now Playing"}</div>
            <div className="font-semibold text-lg text-white truncate">{channel.nowPlaying.title}</div>
            {channel.nowPlaying.description && (
              <div className="text-sm text-white/75 mt-1 max-w-2xl line-clamp-2">{channel.nowPlaying.description}</div>
            )}
          </div>
        </div>
      </section>

      {/* Content sections */}
      <div className="mx-auto max-w-[1480px] px-6 lg:px-10 py-12 space-y-14">
        {/* Programming schedule */}
        <section>
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Radio className="size-4 text-primary" /> Programming Schedule
          </h2>
          <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
            Upcoming broadcasts on {channel.name}.
          </p>
          {scheduleItems.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border bg-elevated/30 p-8 text-center text-sm text-[color:var(--muted-foreground)]">
              No upcoming programs published yet.
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-border overflow-hidden divide-y divide-border">
              {scheduleItems.map((s) => {
                const isCms = scheduleRows.length > 0;
                return (
                  <div key={s.id} className="px-4 py-3 flex items-center gap-4 bg-elevated/30">
                    <div className="w-28 text-sm font-mono font-semibold text-[color:var(--secondary-foreground)]">
                      {isCms ? (
                        <>
                          <div>{formatDate(s.starts_at)}</div>
                          <div className="text-xs opacity-75">{formatTime(s.starts_at)}{s.ends_at ? ` – ${formatTime(s.ends_at)}` : ""}</div>
                        </>
                      ) : (
                        <span>{s.starts_at}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{s.program_title}</div>
                      <div className="text-[11px] text-[color:var(--muted-foreground)] uppercase tracking-wider mt-0.5">
                        {s.category ?? "Program"}
                      </div>
                      {s.description && <div className="text-xs text-[color:var(--muted-foreground)] mt-1 line-clamp-2">{s.description}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Scheduled live broadcasts / events */}
        <section>
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <CalendarClock className="size-4 text-primary" /> Scheduled Live Broadcasts
          </h2>
          <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
            Special events and live broadcasts coming up on {channel.name}.
          </p>
          {eventRows.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border bg-elevated/30 p-8 text-center text-sm text-[color:var(--muted-foreground)]">
              No live broadcasts scheduled yet.
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventRows.map((e) => (
                <div key={e.id} className="rounded-xl border border-border overflow-hidden bg-elevated/40 hover:border-accent/50 transition group">
                  <div className="relative aspect-video overflow-hidden bg-black">
                    {e.cover_url ? (
                      <img src={e.cover_url} alt="" className="size-full object-cover group-hover:scale-105 transition" />
                    ) : (
                      <img src={channel.banner} alt="" className="size-full object-cover opacity-60" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[image:var(--gradient-live)] text-primary-foreground">
                      LIVE · UPCOMING
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-[10px] uppercase tracking-wider text-accent font-semibold">{e.category ?? "Event"}</div>
                    <div className="font-semibold mt-1 line-clamp-1">{e.name}</div>
                    <div className="text-xs text-[color:var(--muted-foreground)] mt-1">
                      {formatDate(e.starts_at)} · {formatTime(e.starts_at)}
                      {e.ends_at ? ` – ${formatTime(e.ends_at)}` : ""}
                    </div>
                    {e.description && <div className="text-xs text-[color:var(--muted-foreground)] mt-2 line-clamp-2">{e.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* On-Demand library */}
        <section>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                <Sparkles className="size-4 text-accent" /> On-Demand Library
              </h2>
              <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
                Every on-demand title uploaded by {channel.name}.
              </p>
            </div>
            <Link
              to="/channels/$channelId/library"
              params={{ channelId: channel.id }}
              className="inline-flex items-center gap-1.5 text-xs px-3 h-9 rounded-md border border-border bg-elevated hover:bg-elevated/70 font-medium"
            >
              Browse full library <ChevronRight className="size-3.5" />
            </Link>
          </div>
          {libraryTitles.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border bg-elevated/30 p-8 text-center text-sm text-[color:var(--muted-foreground)]">
              No on-demand content uploaded to this channel yet.
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {libraryTitles.map((t) => <TitleCard key={t.id} t={t} />)}
            </div>
          )}
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
