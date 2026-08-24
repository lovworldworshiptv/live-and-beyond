import { supabase } from "@/integrations/supabase/client";

export type ServiceKey = "tv" | "radio" | "podcasts" | "movies" | "videos";

export type ChannelService = {
  id: string;
  channel_id: string;
  service: ServiceKey;
  enabled: boolean;
  display_order: number;
  config: Record<string, unknown>;
};

export const SERVICE_CATALOG: {
  key: ServiceKey;
  label: string;
  blurb: string;
}[] = [
  { key: "tv", label: "TV", blurb: "Live television — external stream, Lettflix live or automated playout." },
  { key: "radio", label: "Radio", blurb: "Live audio broadcasting with now-playing metadata." },
  { key: "podcasts", label: "Podcasts", blurb: "Shows and episodes with cover art and audio." },
  { key: "movies", label: "Movies", blurb: "Feature-length on-demand titles." },
  { key: "videos", label: "Videos", blurb: "Short-form and long-form on-demand video." },
];

export const SERVICE_LABEL: Record<ServiceKey, string> = SERVICE_CATALOG.reduce(
  (acc, s) => ({ ...acc, [s.key]: s.label }),
  {} as Record<ServiceKey, string>,
);

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

export async function fetchChannelServices(channelId: string): Promise<ChannelService[]> {
  const { data } = await supabase
    .from("channel_services")
    .select("*")
    .eq("channel_id", channelId)
    .order("display_order", { ascending: true });
  return (data ?? []) as unknown as ChannelService[];
}

/** Upsert the full service set for a channel. */
export async function saveChannelServices(channelId: string, enabled: ServiceKey[]) {
  const rows = SERVICE_CATALOG.map((s, i) => ({
    channel_id: channelId,
    service: s.key,
    enabled: enabled.includes(s.key),
    display_order: i,
  }));
  const { error } = await supabase
    .from("channel_services")
    .upsert(rows as never, { onConflict: "channel_id,service" });
  if (error) throw error;
}
