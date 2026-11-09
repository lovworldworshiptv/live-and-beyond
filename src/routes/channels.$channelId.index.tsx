import { createFileRoute, Link, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { LibraryBig } from "lucide-react";
import { Play, Volume2, VolumeX, Users, Radio, Bell, BellRing, Plus, Check, ChevronRight, Signal, Sparkles, Tv, Mic } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ChannelArtwork } from "@/components/channel-artwork";
import { TitleCard } from "@/components/title-card";
import { ShareMenu } from "@/components/share-menu";
import { channels, type Channel, type Title } from "@/lib/catalog";
import { fetchChannelLibrary } from "@/lib/channel-library";
import { supabase } from "@/integrations/supabase/client";
import { mapChannelRow } from "@/lib/cms-catalog";
import { useHlsAttach } from "@/hooks/use-hls";
import { QualityMenu } from "@/components/quality-menu";
import { usePlayerFullscreen } from "@/components/player-fullscreen";
import { protectedChannelSrc } from "@/lib/stream-src";
import { useFollowing, useSettings } from "@/lib/personal";
import { useChannelFollow, formatFollowers } from "@/lib/follows";
import { recordPlaybackEvent } from "@/lib/analytics";
import { resolveChannelPlayout, type NowPlaying } from "@/lib/playout";
import { toast } from "sonner";
import { fetchRadioSettings, type RadioSettings, type RadioFormat } from "@/lib/radio";
import { RadioNowPlaying, useRadio } from "@/components/radio-player";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/channels/$channelId/")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Channel \u2014 Lettflix" },
      { property: "og:description", content: "Watch live channels on Lettflix." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Channel — Lettflix" },
      { name: "description", content: "Watch live channels on Lettflix." },
    ],
  }),
  codeSplitGroupings: [["component", "notFoundComponent", "errorComponent"]],
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

