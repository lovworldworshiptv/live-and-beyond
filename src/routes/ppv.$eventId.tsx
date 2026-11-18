import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { CalendarDays, Clock, Ticket } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { getPublicPpvEvent } from "@/lib/ppv.functions";
import { PpvPurchase } from "@/components/ppv-purchase";

const eventQuery = (id: string) => queryOptions({ queryKey: ["public-ppv-event", id], queryFn: () => getPublicPpvEvent({ data: { id } }), staleTime: 0 });
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
  return <div className="min-h-screen flex flex-col"><SiteHeader /><main className="flex-1">
    <section className="border-b border-border"><div className="mx-auto max-w-6xl px-6 py-8">
      {event.poster_url && <img src={event.poster_url} alt={event.title} className="mb-6 aspect-video max-h-[55dvh] w-full object-contain" />}
      <p className="flex items-center gap-2 text-sm font-semibold text-accent"><Ticket className="size-4" />Pay-Per-View · {event.channel_name}</p><h1 className="mt-3 break-words text-3xl font-bold">{event.title}</h1><p className="mt-4 max-w-3xl whitespace-pre-line text-muted-foreground">{event.description}</p>
    </div></section>
    <section className="mx-auto max-w-6xl px-6 py-6"><PpvPurchase key={eventId} eventId={eventId} salesOpen={event.salesOpen} /></section>
    <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-2"><div className="space-y-3"><p className="flex items-start gap-2"><CalendarDays className="size-5 shrink-0 text-accent" />{new Date(event.starts_at).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}</p><p className="flex gap-2"><Clock className="size-5 text-accent" />{event.duration_minutes} minutes · Standard access</p>{event.event_type !== "live" && <p className="text-sm text-muted-foreground">{event.event_type === "vod" ? `${event.rental_start_days} days to start · ${event.replay_hours} hours to finish` : `${event.replay_hours} hours of replay access`}</p>}<Button asChild variant="outline"><Link to="/channels/$channelId" params={{ channelId: event.channel_slug }}>View channel</Link></Button></div><div className="border-t border-border pt-4"><p className="text-lg font-semibold">{new Intl.NumberFormat(undefined, { style: "currency", currency: "NGN" }).format(event.price_ngn_minor / 100)} / {new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(event.price_usd_minor / 100)}</p><p className="mt-3 text-sm text-muted-foreground" role="status">Ticket sales are not yet open.</p><Button className="mt-4" disabled><Ticket />Sales not open</Button></div></section>
  </main><SiteFooter /></div>;
}