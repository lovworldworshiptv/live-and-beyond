import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const sendSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(500),
  imageUrl: z.string().url().optional().or(z.literal("")),
  link: z.string().max(500).optional().or(z.literal("")),
  segment: z.enum(["all", "creators", "viewers"]).default("all"),
});

async function requireAdmin(supabase: any, userId: string) {
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!isAdmin) throw new Error("Admin access required");
}

/** Send an admin announcement: in-app inbox + popup for every targeted user, plus phone push when configured. */
export const sendAdminNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => sendSchema.parse(data))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Resolve the audience.
    let userIds: string[] = [];
    if (data.segment === "all") {
      const { data: profiles } = await supabaseAdmin.from("profiles").select("id");
      userIds = (profiles ?? []).map((p) => p.id as string);
    } else {
      const role = data.segment === "creators" ? "creator" : "viewer";
      const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", role);
      userIds = (roles ?? []).map((r) => r.user_id as string);
    }

    const rows = userIds.map((uid) => ({
      user_id: uid,
      kind: "announcement",
      title: data.title,
      body: data.body,
      link: data.link || null,
      image_url: data.imageUrl || null,
    }));
    let insertError: string | null = null;
    if (rows.length) {
      const { error } = await supabaseAdmin.from("notifications").insert(rows);
      if (error) insertError = error.message;
    }

    // Phone push via Firebase Cloud Messaging, when the connection is linked.
    let pushCount = 0;
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const fcmKey = process.env["FIREBASE_MESSAGING_API_KEY"];
    if (lovableKey && fcmKey && userIds.length) {
      const { data: tokens } = await supabaseAdmin
        .from("device_push_tokens")
        .select("token")
        .in("user_id", userIds);
      for (const row of tokens ?? []) {
        try {
          const res = await fetch("https://connector-gateway.lovable.dev/firebase_messaging/v1/projects/_/messages:send", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableKey}`,
              "X-Connection-Api-Key": fcmKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: {
                token: row.token,
                notification: { title: data.title, body: data.body },
                data: { path: data.link || "/" },
              },
            }),
          });
          if (res.ok) pushCount += 1;
          else if (res.status === 404 || res.status === 400) {
            await supabaseAdmin.from("device_push_tokens").delete().eq("token", row.token);
          }
        } catch {
          /* best-effort push; inbox copy already stored */
        }
      }
    }

    const { error: campaignError } = await supabaseAdmin.from("notification_campaigns").insert({
      created_by: context.userId,
      title: data.title,
      body: data.body,
      image_url: data.imageUrl || null,
      link: data.link || null,
      segment: data.segment,
      status: insertError ? "failed" : "sent",
      recipient_count: rows.length,
      push_count: pushCount,
      error: insertError,
    });
    if (campaignError) throw new Error(campaignError.message);
    if (insertError) throw new Error(insertError);
    return { recipients: rows.length, pushed: pushCount };
  });

/** Recent campaigns for the admin history list. */
export const listAdminNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("notification_campaigns")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Store the signed-in user's device push token. */
export const registerPushToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { token: string }) => z.object({ token: z.string().min(10) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("device_push_tokens")
      .upsert({ user_id: context.userId, token: data.token, platform: "web" }, { onConflict: "token" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
