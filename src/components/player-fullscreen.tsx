import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { Maximize, Minimize } from "lucide-react";

type WebkitDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenEnabled?: boolean;
};
type WebkitElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type WebkitVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
  webkitExitFullscreen?: () => void;
  webkitDisplayingFullscreen?: boolean;
  webkitSupportsFullscreen?: boolean;
};
type LockableOrientation = ScreenOrientation & { lock?: (o: string) => Promise<void> };

const doc = () => document as WebkitDocument;
const currentFullscreen = () => doc().fullscreenElement ?? doc().webkitFullscreenElement ?? null;
const elementFullscreenSupported = () =>
  typeof document !== "undefined" && !!(document.fullscreenEnabled || doc().webkitFullscreenEnabled);

/**
 * Fullscreen for the protected player frame (video + quality menu together).
 * Falls back to the video's native fullscreen on iPhone, where only <video> can go fullscreen.
 */
export function usePlayerFullscreen(
  frameRef: RefObject<HTMLElement | null>,
  mediaRef: RefObject<HTMLVideoElement | HTMLAudioElement | null>,
  enabled: boolean,
) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [idle, setIdle] = useState(false);
  const idleTimer = useRef<number | undefined>(undefined);

  const exit = useCallback(async () => {
    const video = mediaRef.current as WebkitVideo | null;
    try {
      if (currentFullscreen()) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else await doc().webkitExitFullscreen?.();
      } else if (video?.webkitDisplayingFullscreen) {
        video.webkitExitFullscreen?.();
      }
    } catch { /* already exited */ }
  }, [mediaRef]);

  const enter = useCallback(async () => {
    const frame = frameRef.current as WebkitElement | null;
    const media = mediaRef.current;
    if (!frame) return;
    try {
      if (elementFullscreenSupported()) {
        if (frame.requestFullscreen) await frame.requestFullscreen({ navigationUI: "hide" });
        else await frame.webkitRequestFullscreen?.();
        // Phones: turn the picture sideways for a full-width view where the browser allows it.
        if (window.matchMedia("(pointer: coarse)").matches) {
          (screen.orientation as LockableOrientation | undefined)?.lock?.("landscape").catch(() => {});
        }
        return;
      }
      // iPhone Safari: only the video element itself can go fullscreen.
      if (media instanceof HTMLVideoElement) {
        const v = media as WebkitVideo;
        if (v.readyState < 1) {
          await new Promise<void>((resolve) => v.addEventListener("loadedmetadata", () => resolve(), { once: true }));
        }
        v.webkitEnterFullscreen?.();
      }
    } catch { /* browser refused (e.g. no user gesture) */ }
  }, [frameRef, mediaRef]);

  const toggle = useCallback(() => {
    if (isFullscreen) void exit();
    else void enter();
  }, [isFullscreen, enter, exit]);

  // Track state from the browser so Esc, swipe-down and system gestures stay in sync.
  useEffect(() => {
    const sync = () => {
      const el = currentFullscreen();
      const frame = frameRef.current;
      const active = !!el && !!frame && (el === frame || frame.contains(el));
      setIsFullscreen(active);
      if (!active) {
        try { screen.orientation?.unlock?.(); } catch { /* not supported */ }
      }
    };
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    const media = mediaRef.current;
    const onBegin = () => setIsFullscreen(true);
    const onEnd = () => setIsFullscreen(false);
    media?.addEventListener("webkitbeginfullscreen", onBegin);
    media?.addEventListener("webkitendfullscreen", onEnd);
    sync();
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
      media?.removeEventListener("webkitbeginfullscreen", onBegin);
      media?.removeEventListener("webkitendfullscreen", onEnd);
    };
  }, [frameRef, mediaRef, enabled]);

  // Keyboard: "f" toggles fullscreen while a video is playing (ignored while typing).
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "f" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable]")) return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, toggle]);

  // In fullscreen, fade our overlay buttons after a few seconds without movement, like the native controls.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !isFullscreen) {
      setIdle(false);
      return;
    }
    const wake = () => {
      setIdle(false);
      window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => setIdle(true), 3000);
    };
    wake();
    frame.addEventListener("pointermove", wake);
    frame.addEventListener("pointerdown", wake);
    frame.addEventListener("keydown", wake);
    return () => {
      window.clearTimeout(idleTimer.current);
      frame.removeEventListener("pointermove", wake);
      frame.removeEventListener("pointerdown", wake);
      frame.removeEventListener("keydown", wake);
    };
  }, [frameRef, isFullscreen]);

  return { isFullscreen, idle, toggle, enter, exit };
}

export function FullscreenButton({ isFullscreen, onToggle }: { isFullscreen: boolean; onToggle: () => void }) {
  const label = isFullscreen ? "Exit full screen" : "Full screen";
  return (
    <button
      type="button"
      onClick={onToggle}
      className="size-9 rounded-md bg-black/75 backdrop-blur text-white grid place-items-center hover:bg-black/90 border border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      aria-label={label}
      title={`${label} (f)`}
    >
      {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
    </button>
  );
}
