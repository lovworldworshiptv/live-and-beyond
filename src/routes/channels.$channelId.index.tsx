import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { LibraryBig } from "lucide-react";
import { Play, Volume2, VolumeX, Users, Radio, Bell, BellRing, Plus, Check, ChevronRight, Signal, Sparkles, Tv, Mic } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TitleCard } from "@/components/title-card";
import { ShareMenu } from "@/components/share-menu";
import { channels, getChannel, getTitle, type Channel } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";
import { mapChannelRow } from "@/lib/cms-catalog";
import { useHlsAttach } from "@/hooks/use-hls";
import { useFollowing, useSettings } from "@/lib/personal";
import { useChannelFollow } from "@/lib/follows";
import { recordPlaybackEvent } from "@/lib/analytics";
import { resolveNowPlaying, type NowPlaying } from "@/lib/playout";
import { toast } from "sonner";

export const Route = createFileRoute("/channels/$channelId/")({
  head: () => ({
    meta: [
      { title: "Channel — Lettflix" },
      { name: "description", content: "Watch live channels on Lettflix." },
    ],
  }),
  notFoundComponent: ChannelNotFound,
  errorComponent: ChannelError,
  component: ChannelPage,
});

function ChannelNotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-[900px] px-6 py-24 text-center">
        <h1 className="text-3xl font-bold">Channel not found</h1>
        <p className="mt-3 text-[color:var(--muted-foreground)]">The channel you're looking for isn't broadcasting on Lettflix.</p>
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
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 px-5 h-11 rounded-md bg-primary text-primary-foreground font-semibold"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

