import { useCallback, useEffect, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { BarChart3, Clock, Loader2, Play, Users } from "lucide-react";
import { fetchChannelAnalytics, type AnalyticsSummary } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";

export function AnalyticsPanel({ channelId }: { channelId: string }) {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [followers, setFollowers] = useState(0);
  const [range, setRange] = useState(14);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [summary, { count }] = await Promise.all([
      fetchChannelAnalytics(channelId, range),
      supabase.from("channel_follows").select("id", { count: "exact", head: true }).eq("channel_id", channelId),
    ]);
    setData(summary);
    setFollowers(count ?? 0);
    setLoading(false);
  }, [channelId, range]);

  useEffect(() => { load(); }, [load]);

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
      <div className="flex items-center gap-2">
        {[7, 14, 30].map((d) => (
          <button
            key={d}
            onClick={() => setRange(d)}
            className={`h-9 px-4 rounded-md text-sm font-medium transition ${
              range === d ? "bg-primary text-primary-foreground" : "bg-elevated border border-border hover:bg-elevated/70"
            }`}
          >
            {d} days
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-elevated/40 p-5">
            <div className="flex items-center justify-between text-[color:var(--muted-foreground)]">
              <span className="text-xs uppercase tracking-wider">{k.label}</span>
              <k.icon className="size-4" />
            </div>
            <div className="mt-2 text-3xl font-bold tracking-tight">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-elevated/40 p-5">
          <div className="text-sm font-semibold">Watch hours</div>
          <div className="text-xs text-[color:var(--muted-foreground)]">Real playback signals from your audience</div>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <AreaChart data={data.byDay}>
                <defs>
                  <linearGradient id="ah" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1E5EFF" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#1E5EFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1f2226" vertical={false} />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={11} />
                <YAxis stroke="#6b7280" fontSize={11} />
                <Tooltip contentStyle={{ background: "#111315", border: "1px solid #1f2226", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="hours" stroke="#1E5EFF" strokeWidth={2} fill="url(#ah)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-elevated/40 p-5">
          <div className="text-sm font-semibold">Hours by service</div>
          <div className="mt-4 h-64">
            {data.byService.length ? (
              <ResponsiveContainer>
                <BarChart data={data.byService}>
                  <CartesianGrid stroke="#1f2226" vertical={false} />
                  <XAxis dataKey="service" stroke="#6b7280" fontSize={11} />
                  <YAxis stroke="#6b7280" fontSize={11} />
                  <Tooltip contentStyle={{ background: "#111315", border: "1px solid #1f2226", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="hours" fill="#9C1533" radius={[6, 6, 0, 0]} />
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
