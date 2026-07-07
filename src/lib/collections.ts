import type { Title } from "./catalog";
import { titles } from "./catalog";

export type Collection = {
  id: string;
  name: string;
  tagline: string;
  gradient: string;
  accent: string;
  filter: (t: Title) => boolean;
};

export const collections: Collection[] = [
  {
    id: "faith-and-family",
    name: "Faith & Family",
    tagline: "The programming that brings the whole household together.",
    gradient: "linear-gradient(135deg, oklch(0.24 0.59 359.4), oklch(0.36 0.59 359.4))",
    accent: "#650606",
    filter: (t) => t.category === "Christian Living" || t.kind === "Series",
  },
  {
    id: "live-concerts-2026",
    name: "Live Concerts 2026",
    tagline: "Front-row seats to the biggest worship and music nights of the year.",
    gradient: "linear-gradient(135deg, oklch(0.55 0.22 300), oklch(0.45 0.20 220))",
    accent: "#7C3AED",
    filter: (t) => t.kind === "Concert" || t.category === "Music",
  },
  {
    id: "africa-rising",
    name: "Africa Rising",
    tagline: "Documentaries, journalism and events shaping the continent's story.",
    gradient: "linear-gradient(135deg, oklch(0.65 0.20 60), oklch(0.45 0.18 30))",
    accent: "#F59E0B",
    filter: (t) => t.category === "News" || t.category === "Sports",
  },
  {
    id: "founders-and-builders",
    name: "Founders & Builders",
    tagline: "Deep conversations with the people building what's next.",
    gradient: "linear-gradient(135deg, oklch(0.55 0.20 220), oklch(0.35 0.18 260))",
    accent: "#1E5EFF",
    filter: (t) => t.category === "Podcasts",
  },
  {
    id: "matchday-central",
    name: "Matchday Central",
    tagline: "Every kick-off, every replay, every highlight — all in one place.",
    gradient: "linear-gradient(135deg, oklch(0.55 0.20 145), oklch(0.35 0.15 200))",
    accent: "#22C55E",
    filter: (t) => t.category === "Sports",
  },
  {
    id: "the-nightly-encore",
    name: "The Nightly Encore",
    tagline: "Wind-down watching — concerts, sessions and long-form after dark.",
    gradient: "linear-gradient(135deg, oklch(0.35 0.15 280), oklch(0.20 0.12 240))",
    accent: "#6366F1",
    filter: (t) => t.kind === "Concert" || t.kind === "Podcast",
  },
];

export function getCollection(id: string) {
  return collections.find((c) => c.id === id);
}

export function titlesInCollection(id: string) {
  const c = getCollection(id);
  if (!c) return [];
  return titles.filter(c.filter);
}
