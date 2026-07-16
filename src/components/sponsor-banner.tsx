import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, ArrowRight } from "lucide-react";
import { useCmsSponsors, useCmsEvents, type CmsSponsor, type CmsEvent } from "@/lib/cms-catalog";

type Slide =
  | { kind: "sponsor"; sponsor: CmsSponsor }
  | { kind: "event"; event: CmsEvent };

type Props = {
  placement: string;
  section?: string;
  channelId?: string;
  eventId?: string;
  /** Include events flagged is_sponsored (home only). */
  includeSponsoredEvents?: boolean;
  intervalMs?: number;
  className?: string;
};

export function SponsorBanner({
  placement,
  section,
  channelId,
  eventId,
  includeSponsoredEvents = false,
  intervalMs = 6000,
  className,
}: Props) {
  const { sponsors } = useCmsSponsors({ placement, section, channelId, eventId });
  const { events } = useCmsEvents(includeSponsoredEvents ? 24 : 0);

  const slides = useMemo<Slide[]>(() => {
    const s: Slide[] = sponsors.map((sp) => ({ kind: "sponsor", sponsor: sp }));
    if (includeSponsoredEvents) {
      events
        .filter((e) => e.isSponsored)
        .forEach((e) => s.push({ kind: "event", event: e }));
    }
    return s;
  }, [sponsors, events, includeSponsoredEvents]);

  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), intervalMs);
    return () => clearInterval(t);
  }, [slides.length, intervalMs]);

  useEffect(() => {
    if (idx >= slides.length) setIdx(0);
  }, [slides.length, idx]);

  if (slides.length === 0) return null;

  return (
    <section className={className ?? "mx-auto max-w-[1480px] px-6 lg:px-10 mt-14"}>
      <div className="relative overflow-hidden rounded-2xl border border-border h-[220px] md:h-[260px] lg:h-[300px]">
        {slides.map((slide, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === idx ? 1 : 0, pointerEvents: i === idx ? "auto" : "none" }}
          >
            {slide.kind === "sponsor" ? (
              <SponsorSlide sponsor={slide.sponsor} />
            ) : (
              <EventSlide event={slide.event} />
            )}
          </div>
        ))}
        {slides.length > 1 && (
          <div className="absolute bottom-3 right-4 flex gap-1.5 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-white" : "w-1.5 bg-white/40"}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function SponsorSlide({ sponsor }: { sponsor: CmsSponsor }) {
  return (
    <div className="relative w-full h-full">
      {sponsor.imageUrl ? (
        <>
          <img src={sponsor.imageUrl} alt={sponsor.name} className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 opacity-90" style={{ background: "var(--gradient-hero)" }} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(30,94,255,0.25),transparent_60%),radial-gradient(circle_at_80%_50%,rgba(156,21,51,0.35),transparent_60%)]" />
        </>
      )}
      <div className="relative h-full px-6 md:px-10 lg:px-14 flex flex-col justify-center gap-3 max-w-3xl">
        <div className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-white/80">
          Sponsored · {sponsor.name}
        </div>
        {sponsor.headline && (
          <h3 className="text-xl md:text-2xl lg:text-3xl font-display font-bold text-white leading-tight">
            {sponsor.headline}
          </h3>
        )}
        {sponsor.description && (
          <p className="text-sm md:text-base text-white/80 line-clamp-2">{sponsor.description}</p>
        )}
        {sponsor.ctaUrl && sponsor.ctaLabel && (
          <div>
            <a
              href={sponsor.ctaUrl}
              target={sponsor.ctaUrl.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 h-10 rounded-md bg-white text-background font-semibold hover:bg-white/90 transition text-sm"
            >
              {sponsor.ctaLabel} <ArrowRight className="size-4" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function EventSlide({ event }: { event: CmsEvent }) {
  const d = new Date(event.startsAt);
  const date = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="relative w-full h-full">
      {event.coverUrl ? (
        <>
          <img src={event.coverUrl} alt={event.name} className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 opacity-90" style={{ background: "var(--gradient-hero)" }} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(30,94,255,0.25),transparent_60%),radial-gradient(circle_at_80%_50%,rgba(156,21,51,0.35),transparent_60%)]" />
        </>
      )}
      <div className="relative h-full px-6 md:px-10 lg:px-14 flex flex-col justify-center gap-3 max-w-3xl">
        <div className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-white/80">
          Featured Event
        </div>
        <h3 className="text-xl md:text-2xl lg:text-3xl font-display font-bold text-white leading-tight">
          {event.name}
        </h3>
        <p className="text-sm md:text-base text-white/80">
          {date} · {time}
          {event.description ? ` — ${event.description}` : ""}
        </p>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-4 h-10 rounded-md bg-white text-background font-semibold hover:bg-white/90 transition text-sm">
            <Bell className="size-4" /> Notify Me
          </button>
          <button className="inline-flex items-center gap-2 px-4 h-10 rounded-md bg-black/40 border border-white/20 backdrop-blur text-white font-medium hover:bg-black/60 transition text-sm">
            <CalendarDays className="size-4" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
