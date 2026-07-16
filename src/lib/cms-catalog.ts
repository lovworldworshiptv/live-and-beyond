import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { channels as staticChannels, titles as staticTitles, type Channel, type Title } from "./catalog";

const staticChannelMap = new Map(staticChannels.map((c) => [c.id, c]));
const staticTitleMap = new Map(staticTitles.map((t) => [t.id, t]));

type ChannelRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  category: string | null;
  language: string | null;
  country: string | null;
  region: string | null;
  viewers: string | null;
  popularity: number | null;
  is_trending: boolean | null;
  kind: string;
  is_live: boolean;
  logo_url: string | null;
  banner_url: string | null;
  stream_url: string | null;
  video_library: string[] | null;
  podcast_library: string[] | null;
  featured_content: string[] | null;
  now_playing: { title?: string; startsAt?: string; endsAt?: string; description?: string } | null;
  created_at: string;
  is_published: boolean;
};

type TitleRow = {
  id: string;
  slug: string;
  title: string;
  synopsis: string | null;
  kind: string;
  genre: string | null;
  year: number | null;
  rating: string | null;
  duration_minutes: number | null;
  duration_label: string | null;
  seasons: number | null;
  episodes: number | null;
  is_featured: boolean | null;
  cast_list: string[] | null;
  poster_url: string | null;
  backdrop_url: string | null;
  stream_url: string | null;
  is_published: boolean;
};

const kindLabel: Record<string, Title["kind"]> = {
  movie: "Film",
  film: "Film",
  series: "Series",
  podcast: "Podcast",
  documentary: "Documentary",
  concert: "Concert",
  event: "Event",
};

export function mapChannelRow(r: ChannelRow): Channel {
  const fallback = staticChannelMap.get(r.slug);
  const np = r.now_playing ?? {};
  return {
    id: r.slug,
    name: r.name,
    tagline: r.tagline ?? fallback?.tagline ?? "",
    description: r.description ?? fallback?.description,
    category: r.category ?? fallback?.category ?? "",
    language: r.language ?? fallback?.language ?? "English",
    country: r.country ?? fallback?.country ?? "",
    region: r.region ?? fallback?.region ?? "Global",
    viewers: r.viewers ?? fallback?.viewers ?? "—",
    popularity: r.popularity ?? fallback?.popularity ?? 0,
    trending: r.is_trending ?? fallback?.trending,
    addedAt: r.created_at.slice(0, 10),
    streamKind: r.kind === "radio" ? "radio" : "video",
    isLive: r.is_live,
    logoImg: r.logo_url ?? fallback?.logoImg ?? "",
    banner: r.banner_url ?? fallback?.banner ?? "",
    streamUrl: r.stream_url ?? fallback?.streamUrl ?? undefined,
    videoLibrary: r.video_library ?? fallback?.videoLibrary,
    podcastLibrary: r.podcast_library ?? fallback?.podcastLibrary,
    featuredContent: r.featured_content ?? fallback?.featuredContent,
    nowPlaying: {
      title: np.title ?? fallback?.nowPlaying.title ?? "",
      startsAt: np.startsAt ?? fallback?.nowPlaying.startsAt ?? "",
      endsAt: np.endsAt ?? fallback?.nowPlaying.endsAt ?? "",
      description: np.description ?? fallback?.nowPlaying.description ?? "",
    },
    schedule: fallback?.schedule ?? [],
  };
}

export function mapTitleRow(r: TitleRow): Title {
  const fallback = staticTitleMap.get(r.slug);
  return {
    id: r.slug,
    title: r.title,
    synopsis: r.synopsis ?? fallback?.synopsis ?? "",
    cover: r.poster_url ?? fallback?.cover ?? "",
    hero: r.backdrop_url ?? fallback?.hero ?? "",
    category: r.genre ?? fallback?.category ?? "",
    kind: kindLabel[r.kind] ?? fallback?.kind ?? "Film",
    year: r.year ?? fallback?.year ?? new Date().getFullYear(),
    rating: r.rating ?? fallback?.rating ?? "TV-PG",
    duration: r.duration_label ?? (r.duration_minutes ? `${r.duration_minutes}m` : fallback?.duration ?? ""),
    seasons: r.seasons ?? fallback?.seasons ?? undefined,
    episodes: r.episodes ?? fallback?.episodes ?? undefined,
    featured: r.is_featured ?? fallback?.featured,
    cast: (r.cast_list && r.cast_list.length ? r.cast_list : fallback?.cast) ?? undefined,
    streamUrl: r.stream_url ?? fallback?.streamUrl ?? undefined,
  };
}

