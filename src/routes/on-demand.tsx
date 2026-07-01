import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Play, Search, Filter, Sparkles, Clock, Info, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Row } from "@/components/row";
import { titles, genres } from "@/lib/catalog";

export const Route = createFileRoute("/on-demand")({
  head: () => ({
    meta: [
      { title: "On Demand — Lettflix" },
      { name: "description", content: "Watch premium on-demand series, films, concerts, documentaries and podcasts on Lettflix. 12,000+ titles, one subscription." },
      { property: "og:title", content: "On Demand — Lettflix" },
      { property: "og:description", content: "Series, films, concerts and documentaries. Premium on-demand entertainment from Lettflix." },
    ],
  }),
  component: OnDemand,
});

const kinds = ["All", "Series", "Film", "Documentary", "Concert", "Event", "Podcast"] as const;

function OnDemand() {
  const [genre, setGenre] = useState("All");
  const [kind, setKind] = useState<(typeof kinds)[number]>("All");
  const [query, setQuery] = useState("");

  const featured = titles.find((t) => t.featured) ?? titles[0];

  const filtered = useMemo(
    () =>
      titles.filter(
        (t) =>
          (genre === "All" || t.category === genre) &&
          (kind === "All" || t.kind === kind) &&
          (query === "" || t.title.toLowerCase().includes(query.toLowerCase()))
      ),
    [genre, kind, query]
  );

  const trending = titles.slice(0, 6);
  const newReleases = [...titles].reverse().slice(0, 6);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* FEATURED SPOTLIGHT */}
      <section className="relative border-b border-border">
        <div className="absolute inset-0 -z-10">
          <img src={featured.hero} alt="" className="size-full object-cover opacity-60" />
          <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
        </div>
        <div className="mx-auto max-w-[1480px] px-6 lg:px-10 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-elevated/70 backdrop-blur border border-border text-xs font-medium">
              <Sparkles className="size-3.5 text-accent" /> Featured On Demand
            </div>
            <h1 className="mt-5 text-4xl lg:text-6xl font-extrabold tracking-tight leading-[1.02]">
              {featured.title}
            </h1>
            <div className="mt-4 flex items-center gap-3 text-sm text-[color:var(--muted-foreground)]">
              <span className="px-2 py-0.5 rounded border border-border">{featured.rating}</span>
              <span>{featured.year}</span>
              <span>·</span>
              <span>{featured.duration}</span>
              <span>·</span>
              <span className="text-accent font-semibold">{featured.category}</span>
            </div>
            <p className="mt-5 text-lg text-[color:var(--secondary-foreground)] max-w-xl">
              {featured.synopsis}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/on-demand/$titleId"
                params={{ titleId: featured.id }}
                className="inline-flex items-center gap-2 px-6 h-12 rounded-md bg-white text-background font-semibold hover:bg-white/90 transition"
              >
                <Play className="size-4 fill-current" /> Play Now
              </Link>
              <Link
                to="/on-demand/$titleId"
                params={{ titleId: featured.id }}
                className="inline-flex items-center gap-2 px-6 h-12 rounded-md bg-elevated/80 border border-border backdrop-blur hover:bg-elevated transition font-medium"
              >
                <Info className="size-4" /> More Info
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ROWS */}
      <Row title="Trending On Demand" subtitle="What Lettflix is watching this week.">
        {trending.map((t, i) => (
          <TitleCard key={t.id} t={t} rank={i + 1} />
        ))}
      </Row>

      <Row title="New Releases" subtitle="Fresh drops across every genre.">
        {newReleases.map((t) => (
          <TitleCard key={t.id} t={t} />
        ))}
      </Row>

      {/* FULL LIBRARY */}
      <section className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-16">
        <div className="flex items-end justify-between mb-5 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Browse the Library</h2>
            <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
              {filtered.length} of {titles.length} titles
            </p>
          </div>
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles…"
              className="h-10 pl-9 pr-4 rounded-md bg-surface border border-border w-64 text-sm outline-none focus:border-accent transition"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <Filter className="size-4 text-[color:var(--muted-foreground)] shrink-0" />
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setGenre(g)}
                className={`shrink-0 px-3 h-8 rounded-full text-sm border transition ${
                  genre === g
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-elevated/50 border-border text-[color:var(--secondary-foreground)] hover:text-foreground"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {kinds.map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={`shrink-0 px-3 h-8 rounded-full text-sm border transition ${
                  kind === k
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-elevated/50 border-border text-[color:var(--secondary-foreground)] hover:text-foreground"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {filtered.map((t) => (
            <TitleCard key={t.id} t={t} portrait />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-24 text-[color:var(--muted-foreground)]">
            Nothing matches those filters yet.
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

function TitleCard({
  t,
  rank,
  portrait,
}: {
  t: (typeof titles)[number];
  rank?: number;
  portrait?: boolean;
}) {
  return (
    <Link
      to="/on-demand/$titleId"
      params={{ titleId: t.id }}
      className={`group shrink-0 snap-start ${portrait ? "" : "w-[260px]"}`}
    >
      <div className={`relative rounded-xl overflow-hidden border border-border bg-elevated/50 ${portrait ? "aspect-[2/3]" : "aspect-video"}`}>
        <img src={t.cover} alt={t.title} loading="lazy" className="size-full object-cover group-hover:scale-105 transition duration-500" />
        <div className="absolute inset-0" style={{ background: "var(--gradient-card)" }} />
        {rank && (
          <span className="absolute top-3 left-3 text-[11px] font-bold px-2 py-1 rounded bg-black/60 backdrop-blur">#{rank}</span>
        )}
        <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-black/60 backdrop-blur text-white/90">
          {t.kind}
        </span>
        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="text-sm font-semibold leading-tight line-clamp-2">{t.title}</div>
          <div className="text-[11px] text-white/70 mt-1 flex items-center gap-1.5">
            <Clock className="size-3" /> {t.duration}
          </div>
        </div>
        <button className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition">
          <div className="size-12 rounded-full bg-white/95 grid place-items-center shadow-[var(--shadow-card)]">
            <Play className="size-4 text-background fill-current ml-0.5" />
          </div>
        </button>
      </div>
      {!portrait && (
        <div className="mt-2 text-xs text-[color:var(--muted-foreground)] flex items-center justify-between">
          <span>{t.category}</span>
          <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition" />
        </div>
      )}
    </Link>
  );
}
