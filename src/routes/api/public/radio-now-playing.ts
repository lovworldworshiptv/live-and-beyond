import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/api/public/radio-now-playing")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const parsed = z.string().uuid().safeParse(new URL(request.url).searchParams.get("channelId"));
        if (!parsed.success) return Response.json({ error: "Invalid channel" }, { status: 400 });
        const { resolveRadioNowPlaying } = await import("@/lib/radio-now-playing.server");
        const song = await resolveRadioNowPlaying(parsed.data);
        return Response.json(song, { headers: { "Cache-Control": "public, max-age=15" } });
      },
    },
  },
});