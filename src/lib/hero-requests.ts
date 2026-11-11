import type { HeroConfig, HeroSlide } from "./homepage-defaults";

export type HeroRequestKind = "movie" | "series" | "show" | "podcast" | "music" | "upcoming";
export type HeroRequest = {
  id: string;
  channel_id: string;
  content_kind: HeroRequestKind;
  title: string;
  description: string | null;
  content_slug: string | null;
  image_url: string | null;
  starts_at: string | null;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  created_at: string;
};

export const HERO_REQUEST_KINDS: { value: HeroRequestKind; label: string }[] = [
  { value: "movie", label: "Movie" },
  { value: "series", label: "Series" },
  { value: "show", label: "Show" },
  { value: "podcast", label: "Podcast" },
  { value: "music", label: "Music" },
  { value: "upcoming", label: "Upcoming show" },
];

/** Turns an approved channel request into a homepage hero slide. */
export function heroSlideFromRequest(req: HeroRequest, channelName: string): HeroSlide {
  const upcoming = req.content_kind === "upcoming";
  const when = req.starts_at ? new Date(req.starts_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "";
  const label = HERO_REQUEST_KINDS.find(k => k.value === req.content_kind)?.label ?? "Featured";
  return {
    visible: true,
    imageUrl: req.image_url,
    badge: upcoming ? "Coming Up" : label,
    badgeMeta: channelName,
    title: req.title,
    description: req.description ?? "",
    meta: [label, channelName, when].filter(Boolean).join(" · "),
    contentId: req.content_slug ?? undefined,
    primaryCta: { label: upcoming ? "View Channel" : "Watch Now", to: "" },
    secondaryCta: { label: "More Info", to: "" },
  };
}

/** Adds the slide to the front of the hero carousel without removing existing slides. */
export function addSlideToHero(hero: HeroConfig, slide: HeroSlide): HeroConfig {
  return { ...hero, slides: [slide, ...(hero.slides ?? [])] };
}
