import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ppvDraftSchema } from "./ppv";

export const getPpvPurchase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ eventId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { setResponseHeader } = await import("@tanstack/react-start/server");
    setResponseHeader("Cache-Control", "no-store");
    const result = await context.supabase.from("ppv_orders").select("id,status,payment_state,amount_minor,currency,access_starts_at,access_expires_at,created_at").eq("event_id", data.eventId).eq("user_id", context.userId).order("created_at", { ascending: false }).limit(20);
    if (result.error) throw new Error("Could not load your purchase");
    const rows = result.data ?? [];
    const active = rows.find(row => row.status === "paid" && row.payment_state === "fulfilled" && Date.parse(row.access_expires_at) > Date.now());
    const purchase = active ?? (rows.length ? rows[0] : null);
    return purchase ? { ...purchase, serverNow: new Date().toISOString() } : null;
  });

export const startPpvCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ eventId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const accountId = process.env["CLOUDFLARE_ACCOUNT_ID"];
    const apiToken = process.env["CLOUDFLARE_STREAM_API_TOKEN"];
    if (!accountId || !apiToken) throw new Error("Ticket sales are unavailable");
    const auth = await context.supabase.auth.getUser();
    if (auth.error || !auth.data.user?.email) throw new Error("A verified email is required for checkout");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { signPremiumStream } = await import("./ppv-access.server");
    const { enforcePpvLimit } = await import("./ppv-security.server");
    await enforcePpvLimit(supabaseAdmin, context.userId, "checkout");
    const asset = await supabaseAdmin.from("ppv_playback_assets").select("*").eq("event_id", data.eventId).maybeSingle();
    if (asset.error || !asset.data?.sales_enabled) throw new Error("Ticket sales are not open");
    const { squadSecretForEnvironment } = await import("./squad.server");
    const secret = squadSecretForEnvironment(asset.data.sandbox, { live: process.env["SQUAD_SECRET_KEY"], sandbox: process.env["SQUAD_SANDBOX_SECRET_KEY"] });
    // Confirm real protected delivery before asking anyone to pay.
    await signPremiumStream({ accountId, apiToken }, asset.data.stream_uid, Math.floor(Date.now() / 1000) + 60);
    const reference = `LF-${crypto.randomUUID()}`;
    const prepared = await supabaseAdmin.rpc("prepare_ppv_order", { _event_id: data.eventId, _user_id: context.userId, _reference: reference });
    const order = prepared.data?.[0];
    if (prepared.error || !order) throw new Error("Ticket sales are unavailable for this event");
    if (order.checkout_url) return { orderId: order.id, checkoutUrl: order.checkout_url };
    const claim = await supabaseAdmin.rpc("claim_ppv_checkout", { _order_id: order.id });
    if (claim.error || claim.data !== true) throw new Error("Checkout is being prepared. Please try again shortly.");
    const { initiateSquadTransaction } = await import("./squad.server");
    const checkout = await initiateSquadTransaction({ secret, sandbox: order.sandbox }, { email: auth.data.user.email, amountKobo: order.amount_minor, reference: order.reference, callbackUrl: `https://lettflix.com/ppv/payment/return?reference=${encodeURIComponent(order.reference)}`, customerName: "Lettflix viewer" });
    const saved = await supabaseAdmin.from("ppv_orders").update({ checkout_url: checkout.checkoutUrl }).eq("id", order.id);
    if (saved.error) throw new Error("Could not save checkout. Please try again shortly.");
    return { orderId: order.id, checkoutUrl: checkout.checkoutUrl };
  });

export const confirmPpvPurchase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { setResponseHeader } = await import("@tanstack/react-start/server");
    setResponseHeader("Cache-Control", "no-store");
    const found = await context.supabase.from("ppv_orders").select("*").eq("id", data.orderId).eq("user_id", context.userId).maybeSingle();
    if (found.error || !found.data) throw new Error("Purchase not found");
    const { squadSecretForEnvironment } = await import("./squad.server");
    const secret = squadSecretForEnvironment(found.data.sandbox, { live: process.env["SQUAD_SECRET_KEY"], sandbox: process.env["SQUAD_SANDBOX_SECRET_KEY"] });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { confirmSquadOrder } = await import("./ppv-payment.server");
    const { enforcePpvLimit } = await import("./ppv-security.server");
    await enforcePpvLimit(supabaseAdmin, context.userId, "confirm");
    try { return await confirmSquadOrder(supabaseAdmin, found.data, secret); }
    catch { throw new Error("Payment could not be verified. Please try again."); }
  });

