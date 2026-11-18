import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/api/public/squad/webhook")({
  server: { handlers: { POST: async ({ request }) => {
    const secret = process.env["SQUAD_SECRET_KEY"];
    if (!secret) return new Response("Unavailable", { status: 503 });
    if (Number(request.headers.get("content-length") ?? 0) > 65536) return new Response("Too large", { status: 413 });
    const raw = await request.text();
    if (raw.length > 65536) return new Response("Too large", { status: 413 });
    const { validSquadSignature } = await import("@/lib/squad.server");
    if (!validSquadSignature(secret, raw, request.headers.get("x-squad-encrypted-body"))) return new Response("Invalid signature", { status: 401 });
    try {
      const payload = z.object({ Event: z.string().max(100), TransactionRef: z.string().min(1).max(128) }).parse(JSON.parse(raw));
      if (payload.Event !== "charge_successful") return new Response("Ignored", { status: 200 });
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const found = await supabaseAdmin.from("ppv_orders").select("*").eq("reference", payload.TransactionRef).maybeSingle();
      if (found.error) return new Response("Retry", { status: 503 });
      if (!found.data) return new Response("Ignored", { status: 200 });
      const { confirmSquadOrder } = await import("@/lib/ppv-payment.server");
      await confirmSquadOrder(supabaseAdmin, found.data, secret);
      return new Response("OK", { headers: { "Cache-Control": "no-store" } });
    } catch { return new Response("Confirmation unavailable", { status: 503 }); }
  } } },
});