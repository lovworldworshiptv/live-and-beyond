import type { Title } from "./catalog";

export type OnDemandRanking = { slug: string; plays: number };

/** Keep the database's platform-wide order; never fill with editorial picks. */
export function selectFeaturedOnDemand(titles: Title[], rankings: OnDemandRanking[]): Title[] {
  const bySlug = new Map(titles.map((title) => [title.id, title]));
  const seen = new Set<string>();
  return rankings.flatMap(({ slug, plays }) => {
    const title = bySlug.get(slug);
    if (!title || plays <= 0 || seen.has(slug) || !["Film", "Series", "Podcast"].includes(title.kind)) return [];
    seen.add(slug);
    return [title];
  }).slice(0, 12);
}
/** Always #1 on Trending by editorial decision; it is excluded from the play-count ranking. */
export const TRENDING_PINNED_SLUG = "sister-wisdom-in-the-name-of-jesus-60b417";

/** Trending: pinned title at #1, then most played on-demand titles (any kind) across all channels. */
export function selectTrendingOnDemand(titles: Title[], rankings: OnDemandRanking[], pinned = TRENDING_PINNED_SLUG): Title[] {
  const bySlug = new Map(titles.map((title) => [title.id, title]));
  const pin = bySlug.get(pinned);
  const seen = new Set<string>(pin ? [pinned] : []);
  if (pin) return [pin, ...rankings.flatMap(({ slug, plays }) => {
    const title = bySlug.get(slug);
    if (!title || Number(plays) <= 0 || seen.has(slug)) return [];
    seen.add(slug);
    return [title];
  })].slice(0, 10);
  return rankings.flatMap(({ slug, plays }) => {
    const title = bySlug.get(slug);
    if (!title || Number(plays) <= 0 || seen.has(slug)) return [];
    seen.add(slug);
    return [title];
  }).slice(0, 10);
}
