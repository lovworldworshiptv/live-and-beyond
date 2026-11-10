import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Platform features admins can switch on/off. Stored in cms_settings under "features". */
export type FeatureKey =
  | "movies" | "series" | "podcasts" | "documentaries" | "channels" | "radio" | "guide"
  | "games" | "community" | "collections" | "pricing"
  | "share" | "follow" | "popups" | "downloads"
  | "creatorSignup" | "creatorStudio";

export type FeatureGroup = "Main sections" | "Viewer actions" | "Creator tools";

export const FEATURES: { key: FeatureKey; label: string; description: string; group: FeatureGroup; paths?: string[] }[] = [
  { key: "movies", label: "Movies", description: "Movies page and title pages", group: "Main sections", paths: ["/movies"] },
  { key: "series", label: "Series", description: "Series page", group: "Main sections", paths: ["/series"] },
  { key: "podcasts", label: "Podcasts", description: "Podcasts page", group: "Main sections", paths: ["/podcasts"] },
  { key: "documentaries", label: "Documentaries", description: "Documentaries page", group: "Main sections", paths: ["/documentaries"] },
  { key: "channels", label: "Channels", description: "Channel directory and channel pages", group: "Main sections", paths: ["/channels"] },
  { key: "radio", label: "Radio", description: "Radio page", group: "Main sections", paths: ["/radio"] },
  { key: "guide", label: "TV Guide", description: "Programme guide", group: "Main sections", paths: ["/guide"] },
  { key: "games", label: "Games", description: "Games hub", group: "Main sections", paths: ["/games"] },
  { key: "community", label: "Community", description: "Community page", group: "Main sections", paths: ["/community"] },
  { key: "collections", label: "Collections", description: "Curated collections", group: "Main sections", paths: ["/collections"] },
  { key: "pricing", label: "Pricing & plans", description: "Pricing page", group: "Main sections", paths: ["/pricing"] },
  { key: "share", label: "Share", description: "Share buttons and QR share cards", group: "Viewer actions" },
  { key: "follow", label: "Follow channels", description: "Follow button, follower counts and alerts", group: "Viewer actions" },
  { key: "popups", label: "Pop-up announcements", description: "In-app announcement pop-ups", group: "Viewer actions" },
  { key: "downloads", label: "Downloads", description: "Download button on titles", group: "Viewer actions" },
  { key: "creatorSignup", label: "Creator applications", description: "Creator portal and applications", group: "Creator tools", paths: ["/portal"] },
  { key: "creatorStudio", label: "Creator Studio", description: "Uploads and going live (admins keep access)", group: "Creator tools", paths: ["/studio"] },
];

export type FeatureFlags = Partial<Record<FeatureKey, boolean>>;

/** Missing keys default to on, so new features never vanish unexpectedly. */
export function isFeatureEnabled(flags: FeatureFlags, key: FeatureKey): boolean {
  return flags[key] !== false;
}

/** The feature that owns a path, if any. */
export function featureForPath(pathname: string): FeatureKey | null {
  for (const f of FEATURES) {
    if (f.paths?.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p + "."))) return f.key;
  }
  return null;
}

export function isPathEnabled(flags: FeatureFlags, pathname: string): boolean {
  const path = pathname.split(/[?#]/)[0];
  const key = featureForPath(path);
  return key ? isFeatureEnabled(flags, key) : true;
}

let cache: FeatureFlags = {};
let loaded = false;
const listeners = new Set<(f: FeatureFlags) => void>();

export function setFeatureFlagsCache(next: FeatureFlags) {
  cache = next;
  loaded = true;
  listeners.forEach((l) => l(next));
}

function load() {
  void supabase.from("cms_settings").select("value").eq("key", "features").maybeSingle().then(({ data }) => {
    setFeatureFlagsCache((data?.value as FeatureFlags) ?? {});
  });
}

export function useFeatureFlags(): { flags: FeatureFlags; loaded: boolean } {
  const [flags, setFlags] = useState<FeatureFlags>(cache);
  const [isLoaded, setLoaded] = useState(loaded);
  useEffect(() => {
    const l = (f: FeatureFlags) => { setFlags(f); setLoaded(true); };
    listeners.add(l);
    if (!loaded) load();
    else l(cache);
    return () => { listeners.delete(l); };
  }, []);
  return { flags, loaded: isLoaded };
}

export function useFeature(key: FeatureKey): boolean {
  return isFeatureEnabled(useFeatureFlags().flags, key);
}
