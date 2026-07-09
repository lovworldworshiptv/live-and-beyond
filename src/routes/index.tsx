import { createFileRoute } from "@tanstack/react-router";
import {
  Play,
  Tv,
  CalendarDays,
  Bell,
  Plus,
  Radio,
  Mic,
  Trophy,
  Sparkles,
  Newspaper,
  Music2,
  Heart,
  Clock,
  ArrowRight,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Row } from "@/components/row";

import heroImg from "@/assets/hero-broadcast.jpg";
import ch1 from "@/assets/channel-1.jpg";
import ch2 from "@/assets/channel-2.jpg";
import ch3 from "@/assets/channel-3.jpg";
import ch4 from "@/assets/channel-4.jpg";
import ch5 from "@/assets/channel-5.jpg";
import ch6 from "@/assets/channel-6.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lettflix — Live TV, Radio, Podcasts & On-Demand" },
      { name: "description", content: "One subscription. Live channels, radio, podcasts, events and premium on-demand entertainment — all in one broadcast-grade ecosystem." },
      { property: "og:title", content: "Lettflix — Live TV, Radio, Podcasts & On-Demand" },
      { property: "og:description", content: "The future of digital broadcasting. Discover live channels and on-demand content from broadcasters, ministries and creators worldwide." },
    ],
  }),
  component: Index,
});

const liveNow = [
  { img: ch1, channel: "LoveWorld Music", program: "Hallelujah Live Concert", category: "Music", viewers: "12.4K" },
  { img: ch5, channel: "Faith Network", program: "Healing School Service", category: "Christian Living", viewers: "28.1K" },
  { img: ch3, channel: "Global News 24", program: "World Briefing", category: "News", viewers: "4.7K" },
  { img: ch4, channel: "Stadium+", program: "Premier Cup — Live", category: "Sports", viewers: "61.9K" },
  { img: ch2, channel: "Studio Late", program: "The Morning Drive", category: "Radio", viewers: "2.3K" },
  { img: ch6, channel: "Hot 100 FM", program: "On Air with DJ Solo", category: "Radio", viewers: "1.9K" },
];

const featuredChannels = [
  { img: ch5, name: "LoveWorld Plus", tag: "Premium" },
  { img: ch1, name: "Worship Live", tag: "Trending" },
  { img: ch4, name: "Stadium+", tag: "Sports" },
  { img: ch3, name: "Global News 24", tag: "News" },
  { img: ch2, name: "Studio Late", tag: "Podcasts" },
  { img: ch6, name: "Hot 100 FM", tag: "Radio" },
];

const trending = [
  { img: ch1, title: "Night of Bliss — Lagos", meta: "Concert · 2h 14m" },
  { img: ch5, title: "The Healing Streams", meta: "Series · S2 · 12 eps" },
  { img: ch3, title: "Inside Africa Today", meta: "Documentary · 48m" },
  { img: ch4, title: "Champions Final 2026", meta: "Sports · Replay" },
  { img: ch2, title: "Founders Unfiltered", meta: "Podcast · Ep. 41" },
  { img: ch6, title: "Sunday Drive Sessions", meta: "Radio · 1h 30m" },
];

const continueWatching = [
  { img: ch5, title: "Your Loveworld Specials", meta: "S9 · E04 · 32 min left", progress: 62 },
  { img: ch1, title: "Praise Night Atlanta", meta: "1h 12m left", progress: 28 },
  { img: ch2, title: "Builders Podcast", meta: "Ep. 18 · 14 min left", progress: 78 },
  { img: ch3, title: "World Briefing Weekly", meta: "9 min left", progress: 88 },
];

const upcoming = [
  { img: ch5, title: "Global Day of Prayer", date: "Sat, Jul 11", time: "6:00 PM GMT" },
  { img: ch1, title: "LoveWorld Music Awards", date: "Fri, Jul 17", time: "8:00 PM GMT" },
  { img: ch4, title: "Africa Cup Opening", date: "Sun, Jul 19", time: "4:00 PM GMT" },
  { img: ch3, title: "State of the World 2026", date: "Mon, Jul 21", time: "1:00 PM GMT" },
];

