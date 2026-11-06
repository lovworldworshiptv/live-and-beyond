type LibraryRow = { id: string; slug: string; channel_id?: string | null; is_published: boolean; deleted_at?: string | null };

/** Include direct channel uploads and explicitly curated titles, once each. */
export function selectChannelLibrary<T extends LibraryRow>(rows: T[], channelId: string, linkedSlugs: string[]): T[] {
  const links = new Set(linkedSlugs);
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (!row.is_published || row.deleted_at || (row.channel_id !== channelId && !links.has(row.slug)) || seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}