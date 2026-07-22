import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Play,
  Tv,
  CalendarDays,
  Bell,
  Plus,
  Sparkles,
  Heart,
  Clock,
  ArrowRight,
  Radio as RadioIcon,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Row } from "@/components/row";
import { SponsorBanner } from "@/components/sponsor-banner";
import { useCmsChannels, useCmsTitles, useCmsEvents, useCmsCollections, useCmsSetting } from "@/lib/cms-catalog";
import { defaultHero, type HeroConfig } from "@/lib/homepage-defaults";
import { useProgress } from "@/lib/personal";
import { useEffect, useMemo, useState } from "react";

import heroImg from "@/assets/hero-broadcast.jpg";
import ch1 from "@/assets/channel-1.jpg";

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

function formatEventDate(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", timeZoneName: "short" });
  return { date, time };
}

const COLLECTION_GRADIENTS = [
  "linear-gradient(135deg, oklch(0.24 0.59 359.4), oklch(0.36 0.59 359.4))",
  "linear-gradient(135deg, oklch(0.55 0.22 300), oklch(0.45 0.20 220))",
  "linear-gradient(135deg, oklch(0.65 0.20 60), oklch(0.45 0.18 30))",
  "linear-gradient(135deg, oklch(0.55 0.20 220), oklch(0.35 0.18 260))",
  "linear-gradient(135deg, oklch(0.55 0.20 145), oklch(0.35 0.15 200))",
  "linear-gradient(135deg, oklch(0.35 0.15 280), oklch(0.20 0.12 240))",
  "linear-gradient(135deg, oklch(0.55 0.22 25), oklch(0.30 0.18 15))",
  "linear-gradient(135deg, oklch(0.48 0.20 190), oklch(0.28 0.15 250))",
];

