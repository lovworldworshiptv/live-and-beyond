import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/channels/$channelId")({
  head: () => ({ meta: [{ title: "Channel Workspace — Lettflix" }, { name: "description", content: "Watch broadcasts and explore channel libraries on Lettflix." }, { property: "og:title", content: "Channel Workspace — Lettflix" }, { property: "og:description", content: "Watch broadcasts and explore channel libraries on Lettflix." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => <Outlet />,
});
