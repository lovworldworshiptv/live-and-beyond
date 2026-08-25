import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  channelId: z.string().uuid(),
  title: z.string().min(1).max(120),
  body: z.string().max(280).optional(),
});

/** Notify every follower of a channel that it just went live. */
export const notifyFollowersLive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: allowed, error: permErr } = await context.supabase.rpc("can_manage_channel", {
      _user_id: context.userId,
      _channel_id: data.channelId,
    });
    if (permErr || !allowed) throw new Error("Not allowed to broadcast for this channel");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: channel } = await supabaseAdmin
      .from("cms_channels")
      .select("name, slug, logo_url")
      .eq("id", data.channelId)
      .maybeSingle();

    const { data: followers } = await supabaseAdmin
      .from("channel_follows")
      .select("user_id")
      .eq("channel_id", data.channelId);

    const rows = (followers ?? []).map((f) => ({
      user_id: f.user_id as string,
      kind: "live",
      title: data.title,
      body: data.body ?? `${channel?.name ?? "A channel you follow"} is live right now.`,
      link: channel?.slug ? `/channels/${channel.slug}` : null,
      image_url: channel?.logo_url ?? null,
    }));

    if (!rows.length) return { notified: 0 };
    const { error } = await supabaseAdmin.from("notifications").insert(rows);
    if (error) throw new Error(error.message);
    return { notified: rows.length };
  });
