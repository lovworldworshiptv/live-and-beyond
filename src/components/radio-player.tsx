import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ShareMenu } from "./share-menu";
import { Mic, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import Hls from "hls.js";
import { Button } from "@/components/ui/button";
import type { RadioStation } from "@/lib/radio";
import { getRadioNowPlaying } from "@/lib/radio.functions";
import { recordPlaybackEvent } from "@/lib/analytics";
import { startMediaPlayback } from "@/lib/media-playback";
import { titleCase } from "@/lib/title-case";
import { useAudioReactivity } from "@/hooks/use-audio-reactivity";
import type { CSSProperties, RefObject } from "react";
import { useBrandColor } from "@/hooks/use-brand-color";

type NowPlaying = { title: string | null; artist: string | null };

type RadioCtx = {
  station: RadioStation | null;
  playing: boolean;
  error: string | null;
  nowPlaying: NowPlaying;
  play: (station: RadioStation) => void;
  toggle: (station: RadioStation) => void;
  stop: () => void;
  muted: boolean;
  toggleMute: () => void;
  volume: number;
  setVolume: (volume: number) => void;
  visualRef: RefObject<HTMLDivElement | null>;
};

const Ctx = createContext<RadioCtx | null>(null);

export function useRadio() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRadio must be used within RadioPlayerProvider");
  return ctx;
}

