import { useEffect, useState } from "react";
import { Eye, MapPin, MousePointerClick, Radio, Share2, Users, Video } from "lucide-react";
import { BrandLoader } from "@/components/brand-loader";
import { countryName, fetchAudience, summarizeAudience, type AudienceSummary } from "@/lib/audience";

/** Visits, live clicks/streams, on-demand views and visitor locations for a channel, a creator, or the whole platform. */
export function AudienceReach({ channelId, creatorId, days = 30, title = "Audience reach" }: { channelId?: string; creatorId?: string; days?: number; title?: string }) {
  const [s, setS] = useState<AudienceSummary | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    setS(null); setError(false);
    fetchAudience({ channelId, creatorId }, days).then((r) => setS(summarizeAudience(r))).catch(() => setError(true));
  }, [channelId, creatorId, days]);

  if (error) return <p role="alert" className="text-sm text-muted-foreground">Audience reach could not be loaded.</p>;
  if (!s) return <BrandLoader variant="section" label="Loading audience" />;

  const kpis = [
    { label: "Visits", value: s.visits, icon: Eye },
    { label: "Unique visitors", value: s.uniqueVisitors, icon: Users },
    { label: "Live clicks", value: s.liveClicks, icon: MousePointerClick },
    { label: "Live streams", value: s.liveStreams, icon: Radio },
    { label: "On-demand views", value: s.vodViews, icon: Video },
    { label: "Shared link opens", value: s.shareOpens, icon: Share2 },
  ];
  const max = Math.max(1, ...s.locations.map((l) => l.count));

  return (
    <section className="space-y-4 min-w-0">
      <div><h2 className="text-xl font-semibold">{title}</h2><p className="mt-1 text-xs text-muted-foreground">Last {days} days · Locations are approximate (city and country)</p></div>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.label} className="min-w-0 rounded-lg border border-border bg-elevated/40 p-4">
            <div className="flex items-center justify-between gap-2 text-muted-foreground"><span className="truncate text-xs uppercase">{k.label}</span><k.icon className="size-4 shrink-0" /></div>
            <div className="mt-2 text-2xl font-bold">{k.value.toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="min-w-0 rounded-lg border border-border bg-elevated/40 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold"><MapPin className="size-4" />Top cities</div>
          {s.locations.length ? (
            <ul className="mt-4 space-y-3">
              {s.locations.map((l) => {
                const [city, cc] = l.place.includes(", ") ? l.place.split(", ") : [null, l.place];
                return (
                  <li key={l.place} className="min-w-0">
                    <div className="flex justify-between gap-3 text-sm"><span className="truncate">{city ? `${city}, ${countryName(cc)}` : countryName(cc)}</span><span className="tabular-nums text-muted-foreground">{l.count}</span></div>
                    <div className="mt-1 h-1.5 rounded-full bg-border"><div className="h-full rounded-full bg-primary" style={{ width: `${(l.count / max) * 100}%` }} /></div>
                  </li>
                );
              })}
            </ul>
          ) : <p className="mt-4 text-sm text-muted-foreground">No visitors recorded yet.</p>}
        </div>
        <div className="min-w-0 rounded-lg border border-border bg-elevated/40 p-5">
          <div className="text-sm font-semibold">Countries</div>
          {s.countries.length ? (
            <ul className="mt-4 divide-y divide-border">
              {s.countries.map((c) => <li key={c.country} className="flex justify-between gap-3 py-2 text-sm"><span className="truncate">{countryName(c.country)}</span><span className="tabular-nums text-muted-foreground">{c.count}</span></li>)}
            </ul>
          ) : <p className="mt-4 text-sm text-muted-foreground">No locations yet.</p>}
        </div>
      </div>
    </section>
  );
}
