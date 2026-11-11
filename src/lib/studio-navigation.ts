export const STUDIO_TABS = ["overview", "channel", "services", "content", "broadcast", "radio", "spotlight", "analytics", "team"] as const;
export type StudioTab = typeof STUDIO_TABS[number];

export function studioSearch(search: Record<string, unknown>): { channel?: string; section?: StudioTab } {
  const channel = typeof search.channel === "string" && search.channel ? search.channel : undefined;
  const section = STUDIO_TABS.find(tab => tab === search.section);
  return { ...(channel ? { channel } : {}), ...(section ? { section } : {}) };
}