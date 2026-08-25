import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Radio, Tv, Copy, Eye, EyeOff, Loader2, RefreshCw, Trash2, Plus, Circle, Square, Link2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  provisionLiveInput, refreshLiveInput, deleteLiveInput,
} from "@/lib/live.functions";
import { notifyFollowersLive } from "@/lib/notify.functions";

type Service = "tv" | "radio";

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
  onChannelUpdated,
}: {
  channelId: string;
  channelStreamUrl?: string | null;
  onChannelUpdated?: () => void;
}) {
  const [service, setService] = useState<Service>("tv");
  const [input, setInput] = useState<LiveInput | null>(null);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [externalUrl, setExternalUrl] = useState(channelStreamUrl ?? "");
  const [newTitle, setNewTitle] = useState("");

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

  const liveSession = useMemo(() => sessions.find((s) => s.status === "live") ?? null, [sessions]);

  async function handleProvision() {
    setBusy(true);
    try {
      const row = await provision({ data: { channelId, service, recording: true } });
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

  async function createSession() {
    const title = newTitle.trim() || "Live broadcast";
    const { error } = await supabase.from("live_sessions").insert({
      channel_id: channelId,
      live_input_id: input?.id ?? null,
      title,
      status: "scheduled",
      playback_hls_url: input?.playback_hls_url ?? (externalUrl || null),
    } as never);
    if (error) { toast.error(error.message); return; }
    setNewTitle("");
    toast.success("Broadcast scheduled");
    load();
  }

  async function setSessionState(id: string, next: "live" | "ended") {
    const patch =
      next === "live"
        ? { status: "live", started_at: new Date().toISOString() }
        : { status: "ended", ended_at: new Date().toISOString() };
    const { error } = await supabase.from("live_sessions").update(patch as never).eq("id", id);
    if (error) { toast.error(error.message); return; }
    await supabase.from("cms_channels").update({ is_live: next === "live" } as never).eq("id", channelId);
    if (next === "live") {
      const session = sessions.find((s) => s.id === id);
      try {
        const res = await notifyLive({
          data: { channelId, title: session?.title ? `Live now: ${session.title}` : "We're live now" },
        });
        if (res.notified) toast.success(`${res.notified} follower${res.notified === 1 ? "" : "s"} notified`);
      } catch {
        /* notifications are best-effort */
      }
    }
    toast.success(next === "live" ? "You are live" : "Broadcast ended");
    onChannelUpdated?.();
    load();
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
        {liveSession && (
          <span className="ml-auto inline-flex items-center gap-2 text-xs font-semibold text-primary">
            <Circle className="size-2.5 fill-current" /> ON AIR
          </span>
        )}
      </div>

      {/* Lettflix Live ingest */}
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
            <Field label="Playback (HLS)" value={input.playback_hls_url} />
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

      {/* External stream */}
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
      </section>

      {/* Broadcasts */}
      <section className="rounded-2xl border border-border bg-elevated/40 p-6">
        <h3 className="text-lg font-bold">Broadcasts</h3>
        <div className="mt-4 flex gap-2 flex-wrap">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Broadcast title"
            aria-label="Broadcast title"
            className="flex-1 min-w-[240px] h-11 rounded-md border border-border bg-surface px-3 text-sm outline-none"
          />
          <button onClick={createSession} className="h-11 px-5 rounded-md bg-primary text-primary-foreground font-semibold text-sm inline-flex items-center gap-2">
            <Plus className="size-4" /> Schedule
          </button>
        </div>

        <div className="mt-5 space-y-2">
          {sessions.length === 0 && (
            <p className="text-sm text-[color:var(--muted-foreground)]">No broadcasts yet.</p>
          )}
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">{s.title}</div>
                <div className="text-xs text-[color:var(--muted-foreground)] capitalize">
                  {s.status}
                  {s.started_at && ` · started ${new Date(s.started_at).toLocaleString()}`}
                </div>
              </div>
              {s.status !== "ended" && s.status !== "cancelled" && (
                s.status === "live" ? (
                  <button onClick={() => setSessionState(s.id, "ended")} className="h-9 px-4 rounded-md border border-border bg-elevated text-sm font-medium inline-flex items-center gap-2">
                    <Square className="size-3.5" /> End
                  </button>
                ) : (
                  <button onClick={() => setSessionState(s.id, "live")} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2">
                    <Circle className="size-3 fill-current" /> Go live
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
