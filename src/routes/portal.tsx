import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  BarChart3,
  DollarSign,
  Users,
  Play,
  TrendingUp,
  Upload,
  Radio,
  Calendar,
  Settings,
  Sparkles,
  Loader2,
  ShieldOff,
  Pencil,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ChannelEditor, type Channel } from "@/routes/admin";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "Creator & Channel Portal — Lettflix" },
      {
        name: "description",
        content:
          "Publish, program and monetise on Lettflix. The performance-based creator dashboard for channels, series and podcasts.",
      },
    ],
  }),
  component: PortalPage,
});


const watchData = Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`,
  hours: 1200 + Math.round(Math.sin(i / 2) * 400 + Math.random() * 300),
}));

const revenueData = [
  { m: "Jan", ad: 4200, sub: 3100 },
  { m: "Feb", ad: 4800, sub: 3400 },
  { m: "Mar", ad: 5100, sub: 3900 },
  { m: "Apr", ad: 6200, sub: 4500 },
  { m: "May", ad: 7100, sub: 5200 },
  { m: "Jun", ad: 8400, sub: 6100 },
];

function PortalPage() {
  const { user, isAdmin, isCreator, loading } = useAuth();
  const navigate = useNavigate();
  const [myChannel, setMyChannel] = useState<Partial<Channel> | null>(null);
  const [editing, setEditing] = useState<Partial<Channel> | null>(null);

  const loadChannel = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("cms_channels")
      .select("*")
      .eq("creator_id", user.id)
      .maybeSingle();
    if (data) setMyChannel(data as unknown as Channel);
  }, [user]);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth", search: { redirect: "/portal" }, replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user || !isCreator) return;
    loadChannel();
  }, [user, isCreator, loadChannel]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!myChannel) return;
    if (sessionStorage.getItem("lettflix.completeChannel") === "1") {
      sessionStorage.removeItem("lettflix.completeChannel");
      setEditing(myChannel);
    }
  }, [myChannel]);

  async function saveChannel(v: Partial<Channel>) {
    if (!user) return;
    const payload = { ...v, creator_id: user.id };
    if (v.id) {
      const { error } = await supabase.from("cms_channels").update(payload as never).eq("id", v.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("cms_channels").insert(payload as never);
      if (error) return toast.error(error.message);
    }
    toast.success("Channel profile saved");
    setEditing(null);
    loadChannel();
  }


  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isCreator && !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 grid place-items-center px-6">
          <div className="max-w-md text-center py-24">
            <ShieldOff className="size-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold">Creator access required</h1>
            <p className="text-sm text-[color:var(--muted-foreground)] mt-2">
              The Creator Portal is available to approved creators and administrators. Contact an admin to request access.
            </p>
            <Link to="/" className="mt-6 inline-flex h-10 px-5 items-center rounded-md bg-primary text-primary-foreground font-semibold text-sm">
              Back to Home
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />


      <section className="border-b border-border">
        <div className="mx-auto max-w-[1480px] px-6 lg:px-10 pt-12 pb-8">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-elevated/70 border border-border text-xs font-medium">
                <Sparkles className="size-3.5 text-accent" /> Creator Portal
              </div>
              <h1 className="mt-5 text-4xl lg:text-5xl font-extrabold tracking-tight">
                Your channel, on a broadcast stage
              </h1>
              <p className="mt-3 text-[color:var(--secondary-foreground)] max-w-2xl">
                Publish content, program your live schedule and track performance-based
                revenue in real time.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="h-11 px-5 rounded-md bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition inline-flex items-center gap-2">
                <Upload className="size-4" /> Upload
              </button>
              <button className="h-11 px-5 rounded-md bg-elevated border border-border font-medium hover:bg-elevated/70 transition inline-flex items-center gap-2">
                <Radio className="size-4" /> Go Live
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* KPI cards */}
      <section className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Watch hours (7d)", value: "48,213", delta: "+12.4%", icon: Play },
            { label: "Unique viewers", value: "128.9K", delta: "+8.1%", icon: Users },
            { label: "Revenue (MTD)", value: "$14,532", delta: "+18.7%", icon: DollarSign },
            { label: "Engagement", value: "72%", delta: "+3.2%", icon: TrendingUp },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-2xl border border-border bg-elevated/40 p-5"
            >
              <div className="flex items-center justify-between text-[color:var(--muted-foreground)]">
                <span className="text-xs uppercase tracking-wider">{k.label}</span>
                <k.icon className="size-4" />
              </div>
              <div className="mt-2 text-3xl font-bold tracking-tight">{k.value}</div>
              <div className="mt-1 text-xs text-emerald-400 font-medium">{k.delta} vs last period</div>
            </div>
          ))}
        </div>
      </section>

      {/* Charts */}
      <section className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-elevated/40 p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Watch hours</div>
              <div className="text-xs text-[color:var(--muted-foreground)]">
                Last 14 days
              </div>
            </div>
            <BarChart3 className="size-4 text-[color:var(--muted-foreground)]" />
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <AreaChart data={watchData}>
                <defs>
                  <linearGradient id="wh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1E5EFF" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#1E5EFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1f2226" vertical={false} />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={11} />
                <YAxis stroke="#6b7280" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "#111315",
                    border: "1px solid #1f2226",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="hours"
                  stroke="#1E5EFF"
                  strokeWidth={2}
                  fill="url(#wh)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-elevated/40 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Revenue split</div>
              <div className="text-xs text-[color:var(--muted-foreground)]">
                Ads + subscription share
              </div>
            </div>
            <DollarSign className="size-4 text-[color:var(--muted-foreground)]" />
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <BarChart data={revenueData}>
                <CartesianGrid stroke="#1f2226" vertical={false} />
                <XAxis dataKey="m" stroke="#6b7280" fontSize={11} />
                <YAxis stroke="#6b7280" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "#111315",
                    border: "1px solid #1f2226",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="ad" stackId="a" fill="#650606" radius={[0, 0, 0, 0]} />
                <Bar dataKey="sub" stackId="a" fill="#1E5EFF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Management */}
      <section className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-6 mb-16 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-elevated/40 p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold">Recent uploads</div>
            <button className="text-xs text-accent hover:underline">Manage all</button>
          </div>
          <div className="divide-y divide-border">
            {[
              { t: "Sunday Service — Episode 42", s: "Published", v: "24.1K", r: "$412" },
              { t: "Studio Sessions Live", s: "Scheduled", v: "—", r: "—" },
              { t: "Behind the Camera: Ep 3", s: "Processing", v: "—", r: "—" },
              { t: "Faith Talks: The Vision", s: "Published", v: "88.4K", r: "$1,204" },
            ].map((u) => (
              <div key={u.t} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{u.t}</div>
                  <div className="text-xs text-[color:var(--muted-foreground)]">
                    Status: <span className="text-foreground">{u.s}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-xs text-[color:var(--muted-foreground)]">
                  <div>
                    <div className="uppercase tracking-wider">Views</div>
                    <div className="text-foreground font-semibold text-sm">{u.v}</div>
                  </div>
                  <div>
                    <div className="uppercase tracking-wider">Revenue</div>
                    <div className="text-foreground font-semibold text-sm">{u.r}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-elevated/40 p-5">
          <div className="text-sm font-semibold mb-4">Quick actions</div>
          <div className="grid gap-2">
            {[
              { i: Upload, l: "Upload a title" },
              { i: Calendar, l: "Program schedule" },
              { i: Radio, l: "Start live broadcast" },
              { i: Settings, l: "Channel settings" },
            ].map((a) => (
              <button
                key={a.l}
                className="w-full flex items-center gap-3 h-11 px-4 rounded-md bg-surface hover:bg-elevated border border-border transition text-sm"
              >
                <a.i className="size-4 text-accent" /> {a.l}
              </button>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-xl border border-border bg-primary/10">
            <div className="text-xs uppercase tracking-widest text-primary font-semibold">
              Revenue share
            </div>
            <div className="mt-1 text-sm text-[color:var(--secondary-foreground)]">
              You earn <span className="font-semibold text-foreground">55%</span> of
              subscription attribution + 70% of ad revenue.
            </div>
            <Link
              to="/enterprise"
              className="mt-3 inline-flex text-xs text-accent hover:underline"
            >
              See partner tiers →
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
