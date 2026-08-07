import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/kingschat/start")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { buildLoginUrl, safeRelativePath } = await import("@/lib/kingschat.server");
        const url = new URL(request.url);
        const next = safeRelativePath(url.searchParams.get("next"), "/");
        const forceLogin = url.searchParams.get("forceLogin") === "true";

        try {
          return Response.redirect(buildLoginUrl({ origin: next, forceLogin }), 302);
        } catch (error) {
          const message = error instanceof Error ? error.message : "KingsChat is not configured";
          console.error(`[KingsChat] start failed: ${message}`);
          return Response.redirect(
            new URL(`/auth?kingschat_error=${encodeURIComponent(message)}`, url.origin).toString(),
            302,
          );
        }
      },
    },
  },
});
