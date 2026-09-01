import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const provisionSchema = z.object({
  channelId: z.string().uuid(),
  service: z.enum(["tv", "radio"]).default("tv"),
  // Live stream recording is disabled platform-wide — broadcasts are never saved.
  recording: z.literal(false).default(false),
});

const inputSchema = z.object({
  channelId: z.string().uuid(),
  service: z.enum(["tv", "radio"]).default("tv"),
});

/** Create (or re-create) a Lettflix live ingest endpoint for a channel service. */
export const provisionLiveInput = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => provisionSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { getLiveProvider } = await import("@/lib/live.server");

    const { data: channel, error: chErr } = await supabase
      .from("cms_channels")
      .select("id, name")
      .eq("id", data.channelId)
      .maybeSingle();
    if (chErr || !channel) throw new Error("Channel not found or not accessible");

    const provider = getLiveProvider();
    if (provider.name === "manual") {
      throw new Error(
        "Lettflix live ingest is not configured yet. Add your Cloudflare Stream credentials to enable RTMP ingest.",
      );
    }

    const created = await provider.createInput({
      name: `${channel.name} — ${data.service.toUpperCase()}`,
      recording: data.recording,
    });

    const { data: row, error } = await supabase
      .from("live_inputs")
      .upsert(
        {
          channel_id: data.channelId,
          service: data.service,
          provider: provider.name,
          provider_input_id: created.providerInputId,
          rtmps_url: created.rtmpsUrl,
          rtmps_stream_key: created.rtmpsStreamKey,
          srt_url: created.srtUrl,
          webrtc_url: created.webrtcUrl,
          playback_hls_url: created.playbackHlsUrl,
          playback_dash_url: created.playbackDashUrl,
          recording_enabled: data.recording,
          status: "idle",
          meta: (created.meta ?? {}) as never,
        } as never,
        { onConflict: "channel_id,service" },
      )
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

/** Read the live input for a channel service and refresh its status from the provider. */
export const refreshLiveInput = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { getLiveProvider } = await import("@/lib/live.server");

    const { data: row } = await supabase
      .from("live_inputs")
      .select("*")
      .eq("channel_id", data.channelId)
      .eq("service", data.service)
      .maybeSingle();
    if (!row) return null;

    const provider = getLiveProvider();
    if (!row.provider_input_id || provider.name === "manual") return row;

    // Self-heal inputs created while recording was disabled: Cloudflare only emits
    // live playback manifests when recording mode is "automatic".
    try {
      await provider.ensurePlayback(row.provider_input_id);
    } catch {
      /* non-fatal */
    }

    // Storage hygiene: Cloudflare needs recording mode "automatic" to emit live
    // manifests, so we continuously delete every finished recording it produces.
    // The in-progress broadcast is never touched.
    try {
      await provider.purgeRecordings(row.provider_input_id);
    } catch {
      /* non-fatal */
    }


    try {
      const status = await provider.getStatus(row.provider_input_id);
      const { data: updated } = await supabase
        .from("live_inputs")
        .update({
          status: status.status,
          last_connected_at: status.lastConnectedAt,
        } as never)
        .eq("id", row.id)
        .select("*")
        .single();
      return updated ?? row;
    } catch {
      return row;
    }
  });

/** Remove a live input from the provider and Lettflix. */
export const deleteLiveInput = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { getLiveProvider } = await import("@/lib/live.server");

    const { data: row } = await supabase
      .from("live_inputs")
      .select("*")
      .eq("channel_id", data.channelId)
      .eq("service", data.service)
      .maybeSingle();
    if (!row) return { ok: true };

    const provider = getLiveProvider();
    if (row.provider_input_id && provider.name !== "manual") {
      try {
        await provider.deleteInput(row.provider_input_id);
      } catch {
        /* provider already gone — continue */
      }
    }
    const { error } = await supabase.from("live_inputs").delete().eq("id", row.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Delete any recordings Cloudflare saved for this input (broadcasts are never kept). */
export const purgeLiveRecordings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { getLiveProvider } = await import("@/lib/live.server");

    const { data: row } = await supabase
      .from("live_inputs")
      .select("id, provider_input_id")
      .eq("channel_id", data.channelId)
      .eq("service", data.service)
      .maybeSingle();
    if (!row?.provider_input_id) return { removed: 0 };

    const provider = getLiveProvider();
    if (provider.name === "manual") return { removed: 0 };
    try {
      return { removed: await provider.purgeRecordings(row.provider_input_id) };
    } catch {
      return { removed: 0 };
    }
  });

/**
 * Read the renditions Cloudflare is currently producing for a live input by
 * parsing its HLS master playlist. Runs server-side so the playback URL and the
 * Cloudflare credentials never reach the browser.
 */
export const getLiveRenditions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row } = await supabase
      .from("live_inputs")
      .select("playback_hls_url, status")
      .eq("channel_id", data.channelId)
      .eq("service", data.service)
      .maybeSingle();
    const url = (row as { playback_hls_url?: string | null } | null)?.playback_hls_url;
    if (!url) return { renditions: [] as { label: string; bandwidthKbps: number; codecs: string | null }[] };

    try {
      const res = await fetch(url, { headers: { accept: "application/vnd.apple.mpegurl,*/*" } });
      if (!res.ok) return { renditions: [] };
      const text = await res.text();
      const renditions: { label: string; bandwidthKbps: number; codecs: string | null }[] = [];
      for (const line of text.split("\n")) {
        if (!line.startsWith("#EXT-X-STREAM-INF")) continue;
        const res_ = /RESOLUTION=(\d+)x(\d+)/.exec(line);
        const bw = /BANDWIDTH=(\d+)/.exec(line);
        const codecs = /CODECS="([^"]+)"/.exec(line);
        renditions.push({
          label: res_ ? `${res_[2]}p` : "audio",
          bandwidthKbps: bw ? Math.round(Number(bw[1]) / 1000) : 0,
          codecs: codecs ? codecs[1]! : null,
        });
      }
      const seen = new Set<string>();
      return {
        renditions: renditions
          .sort((a, b) => b.bandwidthKbps - a.bandwidthKbps)
          .filter((r) => (seen.has(r.label) ? false : (seen.add(r.label), true))),
      };
    } catch {
      return { renditions: [] };
    }
  });
