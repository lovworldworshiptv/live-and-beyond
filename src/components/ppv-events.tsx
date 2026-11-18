import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Ticket } from "lucide-react";
import { publicPpvEventsQuery, type PublicPpvEvent } from "@/lib/ppv-discovery-query";
import { matchesPpvSearch, PPV_CATEGORY, ppvCountdownParts } from "@/lib/ppv-discovery";
import { Button } from "@/components/ui/button";
import { ShareMenu } from "@/components/share-menu";
import { Row } from "@/components/row";
import brandArt from "@/assets/auth-cinema.jpg";

export function PpvCountdown({ startsAt }: { startsAt: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, [startsAt]);
  if (now === null) return <p className="min-h-5 text-xs text-muted-foreground">Event countdown</p>;
  if (Date.parse(startsAt) <= now) return <p className="min-h-5 text-xs font-semibold text-accent">Start time reached</p>;
  const parts = ppvCountdownParts(startsAt, now);
  return <p aria-label="Time until event" className="min-h-5 font-mono text-xs tabular-nums text-accent">{parts.days}d · {String(parts.hours).padStart(2, "0")}h · {String(parts.minutes).padStart(2, "0")}m · {String(parts.seconds).padStart(2, "0")}s</p>;
}

function PpvEventCard({ event, rail }: { event: PublicPpvEvent; rail: boolean }) {
  return <article className={`min-w-0 overflow-hidden rounded-lg border border-border bg-elevated ${rail ? "w-[260px] shrink-0 snap-start sm:w-[320px]" : ""}`}>
    <Link to="/ppv/$eventId" params={{ eventId: event.id }} className="relative block aspect-video overflow-hidden bg-background">
      <img src={event.poster_url || brandArt} alt={event.title} loading="lazy" className="size-full object-contain" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = brandArt; }} />
      <span className="absolute left-2 top-2 rounded bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground">{PPV_CATEGORY}</span>
    </Link>
    <div className="space-y-2 p-4">
      <p className="truncate text-xs text-muted-foreground">{event.channel_name}</p>
      <Link to="/ppv/$eventId" params={{ eventId: event.id }} className="block min-h-12 break-words text-base font-semibold line-clamp-2">{event.title}</Link>
      <p className="text-xs text-muted-foreground">{new Date(event.starts_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}</p>
      <PpvCountdown startsAt={event.starts_at} />
      <p className="text-sm font-semibold">{new Intl.NumberFormat(undefined, { style: "currency", currency: "NGN" }).format(event.price_ngn_minor / 100)}</p>
      <div className="grid grid-cols-[minmax(0,1fr)_40px] items-center gap-2 pt-1">
        <Button asChild className="h-10 text-xs"><Link to="/ppv/$eventId" params={{ eventId: event.id }}><Ticket className="size-4" />{event.sales_open ? "Get access" : "Event details"}</Link></Button>
        <ShareMenu title={event.title} path={`/ppv/${event.id}`} image={event.poster_url} subtitle={`${PPV_CATEGORY} · ${event.channel_name}`} />
      </div>
    </div>
  </article>;
}

export function PpvEvents({ channelSlug, query = "", layout = "grid", showEmpty = false }: { channelSlug?: string; query?: string; layout?: "grid" | "rail"; showEmpty?: boolean }) {
  const result = useQuery(publicPpvEventsQuery);
  const events = (result.data ?? []).filter(event => matchesPpvSearch(event, query, channelSlug));
  if (!events.length) return showEmpty ? <section className="mt-8"><h2 className="text-xl font-semibold">{PPV_CATEGORY}</h2><p role="status" className="mt-4 text-sm text-muted-foreground">{result.isPending ? "Loading events…" : result.isError ? "Events could not be loaded. Please try again." : "No Pay-Per-View events available."}</p></section> : null;
  if (layout === "rail") return <Row title={PPV_CATEGORY}>{events.map(event => <PpvEventCard key={event.id} event={event} rail />)}</Row>;
  return <section className="mt-10"><h2 className="flex items-center gap-2 text-xl font-semibold"><Ticket className="size-5 text-accent" />{PPV_CATEGORY}</h2><div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{events.map(event => <PpvEventCard key={event.id} event={event} rail={false} />)}</div></section>;
}
