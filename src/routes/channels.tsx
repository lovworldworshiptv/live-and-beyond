import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Play, Radio, Filter, Signal, Search, ArrowRight, Users } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { channels, genres } from "@/lib/catalog";

export const Route = createFileRoute("/channels")({
  head: () => ({
    meta: [
      { title: "Live Channels — Lettflix" },
      { name: "description", content: "Browse every live channel on Lettflix — faith, news, sports, music, podcasts and radio. Tune in from anywhere, 24/7." },
      { property: "og:title", content: "Live Channels — Lettflix" },
      { property: "og:description", content: "184 live channels streaming worldwide on Lettflix. Discover what's on right now." },
    ],
  }),
  component: ChannelsPage,
});

const hours = Array.from({ length: 8 }, (_, i) => {
  const h = 9 + i;
  return `${String(h).padStart(2, "0")}:00`;
});

function ChannelsPage() {
  const [genre, setGenre] = useState("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      channels.filter(
        (c) =>
          (genre === "All" || c.category === genre) &&
          (query === "" || c.name.toLowerCase().includes(query.toLowerCase()))
      ),
    [genre, query]
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* HERO */}
      <section className="relative border-b border-border">
        <div
          className="absolute inset-0 -z-10 opacity-90"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div className="mx-auto max-w-[1480px] px-6 lg:px-10 pt-12 pb-10">
          <div className="flex items-end justify-between flex-wrap gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-elevated/70 backdrop-blur border border-border text-xs font-medium">
                <span className="live-pulse text-primary">LIVE</span>
                <span className="text-[color:var(--secondary-foreground)]">· 184 channels broadcasting worldwide</span>
              </div>
              <h1 className="mt-5 text-4xl lg:text-5xl font-extrabold tracking-tight">
                The <span className="text-primary">Channel</span> Universe
              </h1>
              <p className="mt-3 text-[color:var(--secondary-foreground)] max-w-2xl">
                Tune into the world of Lettflix. Live services, sports, news, radio and podcasts —
                all streaming right now.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search channels…"
                  className="h-10 pl-9 pr-4 rounded-md bg-surface border border-border w-64 text-sm outline-none focus:border-accent transition"
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-6 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <Filter className="size-4 text-[color:var(--muted-foreground)] shrink-0" />
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setGenre(g)}
                className={`shrink-0 px-3 h-8 rounded-full text-sm border transition ${
                  genre === g
                    ? "bg-primary text-primary-foreground border-primary shadow-[var(--shadow-glow)]"
                    : "bg-elevated/50 border-border text-[color:var(--secondary-foreground)] hover:text-foreground hover:bg-elevated"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CHANNEL GRID */}
      <section className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Link
              key={c.id}
              to="/channels/$channelId"
              params={{ channelId: c.id }}
              className="group relative rounded-2xl overflow-hidden border border-border bg-elevated/50 hover:border-primary/50 transition"
            >
              <div className="relative aspect-[16/9]">
                <img src={c.banner} alt={c.name} loading="lazy" className="size-full object-cover group-hover:scale-105 transition duration-700" />
                <div className="absolute inset-0" style={{ background: "var(--gradient-card)" }} />
                {c.isLive && (
                  <span className="absolute top-3 left-3 inline-flex items-center px-2 py-1 rounded text-[11px] font-bold bg-[image:var(--gradient-live)] text-primary-foreground live-pulse">
                    LIVE
                  </span>
                )}
                <span className="absolute top-3 right-3 text-[11px] px-2 py-1 rounded bg-black/60 backdrop-blur inline-flex items-center gap-1">
                  <Users className="size-3" /> {c.viewers}
                </span>
                <button className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition">
                  <div className="size-14 rounded-full bg-white/95 grid place-items-center shadow-[var(--shadow-card)]">
                    <Play className="size-5 text-background fill-current ml-0.5" />
                  </div>
                </button>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-accent font-semibold uppercase tracking-wider">{c.category}</div>
                  <div className="text-[11px] text-[color:var(--muted-foreground)]">{c.region}</div>
                </div>
                <div className="mt-1.5 font-semibold text-lg leading-tight">{c.name}</div>
                <div className="text-sm text-[color:var(--muted-foreground)] mt-1 line-clamp-1">{c.tagline}</div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="text-[color:var(--secondary-foreground)] line-clamp-1">
                    <span className="text-foreground font-medium">Now:</span> {c.nowPlaying.title}
                  </div>
                  <ArrowRight className="size-4 text-[color:var(--muted-foreground)] group-hover:text-foreground group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-24 text-[color:var(--muted-foreground)]">
            No channels match your filters.
          </div>
        )}
      </section>

      {/* LIVE GUIDE */}
      <section className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-16">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Signal className="size-5 text-primary" /> Live Guide
            </h2>
            <p className="text-sm text-[color:var(--muted-foreground)] mt-1">Today's schedule across every channel.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-[color:var(--muted-foreground)]">
            <Radio className="size-3.5" /> Times shown in your local timezone
          </div>
        </div>

        <div className="rounded-2xl border border-border overflow-hidden bg-elevated/40">
          {/* Time header */}
          <div className="grid grid-cols-[220px_repeat(8,1fr)] border-b border-border bg-surface/60 sticky top-16 z-10">
            <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
              Channel
            </div>
            {hours.map((h) => (
              <div key={h} className="px-3 py-3 text-xs font-medium text-[color:var(--muted-foreground)] border-l border-border">
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="overflow-x-auto">
            {channels.map((c) => (
              <Link
                key={c.id}
                to="/channels/$channelId"
                params={{ channelId: c.id }}
                className="grid grid-cols-[220px_repeat(8,1fr)] items-center border-b border-border last:border-b-0 hover:bg-elevated/60 transition min-w-[900px]"
              >
                <div className="px-4 py-3 flex items-center gap-3">
                  <div className="size-10 rounded-md overflow-hidden shrink-0">
                    <img src={c.logoImg} alt="" className="size-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{c.name}</div>
                    <div className="text-[11px] text-[color:var(--muted-foreground)] truncate">{c.category}</div>
                  </div>
                </div>
                {c.schedule.slice(0, 8).map((s, i) => (
                  <div
                    key={i}
                    className={`px-3 py-3 border-l border-border h-full text-xs ${
                      s.live
                        ? "bg-primary/15 text-foreground"
                        : "text-[color:var(--secondary-foreground)]"
                    }`}
                  >
                    <div className="font-medium truncate flex items-center gap-1.5">
                      {s.live && <span className="size-1.5 rounded-full bg-primary animate-pulse" />}
                      {s.title}
                    </div>
                    <div className="text-[10px] text-[color:var(--muted-foreground)] mt-0.5 truncate">{s.kind}</div>
                  </div>
                ))}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
