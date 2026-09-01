/**
 * Playback sources are served to the browser through a same-origin manifest
 * proxy so the underlying Cloudflare Stream URL is never printed into the DOM
 * (right-click → "Copy video address" only yields the Lettflix endpoint).
 */
export function protectedChannelSrc(slug: string | null | undefined, url: string | null | undefined) {
  if (!url) return url ?? null;
  if (!slug) return url;
  if (!/\.m3u8(\?|$)/i.test(url)) return url;
  return `/api/public/stream/${encodeURIComponent(slug)}.m3u8`;
}
