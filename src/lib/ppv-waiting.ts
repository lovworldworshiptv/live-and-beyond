export function remainingPpvWait(startsAt: string, serverNow: string, elapsedMs: number) {
  return Math.max(0, Date.parse(startsAt) - Date.parse(serverNow) - elapsedMs);
}
export function formatPpvCountdown(ms: number) {
  const seconds = Math.ceil(ms / 1000);
  return `${Math.floor(seconds / 3600).toString().padStart(2, "0")}:${Math.floor(seconds / 60 % 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}