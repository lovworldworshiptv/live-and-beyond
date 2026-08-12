import { createFileRoute } from "@tanstack/react-router";
import { CatalogBrowse } from "@/components/catalog-browse";

export const Route = createFileRoute("/series")({
  head: () => ({
    meta: [
      { title: "Series — Lettflix" },
      {
        name: "description",
        content:
          "Binge original series from broadcasters, ministries and creators worldwide. New seasons and episodes every week on Lettflix.",
      },
      { property: "og:title", content: "Series — Lettflix" },
      {
        property: "og:description",
        content: "Original and exclusive series, season by season, on Lettflix.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SeriesPage,
});

function SeriesPage() {
  return (
    <CatalogBrowse
      kinds={["Series"]}
      eyebrow="Featured Series"
      heading="Series"
      subheading="Season after season of stories worth staying up for."
      shape="portrait"
      placement="series"
    />
  );
}