function ChannelPage() {
  const { channelId } = Route.useParams();
  const [channel, setChannel] = useState<Channel | null>(() => getChannel(channelId) ?? null);
  const [notFoundState, setNotFoundState] = useState(false);
  const { has: isFollowingLocal, toggle: toggleFollowLocal } = useFollowing();
  const [dbChannelId, setDbChannelId] = useState<string | null>(null);
  const { following: followingDb, toggle: toggleFollowDb } = useChannelFollow(dbChannelId);
  const { settings, setSettings } = useSettings();

  useEffect(() => {
    let cancelled = false;
    setNotFoundState(false);
    const staticCh = getChannel(channelId) ?? null;
    setChannel(staticCh);
    (async () => {
      const { data } = await supabase
        .from("cms_channels")
        .select("*")
        .eq("slug", channelId)
        .eq("is_published", true)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setChannel(mapChannelRow(data as never));
        setDbChannelId((data as { id: string }).id);
      }
      else if (!staticCh) setNotFoundState(true);
    })();
    return () => { cancelled = true; };
  }, [channelId]);

  const playerRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  const startPlayback = () => {
    setPlaying(true);
    setMuted(false);
    playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    requestAnimationFrame(() => {
      const m = mediaRef.current;
      if (m) {
        m.muted = false;
        m.play().catch(() => {
          m.muted = true;
          setMuted(true);
          m.play().catch(() => {});
        });
      }
    });
  };

  useEffect(() => {
    if (channel && typeof window !== "undefined" && window.location.hash === "#watch") {
      startPlayback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel?.id]);

  // A running Lettflix Live broadcast takes precedence over the configured source,
  // which in turn takes precedence over automated playout.
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [playout, setPlayout] = useState<NowPlaying | null>(null);
  useEffect(() => {
    let cancelled = false;
    setLiveUrl(null);
    setPlayout(null);
    const slug = channelId;
    (async () => {
      const { data: ch } = await supabase
        .from("cms_channels").select("id, playout_enabled").eq("slug", slug).maybeSingle();
      const row = ch as { id?: string; playout_enabled?: boolean } | null;
      const chId = row?.id;
      if (!chId || cancelled) return;
      const { data } = await supabase
        .from("live_sessions")
        .select("playback_hls_url")
        .eq("channel_id", chId)
        .eq("status", "live")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const url = (data as { playback_hls_url?: string | null } | null)?.playback_hls_url ?? null;
      if (cancelled) return;
      if (url) { setLiveUrl(url); return; }
      if (row?.playout_enabled) {
        const np = await resolveNowPlaying(chId);
        if (!cancelled) setPlayout(np);
      }
    })();
    return () => { cancelled = true; };
  }, [channelId]);

  const isFollowing = dbChannelId ? followingDb : isFollowingLocal(channel?.id ?? "");

  const streamSrc =
    liveUrl ||
    channel?.streamUrl ||
    playout?.asset.source_url ||
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
  useHlsAttach(mediaRef, streamSrc, playing);

  // Anonymous playback signals feed creator analytics.
  useEffect(() => {
    if (!playing || !dbChannelId) return;
    const service = channel?.streamKind === "radio" ? "radio" : "tv";
    recordPlaybackEvent({ channelId: dbChannelId, service, event: "start" });
    const t = setInterval(() => {
      recordPlaybackEvent({ channelId: dbChannelId, service, event: "heartbeat", seconds: 30 });
    }, 30_000);
    return () => clearInterval(t);
  }, [playing, dbChannelId, channel?.streamKind]);

  // Join automated playout mid-programme, exactly like a real TV feed.
  useEffect(() => {
    if (!playing || !playout || liveUrl || channel?.streamUrl) return;
    const m = mediaRef.current;
    if (!m) return;
    const seek = () => { try { m.currentTime = playout.offsetSeconds; } catch { /* not seekable yet */ } };
    if (m.readyState >= 1) seek();
    else m.addEventListener("loadedmetadata", seek, { once: true });
  }, [playing, playout, liveUrl, channel?.streamUrl]);



  if (notFoundState) return <ChannelNotFound />;
  if (!channel) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="mx-auto max-w-[1480px] px-6 py-24 text-center text-[color:var(--muted-foreground)]">
          Loading channel…
        </div>
      </div>
    );
  }

  const related = channels
    .filter((c) => c.id !== channel.id && c.category === channel.category)
    .concat(channels.filter((c) => c.id !== channel.id && c.category !== channel.category))
    .slice(0, 4);
  const recommendations = channels.filter((c) => c.id !== channel.id).sort((a, b) => b.popularity - a.popularity).slice(0, 6);
  const videoLib = (channel.videoLibrary ?? []).map(getTitle).filter(Boolean) as ReturnType<typeof getTitle>[];
  const podcastLib = (channel.podcastLibrary ?? []).map(getTitle).filter(Boolean) as ReturnType<typeof getTitle>[];
  const featured = (channel.featuredContent ?? []).map(getTitle).filter(Boolean) as ReturnType<typeof getTitle>[];
  const isRadio = channel.streamKind === "radio";



  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* BRANDING BANNER */}
      <section className="relative border-b border-border">
        <div className="relative h-[280px] lg:h-[360px] overflow-hidden">
          <img src={channel.banner} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/30 to-transparent" />
        </div>
        <div className="mx-auto max-w-[1480px] px-6 lg:px-10 -mt-24 relative">
          <div className="text-xs text-[color:var(--muted-foreground)] flex items-center gap-1.5 mb-4">
            <Link to="/channels" className="hover:text-foreground">Channels</Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground">{channel.name}</span>
          </div>
          <div className="flex items-end gap-5 flex-wrap">
            <div className="size-24 lg:size-28 rounded-2xl overflow-hidden border border-border shadow-[var(--shadow-card)] shrink-0 bg-elevated">
              <img src={channel.logoImg} alt="" className="size-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
                {isRadio ? <Mic className="size-3.5" /> : <Tv className="size-3.5" />}
                {channel.category} · {channel.country}
              </div>
              <h1 className="mt-1.5 text-3xl lg:text-5xl font-extrabold tracking-tight">{channel.name}</h1>
              <p className="mt-2 text-[color:var(--secondary-foreground)] max-w-2xl">{channel.tagline}</p>
            </div>
          </div>
        </div>
      </section>


      {/* PLAYER — Live Stream / Radio Stream */}
      <section ref={playerRef} className="mx-auto max-w-[1480px] px-6 lg:px-10 pt-8 scroll-mt-24">
        <div className={`relative rounded-2xl overflow-hidden border border-border bg-black ${isRadio ? "aspect-[21/9] lg:aspect-[21/6]" : "aspect-video"}`}>
          {/* Poster / backdrop */}
          <img src={channel.banner} alt="" className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ${playing ? "opacity-0" : isRadio ? "opacity-40 blur-sm scale-110" : "opacity-60"}`} />
          {!playing && <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />}

          {/* Actual media element */}
          {playing && (
            isRadio ? (
              <>
                <img src={channel.banner} alt="" className="absolute inset-0 size-full object-cover opacity-40 blur-sm scale-110" />
                <audio
                  ref={(el) => { mediaRef.current = el; }}
                  autoPlay
                  controls={false}
                  className="hidden"
                />
              </>
            ) : (
              <video
                ref={(el) => { mediaRef.current = el; }}
                autoPlay
                playsInline
                controls
                className="absolute inset-0 size-full object-contain bg-black"
              />
            )
          )}
          

          <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
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
              <div
                className="size-[46px] sm:size-[92px] rounded-full bg-white/95 grid place-items-center transition group-hover:scale-110"
                style={{
                  boxShadow: "0 0 0 4px oklch(0.55 0.22 25 / 0.35), 0 0 30px oklch(0.55 0.22 25 / 0.55), 0 0 70px oklch(0.55 0.22 25 / 0.25)",
                }}
              >
                {isRadio ? <Mic className="size-4 sm:size-8 text-background" /> : <Play className="size-4 sm:size-8 text-background fill-current ml-0.5 sm:ml-1" />}
              </div>
            </button>
          )}

          {/* Radio playback controls overlay */}
          {playing && isRadio && (
            <div className="absolute inset-0 grid place-items-center">
              <button
                onClick={() => {
                  const m = mediaRef.current;
                  if (!m) return;
                  m.muted = !m.muted;
                  setMuted(m.muted);
                }}
                className="size-16 rounded-full bg-white/95 grid place-items-center hover:scale-105 transition"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX className="size-6 text-background" /> : <Volume2 className="size-6 text-background" />}
              </button>
            </div>
          )}

          <div className={`absolute bottom-0 inset-x-0 p-4 lg:p-6 ${playing && !isRadio ? "pointer-events-none opacity-0" : ""}`}>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs text-white/70 uppercase tracking-wider">
                  {isRadio ? "On Air Now" : "Now Playing"}
                </div>
                <div className="font-semibold text-lg truncate text-white">{channel.nowPlaying.title}</div>
              </div>
            </div>
            <div className="mt-3 h-1 rounded-full bg-white/15 overflow-hidden">
              <div className="h-full w-1/3 bg-primary" />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-white/60">
              <span>{channel.nowPlaying.startsAt}</span>
              <span>{channel.nowPlaying.endsAt}</span>
            </div>
          </div>
        </div>
      </section>

      {/* META + ACTIONS */}
      <section className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={startPlayback}
              className="inline-flex items-center gap-2 px-5 h-11 rounded-md bg-[image:var(--gradient-live)] text-primary-foreground font-semibold hover:opacity-95 transition"
              style={{
                boxShadow: "0 0 0 3px oklch(0.55 0.22 25 / 0.3), 0 0 24px oklch(0.55 0.22 25 / 0.45), 0 0 50px oklch(0.55 0.22 25 / 0.2)",
              }}
            >
              <Play className="size-[19px] fill-current" strokeWidth={2.5} /> {isRadio ? "Listen Live" : "Watch Live"}
            </button>
            <Link
              to="/channels/$channelId/library"
              params={{ channelId: channel.id }}
              className="inline-flex items-center gap-2 px-5 h-11 rounded-md bg-accent text-accent-foreground font-semibold hover:opacity-95 transition"
            >
              <LibraryBig className="size-4" /> Browse Library
            </Link>
            <button
              onClick={async () => {
                const wasFollowing = isFollowing;
                if (dbChannelId) await toggleFollowDb();
                else toggleFollowLocal(channel.id);
                toast(wasFollowing ? "Unfollowed channel" : "Following channel", { description: channel.name });
              }}
              className={`inline-flex items-center gap-2 px-5 h-11 rounded-md border transition font-medium ${
                isFollowing
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-elevated border-border hover:bg-elevated/70"
              }`}
            >
              {isFollowing ? <Check className="size-4" /> : <Plus className="size-4" />}
              {isFollowing ? "Following" : "Follow Channel"}
            </button>
            <button
              onClick={() => {
                const next = !settings.liveAlerts;
                setSettings({ ...settings, liveAlerts: next });
                toast(next ? "Live alerts on" : "Live alerts off", {
                  description: next ? `We'll notify you when ${channel.name} goes live.` : "You won't receive live alerts.",
                });
              }}
              className={`inline-flex items-center gap-2 px-5 h-11 rounded-md border transition font-medium ${
                settings.liveAlerts
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-elevated border-border hover:bg-elevated/70"
              }`}
            >
              {settings.liveAlerts ? <BellRing className="size-4" /> : <Bell className="size-4" />}
              {settings.liveAlerts ? "Notifying" : "Notify Me"}
            </button>
            <div className="h-11 w-28">
              <ShareMenu title={channel.name} path={`/channels/${channel.id}`} variant="chip" />
            </div>
          </div>



          {/* DESCRIPTION */}
          {channel.description && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold tracking-tight">About {channel.name}</h2>
              <p className="mt-3 text-[color:var(--secondary-foreground)] max-w-3xl leading-relaxed">
                {channel.description}
              </p>
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
            {[
              { k: "Language", v: channel.language },
              { k: "Country", v: channel.country },
              { k: "Format", v: isRadio ? "Audio · 320kbps" : "1080p HDR" },
              { k: "Popularity", v: `${channel.popularity}/100` },
            ].map((m) => (
              <div key={m.k} className="rounded-lg border border-border bg-elevated/40 p-3">
                <div className="text-[11px] text-[color:var(--muted-foreground)] uppercase tracking-wider">{m.k}</div>
                <div className="text-sm font-medium mt-1">{m.v}</div>
              </div>
            ))}
          </div>

          {/* PROGRAM SCHEDULE */}
          <div className="mt-10">
            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <Radio className="size-4 text-primary" /> Program Schedule
            </h2>
            <div className="mt-4 rounded-xl border border-border overflow-hidden divide-y divide-border">
              {(channel.schedule as Channel["schedule"]).map((s, i) => (
                <div
                  key={i}
                  className={`px-4 py-3 flex items-center gap-4 ${
                    s.live ? "bg-primary/10" : "bg-elevated/30"
                  }`}
                >
                  <div className="w-16 text-sm font-mono font-semibold text-[color:var(--secondary-foreground)]">
                    {s.time}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold flex items-center gap-2">
                      {s.title}
                      {s.live && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground live-pulse">
                          LIVE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[color:var(--muted-foreground)] uppercase tracking-wider mt-0.5">
                      {s.kind}
                    </div>
                  </div>
                  <button className="text-[color:var(--muted-foreground)] hover:text-foreground" aria-label="Set reminder">
                    <Bell className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* FEATURED CONTENT */}
          {featured.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                <Sparkles className="size-4 text-accent" /> Featured Content
              </h2>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {featured.map((t) => t && <TitleCard key={t.id} t={t} portrait={false} />)}
              </div>
            </div>
          )}

          {/* VIDEO LIBRARY */}
          {videoLib.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                <Tv className="size-4 text-accent" /> Video Library
              </h2>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {videoLib.map((t) => t && <TitleCard key={t.id} t={t} />)}
              </div>
            </div>
          )}

          {/* PODCAST LIBRARY */}
          {podcastLib.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                <Mic className="size-4 text-accent" /> Podcast Library
              </h2>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {podcastLib.map((t) => t && <TitleCard key={t.id} t={t} portrait={false} />)}
              </div>
            </div>
          )}

          {/* RECOMMENDATIONS */}
          <div className="mt-12">
            <h2 className="text-xl font-semibold tracking-tight">Recommended for you</h2>
            <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
              Channels popular with viewers of {channel.name}.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {recommendations.map((r) => (
                <Link
                  key={r.id}
                  to="/channels/$channelId"
                  params={{ channelId: r.id }}
                  className="group flex gap-3 p-3 rounded-xl border border-border bg-elevated/40 hover:border-accent/40 transition min-w-0"
                >
                  <div className="relative size-16 shrink-0 rounded-md overflow-hidden">
                    <img src={r.banner} alt="" className="size-full object-cover" />
                    {r.isLive && (
                      <span className="absolute top-1 left-1 text-[9px] font-bold px-1 py-0.5 rounded bg-primary text-primary-foreground">LIVE</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-accent font-semibold uppercase tracking-wider truncate">{r.category}</div>
                    <div className="text-sm font-semibold leading-tight line-clamp-1">{r.name}</div>
                    <div className="text-xs text-[color:var(--muted-foreground)] mt-0.5 line-clamp-1">
                      Now: {r.nowPlaying.title}
                    </div>
                  </div>

                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* SIDEBAR — related channels */}
        <aside className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
            Related channels
          </div>
          {related.map((r) => (
            <Link
              key={r.id}
              to="/channels/$channelId"
              params={{ channelId: r.id }}
              className="group flex gap-3 p-3 rounded-xl border border-border bg-elevated/40 hover:border-accent/40 transition min-w-0"
            >
              <div className="relative size-20 shrink-0 rounded-md overflow-hidden">
                <img src={r.banner} alt="" className="size-full object-cover" />
                {r.isLive && (
                  <span className="absolute top-1 left-1 text-[9px] font-bold px-1 py-0.5 rounded bg-primary text-primary-foreground">LIVE</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] text-accent font-semibold uppercase tracking-wider truncate">{r.category}</div>
                <div className="text-sm font-semibold leading-tight line-clamp-1">{r.name}</div>
                <div className="text-xs text-[color:var(--muted-foreground)] mt-0.5 line-clamp-1">
                  Now: {r.nowPlaying.title}
                </div>
              </div>

            </Link>
          ))}
        </aside>
      </section>

      <SiteFooter />
    </div>
  );
}