const collections = [
  { title: "Christian Living", count: "240+ titles", icon: Heart, grad: "from-rose-500/30 to-primary/40" },
  { title: "LoveWorld", count: "180+ titles", icon: Sparkles, grad: "from-violet-500/30 to-accent/40" },
  { title: "Sports", count: "92 channels", icon: Trophy, grad: "from-emerald-500/30 to-cyan-500/30" },
  { title: "News", count: "48 channels", icon: Newspaper, grad: "from-sky-500/30 to-accent/40" },
  { title: "Music", count: "600+ titles", icon: Music2, grad: "from-fuchsia-500/30 to-primary/40" },
  { title: "Radio", count: "320 stations", icon: Radio, grad: "from-amber-500/30 to-rose-500/30" },
  { title: "Podcasts", count: "1.2K shows", icon: Mic, grad: "from-indigo-500/30 to-accent/40" },
  { title: "Kids & Family", count: "140+ titles", icon: Sparkles, grad: "from-teal-500/30 to-emerald-500/30" },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0 -z-10">
          <img src={heroImg} alt="" width={1920} height={1088} className="size-full object-cover object-right" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-transparent md:via-background/80 lg:via-background/60" />
          <div className="absolute inset-y-0 left-0 w-1/2 bg-background/70 md:bg-background/40 lg:bg-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent to-background" />
        </div>

        <div className="mx-auto max-w-[1480px] px-6 lg:px-10 pt-16 lg:pt-24 pb-20 lg:pb-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-elevated/70 backdrop-blur border border-border text-xs font-medium">
              <span className="live-pulse text-primary">LIVE NOW</span>
              <span className="text-[color:var(--secondary-foreground)]">· 184 channels broadcasting</span>
            </div>
            <h1 className="mt-6 text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.02]">
              The future of <span className="text-primary">broadcasting</span>,
              <br />
              streaming together.
            </h1>
            <p className="mt-5 text-lg text-[color:var(--secondary-foreground)] max-w-xl">
              Live television, radio, podcasts, events and premium on-demand — discover
              everything from broadcasters, ministries and creators worldwide. One subscription.
              One ecosystem.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 px-6 h-12 rounded-md bg-[image:var(--gradient-live)] text-primary-foreground font-semibold shadow-[var(--shadow-glow)] hover:opacity-95 transition">
                <Play className="size-4 fill-current" /> Watch Live
              </button>
              <button className="inline-flex items-center gap-2 px-6 h-12 rounded-md bg-elevated/80 border border-border backdrop-blur hover:bg-elevated transition font-medium">
                <Tv className="size-4" /> Browse Channels
              </button>
              <button className="inline-flex items-center gap-2 px-6 h-12 rounded-md text-[color:var(--secondary-foreground)] hover:text-foreground hover:bg-elevated/40 transition font-medium">
                <CalendarDays className="size-4" /> Open Live Guide
              </button>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
              {[
                { k: "184", v: "Live channels" },
                { k: "12K+", v: "On-demand titles" },
                { k: "320", v: "Radio stations" },
              ].map((s) => (
                <div key={s.v}>
                  <div className="text-2xl font-display font-bold">{s.k}</div>
                  <div className="text-xs text-[color:var(--muted-foreground)] mt-1">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* LIVE NOW */}
      <Row
        title="Live Right Now"
        subtitle="Tune into what's broadcasting across the network."
        action={
          <a href="#" className="hidden sm:inline-flex items-center gap-1 text-sm text-[color:var(--secondary-foreground)] hover:text-foreground">
            All live <ArrowRight className="size-4" />
          </a>
        }
      >
        {liveNow.map((c) => (
          <article
            key={c.program}
            className="group relative shrink-0 w-[300px] md:w-[340px] snap-start rounded-xl overflow-hidden border border-border bg-elevated/50 hover:border-primary/40 transition"
          >
            <div className="relative aspect-video overflow-hidden">
              <img src={c.img} alt={c.program} loading="lazy" className="size-full object-cover group-hover:scale-105 transition duration-500" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 50%, oklch(0.24 0.59 359.4 / 0.45) 100%)" }} />
              <span className="absolute top-3 left-3 inline-flex items-center px-2 py-1 rounded text-[11px] font-bold tracking-wide bg-[image:var(--gradient-live)] text-primary-foreground live-pulse">
                LIVE
              </span>
              <span className="absolute top-3 right-3 text-[11px] px-2 py-1 rounded bg-black/60 backdrop-blur text-white/90">
                {c.viewers} watching
              </span>
              <button className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition">
                <div className="size-14 rounded-full bg-white/95 grid place-items-center shadow-[var(--shadow-card)]">
                  <Play className="size-5 text-background fill-current ml-0.5" />
                </div>
              </button>
            </div>
            <div className="p-4" style={{ background: "linear-gradient(180deg, oklch(0.24 0.59 359.4 / 0.75), oklch(0.24 0.59 359.4 / 0.95))" }}>
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-white/90">{c.category}</div>
                <button className="text-white/70 hover:text-white" aria-label="Set reminder">
                  <Bell className="size-3.5" />
                </button>
              </div>
              <div className="mt-1.5 font-semibold leading-tight line-clamp-1 text-white">{c.program}</div>
              <div className="text-sm text-white/70 mt-0.5">{c.channel}</div>
            </div>
          </article>
        ))}
      </Row>

      {/* FEATURED CHANNELS */}
      <Row title="Featured Channels" subtitle="Premium broadcasters and trending networks.">
        {featuredChannels.map((c) => (
          <article
            key={c.name}
            className="group shrink-0 w-[220px] snap-start rounded-xl overflow-hidden border border-border bg-elevated/50 hover:border-accent/50 transition"
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              <img src={c.img} alt={c.name} loading="lazy" className="size-full object-cover group-hover:scale-105 transition duration-500" />
              <div className="absolute inset-0" style={{ background: "var(--gradient-card)" }} />
              <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-accent/90 text-accent-foreground">
                {c.tag}
              </span>
              <div className="absolute bottom-0 inset-x-0 p-4">
                <div className="font-semibold leading-tight">{c.name}</div>
                <div className="text-xs text-white/70 mt-0.5">24/7 broadcast</div>
              </div>
            </div>
          </article>
        ))}
      </Row>

      {/* SPONSORED */}
      <section className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-14">
        <div className="relative overflow-hidden rounded-2xl border border-border">
          <div className="absolute inset-0 bg-[image:var(--gradient-live)] opacity-90" />
          <div className="absolute inset-0 mix-blend-overlay" style={{ background: "radial-gradient(at 80% 50%, oklch(0.58 0.22 264 / 0.6), transparent 60%)" }} />
          <div className="relative px-8 lg:px-14 py-10 lg:py-14 flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-white/80">Sponsored Event</div>
              <h3 className="mt-2 text-2xl lg:text-3xl font-display font-bold max-w-xl">
                Global Day of Prayer — broadcast live to 140 nations.
              </h3>
              <p className="mt-2 text-white/80 max-w-xl">Saturday, July 11 · 6:00 PM GMT. Add it to your calendar and be reminded the moment it goes live.</p>
            </div>
            <div className="flex gap-3">
              <button className="inline-flex items-center gap-2 px-5 h-11 rounded-md bg-white text-background font-semibold hover:bg-white/90 transition">
                <Bell className="size-4" /> Notify Me
              </button>
              <button className="inline-flex items-center gap-2 px-5 h-11 rounded-md bg-black/40 border border-white/20 backdrop-blur text-white font-medium hover:bg-black/60 transition">
                <CalendarDays className="size-4" /> Add to Calendar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TRENDING */}
      <Row title="Trending On Lettflix" subtitle="Most watched across the platform this week.">
        {trending.map((t, i) => (
          <article key={t.title} className="group shrink-0 w-[260px] snap-start">
            <div className="relative rounded-xl overflow-hidden border border-border bg-elevated/50">
              <div className="relative aspect-video overflow-hidden">
                <img src={t.img} alt={t.title} loading="lazy" className="size-full object-cover group-hover:scale-105 transition duration-500" />
                <div className="absolute inset-0" style={{ background: "var(--gradient-card)" }} />
                <span className="absolute top-3 left-3 text-[11px] font-bold px-2 py-1 rounded bg-black/60 backdrop-blur">#{i + 1}</span>
                <button className="absolute bottom-3 right-3 size-10 rounded-full bg-white/95 grid place-items-center opacity-0 group-hover:opacity-100 transition shadow-[var(--shadow-card)]">
                  <Play className="size-4 text-background fill-current ml-0.5" />
                </button>
              </div>
            </div>
            <div className="mt-2.5">
              <div className="font-semibold leading-tight line-clamp-1">{t.title}</div>
              <div className="text-xs text-[color:var(--muted-foreground)] mt-0.5">{t.meta}</div>
            </div>
          </article>
        ))}
      </Row>

      {/* CONTINUE WATCHING */}
      <Row title="Continue Watching" subtitle="Pick up where you left off, Esteemed Viewer.">
        {continueWatching.map((c) => (
          <article key={c.title} className="group shrink-0 w-[320px] snap-start rounded-xl overflow-hidden border border-border bg-elevated/50">
            <div className="relative aspect-video overflow-hidden">
              <img src={c.img} alt={c.title} loading="lazy" className="size-full object-cover group-hover:scale-105 transition duration-500" />
              <div className="absolute inset-0" style={{ background: "var(--gradient-card)" }} />
              <button className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition">
                <div className="size-12 rounded-full bg-white/95 grid place-items-center">
                  <Play className="size-4 text-background fill-current ml-0.5" />
                </div>
              </button>
              <div className="absolute bottom-0 inset-x-0 h-1 bg-white/15">
                <div className="h-full bg-primary" style={{ width: `${c.progress}%` }} />
              </div>
            </div>
            <div className="p-4 flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold leading-tight line-clamp-1">{c.title}</div>
                <div className="text-xs text-[color:var(--muted-foreground)] mt-0.5 flex items-center gap-1.5"><Clock className="size-3" /> {c.meta}</div>
              </div>
              <button className="text-[color:var(--muted-foreground)] hover:text-foreground" aria-label="More">
                <Plus className="size-4" />
              </button>
            </div>
          </article>
        ))}
      </Row>

      {/* UPCOMING EVENTS */}
      <Row title="Upcoming Events" subtitle="Conferences, concerts and broadcasts coming soon.">
        {upcoming.map((e) => (
          <article key={e.title} className="group shrink-0 w-[340px] snap-start rounded-xl overflow-hidden border border-border bg-elevated/50">
            <div className="relative aspect-[16/10] overflow-hidden">
              <img src={e.img} alt={e.title} loading="lazy" className="size-full object-cover group-hover:scale-105 transition duration-500" />
              <div className="absolute inset-0" style={{ background: "var(--gradient-card)" }} />
              <div className="absolute top-3 left-3 px-2.5 py-1.5 rounded bg-black/60 backdrop-blur text-xs">
                <div className="font-bold">{e.date}</div>
                <div className="text-white/70 text-[11px]">{e.time}</div>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="font-semibold leading-tight">{e.title}</div>
              <button className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 h-8 rounded-md bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25 transition">
                <Bell className="size-3.5" /> Remind
              </button>
            </div>
          </article>
        ))}
      </Row>

      {/* FEATURED COLLECTIONS */}
      <section className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-14">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-xl lg:text-2xl font-semibold tracking-tight">Featured Collections</h2>
            <p className="text-sm text-[color:var(--muted-foreground)] mt-1">Curated worlds across categories you love.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {collections.map((col) => {
            const Icon = col.icon;
            return (
              <a
                key={col.title}
                href="#"
                className={`group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br ${col.grad} p-5 h-32 flex flex-col justify-between hover:border-foreground/20 transition`}
              >
                <Icon className="size-6 text-white/90" />
                <div>
                  <div className="font-semibold">{col.title}</div>
                  <div className="text-xs text-white/70">{col.count}</div>
                </div>
                <ArrowRight className="absolute top-5 right-5 size-4 text-white/60 group-hover:text-white group-hover:translate-x-0.5 transition" />
              </a>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-20">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-elevated/40 p-10 lg:p-16 text-center">
          <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/60 border border-border text-xs">
            <Sparkles className="size-3.5 text-accent" /> One subscription. Everything.
          </div>
          <h2 className="mt-5 text-3xl lg:text-5xl font-display font-extrabold tracking-tight max-w-3xl mx-auto leading-tight">
            Live television, radio, podcasts and on-demand — together at last.
          </h2>
          <p className="mt-4 text-[color:var(--secondary-foreground)] max-w-xl mx-auto">
            Join millions discovering channels, ministries and creators on the world's first unified broadcast ecosystem.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button className="inline-flex items-center gap-2 px-7 h-12 rounded-md bg-[image:var(--gradient-live)] text-primary-foreground font-semibold shadow-[var(--shadow-glow)] hover:opacity-95 transition">
              Start Watching <ArrowRight className="size-4" />
            </button>
            <button className="inline-flex items-center gap-2 px-7 h-12 rounded-md bg-elevated/80 border border-border hover:bg-elevated transition font-medium">
              See Pricing
            </button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