export function RadioPlayerProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackedStation = useRef<RadioStation | null>(null);
  const playbackStarted = useRef(false);
  const hlsRef = useRef<Hls | null>(null);
  const [station, setStation] = useState<RadioStation | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying>({ title: null, artist: null });
  const visualRef = useAudioReactivity(audioRef, !!station, `${station?.slug}-${location.pathname}`);
  const [volume, setVolumeState] = useState(1);
  const toggleMute = useCallback(() => setMuted((value) => !value), []);
  const setVolume = useCallback((next: number) => {
    const value = Math.min(1, Math.max(0, next));
    setVolumeState(value);
    setMuted(value === 0);
  }, []);
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);

  // Attach the stream whenever the station changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !station?.streamUrl) return;
    setError(null);
    const src = station.streamUrl;
    // This provider advertises CORS; other providers remain unrestricted for playback.
    audio.crossOrigin = /^https:\/\/[^/]*radiolize\.com(?::\d+)?\//i.test(src) ? "anonymous" : null;
    hlsRef.current?.destroy();
    hlsRef.current = null;
    let disposed = false;
    const start = () => {
      void startMediaPlayback(audio).catch(() => {
        if (!disposed) { setPlaying(false); setError("Playback could not start. Tap play to retry."); }
      });
    };

    const isHls = /\.m3u8(\?|$)/i.test(src) || station.format === "hls";
    if (isHls && !audio.canPlayType("application/vnd.apple.mpegurl") && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(audio);
      hls.on(Hls.Events.MANIFEST_PARSED, start);
      hls.on(Hls.Events.ERROR, (_event, data) => { if (data.fatal) { setPlaying(false); setError("Station unavailable. Try playing again."); } });
      hlsRef.current = hls;
    } else if (audio.src !== src) {
      audio.addEventListener("loadedmetadata", start, { once: true });
      audio.src = src;
      audio.load();
    } else start();

    return () => {
      disposed = true;
      audio.removeEventListener("loadedmetadata", start);
      audio.pause();
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [station]);

  useEffect(() => {
    trackedStation.current = station;
    playbackStarted.current = false;
    return () => {
      if (station && playbackStarted.current) void recordPlaybackEvent({ channelId: station.channelId, service: "radio", event: "end" });
    };
  }, [station]);

  // Now-playing metadata polling
  useEffect(() => {
    if (!station) {
      setNowPlaying({ title: null, artist: null });
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const np = await getRadioNowPlaying({ data: { channelId: station.channelId } });
        if (!cancelled) setNowPlaying({ title: np.title, artist: np.artist });
      } catch {
        /* metadata is best-effort */
      }
    };
    setNowPlaying({ title: station.nowPlayingTitle, artist: station.nowPlayingArtist });
    load();
    const t = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(t); };
  }, [station]);

  const play = useCallback((next: RadioStation) => {
    const audio = audioRef.current;
    if (station?.channelId === next.channelId && audio && !error) {
      void startMediaPlayback(audio).catch(() => setError("Playback could not start. Tap play to retry."));
      return;
    }
    setStation({ ...next });
  }, [station, error]);

  const toggle = useCallback((next: RadioStation) => {
    const audio = audioRef.current;
    if (station?.channelId === next.channelId && audio) {
      if (error) { play(next); return; }
      if (audio.paused) { setError(null); void startMediaPlayback(audio).catch(() => setError("Station unavailable. Try again shortly.")); }
      else { audio.pause(); setPlaying(false); }
      return;
    }
    setStation(next);
  }, [station, error, play]);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    hlsRef.current?.destroy();
    hlsRef.current = null;
    setPlaying(false);
    setStation(null);
  }, []);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    if (!station) { navigator.mediaSession.metadata = null; navigator.mediaSession.playbackState = "none"; return; }
    navigator.mediaSession.metadata = new MediaMetadata({ title: nowPlaying.title || station.name, artist: nowPlaying.artist || station.name, album: "Lettflix Radio", artwork: station.logoUrl ? [{ src: station.logoUrl }] : [] });
    navigator.mediaSession.playbackState = playing ? "playing" : "paused";
    navigator.mediaSession.setActionHandler("play", () => { audioRef.current?.play().catch(() => setError("Playback unavailable.")); });
    navigator.mediaSession.setActionHandler("pause", () => audioRef.current?.pause());
    navigator.mediaSession.setActionHandler("stop", stop);
    return () => { for (const action of ["play", "pause", "stop"] as const) navigator.mediaSession.setActionHandler(action, null); };
  }, [station, playing, nowPlaying, stop]);

  const value = useMemo(
    () => ({ station, playing, error, nowPlaying, play, toggle, stop, muted, toggleMute, volume, setVolume, visualRef }),
    [station, playing, error, nowPlaying, play, toggle, stop, muted, toggleMute, volume, setVolume, visualRef],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} muted={muted} onVolumeChange={() => setMuted(audioRef.current?.muted ?? false)} className="hidden" onPlaying={() => {
        setPlaying(true); setError(null);
        if (!playbackStarted.current && trackedStation.current) {
          playbackStarted.current = true;
          void recordPlaybackEvent({ channelId: trackedStation.current.channelId, service: "radio", event: "start" });
        }
      }} onPause={() => {
        setPlaying(false);
        if (playbackStarted.current && trackedStation.current) void recordPlaybackEvent({ channelId: trackedStation.current.channelId, service: "radio", event: "end" });
        playbackStarted.current = false;
      }} onError={() => { setPlaying(false); setError("Station unavailable. Try again shortly."); }} />
      {station && !location.pathname.replace(/\/$/, "").endsWith(`/channels/${station.slug}`) && (
        <div data-radio-player className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom,0px))] z-50 lg:bottom-0">
          <div className="mx-auto max-w-[1480px] px-3 pb-3">
            <RadioNowPlaying compact />
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export function RadioNowPlaying({ compact = false }: { compact?: boolean }) {
  const { station, nowPlaying, playing, muted, error, toggle, toggleMute, volume, setVolume, stop, visualRef } = useRadio();
  const brand = useBrandColor(station?.logoUrl ?? undefined, station?.bannerUrl ?? undefined);
  if (!station) return null;
  const song = [nowPlaying.title, nowPlaying.artist].filter((value): value is string => !!value).map(titleCase).join(" — ");
  return (
    <div ref={visualRef} data-audio-reactive data-playing={playing && !muted || undefined} style={brand ? ({ "--mic-rgb": brand } as CSSProperties) : undefined} className={`radio-podcast-player ${compact ? "radio-podcast-compact" : "radio-podcast-full"}`}>
      <img src={station.logoUrl || station.bannerUrl || "/icon-512.png"} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/icon-512.png"; }} alt="" className="radio-podcast-backdrop" />
      <div className="radio-podcast-shade" />
      <div className="radio-podcast-mic" aria-hidden="true"><span className="radio-mic-ring" /><span className="radio-mic-ring radio-mic-ring-2" /><Mic /></div>
      <div className="radio-podcast-copy">
        <Link to="/channels/$channelId" params={{ channelId: station.slug }} className="text-xs text-muted-foreground">{station.name}</Link>
        <h2 className="radio-show-title">{titleCase(station.stationMessage || station.name)}</h2>
        <div role="status" className="radio-song-status">
          {!error && <span className="radio-now-label"><span className="radio-now-dot" aria-hidden="true" />{song ? "Now playing" : "On air"}</span>}
          {error ? <span>{error}</span> : song ? <>
            <span className="sr-only">{song}</span>
            <div className="radio-song-window" aria-hidden="true" title={song}>
              <div key={song} className="radio-song-scroll" data-paused={!playing || undefined}>
                {[0, 1].map((copy) => <div key={copy} className="radio-song-line">{song}</div>)}
              </div>
            </div>
          </> : <div className="radio-song-window" title={station.name}><div className="radio-song-line">{titleCase(station.stationMessage || station.name)}{playing ? "" : " · Paused"}</div></div>}
        </div>
      </div>
      <div className="radio-podcast-controls">
        <Button variant="ghost" onClick={() => toggle(station)} aria-label={playing ? "Pause radio" : "Play radio"} className="size-11 rounded-full bg-foreground text-background hover:bg-foreground/90">{playing ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}</Button>
        <div className="radio-volume">
          <Button variant="ghost" onClick={() => { if (muted && volume === 0) setVolume(0.6); else toggleMute(); }} aria-label={muted ? "Unmute radio" : "Mute radio"} className="size-9 shrink-0 rounded-full">{muted || volume === 0 ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}</Button>
          <input type="range" min={0} max={100} step={1} value={muted ? 0 : Math.round(volume * 100)} onChange={(event) => setVolume(Number(event.currentTarget.value) / 100)} aria-label="Radio volume" aria-valuetext={`${muted ? 0 : Math.round(volume * 100)}%`} className="radio-volume-range" style={{ "--volume": `${muted ? 0 : volume * 100}%` } as CSSProperties} />
        </div>
        <ShareMenu title={`${station.name} Radio`} subtitle="Live radio on Lettflix" path={`/channels/${station.slug}#radio`} image={station.logoUrl || station.bannerUrl} />
        <Button variant="ghost" onClick={stop} aria-label="Close radio player" className="size-11 rounded-full bg-elevated"><X className="size-5" /></Button>
      </div>
    </div>
  );
}
