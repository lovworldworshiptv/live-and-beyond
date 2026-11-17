export const NEXT_PLAY_SECONDS = 5;

/** Use the published catalogue order, preferring the current category; never repeat itself. */
export function nextOnDemand<T extends { id: string; category: string; streamUrl?: string | null }>(current: T, titles: T[], playable: (url: string) => boolean): T | undefined {
  const candidates = titles.filter((t) => t.id !== current.id && t.streamUrl && playable(t.streamUrl));
  const sameCategory = candidates.filter((t) => t.category === current.category);
  const pool = sameCategory.length ? sameCategory : candidates;
  const index = titles.findIndex((t) => t.id === current.id);
  return pool.find((t) => titles.indexOf(t) > index) ?? pool[0];
}

export function startNextCountdown(onCount: (seconds: number) => void, onComplete: () => void) {
  let remaining = NEXT_PLAY_SECONDS;
  onCount(remaining);
  const timer = setInterval(() => {
    remaining -= 1;
    if (remaining === 0) { clearInterval(timer); onComplete(); }
    else onCount(remaining);
  }, 1000);
  return () => clearInterval(timer);
}