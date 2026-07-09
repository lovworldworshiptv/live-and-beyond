import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Play, Search, Filter, Sparkles, Info } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Row } from "@/components/row";
import { TitleCard } from "@/components/title-card";
import { Pagination } from "@/components/pagination";
import { titles, genres, getTitle } from "@/lib/catalog";
import { useProgress } from "@/lib/personal";


export const Route = createFileRoute("/on-demand")({
  head: () => ({
    meta: [
      { title: "On Demand — Lettflix" },
      {
        name: "description",
        content:
          "Watch premium on-demand series, films, concerts, documentaries and podcasts on Lettflix. 12,000+ titles, one subscription.",
      },
      { property: "og:title", content: "On Demand — Lettflix" },
      {
        property: "og:description",
        content:
          "Series, films, concerts and documentaries. Premium on-demand entertainment from Lettflix.",
      },
    ],
  }),
  component: OnDemand,
});

const PAGE_SIZE = 12;

function OnDemand() {
  const [genre, setGenre] = useState("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const { items: progress } = useProgress();

  const featured = titles.find((t) => t.featured) ?? titles[0];

  const filtered = useMemo(
    () =>
      titles.filter(
        (t) =>
          (genre === "All" || t.category === genre) &&

          (query === "" || t.title.toLowerCase().includes(query.toLowerCase()))
      ),
    [genre, query]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const trending = titles.slice(0, 8);
  const newReleases = [...titles].reverse().slice(0, 8);
  const continueWatching = progress
    .map((p) => ({ p, t: getTitle(p.titleId) }))
    .filter((x): x is { p: (typeof progress)[number]; t: NonNullable<ReturnType<typeof getTitle>> } => !!x.t);

  const resetPage = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setPage(1);
  };

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
                <Play className="size-[19px] fill-current" strokeWidth={2.5} /> Play Now Now
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

      {/* CONTINUE WATCHING — always shown, falls back to popular picks */}
      <Row
        title="Continue Watching"
        subtitle={
          continueWatching.length > 0
            ? "Pick up where you left off."
            : "Start a title to build your history — here are some popular picks."
        }
      >
        {(continueWatching.length > 0
          ? continueWatching.map(({ t }) => t)
          : titles.slice(0, 6)
        ).map((t) => (
          <TitleCard key={t.id} t={t} portrait={false} />
        ))}
      </Row>

      {/* ROWS */}
      <Row title="Trending On Demand" subtitle="What Lettflix is watching this week.">
        {trending.map((t, i) => (
          <TitleCard key={t.id} t={t} rank={i + 1} portrait={false} />
        ))}
      </Row>

      <Row title="New Releases" subtitle="Fresh drops across every genre.">

        {newReleases.map((t) => (
          <TitleCard key={t.id} t={t} portrait={false} />
        ))}
      </Row>

      {/* FULL LIBRARY WITH PAGINATION */}
      <section className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-16 mb-16">
        <div className="flex items-end justify-between mb-5 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Browse the Library</h2>
            <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
              {filtered.length} of {titles.length} titles
              {totalPages > 1 && ` · Page ${currentPage} of ${totalPages}`}
            </p>
          </div>
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)]" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
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
                onClick={() => resetPage(setGenre)(g)}
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
        </div>

        <div className="mt-6 grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {pageItems.map((t) => (
            <TitleCard key={t.id} t={t} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-24 text-[color:var(--muted-foreground)]">
            Nothing matches those filters yet.
          </div>
        )}

        <Pagination page={currentPage} totalPages={totalPages} onPage={setPage} />
      </section>

      <SiteFooter />
    </div>
  );
}
