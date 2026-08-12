import { createFileRoute } from "@tanstack/react-router";
import { CatalogBrowse } from "@/components/catalog-browse";

export const Route = createFileRoute("/podcasts")({
  head: () => ({
    meta: [
      { title: "Podcasts — Lettflix" },
      {
        name: "description",
        content:
          "Listen to podcasts and audio shows from broadcasters, ministries and creators worldwide — new episodes every week on Lettflix.",
      },
      { property: "og:title", content: "Podcasts — Lettflix" },
      {
        property: "og:description",
        content: "Podcasts and audio shows from creators worldwide, on Lettflix.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PodcastsPage,
});

function PodcastsPage() {
  return (
    <CatalogBrowse
      kinds={["Podcast"]}
      eyebrow="Featured Podcast"
      heading="Podcasts"
      subheading="Conversations, teaching and audio storytelling on demand."
      shape="square"
      placement="podcasts"
    />
  );
}
