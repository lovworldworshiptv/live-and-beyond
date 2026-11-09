import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useFollowing } from "@/lib/personal";

/** Compact follower count: 999, 1.2K, 3.4M. */
export function formatFollowers(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, "")}K`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

/**
 * Channel following backed by the database for signed-in users
 * (so it syncs across devices and drives notifications),
 * with the local-storage store as the signed-out fallback.
 */
export function useChannelFollow(channelId?: string | null) {
  const { user } = useAuth();
  const local = useFollowing();
  const [remote, setRemote] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!user) { setRemote({}); setReady(true); return; }
    const { data } = await supabase.from("channel_follows").select("channel_id, notify").eq("user_id", user.id);
    setRemote(Object.fromEntries((data ?? []).map((r) => [r.channel_id as string, r.notify !== false])));
    setReady(true);
  }, [user]);

  const loadCount = useCallback(async () => {
    if (!channelId) { setCount(null); return; }
    const { data } = await supabase.rpc("channel_follower_count", { _channel_id: channelId });
    setCount(typeof data === "number" ? data : Number(data ?? 0));
  }, [channelId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadCount(); }, [loadCount]);

  const following = user
    ? Boolean(channelId && channelId in remote)
    : Boolean(channelId && local.has(channelId));
  const notify = Boolean(channelId && remote[channelId]);

  const toggle = useCallback(async () => {
    if (!channelId) return following;
    if (!user) { local.toggle(channelId); return !following; }
    if (following) {
      await supabase.from("channel_follows").delete().eq("user_id", user.id).eq("channel_id", channelId);
      setRemote(({ [channelId]: _, ...rest }) => rest);
      setCount((c) => (c == null ? c : Math.max(0, c - 1)));
      return false;
    }
    const { error } = await supabase.from("channel_follows").insert({ user_id: user.id, channel_id: channelId, notify: true } as never);
    if (error) throw error;
    setRemote((prev) => ({ ...prev, [channelId]: true }));
    setCount((c) => (c == null ? 1 : c + 1));
    return true;
  }, [channelId, following, local, user]);

  const setNotify = useCallback(async (next: boolean) => {
    if (!channelId || !user || !following) return false;
    const { error } = await supabase.from("channel_follows").update({ notify: next } as never).eq("user_id", user.id).eq("channel_id", channelId);
    if (error) throw error;
    setRemote((prev) => ({ ...prev, [channelId]: next }));
    return true;
  }, [channelId, following, user]);

  return {
    following, toggle, ready, notify, setNotify, count,
    signedIn: Boolean(user),
    followedIds: user ? Object.keys(remote) : local.ids,
  };
}
