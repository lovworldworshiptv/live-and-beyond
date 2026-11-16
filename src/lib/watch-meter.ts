/** Accumulates real watched seconds from playhead positions; seeks and stalls are ignored. */
export function createWatchMeter(flush: (seconds: number) => void, flushEvery = 15, maxStep = 10) {
  let last: number | null = null;
  let pending = 0;
  const emit = () => { const s = Math.round(pending); if (s > 0) { pending -= s; flush(s); } };
  return {
    tick(position: number) {
      if (last !== null) {
        const step = position - last;
        if (step > 0 && step <= maxStep) pending += step;
      }
      last = position;
      if (pending >= flushEvery) emit();
    },
    pause() { last = null; emit(); },
  };
}

/** YouTube-style view rule: one view per viewer per target per day once 30+ seconds are watched. */
export const VIEW_MIN_SECONDS = 30;
export function countsAsView(secondsWatched: number) { return secondsWatched >= VIEW_MIN_SECONDS; }
