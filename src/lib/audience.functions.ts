import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const UUID = z.string().uuid();
const schema = z.object({
  kind: z.enum(["visit", "click", "stream", "share_open"]),
  targetType: z.enum(["channel", "creator", "title"]),
  channelId: z.string().max(120).nullish(),
  creatorId: UUID.nullish(),
  titleId: UUID.nullish(),
  service: z.enum(["tv", "radio", "vod", "podcast"]).nullish(),
  sessionId: z.string().max(80).nullish(),
  platform: z.string().max(20).nullish(),
});

function decodeHeader(v: string | null) {
  if (!v) return null;
  try { return decodeURIComponent(v).slice(0, 80); } catch { return v.slice(0, 80); }
}

/** Public: records an audience signal with the visitor's approximate city/country from the edge network. */
export const recordAudienceEvent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    try {
      const request = getRequest();
      const cf = (request as unknown as { cf?: { country?: string; city?: string } }).cf;
      const country = cf?.country ?? request.headers.get("cf-ipcountry");
      const city = cf?.city ?? decodeHeader(request.headers.get("cf-ipcity"));
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      let creatorId = data.creatorId ?? null;
      let channelId: string | null = null;
      if (data.channelId) {
        const isUuid = UUID.safeParse(data.channelId).success;
        const { data: ch } = await supabaseAdmin
          .from("cms_channels").select("id, creator_id, created_by")
          .eq(isUuid ? "id" : "slug", data.channelId).is("deleted_at", null).maybeSingle();
        if (!ch) return { ok: false };
        channelId = ch.id;
        creatorId = ch.creator_id ?? ch.created_by ?? creatorId;
      }
      await supabaseAdmin.from("audience_events").insert({
        kind: data.kind,
        target_type: data.targetType,
        channel_id: channelId,
        creator_id: creatorId,
        title_id: data.titleId ?? null,
        service: data.service ?? null,
        session_id: data.sessionId ?? null,
        platform: data.platform ?? null,
        country: country && country !== "XX" ? country.slice(0, 2) : null,
        city: city || null,
      });
      return { ok: true };
    } catch {
      return { ok: false };
    }
  });
