import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from "react";
import { Link } from "@tanstack/react-router";
import { Pause, Play, Radio as RadioIcon, Volume2, VolumeX, X } from "lucide-react";
import Hls from "hls.js";
import type { RadioStation } from "@/lib/radio";
import { getRadioNowPlaying } from "@/lib/radio.functions";

type NowPlaying = { title: string | null; artist: string | null };

type RadioCtx = {
  station: RadioStation | null;
  playing: boolean;
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
  const [muted, setMuted] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying>({ title: null, artist: null });

  // Attach the stream whenever the station changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !station?.streamUrl) return;
    const src = station.streamUrl;
    hlsRef.current?.destroy();
    hlsRef.current = null;

    const isHls = /\.m3u8(\?|$)/i.test(src) || station.format === "hls";
    if (isHls && !audio.canPlayType("application/vnd.apple.mpegurl") && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(audio);
      hlsRef.current = hls;
    } else if (audio.src !== src) {
      audio.src = src;
      audio.load();
    }
    audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));

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
      if (audio.paused) audio.play().then(() => setPlaying(true)).catch(() => undefined);
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

  const value = useMemo(
    () => ({ station, playing, nowPlaying, play, toggle, stop }),
    [station, playing, nowPlaying, play, toggle, stop],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} muted={muted} className="hidden" />
      {station && (
        <div className="fixed inset-x-0 bottom-0 z-50 pb-[max(env(safe-area-inset-bottom),0px)] md:pb-0">
          <div className="mx-auto max-w-[1480px] px-3 pb-16 md:pb-3">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/85 backdrop-blur-xl px-3 py-2 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
              {station.logoUrl ? (
                <img src={station.logoUrl} alt="" className="size-11 rounded-lg object-cover border border-border" />
              ) : (
                <div className="size-11 rounded-lg bg-elevated grid place-items-center border border-border">
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
                <div className="truncate text-xs text-[color:var(--muted-foreground)]">
                  {nowPlaying.title
                    ? `${nowPlaying.artist ? `${nowPlaying.artist} — ` : ""}${nowPlaying.title}`
                    : station.stationMessage || "Live radio"}
                </div>
              </div>
              <button
                onClick={() => toggle(station)}
                aria-label={playing ? "Pause radio" : "Play radio"}
                className="size-10 grid place-items-center rounded-full bg-primary text-primary-foreground"
              >
                {playing ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current" />}
              </button>
              <button
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? "Unmute radio" : "Mute radio"}
                className="size-10 grid place-items-center rounded-full border border-border bg-elevated"
              >
                {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </button>
              <button
                onClick={stop}
                aria-label="Close radio player"
                className="size-10 grid place-items-center rounded-full border border-border bg-elevated"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