function Index() {
  const { value: hero } = useCmsSetting<HeroConfig>("hero", defaultHero);
  const { channels } = useCmsChannels();
  const { titles } = useCmsTitles();
  const { events } = useCmsEvents(8);
  const { collections: cmsCollections } = useCmsCollections();
  const { items: progressItems } = useProgress();

  const liveNow = useMemo(() => channels.filter((c) => c.isLive).slice(0, 10), [channels]);
  const featuredChannels = useMemo(() => {
    const trending = channels.filter((c) => c.trending);
    return (trending.length ? trending : channels).slice(0, 10);
  }, [channels]);
  const trending = useMemo(() => {
    const feat = titles.filter((t) => t.featured);
    return (feat.length ? feat : titles).slice(0, 10);
  }, [titles]);
  const continueWatching = useMemo(() => {
    return progressItems
      .slice()
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((p) => {
        const t = titles.find((x) => x.id === p.titleId);
        return t ? { t, pct: p.positionPct } : null;
      })
      .filter((x): x is { t: (typeof titles)[number]; pct: number } => !!x)
      .slice(0, 6);
  }, [progressItems, titles]);

  const heroSlides = useMemo(() => {
    const s = hero.slides?.filter((x) => x && (x.imageUrl || x.title || x.badge)) ?? [];
    if (s.length) return s;
    return [{
      imageUrl: hero.imageUrl || heroImg,
      badge: hero.badge,
      badgeMeta: hero.badgeMeta,
      title: hero.title,
      titleAccent: hero.titleAccent,
      description: hero.description,
    }];
  }, [hero]);
  const [slideIdx, setSlideIdx] = useState(0);
  useEffect(() => {
    if (heroSlides.length < 2) return;
    const t = setInterval(() => setSlideIdx((i) => (i + 1) % heroSlides.length), hero.intervalMs ?? 6000);
    return () => clearInterval(t);
  }, [heroSlides.length, hero.intervalMs]);
  const activeSlide = heroSlides[Math.min(slideIdx, heroSlides.length - 1)] ?? heroSlides[0];
  const activeBadge = activeSlide.badge ?? hero.badge;
  const activeBadgeMeta = (activeSlide.badgeMeta ?? hero.badgeMeta).replace(
    /^\d+/,
    String(channels.filter((c) => c.isLive).length || channels.length),
  );
  const activeTitle = activeSlide.title ?? hero.title;
  const activeAccent = activeSlide.titleAccent ?? hero.titleAccent;
  const activeDesc = activeSlide.description ?? hero.description;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* HERO */}
      <section className="relative isolate overflow-hidden min-h-[520px] md:min-h-[600px] lg:min-h-[760px]">
        <div className="absolute inset-0 bg-background" />
        {heroSlides.map((s, i) => (
          <img
            key={i}
            src={s.imageUrl || heroImg}
            alt="Lettflix broadcast showcase"
            width={1920}
            height={1088}
            className="absolute inset-y-0 right-0 h-full w-full object-cover object-[72%_center] pointer-events-none transition-opacity duration-1000"
            style={{
              opacity: i === slideIdx ? 1 : 0,
              maskImage: "linear-gradient(90deg, transparent 0%, transparent 38%, black 56%, black 100%)",
              WebkitMaskImage: "linear-gradient(90deg, transparent 0%, transparent 38%, black 56%, black 100%)",
            }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/20 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-background pointer-events-none" />

        <div className="relative mx-auto max-w-[1480px] px-6 lg:px-10 pt-6 lg:pt-[54px] pb-12 lg:pb-32 flex min-h-[520px] md:min-h-[600px] lg:min-h-[760px] items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-elevated/70 backdrop-blur border border-border text-xs font-medium">
              <span className="live-pulse text-primary">{activeBadge}</span>
              <span className="text-[color:var(--secondary-foreground)]">· {activeBadgeMeta}</span>
            </div>
            <h1 className="mt-6 text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.02]">
              {activeTitle} <span className="text-primary">{activeAccent}</span>
            </h1>
            <p className="mt-5 text-lg text-[color:var(--secondary-foreground)] max-w-xl">
              {activeDesc}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={hero.primaryCta.to as never}
                className="inline-flex items-center gap-2 px-6 h-12 rounded-md bg-[image:var(--gradient-live)] text-primary-foreground font-semibold hover:opacity-95 transition"
                style={{
                boxShadow: "0 0 0 3px oklch(0.55 0.22 25 / 0.4), 0 0 24px oklch(0.55 0.22 25 / 0.55), 0 0 50px oklch(0.55 0.22 25 / 0.25)",
                }}
              >
                <Play className="size-[19px] fill-current" strokeWidth={2.5} /> {hero.primaryCta.label}
              </Link>
              <Link to={hero.secondaryCta.to as never} className="inline-flex items-center gap-2 px-6 h-12 rounded-md bg-elevated/80 border border-border backdrop-blur hover:bg-elevated transition font-medium">
                <Tv className="size-4" /> {hero.secondaryCta.label}
              </Link>
              <Link to={hero.tertiaryCta.to as never} className="inline-flex items-center gap-2 px-6 h-12 rounded-md text-[color:var(--secondary-foreground)] hover:text-foreground hover:bg-elevated/40 transition font-medium">
                <CalendarDays className="size-4" /> {hero.tertiaryCta.label}
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
              {hero.stats.map((s) => (
                <div key={s.v}>
                  <div className="text-2xl font-display font-bold">{s.k}</div>
                  <div className="text-xs text-[color:var(--muted-foreground)] mt-1">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {heroSlides.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                aria-label={`Hero slide ${i + 1}`}
                onClick={() => setSlideIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === slideIdx ? "w-6 bg-white" : "w-1.5 bg-white/40"}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* LIVE NOW */}
      {liveNow.length > 0 && (
        <Row
          title="Live Right Now"
          subtitle="Tune into what's broadcasting across the network."
          action={
            <Link to="/channels" className="hidden sm:inline-flex items-center gap-1 text-sm text-[color:var(--secondary-foreground)] hover:text-foreground">
              All live <ArrowRight className="size-4" />
            </Link>
          }
        >
          {liveNow.map((c) => (
            <article
              key={c.id}
              className="group relative shrink-0 w-[300px] md:w-[340px] snap-start rounded-xl overflow-hidden border border-border bg-elevated/50 hover:border-primary/40 transition"
            >
              <Link to="/channels/$channelId" params={{ channelId: c.id }} className="block">
                <div className="relative aspect-video overflow-hidden">
                  <img src={c.banner || ch1} alt={c.nowPlaying.title || c.name} loading="lazy" className="size-full object-cover group-hover:scale-105 transition duration-500" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 50%, oklch(0.24 0.59 359.4 / 0.45) 100%)" }} />
                  <span className="absolute top-3 left-3 inline-flex items-center px-2 py-1 rounded text-[11px] font-bold tracking-wide bg-[image:var(--gradient-live)] text-primary-foreground live-pulse">
                    LIVE
                  </span>
                  <span className="absolute top-3 right-3 text-[11px] px-2 py-1 rounded bg-black/60 backdrop-blur text-white/90">
                    {c.viewers} watching
                  </span>
                  <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition">
                    <div
                      className="size-16 rounded-full bg-white/95 grid place-items-center transition group-hover:scale-110"
                      style={{
                        boxShadow: "0 0 0 3px oklch(0.55 0.22 25 / 0.4), 0 0 24px oklch(0.55 0.22 25 / 0.55), 0 0 50px oklch(0.55 0.22 25 / 0.25)",
                      }}
                    >
                      <Play className="size-6 text-background fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="p-4" style={{ background: "linear-gradient(180deg, oklch(0.24 0.59 359.4 / 0.75), oklch(0.24 0.59 359.4 / 0.95))" }}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/90">{c.category}</div>
                    <span className="text-white/70" aria-label="Reminder">
                      <Bell className="size-3.5" />
                    </span>
                  </div>
                  <div className="mt-1.5 font-semibold leading-tight line-clamp-1 text-white">{c.nowPlaying.title || "Live broadcast"}</div>
                  <div className="text-sm text-white/70 mt-0.5">{c.name}</div>
                </div>
              </Link>
            </article>
          ))}
        </Row>
      )}

      {/* FEATURED CHANNELS */}
      {featuredChannels.length > 0 && (
        <Row title="Featured Channels" subtitle="Premium broadcasters and trending networks.">
          {featuredChannels.map((c) => (
            <Link
              key={c.id}
              to="/channels/$channelId"
              params={{ channelId: c.id }}
              className="group shrink-0 w-[220px] snap-start rounded-xl overflow-hidden border border-border bg-elevated/50 hover:border-accent/50 transition"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <img src={c.banner || ch1} alt={c.name} loading="lazy" className="size-full object-cover group-hover:scale-105 transition duration-500" />
                <div className="absolute inset-0" style={{ background: "var(--gradient-card)" }} />
                <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-accent/90 text-accent-foreground">
                  {c.trending ? "Trending" : c.category}
                </span>
                <div className="absolute bottom-0 inset-x-0 p-4">
                  <div className="font-semibold leading-tight text-white">{c.name}</div>
                  <div className="text-xs text-white/70 mt-0.5">24/7 broadcast</div>
                </div>
              </div>
            </Link>
          ))}
        </Row>
      )}

      {/* SPONSORED */}
      <SponsorBanner placement="home" includeSponsoredEvents />


      {/* TRENDING */}
      {trending.length > 0 && (
        <Row title="Trending On Lettflix" subtitle="Most watched across the platform this week.">
          {trending.map((t, i) => (
            <Link key={t.id} to="/on-demand/$titleId" params={{ titleId: t.id }} className="group shrink-0 w-[260px] snap-start">
              <div className="relative rounded-xl overflow-hidden border border-border bg-elevated/50">
                <div className="relative aspect-video overflow-hidden">
                  <img src={t.hero || t.cover} alt={t.title} loading="lazy" className="size-full object-cover group-hover:scale-105 transition duration-500" />
                  <div className="absolute inset-0" style={{ background: "var(--gradient-card)" }} />
                  <span className="absolute top-3 left-3 text-[11px] font-bold px-2 py-1 rounded bg-black/60 backdrop-blur text-white">#{i + 1}</span>
                  <div
                    className="absolute bottom-3 right-3 size-11 rounded-full bg-white/95 grid place-items-center opacity-0 group-hover:opacity-100 transition"
                    style={{
                      boxShadow: "0 0 0 3px oklch(0.55 0.22 25 / 0.4), 0 0 20px oklch(0.55 0.22 25 / 0.5), 0 0 45px oklch(0.55 0.22 25 / 0.22)",
                    }}
                  >
                    <Play className="size-5 text-background fill-current ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="mt-2.5">
                <div className="font-semibold leading-tight line-clamp-1">{t.title}</div>
                <div className="text-xs text-[color:var(--muted-foreground)] mt-0.5">{t.kind} · {t.duration}</div>
              </div>
            </Link>
          ))}
        </Row>
      )}

      {/* CONTINUE WATCHING */}
      {continueWatching.length > 0 && (
        <Row title="Continue Watching" subtitle="Pick up where you left off.">
          {continueWatching.map(({ t, pct }) => {
            const remaining = Math.max(0, 100 - pct);
            return (
              <Link key={t.id} to="/on-demand/$titleId" params={{ titleId: t.id }} className="group shrink-0 w-[320px] snap-start rounded-xl overflow-hidden border border-border bg-elevated/50">
                <div className="relative aspect-video overflow-hidden">
                  <img src={t.hero || t.cover} alt={t.title} loading="lazy" className="size-full object-cover group-hover:scale-105 transition duration-500" />
                  <div className="absolute inset-0" style={{ background: "var(--gradient-card)" }} />
                  <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition">
                    <div
                      className="size-14 rounded-full bg-white/95 grid place-items-center"
                      style={{
                        boxShadow: "0 0 0 3px oklch(0.55 0.22 25 / 0.4), 0 0 20px oklch(0.55 0.22 25 / 0.5), 0 0 45px oklch(0.55 0.22 25 / 0.22)",
                      }}
                    >
                      <Play className="size-5 text-background fill-current ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-white/15">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="p-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold leading-tight line-clamp-1">{t.title}</div>
                    <div className="text-xs text-[color:var(--muted-foreground)] mt-0.5 flex items-center gap-1.5"><Clock className="size-3" /> {remaining > 0 ? `${remaining}% left` : "Almost done"}</div>
                  </div>
                  <Plus className="text-[color:var(--muted-foreground)] size-4" />
                </div>
              </Link>
            );
          })}
        </Row>
      )}

      {/* UPCOMING EVENTS */}
      {events.length > 0 && (
        <Row title="Upcoming Events" subtitle="Conferences, concerts and broadcasts coming soon.">
          {events.map((e) => {
            const { date, time } = formatEventDate(e.startsAt);
            return (
              <article key={e.id} className="group shrink-0 w-[340px] snap-start rounded-xl overflow-hidden border border-border bg-elevated/50">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src={e.coverUrl || ch1} alt={e.name} loading="lazy" className="size-full object-cover group-hover:scale-105 transition duration-500" />
                  <div className="absolute inset-0" style={{ background: "var(--gradient-card)" }} />
                  <div className="absolute top-3 left-3 px-2.5 py-1.5 rounded bg-black/60 backdrop-blur text-xs text-white">
                    <div className="font-bold">{date}</div>
                    <div className="text-white/70 text-[11px]">{time}</div>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between gap-3">
                  <div className="font-semibold leading-tight line-clamp-2">{e.name}</div>
                  <button className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 h-8 rounded-md bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25 transition">
                    <Bell className="size-3.5" /> Remind
                  </button>
                </div>
              </article>
            );
          })}
        </Row>
      )}

      {/* FEATURED COLLECTIONS */}
      {cmsCollections.length > 0 && (
        <section className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-14">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-xl lg:text-2xl font-semibold tracking-tight">Featured Collections</h2>
              <p className="text-sm text-[color:var(--muted-foreground)] mt-1">Curated worlds across categories you love.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cmsCollections.slice(0, 8).map((col, i) => (
              <Link
                key={col.id}
                to="/collections/$collectionId"
                params={{ collectionId: col.slug }}
                className="group relative overflow-hidden rounded-xl border border-border p-5 h-32 flex flex-col justify-between hover:border-foreground/20 transition"
                style={{ background: COLLECTION_GRADIENTS[i % COLLECTION_GRADIENTS.length] }}
              >
                {col.isFeatured ? <Sparkles className="size-6 text-white/90" /> : <Heart className="size-6 text-white/90" />}
                <div>
                  <div className="font-semibold text-white">{col.name}</div>
                  <div className="text-xs text-white/70 line-clamp-1">{col.description ?? "Curated collection"}</div>
                </div>
                <ArrowRight className="absolute top-5 right-5 size-4 text-white/60 group-hover:text-white group-hover:translate-x-0.5 transition" />
              </Link>
            ))}
          </div>
        </section>
      )}

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
            <Link to="/pricing" className="inline-flex items-center gap-2 px-7 h-12 rounded-md bg-[image:var(--gradient-live)] text-primary-foreground font-semibold shadow-[var(--shadow-glow)] hover:opacity-95 transition">
              Start Watching <ArrowRight className="size-4" />
            </Link>
            <Link to="/pricing" className="inline-flex items-center gap-2 px-7 h-12 rounded-md bg-elevated/80 border border-border hover:bg-elevated transition font-medium">
              <RadioIcon className="size-4" /> See Pricing
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
