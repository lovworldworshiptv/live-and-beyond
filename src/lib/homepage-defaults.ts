export type NavItem = { label: string; to: string };
export type NavConfig = { items: NavItem[] };

export type HeroCta = { label: string; to: string };
export type HeroStat = { k: string; v: string };
export type HeroConfig = {
  badge: string;
  badgeMeta: string;
  title: string;
  titleAccent: string;
  description: string;
  primaryCta: HeroCta;
  secondaryCta: HeroCta;
  tertiaryCta: HeroCta;
  stats: HeroStat[];
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
    { label: "On Demand", to: "/on-demand" },
    { label: "Pricing", to: "/pricing" },
  ],
};

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
        { label: "On Demand", href: "/on-demand" },
        { label: "Radio", href: "/channels" },
        { label: "Podcasts", href: "/on-demand" },
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
