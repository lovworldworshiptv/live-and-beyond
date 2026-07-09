import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { Play, Plus, Share2, ThumbsUp, Download, Volume2, Maximize2, Cast, ChevronRight, Star, Clock, Calendar } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { titles, getTitle } from "@/lib/catalog";

export const Route = createFileRoute("/on-demand/$titleId")({
  loader: ({ params }) => {
    const title = getTitle(params.titleId);
    if (!title) throw notFound();
    return { title };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title.title} — Watch on Lettflix` },
          { name: "description", content: loaderData.title.synopsis.slice(0, 155) },
          { property: "og:title", content: `${loaderData.title.title} — Lettflix` },
          { property: "og:description", content: loaderData.title.synopsis.slice(0, 155) },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-[900px] px-6 py-24 text-center">
        <h1 className="text-3xl font-bold">Title not found</h1>
        <Link to="/on-demand" className="inline-flex mt-6 px-5 h-11 items-center rounded-md bg-primary text-primary-foreground font-semibold">
          Browse On Demand
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ error, reset }) => {
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
  },
  component: TitleDetail,
});

function TitleDetail() {
  const { title } = Route.useLoaderData();
  const related = titles.filter((t) => t.id !== title.id && t.category === title.category);
  const alsoLike = titles.filter((t) => t.id !== title.id).slice(0, 6);

  const episodes = Array.from({ length: title.episodes ? Math.min(title.episodes, 6) : 6 }, (_, i) => ({
    number: i + 1,
    title: `Episode ${i + 1} · ${["The Opening", "Foundations", "Breakthrough", "The Turning Point", "Momentum", "Legacy"][i]}`,
    duration: `${38 + i * 2}m`,
    synopsis:
      "Drawn into a new chapter, the story deepens as unseen forces converge and the world shifts under the weight of one decision.",
  }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* HERO PLAYER */}
      <section className="relative">
        <div className="absolute inset-0 -z-10">
          <img src={title.hero} alt="" className="size-full object-cover opacity-50" />
          <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-background" />
        </div>

        <div className="mx-auto max-w-[1480px] px-6 lg:px-10 pt-6">
          <div className="text-xs text-[color:var(--muted-foreground)] flex items-center gap-1.5">
            <Link to="/on-demand" className="hover:text-foreground">On Demand</Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground">{title.title}</span>
          </div>

          <div className="mt-6 relative rounded-2xl overflow-hidden border border-border bg-black aspect-video max-w-5xl">
            <img src={title.hero} alt="" className="absolute inset-0 size-full object-cover opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            <button className="absolute inset-0 grid place-items-center group" aria-label="Play">
              <div
                className="size-[110px] rounded-full bg-white/95 grid place-items-center transition group-hover:scale-110"
                style={{
                  boxShadow: "0 0 0 4px oklch(0.55 0.22 25 / 0.35), 0 0 30px oklch(0.55 0.22 25 / 0.55), 0 0 70px oklch(0.55 0.22 25 / 0.25)",
                }}
              >
                <Play className="size-10 text-background fill-current ml-1" />
              </div>
            </button>
            <div className="absolute bottom-0 inset-x-0 p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-white/70 uppercase tracking-wider">Preview · 2:14</div>
                  <div className="font-semibold truncate">Official Trailer — {title.title}</div>
                </div>
                <div className="flex items-center gap-1">
                  {[Volume2, Cast, Maximize2].map((Icon, i) => (
                    <button key={i} className="size-9 grid place-items-center rounded-md hover:bg-white/10 transition" aria-label="Control">
                      <Icon className="size-4" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DETAIL */}
      <section className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="text-xs text-accent font-semibold uppercase tracking-wider">{title.category} · {title.kind}</div>
          <h1 className="mt-2 text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.05]">{title.title}</h1>

          <div className="mt-3 flex items-center gap-3 text-sm text-[color:var(--muted-foreground)] flex-wrap">
            <span className="px-2 py-0.5 rounded border border-border">{title.rating}</span>
            <span className="inline-flex items-center gap-1"><Calendar className="size-3.5" /> {title.year}</span>
            <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {title.duration}</span>
            <span className="inline-flex items-center gap-1 text-warning"><Star className="size-3.5 fill-current" /> 4.8</span>
            <span className="text-success font-semibold">98% Match</span>
          </div>

          <p className="mt-5 text-[color:var(--secondary-foreground)] max-w-2xl">
            {title.synopsis}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 px-6 h-12 rounded-md bg-white text-background font-semibold hover:bg-white/90 transition">
              <Play className="size-[19px] fill-current" strokeWidth={2.5} /> Play
            </button>
            <button className="inline-flex items-center gap-2 px-5 h-12 rounded-md bg-elevated border border-border hover:bg-elevated/70 transition font-medium">
              <Plus className="size-4" /> My List
            </button>
            <button className="inline-flex items-center gap-2 px-5 h-12 rounded-md bg-elevated border border-border hover:bg-elevated/70 transition font-medium">
              <ThumbsUp className="size-4" /> Rate
            </button>
            <button className="inline-flex items-center gap-2 px-5 h-12 rounded-md bg-elevated border border-border hover:bg-elevated/70 transition font-medium">
              <Download className="size-4" /> Download
            </button>
            <button className="inline-flex items-center gap-2 px-5 h-12 rounded-md bg-elevated border border-border hover:bg-elevated/70 transition font-medium">
              <Share2 className="size-4" /> Share
            </button>
          </div>

          {/* EPISODES / CHAPTERS */}
          {(title.kind === "Series" || title.kind === "Podcast") && (
            <div className="mt-12">
              <div className="flex items-end justify-between mb-4">
                <h2 className="text-xl font-semibold">{title.kind === "Series" ? "Episodes" : "Latest Episodes"}</h2>
                {title.seasons && (
                  <div className="text-sm text-[color:var(--muted-foreground)]">Season 1 of {title.seasons}</div>
                )}
              </div>
              <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                {episodes.map((ep) => (
                  <div key={ep.number} className="p-4 flex gap-4 items-start hover:bg-elevated/40 transition">
                    <div className="relative w-40 shrink-0 rounded-md overflow-hidden aspect-video">
                      <img src={title.cover} alt="" className="size-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 grid place-items-center opacity-0 hover:opacity-100 transition">
                        <Play className="size-[22px] fill-current" strokeWidth={2.5} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold truncate">{ep.title}</div>
                        <div className="text-xs text-[color:var(--muted-foreground)] shrink-0">{ep.duration}</div>
                      </div>
                      <p className="mt-1.5 text-sm text-[color:var(--secondary-foreground)] line-clamp-2">
                        {ep.synopsis}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MORE LIKE THIS */}
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4">More Like This</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {(related.length ? related : alsoLike).slice(0, 6).map((r) => (
                <Link
                  key={r.id}
                  to="/on-demand/$titleId"
                  params={{ titleId: r.id }}
                  className="group rounded-xl overflow-hidden border border-border bg-elevated/40 hover:border-accent/40 transition"
                >
                  <div className="relative aspect-video">
                    <img src={r.cover} alt="" className="size-full object-cover group-hover:scale-105 transition duration-500" />
                    <div className="absolute inset-0" style={{ background: "var(--gradient-card)" }} />
                    <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/60">{r.kind}</span>
                  </div>
                  <div className="p-3">
                    <div className="font-semibold text-sm line-clamp-1">{r.title}</div>
                    <div className="text-[11px] text-[color:var(--muted-foreground)] mt-0.5">{r.year} · {r.duration}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-6">
          <div className="rounded-xl border border-border bg-elevated/40 p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">Details</div>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-[color:var(--muted-foreground)]">Type</dt>
                <dd className="font-medium">{title.kind}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[color:var(--muted-foreground)]">Category</dt>
                <dd className="font-medium">{title.category}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[color:var(--muted-foreground)]">Year</dt>
                <dd className="font-medium">{title.year}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[color:var(--muted-foreground)]">Duration</dt>
                <dd className="font-medium">{title.duration}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[color:var(--muted-foreground)]">Rating</dt>
                <dd className="font-medium">{title.rating}</dd>
              </div>
              {title.cast && (
                <div>
                  <dt className="text-[color:var(--muted-foreground)] mb-1">Featuring</dt>
                  <dd className="font-medium">{title.cast.join(", ")}</dd>
                </div>
              )}
            </dl>
          </div>
          <div className="rounded-xl border border-border bg-gradient-to-br from-primary/20 via-transparent to-accent/20 p-5">
            <div className="text-sm font-semibold">Watch offline</div>
            <p className="mt-1.5 text-xs text-[color:var(--secondary-foreground)]">
              Download this title on the Lettflix app and watch anywhere, no internet required.
            </p>
            <button className="mt-4 w-full inline-flex justify-center items-center gap-2 px-4 h-10 rounded-md bg-white text-background font-semibold hover:bg-white/90 transition text-sm">
              <Download className="size-4" /> Get the App
            </button>
          </div>
        </aside>
      </section>

      <SiteFooter />
    </div>
  );
}
