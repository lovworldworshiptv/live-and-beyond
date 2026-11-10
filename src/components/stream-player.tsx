import { useEffect, useRef, useState } from "react";
import { Play, Volume2, VolumeX, Mic, ExternalLink } from "lucide-react";
import { useHlsAttach } from "@/hooks/use-hls";
import { Button } from "@/components/ui/button";
import { useProgress, useSettings } from "@/lib/personal";
import { QualityMenu } from "@/components/quality-menu";
import { usePlayerFullscreen } from "@/components/player-fullscreen";
import { MovieArtwork } from "./movie-artwork";
import { recordPlaybackEvent } from "@/lib/analytics";
import { createOnDemandStartTracker } from "@/lib/on-demand-start";
import { resolveVideoSource } from "@/lib/video-source";
import { pauseAllMedia, pauseOtherMedia, registerMediaElement } from "@/lib/media-playback";
import { YoutubePlayer } from "./youtube-player";

type Props = {
  src?: string | null;
  titleId?: string;
  analyticsTitleId?: string;
  analyticsChannelId?: string | null;
  poster?: string | null;
  posterFallback?: string | null;
  kind?: "video" | "audio";
  autoPlay?: boolean;
  className?: string;
  posterOverlayLabel?: string;
  ariaPlayLabel?: string;
};

export function StreamPlayer({
  src,
  titleId,
  analyticsTitleId,
  analyticsChannelId,
  poster,
  posterFallback,
  kind = "video",
  autoPlay = false,
  className,
  posterOverlayLabel,
  ariaPlayLabel = "Play",
}: Props) {
  const { setProgress } = useProgress();
  const source = resolveVideoSource(src);
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
  const trackStart = useRef<(() => void) | null>(null);
  useEffect(() => {
    trackStart.current = createOnDemandStartTracker(() => {
      if (!analyticsTitleId) return;
      void recordPlaybackEvent({ titleId: analyticsTitleId, channelId: analyticsChannelId, service: kind === "audio" ? "podcast" : "vod", event: "start" });
    });
  }, [analyticsTitleId, analyticsChannelId, kind, src]);

  // Adaptive bitrate: hls.js consumes the master playlist and switches renditions
  // in place; Safari/iOS falls back to native HLS with the same source.
  const { settings } = useSettings();
  const failPlayback = (message: string) => { setError(message); setPlaying(false); };
  const hls = useHlsAttach(mediaRef, playing && source.type === "media" ? source.url : null, playing, settings, failPlayback);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const fs = usePlayerFullscreen(frameRef, mediaRef, playing && kind === "video");
  // Autoplay preference: start once when the player opens with a playable source.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (autoStarted.current || !settings.autoplayPlayback || !src || playing) return;
    autoStarted.current = true;
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.autoplayPlayback, src]);

  const start = () => {
    if (source.type === "invalid") {
      setError("This title needs a valid video or provider link to play.");
      return;
    }
    // Last action wins: starting this video stops live TV and radio.
    pauseAllMedia();
    setError(null);
    setMuted(false);
    setPlaying(true);
  };

  // Register the media element so live TV or radio starting elsewhere pauses this video.
  useEffect(() => {
    const media = playing ? mediaRef.current : null;
    if (!media) return;
    return registerMediaElement(media);
  }, [playing]);

  const toggleMute = () => {
    const m = mediaRef.current;
    if (!m) return;
    m.muted = !m.muted;
    setMuted(m.muted);
  };

  return (
    <div ref={frameRef} data-protected-player data-video-player={kind === "video" || undefined} data-idle={fs.idle || undefined} className={`relative rounded-lg overflow-hidden border border-border bg-background ${className ?? "aspect-video"}`}>
      {poster && (
        <MovieArtwork
          src={poster}
          fallbackSrc={posterFallback}
          alt=""
          className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ${
            playing ? (kind === "audio" ? "opacity-40 blur-sm scale-110" : "opacity-0") : "opacity-60"
          }`}
        />
      )}
      {!playing && <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />}

      {playing && source.type === "youtube" && source.id && (
        <YoutubePlayer id={source.id} start={source.start} onPlaying={() => trackStart.current?.()} onError={failPlayback}
          onProgress={(time, duration) => { if (titleId && Number.isFinite(duration) && duration > 0 && time > 0) setProgress(titleId, Math.min(100, time / duration * 100)); }} />
      )}
      {playing && source.type === "embed" && (
        <iframe src={source.url} title="Cloud video player" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" className="absolute inset-0 size-full border-0" />
      )}
      {playing && kind === "video" && source.type === "media" && (
        <>
          <video
            ref={(el) => { mediaRef.current = el; }}
            playsInline
            controls
            autoPlay
            onPlaying={() => { if (mediaRef.current) pauseOtherMedia(mediaRef.current); trackStart.current?.(); }}
            onTimeUpdate={saveProgress}
            onPause={saveProgress}
            onEnded={saveProgress}
            onVolumeChange={() => setMuted(mediaRef.current?.muted ?? false)}
            onError={() => failPlayback("Playback unavailable. Tap play to retry.")}
            controlsList="nodownload noplaybackrate"
            onContextMenu={(e) => e.preventDefault()}
            onDoubleClick={(e) => { e.preventDefault(); fs.toggle(); }}
            className="absolute inset-0 size-full object-contain bg-background"
          />
          <div className="player-overlay-controls absolute bottom-14 right-3 z-20 flex items-center gap-2">
            <QualityMenu controller={hls} />
          </div>
        </>
      )}
      {playing && kind === "audio" && source.type === "media" && (
        <audio ref={(el) => { mediaRef.current = el; }} autoPlay controls onVolumeChange={() => setMuted(mediaRef.current?.muted ?? false)} onPlaying={() => trackStart.current?.()} onTimeUpdate={saveProgress} onPause={saveProgress} onEnded={saveProgress} onError={() => failPlayback("Audio unavailable. Tap play to retry.")} className="absolute bottom-3 inset-x-3 z-10 w-[calc(100%-1.5rem)]" />
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

      {playing && kind === "audio" && source.type === "media" && (
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

      {!playing && !error && posterOverlayLabel && (
        <div className="absolute bottom-0 inset-x-0 p-4 lg:p-6 pointer-events-none">
          <div className="text-xs text-foreground/70 uppercase tracking-wider">Preview</div>
          <div className="font-semibold text-foreground truncate">{posterOverlayLabel}</div>
        </div>
      )}

      {error && (
        <div role="alert" className="absolute bottom-3 inset-x-3 text-center px-3 py-2 rounded bg-background/80 text-xs text-foreground">
          <p>{error}</p>
          {source.type === "youtube" && source.id && (
            <Button asChild variant="link" size="sm" className="mt-1 text-accent">
              <a href={`https://www.youtube.com/watch?v=${source.id}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-3.5" /> Open YouTube</a>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
