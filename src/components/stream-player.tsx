import { useEffect, useRef, useState } from "react";
import { Play, Volume2, VolumeX, Mic } from "lucide-react";
import { useHlsAttach } from "@/hooks/use-hls";
import { Button } from "@/components/ui/button";
import { useProgress, useSettings } from "@/lib/personal";
import { QualityMenu } from "@/components/quality-menu";

type Props = {
  src?: string | null;
  titleId?: string;
  poster?: string | null;
  kind?: "video" | "audio";
  autoPlay?: boolean;
  className?: string;
  posterOverlayLabel?: string;
  ariaPlayLabel?: string;
};

export function StreamPlayer({
  src,
  titleId,
  poster,
  kind = "video",
  autoPlay = false,
  className,
  posterOverlayLabel,
  ariaPlayLabel = "Play",
}: Props) {
  const { setProgress } = useProgress();
  const lastProgress = useRef(0);
  const saveProgress = () => {
    const media = mediaRef.current;
    if (!titleId || !media || !Number.isFinite(media.duration) || media.duration <= 0 || media.currentTime <= 0) return;
    if (Date.now() - lastProgress.current < 5000 && !media.paused && !media.ended) return;
    lastProgress.current = Date.now();
    setProgress(titleId, Math.min(100, media.currentTime / media.duration * 100));
  };
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(autoPlay);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Adaptive bitrate: hls.js consumes the master playlist and switches renditions
  // in place; Safari/iOS falls back to native HLS with the same source.
  const { settings } = useSettings();
  const hls = useHlsAttach(mediaRef, playing ? src : null, playing, settings);
  // Autoplay preference: start once when the player opens with a playable source.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (autoStarted.current || !settings.autoplayPlayback || !src || playing) return;
    autoStarted.current = true;
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.autoplayPlayback, src]);

  const start = () => {
    if (!src) {
      setError("This title is not available to play yet.");
      return;
    }
    setError(null);
    setPlaying(true);
    requestAnimationFrame(() => {
      const media = mediaRef.current;
      if (!media) return;
      media.muted = false;
      media.play().catch(() => {
        media.muted = true;
        setMuted(true);
        media.play().catch((cause: unknown) => setError(cause instanceof Error && cause.name === "NotSupportedError" ? "Playback unavailable. Please try again shortly." : "Tap play in the controls to start playback."));
      });
    });
  };

  const toggleMute = () => {
    const m = mediaRef.current;
    if (!m) return;
    m.muted = !m.muted;
    setMuted(m.muted);
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-border bg-background ${className ?? "aspect-video"}`}>
      {poster && (
        <img
          src={poster}
          alt=""
          className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ${
            playing ? (kind === "audio" ? "opacity-40 blur-sm scale-110" : "opacity-0") : "opacity-60"
          }`}
        />
      )}
      {!playing && <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />}

      {playing && kind === "video" && (
        <>
          <video
            ref={(el) => { mediaRef.current = el; }}
            playsInline
            controls
            autoPlay
            onTimeUpdate={saveProgress}
            onPause={saveProgress}
            onEnded={saveProgress}
            onError={() => setError("Playback unavailable. Please try again shortly.")}
            controlsList="nodownload noplaybackrate"
            onContextMenu={(e) => e.preventDefault()}
            className="absolute inset-0 size-full object-contain bg-background"
          />
          <div className="absolute bottom-14 right-3 z-20">
            <QualityMenu controller={hls} />
          </div>

        </>
      )}
      {playing && kind === "audio" && (
        <audio ref={(el) => { mediaRef.current = el; }} autoPlay onTimeUpdate={saveProgress} onPause={saveProgress} onEnded={saveProgress} onError={() => setError("Audio unavailable. Please try again shortly.")} className="hidden" />
      )}

      {!playing && (
        <Button variant="ghost" onClick={start} className="absolute inset-0 size-full grid place-items-center group hover:bg-transparent" aria-label={ariaPlayLabel}>
          <div
            className="size-[46px] lg:size-[92px] rounded-full bg-foreground/95 grid place-items-center transition group-hover:scale-110"
            style={{
              boxShadow:
                "0 0 0 4px oklch(0.55 0.22 25 / 0.35), 0 0 30px oklch(0.55 0.22 25 / 0.55), 0 0 70px oklch(0.55 0.22 25 / 0.25)",
            }}
          >
            {kind === "audio" ? (
              <Mic className="size-4 lg:size-8 text-background" />
            ) : (
              <Play className="size-4 lg:size-8 text-background fill-current ml-0.5 lg:ml-1" strokeWidth={2.5} />
            )}
          </div>
        </Button>
      )}

      {playing && kind === "audio" && (
        <div className="absolute inset-0 grid place-items-center">
          <Button variant="ghost"
            onClick={toggleMute}
            className="size-16 rounded-full bg-foreground/95 grid place-items-center hover:scale-105 transition"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="size-6 text-background" /> : <Volume2 className="size-6 text-background" />}
          </Button>
        </div>
      )}

      {!playing && posterOverlayLabel && (
        <div className="absolute bottom-0 inset-x-0 p-4 lg:p-6 pointer-events-none">
          <div className="text-xs text-foreground/70 uppercase tracking-wider">Preview</div>
          <div className="font-semibold text-foreground truncate">{posterOverlayLabel}</div>
        </div>
      )}

      {error && (
        <div role="alert" className="absolute bottom-3 inset-x-3 text-center px-3 py-2 rounded bg-background/80 text-xs text-foreground">
          {error}
        </div>
      )}
    </div>
  );
}
