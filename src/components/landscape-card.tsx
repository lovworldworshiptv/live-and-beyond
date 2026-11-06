import { Link } from "@tanstack/react-router";
import type { Title } from "@/lib/catalog";

/** Netflix-style 16:9 tile: artwork, bold title on the image, optional badge and progress under it. */
export function LandscapeCard({ t, progressPct, badge }: { t: Title; progressPct?: number; badge?: string }) {
  return (
    <Link
      to="/movies/$titleId"
      params={{ titleId: t.id }}
      className="group shrink-0 snap-start w-[44vw] sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)] xl:w-[calc((100%-4rem)/5)] focus-visible:outline-none"
    >
      <div className="relative aspect-video overflow-hidden rounded-md bg-elevated ring-offset-2 ring-offset-background group-focus-visible:ring-2 group-focus-visible:ring-foreground">
        <img src={t.hero || t.cover} alt="" loading="lazy" className="size-full object-cover transition duration-300 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-transparent to-transparent" />
        <span className="absolute left-3 right-3 bottom-2.5 font-title uppercase text-xl sm:text-3xl leading-[0.9] tracking-wide line-clamp-2 drop-shadow-lg">{t.title}</span>
        {badge && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 rounded-t px-2 py-0.5 text-[11px] font-bold bg-primary text-primary-foreground whitespace-nowrap">{badge}</span>}
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
