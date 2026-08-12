import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Play, Search, Info, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Row } from "@/components/row";
import { TitleCard } from "@/components/title-card";
import { Pagination } from "@/components/pagination";
import { SponsorBanner } from "@/components/sponsor-banner";
import { useCmsTitles } from "@/lib/cms-catalog";
import type { Title } from "@/lib/catalog";

const PAGE_SIZE = 12;

export type CatalogBrowseProps = {
  kinds: Title["kind"][];
  eyebrow: string;
  heading: string;
  subheading: string;
  /** Card shape for the main grid. */
  shape?: "portrait" | "landscape" | "square";
  placement?: string;
};

export function CatalogBrowse({
  kinds,
  eyebrow,
  heading,
  subheading,
  shape = "portrait",
  placement = "movies",
}: CatalogBrowseProps) {
  const { titles: all } = useCmsTitles();
  const titles = useMemo(() => all.filter((t) => kinds.includes(t.kind)), [all, kinds]);

  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All");
  const [page, setPage] = useState(1);

  const genreList = useMemo(
    () => ["All", ...Array.from(new Set(titles.map((t) => t.category))).sort()],
    [titles],
  );

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
          (query === "" || t.title.toLowerCase().includes(query.toLowerCase())),
      ),
    [titles, genre, query],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const trending = titles.slice(0, 8);
  const newest = [...titles].reverse().slice(0, 8);

  const gridClass =
    shape === "square"
      ? "grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      : shape === "landscape"
        ? "grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        : "grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* FEATURED SPOTLIGHT */}
      <section className="relative border-b border-border overflow-hidden">
        <div className="absolute inset-0 -z-10">
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
        <div className="mx-auto max-w-[1480px] px-6 lg:px-10 pt-10 pb-14 lg:pt-14 lg:pb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-elevated/70 backdrop-blur border border-border text-[11px] sm:text-xs font-medium">
              <Sparkles className="size-3.5 text-accent" /> {eyebrow}
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.06]">
              {featured ? featured.title : heading}
            </h1>
            {featured ? (
              <>
                <div className="mt-3 flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-[color:var(--muted-foreground)]">
                  {featured.rating && <span className="px-2 py-0.5 rounded border border-border">{featured.rating}</span>}
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
                    className="inline-flex shrink-0 items-center gap-2 px-4 sm:px-6 h-9 sm:h-10 rounded-md bg-white text-background text-sm font-semibold hover:bg-white/90 transition"
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
              </>
            ) : (
              <p className="mt-3 text-xs sm:text-sm text-[color:var(--secondary-foreground)]">{subheading}</p>
            )}
            {featuredList.length > 1 && (
              <div className="mt-6 flex gap-1.5">
                {featuredList.map((_, i) => (
                  <button
                    key={i}
                    aria-label={`Featured slide ${i + 1}`}
                    onClick={() => setFeatIdx(i)}
                    className={`h-1.5 rounded-full transition-all ${i === featIdx ? "w-6 bg-white" : "w-1.5 bg-white/40"}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>


      {trending.length > 0 && (
        <Row title={`Trending ${heading}`} subtitle="Most watched across the network this week.">
          {trending.map((t, i) => (
            <TitleCard key={t.id} t={t} rank={i + 1} portrait={shape === "portrait"} />
          ))}
        </Row>
      )}

      <SponsorBanner placement={placement} />

      {newest.length > 0 && (
        <Row title="New & Recently Added" subtitle="Fresh drops, straight from our creators.">
          {newest.map((t) => (
            <TitleCard key={t.id} t={t} portrait={shape === "portrait"} />
          ))}
        </Row>
      )}

      {/* LIBRARY */}
      <section className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-10 mt-14 mb-16">
        <div className="flex items-end justify-between mb-5 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">All {heading}</h2>
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
              placeholder={`Search ${heading.toLowerCase()}…`}
              className="h-10 pl-9 pr-4 rounded-md bg-surface border border-border w-full sm:w-64 text-sm outline-none focus:border-accent transition"
            />
          </div>
        </div>

        {genreList.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            {genreList.map((g) => (
              <button
                key={g}
                onClick={() => {
                  setGenre(g);
                  setPage(1);
                }}
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
        )}

        <div className={`mt-6 ${gridClass}`}>
          {pageItems.map((t) => (
            <TitleCard key={t.id} t={t} portrait={shape === "portrait"} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-24 text-[color:var(--muted-foreground)]">
            Nothing here yet — check back soon.
          </div>
        )}

        <Pagination page={currentPage} totalPages={totalPages} onPage={setPage} />
      </section>

      <SiteFooter />
    </div>
  );
}
