import { useCallback, useEffect, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { BarChart3, Clock, Loader2, Play, Users, RefreshCw } from "lucide-react";
import { fetchChannelAnalytics, type AnalyticsSummary } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function AnalyticsPanel({ channelId }: { channelId: string }) {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [followers, setFollowers] = useState(0);
  const [range, setRange] = useState(14);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updated, setUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [summary, followersResult] = await Promise.all([
        fetchChannelAnalytics(channelId, range),
        supabase.from("channel_follows").select("id", { count: "exact", head: true }).eq("channel_id", channelId),
      ]);
      if (followersResult.error) throw followersResult.error;
      setData(summary);
      setFollowers(followersResult.count ?? 0);
      setUpdated(new Date());
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [channelId, range]);

  useEffect(() => { load(); }, [load]);

  if (error) return <div role="alert" className="py-8 border-y border-border"><p className="text-sm text-muted-foreground">Analytics could not be loaded. No estimated metrics are shown.</p><Button variant="outline" className="mt-3 h-11" onClick={() => void load()}><RefreshCw />Try again</Button></div>;
  if (loading || !data) {
    return <div className="py-20 grid place-items-center"><Loader2 className="size-5 animate-spin text-primary" /></div>;
  }

  const kpis = [
    { label: "Watch hours", value: data.watchHours.toFixed(1), icon: Clock },
    { label: "Plays", value: data.plays.toLocaleString(), icon: Play },
    { label: "Unique sessions", value: data.uniqueViewers.toLocaleString(), icon: Users },
    { label: "Followers", value: followers.toLocaleString(), icon: BarChart3 },
  ];

  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-semibold">Audience snapshot</h2><p className="mt-1 text-xs text-muted-foreground">{updated ? `${new Date(updated.getTime() - range * 86400000).toLocaleDateString()} – ${updated.toLocaleDateString()} · Updated ${updated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""} · Not a live viewer count</p><p className="mt-1 text-xs text-muted-foreground">Playback metrics cover this period; followers are the current total. Up to 10,000 playback events.</p></div>
      <div className="flex items-center gap-2">
        {[7, 14, 30].map((d) => (
          <Button variant="ghost"
            key={d}
             aria-pressed={range === d}
            onClick={() => setRange(d)}
            className={`h-11 px-4 rounded-md text-sm font-medium transition ${
              range === d ? "bg-primary text-primary-foreground" : "bg-elevated border border-border hover:bg-elevated/70"
            }`}
          >
            {d} days
          </Button>
        ))}
      </div>

      <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-lg border border-border bg-elevated/40 p-5">
            <div className="flex items-center justify-between text-[color:var(--muted-foreground)]">
              <span className="text-xs uppercase ">{k.label}</span>
              <k.icon className="size-4" />
            </div>
            <div className="mt-2 text-3xl font-bold ">{k.value}</div>
          </div>
        ))}
      </div>

      {data.plays === 0 && data.watchHours === 0 && <p className="text-sm text-muted-foreground border-y border-border py-4">No playback recorded in this period yet.</p>}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border border-border bg-elevated/40 p-5">
          <div className="text-sm font-semibold">Watch hours</div>
          <div className="text-xs text-[color:var(--muted-foreground)]">Real playback signals from your audience</div>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <AreaChart data={data.byDay}>
                <defs>
                  <linearGradient id="ah" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="hours" stroke="var(--accent)" strokeWidth={2} fill="url(#ah)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-elevated/40 p-5">
          <div className="text-sm font-semibold">Hours by service</div>
          <div className="mt-4 h-64">
            {data.byService.length ? (
              <ResponsiveContainer>
                <BarChart data={data.byService}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="service" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="hours" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[color:var(--muted-foreground)]">
                No playback recorded yet in this window.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
