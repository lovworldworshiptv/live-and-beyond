import { createFileRoute } from "@tanstack/react-router";
import { StreamPlayer } from "@/components/stream-player";

export const Route = createFileRoute("/studio/preview")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Stream preview — Lettflix Studio" },
      { name: "description", content: "Preview your Lettflix live ingest stream before taking your channel on air." },
      { property: "og:title", content: "Stream preview — Lettflix Studio" },
      { property: "og:description", content: "Check your encoder feed privately before going live on Lettflix." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    url: typeof search.url === "string" ? search.url : "",
  }),
  component: PreviewPage,
});

function PreviewPage() {
  const { url } = Route.useSearch();
  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-extrabold tracking-tight">Stream preview</h1>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          Private preview of your encoder feed. Viewers cannot see this until you go live.
        </p>
        <div className="mt-6 rounded-2xl overflow-hidden border border-border bg-elevated/40 aspect-video">
          {url ? (
            <StreamPlayer src={url} autoPlay className="size-full" ariaPlayLabel="Play preview" />
          ) : (
            <div className="size-full grid place-items-center text-sm text-[color:var(--muted-foreground)]">
              No stream URL provided.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
