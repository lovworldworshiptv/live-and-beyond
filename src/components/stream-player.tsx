import { useRef, useState } from "react";
import { Play, Volume2, VolumeX, Mic } from "lucide-react";
import { useHlsAttach } from "@/hooks/use-hls";
import { QualityMenu } from "@/components/quality-menu";

type Props = {
  src?: string | null;
  poster?: string | null;
  kind?: "video" | "audio";
  autoPlay?: boolean;
  className?: string;
  posterOverlayLabel?: string;
  ariaPlayLabel?: string;
};

export function StreamPlayer({
  src,
  poster,
  kind = "video",
  autoPlay = false,
  className,
  posterOverlayLabel,
  ariaPlayLabel = "Play",
}: Props) {
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(autoPlay);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Adaptive bitrate: hls.js consumes the master playlist and switches renditions
  // in place; Safari/iOS falls back to native HLS with the same source.
  const hls = useHlsAttach(mediaRef, playing ? src : null, playing);

  const start = () => {
    if (!src) {
      setError("No stream source configured.");
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
        media.play().catch(() => setError("Playback blocked. Tap play in the controls."));
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
    <div className={`relative rounded-2xl overflow-hidden border border-border bg-black ${className ?? "aspect-video"}`}>
      {poster && (
        <img
          src={poster}
          alt=""
          className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ${
            playing ? (kind === "audio" ? "opacity-40 blur-sm scale-110" : "opacity-0") : "opacity-60"
          }`}
        />
      )}
      {!playing && <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />}

      {playing && kind === "video" && (
        <>
          <video
            ref={(el) => { mediaRef.current = el; }}
            playsInline
            controls
            autoPlay
            controlsList="nodownload noplaybackrate"
            onContextMenu={(e) => e.preventDefault()}
            className="absolute inset-0 size-full object-contain bg-black"
          />
          <div className="absolute bottom-16 right-4 z-10">
            <QualityMenu controller={hls} />
          </div>
        </>
      )}
      {playing && kind === "audio" && (
        <audio ref={(el) => { mediaRef.current = el; }} autoPlay className="hidden" />
      )}

      {!playing && (
        <button onClick={start} className="absolute inset-0 grid place-items-center group" aria-label={ariaPlayLabel}>
          <div
            className="size-[46px] lg:size-[92px] rounded-full bg-white/95 grid place-items-center transition group-hover:scale-110"
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
        </button>
      )}

      {playing && kind === "audio" && (
        <div className="absolute inset-0 grid place-items-center">
          <button
            onClick={toggleMute}
            className="size-16 rounded-full bg-white/95 grid place-items-center hover:scale-105 transition"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="size-6 text-background" /> : <Volume2 className="size-6 text-background" />}
          </button>
        </div>
      )}

      {!playing && posterOverlayLabel && (
        <div className="absolute bottom-0 inset-x-0 p-4 lg:p-6 pointer-events-none">
          <div className="text-xs text-white/70 uppercase tracking-wider">Preview</div>
          <div className="font-semibold text-white truncate">{posterOverlayLabel}</div>
        </div>
      )}

      {error && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded bg-black/80 text-xs text-white">
          {error}
        </div>
      )}
    </div>
  );
}
