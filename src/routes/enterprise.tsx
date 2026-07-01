import { createFileRoute } from "@tanstack/react-router";
import {
  Building2,
  ShieldCheck,
  Globe,
  Server,
  Zap,
  Users,
  Check,
  ArrowRight,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/enterprise")({
  head: () => ({
    meta: [
      { title: "Enterprise Services — Lettflix" },
      {
        name: "description",
        content:
          "White-label OTT, hotel & hospitality streaming, church campuses, universities and broadcaster partnerships on Lettflix infrastructure.",
      },
    ],
  }),
  component: EnterprisePage,
});

const capabilities = [
  {
    icon: Server,
    title: "Broadcast-grade streaming",
    desc: "Sub-second latency, 4K HDR delivery, adaptive bitrates and 99.99% SLA.",
  },
  {
    icon: Globe,
    title: "Global CDN",
    desc: "Edge nodes across 6 continents. Region-locked delivery and geo-analytics built in.",
  },
  {
    icon: ShieldCheck,
    title: "DRM & security",
    desc: "Widevine, PlayReady, FairPlay, forensic watermarking, SSO & SCIM.",
  },
  {
    icon: Zap,
    title: "Real-time analytics",
    desc: "QoS metrics, per-title revenue attribution, cohort retention out of the box.",
  },
  {
    icon: Users,
    title: "Multi-tenant portals",
    desc: "Branded channel portals for creators, campuses, or partner broadcasters.",
  },
  {
    icon: Building2,
    title: "White-label OTT",
    desc: "Ship your own branded app on iOS, Android, tvOS, Roku and web — powered by Lettflix.",
  },
];

const verticals = [
  {
    name: "Faith organisations",
    desc: "Multi-campus live streaming, giving integrations, sermon libraries and community rooms.",
    kpi: "220+ deployments",
  },
  {
    name: "Hospitality",
    desc: "In-room broadcast portals for hotels, resorts and airlines. Room-level analytics.",
    kpi: "78K rooms live",
  },
  {
    name: "Education",
    desc: "Campus TV, lecture VOD, event streaming and student-created channels.",
    kpi: "42 universities",
  },
  {
    name: "Broadcasters",
    desc: "Turn linear channels into interactive OTT experiences with EPG, catch-up and monetisation.",
    kpi: "16 networks",
  },
];

const plans = [
  {
    name: "Studio",
    price: "$499",
    tag: "Creators & small networks",
    features: [
      "Up to 5 channels",
      "1M streaming minutes / mo",
      "Standard DRM & analytics",
      "Email support",
    ],
  },
  {
    name: "Broadcast",
    price: "$2,400",
    tag: "Mid-market",
    featured: true,
    features: [
      "Up to 25 channels",
      "10M streaming minutes / mo",
      "SSO / SCIM / advanced DRM",
      "Priority 24/7 support",
      "Custom branded apps",
    ],
  },
  {
    name: "Network",
    price: "Custom",
    tag: "Enterprise & telcos",
    features: [
      "Unlimited channels",
      "Volume streaming discounts",
      "Dedicated infrastructure",
      "White-glove onboarding",
      "SLA 99.99% + credits",
    ],
  },
];

function EnterprisePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Hero */}
      <section className="relative border-b border-border overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&auto=format&fit=crop"
            alt=""
            className="size-full object-cover opacity-40"
          />
          <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        </div>
        <div className="mx-auto max-w-[1480px] px-6 lg:px-10 pt-16 pb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-elevated/70 border border-border text-xs font-medium">
            <Building2 className="size-3.5 text-accent" /> Lettflix for Business
          </div>
          <h1 className="mt-5 text-4xl lg:text-6xl font-extrabold tracking-tight max-w-4xl">
            Broadcast infrastructure for the next generation of networks
          </h1>
          <p className="mt-5 text-lg text-[color:var(--secondary-foreground)] max-w-2xl">
            Deploy your own live TV, VOD library and creator portal on the same
            stack that powers Lettflix. White-label ready, revenue-share optional.
          </p>
          <div className="mt-7 flex gap-3 flex-wrap">
            <a
              href="mailto:enterprise@lettflix.com"
              className="h-12 px-6 rounded-md bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition inline-flex items-center gap-2"
            >
              Talk to sales <ArrowRight className="size-4" />
            </a>
            <a
              href="#plans"
              className="h-12 px-6 rounded-md bg-elevated/70 backdrop-blur border border-border font-medium hover:bg-elevated transition"
            >
              See partner tiers
            </a>
          </div>

          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl">
            {[
              ["220+", "Enterprise deployments"],
              ["6", "Continents served"],
              ["99.99%", "Uptime SLA"],
              ["18M", "Streaming hours / mo"],
            ].map(([v, l]) => (
              <div key={l}>
                <div className="text-3xl font-bold tracking-tight">{v}</div>
                <div className="text-xs uppercase tracking-widest text-[color:var(--muted-foreground)] mt-1">
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-14">
        <div className="mb-8">
          <div className="text-[11px] uppercase tracking-widest text-accent font-semibold">
            Platform
          </div>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">
            Everything a broadcaster needs, in one API
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-border bg-elevated/40 p-6 hover:border-accent/40 transition"
            >
              <div className="size-10 rounded-lg bg-accent/10 grid place-items-center">
                <c.icon className="size-5 text-accent" />
              </div>
              <div className="mt-4 font-semibold text-lg">{c.title}</div>
              <div className="mt-1 text-sm text-[color:var(--secondary-foreground)]">
                {c.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Verticals */}
      <section className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-14">
        <div className="mb-8">
          <div className="text-[11px] uppercase tracking-widest text-accent font-semibold">
            Industries
          </div>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">
            Purpose-built for your vertical
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {verticals.map((v) => (
            <div
              key={v.name}
              className="rounded-2xl border border-border bg-elevated/40 p-6 flex items-start gap-4"
            >
              <div className="flex-1">
                <div className="font-semibold text-lg">{v.name}</div>
                <div className="text-sm text-[color:var(--secondary-foreground)] mt-1">
                  {v.desc}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-widest text-[color:var(--muted-foreground)]">
                  Live
                </div>
                <div className="font-semibold text-accent">{v.kpi}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-14 mb-16">
        <div className="mb-8">
          <div className="text-[11px] uppercase tracking-widest text-accent font-semibold">
            Pricing
          </div>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">
            Partner tiers
          </h2>
          <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
            Pay for infrastructure, share revenue on distribution. Every tier
            includes performance-based creator payouts.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl p-6 flex flex-col transition ${
                p.featured
                  ? "border-2 border-accent bg-accent/5 shadow-[var(--shadow-glow)]"
                  : "border border-border bg-elevated/40"
              }`}
            >
              {p.featured && (
                <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-widest">
                  Most popular
                </div>
              )}
              <div className="text-sm text-[color:var(--muted-foreground)]">{p.tag}</div>
              <div className="mt-1 text-2xl font-bold">{p.name}</div>
              <div className="mt-3 text-4xl font-extrabold tracking-tight">
                {p.price}
                {p.price !== "Custom" && (
                  <span className="text-base font-normal text-[color:var(--muted-foreground)]">
                    /mo
                  </span>
                )}
              </div>
              <ul className="mt-5 space-y-2 flex-1">
                {p.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-sm text-[color:var(--secondary-foreground)]"
                  >
                    <Check className="size-4 text-accent shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:enterprise@lettflix.com"
                className={`mt-6 h-11 rounded-md font-semibold text-sm inline-flex items-center justify-center transition ${
                  p.featured
                    ? "bg-accent text-accent-foreground hover:bg-accent/90"
                    : "bg-surface border border-border hover:bg-elevated"
                }`}
              >
                Contact sales
              </a>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
