import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/channels/$channelId")({
  component: () => <Outlet />,
});
