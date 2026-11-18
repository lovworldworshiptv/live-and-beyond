import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { verifySquadTransaction } from "./squad.server";

/** Called only after buyer authentication or raw-body webhook authentication. */
export async function confirmSquadOrder(client: SupabaseClient<Database>, order: Database["public"]["Tables"]["ppv_orders"]["Row"], secret: string) {
  if (order.status === "refunded") return { status: "refunded" as const };
  const payment = await verifySquadTransaction({ secret, sandbox: order.sandbox }, order.reference);
  // Pending transactions may not yet carry final amount/currency fields.
  if (!payment.ok && payment.status !== "refunded") {
    return { status: ["failed", "failure", "declined", "cancelled"].includes(payment.status ?? "") ? "failed" as const : "unpaid" as const };
  }
  if (payment.reference !== order.reference || payment.amountKobo !== order.amount_minor || payment.currency !== order.currency) {
    const review = await client.rpc("review_ppv_payment", { _order_id: order.id });
    if (review.error) throw new Error("Payment review unavailable");
    throw new Error("Payment verification mismatch");
  }
  if (payment.status === "refunded") {
    const revoked = await client.from("ppv_orders").update({ status: "refunded", refunded_at: new Date().toISOString() }).eq("id", order.id).neq("status", "refunded");
    if (revoked.error) throw new Error("Could not revoke refunded payment");
    return { status: "refunded" as const };
  }
  if (!payment.ok) return { status: "unpaid" as const };
  const result = await client.rpc("confirm_ppv_payment", { _order_id: order.id, _reference: payment.reference, _amount: payment.amountKobo, _currency: payment.currency, _sandbox: order.sandbox });
  if (result.error || (result.data !== "paid" && result.data !== "refunded")) throw new Error("Payment confirmation is unavailable");
  return { status: result.data as "paid" | "refunded" };
}