import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { BrandLoader } from "@/components/brand-loader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchViewStats, summarizeByService, type ViewStatRow } from "@/lib/analytics";

/** Verified views for one channel, or the whole platform when channelId is null (admins). */
export function VerifiedViews({ channelId, days }: { channelId: string | null; days: number }) {
  const [rows, setRows] = useState<ViewStatRow[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [error, setError] = useState(false);
  const load = async () => {
    setError(false); setRows(null);
    try {
      const r = await fetchViewStats(channelId, days);
      const titleIds = [...new Set(r.map((x) => x.title_id).filter(Boolean))] as string[];
      const chIds = channelId ? [] : ([...new Set(r.map((x) => x.channel_id).filter(Boolean))] as string[]);
      const [t, c] = await Promise.all([
        titleIds.length ? supabase.from("cms_titles").select("id,title").in("id", titleIds) : Promise.resolve({ data: [] as { id: string; title: string }[] }),
        chIds.length ? supabase.from("cms_channels").select("id,name").in("id", chIds) : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      ]);
      const map: Record<string, string> = {};
      (t.data ?? []).forEach((x: { id: string; title: string }) => { map[x.id] = x.title; });
      (c.data ?? []).forEach((x: { id: string; name: string }) => { map[x.id] = x.name; });
      setNames(map); setRows(r);
    } catch { setError(true); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, [channelId, days]);

  if (error) return <div role="alert" className="py-4"><p className="text-sm text-muted-foreground">Verified views could not be loaded.</p><Button variant="outline" className="mt-2 h-11" onClick={() => void load()}><RefreshCw />Try again</Button></div>;
  if (!rows) return <BrandLoader variant="section" label="Loading verified views" />;

  const g = summarizeByService(rows);
  const cards = [
    { label: "On-demand views", v: g.ondemand.views, s: g.ondemand.streams, h: g.ondemand.hours },
    { label: "Live TV views", v: g.tv.views, s: g.tv.streams, h: g.tv.hours },
    { label: "Radio listens", v: g.radio.views, s: g.radio.streams, h: g.radio.hours },
  ];
  const titles = rows.filter((r) => r.title_id).sort((a, b) => b.views - a.views || b.streams - a.streams).slice(0, 20);
  const channels = channelId ? [] : Object.entries(rows.reduce<Record<string, { views: number; streams: number }>>((acc, r) => {
    if (!r.channel_id) return acc;
    const e = (acc[r.channel_id] ??= { views: 0, streams: 0 }); e.views += r.views; e.streams += r.streams; return acc;
  }, {})).sort((a, b) => b[1].views - a[1].views);

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Verified views</h3>
        <p className="mt-1 text-xs text-muted-foreground">Counted like YouTube: a view needs at least 30 seconds of real playback, and each viewer counts once per video, channel or station per day. Streams are every press of play.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-border bg-elevated/40 p-4">
            <div className="text-xs uppercase text-muted-foreground">{c.label}</div>
            <div className="mt-1 text-3xl font-bold">{c.v.toLocaleString()}</div>
            <div className="mt-1 text-xs text-muted-foreground">{c.s.toLocaleString()} streams · {c.h.toFixed(1)} h</div>
          </div>
        ))}
      </div>
      {channels.length > 0 && <StatTable head="Channel" rows={channels.map(([id, v]) => ({ id, name: names[id] ?? "Unknown channel", ...v }))} />}
      {titles.length > 0 && <StatTable head="Video on demand" rows={titles.map((r) => ({ id: r.title_id!, name: names[r.title_id!] ?? "Removed title", views: r.views, streams: r.streams }))} />}
    </section>
  );
}

function StatTable({ head, rows }: { head: string; rows: { id: string; name: string; views: number; streams: number }[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="text-xs uppercase text-muted-foreground"><tr><th className="p-3 text-left">{head}</th><th className="p-3 text-right">Views</th><th className="p-3 text-right">Streams</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id} className="border-t border-border"><td className="p-3">{r.name}</td><td className="p-3 text-right font-semibold">{r.views.toLocaleString()}</td><td className="p-3 text-right text-muted-foreground">{r.streams.toLocaleString()}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