function ChannelError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-[900px] px-6 py-24 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">{error instanceof Error ? error.message : String(error)}</p>
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
  const [channel, setChannel] = useState<Channel | null>(null);
  const [notFoundState, setNotFoundState] = useState(false);
  const { has: isFollowingLocal, toggle: toggleFollowLocal } = useFollowing();
  const [dbChannelId, setDbChannelId] = useState<string | null>(null);
  const { following: followingDb, toggle: toggleFollowDb, notify: notifyDb, setNotify: setNotifyDb, count: followerCount, signedIn } = useChannelFollow(dbChannelId);
  const { settings, setSettings } = useSettings();
  const notifyOn = Boolean(dbChannelId && signedIn ? followingDb && notifyDb : settings.liveAlerts);
  const [radio, setRadio] = useState<RadioSettings | null>(null);
  const [libraryTitles, setLibraryTitles] = useState<Title[]>([]);
  const radioPlayer = useRadio();

  useEffect(() => {
    let cancelled = false;
    setNotFoundState(false);
    setChannel(null);
    setLibraryTitles([]);
    setRadio(null);
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
        const id = (data as { id: string }).id;
        setDbChannelId(id);
        fetchRadioSettings(id).then((r) => { if (!cancelled) setRadio(r); }).catch(() => {});
        fetchChannelLibrary(id, mapChannelRow(data as never)).then((titles) => {
          if (!cancelled) setLibraryTitles(titles);
        }).catch(() => {});
      }
      else setNotFoundState(true);
    })();
    return () => { cancelled = true; };
  }, [channelId]);

  const playerRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const failPlayback = (message: string) => { setPlaybackError(message); setPlaying(false); };
  useEffect(() => {
    mediaRef.current?.pause();
    setPlaying(false);
    setPlaybackError(null);
    setDbChannelId(null);
  }, [channelId]);

  const startPlayback = () => {
    if (!streamSrc) { toast("This channel is not available to play yet."); return; }
    // One broadcast at a time: starting TV stops any radio station.
    if (radioPlayer.station) radioPlayer.stop();
    setPlaying(true);
    setPlaybackError(null);
    setMuted(false);
    playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // If a radio station starts anywhere (e.g. the mini player), stop the TV stream.
  useEffect(() => {
    if (radioPlayer.station) {
      mediaRef.current?.pause();
      setPlaying(false);
    }
  }, [radioPlayer.station]);

  // A running Lettflix Live broadcast takes precedence over the configured source,
  // which in turn takes precedence over automated playout.
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [playout, setPlayout] = useState<NowPlaying | null>(null);
  const [playoutTick, setPlayoutTick] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLiveUrl(null);
    setPlayout(null);
    const slug = channelId;
    (async () => {
      const { data: ch } = await supabase
        .from("cms_channels")
        .select("id, playout_enabled, tv_source, fallback_playlist_id")
        .eq("slug", slug)
        .maybeSingle();
      const row = ch as {
        id?: string; playout_enabled?: boolean; tv_source?: string; fallback_playlist_id?: string | null;
      } | null;
      const chId = row?.id;
      if (!chId || cancelled) return;

      // A channel broadcasts from exactly one source.
      const src = row?.tv_source ?? (row?.playout_enabled ? "playout" : "external");

      if (src === "playout") {
        const np = await resolveChannelPlayout(chId, row?.fallback_playlist_id ?? null);
        if (!cancelled) setPlayout(np);
        return;
      }
      if (src === "external") return; // the channel's configured stream URL is used

      const { data } = await supabase
        .from("live_sessions")
        .select("playback_hls_url")
        .eq("channel_id", chId)
        .eq("status", "live")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const url = (data as { playback_hls_url?: string | null } | null)?.playback_hls_url ?? null;
      if (!cancelled && url) setLiveUrl(url);
    })();
    return () => { cancelled = true; };
  }, [channelId, playoutTick]);

  // When the current automated programme ends, roll on to the next one.
  useEffect(() => {
    if (!playout) return;
    const ms = Math.max(1000, playout.endsAt.getTime() - Date.now());
    const t = setTimeout(() => setPlayoutTick((n) => n + 1), ms);
    return () => clearTimeout(t);
  }, [playout]);

  const isFollowing = dbChannelId ? followingDb : isFollowingLocal(channel?.id ?? "");

  const streamSrc =
    liveUrl ||
    playout?.asset.source_url ||
    channel?.streamUrl ||
    (channel?.streamKind === "radio" && radio?.is_enabled ? radio.stream_url ?? "" : "");
  // Live/HLS sources are played through the same-origin manifest proxy so the
  // Cloudflare playback URL is never exposed in the DOM.
  const playbackSrc = protectedChannelSrc(channelId, streamSrc) ?? streamSrc;
  const hls = useHlsAttach(mediaRef, playbackSrc, playing, undefined, failPlayback);
  const watchStarted = useRef<string | null>(null);
  useEffect(() => {
    if (watchStarted.current === channelId || !channel || !streamSrc || window.location.hash !== "#watch") return;
    watchStarted.current = channelId;
    startPlayback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, channel, streamSrc]);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const fullscreen = usePlayerFullscreen(frameRef, mediaRef, playing && channel?.streamKind !== "radio");

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
    if (!playing || !playout || liveUrl) return;
    const m = mediaRef.current;
    if (!m) return;
    const seek = () => { try { m.currentTime = playout.offsetSeconds; } catch { /* not seekable yet */ } };
    if (m.readyState >= 1) seek();
    else m.addEventListener("loadedmetadata", seek, { once: true });
    const advance = () => setPlayoutTick((n) => n + 1);
    m.addEventListener("ended", advance);
    return () => {
      m.removeEventListener("loadedmetadata", seek);
      m.removeEventListener("ended", advance);
    };
  }, [playing, playout, liveUrl]);



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
  const videoLib = libraryTitles.filter((t) => t.kind !== "Podcast");
  const podcastLib = libraryTitles.filter((t) => t.kind === "Podcast");
  const featured = libraryTitles.filter((t) => (channel.featuredContent ?? []).includes(t.id));
  const isRadio = channel.streamKind === "radio";
  const radioOnHere = !!radioPlayer.station && radioPlayer.station.slug === channelId;



  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* BRANDING BANNER */}
      <section className="relative border-b border-border">
        <div className="relative h-[210px] lg:h-[270px] overflow-hidden">
          <ChannelArtwork channel={channel} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/30 to-transparent" />
        </div>
        <div className="mx-auto max-w-[1480px] px-6 lg:px-10 -mt-18 relative">
          <div className="text-xs text-[color:var(--muted-foreground)] flex items-center gap-1.5 mb-4">
            <Link to="/channels" className="hover:text-foreground">Channels</Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground">{channel.name}</span>
          </div>
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-end gap-3 sm:flex sm:gap-5">
            <div className="size-24 lg:size-28 rounded-2xl overflow-hidden border border-border shadow-[var(--shadow-card)] shrink-0 bg-elevated grid place-items-center">
              <img src={channel.logoImg} alt="" className="size-full object-contain p-2" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
                {isRadio ? <Mic className="size-3.5" /> : <Tv className="size-3.5" />}
                {channel.category} · {channel.country}
              </div>
              <h1 className="mt-1.5 text-3xl max-[359px]:text-xl lg:text-5xl font-extrabold tracking-tight break-words">{channel.name}</h1>
              <p className="mt-2 text-[color:var(--secondary-foreground)] max-w-2xl">{channel.tagline}</p>
            </div>
          </div>
        </div>
      </section>


      {radio?.is_enabled && radio.stream_url && (
        <div className="mx-auto max-w-[1480px] px-4 lg:px-10 pt-4">
          <div role="group" aria-label={`Choose how to follow ${channel.name}`} className="grid grid-cols-2 sm:inline-flex rounded-lg border border-border bg-elevated p-1">
            {streamSrc && !isRadio && (
              <Button variant="ghost"
                type="button"
                aria-pressed={!radioOnHere}
                onClick={() => { if (radioOnHere || !playing) startPlayback(); }}
                className={`h-10 px-4 rounded-md text-sm font-semibold inline-flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${!radioOnHere ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Tv className="size-4" /> Watch live TV
              </Button>
            )}
            <Button variant="ghost"
              type="button"
              aria-pressed={radioOnHere}
              onClick={() => {
                if (radioOnHere) return;
                mediaRef.current?.pause();
                setPlaying(false);
                radioPlayer.play({
                channelId: dbChannelId ?? channel.id, slug: channelId, name: channel.name,
                tagline: channel.tagline ?? null, logoUrl: radio.artwork_url || channel.logoImg || null, bannerUrl: channel.banner || null,
                category: channel.category ?? null, country: channel.country ?? null, language: channel.language ?? null,
                streamUrl: radio.stream_url, format: (radio.format ?? "mp3") as RadioFormat, bitrate: radio.bitrate_kbps ?? 128,
                nowPlayingTitle: radio.now_playing_title, nowPlayingArtist: radio.now_playing_artist,
                nowPlayingArtwork: radio.now_playing_artwork_url, stationMessage: radio.station_message,
              });
              }}
              className={`h-10 px-4 rounded-md text-sm font-semibold inline-flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${radioOnHere ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Radio className="size-4" /> Listen to radio
            </Button>
          </div>
        </div>
      )}

      {/* PLAYER — Live Stream / Radio Stream */}
      <section ref={playerRef} className={`mx-auto max-w-[1480px] px-4 lg:px-10 pt-4 lg:pt-8 scroll-mt-24 ${playing ? "sticky top-16 z-30 bg-background lg:static" : ""}`}>
        {radioOnHere ? <RadioNowPlaying /> : <>
        <div ref={frameRef} data-protected-player data-video-player={!isRadio || undefined} data-idle={fullscreen.idle || undefined} className={`relative rounded-lg overflow-hidden border border-border bg-background ${isRadio ? "aspect-[21/9] lg:aspect-[21/6]" : "aspect-video"}`}>
          {/* Poster / backdrop */}
          <ChannelArtwork channel={channel} alt="" className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ${playing ? "opacity-0" : isRadio ? "opacity-40 blur-sm scale-110" : "opacity-60"}`} />
          {!playing && <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />}

          {/* Actual media element */}
          {playing && (
            isRadio ? (
              <>
                <ChannelArtwork channel={channel} alt="" className="absolute inset-0 size-full object-cover opacity-40 blur-sm scale-110" />
                <audio
                  ref={(el) => { mediaRef.current = el; }}
                  autoPlay
                  controls={false}
                  onError={() => failPlayback("Radio is unavailable. Tap play to retry.")}
                  onVolumeChange={() => setMuted(mediaRef.current?.muted ?? false)}
                  className="hidden"
                />
              </>
            ) : (
              <video
                ref={(el) => { mediaRef.current = el; }}
                autoPlay
                playsInline
                controls
                onError={() => failPlayback("This channel's live feed is unavailable. Tap play to retry.")}
                onVolumeChange={() => setMuted(mediaRef.current?.muted ?? false)}
                controlsList="nodownload noplaybackrate"
                onContextMenu={(e) => e.preventDefault()}
                onDoubleClick={(e) => { e.preventDefault(); fullscreen.toggle(); }}
                className="absolute inset-0 size-full object-contain bg-black"
              />
            )
          )}
          

          {playing && !isRadio && (
            <>
              <div className="player-overlay-controls absolute bottom-14 right-3 z-20 flex items-center gap-2">
                <QualityMenu controller={hls} />
              </div>
            </>
          )}


          <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
            {channel.isLive && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-[image:var(--gradient-live)] text-primary-foreground live-pulse">
                {isRadio ? "ON AIR" : "LIVE"}
              </span>
            )}
          </div>

          {!playing && (
            <Button variant="ghost" onClick={startPlayback} className="absolute inset-0 size-full grid place-items-center group hover:bg-transparent" aria-label={isRadio ? "Listen live" : "Watch live"}>
              <div
                className="size-[46px] sm:size-[92px] rounded-full bg-white/95 grid place-items-center transition group-hover:scale-110"
                style={{
                  boxShadow: "0 0 0 4px oklch(0.55 0.22 25 / 0.35), 0 0 30px oklch(0.55 0.22 25 / 0.55), 0 0 70px oklch(0.55 0.22 25 / 0.25)",
                }}
              >
                {isRadio ? <Mic className="size-4 sm:size-8 text-background" /> : <Play className="size-4 sm:size-8 text-background fill-current ml-0.5 sm:ml-1" />}
              </div>
            </Button>
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

          <div className={`pointer-events-none absolute bottom-0 inset-x-0 p-4 lg:p-6 ${playing && !isRadio ? "opacity-0" : ""}`}>
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
          {playbackError && <div role="alert" className="pointer-events-none absolute bottom-2 inset-x-2 rounded bg-background/90 px-3 py-2 text-center text-xs text-foreground">{playbackError}</div>}
        </div>
        </>}
      </section>

      {/* META + ACTIONS */}
      <section className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3 [&>a]:min-w-0 [&>a]:justify-center [&>button]:min-w-0 [&>button]:px-2 sm:[&>button]:px-5 [&>button]:text-xs sm:[&>button]:text-sm [&>a]:text-xs sm:[&>a]:text-sm">
            {!radioOnHere && <Button
              onClick={startPlayback}
              className="inline-flex items-center gap-2 px-5 h-11 rounded-md bg-[image:var(--gradient-live)] text-primary-foreground font-semibold hover:opacity-95 transition"
              style={{
                boxShadow: "0 0 0 3px oklch(0.55 0.22 25 / 0.3), 0 0 24px oklch(0.55 0.22 25 / 0.45), 0 0 50px oklch(0.55 0.22 25 / 0.2)",
              }}
            >
              <Play className="size-[19px] fill-current" strokeWidth={2.5} /> {isRadio ? "Listen Live" : "Watch Live"}
            </Button>}
            <Link
              to="/channels/$channelId/library"
              params={{ channelId: channel.id }}
              className={`inline-flex items-center gap-2 px-2 sm:px-5 h-11 rounded-md bg-accent text-accent-foreground font-semibold hover:opacity-95 transition ${radioOnHere ? "col-span-2 sm:col-span-1" : ""}`}
            >
              <LibraryBig className="size-4" /> Browse Library
            </Link>
            <Button variant="outline"
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
              {followerCount != null && <span className="text-xs opacity-80 tabular-nums" aria-label={`${followerCount} followers`}>· {formatFollowers(followerCount)}</span>}
            </Button>
            <Button variant="outline"
              onClick={async () => {
                if (dbChannelId && signedIn) {
                  if (!followingDb) { toast("Follow this channel first", { description: "Followers get alerts for new uploads and programmes." }); return; }
                  try {
                    await setNotifyDb(!notifyDb);
                    toast(!notifyDb ? "Notifications on" : "Notifications off", {
                      description: !notifyDb ? `New uploads and programmes from ${channel.name} will notify you.` : "You'll stay subscribed without alerts.",
                    });
                  } catch { toast.error("Couldn't update notifications. Try again."); }
                  return;
                }
                if (dbChannelId) { toast("Sign in to get notifications", { description: "Follow while signed in to receive alerts." }); return; }
                const next = !settings.liveAlerts;
                setSettings({ ...settings, liveAlerts: next });
                toast(next ? "Live alerts on" : "Live alerts off", {
                  description: next ? `We'll notify you when ${channel.name} goes live.` : "You won't receive live alerts.",
                });
              }}
              aria-pressed={notifyOn}
              className={`inline-flex items-center gap-2 px-5 h-11 rounded-md border transition font-medium ${
                notifyOn
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-elevated border-border hover:bg-elevated/70"
              }`}
            >
              {notifyOn ? <BellRing className="size-4" /> : <Bell className="size-4" />}
              {notifyOn ? "Notifying" : "Notify Me"}
            </Button>
            <div className="col-span-2 flex h-11 justify-end sm:col-span-1 sm:w-28">
              <ShareMenu title={channel.name} path={`/channels/${channel.id}`} image={channel.banner || channel.logoImg} subtitle="Live on Lettflix" variant="chip" />
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
                    <ChannelArtwork channel={r} alt="" className="size-full object-cover" />
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
                <ChannelArtwork channel={r} alt="" className="size-full object-cover" />
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
