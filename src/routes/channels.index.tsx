import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Filter, Search, TrendingUp, Clock, Flame } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SponsorBanner } from "@/components/sponsor-banner";
import { ChannelCard } from "@/components/channel-card";
import {
  genres,
  channelLanguages,
  channelCountries,
  channelSorts,
  type ChannelSortId,
} from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { useCmsChannels } from "@/lib/cms-catalog";

export const Route = createFileRoute("/channels/")({
  head: () => ({
    meta: [
      { title: "Live Channels — Lettflix" },
      { name: "description", content: "Browse every live channel on Lettflix — faith, news, sports, music, podcasts and radio. Tune in from anywhere, 24/7." },
      { property: "og:title", content: "Live Channels — Lettflix" },
      { property: "og:description", content: "Discover published Lettflix channels and see what is live now." },
    ],
  }),
  component: ChannelsPage,
});


function ChannelsPage() {
  const { channels } = useCmsChannels();
  const [genre, setGenre] = useState("All");
  const [language, setLanguage] = useState("All");
  const [country, setCountry] = useState("All");
  const [sort, setSort] = useState<ChannelSortId>("popularity");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const list = channels.filter(
      (c) =>
        (genre === "All" || c.category === genre) &&
        (language === "All" || c.language === language) &&
        (country === "All" || c.country === country) &&
        (query === "" || c.name.toLowerCase().includes(query.toLowerCase()))
    );
    if (sort === "popularity") return [...list].sort((a, b) => b.popularity - a.popularity);
    if (sort === "trending")
      return [...list].sort(
        (a, b) => Number(b.trending ?? false) - Number(a.trending ?? false) || b.popularity - a.popularity
      );
    return [...list].sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1));
  }, [channels, genre, language, country, sort, query]);

  const sortIcon = (id: ChannelSortId) =>
    id === "popularity" ? Flame : id === "trending" ? TrendingUp : Clock;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* HERO */}
      <section className="relative border-b border-border">
        <div className="absolute inset-0 -z-10 opacity-90" style={{ background: "var(--gradient-hero)" }} />
        <div className="mx-auto max-w-[1480px] px-6 lg:px-10 pt-12 pb-10">
          <div className="flex items-end justify-between flex-wrap gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-elevated/70 backdrop-blur border border-border text-xs font-medium">
                <span className="live-pulse text-primary">LIVE</span>
                <span className="text-[color:var(--secondary-foreground)]">
                  · {channels.filter((c) => c.isLive).length} live · {channels.length} channels
                </span>
              </div>
              <h1 className="mt-5 text-4xl lg:text-5xl font-extrabold tracking-tight">
                The <span className="text-primary">Channel</span> Universe
              </h1>
              <p className="mt-3 text-[color:var(--secondary-foreground)] max-w-2xl">
                Tune into the world of Lettflix. Live services, sports, news, radio and podcasts —
                available in one place.
              </p>
            </div>
            <div className="w-full sm:w-auto">
              <div className="relative">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search channels"
                  placeholder="Search channels…"
                  className="h-10 pl-9 pr-4 rounded-md bg-surface border border-border w-full sm:w-64 text-sm outline-none focus:border-accent transition"
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <Filter className="size-4 text-[color:var(--muted-foreground)] shrink-0" />
              {genres.map((g) => (
                <Button variant="ghost"
                  key={g}
                  aria-pressed={genre === g}
                  onClick={() => setGenre(g)}
                  className={`shrink-0 px-3 h-11 rounded-md text-sm border transition ${
                    genre === g
                      ? "bg-primary text-primary-foreground border-primary shadow-[var(--shadow-glow)]"
                      : "bg-elevated/50 border-border text-[color:var(--secondary-foreground)] hover:text-foreground hover:bg-elevated"
                  }`}
                >
                  {g}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <SelectPill label="Language" value={language} onChange={setLanguage} options={channelLanguages} />
              <SelectPill label="Country" value={country} onChange={setCountry} options={channelCountries} />

              <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-md border border-border bg-elevated/50 p-1">
                {channelSorts.map((s) => {
                  const Icon = sortIcon(s.id);
                  const active = sort === s.id;
                  return (
                    <Button variant="ghost"
                      key={s.id}
                      aria-pressed={active}
                      onClick={() => setSort(s.id)}
                      className={`inline-flex items-center gap-1.5 px-3 h-11 rounded-md text-xs font-medium transition ${
                        active
                          ? "bg-accent text-accent-foreground"
                          : "text-[color:var(--secondary-foreground)] hover:text-foreground"
                      }`}
                    >
                      <Icon className="size-3.5" /> {s.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CHANNEL GRID */}
      <section className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-10">
        <div className="text-xs text-[color:var(--muted-foreground)] mb-4">
          Showing {filtered.length} channel{filtered.length === 1 ? "" : "s"}
        </div>
        <div className="grid gap-5 sm:gap-6 grid-cols-[minmax(0,1fr)] sm:grid-cols-2 lg:grid-cols-3 items-stretch">
          {filtered.map((c) => (
            <ChannelCard key={c.id} c={c} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-24 text-[color:var(--muted-foreground)]">
            <p>No channels match your filters.</p>
            <Button variant="outline" className="mt-4 h-11" onClick={() => { setGenre("All"); setCountry("All"); setLanguage("All"); setQuery(""); }}>Clear filters</Button>
          </div>
        )}
      </section>

      {/* SPONSORS / ADS */}
      <SponsorBanner placement="channels" className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-16" />


      <SiteFooter />
    </div>
  );
}

function SelectPill({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="inline-flex items-center gap-2 text-xs text-[color:var(--muted-foreground)]">
      <span className="uppercase tracking-wider">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-md bg-elevated/60 border border-border pl-3 pr-8 text-xs text-foreground outline-none focus:border-accent transition"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
