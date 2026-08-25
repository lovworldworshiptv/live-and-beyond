import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useFollowing } from "@/lib/personal";

/**
 * Channel following backed by the database for signed-in users
 * (so it syncs across devices and drives live notifications),
 * with the local-storage store as the signed-out fallback.
 */
export function useChannelFollow(channelId?: string | null) {
  const { user } = useAuth();
  const local = useFollowing();
  const [remote, setRemote] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setRemote([]); setReady(true); return; }
    const { data } = await supabase.from("channel_follows").select("channel_id").eq("user_id", user.id);
    setRemote((data ?? []).map((r) => r.channel_id as string));
    setReady(true);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const following = user
    ? Boolean(channelId && remote.includes(channelId))
    : Boolean(channelId && local.has(channelId));

  const toggle = useCallback(async () => {
    if (!channelId) return following;
    if (!user) { local.toggle(channelId); return !following; }
    if (following) {
      await supabase.from("channel_follows").delete().eq("user_id", user.id).eq("channel_id", channelId);
      setRemote((prev) => prev.filter((id) => id !== channelId));
      return false;
    }
    await supabase.from("channel_follows").insert({ user_id: user.id, channel_id: channelId } as never);
    setRemote((prev) => [channelId, ...prev]);
    return true;
  }, [channelId, following, local, user]);

  return { following, toggle, ready, followedIds: user ? remote : local.ids };
}
