import { PpvCountdownBlocks } from "@/components/ppv-events";
import brandArt from "@/assets/auth-cinema.jpg";
import { ShareMenu } from "@/components/share-menu";
import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { CalendarDays, Clock, MonitorPlay, ShieldCheck, Ticket } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { getPublicPpvEvent } from "@/lib/ppv.functions";
import { PpvPurchase } from "@/components/ppv-purchase";

const eventQuery = (id: string) => queryOptions({ queryKey: ["public-ppv-event", id], queryFn: () => getPublicPpvEvent({ data: { id } }), staleTime: 0, refetchInterval: 1000 });
export const Route = createFileRoute("/ppv/$eventId")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(eventQuery(params.eventId)),
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.title} — PPV on Lettflix` : "PPV Event — Lettflix";
    const description = loaderData?.description || "Premium channel events on Lettflix. Ticket sales are not yet open.";
    const image = loaderData?.poster_url;
    return { meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, ...(image?.startsWith("https://") ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : [])] };
  },
  component: EventPage,
});
function EventPage() {
  const { eventId } = Route.useParams();
  const { data: event } = useSuspenseQuery(eventQuery(eventId));
  if (!event) return <div className="min-h-screen flex flex-col"><SiteHeader /><main className="flex-1 mx-auto w-full max-w-5xl px-6 py-20"><h1 className="text-2xl font-bold">Event unavailable</h1><p className="mt-3 text-muted-foreground">This PPV event is not currently available.</p><Button asChild variant="outline" className="mt-6"><Link to="/">Back to Home</Link></Button></main><SiteFooter /></div>;
  const money = (currency: string, minor: number) => new Intl.NumberFormat(undefined, { style: "currency", currency }).format(minor / 100);
  const salesPending = Boolean(event.sales_starts_at && Date.parse(event.sales_starts_at) > Date.now());
  const access = event.event_type === "live" ? "Live access" : event.event_type === "vod" ? `${event.rental_start_days} days to start · ${event.replay_hours} hours to finish` : `Live plus ${event.replay_hours} hours of replay`;
  return <div className="min-h-screen flex flex-col"><SiteHeader /><main className="flex-1">
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-[auto_1fr] lg:gap-y-6 lg:py-10">
      <div className="min-w-0">
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <img src={event.poster_url || brandArt} alt={event.title} className="aspect-video w-full object-contain" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = brandArt; }} />
        </div>
        <div className="mt-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-accent"><Ticket className="size-4 shrink-0" />Pay-Per-View</p>
            <h1 className="mt-2 break-words text-2xl font-bold sm:text-3xl">{event.title}</h1>
            <Link to="/channels/$channelId" params={{ channelId: event.channel_slug }} className="mt-1 inline-block text-sm text-muted-foreground hover:text-foreground">by {event.channel_name}</Link>
          </div>
          <ShareMenu title={event.title} path={`/ppv/${eventId}`} image={event.poster_url} subtitle={`Pay-Per-View · ${event.channel_name}`} />
        </div>
      </div>
      <div className="order-3 min-w-0 lg:order-none lg:col-start-1">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border p-3"><dt className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="size-4 text-accent" />Date</dt><dd className="mt-1 text-sm font-medium">{new Date(event.starts_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</dd></div>
          <div className="rounded-lg border border-border p-3"><dt className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="size-4 text-accent" />Duration</dt><dd className="mt-1 text-sm font-medium">{event.duration_minutes} minutes</dd></div>
          <div className="col-span-2 rounded-lg border border-border p-3 sm:col-span-1"><dt className="flex items-center gap-2 text-xs text-muted-foreground"><MonitorPlay className="size-4 text-accent" />Access</dt><dd className="mt-1 text-sm font-medium">{access}</dd></div>
        </dl>
        {event.description && event.description.trim() !== event.title.trim() && <div className="mt-6"><h2 className="text-lg font-semibold">About this event</h2><p className="mt-2 max-w-prose whitespace-pre-line text-muted-foreground">{event.description}</p></div>}
      </div>
      <aside className="order-2 lg:order-none lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-24 lg:self-start">
        <div className="space-y-5 rounded-xl border border-border bg-elevated p-5">
          <div>
            <p className="text-xs text-muted-foreground">Ticket price</p>
            <p className="mt-1 text-2xl font-bold">{money("NGN", event.price_ngn_minor)}</p>
            <p className="text-sm text-muted-foreground">or {money("USD", event.price_usd_minor)}</p>
          </div>
          {salesPending && event.sales_starts_at
            ? <PpvCountdownBlocks startsAt={event.sales_starts_at} label="Tickets go on sale in" />
            : <PpvCountdownBlocks startsAt={event.starts_at} label="Event starts in" />}
          <PpvPurchase key={eventId} eventId={eventId} salesOpen={event.salesOpen} />
          <ul className="space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
            <li className="flex gap-2"><ShieldCheck className="size-4 shrink-0 text-accent" />Secure checkout with Squad</li>
            <li className="flex gap-2"><MonitorPlay className="size-4 shrink-0 text-accent" />One active screen per ticket</li>
            <li className="flex gap-2"><CalendarDays className="size-4 shrink-0 text-accent" />Buy now or on the day of the event</li>
          </ul>
        </div>
      </aside>
    </div>
  </main><SiteFooter /></div>;
}