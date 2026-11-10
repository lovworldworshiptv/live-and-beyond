import { createFileRoute, Link, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Check, ThumbsUp, Download, ChevronRight, Star, Clock, Calendar, Tv, Radio } from "lucide-react";
import { useRadio } from "@/components/radio-player";
import { fetchRadioSettings, type RadioFormat } from "@/lib/radio";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StreamPlayer } from "@/components/stream-player";
import { ShareMenu } from "@/components/share-menu";
import { titles as staticTitles, getTitle, type Title } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";
import { mapTitleRow, useCmsTitles } from "@/lib/cms-catalog";
import { useMyList } from "@/lib/personal";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MovieArtwork } from "@/components/movie-artwork";

export const Route = createFileRoute("/movies/$titleId")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Watch on Lettflix" },
      { property: "og:description", content: "Stream on-demand premium content on Lettflix." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
        <Button variant="ghost" onClick={() => { router.invalidate(); reset(); }} className="mt-6 px-5 h-11 rounded-md bg-primary text-primary-foreground font-semibold">
          Try again
        </Button>
      </div>
    </div>
  );
}

function TitleDetail() {
  const { titleId } = Route.useParams();
  const [title, setTitle] = useState<Title | null>(null);
  const [analyticsIds, setAnalyticsIds] = useState<{ titleId: string; channelId: string | null } | null>(null);
  const [notFoundState, setNotFoundState] = useState(false);
  const [rated, setRated] = useState(false);
  const [playerKey, setPlayerKey] = useState(0);
  const { has: hasInList, toggle: toggleList } = useMyList();
  const { titles: allTitles } = useCmsTitles();

  useEffect(() => {
    let cancelled = false;
    setNotFoundState(false);
    setTitle(null);
    setAnalyticsIds(null);
    (async () => {
      const { data } = await supabase
        .from("cms_titles")
        .select("*")
        .eq("slug", titleId)
        .eq("is_published", true)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setTitle(mapTitleRow(data as never));
        setAnalyticsIds({ titleId: data.id, channelId: data.channel_id });
      }
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
          <MovieArtwork src={title.hero} fallbackSrc={title.cover} alt="" className="size-full object-cover opacity-50" />
          <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-background" />
        </div>

        <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-10 pt-6">
          <div className="text-xs text-[color:var(--muted-foreground)] flex items-center gap-1.5">
            <Link to="/movies" className="hover:text-foreground">On Demand</Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground">{title.title}</span>
          </div>

          <div id="title-player" className="mt-6 w-full min-w-0 scroll-mt-24">
            <StreamPlayer
              key={`${title.id}-${playerKey}`}
              titleId={title.id}
              analyticsTitleId={analyticsIds?.titleId}
              analyticsChannelId={analyticsIds?.channelId}
              src={title.streamUrl}
              poster={title.hero || title.cover}
              posterFallback={title.cover}
              kind={audioKind ? "audio" : "video"}
              className={audioKind ? "aspect-[21/9] lg:aspect-[21/6]" : "aspect-video"}
              posterOverlayLabel={`Play — ${title.title}`}
              ariaPlayLabel={audioKind ? "Listen" : "Play"}
            />
            {analyticsIds?.channelId && <BackToLive channelId={analyticsIds.channelId} onRadio={() => setPlayerKey((k) => k + 1)} />}
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
          </div>

          <p className="mt-5 text-[color:var(--secondary-foreground)] max-w-2xl">{title.synopsis}</p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button variant="ghost"
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
            </Button>
            <Button variant="ghost"
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
            </Button>
            <Button variant="ghost"
              onClick={() => toast("Download unavailable", { description: "Offline downloads are not currently available." })}
              className="inline-flex items-center gap-2 px-5 h-12 rounded-md bg-elevated border border-border hover:bg-elevated/70 transition font-medium"
            >
              <Download className="size-4" /> Download
            </Button>
            <div className="h-12 w-32">
              <ShareMenu title={title.title} path={`/movies/${title.id}`} image={title.hero || title.cover} variant="chip" />
            </div>
          </div>


          {(title.kind === "Series" || title.kind === "Podcast") && <p className="mt-8 text-sm text-muted-foreground">Episode listings have not been published for this title.</p>}

          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4">More Like This</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(related.length ? related : alsoLike).slice(0, 6).map((r) => (
                <Link
                  key={r.id}
                  to="/movies/$titleId"
                  params={{ titleId: r.id }}
                  className="group rounded-xl overflow-hidden border border-border bg-elevated/40 hover:border-accent/40 transition"
                >
                  <div className="relative aspect-video">
                    <MovieArtwork src={r.hero} fallbackSrc={r.cover} alt={r.title} className="size-full object-cover group-hover:scale-105 transition duration-500" />
                    <div className="absolute inset-0" style={{ background: "var(--gradient-card)" }} />
                    <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/60">{r.kind}</span>
                  </div>
                  <div className="p-2 sm:p-3">
                    <div className="font-semibold text-xs sm:text-sm line-clamp-1">{r.title}</div>
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
              Offline downloads are not currently available.
            </p>
          </div>
        </aside>
      </section>

      <SiteFooter />
    </div>
  );
}

type LiveChannel = { id: string; slug: string; name: string; tagline: string | null; logo_url: string | null; banner_url: string | null; category: string | null; country: string | null; language: string | null; stream_url: string | null; is_live: boolean | null };

/** Quiet return path from on-demand to the title's live TV channel and live radio. */
function BackToLive({ channelId, onRadio }: { channelId: string; onRadio: () => void }) {
  const radioPlayer = useRadio();
  const [channel, setChannel] = useState<LiveChannel | null>(null);
  const [radio, setRadio] = useState<Awaited<ReturnType<typeof fetchRadioSettings>>>(null);
  useEffect(() => {
    let cancelled = false;
    void supabase.from("cms_channels").select("id,slug,name,tagline,logo_url,banner_url,category,country,language,stream_url,is_live")
      .eq("id", channelId).eq("is_published", true).is("deleted_at", null).maybeSingle()
      .then(({ data }) => { if (!cancelled) setChannel(data as LiveChannel | null); });
    fetchRadioSettings(channelId).then((r) => { if (!cancelled) setRadio(r?.is_enabled && r.stream_url ? r : null); }).catch(() => {});
    return () => { cancelled = true; };
  }, [channelId]);
  if (!channel) return null;
  const hasTv = !!channel.stream_url;
  if (!hasTv && !radio) return null;
  const listen = () => {
    if (!radio) return;
    onRadio();
    radioPlayer.play({
      channelId: channel.id, slug: channel.slug, name: channel.name, tagline: channel.tagline,
      logoUrl: radio.artwork_url || channel.logo_url, bannerUrl: channel.banner_url,
      category: channel.category, country: channel.country, language: channel.language,
      streamUrl: radio.stream_url!, format: (radio.format ?? "mp3") as RadioFormat, bitrate: radio.bitrate_kbps ?? 128,
      nowPlayingTitle: radio.now_playing_title, nowPlayingArtist: radio.now_playing_artist,
      nowPlayingArtwork: radio.now_playing_artwork_url, stationMessage: radio.station_message,
    });
  };
  const radioOn = radioPlayer.station?.channelId === channel.id && radioPlayer.playing;
  return (
    <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2 rounded-xl border border-border bg-surface/70 px-3 py-2 backdrop-blur">
      <span className="flex min-w-0 flex-1 items-center gap-2 text-xs text-muted-foreground">
        {channel.logo_url && <img src={channel.logo_url} alt="" className="size-6 shrink-0 rounded object-contain bg-elevated" />}
        <span className="truncate">Back to live on <span className="font-semibold text-foreground">{channel.name}</span></span>
      </span>
      {hasTv && (
        <Button asChild size="sm" variant="secondary" className="h-9 gap-1.5">
          <Link to="/channels/$channelId" params={{ channelId: channel.slug }}>
            <span className={`size-1.5 rounded-full bg-primary ${channel.is_live ? "animate-pulse" : ""}`} aria-hidden />
            <Tv className="size-4" /> Live TV
          </Link>
        </Button>
      )}
      {radio && (
        <Button size="sm" variant="secondary" className="h-9 gap-1.5" onClick={listen} aria-pressed={radioOn}>
          <Radio className="size-4" /> {radioOn ? "On air" : "Live radio"}
        </Button>
      )}
    </div>
  );
}
