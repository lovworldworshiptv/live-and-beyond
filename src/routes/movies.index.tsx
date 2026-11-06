import { titleCase } from "@/lib/title-case";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Play, Info } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LandscapeCard, NetflixRow } from "@/components/landscape-card";
import { useCmsTitles } from "@/lib/cms-catalog";
import { useProgress } from "@/lib/personal";
import { useViewerProfiles } from "@/lib/viewer-profiles";
import { useAccountProfile } from "@/lib/account-profile";

export const Route = createFileRoute("/movies/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Movies — Lettflix" },
      { name: "description", content: "Discover and watch the published movie catalogue on Lettflix." },
      { property: "og:title", content: "Movies — Lettflix" },
      { property: "og:description", content: "Films, concerts and documentaries on demand from Lettflix." },
    ],
  }),
  component: Movies,
});

function Movies() {
  const { titles: all } = useCmsTitles();
  const titles = useMemo(() => all.filter((t) => t.kind === "Film"), [all]);
  const { items: progress } = useProgress();
  const { active } = useViewerProfiles();
  const { profile: account } = useAccountProfile();
  const viewer = active?.name || account?.display_name;

  const featuredList = useMemo(() => {
    const f = titles.filter((t) => t.featured);
    return f.length ? f : titles.slice(0, 1);
  }, [titles]);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (featuredList.length < 2) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % featuredList.length), 8000);
    return () => clearInterval(id);
  }, [featuredList.length]);
  const featured = featuredList[Math.min(idx, featuredList.length - 1)];

  const byId = new Map(titles.map((t) => [t.id, t] as const));
  const continuing = progress.flatMap((p) => {
    const t = byId.get(p.titleId);
    return t && p.positionPct > 0 && p.positionPct < 98 ? [{ t, pct: p.positionPct }] : [];
  });
  const newest = [...titles].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  const topYear = newest[0]?.year;
  const categories = [...new Set(titles.map((t) => t.category))].filter(Boolean);

  if (!featured)
    return (
      <div className="min-h-screen bg-background"><SiteHeader />
        <main className="mx-auto max-w-[1480px] px-6 py-20"><h1 className="text-3xl font-bold">Movies</h1><p className="mt-4 text-muted-foreground">No published movies available yet.</p></main>
        <SiteFooter /></div>
    );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader overlay />

      <section className="relative h-[72vh] min-h-[460px] max-h-[820px] overflow-hidden">
        {featuredList.map((f, i) => (
          <img key={f.id} src={f.hero || f.cover} alt="" className="absolute inset-0 size-full object-cover transition-opacity duration-1000" style={{ opacity: i === idx ? 1 : 0 }} />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
        <div className="relative h-full flex items-end px-4 sm:px-8 lg:px-12 pb-16 sm:pb-24">
          <div className="max-w-xl">
            <h1 className="font-title font-bold text-5xl sm:text-7xl leading-[0.95] drop-shadow-lg">{titleCase(featured.title)}</h1>
            <p className="mt-4 text-sm text-foreground/85">Film · {featured.category} · {featured.year} · {featured.duration} <span className="ml-1 rounded border border-foreground/50 px-1.5 text-xs">{featured.rating}</span></p>
            <p className="mt-3 hidden sm:block text-base text-foreground/85 line-clamp-3">{featured.synopsis}</p>
            <div className="mt-6 flex gap-3">
              <Link to="/movies/$titleId" params={{ titleId: featured.id }} className="inline-flex items-center gap-2 h-11 px-6 sm:px-8 rounded bg-foreground text-background font-bold hover:bg-foreground/80"><Play className="size-5 fill-current" />Play</Link>
              <Link to="/movies/$titleId" params={{ titleId: featured.id }} className="inline-flex items-center gap-2 h-11 px-6 rounded bg-muted-foreground/40 backdrop-blur font-bold hover:bg-muted-foreground/30"><Info className="size-5" />More info</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="relative -mt-14 sm:-mt-20 pb-16">
        {continuing.length > 0 && (
          <NetflixRow title={viewer ? `Continue watching for ${viewer}` : "Continue watching"}>
            {continuing.map(({ t, pct }) => <LandscapeCard key={t.id} t={t} progressPct={pct} />)}
          </NetflixRow>
        )}
        <NetflixRow title="New on Lettflix">
          {newest.slice(0, 12).map((t) => <LandscapeCard key={t.id} t={t} badge={t.year === topYear ? "Recently added" : undefined} />)}
        </NetflixRow>
        {featuredList.length > 1 && (
          <NetflixRow title="Featured films">
            {featuredList.map((t) => <LandscapeCard key={t.id} t={t} />)}
          </NetflixRow>
        )}
        {categories.map((c) => (
          <NetflixRow key={c} title={c}>
            {titles.filter((t) => t.category === c).map((t) => <LandscapeCard key={t.id} t={t} />)}
          </NetflixRow>
        ))}
      </div>
      <SiteFooter />
    </div>
  );
}