export const confirmPpvReturn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ reference: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/) }).strict().parse(input))
  .handler(async ({ data, context }) => {
    const { setResponseHeader } = await import("@tanstack/react-start/server");
    setResponseHeader("Cache-Control", "no-store");
    const found = await context.supabase.from("ppv_orders").select("*").eq("reference", data.reference).eq("user_id", context.userId).maybeSingle();
    if (found.error || !found.data) { const { setResponseStatus } = await import("@tanstack/react-start/server"); setResponseStatus(404); throw new Error("Purchase not found"); }
    const { squadSecretForEnvironment } = await import("./squad.server");
    const secret = squadSecretForEnvironment(found.data.sandbox, { live: process.env["SQUAD_SECRET_KEY"], sandbox: process.env["SQUAD_SANDBOX_SECRET_KEY"] });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { confirmSquadOrder } = await import("./ppv-payment.server");
    const { enforcePpvLimit } = await import("./ppv-security.server");
    await enforcePpvLimit(supabaseAdmin, context.userId, "confirm");
    try {
      const result = await confirmSquadOrder(supabaseAdmin, found.data, secret);
      return { ...result, eventId: found.data.event_id };
    } catch { throw new Error("Payment could not be verified. Please try again."); }
  });

export const savePpvDelivery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ eventId: z.string().uuid(), streamUid: z.string().regex(/^[a-f0-9]{32}$/), sandbox: z.boolean(), salesEnabled: z.boolean(), allowedCountries: z.array(z.string().regex(/^[A-Z]{2}$/)).max(249).default([]) }).strict().parse(input))
  .handler(async ({ data, context }) => {
    const check = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (check.error || check.data !== true) throw new Error("Admin access required");
    // Live opening remains locked until the test purchase/refund acceptance run.
    if (data.salesEnabled && !data.sandbox) throw new Error("Live sales require the completed test purchase and refund acceptance check");
    const accountId = process.env["CLOUDFLARE_ACCOUNT_ID"];
    const apiToken = process.env["CLOUDFLARE_STREAM_API_TOKEN"];
    if (!accountId || !apiToken) throw new Error("Premium video delivery is not configured");
    const { signPremiumStream } = await import("./ppv-access.server");
    await signPremiumStream({ accountId, apiToken }, data.streamUid, Math.floor(Date.now() / 1000) + 60);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await supabaseAdmin.from("ppv_playback_assets").upsert({ event_id: data.eventId, stream_uid: data.streamUid, sandbox: data.sandbox, sales_enabled: data.salesEnabled, allowed_countries: [...new Set(data.allowedCountries)] });
    if (result.error) throw new Error("Could not save protected delivery");
    return { ok: true };
  });

export const getPpvPlaybackAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ orderId: z.string().uuid(), sessionId: z.string().uuid(), start: z.boolean().default(false) }).strict().parse(input))
  .handler(async ({ data, context }) => {
    const { setResponseHeader } = await import("@tanstack/react-start/server");
    setResponseHeader("Cache-Control", "no-store");
    const result = await context.supabase.from("ppv_orders").select("*").eq("id", data.orderId).eq("user_id", context.userId).maybeSingle();
    if (result.error || !result.data || result.data.status !== "paid" || !result.data.verified_at || result.data.refunded_at) throw new Error("A verified PPV purchase is required");
    const order = result.data;
    const { squadSecretForEnvironment } = await import("./squad.server");
    const secret = squadSecretForEnvironment(order.sandbox, { live: process.env["SQUAD_SECRET_KEY"], sandbox: process.env["SQUAD_SANDBOX_SECRET_KEY"] });
    const accountId = process.env["CLOUDFLARE_ACCOUNT_ID"];
    const apiToken = process.env["CLOUDFLARE_STREAM_API_TOKEN"];
    if (!secret || !accountId || !apiToken) throw new Error("Protected PPV playback is unavailable");
    // Owner has been authenticated and scoped above. Privileged reads are only
    // for private delivery configuration and current payment revocation state.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { authorizePpvPlayback, signPremiumStream } = await import("./ppv-access.server");
    const { verifySquadTransaction } = await import("./squad.server");
    const { getRequest } = await import("@tanstack/react-start/server");
    const country = getRequest().headers.get("cf-ipcountry") ?? "";
    const { checkPpvSession } = await import("./ppv-security.server");
    try {
      await checkPpvSession(supabaseAdmin, { orderId: order.id, userId: context.userId, sessionId: data.sessionId, country, start: data.start });
      return await authorizePpvPlayback(order, context.userId, {
        verify: (reference) => verifySquadTransaction({ secret, sandbox: order.sandbox }, reference),
        gate: async () => {
          await checkPpvSession(supabaseAdmin, { orderId: order.id, userId: context.userId, sessionId: data.sessionId, country, start: false });
          const gate = await supabaseAdmin.rpc("ppv_playback_gate", { _order_id: data.orderId, _user_id: context.userId });
          if (gate.error) throw new Error("Access check unavailable");
          return gate.data?.[0] ?? null;
        },
        sign: (uid, expires) => signPremiumStream({ accountId, apiToken }, uid, expires),
      });
    } catch {
      throw new Error("PPV access ended, moved to another device, or is unavailable in your location. Confirm your payment before retrying.");
    }
  });

