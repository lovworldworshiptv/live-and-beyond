import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ppvDraftSchema } from "./ppv";

export const getPpvWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ channelId: z.string().uuid().optional() }).parse(input))
  .handler(async ({ data, context }) => {
    if (data.channelId) {
      const { requireChannelAccess } = await import("./channel-access.server");
      await requireChannelAccess(context.supabase, context.userId, data.channelId);
    } else {
      const check = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
      if (check.error || check.data !== true) throw new Error("Admin access required");
    }
    let events = context.supabase.from("ppv_events").select("*").order("created_at", { ascending: false }).limit(100);
    let channels = context.supabase.from("cms_channels").select("id,name").is("deleted_at", null).order("name");
    let settings = context.supabase.from("ppv_channel_settings").select("*");
    if (data.channelId) {
      events = events.eq("channel_id", data.channelId);
      channels = channels.eq("id", data.channelId);
      settings = settings.eq("channel_id", data.channelId);
    }
    const [platform, channelSettings, eventRows, channelRows] = await Promise.all([
      context.supabase.from("ppv_platform_settings").select("*").eq("id", true).maybeSingle(),
      settings, events, channels,
    ]);
    for (const result of [platform, channelSettings, eventRows, channelRows]) if (result.error) throw new Error("Could not load Pay-Per-View. Try again.");
    return { platform: platform.data, settings: channelSettings.data ?? [], events: eventRows.data ?? [], channels: channelRows.data ?? [] };
  });

export const savePpvSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    channelId: z.string().uuid().optional(), enabled: z.boolean(),
    approvalRequired: z.boolean().default(true), commissionBps: z.number().int().min(0).max(10000).nullable(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const check = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (check.error || check.data !== true) throw new Error("Admin access required");
    if (!data.channelId && data.commissionBps === null) throw new Error("Set the platform commission");
    const result = data.channelId
      ? await context.supabase.from("ppv_channel_settings").upsert({ channel_id: data.channelId, enabled: data.enabled, approval_required: data.approvalRequired, platform_commission_bps: data.commissionBps })
      : await context.supabase.from("ppv_platform_settings").upsert({ id: true, enabled: data.enabled, platform_commission_bps: data.commissionBps ?? 2500 });
    if (result.error) throw new Error("Could not save PPV settings");
    return { ok: true };
  });

export const savePpvDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ppvDraftSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { requireChannelAccess } = await import("./channel-access.server");
    await requireChannelAccess(context.supabase, context.userId, data.channel_id);
    const { id, ...payload } = data;
    const result = id
      ? await context.supabase.from("ppv_events").update(payload).eq("id", id).eq("channel_id", data.channel_id).select("id").single()
      : await context.supabase.from("ppv_events").insert({ ...payload, created_by: context.userId }).select("id").single();
    if (result.error) throw new Error("Could not save event. Check that PPV is enabled for this channel.");
    return result.data;
  });

export const reviewPpvEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), status: z.enum(["approved", "rejected"]), note: z.string().max(1000), commissionBps: z.number().int().min(0).max(10000).nullable() }).parse(input))
  .handler(async ({ data, context }) => {
    const check = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (check.error || check.data !== true) throw new Error("Admin access required");
    const result = await context.supabase.from("ppv_events").update({ status: data.status, admin_note: data.note, platform_commission_bps: data.commissionBps }).eq("id", data.id).eq("status", "pending").select("id").single();
    if (result.error) throw new Error("Review could not be saved. Refresh and try again.");
    return { ok: true };
  });

export const requestPpvSpotlight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ eventId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: event, error } = await context.supabase.from("ppv_events").select("*").eq("id", data.eventId).single();
    if (error || !event || event.status !== "approved" || !event.poster_url) throw new Error("Approve the event and add artwork first");
    const result = await context.supabase.from("hero_requests").insert({ channel_id: event.channel_id, requested_by: context.userId, content_kind: "upcoming", ppv_event_id: event.id, title: event.title, description: event.description.slice(0, 600), image_url: event.poster_url, starts_at: event.starts_at });
    if (result.error) throw new Error("Request could not be sent. Check PPV switches or an existing pending request.");
    return { ok: true };
  });

export const reviewPpvSpotlight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ requestId: z.string().uuid(), approve: z.boolean(), note: z.string().max(1000) }).parse(input))
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("review_ppv_spotlight", { _request_id: data.requestId, _approve: data.approve, _note: data.note });
    if (result.error) throw new Error("Could not review PPV spotlight. Check event approval and PPV switches.");
    return { ok: true };
  });

export const getPublicPpvEvent = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) throw new Error("Event details are unavailable");
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } } });
    const result = await client.rpc("public_ppv_event", { _id: data.id });
    if (result.error) throw new Error("Event details are unavailable");
    return (result.data?.[0] ?? null) as { id: string; title: string; description: string; poster_url: string | null; event_type: string; starts_at: string; duration_minutes: number; replay_hours: number; rental_start_days: number; price_ngn_minor: number; price_usd_minor: number; channel_name: string; channel_slug: string } | null;
  });