import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

function catalog() {
  const window: any = { LETT_CONFIG: {} };
  runInNewContext(readFileSync("public/tv/js/api.js", "utf8"), {
    window, U: { store: { get: (_: string, fallback: unknown) => fallback }, uuid: () => "test" },
  });
  return window.Api.Catalog;
}

describe("TV viewer catalogue rules", () => {
  it("combines published channel uploads and curated links without duplicating titles", () => {
    const c = catalog();
    c.data.titles = [{ slug: "music", channelId: "channel-a" }, { slug: "linked", channelId: "channel-b" }, { slug: "other", channelId: "channel-b" }];
    expect(c.library({ id: "channel-a", videoLibrary: ["music", "linked"], podcastLibrary: [], featured: [] }).map((t: any) => t.slug)).toEqual(["music", "linked"]);
  });
  it("uses genres for musical libraries and content kinds for category mode", () => {
    const c = catalog();
    const titles = [{ rawKind: "music", category: "Gospel" }, { rawKind: "podcast", category: "Worship" }];
    expect(Array.from(c.filterOptions(titles, "genres"))).toEqual(["All", "Gospel", "Worship"]);
    expect(Array.from(c.filterOptions(titles, "categories"))).toEqual(["All", "music", "podcast"]);
    expect(c.matchesFilter(titles[0], "genres", "Gospel")).toBe(true);
    expect(c.matchesFilter(titles[1], "genres", "Gospel")).toBe(false);
  });
  it("ranks only watched movies, podcasts and series across channels", () => {
    const c = catalog();
    c.data.titles = [{ slug: "series", rawKind: "series" }, { slug: "podcast", rawKind: "podcast" }, { slug: "music", rawKind: "music" }];
    c.data.rankings = [{ slug: "podcast", plays: 20 }, { slug: "series", plays: 10 }, { slug: "music", plays: 9 }, { slug: "series", plays: 5 }];
    expect(c.featured().map((t: any) => t.slug)).toEqual(["podcast", "series"]);
  });
});