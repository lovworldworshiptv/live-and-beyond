import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Filter, Radio, Signal, Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RemindButton } from "@/components/remind-button";
import { channels, genres } from "@/lib/catalog";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "Live Program Guide — Lettflix" },
      {
        name: "description",
        content:
          "The Lettflix Electronic Program Guide. See what's on across every channel — live and upcoming — and set reminders in one place.",
      },
      { property: "og:title", content: "Live Program Guide — Lettflix" },
      {
        property: "og:description",
        content:
          "See what's on across every Lettflix channel, right now and later today.",
      },
    ],
  }),
  component: GuidePage,
});

const timeSlots = Array.from({ length: 12 }, (_, i) => {
  const h = 9 + i;
  return `${String(h).padStart(2, "0")}:00`;
});

function GuidePage() {
  const [genre, setGenre] = useState("All");
  const [liveOnly, setLiveOnly] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      channels.filter(
        (c) =>
          (genre === "All" || c.category === genre) &&
          (!liveOnly || c.isLive) &&
          (query === "" || c.name.toLowerCase().includes(query.toLowerCase()))
      ),
    [genre, liveOnly, query]
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="border-b border-border">
        <div className="mx-auto max-w-[1480px] px-6 lg:px-10 pt-12 pb-8">
          <div className="flex items-end justify-between flex-wrap gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-elevated/70 border border-border text-xs font-medium">
                <Signal className="size-3.5 text-primary" /> Electronic Program Guide
              </div>
              <h1 className="mt-5 text-4xl lg:text-5xl font-extrabold tracking-tight">
                What's on <span className="text-primary">right now</span>
              </h1>
              <p className="mt-3 text-[color:var(--secondary-foreground)] max-w-2xl">
                Every channel. Every slot. Set a reminder and we'll ping you when it starts.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter channels…"
                className="h-10 px-4 rounded-md bg-surface border border-border flex-1 sm:w-56 min-w-0 text-sm outline-none focus:border-accent transition"
              />
              <button
                onClick={() => setLiveOnly((v) => !v)}
                className={`h-10 px-4 rounded-md text-sm font-medium border transition inline-flex items-center gap-2 shrink-0 whitespace-nowrap ${
                  liveOnly
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-surface border-border text-[color:var(--secondary-foreground)] hover:text-foreground"
                }`}
              >
                <Radio className="size-3.5" /> Live only
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <Filter className="size-4 text-[color:var(--muted-foreground)] shrink-0" />
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setGenre(g)}
                className={`shrink-0 px-3 h-8 rounded-full text-sm border transition ${
                  genre === g
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-elevated/50 border-border text-[color:var(--secondary-foreground)] hover:text-foreground"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-8 mb-16">
        <div className="rounded-2xl border border-border overflow-hidden bg-elevated/40">
          <div className="overflow-x-auto">
            <div
              className="grid min-w-[1400px]"
              style={{
                gridTemplateColumns: `240px repeat(${timeSlots.length}, minmax(110px, 1fr))`,
              }}
            >
              {/* Header row */}
              <div className="sticky left-0 z-20 bg-surface/95 backdrop-blur px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)] border-b border-r border-border">
                Channel
              </div>
              {timeSlots.map((t) => (
                <div
                  key={t}
                  className="px-3 py-3 text-xs font-medium text-[color:var(--muted-foreground)] border-b border-l border-border bg-surface/60"
                >
                  {t}
                </div>
              ))}

              {/* Channel rows */}
              {filtered.map((c) => (
                <FragmentRow key={c.id} channel={c} />
              ))}
            </div>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-[color:var(--muted-foreground)]">
              No channels match your filters.
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function FragmentRow({ channel }: { channel: (typeof channels)[number] }) {
  return (
    <>
      <Link
        to="/channels/$channelId"
        params={{ channelId: channel.id }}
        className="sticky left-0 z-10 bg-elevated/90 backdrop-blur px-4 py-3 flex items-center gap-3 border-b border-r border-border hover:bg-elevated transition"
      >
        <div className="size-10 rounded-md overflow-hidden shrink-0">
          <img src={channel.logoImg} alt="" className="size-full object-cover" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate flex items-center gap-1.5">
            {channel.isLive && (
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            )}
            {channel.name}
          </div>
          <div className="text-[11px] text-[color:var(--muted-foreground)] truncate">
            {channel.category}
          </div>
        </div>
      </Link>
      {timeSlots.map((_, i) => {
        const slot = channel.schedule[i % channel.schedule.length];
        return (
          <Popover key={i}>
            <PopoverTrigger asChild>
              <button
                className={`text-left px-3 py-3 border-b border-l border-border h-full text-xs transition ${
                  slot.live
                    ? "bg-primary/15 hover:bg-primary/25 text-foreground"
                    : "hover:bg-elevated/60 text-[color:var(--secondary-foreground)]"
                }`}
              >
                <div className="font-medium truncate">{slot.title}</div>
                <div className="text-[10px] text-[color:var(--muted-foreground)] mt-0.5 truncate">
                  {slot.kind}
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-4">
              <div className="text-[11px] uppercase tracking-widest text-[color:var(--muted-foreground)]">
                {channel.name}
              </div>
              <div className="mt-1 font-semibold">{slot.title}</div>
              <div className="mt-1 text-xs text-[color:var(--muted-foreground)]">
                {slot.time} · {slot.kind}
              </div>
              <p className="mt-2 text-sm text-[color:var(--secondary-foreground)]">
                {slot.live
                  ? "Airing live right now."
                  : "Scheduled for later. Set a reminder and we'll notify you."}
              </p>
              <div className="mt-3 flex gap-2">
                <Link
                  to="/channels/$channelId"
                  params={{ channelId: channel.id }}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition"
                >
                  {slot.live ? "Watch Live" : "Open Channel"}
                </Link>
                {!slot.live && (
                  <RemindButton
                    channelId={channel.id}
                    time={slot.time}
                    title={slot.title}
                    variant="icon"
                  />
                )}
              </div>
            </PopoverContent>
          </Popover>
        );
      })}
    </>
  );
}

void Bell;
