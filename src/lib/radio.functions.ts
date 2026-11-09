import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({ channelId: z.string().uuid() });

export type NowPlaying = {
  title: string | null;
  artist: string | null;
  artwork: string | null;
  listeners: number | null;
};

/** Public: resolve the current track for a radio station (Icecast/Shoutcast/manual). */
export const getRadioNowPlaying = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }): Promise<NowPlaying> => {
    const { resolveRadioNowPlaying } = await import("@/lib/radio-now-playing.server");
    return resolveRadioNowPlaying(data.channelId);
  });
