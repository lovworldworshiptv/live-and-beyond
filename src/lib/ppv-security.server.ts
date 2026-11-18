import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export async function enforcePpvLimit(client: SupabaseClient<Database>, userId: string, action: "checkout" | "confirm") {
  const result = await client.rpc("consume_ppv_request", { _user_id: userId, _action: action });
  if (result.error || result.data !== true) throw new Error("Too many payment attempts. Please wait before trying again.");
}

export async function checkPpvSession(client: SupabaseClient<Database>, input: { orderId: string; userId: string; sessionId: string; country: string; start: boolean }) {
  const result = await client.rpc("acquire_ppv_session", { _order_id: input.orderId, _user_id: input.userId, _session_id: input.sessionId, _country: input.country, _start: input.start });
  if (result.error || result.data !== true) throw new Error("Playback access ended, moved to another device, or is unavailable in your location.");
}