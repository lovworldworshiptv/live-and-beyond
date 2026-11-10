/** Every media element currently managed by the app (live TV, radio, on-demand). */
const activeMedia = new Set<HTMLMediaElement>();

/** Register a player so starting any other player pauses it. Returns an unregister function. */
export function registerMediaElement(media: HTMLMediaElement) {
  activeMedia.add(media);
  return () => { activeMedia.delete(media); };
}

/** Pause every registered player (used when a non-media player such as an embed starts). */
export function pauseAllMedia() {
  for (const media of activeMedia) {
    if (!media.paused) media.pause();
  }
}

/** Pause every other registered player — the viewer's last action takes preeminence. */
export function pauseOtherMedia(except: HTMLMediaElement) {
  for (const media of activeMedia) {
    if (media !== except && !media.paused) media.pause();
  }
}

/** Start after a source is attached; only autoplay policy failures need muted retry. */
export async function startMediaPlayback(media: HTMLMediaElement) {
  pauseOtherMedia(media);
  try {
    await media.play();
  } catch (error) {
    if (!(error instanceof Error) || error.name !== "NotAllowedError" || media.muted) throw error;
    media.muted = true;
    await media.play();
  }
}