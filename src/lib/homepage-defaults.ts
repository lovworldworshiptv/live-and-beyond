export type NavItem = { label: string; to: string; children?: NavItem[] };
export type NavConfig = { items: NavItem[] };

export type BottomNavItem = { label: string; to: string; icon: string };
export type BottomNavConfig = { items: BottomNavItem[] };

export type HeroCta = { label: string; to: string };
export type HeroStat = { k: string; v: string };
export type HeroSlide = {
  /** When false, the slide is hidden from the homepage carousel. Defaults to visible. */
  visible?: boolean;
  imageUrl?: string | null;
  badge?: string;
  badgeMeta?: string;
  title?: string;
  titleAccent?: string;
  description?: string;
  /** Meta line shown under the title, e.g. "Gritty · Action · Series" */
  meta?: string;
  /** Slug of the linked on-demand title — powers Watch Now / More Info. */
  contentId?: string;
  primaryCta?: HeroCta;
  secondaryCta?: HeroCta;
  tertiaryCta?: HeroCta;
};
export type HeroConfig = {
  badge: string;
  badgeMeta: string;
  title: string;
  titleAccent: string;
  description: string;
  imageUrl?: string | null;
  primaryCta: HeroCta;
  secondaryCta: HeroCta;
  tertiaryCta: HeroCta;
  stats: HeroStat[];
  /** Optional multi-banner autoslide. If empty, hero renders the single legacy image + text. */
  slides?: HeroSlide[];
  /** Auto-rotation interval in milliseconds. */
  intervalMs?: number;
};


export type FooterLink = { label: string; href: string };
export type FooterColumn = { title: string; items: FooterLink[] };
export type FooterConfig = {
  tagline: string;
  copyright: string;
  note: string;
  columns: FooterColumn[];
};

export const defaultNav: NavConfig = {
  items: [
    { label: "Home", to: "/" },
    { label: "Channels", to: "/channels" },
    { label: "Guide", to: "/guide" },
    {
      label: "Browse",
      to: "/movies",
      children: [
        { label: "Movies", to: "/movies" },
        { label: "Series", to: "/series" },
        { label: "Documentaries", to: "/documentaries" },
        { label: "Podcasts", to: "/podcasts" },
      ],
    },
    { label: "Pricing", to: "/pricing" },
  ],
};

export const defaultBottomNav: BottomNavConfig = {
  items: [
    { label: "Home", to: "/", icon: "home" },
    { label: "Channels", to: "/channels", icon: "tv" },
    { label: "Movies", to: "/movies", icon: "film" },
    { label: "Profile", to: "/profile", icon: "user" },
  ],
};

/** Icon keys selectable for bottom nav items in the CMS. */
export const bottomNavIcons = [
  "home",
  "tv",
  "film",
  "user",
  "search",
  "radio",
  "calendar",
  "mic",
  "sparkles",
  "list",
] as const;


export const defaultHero: HeroConfig = {
  badge: "LIVE NOW",
  badgeMeta: "184 channels broadcasting",
  title: "The future of broadcasting,",
  titleAccent: "streaming together.",
  description:
    "Live television, radio, podcasts, events and premium on-demand — discover everything from broadcasters, ministries and creators worldwide. One subscription. One ecosystem.",
  primaryCta: { label: "Watch Live", to: "/channels" },
  secondaryCta: { label: "Browse Channels", to: "/channels" },
  tertiaryCta: { label: "Open Live Guide", to: "/guide" },
  stats: [
    { k: "184", v: "Live channels" },
    { k: "12K+", v: "On-demand titles" },
    { k: "320", v: "Radio stations" },
  ],
  slides: [],
  intervalMs: 6000,
};

export const defaultFooter: FooterConfig = {
  tagline:
    "The future of digital broadcasting. Live channels, radio, podcasts and on-demand entertainment — one subscription, one ecosystem.",
  copyright: "LoveWorld Entertainment Flix. All rights reserved.",
  note: "Made for a borderless broadcast future.",
  columns: [
    {
      title: "Platform",
      items: [
        { label: "Channels", href: "/channels" },
        { label: "Movies", href: "/movies" },
        { label: "Series", href: "/series" },
        { label: "Documentaries", href: "/documentaries" },
        { label: "Radio", href: "/channels" },
        { label: "Podcasts", href: "/podcasts" },
        { label: "Live Guide", href: "/guide" },
      ],
    },
    {
      title: "Creators",
      items: [
        { label: "Become a Partner", href: "/auth" },
        { label: "Creator Portal", href: "/portal" },
        { label: "Channel Portal", href: "/portal" },
        { label: "Analytics", href: "/portal" },
      ],
    },
    {
      title: "Company",
      items: [
        { label: "About", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Press", href: "#" },
        { label: "Contact", href: "#" },
        { label: "Privacy", href: "#" },
      ],
    },
  ],
};
