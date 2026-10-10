import { createFileRoute, Link, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, ArrowLeft, Search, Filter, LibraryBig } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TitleCard } from "@/components/title-card";
import { Pagination } from "@/components/pagination";
import { getChannel, getTitle, type Channel, type Title } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";
import { mapChannelRow, mapTitleRow } from "@/lib/cms-catalog";

export const Route = createFileRoute("/channels/$channelId/library")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Channel Library \u2014 Lettflix" },
      { property: "og:description", content: "Browse every on-demand title uploaded to this Lettflix channel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Channel Library — Lettflix" },
      { name: "description", content: "Browse every on-demand title uploaded to this Lettflix channel." },
    ],
  }),
  codeSplitGroupings: [["component", "notFoundComponent", "errorComponent"]],
  notFoundComponent: NotFound,
  errorComponent: ErrorView,
  component: ChannelLibraryPage,
});

function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-[900px] px-6 py-24 text-center">
        <h1 className="text-3xl font-bold">Channel not found</h1>
        <Link to="/channels" className="inline-flex mt-6 px-5 h-11 items-center rounded-md bg-primary text-primary-foreground font-semibold">Browse channels</Link>
      </div>
    </div>
  );
}

function ErrorView({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-[900px] px-6 py-24 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">{error instanceof Error ? error.message : String(error)}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-6 px-5 h-11 rounded-md bg-primary text-primary-foreground font-semibold">Try again</button>
      </div>
    </div>
  );
}

const PAGE_SIZE = 18;
const KINDS = ["All", "Film", "Series", "Podcast", "Documentary", "Concert", "Event"] as const;

function ChannelLibraryPage() {
  const { channelId } = Route.useParams();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [notFoundState, setNotFoundState] = useState(false);
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState<(typeof KINDS)[number]>("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {

      const { data: chRow } = await supabase
        .from("cms_channels")
        .select("*")
        .eq("slug", channelId)
        .eq("is_published", true)
        .maybeSingle();
      const merged: Channel | null = chRow ? mapChannelRow(chRow as never) : null;
      if (cancelled) return;
      if (!merged) { setNotFoundState(true); setLoading(false); return; }
      setChannel(merged);

      const uuid = (chRow as { id?: string } | null)?.id ?? null;
      const collected: Title[] = [];
      const seen = new Set<string>();

      // Union of slug-linked libraries from CMS/static channel record
      const slugSet = new Set<string>([
        ...(merged.videoLibrary ?? []),
        ...(merged.podcastLibrary ?? []),
        ...(merged.featuredContent ?? []),
      ]);
      if (slugSet.size) {
        const { data: rows } = await supabase
          .from("cms_titles")
          .select("*")
          .in("slug", Array.from(slugSet))
          .eq("is_published", true);
        for (const r of rows ?? []) {
          const t = mapTitleRow(r as never);
          if (!seen.has(t.id)) { seen.add(t.id); collected.push(t); }
        }
      }

      void uuid;
      if (!cancelled) { setTitles(collected); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [channelId]);

  const filtered = useMemo(() => titles.filter((t) =>
    (kind === "All" || t.kind === kind) &&
    (query === "" || t.title.toLowerCase().includes(query.toLowerCase()))
  ), [titles, kind, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (notFoundState) return <NotFound />;
  if (!channel) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="mx-auto max-w-[1480px] px-6 py-24 text-center text-[color:var(--muted-foreground)]">Loading channel…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto max-w-[1480px] px-6 lg:px-10 pt-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="text-xs text-[color:var(--muted-foreground)] flex items-center gap-1.5">
          <Link to="/channels" className="hover:text-foreground">Channels</Link>
          <ChevronRight className="size-3" />
          <Link to="/channels/$channelId" params={{ channelId: channel.id }} className="hover:text-foreground">{channel.name}</Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground">Library</span>
        </div>
        <Link to="/channels/$channelId" params={{ channelId: channel.id }} className="inline-flex items-center gap-1.5 text-xs px-3 h-8 rounded-md border border-border bg-elevated/40 hover:bg-elevated transition">
          <ArrowLeft className="size-3.5" /> Channel overview
        </Link>
      </div>

      {/* Hero strip */}
      <section className="mx-auto max-w-[1480px] px-6 lg:px-10 pt-4">
        <div className="relative rounded-2xl overflow-hidden border border-border">
          <img src={channel.banner} alt="" className="absolute inset-0 size-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          <div className="relative p-6 lg:p-8 flex items-center gap-4">
            <div className="size-16 rounded-xl overflow-hidden border border-border bg-elevated shrink-0">
              <img src={channel.logoImg} alt="" className="size-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wider text-accent flex items-center gap-2">
                <LibraryBig className="size-3.5" /> On-Demand Library
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight truncate">{channel.name}</h1>
              <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
                Every on-demand upload from this channel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="mx-auto max-w-[1480px] px-6 lg:px-10 pt-8">
        <div className="flex items-end justify-between mb-4 flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Browse contents</h2>
            <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
              {loading ? "Loading library…" : `${filtered.length} of ${titles.length} titles${totalPages > 1 ? ` · Page ${currentPage} of ${totalPages}` : ""}`}
            </p>
          </div>
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)]" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search titles…"
              className="h-10 pl-9 pr-4 rounded-md bg-surface border border-border w-64 text-sm outline-none focus:border-accent transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <Filter className="size-4 text-[color:var(--muted-foreground)] shrink-0" />
          {KINDS.map((k) => (
            <button
              key={k}
              onClick={() => { setKind(k); setPage(1); }}
              className={`shrink-0 px-3 h-8 rounded-full text-sm border transition ${
                kind === k
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-elevated/50 border-border text-[color:var(--secondary-foreground)] hover:text-foreground"
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        {pageItems.length === 0 && !loading ? (
          <div className="mt-8 rounded-xl border border-dashed border-border bg-elevated/30 p-12 text-center text-sm text-[color:var(--muted-foreground)]">
            {titles.length === 0
              ? "This channel hasn't uploaded any on-demand content yet."
              : "Nothing matches those filters."}
          </div>
        ) : (
          <div className="mt-6 grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {pageItems.map((t) => <TitleCard key={t.id} t={t} />)}
          </div>
        )}

        <Pagination page={currentPage} totalPages={totalPages} onPage={setPage} />
      </section>

      <div className="h-16" />
      <SiteFooter />
    </div>
  );
}
