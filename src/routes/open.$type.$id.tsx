import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Smartphone, Download, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveSharedTarget } from "@/lib/share-link.functions";
import { androidIntentUrl, appDeepLink } from "@/lib/app-open";
import { trackAudience } from "@/lib/audience";
import { ShareMenu } from "@/components/share-menu";

export const Route = createFileRoute("/open/$type/$id")({
  loader: async ({ params }) => {
    if (params.type !== "channel" && params.type !== "creator") throw notFound();
    const target = await resolveSharedTarget({ data: { type: params.type, id: params.id } });
    if (!target) throw notFound();
    return target;
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.name} on Lettflix` : "Open in Lettflix";
    const description = loaderData?.subtitle ?? "Watch live TV, radio and on-demand content on Lettflix.";
    const img = loaderData?.image?.startsWith("https://") ? loaderData.image : null;
    return {
      meta: [
        { title }, { name: "description", content: description },
        { property: "og:title", content: title }, { property: "og:description", content: description },
        { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
        ...(img ? [{ property: "og:image", content: img }, { name: "twitter:image", content: img }] : []),
      ],
    };
  },
  notFoundComponent: () => (
    <main className="min-h-dvh grid place-items-center p-6 text-center">
      <div><h1 className="text-2xl font-semibold">This link is no longer available</h1>
        <Button asChild className="mt-4"><Link to="/channels">Browse channels</Link></Button></div>
    </main>
  ),
  component: OpenShared,
});

function OpenShared() {
  const t = Route.useLoaderData();
  const [android, setAndroid] = useState(false);
  const [inApp, setInApp] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isAndroid = /Android/i.test(ua);
    setAndroid(isAndroid);
    setInApp(/LettflixApp/i.test(ua));
    trackAudience({ kind: "share_open", targetType: t.type, channelId: t.type === "channel" ? t.id : null, creatorId: t.type === "creator" ? t.id : null });
    trackAudience({ kind: "visit", targetType: t.type, channelId: t.type === "channel" ? t.id : null, creatorId: t.type === "creator" ? t.id : null });
    // Android: hand off to the installed app; without it the browser goes to the store.
    if (isAndroid && !/LettflixApp/i.test(ua) && t.appLinks.playStoreUrl) {
      window.location.href = androidIntentUrl(t.appLinks, t.type, t.id, window.location.origin + t.webPath);
    }
  }, [t]);

  const openApp = () => {
    window.location.href = android
      ? androidIntentUrl(t.appLinks, t.type, t.id, window.location.origin + t.webPath)
      : appDeepLink(t.appLinks, t.type, t.id);
  };

  return (
    <main className="min-h-dvh bg-background px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-md min-w-0 text-center">
        <div className="aspect-video overflow-hidden rounded-2xl border border-border bg-elevated">
          {t.image && <img src={t.image} alt={t.name} className="size-full object-contain" />}
        </div>
        <p className="mt-6 text-xs uppercase tracking-widest text-muted-foreground">{t.type === "channel" ? "Channel" : "Creator"} on Lettflix</p>
        <h1 className="mt-1 font-display text-3xl font-bold break-words">{t.name}</h1>
        {t.subtitle && <p className="mt-2 text-sm text-muted-foreground">{t.subtitle}</p>}

        <div className="mt-6 grid gap-3">
          {!inApp && <Button size="lg" className="h-12" onClick={openApp}><Smartphone />Open in Lettflix app</Button>}
          {t.appLinks.playStoreUrl && <Button asChild size="lg" variant="outline" className="h-12"><a href={t.appLinks.playStoreUrl} rel="noopener"><Download />Get it on Google Play</a></Button>}
          {t.appLinks.loveworldAppStoreUrl && <Button asChild size="lg" variant="outline" className="h-12"><a href={t.appLinks.loveworldAppStoreUrl} rel="noopener"><Download />Get it on Loveworld AppStore</a></Button>}
          <Button asChild size="lg" variant="ghost" className="h-12"><a href={t.webPath}><Globe />Continue on the web</a></Button>
        </div>

        {t.channels.length > 0 && (
          <div className="mt-8 text-left">
            <h2 className="text-sm font-semibold">Channels</h2>
            <ul className="mt-3 grid gap-2">
              {t.channels.map((c) => (
                <li key={c.id}><a href={`/channels/${c.slug}`} className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-elevated/50 p-3 hover:border-primary/40">
                  {c.logo && <img src={c.logo} alt="" className="size-10 shrink-0 rounded object-contain bg-background" />}
                  <span className="truncate font-medium">{c.name}</span></a></li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-8 flex justify-center"><ShareMenu title={t.name} path={`/open/${t.type}/${t.id}`} image={t.image} subtitle={t.subtitle ?? undefined} variant="chip" /></div>
      </div>
    </main>
  );
}
