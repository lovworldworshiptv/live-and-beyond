import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useState } from "react";
import {
  Check,
  Sparkles,
  Crown,
  Users,
  Zap,
  Tv,
  Radio,
  Download,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Lettflix" },
      {
        name: "description",
        content:
          "One subscription. Live TV, radio, podcasts and premium on-demand from the LoveWorld network. Choose the plan that fits your household.",
      },
      { property: "og:title", content: "Pricing — Lettflix" },
      {
        property: "og:description",
        content:
          "Unified subscription for Live TV, radio, podcasts and premium on-demand. Plans for individuals, families and creators.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

type Plan = {
  id: string;
  name: string;
  tagline: string;
  monthly: number;
  yearly: number;
  icon: typeof Sparkles;
  featured?: boolean;
  cta: string;
  features: string[];
  limits: { label: string; value: string }[];
};

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Sample the network",
    monthly: 0,
    yearly: 0,
    icon: Sparkles,
    cta: "Get started",
    features: [
      "Access to 20+ free live channels",
      "Ad-supported streaming in HD",
      "Radio stations & podcasts",
      "Watch on 1 device at a time",
    ],
    limits: [
      { label: "Video quality", value: "Up to 720p" },
      { label: "Simultaneous streams", value: "1" },
      { label: "Downloads", value: "—" },
    ],
  },
  {
    id: "standard",
    name: "Standard",
    tagline: "For everyday viewers",
    monthly: 9.99,
    yearly: 99,
    icon: Zap,
    cta: "Start Standard",
    features: [
      "All 200+ live channels, ad-free",
      "Full on-demand library in Full HD",
      "Radio & podcast archives",
      "Download for offline on 2 devices",
      "Personalised recommendations",
    ],
    limits: [
      { label: "Video quality", value: "Full HD 1080p" },
      { label: "Simultaneous streams", value: "2" },
      { label: "Downloads", value: "50 titles" },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "The complete broadcast",
    monthly: 15.99,
    yearly: 159,
    icon: Crown,
    featured: true,
    cta: "Go Premium",
    features: [
      "Everything in Standard",
      "4K Ultra HD + HDR where available",
      "Dolby Atmos immersive audio",
      "Early access to premieres & events",
      "Exclusive creator-only channels",
      "Watch on 4 devices at a time",
    ],
    limits: [
      { label: "Video quality", value: "4K Ultra HD + HDR" },
      { label: "Simultaneous streams", value: "4" },
      { label: "Downloads", value: "Unlimited" },
    ],
  },
  {
    id: "family",
    name: "Family",
    tagline: "Up to 5 profiles",
    monthly: 22.99,
    yearly: 229,
    icon: Users,
    cta: "Start Family",
    features: [
      "Everything in Premium",
      "Up to 5 personalised profiles",
      "Kids mode with parental controls",
      "Shared watchlists & family rooms",
      "Watch on 6 devices at a time",
    ],
    limits: [
      { label: "Video quality", value: "4K Ultra HD + HDR" },
      { label: "Simultaneous streams", value: "6" },
      { label: "Downloads", value: "Unlimited" },
    ],
  },
];

const comparisonRows: {
  section: string;
  rows: { label: string; values: (string | boolean)[] }[];
}[] = [
  {
    section: "Live TV & Radio",
    rows: [
      { label: "Free live channels", values: [true, true, true, true] },
      { label: "Premium live channels", values: [false, true, true, true] },
      { label: "Live events & premieres", values: [false, true, true, true] },
      { label: "Radio stations & podcasts", values: [true, true, true, true] },
    ],
  },
  {
    section: "On-Demand",
    rows: [
      { label: "On-demand library", values: ["Limited", "Full", "Full + Early", "Full + Early"] },
      { label: "Video quality", values: ["720p", "1080p", "4K HDR", "4K HDR"] },
      { label: "Dolby Atmos", values: [false, false, true, true] },
      { label: "Downloads", values: ["—", "50", "Unlimited", "Unlimited"] },
    ],
  },
  {
    section: "Household",
    rows: [
      { label: "Simultaneous streams", values: ["1", "2", "4", "6"] },
      { label: "Profiles", values: ["1", "2", "3", "5"] },
      { label: "Kids mode", values: [false, true, true, true] },
    ],
  },
  {
    section: "Experience",
    rows: [
      { label: "Ad-free viewing", values: [false, true, true, true] },
      { label: "Personalised recommendations", values: [false, true, true, true] },
      { label: "Exclusive creator channels", values: [false, false, true, true] },
    ],
  },
];

const faqs = [
  {
    q: "Can I switch or cancel my plan anytime?",
    a: "Yes. Upgrade, downgrade or cancel from Account → Subscription at any time. Changes take effect at the end of your billing cycle.",
  },
  {
    q: "How does the creator revenue share work?",
    a: "A share of every subscription is allocated to a creator pool and paid out monthly based on your actual watch time across channels and on-demand content.",
  },
  {
    q: "What devices are supported?",
    a: "Web, iOS, Android, Apple TV, Android TV, Roku, and most smart TVs. Chromecast and AirPlay are supported on all paid plans.",
  },
  {
    q: "Is there a student or ministry discount?",
    a: "Yes. Verified students save 40% on Standard, and registered ministries can request the Enterprise tier for multi-campus deployments.",
  },
  {
    q: "Do you offer a free trial?",
    a: "Every paid plan starts with a 14-day free trial. No charges if you cancel before it ends.",
  },
];

function PricingPage() {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Hero */}
      <section className="relative border-b border-border overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-60"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div className="mx-auto max-w-[1480px] px-6 lg:px-10 pt-16 pb-14 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-elevated/70 border border-border text-xs font-medium">
            <Sparkles className="size-3.5 text-accent" /> One subscription, the whole network
          </div>
          <h1 className="mt-5 text-4xl lg:text-6xl font-extrabold tracking-tight max-w-3xl mx-auto">
            Pricing built for every kind of viewer
          </h1>
          <p className="mt-5 text-lg text-[color:var(--secondary-foreground)] max-w-2xl mx-auto">
            Live TV, radio, podcasts and premium on-demand from the entire
            LoveWorld network. Cancel anytime. 14-day free trial on every paid plan.
          </p>

          {/* Toggle */}
          <div className="mt-8 inline-flex p-1 rounded-full bg-elevated/70 border border-border">
            <button
              onClick={() => setCycle("monthly")}
              className={`px-5 h-9 rounded-full text-sm font-medium transition ${
                cycle === "monthly"
                  ? "bg-foreground text-background"
                  : "text-[color:var(--secondary-foreground)]"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setCycle("yearly")}
              className={`px-5 h-9 rounded-full text-sm font-medium transition inline-flex items-center gap-2 ${
                cycle === "yearly"
                  ? "bg-foreground text-background"
                  : "text-[color:var(--secondary-foreground)]"
              }`}
            >
              Yearly
              <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-accent/20 text-accent">
                Save 17%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-[1480px] px-6 lg:px-10 -mt-6 mb-16">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((p) => {
            const price = cycle === "monthly" ? p.monthly : p.yearly / 12;
            const Icon = p.icon;
            return (
              <div
                key={p.id}
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
                <div className="size-10 rounded-lg bg-accent/10 grid place-items-center">
                  <Icon className="size-5 text-accent" />
                </div>
                <div className="mt-4 text-xl font-bold">{p.name}</div>
                <div className="text-sm text-[color:var(--muted-foreground)]">
                  {p.tagline}
                </div>
                <div className="mt-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight">
                      ${price.toFixed(price % 1 === 0 ? 0 : 2)}
                    </span>
                    <span className="text-sm text-[color:var(--muted-foreground)]">
                      /mo
                    </span>
                  </div>
                  {cycle === "yearly" && p.yearly > 0 && (
                    <div className="text-xs text-[color:var(--muted-foreground)] mt-1">
                      Billed ${p.yearly}/year
                    </div>
                  )}
                  {p.monthly === 0 && (
                    <div className="text-xs text-[color:var(--muted-foreground)] mt-1">
                      Free forever
                    </div>
                  )}
                </div>
                <button
                  className={`mt-5 h-11 rounded-md font-semibold text-sm transition ${
                    p.featured
                      ? "bg-accent text-accent-foreground hover:bg-accent/90"
                      : "bg-surface border border-border hover:bg-elevated"
                  }`}
                >
                  {p.cta}
                </button>
                <ul className="mt-6 space-y-2.5 flex-1">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-[color:var(--secondary-foreground)]"
                    >
                      <Check className="size-4 text-accent shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 pt-5 border-t border-border space-y-2">
                  {p.limits.map((l) => (
                    <div
                      key={l.label}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-[color:var(--muted-foreground)]">
                        {l.label}
                      </span>
                      <span className="font-medium">{l.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Value strip */}
      <section className="border-y border-border bg-elevated/30">
        <div className="mx-auto max-w-[1480px] px-6 lg:px-10 py-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Tv, title: "200+ live channels", desc: "News, worship, music, kids and more" },
            { icon: Radio, title: "Radio & podcasts", desc: "Curated stations and on-demand shows" },
            { icon: Download, title: "Watch offline", desc: "Download to iOS & Android" },
            { icon: ShieldCheck, title: "No hidden fees", desc: "Cancel anytime, prorated refunds" },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <div className="size-10 rounded-lg bg-accent/10 grid place-items-center shrink-0">
                <item.icon className="size-5 text-accent" />
              </div>
              <div>
                <div className="font-semibold">{item.title}</div>
                <div className="text-sm text-[color:var(--muted-foreground)]">
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Compare table */}
      <section className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-16">
        <div className="mb-8">
          <div className="text-[11px] uppercase tracking-widest text-accent font-semibold">
            Compare plans
          </div>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">
            Every feature, side by side
          </h2>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-elevated/40 text-left">
                <th className="p-4 font-medium text-[color:var(--muted-foreground)] w-1/3">
                  Features
                </th>
                {plans.map((p) => (
                  <th key={p.id} className="p-4 font-semibold">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((group) => (
                <Fragment key={group.section}>
                  <tr className="bg-elevated/20">
                    <td
                      colSpan={5}
                      className="px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-[color:var(--muted-foreground)]"
                    >
                      {group.section}
                    </td>
                  </tr>
                  {group.rows.map((row) => (
                    <tr key={row.label} className="border-t border-border">
                      <td className="p-4 text-[color:var(--secondary-foreground)]">
                        {row.label}
                      </td>
                      {row.values.map((v, i) => (
                        <td key={i} className="p-4">
                          {typeof v === "boolean" ? (
                            v ? (
                              <Check className="size-4 text-accent" />
                            ) : (
                              <span className="text-[color:var(--muted-foreground)]">
                                —
                              </span>
                            )
                          ) : (
                            <span className="font-medium">{v}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Creator callout */}
      <section className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-16">
        <div className="relative overflow-hidden rounded-2xl border border-border p-8 lg:p-12 bg-gradient-to-br from-primary/20 via-elevated/40 to-accent/10">
          <div className="max-w-2xl">
            <div className="text-[11px] uppercase tracking-widest text-accent font-semibold">
              For creators & networks
            </div>
            <h2 className="mt-2 text-3xl lg:text-4xl font-semibold tracking-tight">
              Earn from every minute watched
            </h2>
            <p className="mt-3 text-[color:var(--secondary-foreground)]">
              Lettflix runs on a performance-based revenue share. A dedicated
              portion of every subscription is paid out monthly to creators,
              proportional to their watch time. No middlemen, no fixed CPMs.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/studio"
                className="h-11 px-5 rounded-md bg-accent text-accent-foreground font-semibold text-sm inline-flex items-center gap-2 hover:bg-accent/90 transition"
              >
                Open Creator Portal <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/enterprise"
                className="h-11 px-5 rounded-md bg-surface border border-border font-medium text-sm hover:bg-elevated transition inline-flex items-center"
              >
                Enterprise partnerships
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-16 mb-20">
        <div className="mb-8">
          <div className="text-[11px] uppercase tracking-widest text-accent font-semibold">
            FAQ
          </div>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">
            Common questions
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map((f) => (
            <div
              key={f.q}
              className="rounded-2xl border border-border bg-elevated/40 p-6"
            >
              <div className="font-semibold">{f.q}</div>
              <div className="mt-2 text-sm text-[color:var(--secondary-foreground)]">
                {f.a}
              </div>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