export const checkSquadPayments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ sandbox: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const check = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (check.error || check.data !== true) throw new Error("Admin access required");
    const { squadSecretForEnvironment } = await import("./squad.server");
    const secret = data.sandbox ? (process.env["SQUAD_SANDBOX_SECRET_KEY"] || (process.env["SQUAD_SECRET_KEY"]?.startsWith("sandbox_") ? process.env["SQUAD_SECRET_KEY"] : undefined)) : process.env["SQUAD_SECRET_KEY"];
    if (!secret) return { configured: false, connected: false, sandbox: data.sandbox, error: "Squad key not saved" };
    try {
      const { checkSquadConnection } = await import("./squad.server");
      await checkSquadConnection({ secret: squadSecretForEnvironment(data.sandbox, { live: process.env["SQUAD_SECRET_KEY"], sandbox: process.env["SQUAD_SANDBOX_SECRET_KEY"] }), sandbox: data.sandbox });
      return { configured: true, connected: true, sandbox: data.sandbox, error: null };
    } catch (error) {
      return { configured: true, connected: false, sandbox: data.sandbox, error: error instanceof Error ? error.message : "Squad could not be reached" };
    }
  });

export const getPpvReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ orderId: z.string().uuid() }).strict().parse(input))
  .handler(async ({ data, context }) => {
    const { setResponseHeader } = await import("@tanstack/react-start/server");
    setResponseHeader("Cache-Control", "no-store");
    const found = await context.supabase.from("ppv_receipts").select("amount_minor,verified_at").eq("order_id", data.orderId).maybeSingle();
    if (found.error) throw new Error("Receipt unavailable");
    return found.data;
  });

export const getPpvDeliverySettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ eventId: z.string().uuid() }).strict().parse(input))
  .handler(async ({ data, context }) => {
    const check = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (check.error || check.data !== true) throw new Error("Admin access required");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const found = await supabaseAdmin.from("ppv_playback_assets").select("stream_uid,sandbox,sales_enabled,allowed_countries").eq("event_id", data.eventId).maybeSingle();
    if (found.error) throw new Error("Delivery settings unavailable");
    return found.data;
  });

export const reconcilePpvPayments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({}).strict().parse(input))
  .handler(async ({ context }) => {
    const check = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (check.error || check.data !== true) throw new Error("Admin access required");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { reconcilePpvOrders } = await import("./ppv-reconcile.server");
    return await reconcilePpvOrders(supabaseAdmin, { live: process.env["SQUAD_SECRET_KEY"], sandbox: process.env["SQUAD_SANDBOX_SECRET_KEY"] });
  });

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
    const event = (result.data?.[0] ?? null) as { id: string; title: string; description: string; poster_url: string | null; event_type: string; starts_at: string; duration_minutes: number; replay_hours: number; rental_start_days: number; price_ngn_minor: number; price_usd_minor: number; channel_name: string; channel_slug: string } | null;
    if (!event) return null;
    const sales = await client.rpc("public_ppv_sales", { _event_id: data.id });
    return { ...event, salesOpen: !sales.error && sales.data === true };
  });