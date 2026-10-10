import { createFileRoute, Link, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Play, Plus, Check, ThumbsUp, Download, ChevronRight, Star, Clock, Calendar } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StreamPlayer } from "@/components/stream-player";
import { ShareMenu } from "@/components/share-menu";
import { titles as staticTitles, getTitle, type Title } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";
import { mapTitleRow, useCmsTitles } from "@/lib/cms-catalog";
import { useMyList } from "@/lib/personal";
import { toast } from "sonner";

export const Route = createFileRoute("/movies/$titleId")({
  head: () => ({
    meta: [
      { title: "Watch on Lettflix" },
      { name: "description", content: "Stream on-demand premium content on Lettflix." },
    ],
  }),
  codeSplitGroupings: [["component", "notFoundComponent", "errorComponent"]],
  notFoundComponent: TitleNotFound,
  errorComponent: TitleError,
  component: TitleDetail,
});

function TitleNotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-[900px] px-6 py-24 text-center">
        <h1 className="text-3xl font-bold">Title not found</h1>
        <Link to="/movies" className="inline-flex mt-6 px-5 h-11 items-center rounded-md bg-primary text-primary-foreground font-semibold">
          Browse On Demand
        </Link>
      </div>
    </div>
  );
}

function TitleError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-[900px] px-6 py-24 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">{error instanceof Error ? error.message : String(error)}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-6 px-5 h-11 rounded-md bg-primary text-primary-foreground font-semibold">
          Try again
        </button>
      </div>
    </div>
  );
}

function TitleDetail() {
  const { titleId } = Route.useParams();
  const [title, setTitle] = useState<Title | null>(null);
  const [notFoundState, setNotFoundState] = useState(false);
  const [rated, setRated] = useState(false);
  const { has: hasInList, toggle: toggleList } = useMyList();
  const { titles: allTitles } = useCmsTitles();

  useEffect(() => {
    let cancelled = false;
    setNotFoundState(false);
    setTitle(null);
    (async () => {
      const { data } = await supabase
        .from("cms_titles")
        .select("*")
        .eq("slug", titleId)
        .eq("is_published", true)
        .maybeSingle();
      if (cancelled) return;
      if (data) setTitle(mapTitleRow(data as never));
      else setNotFoundState(true);
    })();
    return () => { cancelled = true; };
  }, [titleId]);

  if (notFoundState) return <TitleNotFound />;
  if (!title) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="mx-auto max-w-[1480px] px-6 py-24 text-center text-[color:var(--muted-foreground)]">Loading title…</div>
      </div>
    );
  }

  const audioKind = title.kind === "Podcast";
  const related = allTitles.filter((t) => t.id !== title.id && t.category === title.category);
  const alsoLike = allTitles.filter((t) => t.id !== title.id).slice(0, 6);


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
            <Link to="/movies" className="hover:text-foreground">On Demand</Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground">{title.title}</span>
          </div>

          <div className="mt-6 max-w-5xl">
            <StreamPlayer
              titleId={title.id}
              src={title.streamUrl}
              poster={title.hero || title.cover}
              kind={audioKind ? "audio" : "video"}
              className={audioKind ? "aspect-[21/9] lg:aspect-[21/6]" : "aspect-video"}
              posterOverlayLabel={`Play — ${title.title}`}
              ariaPlayLabel={audioKind ? "Listen" : "Play"}
            />
            {!title.streamUrl && (
              <p className="mt-2 text-xs text-[color:var(--muted-foreground)]">
                This title is not available to play yet.
              </p>
            )}
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

          <p className="mt-5 text-[color:var(--secondary-foreground)] max-w-2xl">{title.synopsis}</p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#top"
              onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="inline-flex items-center gap-2 px-6 h-12 rounded-md bg-white text-background font-semibold hover:bg-white/90 transition"
            >
              <Play className="size-[19px] fill-current" strokeWidth={2.5} /> Play
            </a>
            <button
              onClick={() => {
                const wasIn = hasInList(title.id);
                toggleList(title.id);
                toast(wasIn ? "Removed from My List" : "Added to My List", { description: title.title });
              }}
              className={`inline-flex items-center gap-2 px-5 h-12 rounded-md border transition font-medium ${
                hasInList(title.id)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-elevated border-border hover:bg-elevated/70"
              }`}
            >
              {hasInList(title.id) ? <Check className="size-4" /> : <Plus className="size-4" />}
              {hasInList(title.id) ? "In My List" : "My List"}
            </button>
            <button
              onClick={() => {
                setRated((r) => !r);
                toast.success(rated ? "Rating removed" : "Thanks for rating!", { description: title.title });
              }}
              className={`inline-flex items-center gap-2 px-5 h-12 rounded-md border transition font-medium ${
                rated
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-elevated border-border hover:bg-elevated/70"
              }`}
            >
              <ThumbsUp className={`size-4 ${rated ? "fill-current" : ""}`} /> {rated ? "Rated" : "Rate"}
            </button>
            <button
              onClick={() => toast("Download unavailable", { description: "Downloads are available on the Lettflix mobile app." })}
              className="inline-flex items-center gap-2 px-5 h-12 rounded-md bg-elevated border border-border hover:bg-elevated/70 transition font-medium"
            >
              <Download className="size-4" /> Download
            </button>
            <div className="h-12 w-32">
              <ShareMenu title={title.title} path={`/movies/${title.id}`} variant="chip" />
            </div>
          </div>


          {(title.kind === "Series" || title.kind === "Podcast") && <p className="mt-8 text-sm text-muted-foreground">Episode listings have not been published for this title.</p>}

          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4">More Like This</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {(related.length ? related : alsoLike).slice(0, 6).map((r) => (
                <Link
                  key={r.id}
                  to="/movies/$titleId"
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

        <aside className="space-y-6">
          <div className="rounded-xl border border-border bg-elevated/40 p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">Details</div>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-[color:var(--muted-foreground)]">Type</dt><dd className="font-medium">{title.kind}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-[color:var(--muted-foreground)]">Category</dt><dd className="font-medium">{title.category}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-[color:var(--muted-foreground)]">Year</dt><dd className="font-medium">{title.year}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-[color:var(--muted-foreground)]">Duration</dt><dd className="font-medium">{title.duration}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-[color:var(--muted-foreground)]">Rating</dt><dd className="font-medium">{title.rating}</dd></div>
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
