import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/movies")({
  head: () => ({ meta: [{ title: "On-Demand Movies — Lettflix" }, { name: "description", content: "Discover published movies on Lettflix." }, { property: "og:title", content: "On-Demand Movies — Lettflix" }, { property: "og:description", content: "Discover published movies on Lettflix." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => <Outlet />,
});
