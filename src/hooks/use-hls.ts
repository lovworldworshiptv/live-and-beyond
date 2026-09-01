import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";

export type QualityLevel = {
  /** hls.js level index */
  index: number;
  height: number | null;
  bitrate: number;
  label: string;
};

export type HlsController = {
  /** Renditions advertised by the HLS master playlist (empty on native playback). */
  levels: QualityLevel[];
  /** -1 = Auto */
  selected: number;
  /** Level currently rendering (useful to annotate "Auto (720p)"). */
  active: number;
  setLevel: (index: number) => void;
  /** True when the browser plays HLS natively (Safari/iOS) — ABR is handled by the OS. */
  native: boolean;
};

function labelFor(height: number | null, bitrate: number) {
  if (height) return `${height}p`;
  return `${Math.round(bitrate / 1000)} kbps`;
}

export function useHlsAttach(
  mediaRef: React.MutableRefObject<HTMLVideoElement | HTMLAudioElement | null>,
  src: string | undefined | null,
  playing: boolean,
): HlsController {
  const hlsRef = useRef<Hls | null>(null);
  const [levels, setLevels] = useState<QualityLevel[]>([]);
  const [selected, setSelected] = useState(-1);
  const [active, setActive] = useState(-1);
  const [native, setNative] = useState(false);

  useEffect(() => {
    if (!playing || !src) return;
    const media = mediaRef.current;
    if (!media) return;
    const isHls = /\.m3u8(\?|$)/i.test(src);
    const canNative = Boolean(media.canPlayType("application/vnd.apple.mpegurl"));
    let hls: Hls | null = null;
    setLevels([]);
    setSelected(-1);
    setActive(-1);
    setNative(false);

    if (isHls && media instanceof HTMLVideoElement && !canNative && Hls.isSupported()) {
      // Adaptive bitrate: start on Auto and let hls.js switch renditions in-place.
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        capLevelToPlayerSize: false,
        startLevel: -1,
        backBufferLength: 30,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(media);
      const publish = () => {
        const list = (hls?.levels ?? []).map((l, i) => ({
          index: i,
          height: l.height || null,
          bitrate: l.bitrate,
          label: labelFor(l.height || null, l.bitrate),
        }));
        // Highest quality first, de-duplicated by label.
        const seen = new Set<string>();
        setLevels(
          list
            .sort((a, b) => (b.height ?? 0) - (a.height ?? 0) || b.bitrate - a.bitrate)
            .filter((l) => (seen.has(l.label) ? false : (seen.add(l.label), true))),
        );
      };
      hls.on(Hls.Events.MANIFEST_PARSED, publish);
      hls.on(Hls.Events.LEVEL_UPDATED, publish);
      hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => setActive(data.level));
    } else {
      setNative(isHls && canNative);
      if (media.src !== src) {
        media.src = src;
        media.load();
      }
    }

    return () => {
      if (hls) hls.destroy();
      hlsRef.current = null;
    };
  }, [playing, src, mediaRef]);

  const setLevel = useCallback((index: number) => {
    setSelected(index);
    const hls = hlsRef.current;
    if (!hls) return;
    // -1 restores Auto; switching this way never restarts playback.
    hls.nextLevel = index;
    hls.currentLevel = index;
  }, []);

  return { levels, selected, active, setLevel, native };
}
