/** Start after a source is attached; only autoplay policy failures need muted retry. */
export async function startMediaPlayback(media: HTMLMediaElement) {
  try {
    await media.play();
  } catch (error) {
    if (!(error instanceof Error) || error.name !== "NotAllowedError" || media.muted) throw error;
    media.muted = true;
    await media.play();
  }
}