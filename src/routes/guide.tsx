import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Radio, CalendarDays } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RemindButton } from "@/components/remind-button";
import { Button } from "@/components/ui/button";
import { useCmsChannels } from "@/lib/cms-catalog";

export const Route = createFileRoute("/guide")({
  head: () => ({ meta: [
    { title: "Programme Guide — Lettflix" },
    { name: "description", content: "Browse published programmes by channel, see what is on now and save upcoming programmes." },
    { property: "og:title", content: "Programme Guide — Lettflix" },
    { property: "og:description", content: "Current and upcoming programmes from Lettflix channels." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: GuidePage,
});

function GuidePage() {
  const { channels, loading } = useCmsChannels();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [view, setView] = useState<"now" | "next" | "all">("now");
  const filtered = channels.filter((c) => (category === "All" || c.category === category) && c.name.toLowerCase().includes(query.trim().toLowerCase()));
  const now = Date.now();
  return <div className="min-h-screen bg-background text-foreground">
    <SiteHeader />
    <main className="mx-auto max-w-[1480px] px-6 py-10 lg:px-10">
      <h1 className="text-3xl font-bold lg:text-4xl">Programme guide</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <input aria-label="Filter channels" placeholder="Search channels…" value={query} onChange={(e) => setQuery(e.target.value)} className="h-11 w-full min-w-0 rounded-md border border-border bg-surface px-4 text-sm" />
        <div className="flex gap-1" aria-label="Programme view">
          {([["now", "Now"], ["next", "Next"], ["all", "Schedule"]] as const).map(([id, label]) => <Button key={id} variant={view === id ? "default" : "outline"} aria-pressed={view === id} className="h-11 flex-1" onClick={() => setView(id)}>{id === "now" ? <Radio className="size-4" /> : <CalendarDays className="size-4" />}{label}</Button>)}
        </div>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none">
        {["All", ...new Set(channels.map((c) => c.category).filter(Boolean))].map((g) => <Button key={g} variant={category === g ? "default" : "outline"} aria-pressed={category === g} className="h-11 shrink-0" onClick={() => setCategory(g)}>{g}</Button>)}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Programme times shown in your local time.</p>
      {loading && <p role="status" className="py-12 text-muted-foreground">Loading programmes…</p>}
      {!loading && !filtered.length && <div className="py-16 text-center"><p>No channels match your filters.</p><Button className="mt-4" variant="outline" onClick={() => { setQuery(""); setCategory("All"); }}>Clear filters</Button></div>}
      <div className="mt-6 divide-y divide-border">
        {filtered.map((c) => {
          const upcoming = c.schedule.filter((s) => new Date(s.time).getTime() > now);
          const slots = view === "now" ? c.schedule.filter((s) => new Date(s.time).getTime() <= now && !!s.endsAt && new Date(s.endsAt).getTime() > now) : view === "next" ? upcoming.slice(0, 1) : c.schedule.filter((s) => !!s.endsAt && new Date(s.endsAt).getTime() > now);
          return <section key={c.id} className="grid gap-4 py-6 md:grid-cols-[240px_minmax(0,1fr)]">
            <Link to="/channels/$channelId" params={{ channelId: c.id }} className="flex min-w-0 items-center gap-3 self-start">
              {c.logoImg && <img src={c.logoImg} alt="" className="size-11 shrink-0 rounded-md object-cover" />}
              <div className="min-w-0"><h2 className="truncate font-semibold">{c.name}</h2><p className="text-xs text-muted-foreground">{c.isLive ? "● Live" : "Off air"} · {c.category}</p></div>
            </Link>
            <div className="min-w-0 space-y-3">
              {!slots.length && <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{view === "now" ? "No current programme published." : "No upcoming programmes published."}</p><Button asChild variant="outline" className="h-11"><Link to="/channels/$channelId" params={{ channelId: c.id }}>Open channel</Link></Button></div>}
              {slots.map((s) => <div key={`${s.time}-${s.title}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-l-2 border-primary pl-4">
                <div className="min-w-0"><h3 className="break-words text-sm font-semibold">{s.title}</h3><p className="mt-1 text-xs text-muted-foreground">{new Date(s.time).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}{s.endsAt ? ` – ${new Date(s.endsAt).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}` : ""} · {s.kind}</p></div>
                {new Date(s.time).getTime() > now ? <RemindButton channelId={c.id} time={s.time} title={s.title} variant="icon" /> : <Button asChild className="h-11"><Link to="/channels/$channelId" params={{ channelId: c.id }}>Watch</Link></Button>}
              </div>)}
            </div>
          </section>;
        })}
      </div>
    </main>
    <SiteFooter />
  </div>;
}
