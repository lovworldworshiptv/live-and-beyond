import { createFileRoute } from "@tanstack/react-router";
import { CatalogBrowse } from "@/components/catalog-browse";

export const Route = createFileRoute("/documentaries")({
  head: () => ({
    meta: [
      { title: "Documentaries — Lettflix" },
      {
        name: "description",
        content:
          "True stories, investigations and feature documentaries from broadcasters and creators around the world, streaming on Lettflix.",
      },
      { property: "og:title", content: "Documentaries — Lettflix" },
      {
        property: "og:description",
        content: "Feature documentaries and true stories, streaming on Lettflix.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DocumentariesPage,
});

function DocumentariesPage() {
  return (
    <CatalogBrowse
      kinds={["Documentary"]}
      eyebrow="Featured Documentary"
      heading="Documentaries"
      subheading="Real people, real events, told in full."
      shape="landscape"
      placement="documentaries"
    />
  );
}
