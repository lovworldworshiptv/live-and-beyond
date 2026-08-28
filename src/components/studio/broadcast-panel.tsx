import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Radio, Tv, Copy, Eye, EyeOff, Loader2, RefreshCw, Trash2, Plus, Circle, Square, Link2,
  ListVideo, Check,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  provisionLiveInput, refreshLiveInput, deleteLiveInput,
} from "@/lib/live.functions";
import { notifyFollowersLive } from "@/lib/notify.functions";

type Service = "tv" | "radio";
export type TvSource = "none" | "ingest" | "external" | "playout";

type LiveInput = {
  id: string;
  service: Service;
  provider: string;
  provider_input_id: string | null;
  rtmps_url: string | null;
  rtmps_stream_key: string | null;
  srt_url: string | null;
  playback_hls_url: string | null;
  status: string;
  recording_enabled: boolean;
  last_connected_at: string | null;
};

type LiveSession = {
  id: string;
  title: string;
  status: string;
  scheduled_start: string | null;
  started_at: string | null;
  ended_at: string | null;
};

const SOURCE_OPTIONS: { key: Exclude<TvSource, "none">; label: string; blurb: string; icon: typeof Tv }[] = [
  {
    key: "ingest",
    label: "Lettflix Live ingest",
    blurb: "Stream from OBS, vMix or a hardware encoder into Lettflix.",
    icon: Radio,
  },
  {
    key: "external",
    label: "Existing stream source",
    blurb: "Point Lettflix at an HLS or DASH URL you already broadcast.",
    icon: Link2,
  },
  {
    key: "playout",
    label: "Automated TV",
    blurb: "Run a 24/7 scheduled channel from your playlists.",
    icon: ListVideo,
  },
];

function sourceLabel(key: TvSource | null) {
  return SOURCE_OPTIONS.find((o) => o.key === key)?.label ?? "another source";
}

