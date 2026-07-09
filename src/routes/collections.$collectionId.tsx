import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Play } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TitleCard } from "@/components/title-card";
import { getCollection, titlesInCollection } from "@/lib/collections";
import type { Title } from "@/lib/catalog";

export const Route = createFileRoute("/collections/$collectionId")({
  loader: ({ params }) => {
    const collection = getCollection(params.collectionId);
    if (!collection) throw notFound();
    return { collection, titles: titlesInCollection(params.collectionId) };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.collection.name} — Lettflix Collections` },
          { name: "description", content: loaderData.collection.tagline },
          { property: "og:title", content: `${loaderData.collection.name} — Lettflix` },
          { property: "og:description", content: loaderData.collection.tagline },
        ]
      : [],
  }),
  errorComponent: ({ error }) => (
    <div className="min-h-screen grid place-items-center bg-background text-foreground p-8">
      <p className="text-sm text-[color:var(--muted-foreground)]">{error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center bg-background text-foreground">
      <div className="text-center">
        <div className="text-sm text-[color:var(--muted-foreground)]">Collection not found.</div>
        <Link to="/on-demand" className="text-accent hover:underline mt-2 inline-block">
          Back to On Demand
        </Link>
      </div>
    </div>
  ),
  component: CollectionPage,
});

function CollectionPage() {
  const { collection, titles } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="relative border-b border-border overflow-hidden">
        <div className="absolute inset-0" style={{ background: collection.gradient }} />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative mx-auto max-w-[1480px] px-6 lg:px-10 pt-16 pb-14">
          <Link
            to="/on-demand"
            className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white mb-6"
          >
            <ArrowLeft className="size-4" /> On Demand
          </Link>
          <div className="text-[11px] uppercase tracking-widest text-white/80 font-semibold">
            Featured Collection
          </div>
          <h1 className="mt-3 text-4xl lg:text-6xl font-extrabold tracking-tight text-white max-w-3xl">
            {collection.name}
          </h1>
          <p className="mt-4 text-lg text-white/85 max-w-2xl">{collection.tagline}</p>
          <div className="mt-6 flex items-center gap-3">
            {titles[0] && (
              <Link
                to="/on-demand/$titleId"
                params={{ titleId: titles[0].id }}
                className="inline-flex items-center gap-2 px-5 h-11 rounded-md bg-white text-background font-semibold hover:bg-white/90 transition"
              >
                <Play className="size-[19px] fill-current" strokeWidth={2.5} /> Play Feature
              </Link>
            )}
            <div className="text-sm text-white/70">{titles.length} titles</div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1480px] px-6 lg:px-10 mt-10 mb-16">
        {titles.length === 0 ? (
          <div className="text-center py-20 text-[color:var(--muted-foreground)]">
            This collection is being curated. Check back soon.
          </div>
        ) : (
          <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {titles.map((t: Title) => (
              <TitleCard key={t.id} t={t} />
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
