import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Pause, Play, Radio as RadioIcon, Search } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useRadio } from "@/components/radio-player";
import { fetchRadioStations, type RadioStation } from "@/lib/radio";
import { Button } from "@/components/ui/button";
import { recordPlaybackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/radio")({
  head: () => ({
    meta: [
      { title: "Radio Stations — Live Audio on Lettflix" },
      {
        name: "description",
        content:
          "Tune in to live Lettflix radio stations: music, teaching, talk and news, with now-playing metadata and a player that follows you across the site.",
      },
      { property: "og:title", content: "Radio Stations — Live Audio on Lettflix" },
      {
        property: "og:description",
        content: "Live radio on Lettflix — stream stations worldwide with now-playing track info.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RadioPage,
});

function RadioPage() {
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const { station: current, playing, toggle } = useRadio();

  useEffect(() => {
    fetchRadioStations()
      .then(setStations)
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(stations.map((s) => s.category).filter(Boolean) as string[]))],
    [stations],
  );

  const filtered = useMemo(
    () =>
      stations.filter(
        (s) =>
          (category === "All" || s.category === category) &&
          (!q.trim() || `${s.name} ${s.tagline ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())),
      ),
    [stations, category, q],
  );

  function onPlay(s: RadioStation) {
    toggle(s);
    recordPlaybackEvent({ channelId: s.channelId, service: "radio", event: "start" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />

      <section className="border-b border-border bg-[image:var(--gradient-live)]/10">
        <div className="mx-auto max-w-[1480px] px-6 lg:px-10 py-10 lg:py-14">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-elevated/70 border border-border text-[11px] font-medium">
            <RadioIcon className="size-3 text-primary" /> Lettflix Radio
          </div>
          <h1 className="mt-3 text-3xl lg:text-5xl font-extrabold tracking-tight">Live radio, always on</h1>
          <p className="mt-3 max-w-2xl text-sm lg:text-base text-[color:var(--secondary-foreground)]">
            Music, teaching, talk and news from broadcasters around the world. Start a station and it keeps
            playing while you browse Lettflix.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[color:var(--muted-foreground)]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search stations"
                aria-label="Search stations"
                className="w-full h-11 pl-9 pr-3 rounded-md bg-surface border border-border text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((c) => (
                <Button variant="ghost"
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`h-11 px-4 rounded-md text-sm font-medium whitespace-nowrap transition ${
                    category === c ? "bg-primary text-primary-foreground" : "bg-elevated border border-border hover:bg-elevated/70"
                  }`}
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 mx-auto w-full max-w-[1480px] px-6 lg:px-10 py-8">
        {loading ? (
          <div className="py-24 grid place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
        ) : !filtered.length ? (
          <div className="py-24 text-center text-sm text-muted-foreground">
            <p>{q || category !== "All" ? "No stations match your filters." : "No radio stations available right now."}</p>
            {(q || category !== "All") && <Button variant="outline" className="mt-4 h-11" onClick={() => { setQ(""); setCategory("All"); }}>Clear filters</Button>}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((s) => {
              const isCurrent = current?.channelId === s.channelId;
              return (
                <article
                  key={s.channelId}
                  className={`rounded-2xl border p-4 transition ${
                    isCurrent ? "border-primary bg-primary/10" : "border-border bg-elevated/40 hover:bg-elevated/70"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {s.logoUrl ? (
                      <img src={s.logoUrl} alt={`${s.name} logo`} className="size-14 rounded-xl object-cover border border-border" />
                    ) : (
                      <div className="size-14 rounded-xl bg-surface border border-border grid place-items-center">
                        <RadioIcon className="size-6 text-primary" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm font-bold truncate">{s.name}</h2>
                      <p className="text-xs text-[color:var(--muted-foreground)] truncate">
                        {s.tagline || s.stationMessage || `${s.bitrate} kbps`}
                      </p>
                    </div>
                    <Button variant="ghost"
                      onClick={() => onPlay(s)}
                      disabled={!s.streamUrl}
                      aria-label={isCurrent && playing ? `Pause ${s.name}` : `Play ${s.name}`}
                      className="size-11 shrink-0 grid place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_0_28px_-6px_var(--primary)] disabled:opacity-40"
                    >
                      {isCurrent && playing ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
                    </Button>
                  </div>

                  {(s.nowPlayingTitle || s.category) && (
                    <div className="mt-3 text-xs text-[color:var(--muted-foreground)] truncate">
                      {s.nowPlayingTitle
                        ? `Now playing: ${s.nowPlayingArtist ? `${s.nowPlayingArtist} — ` : ""}${s.nowPlayingTitle}`
                        : s.category}
                    </div>
                  )}

                  <Link
                    to="/channels/$channelId"
                    params={{ channelId: s.slug }}
                    className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-md border border-border bg-surface text-xs font-medium hover:bg-elevated transition"
                  >
                    Visit channel
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
