import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Play, Search, Filter, Sparkles, Info } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Row } from "@/components/row";
import { TitleCard } from "@/components/title-card";
import { Pagination } from "@/components/pagination";
import { genres } from "@/lib/catalog";
import { useCmsTitles } from "@/lib/cms-catalog";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/lib/personal";


export const Route = createFileRoute("/movies/")({
  head: () => ({
    meta: [
      { title: "Movies — Lettflix" },
      {
        name: "description",
        content:
          "Discover and watch the published movie catalogue on Lettflix.",
      },
      { property: "og:title", content: "Movies — Lettflix" },
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
  const { titles: allTitles } = useCmsTitles();
  const titles = useMemo(() => allTitles.filter((t) => t.kind === "Film"), [allTitles]);
  const [genre, setGenre] = useState("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const { items: progress } = useProgress();

  const featuredList = useMemo(() => {
    const feat = titles.filter((t) => t.featured);
    return feat.length ? feat : titles.slice(0, 1);
  }, [titles]);
  const [featIdx, setFeatIdx] = useState(0);
  useEffect(() => {
    if (featuredList.length < 2) return;
    const t = setInterval(() => setFeatIdx((i) => (i + 1) % featuredList.length), 6500);
    return () => clearInterval(t);
  }, [featuredList.length]);
  const featured = featuredList[Math.min(featIdx, featuredList.length - 1)];

  const filtered = useMemo(
    () =>
      titles.filter(
        (t) =>
          (genre === "All" || t.category === genre) &&
          (query === "" || t.title.toLowerCase().includes(query.toLowerCase()))
      ),
    [titles, genre, query]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const trending = titles.filter((t) => t.featured).slice(0, 8);
  const newReleases = [...titles].sort((a, b) => (b.year ?? 0) - (a.year ?? 0)).slice(0, 8);
  const titleById = new Map(titles.map((t) => [t.id, t] as const));
  const continueWatching = progress
    .map((p) => ({ p, t: titleById.get(p.titleId) }))
    .filter((x): x is { p: (typeof progress)[number]; t: NonNullable<ReturnType<typeof titleById.get>> } => !!x.t && x.p.positionPct > 0 && x.p.positionPct < 98);

  if (!featured) return <div className="min-h-screen bg-background"><SiteHeader /><main className="mx-auto max-w-[1480px] px-6 py-20"><h1 className="text-3xl font-bold">Movies</h1><p className="mt-4 text-muted-foreground">No published movies available yet.</p></main><SiteFooter /></div>;


  const resetPage = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader overlay />

      {/* FEATURED SPOTLIGHT */}
      <section className="relative border-b border-border overflow-hidden">
        <div className="absolute inset-0">
          {featuredList.map((f, i) => (
            <img
              key={f.id}
              src={f.hero || f.cover}
              alt=""
              className="absolute inset-0 size-full object-cover transition-opacity duration-1000"
              style={{ opacity: i === featIdx ? 0.6 : 0 }}
            />
          ))}
          <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
        </div>
        <div className="relative mx-auto max-w-[1480px] px-6 lg:px-10 pt-26 pb-14 lg:pt-30 lg:pb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-elevated/70 backdrop-blur border border-border text-[11px] sm:text-xs font-medium">
              <Sparkles className="size-3.5 text-accent" /> Featured Movie
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.06]">
              {featured.title}
            </h1>
            <div className="mt-3 flex items-center gap-2.5 text-xs sm:text-sm text-[color:var(--muted-foreground)]">
              <span className="px-2 py-0.5 rounded border border-border">{featured.rating}</span>
              <span>{featured.year}</span>
              <span>·</span>
              <span>{featured.duration}</span>
              <span>·</span>
              <span className="text-accent font-semibold">{featured.category}</span>
            </div>
            <p className="mt-3 text-xs sm:text-sm text-[color:var(--secondary-foreground)] max-w-xl line-clamp-3">
              {featured.synopsis}
            </p>
            <div className="mt-5 flex flex-row flex-wrap sm:flex-nowrap items-center gap-2.5">
              <Link
                to="/movies/$titleId"
                params={{ titleId: featured.id }}
                className="inline-flex shrink-0 items-center gap-2 px-4 sm:px-6 h-9 sm:h-10 rounded-md bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition"
              >
                <Play className="size-4 fill-current" strokeWidth={2.5} /> Watch Now
              </Link>
              <Link
                to="/movies/$titleId"
                params={{ titleId: featured.id }}
                className="inline-flex shrink-0 items-center gap-2 px-4 sm:px-6 h-9 sm:h-10 rounded-md bg-elevated/80 border border-border text-sm backdrop-blur hover:bg-elevated transition font-medium"
              >
                <Info className="size-4" /> More Info
              </Link>
            </div>

            {featuredList.length > 1 && (
              <div className="mt-8 flex gap-1.5">
                {featuredList.map((_, i) => (
                  <Button variant="ghost"
                    key={i}
                    aria-label={`Featured slide ${i + 1}`}
                    onClick={() => setFeatIdx(i)}
                    className={`h-1.5 rounded-full transition-all ${i === featIdx ? "w-6 bg-foreground" : "w-1.5 bg-foreground/40"}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {continueWatching.length > 0 && <Row title="Continue Watching" subtitle="Pick up where you left off.">
        {continueWatching.map(({ t }) => <TitleCard key={t.id} t={t} portrait={false} preview={false} />)}
      </Row>}

      {/* ROWS */}
      <Row title="Featured Movies">
        {trending.map((t, i) => (
          <TitleCard key={t.id} t={t} rank={i + 1} portrait={false} />
        ))}
      </Row>

      <Row title="Movies by release year">

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
          <div className="relative w-full sm:w-auto">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)]" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              aria-label="Search movies"
              placeholder="Search titles…"
              className="h-10 pl-9 pr-4 rounded-md bg-surface border border-border w-full sm:w-64 text-sm outline-none focus:border-accent transition"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <Filter className="size-4 text-[color:var(--muted-foreground)] shrink-0" />
            {["All", ...new Set(titles.map((t) => t.category).filter(Boolean))].map((g) => (
              <Button variant="ghost"
                key={g}
                onClick={() => resetPage(setGenre)(g)}
                className={`shrink-0 px-3 h-11 rounded-full text-sm border transition ${
                  genre === g
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-elevated/50 border-border text-[color:var(--secondary-foreground)] hover:text-foreground"
                }`}
              >
                {g}
              </Button>
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
            <p>No movies match your filters.</p>
            <Button variant="outline" className="mt-4 h-11" onClick={() => { setQuery(""); setGenre("All"); setPage(1); }}>Clear filters</Button>
          </div>
        )}

        <Pagination page={currentPage} totalPages={totalPages} onPage={setPage} />
      </section>

      <SiteFooter />
    </div>
  );
}
