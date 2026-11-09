import { useEffect, useRef, type RefObject } from "react";
import { audioLevel } from "@/lib/audio-reactivity";

/** Capture the playing element without routing it through Web Audio (CORS must not silence playback). */
export function useAudioReactivity(mediaRef: RefObject<HTMLAudioElement | null>, active: boolean, viewKey: string) {
  const visualRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const media = mediaRef.current;
    const visual = visualRef.current;
    if (!media || !visual || !active || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let context: AudioContext | null = null;
    let captured: MediaStream | null = null;
    let disposed = false;
    const reset = () => visual.style.setProperty("--audio-level", "0");
    const connect = () => {
      if (disposed || context) return;
      const capture = media as HTMLAudioElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream };
      try {
        captured = capture.captureStream?.() ?? capture.mozCaptureStream?.() ?? null;
        if (!captured?.getAudioTracks().length) return;
        context = new AudioContext();
        const source = context.createMediaStreamSource(captured);
        const analyser = context.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        void context.resume().catch(() => {});
        const samples = new Uint8Array(analyser.fftSize);
        const draw = () => {
          if (disposed) return;
          analyser.getByteTimeDomainData(samples);
          visual.style.setProperty("--audio-level", String(media.paused || media.muted ? 0 : audioLevel(samples)));
          frame = requestAnimationFrame(draw);
        };
        draw();
      } catch { reset(); /* Stream capture can be unavailable; audio still plays normally. */ }
    };
    media.addEventListener("playing", connect);
    if (!media.paused) connect();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      media.removeEventListener("playing", connect);
      captured?.getTracks().forEach((track) => track.stop());
      void context?.close().catch(() => {});
      reset();
    };
  }, [mediaRef, active, viewKey]);
  return visualRef;
}