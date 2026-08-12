import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy /on-demand/* URLs now live under /movies/*. */
export const Route = createFileRoute("/on-demand/$")({
  beforeLoad: ({ params }) => {
    const rest = (params as { _splat?: string })._splat;
    if (rest) throw redirect({ to: "/movies/$titleId", params: { titleId: rest } });
    throw redirect({ to: "/movies" });
  },
  component: () => null,
});
