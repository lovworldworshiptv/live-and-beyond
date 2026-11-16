export type FreshOverride = "auto" | "on" | "off";
export const FRESH_WINDOW_DAYS = 14;

/** Music titles are Fresh for 14 days after publishing unless a manager forces the tag on or off. */
export function isFresh(t: { kind: string; publishedAt?: string; freshOverride?: FreshOverride }, now = Date.now()) {
  if (t.freshOverride === "on") return true;
  if (t.freshOverride === "off") return false;
  if (t.kind.toLowerCase() !== "music" || !t.publishedAt) return false;
  const age = now - new Date(t.publishedAt).getTime();
  return age >= 0 && age < FRESH_WINDOW_DAYS * 86_400_000;
}
