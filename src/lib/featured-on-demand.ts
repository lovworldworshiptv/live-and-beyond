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