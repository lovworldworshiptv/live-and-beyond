import { useEffect, useRef } from "react";

type Player = { destroy: () => void; getCurrentTime: () => number; getDuration: () => number };
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

export function YoutubePlayer({ id, start = 0, onPlaying, onProgress, onError }: { id: string; start?: number; onPlaying: () => void; onProgress: (time: number, duration: number) => void; onError: (message: string) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onPlaying, onProgress, onError }); callbacks.current = { onPlaying, onProgress, onError };
  useEffect(() => {
    let disposed = false; let player: Player | undefined; let timer: ReturnType<typeof setInterval> | undefined;
    let active = false;
    const save = () => { if (player) callbacks.current.onProgress(player.getCurrentTime(), player.getDuration()); };
    loadApi().then((api) => {
      if (disposed || !host.current) return;
      const target = document.createElement("div"); host.current.appendChild(target);
      player = new api.Player(target, {
        videoId: id, width: "100%", height: "100%",
        playerVars: { autoplay: 1, playsinline: 1, controls: 1, fs: 1, rel: 0, start, origin: window.location.origin },
        events: {
          onStateChange: (event: { data: number }) => {
            active = event.data === 1;
            if (active) callbacks.current.onPlaying();
            if (event.data === 2 || event.data === 0) save();
          },
          onError: (event: { data: number }) => callbacks.current.onError([101, 150].includes(event.data) ? "This video's owner does not allow embedded playback." : event.data === 100 ? "This YouTube video is private or unavailable." : "YouTube playback unavailable. Tap play to retry."),
        },
      });
      timer = setInterval(() => { if (active) save(); }, 5000);
    }).catch(() => { if (!disposed) callbacks.current.onError("YouTube could not load. Check your connection and retry."); });
    return () => { disposed = true; clearInterval(timer); save(); player?.destroy(); };
  }, [id, start]);
  return <div ref={host} className="absolute inset-0 size-full [&_iframe]:size-full [&_iframe]:border-0" aria-label="YouTube video player" />;
}