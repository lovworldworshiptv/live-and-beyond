import { supabase } from "@/integrations/supabase/client";
import { mapTitleRow } from "./cms-catalog";
import type { Channel } from "./catalog";
import { selectChannelLibrary } from "./channel-library-selection";

export async function fetchChannelLibrary(channelId: string, channel: Channel) {
  const slugs = [...new Set([...(channel.videoLibrary ?? []), ...(channel.podcastLibrary ?? []), ...(channel.featuredContent ?? [])])];
  const owned = supabase.from("cms_titles").select("*").eq("channel_id", channelId).eq("is_published", true).is("deleted_at", null).order("display_order").order("created_at", { ascending: false });
  const curated = slugs.length
    ? supabase.from("cms_titles").select("*").in("slug", slugs).eq("is_published", true).is("deleted_at", null).order("display_order")
    : Promise.resolve({ data: [], error: null });
  const [direct, linked] = await Promise.all([owned, curated]);
  if (direct.error) throw direct.error;
  if (linked.error) throw linked.error;
  return selectChannelLibrary([...(direct.data ?? []), ...(linked.data ?? [])], channelId, slugs).map(mapTitleRow);
}