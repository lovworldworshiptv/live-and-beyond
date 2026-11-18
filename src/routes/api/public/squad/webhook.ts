import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/api/public/squad/webhook")({
  server: { handlers: { POST: async ({ request }) => {
    const secrets = [process.env["SQUAD_SECRET_KEY"], process.env["SQUAD_SANDBOX_SECRET_KEY"]].filter((value): value is string => Boolean(value));
    if (!secrets.length) return new Response("Unavailable", { status: 503 });
    if (Number(request.headers.get("content-length") ?? 0) > 65536) return new Response("Too large", { status: 413 });
    const raw = await request.text();
    if (raw.length > 65536) return new Response("Too large", { status: 413 });
    const { validSquadSignature } = await import("@/lib/squad.server");
    const secret = secrets.find(value => validSquadSignature(value, raw, request.headers.get("x-squad-encrypted-body")));
    if (!secret) { console.warn("Squad webhook signature rejected"); return new Response("Invalid signature", { status: 401 }); }
    try {
      const payload = z.object({ Event: z.string().max(100), TransactionRef: z.string().min(1).max(128) }).parse(JSON.parse(raw));
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { recordSquadWebhook } = await import("@/lib/ppv-webhook.server");
      if (await recordSquadWebhook(supabaseAdmin, payload.TransactionRef, payload.Event, raw)) return new Response("OK");
      const complete = async () => {
        const result = await supabaseAdmin.from("ppv_webhook_events").update({ processed_at: new Date().toISOString() }).eq("reference", payload.TransactionRef).eq("event", payload.Event);
        if (result.error) throw new Error("Webhook completion unavailable");
      };
      if (payload.Event !== "charge_successful") { await complete(); return new Response("Ignored"); }
      const found = await supabaseAdmin.from("ppv_orders").select("*").eq("reference", payload.TransactionRef).maybeSingle();
      if (found.error) return new Response("Retry", { status: 503 });
      if (!found.data) return new Response("Retry", { status: 503 });
      const { squadSecretForEnvironment } = await import("@/lib/squad.server");
      const expected = squadSecretForEnvironment(found.data.sandbox, { live: process.env["SQUAD_SECRET_KEY"], sandbox: process.env["SQUAD_SANDBOX_SECRET_KEY"] });
      if (secret !== expected) return new Response("Invalid environment", { status: 401 });
      const { confirmSquadOrder } = await import("@/lib/ppv-payment.server");
      const result = await confirmSquadOrder(supabaseAdmin, found.data, secret);
      if (result.status === "unpaid") return new Response("Retry", { status: 503 });
      await complete();
      return new Response("OK", { headers: { "Cache-Control": "no-store" } });
    } catch { return new Response("Confirmation unavailable", { status: 503 }); }
  } } },
});