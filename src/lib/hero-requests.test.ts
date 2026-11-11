import { describe, expect, it } from "vitest";
import { addSlideToHero, heroSlideFromRequest, type HeroRequest } from "./hero-requests";
import { defaultHero } from "./homepage-defaults";

const base: HeroRequest = { id: "1", channel_id: "c", content_kind: "movie", title: "The First Extraction", description: "d", content_slug: "the-first-extrction", image_url: "https://x/y.jpg", starts_at: null, status: "pending", admin_note: null, created_at: "" };

describe("hero requests", () => {
  it("links an approved movie to its title", () => {
    const s = heroSlideFromRequest(base, "Lettflix Movies");
    expect(s.contentId).toBe("the-first-extrction");
    expect(s.primaryCta?.label).toBe("Watch Now");
  });
  it("labels upcoming shows as Coming Up", () => {
    expect(heroSlideFromRequest({ ...base, content_kind: "upcoming" }, "LXP").badge).toBe("Coming Up");
  });
  it("keeps existing hero slides when approving", () => {
    const hero = { ...defaultHero, slides: [{ title: "Old" }] };
    expect(addSlideToHero(hero, { title: "New" }).slides?.map(s => s.title)).toEqual(["New", "Old"]);
  });
});
