import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/squad/reconcile")({ server: { handlers: { POST: async ({ request }) => {
  const { authenticateCronRequest } = await import("@/integrations/supabase/cron-auth");
  const denied = await authenticateCronRequest(request);
  if (denied) return denied;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { reconcilePpvOrders } = await import("@/lib/ppv-reconcile.server");
    const result = await reconcilePpvOrders(supabaseAdmin, { live: process.env["SQUAD_SECRET_KEY"], sandbox: process.env["SQUAD_SANDBOX_SECRET_KEY"] });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch { return new Response("Reconciliation unavailable", { status: 503 }); }
} } } });