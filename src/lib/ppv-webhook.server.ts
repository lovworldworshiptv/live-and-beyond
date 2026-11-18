import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export async function recordSquadWebhook(client: SupabaseClient<Database>, reference: string, event: string, raw: string) {
  const insert = await client.from("ppv_webhook_events").insert({ reference, event, payload_sha256: createHash("sha256").update(raw).digest("hex") });
  if (!insert.error) return false;
  if (insert.error.code !== "23505") throw new Error("Webhook storage unavailable");
  const existing = await client.from("ppv_webhook_events").select("processed_at").eq("reference", reference).eq("event", event).single();
  if (existing.error) throw new Error("Webhook lookup unavailable");
  // Failed/unfinished attempts must retry; settlement itself is row-lock idempotent.
  return Boolean(existing.data.processed_at);
}