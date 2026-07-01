import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { Play, Volume2, Maximize2, Users, Radio, Bell, Share2, Plus, ChevronRight, Cast, Signal, Sparkles, Tv, Mic } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TitleCard } from "@/components/title-card";
import { channels, getChannel, getTitle, type Channel } from "@/lib/catalog";

export const Route = createFileRoute("/channels/$channelId")({
  loader: ({ params }) => {
    const channel = getChannel(params.channelId);
    if (!channel) throw notFound();
    return { channel };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.channel.name} — Live on Lettflix` },
          { name: "description", content: loaderData.channel.tagline },
          { property: "og:title", content: `${loaderData.channel.name} — Live on Lettflix` },
          { property: "og:description", content: loaderData.channel.tagline },
        ]
      : [],
  }),
  notFoundComponent: ChannelNotFound,
  errorComponent: ChannelError,
  component: ChannelPage,
});

function ChannelNotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-[900px] px-6 py-24 text-center">
        <h1 className="text-3xl font-bold">Channel not found</h1>
        <p className="mt-3 text-[color:var(--muted-foreground)]">The channel you're looking for isn't broadcasting on Lettflix.</p>
        <Link to="/channels" className="inline-flex mt-6 px-5 h-11 items-center rounded-md bg-primary text-primary-foreground font-semibold">Browse channels</Link>
      </div>
    </div>
  );
}

function ChannelError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-[900px] px-6 py-24 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 px-5 h-11 rounded-md bg-primary text-primary-foreground font-semibold"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

function ChannelPage() {
  const { channel } = Route.useLoaderData();
  const related = channels.filter((c) => c.id !== channel.id).slice(0, 4);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* PLAYER */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1480px] px-6 lg:px-10 pt-6">
          <div className="text-xs text-[color:var(--muted-foreground)] flex items-center gap-1.5">
            <Link to="/channels" className="hover:text-foreground">Channels</Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground">{channel.name}</span>
          </div>

          <div className="mt-4 relative rounded-2xl overflow-hidden border border-border bg-black aspect-video">
            <img src={channel.banner} alt="" className="absolute inset-0 size-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            {/* LIVE badge + viewer count */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              {channel.isLive && (
                <span className="inline-flex items-center px-2.5 py-1 rounded text-[11px] font-bold bg-[image:var(--gradient-live)] text-primary-foreground live-pulse">
                  LIVE
                </span>
              )}
              <span className="text-[11px] px-2 py-1 rounded bg-black/60 backdrop-blur inline-flex items-center gap-1">
                <Users className="size-3" /> {channel.viewers} watching
              </span>
            </div>

            {/* Center play */}
            <button className="absolute inset-0 grid place-items-center group">
              <div className="size-20 rounded-full bg-white/95 grid place-items-center shadow-[var(--shadow-card)] group-hover:scale-105 transition">
                <Play className="size-7 text-background fill-current ml-1" />
              </div>
            </button>

            {/* Player chrome */}
            <div className="absolute bottom-0 inset-x-0 p-4 lg:p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs text-white/70 uppercase tracking-wider">Now Playing</div>
                  <div className="font-semibold text-lg truncate">{channel.nowPlaying.title}</div>
                </div>
                <div className="flex items-center gap-1">
                  {[Volume2, Cast, Maximize2].map((Icon, i) => (
                    <button key={i} className="size-9 grid place-items-center rounded-md hover:bg-white/10 transition" aria-label="Control">
                      <Icon className="size-4" />
                    </button>
                  ))}
                </div>
              </div>
              {/* Fake progress bar (live) */}
              <div className="mt-3 h-1 rounded-full bg-white/15 overflow-hidden">
                <div className="h-full w-1/3 bg-primary" />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-white/60">
                <span>{channel.nowPlaying.startsAt}</span>
                <span>{channel.nowPlaying.endsAt}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* META */}
      <section className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex items-center gap-3">
            <div className="size-14 rounded-lg overflow-hidden border border-border">
              <img src={channel.logoImg} alt="" className="size-full object-cover" />
            </div>
            <div>
              <div className="text-xs text-accent font-semibold uppercase tracking-wider">{channel.category}</div>
              <h1 className="text-3xl font-bold tracking-tight leading-tight">{channel.name}</h1>
            </div>
          </div>

          <p className="mt-4 text-[color:var(--secondary-foreground)] max-w-2xl">
            {channel.tagline}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 px-5 h-11 rounded-md bg-[image:var(--gradient-live)] text-primary-foreground font-semibold shadow-[var(--shadow-glow)] hover:opacity-95 transition">
              <Play className="size-4 fill-current" /> Watch Live
            </button>
            <button className="inline-flex items-center gap-2 px-5 h-11 rounded-md bg-elevated border border-border hover:bg-elevated/70 transition font-medium">
              <Plus className="size-4" /> My Channels
            </button>
            <button className="inline-flex items-center gap-2 px-5 h-11 rounded-md bg-elevated border border-border hover:bg-elevated/70 transition font-medium">
              <Bell className="size-4" /> Notify
            </button>
            <button className="inline-flex items-center gap-2 px-5 h-11 rounded-md bg-elevated border border-border hover:bg-elevated/70 transition font-medium">
              <Share2 className="size-4" /> Share
            </button>
          </div>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
            {[
              { k: "Language", v: channel.language },
              { k: "Region", v: channel.region },
              { k: "Format", v: "1080p HDR" },
              { k: "Audio", v: "Stereo · 320kbps" },
            ].map((m) => (
              <div key={m.k} className="rounded-lg border border-border bg-elevated/40 p-3">
                <div className="text-[11px] text-[color:var(--muted-foreground)] uppercase tracking-wider">{m.k}</div>
                <div className="text-sm font-medium mt-1">{m.v}</div>
              </div>
            ))}
          </div>

          {/* SCHEDULE */}
          <div className="mt-10">
            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <Radio className="size-4 text-primary" /> Today's Schedule
            </h2>
            <div className="mt-4 rounded-xl border border-border overflow-hidden divide-y divide-border">
              {(channel.schedule as Channel["schedule"]).map((s, i) => (
                <div
                  key={i}
                  className={`px-4 py-3 flex items-center gap-4 ${
                    s.live ? "bg-primary/10" : "bg-elevated/30"
                  }`}
                >
                  <div className="w-16 text-sm font-mono font-semibold text-[color:var(--secondary-foreground)]">
                    {s.time}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold flex items-center gap-2">
                      {s.title}
                      {s.live && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground live-pulse">
                          LIVE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[color:var(--muted-foreground)] uppercase tracking-wider mt-0.5">
                      {s.kind}
                    </div>
                  </div>
                  <button className="text-[color:var(--muted-foreground)] hover:text-foreground" aria-label="Set reminder">
                    <Bell className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SIDEBAR — related channels */}
        <aside className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
            More channels
          </div>
          {related.map((r) => (
            <Link
              key={r.id}
              to="/channels/$channelId"
              params={{ channelId: r.id }}
              className="group flex gap-3 p-3 rounded-xl border border-border bg-elevated/40 hover:border-accent/40 transition"
            >
              <div className="relative size-20 shrink-0 rounded-md overflow-hidden">
                <img src={r.banner} alt="" className="size-full object-cover" />
                {r.isLive && (
                  <span className="absolute top-1 left-1 text-[9px] font-bold px-1 py-0.5 rounded bg-primary text-primary-foreground">LIVE</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-accent font-semibold uppercase tracking-wider">{r.category}</div>
                <div className="text-sm font-semibold leading-tight line-clamp-1">{r.name}</div>
                <div className="text-xs text-[color:var(--muted-foreground)] mt-0.5 line-clamp-1">
                  Now: {r.nowPlaying.title}
                </div>
              </div>
            </Link>
          ))}
        </aside>
      </section>

      <SiteFooter />
    </div>
  );
}
