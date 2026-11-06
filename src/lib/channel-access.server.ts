import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Authorize before any external broadcast side effect, not only the final RLS write. */
export async function requireChannelAccess(supabase: SupabaseClient<Database>, userId: string, channelId: string) {
  const { data, error } = await supabase.rpc("can_manage_channel", {
    _channel_id: channelId,
    _user_id: userId,
  });
  if (error || data !== true) throw new Error("You do not have access to manage this channel.");
}