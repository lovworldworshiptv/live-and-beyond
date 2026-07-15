import { useEffect } from "react";
import Hls from "hls.js";

export function useHlsAttach(
  mediaRef: React.MutableRefObject<HTMLVideoElement | HTMLAudioElement | null>,
  src: string | undefined | null,
  playing: boolean,
) {
  useEffect(() => {
    if (!playing || !src) return;
    const media = mediaRef.current;
    if (!media) return;
    const isHls = /\.m3u8(\?|$)/i.test(src);
    let hls: Hls | null = null;

    if (isHls && media instanceof HTMLVideoElement && !media.canPlayType("application/vnd.apple.mpegurl") && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(media);
    } else {
      if (media.src !== src) {
        media.src = src;
        media.load();
      }
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [playing, src, mediaRef]);
}
