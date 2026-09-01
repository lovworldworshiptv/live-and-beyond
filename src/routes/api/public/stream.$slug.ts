import { createFileRoute } from "@tanstack/react-router";

/**
 * Manifest proxy for live channels.
 *
 * The browser only ever sees `/api/public/stream/<slug>.m3u8`. We resolve the
 * real Cloudflare Stream master playlist server-side, then rewrite every URI in
 * it to an absolute Cloudflare CDN URL so renditions and segments continue to be
 * delivered straight from the edge (no media passes through this worker).
 */
async function resolveUpstream(slug: string): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: ch } = await supabaseAdmin
    .from("cms_channels")
    .select("id, stream_url, tv_source")
    .eq("slug", slug)
    .maybeSingle();
  const row = ch as { id?: string; stream_url?: string | null; tv_source?: string | null } | null;
  if (!row?.id) return null;

  if ((row.tv_source ?? "external") === "ingest") {
    const { data: session } = await supabaseAdmin
      .from("live_sessions")
      .select("playback_hls_url")
      .eq("channel_id", row.id)
      .eq("status", "live")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const live = (session as { playback_hls_url?: string | null } | null)?.playback_hls_url;
    if (live) return live;
  }
  return row.stream_url ?? null;
}

function rewriteManifest(body: string, upstream: string) {
  const base = new URL(upstream);
  const abs = (uri: string) => {
    try {
      return new URL(uri, base).toString();
    } catch {
      return uri;
    }
  };
  return body
    .split("\n")
    .map((raw) => {
      const line = raw.trimEnd();
      if (!line) return line;
      if (line.startsWith("#")) {
        // Rewrite URI="..." attributes (media renditions, keys, maps).
        return line.replace(/URI="([^"]+)"/g, (_m, uri: string) => `URI="${abs(uri)}"`);
      }
      return abs(line);
    })
    .join("\n");
}

export const Route = createFileRoute("/api/public/stream/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const slug = String((params as { slug?: string }).slug ?? "").replace(/\.m3u8$/i, "");
        if (!slug) return new Response("Not found", { status: 404 });

        const upstream = await resolveUpstream(slug);
        if (!upstream || !/\.m3u8(\?|$)/i.test(upstream)) {
          return new Response("Not found", { status: 404 });
        }

        const res = await fetch(upstream, { headers: { accept: "application/vnd.apple.mpegurl,*/*" } });
        if (!res.ok) return new Response("Stream unavailable", { status: 502 });
        const text = await res.text();

        return new Response(rewriteManifest(text, upstream), {
          status: 200,
          headers: {
            "content-type": "application/vnd.apple.mpegurl",
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
