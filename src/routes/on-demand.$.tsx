import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy /on-demand/* URLs now live under /movies/*. */
export const Route = createFileRoute("/on-demand/$")({
  beforeLoad: ({ params }) => {
    const rest = (params as { _splat?: string })._splat;
    throw redirect({ to: rest ? `/movies/${rest}` : "/movies" });
  },
  component: () => null,
});
