import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from "react";
import { Link } from "@tanstack/react-router";
import { Pause, Play, Radio as RadioIcon, Volume2, VolumeX, X } from "lucide-react";
import Hls from "hls.js";
import { Button } from "@/components/ui/button";
import type { RadioStation } from "@/lib/radio";
import { getRadioNowPlaying } from "@/lib/radio.functions";

type NowPlaying = { title: string | null; artist: string | null };

type RadioCtx = {
  station: RadioStation | null;
  playing: boolean;
  error: string | null;
  nowPlaying: NowPlaying;
  play: (station: RadioStation) => void;
  toggle: (station: RadioStation) => void;
  stop: () => void;
};

const Ctx = createContext<RadioCtx | null>(null);

export function useRadio() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRadio must be used within RadioPlayerProvider");
  return ctx;
}

export function RadioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [station, setStation] = useState<RadioStation | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying>({ title: null, artist: null });

  // Attach the stream whenever the station changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !station?.streamUrl) return;
    setError(null);
    const src = station.streamUrl;
    hlsRef.current?.destroy();
    hlsRef.current = null;

    const isHls = /\.m3u8(\?|$)/i.test(src) || station.format === "hls";
    if (isHls && !audio.canPlayType("application/vnd.apple.mpegurl") && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(audio);
      hls.on(Hls.Events.ERROR, (_event, data) => { if (data.fatal) { setPlaying(false); setError("Station unavailable. Try playing again."); } });
      hlsRef.current = hls;
    } else if (audio.src !== src) {
      audio.src = src;
      audio.load();
    }
    audio.play().then(() => setPlaying(true)).catch(() => { setPlaying(false); setError("Playback could not start. Tap play to retry."); });

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
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

  const play = useCallback((next: RadioStation) => setStation(next), []);

  const toggle = useCallback((next: RadioStation) => {
    const audio = audioRef.current;
    if (station?.channelId === next.channelId && audio) {
      if (audio.paused) { setError(null); audio.play().then(() => setPlaying(true)).catch(() => setError("Station unavailable. Try again shortly.")); }
      else { audio.pause(); setPlaying(false); }
      return;
    }
    setStation(next);
  }, [station]);

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
    () => ({ station, playing, error, nowPlaying, play, toggle, stop }),
    [station, playing, error, nowPlaying, play, toggle, stop],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} muted={muted} className="hidden" onPlaying={() => { setPlaying(true); setError(null); }} onPause={() => setPlaying(false)} onError={() => { setPlaying(false); setError("Station unavailable. Try again shortly."); }} />
      {station && (
        <div data-radio-player className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom,0px))] z-50 lg:bottom-0">
          <div className="mx-auto max-w-[1480px] px-3 pb-3">
            <div className="flex items-center gap-2 sm:gap-3 rounded-lg border border-border bg-background/85 backdrop-blur-xl px-3 py-2 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
              {station.logoUrl ? (
                <img src={station.logoUrl} alt="" className="size-11 shrink-0 rounded-lg object-cover border border-border" />
              ) : (
                <div className="size-11 shrink-0 rounded-lg bg-elevated grid place-items-center border border-border">
                  <RadioIcon className="size-5 text-primary" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <Link
                  to="/channels/$channelId"
                  params={{ channelId: station.slug }}
                  className="block truncate text-sm font-semibold hover:text-primary transition"
                >
                  {station.name}
                </Link>
                <div role="status" className="truncate text-xs text-[color:var(--muted-foreground)]">
                  {error ? error : nowPlaying.title
                    ? `${nowPlaying.artist ? `${nowPlaying.artist} — ` : ""}${nowPlaying.title}`
                    : station.stationMessage || "Live radio"}
                </div>
              </div>
              <Button variant="ghost"
                onClick={() => toggle(station)}
                aria-label={playing ? "Pause radio" : "Play radio"}
                className="size-11 shrink-0 grid place-items-center rounded-full bg-primary text-primary-foreground"
              >
                {playing ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current" />}
              </Button>
              <Button variant="ghost"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? "Unmute radio" : "Mute radio"}
                className="size-11 shrink-0 grid place-items-center rounded-full border border-border bg-elevated"
              >
                {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </Button>
              <Button variant="ghost"
                onClick={stop}
                aria-label="Close radio player"
                className="size-11 shrink-0 grid place-items-center rounded-full border border-border bg-elevated"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
