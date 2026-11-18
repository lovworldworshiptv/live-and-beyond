import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { confirmSquadOrder } from "./ppv-payment.server";
import { squadSecretForEnvironment } from "./squad.server";

export async function reconcilePpvOrders(client: SupabaseClient<Database>, secrets: { live?: string; sandbox?: string }) {
  const found = await client.from("ppv_orders").select("*").eq("status", "unpaid").eq("payment_state", "pending").lt("created_at", new Date(Date.now() - 300000).toISOString()).gt("checkout_expires_at", new Date().toISOString()).order("created_at").limit(25);
  if (found.error) throw new Error("Payment reconciliation unavailable");
  let confirmed = 0;
  let deferred = 0;
  for (const order of found.data ?? []) {
    try {
      const secret = squadSecretForEnvironment(order.sandbox, secrets);
      const result = await confirmSquadOrder(client, order, secret);
      if (result.status === "paid") confirmed++;
    } catch { deferred++; }
  }
  return { checked: found.data?.length ?? 0, confirmed, deferred };
}