export function useCmsChannels() {
  const [channels, setChannels] = useState<Channel[]>(staticChannels);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase
      .from("cms_channels")
      .select("*")
      .eq("is_published", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data && data.length) setChannels((data as ChannelRow[]).map(mapChannelRow));
        setLoading(false);
      });
  }, []);
  return { channels, loading };
}

export function useCmsTitles() {
  const [titles, setTitles] = useState<Title[]>(staticTitles);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase
      .from("cms_titles")
      .select("*")
      .eq("is_published", true)
      .then(({ data }) => {
        if (data && data.length) setTitles((data as TitleRow[]).map(mapTitleRow));
        setLoading(false);
      });
  }, []);
  return { titles, loading };
}

export type CmsEvent = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  startsAt: string;
  endsAt: string | null;
  coverUrl: string | null;
  channelId: string | null;
  isSponsored: boolean;
};

export function useCmsEvents(limit = 8) {
  const [events, setEvents] = useState<CmsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase
      .from("cms_events")
      .select("*")
      .eq("is_published", true)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(limit)
      .then(({ data }) => {
        setEvents(
          (data ?? []).map((r: any) => ({
            id: r.id,
            slug: r.slug,
            name: r.name,
            description: r.description,
            category: r.category,
            startsAt: r.starts_at,
            endsAt: r.ends_at,
            coverUrl: r.cover_url,
            channelId: r.channel_id,
            isSponsored: !!r.is_sponsored,
          })),
        );
        setLoading(false);
      });
  }, [limit]);
  return { events, loading };
}

export type CmsSponsor = {
  id: string;
  name: string;
  headline: string | null;
  description: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  imageUrl: string | null;
  placements: string[];
  homeSections: string[];
  channelIds: string[];
  eventIds: string[];
  priority: number;
  startsAt: string | null;
  endsAt: string | null;
};

export function useCmsSponsors(filter: {
  placement: string;
  section?: string;
  channelId?: string;
  eventId?: string;
}) {
  const [sponsors, setSponsors] = useState<CmsSponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const { placement, section, channelId, eventId } = filter;
  useEffect(() => {
    supabase
      .from("cms_sponsors")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false })
      .then(({ data }) => {
        const now = new Date();
        const rows = (data ?? []).filter((r: any) => {
          if (r.starts_at && new Date(r.starts_at) > now) return false;
          if (r.ends_at && new Date(r.ends_at) < now) return false;
          const placements: string[] = r.placements?.length ? r.placements : [r.placement];
          if (!placements.includes(placement)) return false;
          if (placement === "home" && section) {
            const sections: string[] = r.home_sections ?? [];
            if (sections.length && !sections.includes(section)) return false;
          }
          if (placement === "channel_page" && channelId) {
            const list: string[] = r.channel_ids ?? [];
            if (list.length && !list.includes(channelId)) return false;
          }
          if (placement === "event_banner" && eventId) {
            const list: string[] = r.event_ids ?? [];
            if (list.length && !list.includes(eventId)) return false;
          }
          return true;
        });
        setSponsors(
          rows.map((r: any) => ({
            id: r.id,
            name: r.name,
            headline: r.headline,
            description: r.description,
            ctaLabel: r.cta_label,
            ctaUrl: r.cta_url,
            imageUrl: r.image_url,
            placements: r.placements ?? [r.placement],
            homeSections: r.home_sections ?? [],
            channelIds: r.channel_ids ?? [],
            eventIds: r.event_ids ?? [],
            priority: r.priority ?? 0,
            startsAt: r.starts_at,
            endsAt: r.ends_at,
          })),
        );
        setLoading(false);
      });
  }, [placement, section, channelId, eventId]);
  return { sponsors, loading };
}

export type CmsCollection = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  isFeatured: boolean;
};

export function useCmsCollections() {
  const [collections, setCollections] = useState<CmsCollection[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase
      .from("cms_collections")
      .select("*")
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .then(({ data }) => {
        setCollections(
          (data ?? []).map((r: any) => ({
            id: r.id,
            slug: r.slug,
            name: r.name,
            description: r.description,
            coverUrl: r.cover_url,
            isFeatured: r.is_featured,
          })),
        );
        setLoading(false);
      });
  }, []);
  return { collections, loading };
}

export function useCmsSetting<T>(key: "nav" | "hero" | "footer", fallback: T): { value: T; loading: boolean } {
  const [value, setValue] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase
      .from("cms_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) setValue(data.value as T);
        setLoading(false);
      });
  }, [key]);
  return { value, loading };
}

