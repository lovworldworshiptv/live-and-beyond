import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/channels")({
  head: () => ({ meta: [{ title: "Channel Directory — Lettflix" }, { name: "description", content: "Explore live TV and radio channels on Lettflix." }, { property: "og:title", content: "Channel Directory — Lettflix" }, { property: "og:description", content: "Explore live TV and radio channels on Lettflix." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => <Outlet />,
});
