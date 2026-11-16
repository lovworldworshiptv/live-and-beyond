import { describe, expect, it } from "vitest";
import type { Title } from "./catalog";
import { selectFeaturedOnDemand } from "./featured-on-demand";

const title = (id: string, kind: Title["kind"], featured = false): Title => ({
  id, title: id, kind, featured, synopsis: "", cover: "", hero: "", category: "", year: 2026, rating: "TV-PG", duration: "",
});

it("ranks movies, podcasts and series by actual platform-wide plays, not the featured flag", () => {
  const titles = [title("editor-pick", "Film", true), title("movie", "Film"), title("podcast", "Podcast"), title("series", "Series")];
  expect(selectFeaturedOnDemand(titles, [{ slug: "podcast", plays: 30 }, { slug: "series", plays: 20 }, { slug: "movie", plays: 10 }]).map(t => t.id)).toEqual(["podcast", "series", "movie"]);
});
it("does not fill an empty most-watched list with unplayed featured content", () => {
  expect(selectFeaturedOnDemand([title("editor-pick", "Film", true)], [])).toEqual([]);
});
it("only includes available published catalogue titles and the requested content kinds", () => {
  expect(selectFeaturedOnDemand([title("concert", "Concert"), title("movie", "Film")], [{ slug: "missing", plays: 50 }, { slug: "concert", plays: 40 }, { slug: "movie", plays: 0 }])).toEqual([]);
});
it("deduplicates the shelf", () => {
  expect(selectFeaturedOnDemand([title("movie", "Film")], [{ slug: "movie", plays: 10 }, { slug: "movie", plays: 10 }])).toHaveLength(1);
});
import { selectTrendingOnDemand } from "./featured-on-demand";
describe("selectTrendingOnDemand", () => {
  it("keeps play order, includes music, drops unknown/zero/duplicates, caps at 10", () => {
    const mk = (id: string, kind: string) => ({ id, kind }) as never;
    const titles = [mk("a", "Film"), mk("b", "Music"), mk("c", "Series")];
    const r = selectTrendingOnDemand(titles, [
      { slug: "b", plays: 9 }, { slug: "x", plays: 8 }, { slug: "a", plays: 5 }, { slug: "b", plays: 2 }, { slug: "c", plays: 0 },
    ], "none");
    expect(r.map((t: { id: string }) => t.id)).toEqual(["b", "a"]);
  });
  it("keeps the pinned title at #1 and ranks the rest by plays", () => {
    const mk = (id: string, kind: string) => ({ id, kind }) as never;
    const titles = [mk("a", "Film"), mk("b", "Music"), mk("jesus", "Music")];
    const r = selectTrendingOnDemand(titles, [{ slug: "b", plays: 9 }, { slug: "jesus", plays: 1 }, { slug: "a", plays: 5 }], "jesus");
    expect(r.map((t: { id: string }) => t.id)).toEqual(["jesus", "b", "a"]);
  });
});
