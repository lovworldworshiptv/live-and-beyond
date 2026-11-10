import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX, Maximize, Minimize } from "lucide-react";

type Player = {
  destroy: () => void; getCurrentTime: () => number; getDuration: () => number;
  playVideo: () => void; pauseVideo: () => void; seekTo: (s: number, allow: boolean) => void;
  mute: () => void; unMute: () => void; isMuted: () => boolean;
};
type YoutubeApi = { Player: new (element: HTMLElement, options: Record<string, unknown>) => Player };
let apiPromise: Promise<YoutubeApi> | undefined;
function loadApi() {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<YoutubeApi>((resolve, reject) => {
    const global = window as Window & { YT?: YoutubeApi; onYouTubeIframeAPIReady?: () => void };
    if (global.YT?.Player) { resolve(global.YT); return; }
    const previous = global.onYouTubeIframeAPIReady;
    const timeout = window.setTimeout(() => { apiPromise = undefined; reject(new Error("YouTube did not load")); }, 20000);
    global.onYouTubeIframeAPIReady = () => { previous?.(); clearTimeout(timeout); if (global.YT) resolve(global.YT); };
    const script = document.createElement("script"); script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => { clearTimeout(timeout); apiPromise = undefined; script.remove(); reject(new Error("YouTube unavailable")); };
    document.head.appendChild(script);
  });
  return apiPromise;
}

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  return `${h ? `${h}:` : ""}${h ? String(m).padStart(2, "0") : m}:${String(sec).padStart(2, "0")}`;
};

type Props = {
  id: string; start?: number; resumePct?: number;
  onPlaying: () => void; onProgress: (time: number, duration: number) => void; onError: (message: string) => void;
};

/** YouTube playback behind Lettflix controls: a transparent shield stops YouTube's hover chrome and logo from appearing. */
export function YoutubePlayer({ id, start = 0, resumePct, onPlaying, onProgress, onError }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const callbacks = useRef({ onPlaying, onProgress, onError }); callbacks.current = { onPlaying, onProgress, onError };
  const [active, setActive] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const resumeRef = useRef(resumePct);

  useEffect(() => {
    let disposed = false; let player: Player | undefined; let timer: ReturnType<typeof setInterval> | undefined;
    let playingNow = false; let lastSave = 0;
    const save = () => { if (player) callbacks.current.onProgress(player.getCurrentTime(), player.getDuration()); };
    loadApi().then((api) => {
      if (disposed || !host.current) return;
      const target = document.createElement("div"); host.current.appendChild(target);
      player = new api.Player(target, {
        videoId: id, width: "100%", height: "100%",
        playerVars: { autoplay: 1, playsinline: 1, controls: 0, fs: 0, rel: 0, iv_load_policy: 3, disablekb: 1, modestbranding: 1, start: Math.floor(start), origin: window.location.origin },
        events: {
          onReady: () => {
            playerRef.current = player ?? null;
            const pct = resumeRef.current;
            const d = player?.getDuration() ?? 0;
            if (!start && pct && pct > 0 && pct < 95 && d > 0) player?.seekTo((pct / 100) * d, true);
          },
          onStateChange: (event: { data: number }) => {
            playingNow = event.data === 1;
            setActive(playingNow);
            if (playingNow) callbacks.current.onPlaying();
            if (event.data === 2 || event.data === 0) save();
          },
          onError: (event: { data: number }) => callbacks.current.onError([101, 150].includes(event.data) ? "This video's owner does not allow embedded playback." : event.data === 100 ? "This YouTube video is private or unavailable." : "YouTube playback unavailable. Tap play to retry."),
        },
      });
      timer = setInterval(() => {
        if (!player?.getCurrentTime) return;
        setTime(player.getCurrentTime()); setDuration(player.getDuration());
        if (playingNow && Date.now() - lastSave > 5000) { lastSave = Date.now(); save(); }
      }, 500);
    }).catch(() => { if (!disposed) callbacks.current.onError("YouTube could not load. Check your connection and retry."); });
    return () => { disposed = true; clearInterval(timer); try { save(); } catch { /* player gone */ } playerRef.current = null; player?.destroy(); };
  }, [id, start]);

  useEffect(() => {
    const onFs = () => setFullscreen(document.fullscreenElement === wrap.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggle = () => { const p = playerRef.current; if (!p) return; if (active) p.pauseVideo(); else p.playVideo(); };
  const toggleMute = () => { const p = playerRef.current; if (!p) return; if (p.isMuted()) { p.unMute(); setMuted(false); } else { p.mute(); setMuted(true); } };
  const toggleFs = () => { if (document.fullscreenElement) void document.exitFullscreen(); else void wrap.current?.requestFullscreen?.(); };
  const seek = (v: number) => { playerRef.current?.seekTo(v, true); setTime(v); };

  return (
    <div ref={wrap} className="group/yt absolute inset-0 size-full bg-background">
      <div ref={host} className="absolute inset-0 size-full [&_iframe]:size-full [&_iframe]:border-0" aria-label="Video player" />
      {/* Shield: keeps YouTube's hover title bar and logo from ever appearing. */}
      <button type="button" aria-label={active ? "Pause" : "Play"} onClick={toggle} onDoubleClick={toggleFs} className="absolute inset-0 z-10 size-full cursor-pointer bg-transparent" />
      <div className={`absolute inset-x-0 bottom-0 z-20 flex items-center gap-2 bg-gradient-to-t from-background/90 to-transparent px-3 pb-2 pt-8 transition-opacity ${active ? "opacity-0 group-hover/yt:opacity-100 focus-within:opacity-100" : "opacity-100"}`}>
        <button type="button" onClick={toggle} aria-label={active ? "Pause" : "Play"} className="grid size-9 shrink-0 place-items-center rounded-full text-foreground hover:bg-foreground/10">
          {active ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
        </button>
        <span className="shrink-0 text-xs tabular-nums text-foreground/90">{fmt(time)}</span>
        <input type="range" min={0} max={duration || 0} step={1} value={Math.min(time, duration || 0)} onChange={(e) => seek(Number(e.target.value))} aria-label="Seek" className="h-1 min-w-0 flex-1 cursor-pointer accent-[color:var(--primary)]" />
        <span className="shrink-0 text-xs tabular-nums text-foreground/70 max-[359px]:hidden">{fmt(duration)}</span>
        <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className="grid size-9 shrink-0 place-items-center rounded-full text-foreground hover:bg-foreground/10">
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
        <button type="button" onClick={toggleFs} aria-label={fullscreen ? "Exit full screen" : "Full screen"} className="grid size-9 shrink-0 place-items-center rounded-full text-foreground hover:bg-foreground/10">
          {fullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
        </button>
      </div>
    </div>
  );
}
