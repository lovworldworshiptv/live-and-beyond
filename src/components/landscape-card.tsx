import { titleCase } from "@/lib/title-case";
import { Link } from "@tanstack/react-router";
import type { Title } from "@/lib/catalog";
import { MovieArtwork } from "./movie-artwork";

/** Netflix-style 16:9 tile: artwork, bold title on the image, optional badge and progress under it. */
export function LandscapeCard({ t, progressPct, badge }: { t: Title; progressPct?: number; badge?: string }) {
  return (
    <Link
      to="/movies/$titleId"
      params={{ titleId: t.id }}
      className="group min-w-0 shrink-0 snap-start w-[44vw] sm:w-[calc((100%_-_2rem)/3)] lg:w-[calc((100%_-_3rem)/4)] xl:w-[calc((100%_-_4rem)/5)] focus-visible:outline-none"
    >
      <div className="relative aspect-video overflow-hidden rounded-md bg-elevated ring-offset-2 ring-offset-background group-focus-visible:ring-2 group-focus-visible:ring-foreground">
        <MovieArtwork src={t.hero} fallbackSrc={t.cover} alt={t.title} loading="lazy" className="size-full object-cover transition duration-300 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-transparent to-transparent" />
        <span className={`absolute left-2 right-2 sm:left-3 sm:right-3 ${badge ? "bottom-6" : "bottom-2.5"} font-title font-bold text-xs sm:text-base lg:text-lg leading-[1.1] line-clamp-2 break-words drop-shadow-lg`}>{titleCase(t.title)}</span>
        {badge && <span className="absolute inset-x-1 bottom-0 rounded-t px-1 py-0.5 text-[9px] sm:text-[11px] font-bold bg-primary text-primary-foreground text-center truncate">{badge}</span>}
      </div>
      {progressPct !== undefined && (
        <div className="mx-auto mt-2 h-[3px] w-3/5 bg-foreground/70" aria-label={`${Math.round(progressPct)}% watched`}>
          <div className="h-full bg-primary" style={{ width: `${Math.max(3, progressPct)}%` }} />
        </div>
      )}
    </Link>
  );
}

export function NetflixRow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 sm:mt-10 px-4 sm:px-8 lg:px-12">
      <h2 className="mb-3 text-lg sm:text-2xl font-bold tracking-tight">{title}</h2>
      <div className="flex gap-2 sm:gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-2">{children}</div>
    </section>
  );
}
