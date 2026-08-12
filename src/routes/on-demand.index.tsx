import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy /on-demand now lives at /movies. */
export const Route = createFileRoute("/on-demand/")({
  beforeLoad: () => {
    throw redirect({ to: "/movies" });
  },
  component: () => null,
});