function Field({ label, value, secret }: { label: string; value: string | null; secret?: boolean }) {
  const [shown, setShown] = useState(!secret);
  if (!value) return null;
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-[color:var(--muted-foreground)]">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <code className="flex-1 min-w-0 truncate rounded-md bg-surface border border-border px-3 py-2 text-xs">
          {shown ? value : "•".repeat(Math.min(value.length, 32))}
        </code>
        {secret && (
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            aria-label={shown ? "Hide value" : "Reveal value"}
            className="size-9 grid place-items-center rounded-md border border-border bg-elevated hover:bg-elevated/70"
          >
            {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
        <button
          type="button"
          onClick={() => { navigator.clipboard.writeText(value); toast.success(`${label} copied`); }}
          aria-label={`Copy ${label}`}
          className="size-9 grid place-items-center rounded-md border border-border bg-elevated hover:bg-elevated/70"
        >
          <Copy className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function BroadcastPanel({
  channelId,
  channelStreamUrl,
  tvSource = "none",
  isLive = false,
  playoutPanel,
  onChannelUpdated,
}: {
  channelId: string;
  channelStreamUrl?: string | null;
  tvSource?: TvSource;
  isLive?: boolean;
  playoutPanel?: ReactNode;
  onChannelUpdated?: () => void;
}) {
  const [service, setService] = useState<Service>("tv");
  const [source, setSource] = useState<TvSource>(tvSource);
  const [input, setInput] = useState<LiveInput | null>(null);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [externalUrl, setExternalUrl] = useState(channelStreamUrl ?? "");
  const [live, setLive] = useState(isLive);
  /** The source that currently holds the channel on air (persisted as cms_channels.tv_source). */
  const [liveSource, setLiveSource] = useState<TvSource | null>(isLive ? tvSource : null);

  const provision = useServerFn(provisionLiveInput);
  const refresh = useServerFn(refreshLiveInput);
  const remove = useServerFn(deleteLiveInput);
  const notifyLive = useServerFn(notifyFollowersLive);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: inp }, { data: sess }] = await Promise.all([
      supabase.from("live_inputs").select("*").eq("channel_id", channelId).eq("service", service).maybeSingle(),
      supabase.from("live_sessions").select("*").eq("channel_id", channelId).order("created_at", { ascending: false }).limit(10),
    ]);
    setInput((inp as unknown as LiveInput) ?? null);
    setSessions((sess ?? []) as unknown as LiveSession[]);
    setLoading(false);
  }, [channelId, service]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setExternalUrl(channelStreamUrl ?? ""); }, [channelStreamUrl]);
  // While on air, keep showing whatever source tab the creator opened.
  useEffect(() => { if (!live) setSource(tvSource); }, [tvSource, live]);
  useEffect(() => {
    setLive(isLive);
    setLiveSource(isLive ? tvSource : null);
  }, [isLive, tvSource]);

  const liveSession = useMemo(() => sessions.find((s) => s.status === "live") ?? null, [sessions]);
  const isTv = service === "tv";
  const showIngest = !isTv || source === "ingest";
  const showExternal = !isTv || source === "external";
  const showPlayout = isTv && source === "playout";
  const encoderConnected = input?.status === "live" || input?.status === "connected";

  // Poll ingest status so Go live unlocks as soon as the encoder connects.
  useEffect(() => {
    if (!showIngest || !input?.id || encoderConnected) return;
    const id = setInterval(async () => {
      try {
        const row = await refresh({ data: { channelId, service } });
        if (row) setInput(row as unknown as LiveInput);
      } catch { /* transient */ }
    }, 15000);
    return () => clearInterval(id);
  }, [showIngest, input?.id, encoderConnected, refresh, channelId, service]);



  async function notifyGoingLive(title?: string) {
    try {
      const res = await notifyLive({ data: { channelId, title: title ?? "We're live now" } });
      if (res.notified) toast.success(`${res.notified} follower${res.notified === 1 ? "" : "s"} notified`);
    } catch {
      /* notifications are best-effort */
    }
  }

  /**
   * A channel broadcasts from exactly one source. While on air, switching tabs only
   * previews another source's settings — the live source keeps broadcasting until
   * the creator explicitly goes off air.
   */
  async function chooseSource(next: Exclude<TvSource, "none">) {
    const prev = source;
    if (live && liveSource) {
      setSource(next);
      if (next !== liveSource) {
        toast.info(`Still broadcasting via ${sourceLabel(liveSource)} — go off air to switch.`);
      }
      return;
    }
    setSource(next);
    const { error } = await supabase
      .from("cms_channels")
      .update({ tv_source: next, playout_enabled: next === "playout" } as never)
      .eq("id", channelId);
    if (error) { setSource(prev); toast.error(error.message); return; }
    toast.success(`Broadcast source set to ${sourceLabel(next)}`);
    onChannelUpdated?.();
  }

  /** Guard shown when a different source already holds the channel on air. */
  function blockedBy(current: TvSource) {
    return live && liveSource && liveSource !== current ? liveSource : null;
  }
  function warnBlocked() {
    toast.warning("Already broadcasting via another broadcast source.");
  }

  async function handleProvision() {
    setBusy(true);
    try {
      const row = await provision({ data: { channelId, service, recording: false } });
      setInput(row as unknown as LiveInput);
      toast.success("Ingest endpoint ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create ingest endpoint");
    } finally { setBusy(false); }
  }

  async function handleRefresh() {
    setBusy(true);
    try {
      const row = await refresh({ data: { channelId, service } });
      if (row) setInput(row as unknown as LiveInput);
      toast.success("Status refreshed");
    } catch { toast.error("Could not refresh status"); }
    finally { setBusy(false); }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await remove({ data: { channelId, service } });
      setInput(null);
      toast.success("Ingest endpoint removed");
    } catch { toast.error("Could not remove endpoint"); }
    finally { setBusy(false); }
  }

  async function saveExternal() {
    const { error } = await supabase
      .from("cms_channels")
      .update({ stream_url: externalUrl || null } as never)
      .eq("id", channelId);
    if (error) { toast.error(error.message); return; }
    toast.success("Stream source saved");
    onChannelUpdated?.();
  }

  /** Take an external or automated channel on/off air — this is what feeds "Live Right Now". */
  async function setChannelLive(next: boolean) {
    if (next && source === "external" && !externalUrl.trim()) {
      toast.error("Add and save your stream URL first");
      return;
    }
    const { error } = await supabase.from("cms_channels").update({ is_live: next } as never).eq("id", channelId);
    if (error) { toast.error(error.message); return; }
    setLive(next);
    setLiveSource(next ? source : null);
    if (next) await notifyGoingLive();
    toast.success(next === true ? "Your channel is live" : "Channel is off air");
    onChannelUpdated?.();
  }

  /** Push the ingest playback URL to the channel and take it on air. */
  async function goLiveFromIngest(next: boolean) {
    if (next && !encoderConnected) {
      toast.error("Your encoder isn't connected yet");
      return;
    }
    setBusy(true);
    try {
      if (next) {
        const url = input?.playback_hls_url ?? null;
        const { error } = await supabase
          .from("cms_channels")
          .update({ is_live: true, stream_url: url } as never)
          .eq("id", channelId);
        if (error) { toast.error(error.message); return; }
        await supabase.from("live_sessions").insert({
          channel_id: channelId,
          live_input_id: input?.id ?? null,
          title: "Live broadcast",
          status: "live",
          started_at: new Date().toISOString(),
          playback_hls_url: url,
        } as never);
        setLive(true);
        setLiveSource("ingest");
        await notifyGoingLive();
        toast.success("You are live");
      } else {
        const { error } = await supabase.from("cms_channels").update({ is_live: false } as never).eq("id", channelId);
        if (error) { toast.error(error.message); return; }
        await supabase
          .from("live_sessions")
          .update({ status: "ended", ended_at: new Date().toISOString() } as never)
          .eq("channel_id", channelId)
          .eq("status", "live");
        setLive(false);
        setLiveSource(null);
        toast.success("Broadcast ended");
      }
      onChannelUpdated?.();
      load();
    } finally { setBusy(false); }
  }


  return (
    <div className="space-y-6 max-w-4xl">
      {/* Service switch */}
      <div className="flex items-center gap-2">
        {(["tv", "radio"] as Service[]).map((s) => (
          <button
            key={s}
            onClick={() => setService(s)}
            className={`h-9 px-4 rounded-md text-sm font-medium inline-flex items-center gap-2 transition ${
              service === s ? "bg-primary text-primary-foreground" : "bg-elevated border border-border hover:bg-elevated/70"
            }`}
          >
            {s === "tv" ? <Tv className="size-4" /> : <Radio className="size-4" />}
            {s === "tv" ? "TV" : "Radio"}
          </button>
        ))}
        {(liveSession || live) && (
          <span className="ml-auto inline-flex items-center gap-2 text-xs font-semibold text-primary">
            <Circle className="size-2.5 fill-current" /> ON AIR
          </span>
        )}
      </div>

      {/* TV broadcast source — exactly one at a time */}
      {isTv && (
        <section className="rounded-2xl border border-border bg-elevated/40 p-6">
          <h3 className="text-lg font-bold">How does this channel broadcast?</h3>
          <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
            Choose one source. Your TV channel goes live from that source only, and it feeds
            “Live Right Now”, the guide and your channel player everywhere on Lettflix.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {SOURCE_OPTIONS.map((o) => {
              const on = source === o.key;
              return (
                <button
                  key={o.key}
                  onClick={() => chooseSource(o.key)}
                  className={`text-left rounded-xl border p-4 transition ${
                    on ? "border-primary bg-primary/10" : "border-border bg-surface hover:bg-elevated/70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <o.icon className={`size-5 ${on ? "text-primary" : "text-[color:var(--muted-foreground)]"}`} />
                    <span className={`size-5 rounded-md grid place-items-center border ${on ? "bg-primary border-primary" : "border-border"}`}>
                      {on && <Check className="size-3.5 text-primary-foreground" />}
                    </span>
                  </div>
                  <div className="mt-3 text-sm font-semibold">{o.label}</div>
                  <div className="text-xs text-[color:var(--muted-foreground)] mt-1">{o.blurb}</div>
                </button>
              );
            })}
          </div>
          {source === "none" && (
            <p className="mt-4 text-xs text-[color:var(--muted-foreground)]">
              No source selected yet — pick one above to configure your TV broadcast.
            </p>
          )}
        </section>
      )}

      {/* Lettflix Live ingest */}
      {showIngest && (
        <section className="rounded-2xl border border-border bg-elevated/40 p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-lg font-bold">Lettflix Live ingest</h3>
              <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
                Stream from OBS, vMix, a hardware encoder or a mobile app. Lettflix transcodes and
                delivers an adaptive HLS playback URL worldwide.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {input && (
                <>
                  <button onClick={handleRefresh} disabled={busy} className="h-10 px-4 rounded-md border border-border bg-surface text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50">
                    <RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} /> Status
                  </button>
                  <button onClick={handleDelete} disabled={busy} className="h-10 px-4 rounded-md border border-border bg-surface text-sm font-medium inline-flex items-center gap-2 text-primary disabled:opacity-50">
                    <Trash2 className="size-4" /> Remove
                  </button>
                </>
              )}
            </div>
          </div>

          {loading ? (
            <div className="mt-6 flex items-center gap-2 text-sm text-[color:var(--muted-foreground)]">
              <Loader2 className="size-4 animate-spin" /> Loading broadcast setup…
            </div>
          ) : input ? (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2 text-xs">
                <span className="uppercase tracking-wider text-[color:var(--muted-foreground)]">Status</span>
                <span className={`px-2 py-0.5 rounded-full font-semibold ${
                  input.status === "live" ? "bg-primary/20 text-primary" : "bg-surface border border-border text-[color:var(--muted-foreground)]"
                }`}>
                  {input.status === "live" ? "Encoder connected" : "Waiting for encoder"}
                </span>
              </div>
              <Field label="RTMPS server" value={input.rtmps_url} />
              <Field label="Stream key" value={input.rtmps_stream_key} secret />
              <Field label="SRT URL" value={input.srt_url} secret />
              <div className="flex items-end gap-2 flex-wrap">
                <div className="flex-1 min-w-[240px]">
                  <Field label="Playback (HLS)" value={input.playback_hls_url} />
                </div>
                {isTv && source === "ingest" && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => goLiveFromIngest(!live)}
                      disabled={busy || (!live && !encoderConnected)}
                      title={!live && !encoderConnected ? "Connect and start your encoder first" : undefined}
                      className={`h-10 px-5 rounded-md font-semibold text-sm inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        live ? "border border-border bg-elevated" : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {live ? <><Square className="size-3.5" /> Go off air</> : <><Circle className="size-3 fill-current" /> Go live</>}
                    </button>
                    <a
                      href={`/studio/preview?url=${encodeURIComponent(input.playback_hls_url ?? "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`h-10 px-5 rounded-md border border-border bg-surface text-sm font-medium inline-flex items-center gap-2 hover:bg-elevated ${
                        input.playback_hls_url ? "" : "pointer-events-none opacity-50"
                      }`}
                    >
                      <Eye className="size-4" /> Preview
                    </a>
                  </div>
                )}
              </div>
              {isTv && source === "ingest" && !encoderConnected && !live && (
                <p className="text-xs text-[color:var(--muted-foreground)]">
                  Go live unlocks once your encoder connects. Start streaming, then hit Status to refresh.
                </p>
              )}
              <p className="text-xs text-[color:var(--muted-foreground)]">
                Never share your stream key. Recording is {input.recording_enabled ? "on" : "off"} — finished
                broadcasts can be published to your on-demand library.
              </p>
            </div>
          ) : (
            <button
              onClick={handleProvision}
              disabled={busy}
              className="mt-6 h-11 px-6 rounded-md bg-primary text-primary-foreground font-semibold inline-flex items-center gap-2 disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Create ingest endpoint
            </button>
          )}
        </section>
      )}

      {/* External stream */}
      {showExternal && (
        <section className="rounded-2xl border border-border bg-elevated/40 p-6">
          <h3 className="text-lg font-bold">Existing stream source</h3>
          <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
            Already broadcasting elsewhere? Point Lettflix at your HLS (.m3u8) or DASH URL.
          </p>
          <div className="mt-4 flex gap-2 flex-wrap">
            <div className="flex-1 min-w-[260px] flex items-center gap-2 rounded-md border border-border bg-surface px-3">
              <Link2 className="size-4 text-[color:var(--muted-foreground)]" />
              <input
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://example.com/live/stream.m3u8"
                aria-label="Existing stream URL"
                className="flex-1 h-11 bg-transparent text-sm outline-none"
              />
            </div>
            <button onClick={saveExternal} className="h-11 px-5 rounded-md bg-elevated border border-border font-medium text-sm hover:bg-elevated/70">
              Save source
            </button>
          </div>
          {isTv && source === "external" && (
            <button
              onClick={() => setChannelLive(!live)}
              className={`mt-4 h-11 px-6 rounded-md font-semibold text-sm inline-flex items-center gap-2 ${
                live ? "border border-border bg-elevated" : "bg-primary text-primary-foreground"
              }`}
            >
              {live ? <><Square className="size-3.5" /> Go off air</> : <><Circle className="size-3 fill-current" /> Go live</>}
            </button>
          )}
        </section>
      )}

      {/* Automated TV */}
      {showPlayout && (
        <section className="rounded-2xl border border-border bg-elevated/40 p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-lg font-bold">Automated TV</h3>
              <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
                Build playlists and a broadcast schedule — Lettflix plays your channel out
                continuously and joins viewers mid-programme.
              </p>
            </div>
            <button
              onClick={() => setChannelLive(!live)}
              className={`h-11 px-6 rounded-md font-semibold text-sm inline-flex items-center gap-2 ${
                live ? "border border-border bg-elevated" : "bg-primary text-primary-foreground"
              }`}
            >
              {live ? <><Square className="size-3.5" /> Go off air</> : <><Circle className="size-3 fill-current" /> Go live</>}
            </button>
          </div>
          <div className="mt-6">{playoutPanel}</div>
        </section>
      )}

    </div>
  );
}
